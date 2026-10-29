import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Tiruan Neon: setiap tagged template mengembalikan objek thenable sehingga
// potongan query bersarang (sql`` di dalam sql``) tetap bekerja seperti aslinya.
// ---------------------------------------------------------------------------
type QueryHandler = (text: string, values: unknown[]) => unknown[];

const db = vi.hoisted(() => {
  const state: { handler: QueryHandler | null; queries: Array<{ text: string; values: unknown[] }> } = {
    handler: null,
    queries: [],
  };

  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join(' ');
    return {
      [Symbol.for('neon.fragment')]: true,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve()
          .then(() => {
            state.queries.push({ text, values });
            return state.handler ? state.handler(text, values) : [];
          })
          .then(resolve, reject),
    };
  };

  return { state, sql };
});

const auth = vi.hoisted(() => ({
  state: {
    session: null as { userId: string; sessionId: string | null } | null,
    user: null as { id: string; email: string | null; emailVerified: boolean } | null,
  },
}));

vi.mock('@neondatabase/serverless', () => ({ neon: () => db.sql }));
vi.mock('./lib/clerk-auth', () => ({
  AUTH_ERROR_MESSAGES: {
    TOKEN_MISSING: 'Sesi login tidak ditemukan. Silakan login ulang.',
    TOKEN_MALFORMED: 'Sesi login tidak valid.',
    TOKEN_EXPIRED: 'Sesi login sudah kedaluwarsa.',
    TOKEN_NOT_YET_VALID: 'Jam perangkat tidak cocok.',
    ISSUER_MISMATCH: 'Sesi login berasal dari aplikasi lain.',
    AZP_MISMATCH: 'Sesi login tidak cocok dengan aplikasi ini.',
    SIGNATURE_INVALID: 'Tanda tangan sesi login tidak valid.',
    JWKS_FETCH_FAILED: 'Server tidak dapat memverifikasi sesi saat ini.',
    EMAIL_UNVERIFIED: 'Email akun belum terverifikasi.',
    CLERK_BACKEND_ERROR: 'Server gagal memeriksa akun Anda.',
  },
  verifyClerkSessionToken: async () =>
    auth.state.session
      ? { ok: true, session: auth.state.session }
      : { ok: false, code: 'TOKEN_MISSING' },
  fetchClerkUser: async () =>
    !auth.state.user
      ? { ok: false, code: 'CLERK_BACKEND_ERROR' }
      : auth.state.user.emailVerified
        ? { ok: true, user: auth.state.user }
        : { ok: false, code: 'EMAIL_UNVERIFIED' },
}));

const { app } = await import('./[[path]]');

const ENV = {
  DATABASE_URL: 'postgresql://test',
  CLERK_SECRET_KEY: 'sk_test_dummy',
  CLERK_PUBLISHABLE_KEY: 'pk_test_dummy',
  TURNSTILE_SECRET_KEY: 'ts_test_dummy',
  BOOTSTRAP_SUPER_ADMIN_EMAIL: 'boss@example.com',
};

const AUTH_HEADER = { Authorization: 'Bearer session-token' };

function loginAs(role: 'member' | 'content_admin' | 'super_admin', id = 'u1') {
  auth.state.session = { userId: `clerk_${id}`, sessionId: 'sess_1' };
  auth.state.user = { id: `clerk_${id}`, email: `${id}@example.com`, emailVerified: true };
  return { id, clerk_user_id: `clerk_${id}`, email: `${id}@example.com`, role };
}

function request(path: string, init: RequestInit = {}, env: Record<string, unknown> = ENV) {
  return app.request(`/api${path}`, init, env);
}

function profile(status: string, submittedAt: string) {
  return {
    id: 'm1',
    user_id: 'u1',
    status,
    submitted_at: submittedAt,
    approved_at: null,
    approval_type: null,
    rejection_reason: null,
    member_type: 'active',
    cohort_year: 2023,
    hide_contact: false,
    whatsapp: '+628111111111',
    email: 'u1@example.com',
    address_detail: 'Dusun Rahasia RT 01',
  };
}

function onboardingBody(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'Nama Uji',
    username: 'nama_uji',
    whatsapp: '081234567890',
    memberType: 'active',
    cohortYear: 2023,
    universityId: 'univ-1',
    studyProgramId: 'prodi-1',
    districtId: '35.01.01',
    villageId: '35.01.01.2001',
    addressDetail: 'Dusun Krajan RT 01 RW 02',
    hideContact: false,
    turnstileToken: 'token-uji',
    consentAgreed: true,
    ...overrides,
  };
}

beforeEach(() => {
  db.state.handler = null;
  db.state.queries = [];
  auth.state.session = null;
  auth.state.user = null;
  vi.unstubAllGlobals();
});

describe('Direktori: kontrol akses', () => {
  it('menolak pengunjung tanpa sesi dengan 401', async () => {
    const res = await request('/members');
    expect(res.status).toBe(401);
    expect(db.state.queries).toHaveLength(0);
  });

  it('menolak anggota pending dengan 403', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [user];
      if (text.includes('FROM member_profiles')) return [profile('pending', new Date().toISOString())];
      return [];
    };

    const res = await request('/members', { headers: AUTH_HEADER });
    expect(res.status).toBe(403);
  });

  it('menolak anggota rejected dengan 403', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [user];
      if (text.includes('FROM member_profiles')) return [profile('rejected', new Date().toISOString())];
      return [];
    };

    const res = await request('/members', { headers: AUTH_HEADER });
    expect(res.status).toBe(403);
  });

  it('mengizinkan anggota active dan tidak pernah mengirim address_detail', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [user];
      if (text.includes('COUNT(*) OVER()')) {
        return [{ total_count: 1, ...profile('active', new Date().toISOString()), username: 'nama_uji' }];
      }
      if (text.includes('FROM member_profiles')) return [profile('active', new Date().toISOString())];
      return [];
    };

    const res = await request('/members', { headers: AUTH_HEADER });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { meta: { total: number }; data: unknown };
    expect(body.meta.total).toBe(1);
    expect(JSON.stringify(body.data)).not.toContain('Dusun Rahasia');
  });

  it('menyembunyikan kontak saat hide_contact aktif', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [user];
      if (text.includes('COUNT(*) OVER()')) {
        return [{ total_count: 1, ...profile('active', new Date().toISOString()), hide_contact: true }];
      }
      if (text.includes('FROM member_profiles')) return [profile('active', new Date().toISOString())];
      return [];
    };

    const res = await request('/members', { headers: AUTH_HEADER });
    const body = (await res.json()) as { data: Array<Record<string, unknown>> };
    expect(body.data[0].whatsapp).toBeNull();
    expect(body.data[0].email).toBeNull();
  });
});

describe('Detail anggota: IDOR dan UU PDP', () => {
  it('menyembunyikan alamat detail milik anggota lain', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [user];
      if (text.includes('FROM member_profiles m')) return [{ ...profile('active', new Date().toISOString()), user_id: 'u_lain' }];
      if (text.includes('FROM member_profiles')) return [profile('active', new Date().toISOString())];
      return [];
    };

    const res = await request('/members/nama_uji', { headers: AUTH_HEADER });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data.addressDetail).toBeNull();
    expect(db.state.queries.some((q) => q.text.includes('ADMIN_VIEWED_ADDRESS_DETAIL'))).toBe(false);
  });

  it('menampilkan alamat detail milik sendiri', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [user];
      if (text.includes('FROM member_profiles m')) return [profile('active', new Date().toISOString())];
      if (text.includes('FROM member_profiles')) return [profile('active', new Date().toISOString())];
      return [];
    };

    const res = await request('/members/nama_uji', { headers: AUTH_HEADER });
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data.addressDetail).toBe('Dusun Rahasia RT 01');
  });

  it('admin melihat alamat detail dan aksesnya tercatat di audit', async () => {
    const admin = loginAs('content_admin', 'admin1');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [admin];
      if (text.includes('FROM member_profiles m')) return [{ ...profile('active', new Date().toISOString()), user_id: 'u_lain' }];
      return [];
    };

    const res = await request('/members/nama_uji', { headers: AUTH_HEADER });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data.addressDetail).toBe('Dusun Rahasia RT 01');
    expect(db.state.queries.some((q) => q.text.includes('ADMIN_VIEWED_ADDRESS_DETAIL'))).toBe(true);
  });

  it('menolak anggota pending membuka detail anggota lain', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [user];
      if (text.includes('FROM member_profiles')) return [profile('pending', new Date().toISOString())];
      return [];
    };

    const res = await request('/members/nama_uji', { headers: AUTH_HEADER });
    expect(res.status).toBe(403);
  });
});

describe('Endpoint admin: peran dan persetujuan', () => {
  it('menolak Admin Konten mengubah peran (403)', async () => {
    const admin = loginAs('content_admin', 'admin1');
    db.state.handler = (text) => (text.includes('FROM users') ? [admin] : []);

    const res = await request('/admin/users/u2/role', {
      method: 'PUT',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'super_admin' }),
    });
    expect(res.status).toBe(403);
  });

  it('menolak pencabutan Super Admin terakhir dengan 409', async () => {
    const admin = loginAs('super_admin', 'boss');
    db.state.handler = (text) => {
      if (text.includes('FROM users WHERE id')) return [{ id: 'boss', role: 'super_admin' }];
      if (text.includes('COUNT(*)::int AS count')) return [{ count: 1 }];
      if (text.includes('FROM users')) return [admin];
      return [];
    };

    const res = await request('/admin/users/boss/role', {
      method: 'PUT',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'content_admin' }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('LAST_SUPER_ADMIN');
  });

  it('Super Admin dapat mengubah peran dan mencatat audit tanpa data pribadi', async () => {
    const admin = loginAs('super_admin', 'boss');
    db.state.handler = (text) => {
      if (text.includes('FROM users WHERE id')) return [{ id: 'u2', role: 'member' }];
      if (text.includes('FROM users')) return [admin];
      return [];
    };

    const res = await request('/admin/users/u2/role', {
      method: 'PUT',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'content_admin' }),
    });
    expect(res.status).toBe(200);

    const audit = db.state.queries.find((q) => q.text.includes('USER_ROLE_CHANGED'));
    expect(audit).toBeDefined();
    expect(JSON.stringify(audit?.values)).not.toContain('@example.com');
  });

  it('menolak penolakan tanpa alasan (422)', async () => {
    const admin = loginAs('content_admin', 'admin1');
    db.state.handler = (text) => (text.includes('FROM users') ? [admin] : []);

    const res = await request('/admin/approvals/m1/reject', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });

  it('mencatat penolakan tanpa menyimpan teks alasan', async () => {
    const admin = loginAs('content_admin', 'admin1');
    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [admin];
      if (text.includes('UPDATE member_profiles') && text.includes("status = 'rejected'")) return [{ id: 'm1' }];
      return [];
    };

    const res = await request('/admin/approvals/m1/reject', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Data alamat tidak sesuai' }),
    });
    expect(res.status).toBe(200);

    const audit = db.state.queries.find((q) => q.text.includes('MEMBER_REJECTED'));
    expect(audit).toBeDefined();
    expect(JSON.stringify(audit?.values)).not.toContain('Data alamat tidak sesuai');
  });
});

describe('Auto-approve 24 jam', () => {
  const cases: Array<[string, number, string]> = [
    ['23 jam 59 menit tetap pending', 24 * 60 * 60 * 1000 - 60 * 1000, 'pending'],
    ['tepat 24 jam menjadi active', 24 * 60 * 60 * 1000, 'active'],
    ['24 jam 01 menit tetap active', 24 * 60 * 60 * 1000 + 60 * 1000, 'active'],
  ];

  for (const [label, elapsedMs, expected] of cases) {
    it(label, async () => {
      const user = loginAs('member');
      const submittedAt = new Date(Date.now() - elapsedMs).toISOString();
      db.state.handler = (text) => {
        if (text.includes('FROM users')) return [user];
        if (text.includes('FROM member_profiles')) return [profile('pending', submittedAt)];
        return [];
      };

      const res = await request('/me/status', { headers: AUTH_HEADER });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { status: string } };
      expect(body.data.status).toBe(expected);
    });
  }
});

describe('Alur status anggota', () => {
  it('menolak lalu mengajukan ulang mereset submitted_at dan status pending', async () => {
    const admin = loginAs('content_admin', 'admin1');
    const current = profile('pending', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [admin];
      if (text.includes("UPDATE member_profiles") && text.includes("status = 'rejected'")) {
        current.status = 'rejected';
        return [{ id: 'm1' }];
      }
      if (text.includes('FROM member_profiles WHERE username')) return [];
      if (text.includes('INSERT INTO member_profiles')) {
        current.status = 'pending';
        current.submitted_at = new Date().toISOString();
        return [{ id: 'm1' }];
      }
      return [];
    };

    const rejected = await request('/admin/approvals/m1/reject', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Berkas kurang' }),
    });
    expect(rejected.status).toBe(200);
    expect(current.status).toBe('rejected');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }))
    );

    const resubmit = await request('/me/onboarding', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify(onboardingBody()),
    });
    expect(resubmit.status).toBe(201);
    expect(current.status).toBe('pending');
    expect(new Date(current.submitted_at).getTime()).toBeGreaterThan(Date.now() - 5000);
  });

  it('menangguhkan anggota yang sudah auto-aktif, lalu menolak penangguhan kedua', async () => {
    const admin = loginAs('content_admin', 'admin1');
    const current = profile('active', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [admin];
      if (text.includes("SET status = 'suspended'")) {
        if (current.status !== 'active' && current.status !== 'pending') return [];
        current.status = 'suspended';
        return [{ id: 'm1', status: 'suspended' }];
      }
      return [];
    };

    const first = await request('/admin/members/m1/suspend', { method: 'POST', headers: AUTH_HEADER });
    expect(first.status).toBe(200);
    expect(current.status).toBe('suspended');

    const second = await request('/admin/members/m1/suspend', { method: 'POST', headers: AUTH_HEADER });
    expect(second.status).toBe(404);
  });

  it('memulihkan anggota yang ditangguhkan', async () => {
    const admin = loginAs('content_admin', 'admin1');
    const current = profile('suspended', new Date().toISOString());

    db.state.handler = (text) => {
      if (text.includes('FROM users')) return [admin];
      if (text.includes("status = 'suspended'") && text.includes("UPDATE member_profiles")) {
        if (current.status !== 'suspended') return [];
        current.status = 'active';
        return [{ id: 'm1', status: 'active' }];
      }
      return [];
    };

    const res = await request('/admin/members/m1/restore', { method: 'POST', headers: AUTH_HEADER });
    expect(res.status).toBe(200);
    expect(current.status).toBe('active');
  });
});

describe('Alasan penolakan auth yang aman', () => {
  it('mengembalikan TOKEN_MISSING untuk permintaan tanpa sesi', async () => {
    const res = await request('/me');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('TOKEN_MISSING');
    expect(body.error.message).not.toContain('Bearer');
  });

  it('mengembalikan EMAIL_UNVERIFIED untuk email Clerk belum terverifikasi', async () => {
    loginAs('member');
    auth.state.user = { id: 'clerk_u1', email: 'u1@example.com', emailVerified: false };

    const res = await request('/me', { headers: AUTH_HEADER });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('EMAIL_UNVERIFIED');
  });

  it('mengembalikan SERVER_MISCONFIGURED saat CLERK_SECRET_KEY tidak diset', async () => {
    const res = await request('/me', { headers: AUTH_HEADER }, { ...ENV, CLERK_SECRET_KEY: undefined });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('SERVER_MISCONFIGURED');
  });

  it('tidak mencatat token atau email pada log penolakan', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await request('/me', { headers: { Authorization: 'Bearer token-rahasia' } });
    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).toContain('code=TOKEN_MISSING');
    expect(logged).not.toContain('token-rahasia');
    expect(logged).not.toContain('@example.com');
    warn.mockRestore();
  });
});

describe('Lookups publik', () => {
  it('melayani districts tanpa login', async () => {
    db.state.handler = () => [{ id: '35.01.01', name: 'Donorojo' }];
    const res = await request('/lookups/districts');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ name: string }> };
    expect(body.data).toHaveLength(1);
  });

  it('tidak 500 saat database gagal, cukup data kosong', async () => {
    db.state.handler = () => {
      throw new Error('database down');
    };
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request('/lookups/universities');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[] };
    expect(body.data).toEqual([]);
    expect(errorLog.mock.calls.flat().join(' ')).toContain('code=LOOKUP_DB_ERROR');
    errorLog.mockRestore();
  });
});

describe('Turnstile fail-closed', () => {
  it('menolak onboarding bila TURNSTILE_SECRET_KEY tidak diset', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);

    const res = await request(
      '/me/onboarding',
      {
        method: 'POST',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingBody()),
      },
      { ...ENV, TURNSTILE_SECRET_KEY: undefined }
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('BOT_VERIFICATION_FAILED');
  });

  it('menolak onboarding bila siteverify menjawab gagal', async () => {
    const user = loginAs('member');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ success: false }), { status: 200 }))
    );

    const res = await request('/me/onboarding', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify(onboardingBody()),
    });

    expect(res.status).toBe(400);
  });
});
