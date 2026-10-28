/**
 * Verifikasi sesi Clerk di sisi server tanpa mempercayai header klien.
 * Token diverifikasi lewat JWKS Clerk (RS256), lalu email diambil dari Clerk
 * Backend API agar hanya email terverifikasi yang dipakai untuk bootstrap admin.
 */

const JWKS_URL = 'https://api.clerk.com/v1/jwks';
const JWKS_TTL_MS = 5 * 60 * 1000;

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

let cachedKeys: { keys: Jwk[]; fetchedAt: number } | null = null;

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

/** Verifikasi tanda tangan dan masa berlaku JWT sesi Clerk. */
export async function verifyClerkSessionToken(token: string): Promise<ClerkSession | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(parts[0]);
  const payload = decodeBase64UrlJson<{
    sub?: string;
    sid?: string;
    exp?: number;
    nbf?: number;
  }>(parts[1]);
  if (!header || !payload || header.alg !== 'RS256' || !payload.sub) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp <= now) return null;
  if (typeof payload.nbf === 'number' && payload.nbf > now) return null;

  try {
    const keys = await getSigningKeys();
    const jwk = keys.find((key) => key.kid === header.kid) ?? keys[0];
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(parts[2]) as BufferSource,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) return null;
  } catch {
    return null;
  }

  return { userId: payload.sub, sessionId: payload.sid ?? null };
}

export interface ClerkUser {
  id: string;
  email: string | null;
  emailVerified: boolean;
}

/** Ambil email utama dari Clerk Backend API dan pastikan statusnya terverifikasi. */
export async function fetchClerkUser(userId: string, secretKey?: string): Promise<ClerkUser | null> {
  if (!secretKey) return null;

  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) return null;

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

    return {
      id: body.id ?? userId,
      email: primary?.email_address ?? null,
      emailVerified: primary?.verification?.status === 'verified',
    };
  } catch {
    return null;
  }
}
