# Catatan Perubahan (Changelog) — Website KAPPAMA

Seluruh perubahan penting pada proyek ini didokumentasikan di berkas ini.
Format ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan mematuhi [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]
### Direncanakan
- Fase 2: Implementasi Design System lengkap, tata letak publik, Beranda, 4 sub-menu Profil, Program Kerja, dan Galeri.

---

## [0.2.0] - 2026-10-25
### Ditambahkan
- Scaffold proyek Vite + React 18 + TypeScript + Tailwind CSS.
- Cloudflare Pages Functions (`/functions/[[path]].ts`) dengan Hono API router dan endpoint `/api/health`.
- Skema database 17 tabel Drizzle ORM (`db/schema.ts`) dan generasi migrasi SQL perdana (`db/migrations/0000_solid_talos.sql`).
- Utilitas `getEffectiveStatus()` beserta unit test Vitest lengkap (100% lulus untuk skenario 23:59, 24:00, 24:01, rejected, resubmit).
- Skema validasi Zod onboarding (`shared/schema/member-schema.ts`) dan interface TypeScript (`shared/types/index.ts`).
- Konfigurasi Cloudflare Pages R2 binding di `wrangler.toml`.
- Setup pipeline CI GitHub Actions (`.github/workflows/ci.yml`).
- Berkas master data wilayah Pacitan (`db/seed/pacitan-districts.json`).

---

## [0.1.0] - 2026-10-25
### Ditambahkan
- Inisialisasi repositori dan perumusan dokumen PRD v1.1.
- Pembuatan dokumen Fase 0 (Fondasi Dokumentasi):
  - `tujuan.md`: Penjabaran latar belakang, 3 pilar, KPI, aktor, dan ruang lingkup non-goals.
  - `arsitektur.md`: Diagram sistem, topologi edge, alur request, ADR teknis, dan logika lazy auto-approve 24 jam.
  - `agents.md` & `AGENTS.md`: Pedoman instruksi kerja untuk AI agent (Antigravity & OpenCode).
  - `changelog.md`: Format pencatatan riwayat perubahan versi.
  - `database-schema.md`: Rancangan ERD, definisi tabel, indexing, soft-delete, dan sumber master data Pacitan.
  - `api-spec.md`: Kontrak spesifikasi endpoint REST API (`/api/*`), skema input Zod, dan respon error.
  - `design-system.md`: Spesifikasi token visual (Navy, Gold Soga), tipografi, komponen shadcn/ui, dan motif batik Pacitan.
  - `security-privacy.md`: Kepatuhan UU PDP No. 27/2022, model ancaman, pencegahan IDOR/XSS, dan prosedur pergantian pengurus.
  - `deployment.md`: Panduan konfigurasi Cloudflare Pages, R2, Neon, Clerk, Turnstile, Resend, dan checklist rilis.
  - `testing-checklist.md`: Matriks uji fungsional, pengujian waktu auto-approve, akses terlarang, dan mobile.
  - `roadmap.md`: Pelacakan progres fase, daftar pertanyaan terbuka, backlog v2, dan mitigasi risiko.
