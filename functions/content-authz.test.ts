import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Tiruan Neon: tagged template mengembalikan thenable; handler mengatur baris.
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
    auth.state.session ? { ok: true, session: auth.state.session } : { ok: false, code: 'TOKEN_MISSING' },
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
};

const STORAGE_ENV = {
  ...ENV,
  CLOUDINARY_CLOUD_NAME: 'kappama-test',
  CLOUDINARY_API_KEY: '123456789',
  CLOUDINARY_API_SECRET: 'dummy-secret',
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

function jsonRequest(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

beforeEach(() => {
  db.state.handler = null;
  db.state.queries = [];
  auth.state.session = null;
  auth.state.user = null;
});

describe('Admin konten: otorisasi', () => {
  const adminPaths: Array<[string, RequestInit]> = [
    ['/admin/content/summary', { headers: AUTH_HEADER }],
    ['/admin/content/org', { headers: AUTH_HEADER }],
    ['/admin/content/programs', { headers: AUTH_HEADER }],
    ['/admin/content/albums', { headers: AUTH_HEADER }],
    ['/admin/content/bylaws', { headers: AUTH_HEADER }],
    ['/admin/content/periods', { headers: AUTH_HEADER }],
    ['/admin/content/leaders', { headers: AUTH_HEADER }],
    ['/admin/uploads/signature', jsonRequest({ kind: 'program', contentType: 'image/png', bytes: 1000 })],
  ];

  it('menolak pengunjung anonim dengan 401 di semua endpoint admin konten', async () => {
    for (const [path, init] of adminPaths) {
      const res = await request(path, { ...init, headers: { 'Content-Type': 'application/json' } });
      expect(res.status, path).toBe(401);
    }
    expect(db.state.queries).toHaveLength(0);
  });

  it('menolak anggota biasa dengan 403 di semua endpoint admin konten', async () => {
    for (const [path, init] of adminPaths) {
      loginAs('member');
      db.state.handler = (text) => (text.includes('FROM users') ? [loginAs('member')] : []);
      const res = await request(path, init);
      expect(res.status, path).toBe(403);
    }
  });

  it('mengizinkan Admin Konten membaca ringkasan dan daftar program', async () => {
    const user = loginAs('content_admin');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);

    const summary = await request('/admin/content/summary', { headers: AUTH_HEADER });
    expect(summary.status).toBe(200);
    const summaryBody = (await summary.json()) as { data: { pendingMembers: number } };
    expect(summaryBody.data.pendingMembers).toBe(0);

    const programs = await request('/admin/content/programs', { headers: AUTH_HEADER });
    expect(programs.status).toBe(200);
    const programsBody = (await programs.json()) as { data: unknown[] };
    expect(programsBody.data).toEqual([]);
  });

  it('mengizinkan Super Admin membaca periode', async () => {
    const user = loginAs('super_admin');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);

    const res = await request('/admin/content/periods', { headers: AUTH_HEADER });
    expect(res.status).toBe(200);
  });
});

describe('Admin konten: validasi unggahan', () => {
  it('menolak tipe berkas yang tidak diizinkan dengan 422', async () => {
    const user = loginAs('content_admin');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);

    const res = await request(
      '/admin/uploads/signature',
      jsonRequest({ kind: 'program', contentType: 'text/plain', bytes: 1000 })
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('menolak gambar melebihi 5 MB dengan 422', async () => {
    const user = loginAs('content_admin');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);

    const res = await request(
      '/admin/uploads/signature',
      jsonRequest({ kind: 'program', contentType: 'image/jpeg', bytes: 6 * 1024 * 1024 })
    );
    expect(res.status).toBe(422);
  });

  it('menolak AD/ART selain PDF dengan 422', async () => {
    const user = loginAs('content_admin');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);

    const res = await request(
      '/admin/uploads/signature',
      jsonRequest({ kind: 'bylaws', contentType: 'image/png', bytes: 1000 })
    );
    expect(res.status).toBe(422);
  });

  it('mengembalikan 503 saat penyimpanan belum dikonfigurasi', async () => {
    const user = loginAs('content_admin');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);

    const res = await request(
      '/admin/uploads/signature',
      jsonRequest({ kind: 'program', contentType: 'image/png', bytes: 1000 })
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('STORAGE_NOT_CONFIGURED');
  });

  it('memberi signature untuk gambar valid dan PDF valid', async () => {
    const user = loginAs('content_admin');
    db.state.handler = (text) => (text.includes('FROM users') ? [user] : []);

    const image = await request(
      '/admin/uploads/signature',
      jsonRequest({ kind: 'album', contentType: 'image/webp', bytes: 2048 }),
      STORAGE_ENV
    );
    expect(image.status).toBe(200);
    const imageBody = (await image.json()) as { data: { uploadUrl: string; signature: string } };
    expect(imageBody.data.uploadUrl).toContain('/image/upload');
    expect(imageBody.data.signature).toHaveLength(40);

    const pdf = await request(
      '/admin/uploads/signature',
      jsonRequest({ kind: 'bylaws', contentType: 'application/pdf', bytes: 2048 }),
      STORAGE_ENV
    );
    expect(pdf.status).toBe(200);
    const pdfBody = (await pdf.json()) as { data: { uploadUrl: string } };
    expect(pdfBody.data.uploadUrl).toContain('/auto/upload');
  });
});

describe('Konten publik: draft tidak bocor', () => {
  it('hanya meminta program berstatus published dan belum dihapus', async () => {
    db.state.handler = () => [];

    const res = await request('/public/programs');
    expect(res.status).toBe(200);

    const query = db.state.queries.map((item) => item.text).join('\n');
    expect(query).toContain("p.status = 'published'");
    expect(query).toContain('p.deleted_at IS NULL');
  });

  it('hanya meminta album berstatus published dan belum dihapus', async () => {
    db.state.handler = () => [];

    const res = await request('/public/albums');
    expect(res.status).toBe(200);

    const query = db.state.queries.map((item) => item.text).join('\n');
    expect(query).toContain("a.status = 'published'");
    expect(query).toContain('a.deleted_at IS NULL');
  });

  it('mengembalikan 404 untuk slug program draf atau tidak ada', async () => {
    db.state.handler = () => [];

    const res = await request('/public/programs/program-draf');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('mengembalikan 404 untuk slug album draf atau tidak ada', async () => {
    db.state.handler = () => [];

    const res = await request('/public/albums/album-draf');
    expect(res.status).toBe(404);
  });

  it('tidak menampilkan data anggota pada statistik publik', async () => {
    db.state.handler = () => [
      { active_members: 5, alumni: 2, programs: 3, universities: 4 },
    ];

    const res = await request('/public/stats');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(Object.keys(body.data).sort()).toEqual(['activeMembers', 'alumni', 'programs', 'universities']);
  });
});
