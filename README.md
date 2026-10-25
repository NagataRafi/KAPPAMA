# Website KAPPAMA (Keluarga Pelajar Pacitan di Malang)

Website resmi organisasi kedaerahan KAPPAMA di Malang untuk citra organisasi, pendataan keanggotaan terstruktur, dan fondasi jejaring alumni.

---

## 🛠️ Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Cloudflare Pages Functions (`/functions`) dengan Hono Router
- **Database & ORM:** Neon Serverless PostgreSQL + Drizzle ORM
- **Autentikasi:** Clerk (Google OAuth)
- **Penyimpanan Gambar:** Cloudinary via `StorageService` (Cloudflare R2 disiapkan sebagai adapter v2)
- **Email:** Resend
- **Bot Protection:** Cloudflare Turnstile

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Prasyarat
- Node.js versi 20+ LTS (lihat `.nvmrc` dan `package.json` engines)
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)

### 2. Pemasangan Dependensi
```bash
pnpm install
```

### 3. Konfigurasi Lingkungan
Proyek memisahkan variabel lingkungan frontend dan backend:
1. **Frontend Vite:** Salin `.env.example` ke `.env`
   ```bash
   cp .env.example .env
   ```
2. **Backend Pages Functions:** Salin `.dev.vars.example` ke `.dev.vars` (dibaca oleh Wrangler saat menjalankan fungsi server lokal)
   ```bash
   cp .dev.vars.example .dev.vars
   ```
> **Catatan Keamanan:** Variabel rahasia (`CLERK_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, `CLOUDINARY_API_SECRET`, dll.) hanya diletakkan di `.dev.vars`, sedangkan `.env` hanya untuk variabel `VITE_*` dan `DATABASE_URL` (untuk CLI Drizzle).

### 4. Menjalankan Aplikasi
```bash
# Menjalankan frontend Vite dev server (port 5173)
pnpm dev

# Menjalankan Pages Functions lokal via Wrangler (port 8788)
pnpm dev:functions
```

---

## 📚 Dokumentasi Proyek
Seluruh dokumentasi rinci tersedia di berkas `.md` root repositori:
- [PRD.md](PRD.md): Dokumen Persyaratan Produk utama (Single Source of Truth).
- [tujuan.md](tujuan.md): Latar belakang, 3 pilar, KPI, dan batasan ruang lingkup.
- [arsitektur.md](arsitektur.md): Arsitektur edge, alur otorisasi, dan catatan keputusan (ADR).
- [agents.md](agents.md): Panduan instruksi untuk agen AI pengembang.
- [database-schema.md](database-schema.md): Skema database, ERD, dan master data wilayah.
- [api-spec.md](api-spec.md): Spesifikasi kontrak endpoint REST API.
- [design-system.md](design-system.md): Token warna, tipografi, dan pemetaan desain referensi.
- [security-privacy.md](security-privacy.md): Kepatuhan UU PDP No. 27/2022 dan protokol keamanan.
- [deployment.md](deployment.md): Panduan deployment Cloudflare Pages & checklist domain kustom.
- [testing-checklist.md](testing-checklist.md): Matriks pengujian fungsional dan batas waktu.
- [roadmap.md](roadmap.md): Pelacakan fase pengerjaan dan backlog fitur.
