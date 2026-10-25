import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

export interface Env {
  DATABASE_URL?: string;
  VITE_CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  R2_STORAGE?: R2Bucket;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_ENABLED?: string;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Health Check Endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'kappama-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    environment: {
      hasDatabaseUrl: Boolean(c.env?.DATABASE_URL),
      hasR2Bucket: Boolean(c.env?.R2_STORAGE),
      hasClerkKey: Boolean(c.env?.CLERK_SECRET_KEY),
      emailEnabled: c.env?.EMAIL_ENABLED === 'true',
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
