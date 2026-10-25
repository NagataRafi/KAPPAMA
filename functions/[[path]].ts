import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { neon } from '@neondatabase/serverless';

export interface Env {
  DATABASE_URL?: string;
  CLERK_SECRET_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  EMAIL_ENABLED?: string;
  BOOTSTRAP_SUPER_ADMIN_EMAIL?: string;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Health Check Endpoint
app.get('/health', async (c) => {
  let dbStatus = 'unconfigured';
  let dbLatencyMs: number | null = null;

  if (c.env?.DATABASE_URL) {
    try {
      const sql = neon(c.env.DATABASE_URL);
      const start = Date.now();
      await sql`SELECT 1 as health_check`;
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch (err: unknown) {
      dbStatus = `error: ${err instanceof Error ? err.message : 'Unknown database error'}`;
    }
  }

  return c.json({
    status: 'ok',
    app: 'kappama-backend',
    version: '0.2.1',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    services: {
      storage: {
        provider: c.env?.CLOUDINARY_API_KEY ? 'cloudinary' : 'mock_storage',
        cloudNameConfigured: Boolean(c.env?.CLOUDINARY_CLOUD_NAME),
      },
      auth: {
        clerkConfigured: Boolean(c.env?.CLERK_SECRET_KEY),
      },
      turnstile: {
        configured: Boolean(c.env?.TURNSTILE_SECRET_KEY),
      },
      email: {
        enabled: c.env?.EMAIL_ENABLED === 'true',
        resendConfigured: Boolean(c.env?.RESEND_API_KEY),
      },
    },
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
