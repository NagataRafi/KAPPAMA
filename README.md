# Website KAPPAMA (Keluarga Pelajar Pacitan di Malang)

Website resmi organisasi kedaerahan KAPPAMA di Malang untuk citra organisasi, pendataan keanggotaan terstruktur, dan fondasi jejaring alumni.

---

## 🛠️ Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Cloudflare Pages Functions (`/functions`) dengan Hono Router
- **Database & ORM:** Neon Serverless PostgreSQL + Drizzle ORM
- **Autentikasi:** Clerk (Google OAuth)
- **Penyimpanan Berkas:** Cloudflare R2
- **Email:** Resend
- **Bot Protection:** Cloudflare Turnstile

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Prasyarat
- Node.js versi 18 atau 20 LTS
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)

### 2. Pemasangan Dependensi
```bash
pnpm install
```

### 3. Konfigurasi Lingkungan
Salin `.env.example` ke `.env` dan lengkapi kredensial lokal:
```bash
cp .env.example .env
```

### 4. Menjalankan Aplikasi
```bash
# Menjalankan frontend Vite dev server
pnpm dev

# Menjalankan Pages Functions lokal
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
