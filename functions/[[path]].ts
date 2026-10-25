import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { neon } from '@neondatabase/serverless';
import { parseCloudinaryUrl } from '../shared/services/storage/cloudinary-storage';

export interface Env {
  // Database
  DATABASE_URL?: string;
  DATABASE_URL_UNPOOLED?: string;

  // Clerk Auth
  CLERK_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string; // Fallback alias
  CLERK_SECRET_KEY?: string;

  // Turnstile
  TURNSTILE_SECRET_KEY?: string;
  VITE_TURNSTILE_SECRET_KEY?: string; // Fallback alias (dengan peringatan keamanan)

  // Cloudinary
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_URL?: string; // Fallback format URL

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

  const turnstileSecretKey = env?.TURNSTILE_SECRET_KEY || env?.VITE_TURNSTILE_SECRET_KEY;

  return {
    databaseUrl: env?.DATABASE_URL,
    clerk: {
      isConfigured: Boolean(clerkSecretKey),
      publishableKey: clerkPublishableKey,
    },
    turnstile: {
      isConfigured: Boolean(turnstileSecretKey),
      usingVitePrefix: Boolean(!env?.TURNSTILE_SECRET_KEY && env?.VITE_TURNSTILE_SECRET_KEY),
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

// Health Check Endpoint
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

  // Tampilkan peringatan konfigurasi bila ada fallback berisiko
  const warnings: string[] = [];
  if (config.turnstile.usingVitePrefix) {
    warnings.push(
      'Variabel Turnstile terbaca dengan nama VITE_TURNSTILE_SECRET_KEY. Harap ganti menjadi TURNSTILE_SECRET_KEY di .dev.vars agar tidak terekspos ke klien.'
    );
  }

  return c.json({
    status: 'ok',
    app: 'kappama-backend',
    version: '0.2.1',
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
    warnings: warnings.length > 0 ? warnings : undefined,
  });
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
