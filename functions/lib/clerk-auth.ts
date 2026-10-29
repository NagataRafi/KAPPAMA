/**
 * Verifikasi sesi Clerk di sisi server tanpa mempercayai header klien.
 * Token diverifikasi lewat JWKS Clerk (RS256), lalu email diambil dari Clerk
 * Backend API agar hanya email terverifikasi yang dipakai untuk bootstrap admin.
 *
 * Setiap penolakan mengembalikan kode alasan yang aman (tanpa rahasia) supaya
 * klien bisa menampilkan pesan yang tepat dan log server mudah ditelusuri.
 */

const JWKS_URL = 'https://api.clerk.com/v1/jwks';
const JWKS_TTL_MS = 5 * 60 * 1000;
// Toleransi selisih jam perangkat/klien terhadap server.
const CLOCK_LEEWAY_SECONDS = 10;

export type AuthErrorCode =
  | 'TOKEN_MISSING'
  | 'TOKEN_MALFORMED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_NOT_YET_VALID'
  | 'ISSUER_MISMATCH'
  | 'AZP_MISMATCH'
  | 'SIGNATURE_INVALID'
  | 'JWKS_FETCH_FAILED'
  | 'EMAIL_UNVERIFIED'
  | 'CLERK_BACKEND_ERROR';

/** Pesan aman untuk klien. Tidak pernah memuat token atau email. */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  TOKEN_MISSING: 'Sesi login tidak ditemukan. Silakan login ulang.',
  TOKEN_MALFORMED: 'Sesi login tidak valid. Silakan login ulang.',
  TOKEN_EXPIRED: 'Sesi login sudah kedaluwarsa. Silakan login ulang.',
  TOKEN_NOT_YET_VALID: 'Jam perangkat tidak cocok dengan server. Periksa jam perangkat lalu coba lagi.',
  ISSUER_MISMATCH: 'Sesi login berasal dari aplikasi lain. Silakan login ulang.',
  AZP_MISMATCH: 'Sesi login tidak cocok dengan aplikasi ini. Silakan login ulang.',
  SIGNATURE_INVALID: 'Tanda tangan sesi login tidak valid. Silakan login ulang.',
  JWKS_FETCH_FAILED: 'Server tidak dapat memverifikasi sesi saat ini. Coba lagi beberapa saat.',
  EMAIL_UNVERIFIED: 'Email akun belum terverifikasi. Verifikasi email Anda di Clerk lalu coba lagi.',
  CLERK_BACKEND_ERROR: 'Server gagal memeriksa akun Anda. Coba lagi beberapa saat.',
};

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

let cachedKeys: { keys: Jwk[]; fetchedAt: number } | null = null;

/** Hanya untuk pengujian: paksa JWKS diambil ulang. */
export function resetJwksCache(): void {
  cachedKeys = null;
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeBase64UrlJson<T>(value: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as T;
  } catch {
    return null;
  }
}

function decodeBase64UrlText(value: string): string | null {
  try {
    return new TextDecoder().decode(base64UrlToBytes(value));
  } catch {
    return null;
  }
}

/**
 * Issuer Clerk diturunkan dari publishable key (bukan dari klaim token).
 * Contoh: pk_test_<base64("clerk.contoh.dev$")> -> https://clerk.contoh.dev
 */
export function issuerFromPublishableKey(publishableKey?: string): string | null {
  if (!publishableKey) return null;
  const match = /^pk_(?:test|live)_(.+)$/.exec(publishableKey.trim());
  if (!match) return null;
  const decoded = decodeBase64UrlText(match[1]);
  if (!decoded) return null;
  const host = decoded.replace(/\$+$/, '').trim();
  if (!host) return null;
  return /^https?:\/\//i.test(host) ? host.replace(/\/+$/, '') : `https://${host}`;
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function sameOrigin(a: string, b: string): boolean {
  const urlA = parseUrl(a);
  const urlB = parseUrl(b);
  if (!urlA || !urlB) return a.trim() === b.trim();
  return urlA.origin === urlB.origin;
}

function isLoopbackHost(value: string): boolean {
  const host = parseUrl(value)?.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * Pemeriksaan azp (authorized party). Daftar origin eksplisit menang bila diisi
 * lewat CLERK_AUTHORIZED_PARTIES. Tanpa daftar itu, izinkan origin frontend API
 * Clerk dan, pada instance test, origin loopback (Vite 5173 -> wrangler 8788).
 */
function isAuthorizedPartyAllowed(
  azp: string,
  publishableKey: string | undefined,
  authorizedParties: string[] | undefined
): boolean {
  const configured = (authorizedParties ?? []).map((party) => party.trim()).filter(Boolean);
  if (configured.length > 0) {
    return configured.some((party) => sameOrigin(party, azp));
  }

  const issuer = issuerFromPublishableKey(publishableKey);
  if (!issuer) return true;
  if (sameOrigin(issuer, azp)) return true;

  const isTestInstance = publishableKey?.startsWith('pk_test_') ?? false;
  return isTestInstance && isLoopbackHost(azp);
}

async function getSigningKeys(): Promise<Jwk[]> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < JWKS_TTL_MS) {
    return cachedKeys.keys;
  }
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error('Gagal mengambil JWKS Clerk');
  const body = (await res.json()) as { keys?: Jwk[] };
  const keys = body.keys ?? [];
  cachedKeys = { keys, fetchedAt: Date.now() };
  return keys;
}

export interface ClerkSession {
  userId: string;
  sessionId: string | null;
}

export type ClerkVerifyResult =
  | { ok: true; session: ClerkSession }
  | { ok: false; code: AuthErrorCode };

export interface ClerkVerifyOptions {
  /** CLERK_PUBLISHABLE_KEY; dipakai menurunkan issuer dan mode test. */
  publishableKey?: string;
  /** Daftar origin yang sah, mis. dari env CLERK_AUTHORIZED_PARTIES. */
  authorizedParties?: string[];
}

function fail(code: AuthErrorCode): ClerkVerifyResult {
  return { ok: false, code };
}

/** Verifikasi tanda tangan, masa berlaku, issuer, dan azp JWT sesi Clerk. */
export async function verifyClerkSessionToken(
  token: string,
  options: ClerkVerifyOptions = {}
): Promise<ClerkVerifyResult> {
  const parts = token.split('.');
  if (parts.length !== 3) return fail('TOKEN_MALFORMED');

  const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(parts[0]);
  const payload = decodeBase64UrlJson<{
    sub?: string;
    sid?: string;
    exp?: number;
    nbf?: number;
    iat?: number;
    iss?: string;
    azp?: string;
  }>(parts[1]);
  if (!header || !payload || header.alg !== 'RS256' || !payload.sub) {
    return fail('TOKEN_MALFORMED');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp + CLOCK_LEEWAY_SECONDS <= now) {
    return fail('TOKEN_EXPIRED');
  }
  if (
    (typeof payload.nbf === 'number' && payload.nbf - CLOCK_LEEWAY_SECONDS > now) ||
    (typeof payload.iat === 'number' && payload.iat - CLOCK_LEEWAY_SECONDS > now)
  ) {
    return fail('TOKEN_NOT_YET_VALID');
  }

  const expectedIssuer = issuerFromPublishableKey(options.publishableKey);
  if (expectedIssuer && typeof payload.iss === 'string' && !sameOrigin(payload.iss, expectedIssuer)) {
    return fail('ISSUER_MISMATCH');
  }
  if (
    typeof payload.azp === 'string' &&
    !isAuthorizedPartyAllowed(payload.azp, options.publishableKey, options.authorizedParties)
  ) {
    return fail('AZP_MISMATCH');
  }

  let keys: Jwk[];
  try {
    keys = await getSigningKeys();
  } catch {
    return fail('JWKS_FETCH_FAILED');
  }

  const jwk = (header.kid ? keys.find((key) => key.kid === header.kid) : keys[0]) ?? null;
  if (!jwk) return fail('JWKS_FETCH_FAILED');

  let valid = false;
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(parts[2]) as BufferSource,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
  } catch {
    return fail('SIGNATURE_INVALID');
  }
  if (!valid) return fail('SIGNATURE_INVALID');

  return { ok: true, session: { userId: payload.sub, sessionId: payload.sid ?? null } };
}

export interface ClerkUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export type ClerkUserResult =
  | { ok: true; user: ClerkUser }
  | { ok: false; code: 'EMAIL_UNVERIFIED' | 'CLERK_BACKEND_ERROR' };

/** Ambil email utama dari Clerk Backend API dan pastikan statusnya terverifikasi. */
export async function fetchClerkUser(
  userId: string,
  secretKey?: string
): Promise<ClerkUserResult> {
  if (!secretKey) return { ok: false, code: 'CLERK_BACKEND_ERROR' };

  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) return { ok: false, code: 'CLERK_BACKEND_ERROR' };

    const body = (await res.json()) as {
      id?: string;
      primary_email_address_id?: string | null;
      email_addresses?: Array<{
        id: string;
        email_address: string;
        verification?: { status?: string } | null;
      }>;
    };

    const addresses = body.email_addresses ?? [];
    const primary =
      addresses.find((address) => address.id === body.primary_email_address_id) ?? addresses[0];

    if (!primary?.email_address || primary.verification?.status !== 'verified') {
      return { ok: false, code: 'EMAIL_UNVERIFIED' };
    }

    return {
      ok: true,
      user: {
        id: body.id ?? userId,
        email: primary.email_address,
        emailVerified: true,
      },
    };
  } catch {
    return { ok: false, code: 'CLERK_BACKEND_ERROR' };
  }
}
