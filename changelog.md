# Catatan Perubahan (Changelog) — Website KAPPAMA

Seluruh perubahan penting pada proyek ini didokumentasikan di berkas ini.
Format ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan mematuhi [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]
### Direncanakan
- Fase 4: Panel Admin & Manajemen Organisasi (CRUD konten, statistik, ekspor data).

---

## [0.4.0] - 2026-10-28
### Ditambahkan
- **Verifikasi Sesi Clerk di Server:** Modul baru `functions/lib/clerk-auth.ts` memverifikasi JWT RS256 lewat JWKS Clerk (cache 5 menit) dan mengambil email terverifikasi dari Clerk Backend API. Header `X-Clerk-User-Id`/`X-User-Email` dan decode JWT tanpa verifikasi dihapus. Bootstrap Super Admin hanya dari email Google terverifikasi yang cocok dengan `BOOTSTRAP_SUPER_ADMIN_EMAIL`, tercatat sebagai `SUPER_ADMIN_BOOTSTRAPPED`.
- **Widget Turnstile Nyata:** `src/components/auth/TurnstileWidget.tsx` merender widget eksplisit dengan `VITE_TURNSTILE_SITE_KEY`; token hardcoded di `OnboardingPage` dihapus dan form menolak submit tanpa token.
- **Endpoint Admin Baru:** `POST /api/admin/members/:id/suspend`, `POST /api/admin/members/:id/restore`, dan `PUT /api/admin/users/:id/role` (khusus Super Admin, guard `409 LAST_SUPER_ADMIN`).
- **Audit Tambahan:** `ADMIN_VIEWED_ADDRESS_DETAIL` dicatat setiap admin membuka alamat detail anggota, tanpa menyimpan isi alamat.
- **Direktori:** filter `studyProgramId` di server dan UI, `meta.total` via `COUNT(*) OVER()`, kontrol pagination 20 per halaman, dan reset ke halaman 1 saat filter berubah.
- **Seed Wilayah Resmi:** `db/seed/pacitan-regions.json` ditulis ulang dari BPS SIG Bridging API + LPPD 2024 Tabel 1.4 + Perda Pacitan No. 6/2022. Total 12 kecamatan, 172 desa/kelurahan (167 desa + 5 kelurahan), sudah dijalankan ke Neon.
- **Uji Integrasi:** `functions/api-authz.test.ts` (22 test) mencakup 401/403 direktori, IDOR alamat detail, peran Admin Konten vs Super Admin, guard Super Admin terakhir, auto-approve 23:59/24:00/24:01, tolak lalu ajukan ulang, tangguhkan setelah auto-aktif, dan Turnstile fail-closed.

### Diubah
- **Detail Anggota:** hanya pemilik, anggota `active`, atau admin yang boleh mengakses (mencegah IDOR oleh anggota `pending`/`rejected`).
- **Audit Penolakan:** metadata tidak lagi menyimpan teks alasan, hanya `{ reasonProvided: true }`.
- **Seed Anggota Dummy:** `db/seed-members.js` menolak berjalan tanpa `SEED_DUMMY_MEMBERS=true`; semua baris dummy ditandai `clerk_user_id` berawalan `user_dummy_`.
- **`.env`/`.dev.vars`:** `.env` hanya tiga variabel publik; `.dev.vars` memuat tujuh nama baku (`DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, `CLOUDINARY_URL`, `BOOTSTRAP_SUPER_ADMIN_EMAIL`, `EMAIL_ENABLED`). Semua variabel rahasia berawalan `VITE_` dihapus.
- **Dokumentasi:** `api-spec.md`, `database-schema.md`, `security-privacy.md`, `arsitektur.md` (ADR-005, ADR-006), `testing-checklist.md`, `roadmap.md`, dan `README.md` diperbarui.

### Diperbaiki
- **Layar Putih Clerk:** Menghapus fallback kunci contoh `pk_test_sample_kappama_key` di `src/main.tsx`. Bila `VITE_CLERK_PUBLISHABLE_KEY` kosong, `ClerkProvider` tidak dipasang, seluruh halaman publik tetap dirender, dan pengguna melihat pesan "Konfigurasi login belum lengkap" (banner layout + halaman `/daftar`).
- **Error Boundary Root:** Menambahkan `ErrorBoundary` di `src/main.tsx` agar galat render menampilkan halaman pemulihan, bukan layar putih.
- **Audit Env:** Menghapus fallback server `VITE_TURNSTILE_SECRET_KEY` di `functions/[[path]].ts` sehingga tidak ada variabel rahasia berawalan `VITE_`; audit bundle `dist/` bersih dari kunci rahasia. README menyebut daftar variabel baku `.env` dan `.dev.vars`.
- **Ponytail:** Menggabungkan aturan Ponytail resmi ke `agents.md` (Bagian 8) dengan batas wajib: keamanan, privasi UU PDP, validasi server, dan aksesibilitas PRD tidak boleh dikurangi.

### Direncanakan
- Fase 3: Otentikasi Clerk Google Login, formulir Onboarding profil lengkap dengan proteksi Turnstile, logika Lazy Auto-Approve 24 jam di server, dan Direktori Anggota & Alumni.

---

## [0.3.1] - 2026-10-25
### Diperbaiki
- **Migrasi Database Neon:** Memperbarui `drizzle-orm` (v0.45.4) dan `drizzle-kit` (v0.31.11), memperbaiki skrip `pnpm db:migrate` menjadi `drizzle-kit migrate`, dan mengonfirmasi 17 tabel relasional terbentuk utuh di database Neon via query `information_schema`.
- **Wrangler Pages Functions:** Memperbarui `wrangler` ke v4.152.0 untuk mengatasi crash runtime `0xC0000409` pada Windows, serta mematok Node.js v20+ LTS via `package.json` engines dan `.nvmrc`.
- **Standarisasi Variabel Lingkungan:** Menyeragamkan penamaan variabel di seluruh proyek (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, dan alternatif `CLOUDINARY_URL`), menghapus variabel rahasia berawalan `VITE_`, dan menambahkan audit keamanan bundle produksi `dist/` (0 rahasia bocor).
- **Indikator Pemuatan Awal (Layar Putih):** Menambahkan spinner/animasi denyut ringan bertema warna biru dongker `#0F1E36` dan emas soga `#D97706` di `index.html` untuk mencegah layar putih kosong sebelum bundle dimuat.

---

## [0.3.0] - 2026-10-25
### Ditambahkan
- Implementasi penuh Fase 2 (Desain Sistem & Seluruh Halaman Publik):
  - Komponen navigasi Navbar sticky dengan dropdown 4 sub-menu Profil, drawer menu mobile responsif (360px), dan status auth.
  - Komponen Footer multi-kolom dengan informasi organisasi, navigasi cepat, kontak placeholder, dan kepatuhan UU PDP.
  - Halaman Beranda (`/`) memetakan layout referensi: Hero layar penuh, kartu melayang statistik & tautan cepat, 4 pilar keunggulan, kartu program kerja unggulan, seksi kilas galeri, dan banner CTA pendaftaran.
  - Halaman Profil Tentang KAPPAMA (`/profil`) dengan definisi resmi PRD, sejarah placeholder, dan kontak sekretariat.
  - Halaman Visi & Misi (`/profil/visi-misi`) dengan kartu visi dan 4 langkah misi.
  - Halaman Struktur Organisasi (`/profil/struktur`) dengan pemilih periode dinamis dan 4 jabatan inti (Pembina, Penasihat, Ketua Umum, Wakil Ketua Umum).
  - Halaman AD/ART (`/profil/ad-art`) dengan viewer PDF tertanam, tombol unduh langsung, tombol buka di tab baru, dan arsip riwayat versi.
  - Halaman Program Kerja (`/program-kerja` & `/program-kerja/:slug`) dengan filter tahun, filter kampus mitra, pencarian judul, dokumentasi foto, dan sematan video YouTube `youtube-nocookie.com`.
  - Halaman Galeri Kegiatan (`/galeri` & `/galeri/:slug`) dengan filter tahun, album kegiatan, dan modal lightbox foto.
  - Halaman Pendaftaran Publik (`/daftar`) dengan syarat 12 kecamatan Pacitan, alur 3 langkah pendaftaran, dan tombol aksi.
  - Halaman Kebijakan Privasi (`/kebijakan-privasi`) dan Syarat Penggunaan (`/syarat-penggunaan`) bertanda draf menunggu tinjauan resmi pengurus.
  - Halaman 404 ramah pengguna (`/404`).
  - Komponen ornamen halus motif batik pesisir khas Pacitan (Batik Pace) SVG (`BatikOrnament`).
  - Komponen UI state: `EmptyState` dan `LoadingSkeleton`.
  - Berkas dummy PDF AD/ART di `public/docs/ad-art-kappama-sample.pdf`.

---

## [0.2.1] - 2026-10-25
### Diubah
- Mengganti penyimpanan media utama dari Cloudflare R2 ke Cloudinary (free-tier) sesuai PRD v1.2 karena aktivasi R2 ditunda.
- Menambahkan antarmuka `StorageService` beserta implementasi `CloudinaryStorageAdapter` (signed direct uploads, optimasi otomatis `f_auto,q_auto`, dan hapus berkas) serta `MockStorageAdapter` untuk pengembangan lokal.
- Memisahkan konfigurasi environment: `.env` khusus frontend Vite (`VITE_*`) dan `.dev.vars` untuk Cloudflare Pages Functions backend.
- Menghapus konfigurasi binding `R2_STORAGE` dan `R2_BUCKET_NAME` dari `wrangler.toml` dan template env.
- Menambahkan catatan keputusan ADR-004 pada `arsitektur.md`.
- Menyiapkan strategi cadangan berkas PDF AD/ART (statis di `public/` atau Google Drive embed) untuk mengantisipasi pembatasan raw PDF di Cloudinary free tier.

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
