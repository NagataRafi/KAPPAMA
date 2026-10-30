import { Hono, Context } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { parseCloudinaryUrl } from '../shared/services/storage/cloudinary-storage';
import { createStorageService } from '../shared/services/storage';
import { getEffectiveStatus } from '../shared/utils/effective-status';
import { extractYouTubeId } from '../shared/utils/youtube';
import { onboardingInputSchema } from '../shared/schema/member-schema';
import {
  orgProfileInputSchema,
  periodInputSchema,
  leaderInputSchema,
  bylawsInputSchema,
  programInputSchema,
  albumInputSchema,
  mediaInputSchema,
  mediaUpdateSchema,
  statusInputSchema,
  signatureRequestSchema,
} from '../shared/schema/content-schema';
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
      apiKey: cloudinaryApiKey || null,
      apiSecret: cloudinaryApiSecret || null,
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
      // Pastikan profil anggota Super Admin aktif segera (bukan pending)
      await sql`
        INSERT INTO member_profiles (user_id, status, submitted_at, approved_at, approval_type, consent_at, consent_version)
        VALUES (${userRows[0].id}, 'active', NOW(), NOW(), 'manual', NOW(), '2026.1')
      `;

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

    // Pastikan profil anggota Super Admin aktif
    const existingProfile = await sql`
      SELECT id FROM member_profiles WHERE user_id = ${userRows[0].id} LIMIT 1
    `;
    if (existingProfile.length > 0) {
      await sql`
        UPDATE member_profiles
        SET status = 'active', approved_at = NOW(), approval_type = 'manual', updated_at = NOW()
        WHERE id = ${existingProfile[0].id}
      `;
    } else {
      await sql`
        INSERT INTO member_profiles (user_id, status, submitted_at, approved_at, approval_type, consent_at, consent_version)
        VALUES (${userRows[0].id}, 'active', NOW(), NOW(), 'manual', NOW(), '2026.1')
      `;
    }

    await sql`
      INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
      VALUES (${userRows[0].id}, 'SUPER_ADMIN_BOOTSTRAPPED', 'users', ${userRows[0].id}, ${JSON.stringify({ source: 'bootstrap_email' })})
    `;
  } else if (isBootstrapEmail) {
    // Idempoten: akun bootstrap lama yang sudah super_admin tapi profil masih pending
    const existingProfile = await sql`
      SELECT id FROM member_profiles WHERE user_id = ${userRows[0].id} LIMIT 1
    `;
    if (existingProfile.length > 0) {
      await sql`
        UPDATE member_profiles
        SET status = 'active', approved_at = NOW(), approval_type = 'manual', updated_at = NOW()
        WHERE id = ${existingProfile[0].id}
      `;
    } else {
      await sql`
        INSERT INTO member_profiles (user_id, status, submitted_at, approved_at, approval_type, consent_at, consent_version)
        VALUES (${userRows[0].id}, 'active', NOW(), NOW(), 'manual', NOW(), '2026.1')
      `;
    }
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
// Helper bersama modul konten (Fase 4A)
// ============================================================================
type AdminGate = { user: AuthUser } | { response: Response };

/** Deny by default: tanpa sesi 401, bukan Admin Konten/Super Admin 403. */
async function contentAdminGate(c: Context<{ Bindings: Env }>): Promise<AdminGate> {
  const auth = await getAuth(c);
  if (!auth.ok) return { response: authErrorResponse(c, auth) };
  if (!isAdminRole(auth.user.role)) {
    return {
      response: c.json({ error: { code: 'FORBIDDEN', message: 'Akses ditolak' } }, 403),
    };
  }
  return { user: auth.user };
}

function validationError(c: Context<{ Bindings: Env }>, message: string, details?: unknown) {
  return c.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    422
  );
}

function storageFor(c: Context<{ Bindings: Env }>) {
  const config = resolveConfig(c.env);
  return createStorageService({
    cloudName: config.cloudinary.cloudName ?? undefined,
    apiKey: config.cloudinary.apiKey ?? undefined,
    apiSecret: config.cloudinary.apiSecret ?? undefined,
  });
}

function assetUrl(c: Context<{ Bindings: Env }>, key: string | null, width?: number): string | null {
  if (!key) return null;
  if (/^(https?:)?\/\//.test(key) || key.startsWith('/')) return key;
  return storageFor(c).buildImageUrl(key, width ? { width } : undefined);
}

/** Hapus aset Cloudinary; kunci eksternal/statis dilewati. Galat tidak menggagalkan request. */
async function deleteStoredAsset(c: Context<{ Bindings: Env }>, key: string | null) {
  if (!key || /^(https?:)?\/\//.test(key) || key.startsWith('/')) return;
  const storage = storageFor(c);
  try {
    const removed = await storage.deleteImage(key);
    if (!removed) await storage.deleteImage(key, 'raw');
  } catch {
    console.warn('[content] code=ASSET_DELETE_FAILED');
  }
}

async function writeAudit(
  sql: NeonQueryFunction<false, false>,
  actorId: string,
  action: string,
  entity: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  await sql`
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (${actorId}, ${action}, ${entity}, ${entityId}, ${JSON.stringify(metadata)})
  `;
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
    version: '0.5.0',
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

// ============================================================================
// 6. KONTEN PUBLIK (hanya data terbit; draft tidak pernah keluar dari server)
// ============================================================================
function publicProgram(c: Context<{ Bindings: Env }>, r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    year: r.year,
    eventDate: r.event_date,
    location: r.location,
    summary: r.summary,
    description: r.description,
    objectives: r.objectives,
    targets: r.targets,
    picName: r.pic_name,
    coverUrl: assetUrl(c, (r.cover_key as string) ?? null, 1200),
    universityName: r.university_name ?? null,
    universityAbbr: r.university_abbr ?? null,
  };
}

function publicAlbum(c: Context<{ Bindings: Env }>, r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    year: r.year,
    eventDate: r.event_date,
    description: r.description,
    coverUrl: assetUrl(c, (r.cover_key as string) ?? null, 1200),
    photoCount: Number(r.photo_count ?? 0),
    videoCount: Number(r.video_count ?? 0),
  };
}

function publicMedia(c: Context<{ Bindings: Env }>, r: Record<string, unknown>) {
  return r.media_type === 'youtube'
    ? {
        id: r.id,
        mediaType: 'youtube' as const,
        youtubeId: r.youtube_id,
        caption: r.caption,
        sortOrder: r.sort_order,
      }
    : {
        id: r.id,
        mediaType: 'image' as const,
        url: assetUrl(c, (r.file_key as string) ?? null, 1600),
        caption: r.caption,
        sortOrder: r.sort_order,
      };
}

app.get('/public/org', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: null });
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT about_text, vision_text, missions, contact_email, contact_instagram, contact_address, logo_key
      FROM org_profile
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    if (rows.length === 0) return c.json({ data: null });
    const r = rows[0];
    return c.json({
      data: {
        aboutText: r.about_text,
        visionText: r.vision_text,
        missions: Array.isArray(r.missions) ? r.missions : [],
        contactEmail: r.contact_email,
        contactInstagram: r.contact_instagram,
        contactAddress: r.contact_address,
        logoUrl: assetUrl(c, r.logo_key ?? null, 256),
      },
    });
  } catch {
    console.error('[content] code=PUBLIC_ORG_FAILED path=/public/org');
    return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat profil organisasi' } }, 500);
  }
});

app.get('/public/leaders', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: { periods: [], period: null, leaders: [] } });
  try {
    const sql = neon(config.databaseUrl);
    const periods = await sql`
      SELECT id, period_label, start_year, end_year, is_current
      FROM org_periods
      ORDER BY start_year DESC, created_at DESC
    `;
    if (periods.length === 0) return c.json({ data: { periods: [], period: null, leaders: [] } });

    const requested = c.req.query('period');
    const selected =
      periods.find((p: Record<string, unknown>) => p.id === requested) ??
      periods.find((p: Record<string, unknown>) => p.is_current) ??
      periods[0];

    const leaders = await sql`
      SELECT id, position, name, photo_key, campus_study, sort_order
      FROM org_leaders
      WHERE period_id = ${selected.id}
      ORDER BY sort_order ASC, created_at ASC
    `;

    return c.json({
      data: {
        periods: periods.map((p: Record<string, unknown>) => ({
          id: p.id,
          periodLabel: p.period_label,
          startYear: p.start_year,
          endYear: p.end_year,
          isCurrent: p.is_current,
        })),
        period: {
          id: selected.id,
          periodLabel: selected.period_label,
          startYear: selected.start_year,
          endYear: selected.end_year,
          isCurrent: selected.is_current,
        },
        leaders: leaders.map((l: Record<string, unknown>) => ({
          id: l.id,
          position: l.position,
          name: l.name,
          photoUrl: assetUrl(c, (l.photo_key as string) ?? null, 400),
          campusStudy: l.campus_study,
          sortOrder: l.sort_order,
        })),
      },
    });
  } catch {
    console.error('[content] code=PUBLIC_LEADERS_FAILED path=/public/leaders');
    return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat struktur organisasi' } }, 500);
  }
});

app.get('/public/bylaws', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: { current: null, history: [] } });
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT id, title, file_key, effective_date, is_active
      FROM bylaws_documents
      ORDER BY is_active DESC, effective_date DESC, created_at DESC
    `;
    const shaped = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      fileUrl: assetUrl(c, (r.file_key as string) ?? null),
      effectiveDate: r.effective_date,
      isActive: r.is_active,
    }));
    return c.json({
      data: {
        current: shaped.find((r) => r.isActive) ?? shaped[0] ?? null,
        history: shaped,
      },
    });
  } catch {
    console.error('[content] code=PUBLIC_BYLAWS_FAILED path=/public/bylaws');
    return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat AD/ART' } }, 500);
  }
});

app.get('/public/programs', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: [] });
  const year = parseInt(c.req.query('year') || '') || null;
  const search = c.req.query('search')?.trim() || '';
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT
        p.id, p.title, p.slug, p.year, p.event_date, p.location, p.summary, p.description,
        p.objectives, p.targets, p.pic_name, p.cover_key,
        u.name AS university_name, u.abbreviation AS university_abbr
      FROM programs p
      LEFT JOIN universities u ON p.university_id = u.id
      WHERE p.status = 'published' AND p.deleted_at IS NULL
        ${year ? sql`AND p.year = ${year}` : sql``}
        ${search ? sql`AND (p.title ILIKE ${'%' + search + '%'} OR p.summary ILIKE ${'%' + search + '%'})` : sql``}
      ORDER BY p.year DESC, p.event_date DESC NULLS LAST, p.created_at DESC
      LIMIT 100
    `;
    return c.json({ data: rows.map((r: Record<string, unknown>) => publicProgram(c, r)) });
  } catch {
    console.error('[content] code=PUBLIC_PROGRAMS_FAILED path=/public/programs');
    return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat program kerja' } }, 500);
  }
});

app.get('/public/programs/:slug', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Program kerja tidak ditemukan' } }, 404);
  }
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT
        p.id, p.title, p.slug, p.year, p.event_date, p.location, p.summary, p.description,
        p.objectives, p.targets, p.pic_name, p.cover_key,
        u.name AS university_name, u.abbreviation AS university_abbr
      FROM programs p
      LEFT JOIN universities u ON p.university_id = u.id
      WHERE p.slug = ${c.req.param('slug')}
        AND p.status = 'published' AND p.deleted_at IS NULL
      LIMIT 1
    `;
    if (rows.length === 0) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Program kerja tidak ditemukan' } }, 404);
    }
    const media = await sql`
      SELECT id, media_type, file_key, youtube_id, caption, sort_order
      FROM program_media
      WHERE program_id = ${rows[0].id}
      ORDER BY sort_order ASC, created_at ASC
    `;
    return c.json({
      data: {
        ...publicProgram(c, rows[0]),
        media: media.map((m: Record<string, unknown>) => publicMedia(c, m)),
      },
    });
  } catch {
    console.error('[content] code=PUBLIC_PROGRAM_DETAIL_FAILED');
    return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat detail program kerja' } }, 500);
  }
});

app.get('/public/albums', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) return c.json({ data: [] });
  const year = parseInt(c.req.query('year') || '') || null;
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT
        a.id, a.title, a.slug, a.year, a.event_date, a.description, a.cover_key,
        (SELECT COUNT(*)::int FROM album_media am WHERE am.album_id = a.id AND am.media_type = 'image') AS photo_count,
        (SELECT COUNT(*)::int FROM album_media am WHERE am.album_id = a.id AND am.media_type = 'youtube') AS video_count
      FROM albums a
      WHERE a.status = 'published' AND a.deleted_at IS NULL
        ${year ? sql`AND a.year = ${year}` : sql``}
      ORDER BY a.year DESC, a.event_date DESC NULLS LAST, a.created_at DESC
      LIMIT 100
    `;
    return c.json({ data: rows.map((r: Record<string, unknown>) => publicAlbum(c, r)) });
  } catch {
    console.error('[content] code=PUBLIC_ALBUMS_FAILED path=/public/albums');
    return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat galeri' } }, 500);
  }
});

app.get('/public/albums/:slug', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Album tidak ditemukan' } }, 404);
  }
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT a.id, a.title, a.slug, a.year, a.event_date, a.description, a.cover_key,
        (SELECT COUNT(*)::int FROM album_media am WHERE am.album_id = a.id AND am.media_type = 'image') AS photo_count,
        (SELECT COUNT(*)::int FROM album_media am WHERE am.album_id = a.id AND am.media_type = 'youtube') AS video_count
      FROM albums a
      WHERE a.slug = ${c.req.param('slug')}
        AND a.status = 'published' AND a.deleted_at IS NULL
      LIMIT 1
    `;
    if (rows.length === 0) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Album tidak ditemukan' } }, 404);
    }
    const media = await sql`
      SELECT id, media_type, file_key, youtube_id, caption, sort_order
      FROM album_media
      WHERE album_id = ${rows[0].id}
      ORDER BY sort_order ASC, created_at ASC
    `;
    return c.json({
      data: {
        ...publicAlbum(c, rows[0]),
        media: media.map((m: Record<string, unknown>) => publicMedia(c, m)),
      },
    });
  } catch {
    console.error('[content] code=PUBLIC_ALBUM_DETAIL_FAILED');
    return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat detail album' } }, 500);
  }
});

app.get('/public/stats', async (c) => {
  const config = resolveConfig(c.env);
  if (!config.databaseUrl) {
    return c.json({ data: { activeMembers: 0, alumni: 0, programs: 0, universities: 0 } });
  }
  try {
    const sql = neon(config.databaseUrl);
    const rows = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM member_profiles WHERE status = 'active' AND member_type = 'active' AND deleted_at IS NULL) AS active_members,
        (SELECT COUNT(*)::int FROM member_profiles WHERE status = 'active' AND member_type = 'alumni' AND deleted_at IS NULL) AS alumni,
        (SELECT COUNT(*)::int FROM programs WHERE status = 'published' AND deleted_at IS NULL) AS programs,
        (SELECT COUNT(*)::int FROM universities WHERE is_active = true) AS universities
    `;
    const r = rows[0] ?? {};
    return c.json({
      data: {
        activeMembers: Number(r.active_members ?? 0),
        alumni: Number(r.alumni ?? 0),
        programs: Number(r.programs ?? 0),
        universities: Number(r.universities ?? 0),
      },
    });
  } catch {
    console.error('[content] code=PUBLIC_STATS_FAILED');
    return c.json({ data: { activeMembers: 0, alumni: 0, programs: 0, universities: 0 } });
  }
});

// ============================================================================
// 7. ADMIN KONTEN (Admin Konten & Super Admin)
// ============================================================================
const SIGNATURE_FOLDERS: Record<string, { folder: string; formats: string; resource: 'image' | 'auto' }> = {
  program: { folder: 'kappama/programs', formats: 'jpg,png,webp', resource: 'image' },
  album: { folder: 'kappama/albums', formats: 'jpg,png,webp', resource: 'image' },
  leader: { folder: 'kappama/leaders', formats: 'jpg,png,webp', resource: 'image' },
  org: { folder: 'kappama/org', formats: 'jpg,png,webp', resource: 'image' },
  bylaws: { folder: 'kappama/bylaws', formats: 'pdf', resource: 'auto' },
};

app.post('/admin/uploads/signature', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;

  const body = await c.req.json().catch(() => null);
  const parsed = signatureRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Validasi berkas gagal', parsed.error.flatten());
  }

  const config = resolveConfig(c.env);
  if (!config.cloudinary.isConfigured) {
    return c.json(
      {
        error: {
          code: 'STORAGE_NOT_CONFIGURED',
          message:
            'Layanan penyimpanan belum dikonfigurasi. Hubungi Super Admin atau gunakan tautan berkas statis.',
        },
      },
      503
    );
  }

  const target = SIGNATURE_FOLDERS[parsed.data.kind];
  const storage = storageFor(c);
  try {
    const signature = await storage.createUploadSignature({
      folder: target.folder,
      publicId: crypto.randomUUID(),
      resourceType: target.resource,
      allowedFormats: target.formats,
    });
    return c.json({ data: signature });
  } catch {
    console.error('[content] code=SIGNATURE_FAILED');
    return c.json(
      { error: { code: 'STORAGE_ERROR', message: 'Gagal menyiapkan unggahan. Coba lagi.' } },
      500
    );
  }
});

app.get('/admin/content/summary', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM member_profiles WHERE status = 'pending' AND deleted_at IS NULL) AS pending_members,
      (SELECT COUNT(*)::int FROM programs WHERE status = 'draft' AND deleted_at IS NULL) AS draft_programs,
      (SELECT COUNT(*)::int FROM programs WHERE status = 'published' AND deleted_at IS NULL) AS published_programs,
      (SELECT COUNT(*)::int FROM albums WHERE status = 'draft' AND deleted_at IS NULL) AS draft_albums,
      (SELECT COUNT(*)::int FROM albums WHERE status = 'published' AND deleted_at IS NULL) AS published_albums,
      (SELECT COUNT(*)::int FROM org_periods) AS periods,
      (SELECT COUNT(*)::int FROM bylaws_documents) AS bylaws
  `;
  const r = rows[0] ?? {};
  return c.json({
    data: {
      pendingMembers: Number(r.pending_members ?? 0),
      draftPrograms: Number(r.draft_programs ?? 0),
      publishedPrograms: Number(r.published_programs ?? 0),
      draftAlbums: Number(r.draft_albums ?? 0),
      publishedAlbums: Number(r.published_albums ?? 0),
      periods: Number(r.periods ?? 0),
      bylaws: Number(r.bylaws ?? 0),
    },
  });
});

// --- Profil organisasi ---
app.get('/admin/content/org', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    SELECT id, about_text, vision_text, missions, contact_email, contact_instagram, contact_address, logo_key, updated_at
    FROM org_profile
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  if (rows.length === 0) return c.json({ data: null });
  const r = rows[0];
  return c.json({
    data: {
      id: r.id,
      aboutText: r.about_text,
      visionText: r.vision_text,
      missions: Array.isArray(r.missions) ? r.missions : [],
      contactEmail: r.contact_email,
      contactInstagram: r.contact_instagram,
      contactAddress: r.contact_address,
      logoKey: r.logo_key,
      logoUrl: assetUrl(c, r.logo_key ?? null, 256),
      updatedAt: r.updated_at,
    },
  });
});

app.put('/admin/content/org', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = orgProfileInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi profil organisasi gagal', parsed.error.flatten());
  const input = parsed.data;

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const existing = await sql`SELECT id FROM org_profile ORDER BY updated_at DESC LIMIT 1`;

  let id: string;
  if (existing.length > 0) {
    id = existing[0].id;
    await sql`
      UPDATE org_profile
      SET about_text = ${input.aboutText}, vision_text = ${input.visionText},
          missions = ${JSON.stringify(input.missions)}::jsonb,
          contact_email = ${input.contactEmail}, contact_instagram = ${input.contactInstagram},
          contact_address = ${input.contactAddress}, logo_key = ${input.logoKey}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else {
    const inserted = await sql`
      INSERT INTO org_profile (about_text, vision_text, missions, contact_email, contact_instagram, contact_address, logo_key)
      VALUES (${input.aboutText}, ${input.visionText}, ${JSON.stringify(input.missions)}::jsonb,
              ${input.contactEmail}, ${input.contactInstagram}, ${input.contactAddress}, ${input.logoKey})
      RETURNING id
    `;
    id = inserted[0].id;
  }

  await writeAudit(sql, gate.user.id, 'CONTENT_ORG_UPDATED', 'org_profile', id, { fields: 'about,vision,missions,contact' });
  return c.json({ data: { id, message: 'Profil organisasi berhasil disimpan' } });
});

// --- Periode & struktur organisasi ---
app.get('/admin/content/periods', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    SELECT p.id, p.period_label, p.start_year, p.end_year, p.is_current,
           (SELECT COUNT(*)::int FROM org_leaders l WHERE l.period_id = p.id) AS leader_count
    FROM org_periods p
    ORDER BY p.start_year DESC, p.created_at DESC
  `;
  return c.json({
    data: rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      periodLabel: r.period_label,
      startYear: r.start_year,
      endYear: r.end_year,
      isCurrent: r.is_current,
      leaderCount: Number(r.leader_count ?? 0),
    })),
  });
});

app.post('/admin/content/periods', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = periodInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi periode gagal', parsed.error.flatten());
  const input = parsed.data;

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  if (input.isCurrent) {
    await sql`UPDATE org_periods SET is_current = false, updated_at = NOW() WHERE is_current = true`;
  }
  const rows = await sql`
    INSERT INTO org_periods (period_label, start_year, end_year, is_current)
    VALUES (${input.periodLabel}, ${input.startYear}, ${input.endYear}, ${input.isCurrent})
    RETURNING id
  `;
  await writeAudit(sql, gate.user.id, 'CONTENT_PERIOD_CREATED', 'org_periods', rows[0].id, {
    isCurrent: input.isCurrent,
  });
  return c.json({ data: { id: rows[0].id } }, 201);
});

app.put('/admin/content/periods/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = periodInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi periode gagal', parsed.error.flatten());
  const input = parsed.data;
  const id = c.req.param('id');

  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  if (input.isCurrent) {
    await sql`UPDATE org_periods SET is_current = false, updated_at = NOW() WHERE is_current = true AND id <> ${id}`;
  }
  const rows = await sql`
    UPDATE org_periods
    SET period_label = ${input.periodLabel}, start_year = ${input.startYear},
        end_year = ${input.endYear}, is_current = ${input.isCurrent}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Periode tidak ditemukan' } }, 404);
  await writeAudit(sql, gate.user.id, 'CONTENT_PERIOD_UPDATED', 'org_periods', id, { isCurrent: input.isCurrent });
  return c.json({ data: { id } });
});

app.post('/admin/content/periods/:id/activate', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const rows = await sql`SELECT id FROM org_periods WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Periode tidak ditemukan' } }, 404);

  await sql`UPDATE org_periods SET is_current = false, updated_at = NOW() WHERE is_current = true`;
  await sql`UPDATE org_periods SET is_current = true, updated_at = NOW() WHERE id = ${id}`;
  await writeAudit(sql, gate.user.id, 'CONTENT_PERIOD_ACTIVATED', 'org_periods', id);
  return c.json({ data: { message: 'Periode aktif diperbarui' } });
});

app.delete('/admin/content/periods/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const photos = await sql`SELECT photo_key FROM org_leaders WHERE period_id = ${id}`;
  const rows = await sql`DELETE FROM org_periods WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Periode tidak ditemukan' } }, 404);

  for (const row of photos) await deleteStoredAsset(c, row.photo_key ?? null);
  await writeAudit(sql, gate.user.id, 'CONTENT_PERIOD_DELETED', 'org_periods', id);
  return c.json({ data: { message: 'Periode dihapus' } });
});

app.get('/admin/content/leaders', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const periodId = c.req.query('periodId');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = periodId
    ? await sql`
        SELECT id, period_id, position, name, photo_key, campus_study, sort_order
        FROM org_leaders WHERE period_id = ${periodId}
        ORDER BY sort_order ASC, created_at ASC
      `
    : await sql`
        SELECT id, period_id, position, name, photo_key, campus_study, sort_order
        FROM org_leaders ORDER BY period_id, sort_order ASC, created_at ASC
      `;
  return c.json({
    data: rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      periodId: r.period_id,
      position: r.position,
      name: r.name,
      photoKey: r.photo_key,
      photoUrl: assetUrl(c, (r.photo_key as string) ?? null, 400),
      campusStudy: r.campus_study,
      sortOrder: r.sort_order,
    })),
  });
});

app.post('/admin/content/leaders', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = leaderInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi pengurus gagal', parsed.error.flatten());
  const input = parsed.data;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const period = await sql`SELECT id FROM org_periods WHERE id = ${input.periodId} LIMIT 1`;
  if (period.length === 0) return validationError(c, 'Periode tidak ditemukan');

  const rows = await sql`
    INSERT INTO org_leaders (period_id, position, name, photo_key, campus_study, sort_order)
    VALUES (${input.periodId}, ${input.position}, ${input.name}, ${input.photoKey}, ${input.campusStudy}, ${input.sortOrder})
    RETURNING id
  `;
  await writeAudit(sql, gate.user.id, 'CONTENT_LEADER_CREATED', 'org_leaders', rows[0].id, { position: input.position });
  return c.json({ data: { id: rows[0].id } }, 201);
});

app.put('/admin/content/leaders/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = leaderInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi pengurus gagal', parsed.error.flatten());
  const input = parsed.data;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const previous = await sql`SELECT photo_key FROM org_leaders WHERE id = ${id} LIMIT 1`;
  if (previous.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Pengurus tidak ditemukan' } }, 404);

  await sql`
    UPDATE org_leaders
    SET period_id = ${input.periodId}, position = ${input.position}, name = ${input.name},
        photo_key = ${input.photoKey}, campus_study = ${input.campusStudy},
        sort_order = ${input.sortOrder}, updated_at = NOW()
    WHERE id = ${id}
  `;
  if (previous[0].photo_key && previous[0].photo_key !== input.photoKey) {
    await deleteStoredAsset(c, previous[0].photo_key);
  }
  await writeAudit(sql, gate.user.id, 'CONTENT_LEADER_UPDATED', 'org_leaders', id, { position: input.position });
  return c.json({ data: { id } });
});

app.delete('/admin/content/leaders/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`DELETE FROM org_leaders WHERE id = ${id} RETURNING photo_key`;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Pengurus tidak ditemukan' } }, 404);
  await deleteStoredAsset(c, rows[0].photo_key ?? null);
  await writeAudit(sql, gate.user.id, 'CONTENT_LEADER_DELETED', 'org_leaders', id);
  return c.json({ data: { message: 'Pengurus dihapus' } });
});

// --- AD/ART ---
app.get('/admin/content/bylaws', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    SELECT id, title, file_key, effective_date, is_active
    FROM bylaws_documents
    ORDER BY is_active DESC, effective_date DESC, created_at DESC
  `;
  return c.json({
    data: rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      fileKey: r.file_key,
      fileUrl: assetUrl(c, (r.file_key as string) ?? null),
      effectiveDate: r.effective_date,
      isActive: r.is_active,
    })),
  });
});

app.post('/admin/content/bylaws', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = bylawsInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi AD/ART gagal', parsed.error.flatten());
  const input = parsed.data;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  if (input.isActive) {
    await sql`UPDATE bylaws_documents SET is_active = false, updated_at = NOW() WHERE is_active = true`;
  }
  const rows = await sql`
    INSERT INTO bylaws_documents (title, file_key, effective_date, is_active)
    VALUES (${input.title}, ${input.fileKey}, ${input.effectiveDate}, ${input.isActive})
    RETURNING id
  `;
  await writeAudit(sql, gate.user.id, 'CONTENT_BYLAWS_CREATED', 'bylaws_documents', rows[0].id, {
    isActive: input.isActive,
  });
  return c.json({ data: { id: rows[0].id } }, 201);
});

app.put('/admin/content/bylaws/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = bylawsInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi AD/ART gagal', parsed.error.flatten());
  const input = parsed.data;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const previous = await sql`SELECT file_key FROM bylaws_documents WHERE id = ${id} LIMIT 1`;
  if (previous.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Dokumen tidak ditemukan' } }, 404);

  if (input.isActive) {
    await sql`UPDATE bylaws_documents SET is_active = false, updated_at = NOW() WHERE is_active = true AND id <> ${id}`;
  }
  await sql`
    UPDATE bylaws_documents
    SET title = ${input.title}, file_key = ${input.fileKey}, effective_date = ${input.effectiveDate},
        is_active = ${input.isActive}, updated_at = NOW()
    WHERE id = ${id}
  `;
  if (previous[0].file_key && previous[0].file_key !== input.fileKey) {
    await deleteStoredAsset(c, previous[0].file_key);
  }
  await writeAudit(sql, gate.user.id, 'CONTENT_BYLAWS_UPDATED', 'bylaws_documents', id, { isActive: input.isActive });
  return c.json({ data: { id } });
});

app.delete('/admin/content/bylaws/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`DELETE FROM bylaws_documents WHERE id = ${id} RETURNING file_key`;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Dokumen tidak ditemukan' } }, 404);
  await deleteStoredAsset(c, rows[0].file_key ?? null);
  await writeAudit(sql, gate.user.id, 'CONTENT_BYLAWS_DELETED', 'bylaws_documents', id);
  return c.json({ data: { message: 'Dokumen dihapus' } });
});

// --- Program kerja ---
app.get('/admin/content/programs', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    SELECT p.id, p.title, p.slug, p.year, p.event_date, p.status, p.cover_key, p.university_id,
           u.name AS university_name,
           (SELECT COUNT(*)::int FROM program_media m WHERE m.program_id = p.id AND m.media_type = 'image') AS photo_count,
           (SELECT COUNT(*)::int FROM program_media m WHERE m.program_id = p.id AND m.media_type = 'youtube') AS video_count,
           p.updated_at
    FROM programs p
    LEFT JOIN universities u ON p.university_id = u.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.year DESC, p.updated_at DESC
    LIMIT 200
  `;
  return c.json({
    data: rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      year: r.year,
      eventDate: r.event_date,
      status: r.status,
      coverUrl: assetUrl(c, (r.cover_key as string) ?? null, 400),
      universityId: r.university_id,
      universityName: r.university_name,
      photoCount: Number(r.photo_count ?? 0),
      videoCount: Number(r.video_count ?? 0),
      updatedAt: r.updated_at,
    })),
  });
});

app.get('/admin/content/programs/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    SELECT id, title, slug, year, event_date, location, summary, description, objectives, targets,
           pic_name, cover_key, university_id, status
    FROM programs WHERE id = ${c.req.param('id')} AND deleted_at IS NULL LIMIT 1
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Program kerja tidak ditemukan' } }, 404);
  const media = await sql`
    SELECT id, media_type, file_key, youtube_id, caption, sort_order
    FROM program_media WHERE program_id = ${rows[0].id}
    ORDER BY sort_order ASC, created_at ASC
  `;
  const r = rows[0];
  return c.json({
    data: {
      id: r.id,
      title: r.title,
      slug: r.slug,
      year: r.year,
      eventDate: r.event_date,
      location: r.location,
      summary: r.summary,
      description: r.description,
      objectives: r.objectives,
      targets: r.targets,
      picName: r.pic_name,
      coverKey: r.cover_key,
      coverUrl: assetUrl(c, r.cover_key ?? null, 400),
      universityId: r.university_id,
      status: r.status,
      media: media.map((m: Record<string, unknown>) => publicMedia(c, m)),
    },
  });
});

async function assertSlugFree(
  sql: NeonQueryFunction<false, false>,
  table: 'programs' | 'albums',
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const rows =
    table === 'programs'
      ? excludeId
        ? await sql`SELECT id FROM programs WHERE slug = ${slug} AND id <> ${excludeId} LIMIT 1`
        : await sql`SELECT id FROM programs WHERE slug = ${slug} LIMIT 1`
      : excludeId
        ? await sql`SELECT id FROM albums WHERE slug = ${slug} AND id <> ${excludeId} LIMIT 1`
        : await sql`SELECT id FROM albums WHERE slug = ${slug} LIMIT 1`;
  return rows.length === 0;
}

app.post('/admin/content/programs', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = programInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi program kerja gagal', parsed.error.flatten());
  const input = parsed.data;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  if (!(await assertSlugFree(sql, 'programs', input.slug))) {
    return c.json({ error: { code: 'SLUG_TAKEN', message: 'Slug sudah dipakai program lain' } }, 409);
  }

  const rows = await sql`
    INSERT INTO programs (title, slug, year, event_date, location, summary, description, objectives,
                          targets, pic_name, cover_key, university_id, status)
    VALUES (${input.title}, ${input.slug}, ${input.year}, ${input.eventDate}, ${input.location},
            ${input.summary}, ${input.description}, ${input.objectives}, ${input.targets},
            ${input.picName}, ${input.coverKey}, ${input.universityId}, ${input.status})
    RETURNING id
  `;
  await writeAudit(sql, gate.user.id, 'CONTENT_PROGRAM_CREATED', 'programs', rows[0].id, { status: input.status });
  return c.json({ data: { id: rows[0].id } }, 201);
});

app.put('/admin/content/programs/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = programInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi program kerja gagal', parsed.error.flatten());
  const input = parsed.data;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  if (!(await assertSlugFree(sql, 'programs', input.slug, id))) {
    return c.json({ error: { code: 'SLUG_TAKEN', message: 'Slug sudah dipakai program lain' } }, 409);
  }

  const previous = await sql`SELECT cover_key FROM programs WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`;
  if (previous.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Program kerja tidak ditemukan' } }, 404);

  await sql`
    UPDATE programs
    SET title = ${input.title}, slug = ${input.slug}, year = ${input.year}, event_date = ${input.eventDate},
        location = ${input.location}, summary = ${input.summary}, description = ${input.description},
        objectives = ${input.objectives}, targets = ${input.targets}, pic_name = ${input.picName},
        cover_key = ${input.coverKey}, university_id = ${input.universityId},
        status = ${input.status}, updated_at = NOW()
    WHERE id = ${id}
  `;
  if (previous[0].cover_key && previous[0].cover_key !== input.coverKey) {
    await deleteStoredAsset(c, previous[0].cover_key);
  }
  await writeAudit(sql, gate.user.id, 'CONTENT_PROGRAM_UPDATED', 'programs', id, { status: input.status });
  return c.json({ data: { id } });
});

app.post('/admin/content/programs/:id/status', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = statusInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Status tidak valid');
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    UPDATE programs SET status = ${parsed.data.status}, updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL RETURNING id
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Program kerja tidak ditemukan' } }, 404);
  await writeAudit(
    sql,
    gate.user.id,
    parsed.data.status === 'published' ? 'CONTENT_PROGRAM_PUBLISHED' : 'CONTENT_PROGRAM_UNPUBLISHED',
    'programs',
    id
  );
  return c.json({ data: { message: 'Status program kerja diperbarui' } });
});

app.delete('/admin/content/programs/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const media = await sql`SELECT file_key FROM program_media WHERE program_id = ${id}`;
  const rows = await sql`
    UPDATE programs SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL RETURNING cover_key
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Program kerja tidak ditemukan' } }, 404);

  await deleteStoredAsset(c, rows[0].cover_key ?? null);
  for (const row of media) await deleteStoredAsset(c, row.file_key ?? null);
  await writeAudit(sql, gate.user.id, 'CONTENT_PROGRAM_DELETED', 'programs', id, { softDelete: true });
  return c.json({ data: { message: 'Program kerja dihapus' } });
});

app.post('/admin/content/programs/:id/media', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const programId = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = mediaInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi media gagal', parsed.error.flatten());
  const input = parsed.data;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const parent = await sql`SELECT id FROM programs WHERE id = ${programId} AND deleted_at IS NULL LIMIT 1`;
  if (parent.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Program kerja tidak ditemukan' } }, 404);

  if (input.mediaType === 'image') {
    const count = await sql`
      SELECT COUNT(*)::int AS total FROM program_media WHERE program_id = ${programId} AND media_type = 'image'
    `;
    if (Number(count[0]?.total ?? 0) >= 30) {
      return c.json({ error: { code: 'MEDIA_LIMIT', message: 'Maksimal 30 foto per program kerja' } }, 409);
    }
  }

  const youtubeId = input.mediaType === 'youtube' ? extractYouTubeId(input.youtubeUrl ?? '') : null;
  const rows = await sql`
    INSERT INTO program_media (program_id, media_type, file_key, youtube_id, caption, sort_order)
    VALUES (${programId}, ${input.mediaType}, ${input.fileKey}, ${youtubeId},
            ${input.caption}, COALESCE((SELECT MAX(sort_order) + 1 FROM program_media WHERE program_id = ${programId}), 1))
    RETURNING id
  `;
  await writeAudit(sql, gate.user.id, 'CONTENT_PROGRAM_MEDIA_ADDED', 'program_media', rows[0].id, {
    mediaType: input.mediaType,
  });
  return c.json({ data: { id: rows[0].id } }, 201);
});

app.put('/admin/content/program-media/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = mediaUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi media gagal', parsed.error.flatten());
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    UPDATE program_media
    SET caption = ${parsed.data.caption},
        sort_order = COALESCE(${parsed.data.sortOrder ?? null}, sort_order)
    WHERE id = ${id} RETURNING id
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Media tidak ditemukan' } }, 404);
  await writeAudit(sql, gate.user.id, 'CONTENT_PROGRAM_MEDIA_UPDATED', 'program_media', id);
  return c.json({ data: { message: 'Media diperbarui' } });
});

app.delete('/admin/content/program-media/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`DELETE FROM program_media WHERE id = ${id} RETURNING file_key`;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Media tidak ditemukan' } }, 404);
  await deleteStoredAsset(c, rows[0].file_key ?? null);
  await writeAudit(sql, gate.user.id, 'CONTENT_PROGRAM_MEDIA_DELETED', 'program_media', id);
  return c.json({ data: { message: 'Media dihapus' } });
});

// --- Galeri / album ---
app.get('/admin/content/albums', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    SELECT a.id, a.title, a.slug, a.year, a.event_date, a.status, a.cover_key, a.program_id,
           (SELECT COUNT(*)::int FROM album_media m WHERE m.album_id = a.id AND m.media_type = 'image') AS photo_count,
           (SELECT COUNT(*)::int FROM album_media m WHERE m.album_id = a.id AND m.media_type = 'youtube') AS video_count,
           a.updated_at
    FROM albums a
    WHERE a.deleted_at IS NULL
    ORDER BY a.year DESC, a.updated_at DESC
    LIMIT 200
  `;
  return c.json({
    data: rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      year: r.year,
      eventDate: r.event_date,
      status: r.status,
      coverUrl: assetUrl(c, (r.cover_key as string) ?? null, 400),
      programId: r.program_id,
      photoCount: Number(r.photo_count ?? 0),
      videoCount: Number(r.video_count ?? 0),
      updatedAt: r.updated_at,
    })),
  });
});

app.get('/admin/content/albums/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    SELECT id, title, slug, year, event_date, description, cover_key, program_id, status
    FROM albums WHERE id = ${c.req.param('id')} AND deleted_at IS NULL LIMIT 1
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Album tidak ditemukan' } }, 404);
  const media = await sql`
    SELECT id, media_type, file_key, youtube_id, caption, sort_order
    FROM album_media WHERE album_id = ${rows[0].id}
    ORDER BY sort_order ASC, created_at ASC
  `;
  const r = rows[0];
  return c.json({
    data: {
      id: r.id,
      title: r.title,
      slug: r.slug,
      year: r.year,
      eventDate: r.event_date,
      description: r.description,
      coverKey: r.cover_key,
      coverUrl: assetUrl(c, r.cover_key ?? null, 400),
      programId: r.program_id,
      status: r.status,
      media: media.map((m: Record<string, unknown>) => publicMedia(c, m)),
    },
  });
});

app.post('/admin/content/albums', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = albumInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi album gagal', parsed.error.flatten());
  const input = parsed.data;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  if (!(await assertSlugFree(sql, 'albums', input.slug))) {
    return c.json({ error: { code: 'SLUG_TAKEN', message: 'Slug sudah dipakai album lain' } }, 409);
  }

  const rows = await sql`
    INSERT INTO albums (title, slug, year, event_date, description, cover_key, program_id, status)
    VALUES (${input.title}, ${input.slug}, ${input.year}, ${input.eventDate}, ${input.description},
            ${input.coverKey}, ${input.programId}, ${input.status})
    RETURNING id
  `;
  await writeAudit(sql, gate.user.id, 'CONTENT_ALBUM_CREATED', 'albums', rows[0].id, { status: input.status });
  return c.json({ data: { id: rows[0].id } }, 201);
});

app.put('/admin/content/albums/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = albumInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi album gagal', parsed.error.flatten());
  const input = parsed.data;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  if (!(await assertSlugFree(sql, 'albums', input.slug, id))) {
    return c.json({ error: { code: 'SLUG_TAKEN', message: 'Slug sudah dipakai album lain' } }, 409);
  }

  const previous = await sql`SELECT cover_key FROM albums WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`;
  if (previous.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Album tidak ditemukan' } }, 404);

  await sql`
    UPDATE albums
    SET title = ${input.title}, slug = ${input.slug}, year = ${input.year}, event_date = ${input.eventDate},
        description = ${input.description}, cover_key = ${input.coverKey}, program_id = ${input.programId},
        status = ${input.status}, updated_at = NOW()
    WHERE id = ${id}
  `;
  if (previous[0].cover_key && previous[0].cover_key !== input.coverKey) {
    await deleteStoredAsset(c, previous[0].cover_key);
  }
  await writeAudit(sql, gate.user.id, 'CONTENT_ALBUM_UPDATED', 'albums', id, { status: input.status });
  return c.json({ data: { id } });
});

app.post('/admin/content/albums/:id/status', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = statusInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Status tidak valid');
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    UPDATE albums SET status = ${parsed.data.status}, updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL RETURNING id
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Album tidak ditemukan' } }, 404);
  await writeAudit(
    sql,
    gate.user.id,
    parsed.data.status === 'published' ? 'CONTENT_ALBUM_PUBLISHED' : 'CONTENT_ALBUM_UNPUBLISHED',
    'albums',
    id
  );
  return c.json({ data: { message: 'Status album diperbarui' } });
});

app.delete('/admin/content/albums/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const media = await sql`SELECT file_key FROM album_media WHERE album_id = ${id}`;
  const rows = await sql`
    UPDATE albums SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL RETURNING cover_key
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Album tidak ditemukan' } }, 404);

  await deleteStoredAsset(c, rows[0].cover_key ?? null);
  for (const row of media) await deleteStoredAsset(c, row.file_key ?? null);
  await writeAudit(sql, gate.user.id, 'CONTENT_ALBUM_DELETED', 'albums', id, { softDelete: true });
  return c.json({ data: { message: 'Album dihapus' } });
});

app.post('/admin/content/albums/:id/media', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const albumId = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = mediaInputSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi media gagal', parsed.error.flatten());
  const input = parsed.data;
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);

  const parent = await sql`SELECT id FROM albums WHERE id = ${albumId} AND deleted_at IS NULL LIMIT 1`;
  if (parent.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Album tidak ditemukan' } }, 404);

  if (input.mediaType === 'image') {
    const count = await sql`
      SELECT COUNT(*)::int AS total FROM album_media WHERE album_id = ${albumId} AND media_type = 'image'
    `;
    if (Number(count[0]?.total ?? 0) >= 60) {
      return c.json({ error: { code: 'MEDIA_LIMIT', message: 'Maksimal 60 foto per album' } }, 409);
    }
  }

  const youtubeId = input.mediaType === 'youtube' ? extractYouTubeId(input.youtubeUrl ?? '') : null;
  const rows = await sql`
    INSERT INTO album_media (album_id, media_type, file_key, youtube_id, caption, sort_order)
    VALUES (${albumId}, ${input.mediaType}, ${input.fileKey}, ${youtubeId},
            ${input.caption}, COALESCE((SELECT MAX(sort_order) + 1 FROM album_media WHERE album_id = ${albumId}), 1))
    RETURNING id
  `;
  await writeAudit(sql, gate.user.id, 'CONTENT_ALBUM_MEDIA_ADDED', 'album_media', rows[0].id, {
    mediaType: input.mediaType,
  });
  return c.json({ data: { id: rows[0].id } }, 201);
});

app.put('/admin/content/album-media/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const body = await c.req.json().catch(() => null);
  const parsed = mediaUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(c, 'Validasi media gagal', parsed.error.flatten());
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`
    UPDATE album_media
    SET caption = ${parsed.data.caption},
        sort_order = COALESCE(${parsed.data.sortOrder ?? null}, sort_order)
    WHERE id = ${id} RETURNING id
  `;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Media tidak ditemukan' } }, 404);
  await writeAudit(sql, gate.user.id, 'CONTENT_ALBUM_MEDIA_UPDATED', 'album_media', id);
  return c.json({ data: { message: 'Media diperbarui' } });
});

app.delete('/admin/content/album-media/:id', async (c) => {
  const gate = await contentAdminGate(c);
  if ('response' in gate) return gate.response;
  const id = c.req.param('id');
  const config = resolveConfig(c.env);
  const sql = neon(config.databaseUrl!);
  const rows = await sql`DELETE FROM album_media WHERE id = ${id} RETURNING file_key`;
  if (rows.length === 0) return c.json({ error: { code: 'NOT_FOUND', message: 'Media tidak ditemukan' } }, 404);
  await deleteStoredAsset(c, rows[0].file_key ?? null);
  await writeAudit(sql, gate.user.id, 'CONTENT_ALBUM_MEDIA_DELETED', 'album_media', id);
  return c.json({ data: { message: 'Media dihapus' } });
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
