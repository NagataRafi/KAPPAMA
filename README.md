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
   Isi `.env` hanya tiga variabel (semuanya terbaca browser, jadi tidak boleh berisi rahasia):
   - `DATABASE_URL` — dipakai Drizzle Kit CLI di lokal.
   - `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (`pk_test_…` / `pk_live_…`).
   - `VITE_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key.
2. **Backend Pages Functions:** Salin `.dev.vars.example` ke `.dev.vars` (dibaca oleh Wrangler saat menjalankan fungsi server lokal)
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Isi `.dev.vars`:
   - `DATABASE_URL`
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (atau `CLOUDINARY_URL`)
   - `BOOTSTRAP_SUPER_ADMIN_EMAIL`
   - `EMAIL_ENABLED` (`false` selama domain kustom belum aktif)
   - `RESEND_API_KEY` dan `RESEND_FROM_EMAIL` hanya dibutuhkan saat `EMAIL_ENABLED=true`.
> **Catatan Keamanan:** Variabel rahasia (`CLERK_SECRET_KEY`, `TURNSTILE_SECRET_KEY`,
> `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`) hanya diletakkan di `.dev.vars`. Dilarang memakai awalan
> `VITE_` untuk variabel rahasia karena seluruh nilai `VITE_*` ikut masuk bundle browser.
> Bila `VITE_CLERK_PUBLISHABLE_KEY` kosong, aplikasi tetap menampilkan semua halaman publik dengan
> pemberitahuan "Konfigurasi login belum lengkap" — tidak ada kunci contoh yang dipakai sebagai fallback.

### 4. Menjalankan Aplikasi
```bash
# Menjalankan frontend Vite dev server (port 5173)
pnpm dev

# Menjalankan Pages Functions lokal via Wrangler (port 8788)
pnpm dev:functions
```

### 5. Seed Data Master
```bash
pnpm db:seed
```
Mengisi 12 kecamatan + 172 desa/kelurahan Pacitan (sumber: BPS SIG Bridging API, LPPD 2024 Tabel 1.4, Perda Pacitan No. 6/2022), kampus, prodi, industri, periode, dan profil organisasi. Skrip idempotent.

Seed anggota dummy terpisah dan **tidak** dijalankan otomatis:
```bash
SEED_DUMMY_MEMBERS=true node db/seed-members.js
```
Semua baris dummy ditandai `users.clerk_user_id` berawalan `user_dummy_`; hapus dengan `DELETE FROM users WHERE clerk_user_id LIKE 'user_dummy_%';`.

### 6. Verifikasi Sesi & Turnstile
- Sesi Clerk diverifikasi di server lewat JWKS + Clerk Backend API; header `X-Clerk-User-Id`/`X-User-Email` tidak dipakai.
- Onboarding fail-closed: tanpa `TURNSTILE_SECRET_KEY` atau saat `siteverify` gagal, pendaftaran ditolak `400 BOT_VERIFICATION_FAILED`.

---

## 🔐 Panel Admin Konten (`/admin`)

Hanya untuk peran `content_admin` dan `super_admin` (diperiksa di server dari tabel `users`). Rute tersedia:

| Rute | Fungsi |
|---|---|
| `/admin` | Dashboard ringkasan (pendaftar menunggu, jumlah konten) |
| `/admin/persetujuan` | Antrean persetujuan anggota |
| `/admin/program-kerja` · `/admin/program-kerja/:id` | CRUD program kerja, banyak foto, sematan YouTube |
| `/admin/galeri` · `/admin/galeri/:id` | CRUD album, banyak foto, sematan YouTube |
| `/admin/profil-organisasi` | Tentang, Visi, Misi, kontak, logo |
| `/admin/struktur` | Periode kepengurusan dan 4 jabatan inti |
| `/admin/ad-art` | Unggah PDF AD/ART, status aktif, tautan cadangan |

Unggahan memakai signed upload Cloudinary (`POST /api/admin/uploads/signature`); server memvalidasi tipe dan ukuran (gambar JPG/PNG/WebP ≤ 5 MB, PDF ≤ 10 MB) dan tidak pernah mengirim `CLOUDINARY_API_SECRET` ke browser. Draf tidak tampil di halaman publik. Bila Cloudinary belum dikonfigurasi, unggahan membalas `503 STORAGE_NOT_CONFIGURED`; AD/ART masih dapat memakai tautan Google Drive atau berkas `public/docs/`.

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
