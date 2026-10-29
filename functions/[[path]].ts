import { Hono, Context } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { neon } from '@neondatabase/serverless';
import { parseCloudinaryUrl } from '../shared/services/storage/cloudinary-storage';
import { getEffectiveStatus } from '../shared/utils/effective-status';
import { onboardingInputSchema } from '../shared/schema/member-schema';
import {
  verifyClerkSessionToken,
  fetchClerkUser,
  AUTH_ERROR_MESSAGES,
  type AuthErrorCode,
} from './lib/clerk-auth';

export interface Env {
  // Database
  DATABASE_URL?: string;
  DATABASE_URL_UNPOOLED?: string;

  // Clerk Auth
  CLERK_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  /** Daftar origin sah dipisah koma, mis. "https://kappama.pages.dev,http://localhost:5173". */
  CLERK_AUTHORIZED_PARTIES?: string;

  // Turnstile
  TURNSTILE_SECRET_KEY?: string;

  // Cloudinary
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_URL?: string;

  // Resend Email
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  EMAIL_ENABLED?: string;

  // Bootstrap Admin
  BOOTSTRAP_SUPER_ADMIN_EMAIL?: string;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Helper resolver konfigurasi standar
function resolveConfig(env?: Env) {
  const cloudinaryParsed = parseCloudinaryUrl(env?.CLOUDINARY_URL);

  const cloudName = env?.CLOUDINARY_CLOUD_NAME || cloudinaryParsed.cloudName;
  const cloudinaryApiKey = env?.CLOUDINARY_API_KEY || cloudinaryParsed.apiKey;
  const cloudinaryApiSecret = env?.CLOUDINARY_API_SECRET || cloudinaryParsed.apiSecret;

  const clerkPublishableKey = env?.CLERK_PUBLISHABLE_KEY || env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecretKey = env?.CLERK_SECRET_KEY;
  const turnstileSecretKey = env?.TURNSTILE_SECRET_KEY;

  return {
    databaseUrl: env?.DATABASE_URL_UNPOOLED || env?.DATABASE_URL,
    clerk: {
      isConfigured: Boolean(clerkSecretKey),
      publishableKey: clerkPublishableKey,
      secretKey: clerkSecretKey,
    },
    turnstile: {
      isConfigured: Boolean(turnstileSecretKey),
      secretKey: turnstileSecretKey,
    },
    cloudinary: {
      isConfigured: Boolean(cloudName && cloudinaryApiKey && cloudinaryApiSecret),
      cloudName: cloudName || null,
      usingUrlFormat: Boolean(env?.CLOUDINARY_URL && !env?.CLOUDINARY_CLOUD_NAME),
    },
    email: {
      isEnabled: env?.EMAIL_ENABLED === 'true',
      isConfigured: Boolean(env?.RESEND_API_KEY),
    },
    bootstrapEmail: env?.BOOTSTRAP_SUPER_ADMIN_EMAIL,
  };
}

// Helper verifikasi Turnstile
async function verifyTurnstileToken(
  token: string,
  secretKey?: string,
  ip?: string
): Promise<boolean> {
  // Fail-closed: tanpa secret atau tanpa token, permintaan ditolak.
  // Kunci uji Cloudflare (1x000...AA) tetap diverifikasi lewat siteverify.
  if (!secretKey || !token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const result = (await res.json()) as { success: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

// Helper otorisasi pengguna dari Request Context
interface AuthUser {
  id: string;
  clerkUserId: string;
  email: string;
  role: 'member' | 'content_admin' | 'super_admin';
}

type AuthOutcome =
  | { ok: true; user: AuthUser }
  | { ok: false; code: AuthErrorCode | 'SERVER_MISCONFIGURED'; message: string };

function authFailure(
  c: Context<{ Bindings: Env }>,
  code: AuthErrorCode | 'SERVER_MISCONFIGURED'
): AuthOutcome {
  // Log hanya kode alasan dan path; token, email, dan data pribadi tidak dicatat.
  console.warn(`[auth] code=${code} path=${c.req.path}`);
  return {
    ok: false,
    code,
    message:
      code === 'SERVER_MISCONFIGURED'
        ? 'Konfigurasi login server belum lengkap.'
        : AUTH_ERROR_MESSAGES[code],
  };
}

function authErrorResponse(c: Context<{ Bindings: Env }>, outcome: AuthOutcome) {
  if (outcome.ok) throw new Error('authErrorResponse dipanggil untuk hasil sukses');
  const status = outcome.code === 'SERVER_MISCONFIGURED' ? 500 : 401;
  return c.json({ error: { code: outcome.code, message: outcome.message } }, status);
}

async function getAuth(c: Context<{ Bindings: Env }>): Promise<AuthOutcome> {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl || !config.clerk.secretKey) {
    return authFailure(c, 'SERVER_MISCONFIGURED');
  }

  // Hanya token Clerk yang ditandatangani Clerk yang dipercaya. Header klien
  // (X-Clerk-User-Id / X-User-Email) tidak pernah dipakai.
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return authFailure(c, 'TOKEN_MISSING');

  const verified = await verifyClerkSessionToken(authHeader.slice(7), {
    publishableKey: config.clerk.publishableKey,
    authorizedParties: (c.env.CLERK_AUTHORIZED_PARTIES ?? '')
      .split(',')
      .map((party) => party.trim())
      .filter(Boolean),
  });
  if (!verified.ok) return authFailure(c, verified.code);

  const clerkUserResult = await fetchClerkUser(verified.session.userId, config.clerk.secretKey);
  if (!clerkUserResult.ok) return authFailure(c, clerkUserResult.code);
  const clerkUser = clerkUserResult.user;

  const sql = neon(config.databaseUrl);
  const isBootstrapEmail =
    Boolean(config.bootstrapEmail) &&
    clerkUser.email.toLowerCase() === config.bootstrapEmail!.toLowerCase();

  let userRows = await sql`
    SELECT id, clerk_user_id, email, role
    FROM users
    WHERE clerk_user_id = ${verified.session.userId}
    LIMIT 1
  `;

  if (userRows.length === 0) {
    const role = isBootstrapEmail ? 'super_admin' : 'member';

    userRows = await sql`
      INSERT INTO users (clerk_user_id, email, role)
      VALUES (${verified.session.userId}, ${clerkUser.email}, ${role})
      RETURNING id, clerk_user_id, email, role
    `;

    if (isBootstrapEmail) {
      await sql`
        INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
        VALUES (${userRows[0].id}, 'SUPER_ADMIN_BOOTSTRAPPED', 'users', ${userRows[0].id}, ${JSON.stringify({ source: 'bootstrap_email' })})
      `;
    }
  } else if (isBootstrapEmail && userRows[0].role !== 'super_admin') {
    userRows = await sql`
      UPDATE users
      SET role = 'super_admin', updated_at = NOW()
      WHERE id = ${userRows[0].id}
      RETURNING id, clerk_user_id, email, role
    `;

    await sql`
      INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
      VALUES (${userRows[0].id}, 'SUPER_ADMIN_BOOTSTRAPPED', 'users', ${userRows[0].id}, ${JSON.stringify({ source: 'bootstrap_email' })})
    `;
  }

  return {
    ok: true,
    user: {
      id: userRows[0].id,
      clerkUserId: userRows[0].clerk_user_id,
      email: userRows[0].email,
      role: userRows[0].role,
    },
  };
}

function isAdminRole(role: AuthUser['role'] | null | undefined): boolean {
  return role === 'super_admin' || role === 'content_admin';
}

// ============================================================================
// 1. HEALTH CHECK ENDPOINT
// ============================================================================
app.get('/health', async (c) => {
  const config = resolveConfig(c.env);
  let dbStatus = 'unconfigured';
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  if (config.databaseUrl) {
    try {
      const sql = neon(config.databaseUrl);
      const start = Date.now();
      await sql`SELECT 1 as health_check`;
      dbLatencyMs = Date.now() - start;
      dbStatus = 'ok';
    } catch (err: unknown) {
      dbStatus = 'error';
      dbError = err instanceof Error ? err.message : 'Database query failed';
    }
  }

  return c.json({
    status: 'ok',
    app: 'kappama-backend',
    version: '0.3.1',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      ...(dbError && { error: dbError }),
    },
    services: {
      storage: {
        provider: config.cloudinary.isConfigured ? 'cloudinary' : 'mock_storage',
        cloudNameConfigured: Boolean(config.cloudinary.cloudName),
      },
      auth: {
        clerkConfigured: config.clerk.isConfigured,
      },
      turnstile: {
        configured: config.turnstile.isConfigured,
      },
      email: {
        enabled: config.email.isEnabled,
        resendConfigured: config.email.isConfigured,
      },
    },
  });
});

// ============================================================================
// 2. LOOKUP MASTER DATA ENDPOINTS
// ============================================================================
app.get('/lookups/districts', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: [] });
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT id, name FROM (
        SELECT DISTINCT ON (name) id, name FROM districts ORDER BY name ASC, id ASC
      ) unique_districts
      ORDER BY name ASC
    `;
    return c.json({ data: rows });
  } catch {
    console.error('[lookups] code=LOOKUP_DB_ERROR path=/lookups/districts');
    return c.json({ data: [] });
  }
});

app.get('/lookups/villages', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: [] });
  const districtId = c.req.query('districtId');
  try {
    const sql = neon(config.databaseUrl);
    const rows = districtId
      ? await sql`
          SELECT id, district_id, name FROM (
            SELECT DISTINCT ON (district_id, name) id, district_id, name
            FROM villages
            WHERE district_id = ${districtId}
            ORDER BY district_id ASC, name ASC, id ASC
          ) unique_villages
          ORDER BY name ASC
        `
      : await sql`
          SELECT id, district_id, name FROM (
            SELECT DISTINCT ON (district_id, name) id, district_id, name
            FROM villages
            ORDER BY district_id ASC, name ASC, id ASC
          ) unique_villages
          ORDER BY name ASC
        `;
    return c.json({ data: rows });
  } catch {
    console.error('[lookups] code=LOOKUP_DB_ERROR path=/lookups/villages');
    return c.json({ data: [] });
  }
});

app.get('/lookups/universities', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: [] });
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT id, name, abbreviation, city FROM (
        SELECT DISTINCT ON (name) id, name, abbreviation, city
        FROM universities
        WHERE is_active = true
        ORDER BY name ASC, created_at ASC, id ASC
      ) unique_universities
      ORDER BY CASE WHEN abbreviation = 'Lainnya' THEN 2 ELSE 1 END, name ASC
    `;
    return c.json({ data: rows });
  } catch {
    console.error('[lookups] code=LOOKUP_DB_ERROR path=/lookups/universities');
    return c.json({ data: [] });
  }
});

app.get('/lookups/study-programs', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: [] });
  const universityId = c.req.query('universityId');
  try {
    const sql = neon(config.databaseUrl);
    const rows = universityId
      ? await sql`
          SELECT id, university_id, name, degree_level FROM (
            SELECT DISTINCT ON (university_id, name, degree_level) id, university_id, name, degree_level
            FROM study_programs
            WHERE university_id = ${universityId} AND is_active = true
            ORDER BY university_id ASC, name ASC, degree_level ASC, created_at ASC, id ASC
          ) unique_study_programs
          ORDER BY CASE WHEN name = 'Lainnya' THEN 2 ELSE 1 END, name ASC
        `
      : await sql`
          SELECT id, university_id, name, degree_level FROM (
            SELECT DISTINCT ON (university_id, name, degree_level) id, university_id, name, degree_level
            FROM study_programs
            WHERE is_active = true
            ORDER BY university_id ASC, name ASC, degree_level ASC, created_at ASC, id ASC
          ) unique_study_programs
          ORDER BY CASE WHEN name = 'Lainnya' THEN 2 ELSE 1 END, name ASC
        `;
    return c.json({ data: rows });
  } catch {
    console.error('[lookups] code=LOOKUP_DB_ERROR path=/lookups/study-programs');
    return c.json({ data: [] });
  }
});

app.get('/lookups/industries', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: [] });
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT id, name FROM (
        SELECT DISTINCT ON (name) id, name
        FROM industries
        WHERE is_active = true
        ORDER BY name ASC, created_at ASC, id ASC
      ) unique_industries
      ORDER BY CASE WHEN name = 'Lainnya' THEN 2 ELSE 1 END, name ASC
    `;
    return c.json({ data: rows });
  } catch {
    console.error('[lookups] code=LOOKUP_DB_ERROR path=/lookups/industries');
    return c.json({ data: [] });
  }
});

// ============================================================================
// 3. AUTH & PROFIL SAYA (ME) ENDPOINTS
// ============================================================================
app.get('/me', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  const authUser = auth.user;

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  // Ambil profil
  const profiles = await sql`
    SELECT *
    FROM member_profiles
    WHERE user_id = ${authUser.id} AND deleted_at IS NULL
    LIMIT 1
  `;

  if (profiles.length === 0) {
    return c.json({
      data: {
        user: authUser,
        profile: null,
        status: 'incomplete',
      },
    });
  }

  const profile = profiles[0];

  // Jalankan logika Lazy Auto-Approve 24 jam
  const effective = getEffectiveStatus({
    status: profile.status,
    submittedAt: profile.submitted_at,
  });

  if (effective.isAutoPromoted && profile.status === 'pending') {
    await sql`
      UPDATE member_profiles
      SET status = 'active', approved_at = NOW(), approval_type = 'auto', updated_at = NOW()
      WHERE id = ${profile.id}
    `;
    profile.status = 'active';
    profile.approval_type = 'auto';
  }

  // Ambil detail alumni jika bertipe alumni
  let alumni = null;
  if (profile.member_type === 'alumni') {
    const alumniRows = await sql`
      SELECT * FROM alumni_details WHERE member_id = ${profile.id} LIMIT 1
    `;
    if (alumniRows.length > 0) alumni = alumniRows[0];
  }

  return c.json({
    data: {
      user: authUser,
      profile: {
        ...profile,
        effectiveStatus: effective.status,
        timeRemainingMs: effective.timeRemainingMs,
      },
      alumni,
      status: effective.status,
    },
  });
});

app.get('/me/status', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  const authUser = auth.user;

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const profiles = await sql`
    SELECT id, status, submitted_at, approved_at, approval_type, rejection_reason
    FROM member_profiles
    WHERE user_id = ${authUser.id} AND deleted_at IS NULL
    LIMIT 1
  `;

  if (profiles.length === 0) {
    return c.json({
      data: {
        status: 'incomplete',
        message: 'Profil belum dilengkapi. Silakan isi formulir onboarding.',
      },
    });
  }

  const p = profiles[0];
  const effective = getEffectiveStatus({
    status: p.status,
    submittedAt: p.submitted_at,
  });

  if (effective.isAutoPromoted && p.status === 'pending') {
    await sql`
      UPDATE member_profiles
      SET status = 'active', approved_at = NOW(), approval_type = 'auto', updated_at = NOW()
      WHERE id = ${p.id}
    `;
  }

  return c.json({
    data: {
      status: effective.status,
      submittedAt: p.submitted_at,
      timeRemainingMs: effective.timeRemainingMs,
      rejectionReason: p.rejection_reason,
      approvalType: p.approval_type,
    },
  });
});

app.post('/me/onboarding', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  const authUser = auth.user;

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Payload tidak valid' } }, 400);
  }

  const parsed = onboardingInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validasi formulir gagal',
        details: parsed.error.format(),
      },
    }, 422);
  }

  const input = parsed.data;
  const config = resolveConfig(c.env);

  // Verifikasi Turnstile
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for');
  const isTurnstileValid = await verifyTurnstileToken(input.turnstileToken, config.turnstile.secretKey, ip);
  if (!isTurnstileValid) {
    return c.json({
      error: { code: 'BOT_VERIFICATION_FAILED', message: 'Verifikasi bot Turnstile gagal. Silakan coba lagi.' },
    }, 400);
  }

  const sql = neon(config.databaseUrl!);

  // Cek apakah username sudah dipakai orang lain
  const existingUsername = await sql`
    SELECT id, user_id FROM member_profiles WHERE username = ${input.username} AND user_id != ${authUser.id} LIMIT 1
  `;
  if (existingUsername.length > 0) {
    return c.json({
      error: { code: 'USERNAME_TAKEN', message: 'Username sudah digunakan oleh anggota lain' },
    }, 409);
  }

  // Simpan atau update profile
  const profileRows = await sql`
    INSERT INTO member_profiles (
      user_id, full_name, username, whatsapp, instagram, linkedin,
      member_type, cohort_year, university_id, university_other,
      study_program_id, study_program_other, district_id, village_id,
      address_detail, hide_contact, status, submitted_at,
      consent_at, consent_version, rejection_reason
    ) VALUES (
      ${authUser.id}, ${input.fullName}, ${input.username}, ${input.whatsapp},
      ${input.instagram || null}, ${input.linkedin || null},
      ${input.memberType}, ${input.cohortYear}, ${input.universityId}, ${input.universityOther || null},
      ${input.studyProgramId}, ${input.studyProgramOther || null}, ${input.districtId}, ${input.villageId},
      ${input.addressDetail}, ${input.hideContact}, 'pending', NOW(),
      NOW(), ${input.consentVersion}, NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      username = EXCLUDED.username,
      whatsapp = EXCLUDED.whatsapp,
      instagram = EXCLUDED.instagram,
      linkedin = EXCLUDED.linkedin,
      member_type = EXCLUDED.member_type,
      cohort_year = EXCLUDED.cohort_year,
      university_id = EXCLUDED.university_id,
      university_other = EXCLUDED.university_other,
      study_program_id = EXCLUDED.study_program_id,
      study_program_other = EXCLUDED.study_program_other,
      district_id = EXCLUDED.district_id,
      village_id = EXCLUDED.village_id,
      address_detail = EXCLUDED.address_detail,
      hide_contact = EXCLUDED.hide_contact,
      status = 'pending',
      submitted_at = NOW(),
      rejection_reason = NULL,
      updated_at = NOW()
    RETURNING id
  `;

  const memberId = profileRows[0].id;

  // Jika alumni, simpan ke alumni_details
  if (input.memberType === 'alumni' && input.graduationYear && input.currentStatus) {
    await sql`
      INSERT INTO alumni_details (
        member_id, graduation_year, current_status, job_title, organization, industry_id, work_city
      ) VALUES (
        ${memberId}, ${input.graduationYear}, ${input.currentStatus},
        ${input.jobTitle || null}, ${input.organization || null}, ${input.industryId || null}, ${input.workCity || null}
      )
      ON CONFLICT (member_id) DO UPDATE SET
        graduation_year = EXCLUDED.graduation_year,
        current_status = EXCLUDED.current_status,
        job_title = EXCLUDED.job_title,
        organization = EXCLUDED.organization,
        industry_id = EXCLUDED.industry_id,
        work_city = EXCLUDED.work_city,
        updated_at = NOW()
    `;
  }

  // Audit log
  await sql`
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata, ip_hash)
    VALUES (${authUser.id}, 'ONBOARDING_SUBMITTED', 'member_profiles', ${memberId}, ${JSON.stringify({ type: input.memberType, cohort: input.cohortYear })}, NULL)
  `;

  return c.json({
    data: {
      message: 'Onboarding berhasil dikirim. Status saat ini menunggu persetujuan (maksimal 24 jam).',
      memberId,
      status: 'pending',
    },
  }, 201);
});

// Update Profil Mandiri (Khusus Anggota Aktif)
app.put('/me/profile', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  const authUser = auth.user;

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const profiles = await sql`
    SELECT id, status, member_type FROM member_profiles WHERE user_id = ${authUser.id} AND deleted_at IS NULL LIMIT 1
  `;
  if (profiles.length === 0 || profiles[0].status !== 'active') {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Hanya anggota berstatus aktif yang dapat mengubah profil' } }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const profileId = profiles[0].id;

  // Update profil dasar
  await sql`
    UPDATE member_profiles
    SET
      whatsapp = COALESCE(${body.whatsapp || null}, whatsapp),
      instagram = ${body.instagram || null},
      linkedin = ${body.linkedin || null},
      hide_contact = COALESCE(${body.hideContact ?? null}, hide_contact),
      member_type = COALESCE(${body.memberType || null}, member_type),
      updated_at = NOW()
    WHERE id = ${profileId}
  `;

  // Jika transisi ke alumni
  if (body.memberType === 'alumni' && body.graduationYear) {
    await sql`
      INSERT INTO alumni_details (
        member_id, graduation_year, current_status, job_title, organization, industry_id, work_city
      ) VALUES (
        ${profileId}, ${body.graduationYear}, ${body.currentStatus || 'working'},
        ${body.jobTitle || null}, ${body.organization || null}, ${body.industryId || null}, ${body.workCity || null}
      )
      ON CONFLICT (member_id) DO UPDATE SET
        graduation_year = EXCLUDED.graduation_year,
        current_status = EXCLUDED.current_status,
        job_title = EXCLUDED.job_title,
        organization = EXCLUDED.organization,
        industry_id = EXCLUDED.industry_id,
        work_city = EXCLUDED.work_city,
        updated_at = NOW()
    `;
  }

  return c.json({ data: { message: 'Profil berhasil diperbarui' } });
});

// ============================================================================
// 4. DIREKTORI ANGGOTA & ALUMNI ENDPOINTS (UU PDP COMPLIANT)
// ============================================================================
app.get('/members', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  const authUser = auth.user;

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  // Cek apakah user aktif atau admin
  const userProfile = await sql`
    SELECT status, submitted_at FROM member_profiles WHERE user_id = ${authUser.id} AND deleted_at IS NULL LIMIT 1
  `;

  const isAdmin = authUser.role === 'super_admin' || authUser.role === 'content_admin';
  const effective = userProfile.length > 0 ? getEffectiveStatus({ status: userProfile[0].status, submittedAt: userProfile[0].submitted_at }) : null;

  if (!isAdmin && (!effective || effective.status !== 'active')) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'Direktori anggota hanya dapat diakses oleh anggota terverifikasi (status aktif).',
      },
    }, 403);
  }

  // Filter params
  const search = c.req.query('search')?.trim() || '';
  const type = c.req.query('type') || 'all'; // all | active | alumni
  const cohort = c.req.query('cohort') ? parseInt(c.req.query('cohort')!) : null;
  const universityId = c.req.query('universityId') || null;
  const districtId = c.req.query('districtId') || null;
  const studyProgramId = c.req.query('studyProgramId') || null;
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const offset = (page - 1) * limit;

  // Jalankan query dengan filter
  const rows = await sql`
    SELECT
      COUNT(*) OVER() AS total_count,
      m.id,
      m.full_name,
      m.username,
      m.member_type,
      m.cohort_year,
      m.hide_contact,
      m.whatsapp,
      u.email,
      m.instagram,
      m.linkedin,
      m.photo_key,
      m.status,
      univ.name as university_name,
      univ.abbreviation as university_abbr,
      m.university_other,
      sp.name as study_program_name,
      m.study_program_other,
      dist.name as district_name,
      vil.name as village_name,
      al.graduation_year,
      al.current_status,
      al.job_title,
      al.organization,
      ind.name as industry_name,
      al.work_city
    FROM member_profiles m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN universities univ ON m.university_id = univ.id
    LEFT JOIN study_programs sp ON m.study_program_id = sp.id
    LEFT JOIN districts dist ON m.district_id = dist.id
    LEFT JOIN villages vil ON m.village_id = vil.id
    LEFT JOIN alumni_details al ON m.id = al.member_id
    LEFT JOIN industries ind ON al.industry_id = ind.id
    WHERE m.status = 'active'
      AND m.deleted_at IS NULL
      ${type !== 'all' ? sql`AND m.member_type = ${type}` : sql``}
      ${cohort ? sql`AND m.cohort_year = ${cohort}` : sql``}
      ${universityId ? sql`AND m.university_id = ${universityId}` : sql``}
      ${districtId ? sql`AND m.district_id = ${districtId}` : sql``}
      ${studyProgramId ? sql`AND m.study_program_id = ${studyProgramId}` : sql``}
      ${search ? sql`AND (m.full_name ILIKE ${'%' + search + '%'} OR m.username ILIKE ${'%' + search + '%'})` : sql``}
    ORDER BY m.cohort_year DESC, m.full_name ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Sanitasi UU PDP:
  // 1. address_detail sama sekali TIDAK disertakan dalam SELECT query!
  // 2. WhatsApp & Email disembunyikan bila hide_contact = true (kecuali admin)
  const sanitized = rows.map((r: Record<string, unknown>) => {
    const isProtected = Boolean(r.hide_contact) && !isAdmin;
    return {
      id: r.id,
      fullName: r.full_name,
      username: r.username,
      memberType: r.member_type,
      cohortYear: r.cohort_year,
      universityName: r.university_name || r.university_other,
      universityAbbr: r.university_abbr,
      studyProgramName: r.study_program_name || r.study_program_other,
      districtName: r.district_name,
      villageName: r.village_name,
      photoKey: r.photo_key,
      instagram: r.instagram,
      linkedin: r.linkedin,
      whatsapp: isProtected ? null : r.whatsapp,
      email: isProtected ? null : r.email,
      hideContact: r.hide_contact,
      alumni: r.member_type === 'alumni' ? {
        graduationYear: r.graduation_year,
        currentStatus: r.current_status,
        jobTitle: r.job_title,
        organization: r.organization,
        industryName: r.industry_name,
        workCity: r.work_city,
      } : null,
    };
  });

  return c.json({
    data: sanitized,
    meta: {
      page,
      limit,
      count: sanitized.length,
      total: Number(rows[0]?.total_count ?? sanitized.length),
    },
  });
});

app.get('/members/:username', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  const authUser = auth.user;

  const username = c.req.param('username');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const isAdmin = isAdminRole(authUser.role);
  if (!isAdmin) {
    const viewerRows = await sql`
      SELECT status, submitted_at FROM member_profiles
      WHERE user_id = ${authUser.id} AND deleted_at IS NULL LIMIT 1
    `;
    const viewerEffective =
      viewerRows.length > 0
        ? getEffectiveStatus({
            status: viewerRows[0].status,
            submittedAt: viewerRows[0].submitted_at,
          })
        : null;
    if (!viewerEffective || viewerEffective.status !== 'active') {
      return c.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Detail anggota hanya dapat diakses oleh anggota terverifikasi (status aktif).',
          },
        },
        403
      );
    }
  }

  const rows = await sql`
    SELECT
      m.id,
      m.user_id,
      m.full_name,
      m.username,
      m.member_type,
      m.cohort_year,
      m.hide_contact,
      m.whatsapp,
      u.email,
      m.instagram,
      m.linkedin,
      m.address_detail,
      m.photo_key,
      m.status,
      univ.name as university_name,
      univ.abbreviation as university_abbr,
      m.university_other,
      sp.name as study_program_name,
      m.study_program_other,
      dist.name as district_name,
      vil.name as village_name,
      al.graduation_year,
      al.current_status,
      al.job_title,
      al.organization,
      ind.name as industry_name,
      al.work_city
    FROM member_profiles m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN universities univ ON m.university_id = univ.id
    LEFT JOIN study_programs sp ON m.study_program_id = sp.id
    LEFT JOIN districts dist ON m.district_id = dist.id
    LEFT JOIN villages vil ON m.village_id = vil.id
    LEFT JOIN alumni_details al ON m.id = al.member_id
    LEFT JOIN industries ind ON al.industry_id = ind.id
    WHERE m.username = ${username} AND m.status = 'active' AND m.deleted_at IS NULL
    LIMIT 1
  `;

  if (rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Profil anggota tidak ditemukan' } }, 404);
  }

  const r = rows[0];
  const isOwner = r.user_id === authUser.id;

  // UU PDP: address_detail hanya untuk pemilik & admin
  const addressDetail = (isOwner || isAdmin) ? r.address_detail : null;
  const isProtectedContact = r.hide_contact && !isOwner && !isAdmin;

  // Setiap akses admin ke detail alamat dicatat tanpa menyimpan isinya.
  if (isAdmin && !isOwner && r.address_detail) {
    await sql`
      INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
      VALUES (${authUser.id}, 'ADMIN_VIEWED_ADDRESS_DETAIL', 'member_profiles', ${r.id}, ${JSON.stringify({ field: 'address_detail' })})
    `;
  }

  return c.json({
    data: {
      id: r.id,
      fullName: r.full_name,
      username: r.username,
      memberType: r.member_type,
      cohortYear: r.cohort_year,
      universityName: r.university_name || r.university_other,
      universityAbbr: r.university_abbr,
      studyProgramName: r.study_program_name || r.study_program_other,
      districtName: r.district_name,
      villageName: r.village_name,
      addressDetail,
      photoKey: r.photo_key,
      instagram: r.instagram,
      linkedin: r.linkedin,
      whatsapp: isProtectedContact ? null : r.whatsapp,
      email: isProtectedContact ? null : r.email,
      hideContact: r.hide_contact,
      alumni: r.member_type === 'alumni' ? {
        graduationYear: r.graduation_year,
        currentStatus: r.current_status,
        jobTitle: r.job_title,
        organization: r.organization,
        industryName: r.industry_name,
        workCity: r.work_city,
      } : null,
    },
  });
});

// ============================================================================
// 5. ADMIN APPROVALS ENDPOINTS (Lazy Auto-Approve & Manual Approval)
// ============================================================================
app.get('/admin/approvals', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  if (!isAdminRole(auth.user.role)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Akses ditolak' } }, 403);
  }
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  // Periksa anggota pending
  const pendingRows = await sql`
    SELECT
      m.id,
      m.full_name,
      m.username,
      m.whatsapp,
      u.email,
      m.cohort_year,
      m.member_type,
      m.submitted_at,
      m.status,
      univ.name as university_name,
      sp.name as study_program_name,
      dist.name as district_name,
      vil.name as village_name
    FROM member_profiles m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN universities univ ON m.university_id = univ.id
    LEFT JOIN study_programs sp ON m.study_program_id = sp.id
    LEFT JOIN districts dist ON m.district_id = dist.id
    LEFT JOIN villages vil ON m.village_id = vil.id
    WHERE m.status = 'pending' AND m.deleted_at IS NULL
    ORDER BY m.submitted_at ASC
  `;

  // Evaluasi lazy status & hitung sisa waktu 24 jam
  const evaluated = [];
  for (const r of pendingRows) {
    const eff = getEffectiveStatus({ status: r.status, submittedAt: r.submitted_at });
    if (eff.isAutoPromoted) {
      await sql`
        UPDATE member_profiles
        SET status = 'active', approved_at = NOW(), approval_type = 'auto', updated_at = NOW()
        WHERE id = ${r.id}
      `;
    } else {
      evaluated.push({
        ...r,
        timeRemainingMs: eff.timeRemainingMs,
      });
    }
  }

  return c.json({ data: evaluated });
});

app.post('/admin/approvals/:id/approve', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  if (!isAdminRole(auth.user.role)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Akses ditolak' } }, 403);
  }
  const authUser = auth.user;

  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const result = await sql`
    UPDATE member_profiles
    SET status = 'active', approved_by = ${authUser.id}, approved_at = NOW(), approval_type = 'manual', updated_at = NOW()
    WHERE id = ${id} AND status = 'pending'
    RETURNING id
  `;

  if (result.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Data pendaftar tidak ditemukan atau sudah disetujui' } }, 404);
  }

  await sql`
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (${authUser.id}, 'MEMBER_APPROVED', 'member_profiles', ${id}, ${JSON.stringify({ type: 'manual' })})
  `;

  return c.json({ data: { message: 'Pendaftar berhasil disetujui' } });
});

app.post('/admin/approvals/:id/reject', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  if (!isAdminRole(auth.user.role)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Akses ditolak' } }, 403);
  }
  const authUser = auth.user;

  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const reason = body.reason?.trim();

  if (!reason) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Alasan penolakan wajib diisi' } }, 422);
  }

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const result = await sql`
    UPDATE member_profiles
    SET status = 'rejected', rejection_reason = ${reason}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id
  `;

  if (result.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Data pendaftar tidak ditemukan' } }, 404);
  }

  await sql`
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (${authUser.id}, 'MEMBER_REJECTED', 'member_profiles', ${id}, ${JSON.stringify({ reasonProvided: true })})
  `;

  return c.json({ data: { message: 'Pendaftar berhasil ditolak' } });
});

// Tangguhkan anggota (Admin Konten / Super Admin)
app.post('/admin/members/:id/suspend', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  if (!isAdminRole(auth.user.role)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Akses ditolak' } }, 403);
  }
  const authUser = auth.user;

  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const result = await sql`
    UPDATE member_profiles
    SET status = 'suspended', updated_at = NOW()
    WHERE id = ${id} AND status IN ('active', 'pending')
    RETURNING id, status
  `;

  if (result.length === 0) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Anggota tidak ditemukan atau sudah ditangguhkan' } },
      404
    );
  }

  await sql`
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (${authUser.id}, 'MEMBER_SUSPENDED', 'member_profiles', ${id}, ${JSON.stringify({ to: 'suspended' })})
  `;

  return c.json({ data: { message: 'Anggota berhasil ditangguhkan' } });
});

// Pulihkan anggota yang ditangguhkan (Admin Konten / Super Admin)
app.post('/admin/members/:id/restore', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  if (!isAdminRole(auth.user.role)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Akses ditolak' } }, 403);
  }
  const authUser = auth.user;

  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const result = await sql`
    UPDATE member_profiles
    SET status = 'active', approved_by = ${authUser.id}, approved_at = NOW(), approval_type = 'manual', updated_at = NOW()
    WHERE id = ${id} AND status = 'suspended'
    RETURNING id, status
  `;

  if (result.length === 0) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Anggota tidak ditemukan atau tidak sedang ditangguhkan' } },
      404
    );
  }

  await sql`
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (${authUser.id}, 'MEMBER_RESTORED', 'member_profiles', ${id}, ${JSON.stringify({ to: 'active' })})
  `;

  return c.json({ data: { message: 'Anggota berhasil dipulihkan' } });
});

// Kelola peran pengguna (khusus Super Admin)
app.put('/admin/users/:id/role', async (c) => {
  const auth = await getAuth(c);
  if (!auth.ok) return authErrorResponse(c, auth);
  if (auth.user.role !== 'super_admin') {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Hanya Super Admin yang dapat mengubah peran' } }, 403);
  }
  const authUser = auth.user;

  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const role = body.role;
  if (role !== 'member' && role !== 'content_admin' && role !== 'super_admin') {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Peran tidak valid' } }, 422);
  }

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const targetRows = await sql`
    SELECT id, role FROM users WHERE id = ${id} LIMIT 1
  `;
  if (targetRows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan' } }, 404);
  }

  const previousRole = targetRows[0].role;
  if (previousRole === role) {
    return c.json({ data: { message: 'Peran tidak berubah' } });
  }

  // Cegah pencabutan Super Admin terakhir.
  if (previousRole === 'super_admin' && role !== 'super_admin') {
    const countRows = await sql`
      SELECT COUNT(*)::int AS count FROM users WHERE role = 'super_admin'
    `;
    if (Number(countRows[0]?.count ?? 0) <= 1) {
      return c.json(
        {
          error: {
            code: 'LAST_SUPER_ADMIN',
            message: 'Super Admin terakhir tidak boleh dicabut. Angkat Super Admin lain terlebih dahulu.',
          },
        },
        409
      );
    }
  }

  await sql`
    UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${id}
  `;

  await sql`
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (${authUser.id}, 'USER_ROLE_CHANGED', 'users', ${id}, ${JSON.stringify({ from: previousRole, to: role })})
  `;

  return c.json({ data: { message: 'Peran berhasil diperbarui' } });
});

// Fallback untuk route API yang belum diimplementasikan
app.all('*', (c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${c.req.method} ${c.req.path} tidak ditemukan.`,
      },
    },
    404
  );
});

export const onRequest = handle(app);

// Diekspor untuk pengujian integrasi tanpa Cloudflare runtime.
export { app };
