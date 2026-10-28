// Kunci Clerk wajib berasal dari .env (VITE_CLERK_PUBLISHABLE_KEY). Tanpa fallback:
// kunci contoh membuat Clerk gagal boot dan halaman jadi putih.
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

export const CLERK_PUBLISHABLE_KEY = publishableKey ? publishableKey : null;
export const isClerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY);
export const TURNSTILE_SITE_KEY = turnstileSiteKey ? turnstileSiteKey : null;
