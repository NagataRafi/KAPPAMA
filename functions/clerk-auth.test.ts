import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchClerkUser,
  issuerFromPublishableKey,
  resetJwksCache,
  verifyClerkSessionToken,
} from './lib/clerk-auth';

const FRONTEND_API = 'clerk.test.example';
const ISSUER = `https://${FRONTEND_API}`;
const PUBLISHABLE_KEY = `pk_test_${btoa(`${FRONTEND_API}$`).replace(/=+$/, '')}`;

let keyPair: CryptoKeyPair;
let publicJwk: JsonWebKey;

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlJson(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

async function signToken(
  payload: Record<string, unknown>,
  signingKey: CryptoKeyPair = keyPair
): Promise<string> {
  const header = { alg: 'RS256', kid: 'test-kid' };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signingKey.privateKey,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  const now = nowSeconds();
  return {
    sub: 'user_uji',
    sid: 'sess_uji',
    iss: ISSUER,
    iat: now - 5,
    nbf: now - 5,
    exp: now + 60,
    ...overrides,
  };
}

function stubJwks(keys: unknown[] = [{ ...publicJwk, kid: 'test-kid' }]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/jwks')) {
        return new Response(JSON.stringify({ keys }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 500 });
    })
  );
}

beforeAll(async () => {
  keyPair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;
  publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
});

beforeEach(() => {
  resetJwksCache();
  vi.unstubAllGlobals();
  stubJwks();
});

describe('Verifikasi token sesi Clerk: kode alasan', () => {
  it('menerima token sah', async () => {
    const result = await verifyClerkSessionToken(await signToken(validPayload()), {
      publishableKey: PUBLISHABLE_KEY,
    });
    expect(result).toEqual({ ok: true, session: { userId: 'user_uji', sessionId: 'sess_uji' } });
  });

  it('menolak token cacat dengan TOKEN_MALFORMED', async () => {
    const result = await verifyClerkSessionToken('bukan.token', { publishableKey: PUBLISHABLE_KEY });
    expect(result).toEqual({ ok: false, code: 'TOKEN_MALFORMED' });
  });

  it('menolak token kedaluwarsa dengan TOKEN_EXPIRED', async () => {
    const token = await signToken(validPayload({ exp: nowSeconds() - 60 }));
    const result = await verifyClerkSessionToken(token, { publishableKey: PUBLISHABLE_KEY });
    expect(result).toEqual({ ok: false, code: 'TOKEN_EXPIRED' });
  });

  it('memberi toleransi 10 detik untuk exp yang baru lewat', async () => {
    const token = await signToken(validPayload({ exp: nowSeconds() - 5 }));
    const result = await verifyClerkSessionToken(token, { publishableKey: PUBLISHABLE_KEY });
    expect(result.ok).toBe(true);
  });

  it('menolak token belum berlaku dengan TOKEN_NOT_YET_VALID', async () => {
    const token = await signToken(validPayload({ nbf: nowSeconds() + 60 }));
    const result = await verifyClerkSessionToken(token, { publishableKey: PUBLISHABLE_KEY });
    expect(result).toEqual({ ok: false, code: 'TOKEN_NOT_YET_VALID' });
  });

  it('memberi toleransi 10 detik untuk nbf yang sedikit di depan', async () => {
    const token = await signToken(validPayload({ nbf: nowSeconds() + 5 }));
    const result = await verifyClerkSessionToken(token, { publishableKey: PUBLISHABLE_KEY });
    expect(result.ok).toBe(true);
  });

  it('menolak issuer asing dengan ISSUER_MISMATCH', async () => {
    const token = await signToken(validPayload({ iss: 'https://clerk.penyerang.example' }));
    const result = await verifyClerkSessionToken(token, { publishableKey: PUBLISHABLE_KEY });
    expect(result).toEqual({ ok: false, code: 'ISSUER_MISMATCH' });
  });

  it('menolak azp di luar daftar dengan AZP_MISMATCH', async () => {
    const token = await signToken(validPayload({ azp: 'https://clerk.penyerang.example' }));
    const result = await verifyClerkSessionToken(token, {
      publishableKey: PUBLISHABLE_KEY,
      authorizedParties: ['https://kappama.example'],
    });
    expect(result).toEqual({ ok: false, code: 'AZP_MISMATCH' });
  });

  it('mengizinkan azp localhost pada instance test (proxy Vite 5173 -> 8788)', async () => {
    const token = await signToken(validPayload({ azp: 'http://localhost:5173' }));
    const result = await verifyClerkSessionToken(token, { publishableKey: PUBLISHABLE_KEY });
    expect(result.ok).toBe(true);
  });

  it('menolak tanda tangan palsu dengan SIGNATURE_INVALID', async () => {
    const token = await signToken(validPayload());
    const parts = token.split('.');
    const forged = `${parts[0]}.${parts[1]}.${base64Url(new Uint8Array([1, 2, 3, 4]))}`;
    const result = await verifyClerkSessionToken(forged, { publishableKey: PUBLISHABLE_KEY });
    expect(result).toEqual({ ok: false, code: 'SIGNATURE_INVALID' });
  });

  it('menolak saat JWKS gagal diambil dengan JWKS_FETCH_FAILED', async () => {
    resetJwksCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({}), { status: 503 }))
    );

    const token = await signToken(validPayload());
    const result = await verifyClerkSessionToken(token, { publishableKey: PUBLISHABLE_KEY });
    expect(result).toEqual({ ok: false, code: 'JWKS_FETCH_FAILED' });
  });
});

describe('Ambil email dari Clerk Backend API', () => {
  it('mengembalikan CLERK_BACKEND_ERROR saat Clerk menjawab gagal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({}), { status: 500 }))
    );
    const result = await fetchClerkUser('user_uji', 'sk_test_dummy');
    expect(result).toEqual({ ok: false, code: 'CLERK_BACKEND_ERROR' });
  });

  it('mengembalikan EMAIL_UNVERIFIED saat email belum terverifikasi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              id: 'user_uji',
              primary_email_address_id: 'idn_1',
              email_addresses: [
                { id: 'idn_1', email_address: 'uji@example.com', verification: { status: 'unverified' } },
              ],
            }),
            { status: 200 }
          )
      )
    );
    const result = await fetchClerkUser('user_uji', 'sk_test_dummy');
    expect(result).toEqual({ ok: false, code: 'EMAIL_UNVERIFIED' });
  });

  it('mengembalikan email terverifikasi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              id: 'user_uji',
              primary_email_address_id: 'idn_1',
              email_addresses: [
                { id: 'idn_1', email_address: 'uji@example.com', verification: { status: 'verified' } },
              ],
            }),
            { status: 200 }
          )
      )
    );
    const result = await fetchClerkUser('user_uji', 'sk_test_dummy');
    expect(result).toEqual({
      ok: true,
      user: { id: 'user_uji', email: 'uji@example.com', emailVerified: true },
    });
  });
});

describe('Issuer dari publishable key', () => {
  it('menurunkan issuer dari pk_test', () => {
    expect(issuerFromPublishableKey(PUBLISHABLE_KEY)).toBe(ISSUER);
  });

  it('mengembalikan null untuk kunci tidak dikenal', () => {
    expect(issuerFromPublishableKey('bukan-kunci')).toBeNull();
  });
});
