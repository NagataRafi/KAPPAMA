# Panduan Deployment & Operasional — Website KAPPAMA

Dokumen ini memandu konfigurasi infrastruktur, environment variables, proses CI/CD, migrasi database, dan prosedur peluncuran ke domain kustom.

---

## 1. Daftar Kebutuhan Layanan (Free Tier)
1. **Cloudflare Pages:** Hosting antarmuka Vite/React + runtime Pages Functions.
2. **Cloudflare R2:** Bucket penyimpanan file media/gambar dan PDF AD/ART.
3. **Cloudflare Turnstile:** Proteksi bot captcha transparan.
4. **Neon Serverless PostgreSQL:** Database cloud relasional.
5. **Clerk:** Otentikasi identitas pengguna (Google OAuth).
6. **Resend:** Pengiriman email transaksional status keanggotaan.

---

## 2. Environment Variables & Rahasia

Buat berkas `.env` lokal untuk pengembangan (dilarang commit ke git). Konfigurasikan variabel yang sama di dashboard Cloudflare Pages Settings -> Environment Variables.

```bash
# ==============================================================================
# ENVIRONMENT VARIABLES - WEBSITE KAPPAMA
# ==============================================================================

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://<user>:<password>@<ep-pooler>.neon.tech/kappama?sslmode=require"

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Cloudflare Turnstile
VITE_TURNSTILE_SITE_KEY="0x4AAAAAA..."
TURNSTILE_SECRET_KEY="0x4AAAAAA..."

# Cloudflare R2 Bucket Binding (Dikonfigurasi via Cloudflare Dashboard / wrangler.toml)
# Bucket Name: kappama-media
R2_BUCKET_NAME="kappama-media"

# Resend Email Service
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="KAPPAMA <no-reply@kappama.org>"
EMAIL_ENABLED="false" # Ubah ke 'true' setelah domain terverifikasi di Resend

# Bootstrap Akses Pengurus Inti Pertama Kali
BOOTSTRAP_SUPER_ADMIN_EMAIL="rafi.nagata@example.com"
```

---

## 3. Langkah Konfigurasi Layanan Awal

### 3.1 Setup Cloudflare Pages & R2
1. Masuk ke dashboard Cloudflare -> **R2** -> Buat bucket baru dengan nama `kappama-media`.
2. Masuk ke **Workers & Pages** -> **Create application** -> **Pages** -> Hubungkan repositori GitHub KAPPAMA.
3. Konfigurasi build:
   - Framework preset: `Vite`
   - Build command: `pnpm build`
   - Build output directory: `dist`
4. Di bagian **Settings** -> **Functions** -> **R2 bucket bindings**:
   - Variable name: `R2_STORAGE`
   - Bucket name: `kappama-media`

### 3.2 Setup Neon PostgreSQL & Migrasi
1. Buat proyek baru di Neon Console dengan nama `kappama-db`.
2. Salin *Connection String* pooled mode.
3. Jalankan migrasi skema awal dari komputer pengembang:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

### 3.3 Bootstrap Super Admin Pertama
1. Pengurus inti login pertama kali menggunakan akun Google yang email-nya terdaftar pada `BOOTSTRAP_SUPER_ADMIN_EMAIL`.
2. Middleware backend mendeteksi kecocokan email pada saat onboarding pertama kali, lalu secara otomatis memberikan peran `role = 'super_admin'` dan status `active`.
3. Setelah Super Admin pertama aktif, Super Admin tersebut dapat mengangkat pengurus lain melalui menu `/admin/peran`.

---

## 4. Checklist Migrasi ke Domain Kustom & Clerk Production

Selama Fase 1–5, aplikasi berjalan di subdomain `*.pages.dev` menggunakan Clerk Development Instance dan fitur email dinonaktifkan (`EMAIL_ENABLED="false"`).

Ketika domain resmi KAPPAMA (misal: `kappama.org` atau `kappama.id`) telah dibeli (Fase 6), ikuti checklist migrasi berikut:

- [ ] **1. Cloudflare DNS & Pages Custom Domain:**
  - Daftarkan domain di Cloudflare Dashboard.
  - Hubungkan domain kustom ke proyek Cloudflare Pages.
- [ ] **2. Clerk Production Migration:**
  - Di Clerk Dashboard, buat Production Instance.
  - Konfigurasikan DNS CNAME records untuk Clerk Authentication di Cloudflare DNS (`clerk.kappama.org`, `accounts.kappama.org`).
  - Ganti nilai `VITE_CLERK_PUBLISHABLE_KEY` dan `CLERK_SECRET_KEY` di Cloudflare Pages dengan kunci produksi (`pk_live_...`, `sk_live_...`).
- [ ] **3. Resend Domain Verification:**
  - Tambahkan domain di Resend Dashboard.
  - Tambahkan record SPF, DKIM, dan DMARC yang diberikan Resend ke DNS Cloudflare.
  - Setelah status terverifikasi (Verified), ubah variabel di Cloudflare Pages:
    - `EMAIL_ENABLED="true"`
    - `RESEND_FROM_EMAIL="KAPPAMA <halo@kappama.org>"`
- [ ] **4. Cloudflare Turnstile:**
  - Perbarui daftar domain terotorisasi di dashboard Turnstile agar mencakup domain kustom baru.
- [ ] **5. Pengujian Alur Akhir:**
  - Uji alur pendaftaran dari pendaftar nyata dan verifikasi penerimaan email notifikasi masuk ke inbox.

---

## 5. Prosedur Pencadangan (Backup) & Rollback

- **Pencadangan Database:**
  - Manfaatkan fitur point-in-time restore atau branch snapshot pada Neon Console sebelum melakukan migrasi skema mayor.
  - Jalankan script backup manual berkala:
    ```bash
    pg_dump "$DATABASE_URL" -F c -b -v -f "./backup_kappama_$(date +%Y%m%d).dump"
    ```
- **Rollback Deployment:**
  - Jika terjadi kendala pada rilis terbaru di Cloudflare Pages, buka tab **Deployments** di dashboard Cloudflare Pages, pilih commit stabil sebelumnya, lalu klik **Rollback to this deployment**.
