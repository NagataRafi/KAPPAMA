# Panduan Deployment & Operasional — Website KAPPAMA

Dokumen ini memandu konfigurasi infrastruktur, environment variables, proses CI/CD, migrasi database, dan prosedur peluncuran ke domain kustom.

---

## 1. Daftar Kebutuhan Layanan (Free Tier)
1. **Cloudflare Pages:** Hosting antarmuka Vite/React + runtime Pages Functions.
2. **Cloudinary (Free Tier):** Penyimpanan foto teroptimasi via `StorageService` (Cloudflare R2 ditunda sebagai adapter cadangan).
3. **Cloudflare Turnstile:** Proteksi bot captcha transparan.
4. **Neon Serverless PostgreSQL:** Database cloud relasional.
5. **Clerk:** Otentikasi identitas pengguna (Google OAuth).
6. **Resend:** Pengiriman email transaksional status keanggotaan.

---

## 2. Environment Variables & Rahasia

Proyek memisahkan konfigurasi frontend dan backend sesuai arsitektur Cloudflare Pages:
- **Frontend Klien (Vite):** Disimpan di `.env` (hanya variabel berawalan `VITE_*`).
- **Backend Server (Pages Functions):** Disimpan di `.dev.vars` untuk pengujian lokal Wrangler, dan dikonfigurasi di dashboard Cloudflare Pages Settings -> Environment Variables untuk produksi.

### 2.1 File `.env` (Frontend Klien Lokal)
```bash
# Database connection untuk CLI Drizzle Kit lokal
DATABASE_URL="postgresql://<user>:<password>@<ep-pooler>.neon.tech/kappama?sslmode=require"

# Clerk Publishable Key (Frontend)
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Turnstile Test Sitekey (Always Passes untuk dev lokal)
VITE_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
```

### 2.2 File `.dev.vars` (Backend Pages Functions Lokal)
```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://<user>:<password>@<ep-pooler>.neon.tech/kappama?sslmode=require"

# Clerk Auth (Server)
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Turnstile Test Secret Key (Always Passes untuk dev lokal)
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"

# Cloudinary StorageService
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
# Alternatif: CLOUDINARY_URL="cloudinary://<key>:<secret>@<cloud_name>"

# Resend Email Service
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="KAPPAMA <no-reply@kappama.org>"
EMAIL_ENABLED="false"

# Bootstrap Akses Pengurus Inti Pertama Kali
BOOTSTRAP_SUPER_ADMIN_EMAIL="rafi.nagata@example.com"
```

---

## 3. Langkah Konfigurasi Layanan Awal

### 3.1 Setup Cloudinary
1. Buat akun gratis di [cloudinary.com](https://cloudinary.com).
2. Dari Dashboard Cloudinary, salin **Cloud Name**, **API Key**, dan **API Secret**.
3. Simpan nilai ini ke `.dev.vars` (lokal) dan Cloudflare Pages Environment Variables (produksi).

### 3.2 Setup Neon PostgreSQL & Migrasi
1. Buat proyek baru di Neon Console dengan nama `kappama-db`.
2. Salin *Connection String* pooled mode.
3. Jalankan migrasi skema awal dari komputer pengembang:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

### 3.3 Bootstrap Super Admin Pertama
1. Pengurus inti login pertama kali menggunakan akun Google yang email-nya terdaftar pada `BOOTSTRAP_SUPER_ADMIN_EMAIL`.
2. Middleware backend mendeteksi kecocokan email pada saat onboarding pertama kali, lalu secara otomatis memberikan peran `role = 'super_admin'` dan status `active`.
3. Setelah Super Admin pertama aktif, Super Admin tersebut dapat mengangkat pengurus lain melalui menu `/admin/peran`.

---

## 4. Checklist Migrasi ke Domain Kustom & Clerk Production

Selama Fase 1–5, aplikasi berjalan di subdomain `*.pages.dev` menggunakan Clerk Development Instance dan fitur email dinonaktifkan (`EMAIL_ENABLED="false"`).

Ketika domain resmi KAPPAMA (misal: `kappama.org` atau `kappama.id`) telah dibeli (Fase 6), ikuti checklist migrasi berikut:

- [ ] **1. Cloudflare DNS & Pages Custom Domain:** Hubungkan domain kustom ke proyek Cloudflare Pages.
- [ ] **2. Clerk Production Migration:** Konfigurasikan CNAME di Cloudflare DNS dan perbarui ke live keys (`pk_live_...`, `sk_live_...`).
- [ ] **3. Resend Domain Verification:** Verifikasi SPF/DKIM/DMARC di DNS Cloudflare, lalu aktifkan `EMAIL_ENABLED="true"`.
- [ ] **4. Cloudflare Turnstile:** Ganti kunci uji dengan kunci produksi domain asli.
- [ ] **5. Pengujian Alur Penuh:** Uji alur pendaftaran dari pendaftar nyata.

---

## 5. Prosedur Pencadangan (Backup) & Rollback

- **Pencadangan Database:**
  - Manfaatkan fitur point-in-time restore atau branch snapshot pada Neon Console sebelum melakukan migrasi skema mayor.
- **Rollback Deployment:**
  - Jika terjadi kendala pada rilis terbaru di Cloudflare Pages, buka tab **Deployments** di dashboard Cloudflare Pages, pilih commit stabil sebelumnya, lalu klik **Rollback to this deployment**.
