import { defineConfig } from 'drizzle-kit';

// Prioritaskan DATABASE_URL_UNPOOLED / DIRECT_URL untuk migrasi DDL jika tersedia
const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  '';

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
});
