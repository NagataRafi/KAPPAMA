# Checklist Pengujian (Testing Checklist) — Website KAPPAMA

Dokumen ini memuat skenario pengujian komprehensif per fitur, per peran pengguna, pengujian batas waktu (auto-approve 24 jam), keamanan dasar, aksesibilitas, dan performa seluler.

---

## 1. Pengujian Matriks Hak Akses & Rute Terlarang

| Skenario Uji | Pengunjung (Anonim) | Anggota (Pending / Rejected) | Anggota (Active) | Admin Konten | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Buka `/` (Beranda publik) | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK |
| Buka `/profil/*`, `/program-kerja`, `/galeri` | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK |
| Buka `/daftar` | ✅ Tampil tombol login | ➡️ Arahkan `/status` | ➡️ Arahkan `/anggota` | ➡️ Arahkan `/admin` | ➡️ Arahkan `/admin` |
| Buka `/onboarding` | ➡️ Redirect Login | ✅ Boleh (jika data belum lengkap) | ➡️ Arahkan `/anggota` | ➡️ Arahkan `/admin` | ➡️ Arahkan `/admin` |
| Buka `/status` | ➡️ Redirect Login | ✅ Tampil status & sisa waktu | ➡️ Arahkan `/anggota` | ✅ Boleh | ✅ Boleh |
| Buka `/anggota` (Direktori) | ❌ 401 / Redirect Login | ❌ 403 Ditolak (ke `/status`) | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK |
| Buka `/profil-saya` | ❌ 401 Redirect | ✅ Boleh sunting profil | ✅ Boleh sunting profil | ✅ Boleh | ✅ Boleh |
| Buka `/admin/persetujuan` | ❌ 401 Redirect | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ 200 OK | ✅ 200 OK |
| Buka `/admin/program-kerja` & `/admin/galeri` | ❌ 401 Redirect | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ 200 OK | ✅ 200 OK |
| Buka `/admin/peran` (Manajemen Role) | ❌ 401 Redirect | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ 200 OK |
| Buka `/admin/audit-log` & `/admin/ekspor` | ❌ 401 Redirect | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ 200 OK |

---

## 2. Pengujian Batas Waktu Auto-Active 24 Jam (Unit & Integration Test)

- [ ] **Skenario T1 (23 jam 59 menit sejak submit):**
  - Akun pendaftar masih berstatus `pending`.
  - Percobaan membuka `/api/members` menghasilkan HTTP `403 Forbidden`.
  - Halaman `/status` menampilkan sisa waktu hitung mundur ~1 menit.
- [ ] **Skenario T2 (Tepat 24 jam 00 menit sejak submit):**
  - Kueri `getEffectiveStatus()` mengembalikan status `active` dengan flag `isAutoPromoted: true`.
  - Pengguna otomatis dapat mengakses `/anggota` (direktori).
  - Status tersimpan ke DB: `status = 'active'`, `approval_type = 'auto'`.
  - Riwayat tercatat di `audit_logs`.
- [ ] **Skenario T3 (Penolakan oleh Admin pada jam ke-12):**
  - Admin Konten menolak pendaftar dengan alasan wajib.
  - Status berubah menjadi `rejected`.
  - Pada jam ke-25 (lewat 24 jam dari waktu awal), status **TETAP** `rejected` (tidak auto-aktif).
- [ ] **Skenario T4 (Pengajuan Ulang oleh Pendaftar yang Ditolak):**
  - Pendaftar memperbaiki data dan mengirim ulang formulir.
  - Waktu `submitted_at` ter-reset ke `NOW()`.
  - Status kembali menjadi `pending`, hitungan 24 jam baru dimulai.

---

## 2.1 Uji Integrasi Otomatis (Vitest) — Fase 3

Berkas: `functions/api-authz.test.ts` (28 test), `functions/clerk-auth.test.ts` (16 test), dan `src/services/api.test.ts` (3 test). Jalankan dengan `pnpm test`.

Mock: `@neondatabase/serverless` (tagged-template tiruan) dan `functions/lib/clerk-auth` (sesi Clerk). Endpoint diuji langsung melalui `app.request()` Hono dengan `basePath /api`.

- [x] **Direktori 401/403:** pengunjung tanpa sesi `401`; anggota `pending` dan `rejected` `403`; anggota `active` `200`.
- [x] **UU PDP direktori:** `addressDetail` tidak pernah ada di payload; `whatsapp`/`email` menjadi `null` saat `hide_contact = true`.
- [x] **IDOR detail anggota:** anggota lain tidak menerima `addressDetail`; pemilik menerima; admin menerima dan memicu audit `ADMIN_VIEWED_ADDRESS_DETAIL`.
- [x] **Detail anggota non-aktif:** anggota `pending` menerima `403`.
- [x] **Peran:** Admin Konten ditolak `403` di `PUT /admin/users/:id/role`; Super Admin berhasil dan audit `USER_ROLE_CHANGED` tidak memuat email.
- [x] **Super Admin terakhir:** pencabutan ditolak `409 LAST_SUPER_ADMIN`.
- [x] **Penolakan:** alasan kosong `422`; audit `MEMBER_REJECTED` tidak menyimpan teks alasan.
- [x] **Auto-approve:** 23 jam 59 menit `pending`; tepat 24 jam `active`; 24 jam 01 menit `active`.
- [x] **Tolak lalu ajukan ulang:** status kembali `pending` dan `submitted_at` ter-reset.
- [x] **Tangguhkan setelah auto-aktif:** `suspend` pertama `200`, kedua `404`; `restore` mengembalikan `active`.
- [x] **Turnstile fail-closed:** tanpa `TURNSTILE_SECRET_KEY` dan saat `siteverify` menjawab gagal, onboarding `400 BOT_VERIFICATION_FAILED`.

- [x] **Kode alasan auth (BUG 1):** setiap `error.code` (`TOKEN_MISSING`, `TOKEN_MALFORMED`, `TOKEN_EXPIRED`, `TOKEN_NOT_YET_VALID`, `ISSUER_MISMATCH`, `AZP_MISMATCH`, `SIGNATURE_INVALID`, `JWKS_FETCH_FAILED`, `EMAIL_UNVERIFIED`, `CLERK_BACKEND_ERROR`) mengembalikan pesan yang sesuai dan log server hanya `[auth] code=<KODE> path=<path>` (tanpa token/email).
- [x] **Toleransi jam 10 detik:** `exp`/`nbf`/`iat` selisih ≤ 10 detik diterima; lebih dari itu ditolak dengan kode yang tepat.
- [x] **Issuer & azp:** issuer diturunkan dari `CLERK_PUBLISHABLE_KEY`; `azp` diizinkan bagi `CLERK_AUTHORIZED_PARTIES`, origin frontend API Clerk, dan `localhost`/`127.0.0.1` pada `pk_test_` (proxy Vite 5173 → Wrangler 8788).
- [x] **Sesi belum login:** pesan "Silakan login" hanya untuk `TOKEN_MISSING`; kode lain menampilkan pesan sesuai alasannya.
- [x] **Token segar & retry:** klien memakai `getToken({ skipCache: true })` setiap permintaan dan mengulang sekali pada `401` dengan token baru; `fetchProfile` tidak lagi menandai `incomplete` saat error.
- [x] **Lookup publik anti-500:** kelima endpoint lookup dapat diakses tanpa login; bila DB gagal balas `200` dengan `{ "data": [] }` dan log `code=LOOKUP_DB_ERROR`; hasil unik dan urut abjad (`Lainnya` di akhir).
- [x] **Seed idempotent (BUG 2):** `pnpm db:seed` dijalankan dua kali berturut-turut; jumlah tetap `universities 14, study_programs 84, industries 13, districts 12, villages 172, org_periods 1, org_leaders 4`.
- [x] **Prodi Polinema (BUG 3):** 36 entri kampus utama Malang (17 D4, 11 D3, 1 D2, 5 S2, 1 S3 + "Lainnya") dari polinema.ac.id, verifikasi 29 Oktober 2026; nama kanonik tanpa prefiks jenjang, `degree_level` terpisah, label dropdown menampilkan jenjang.

Status terakhir: `5 berkas uji, 57 test lulus`.

- [x] **Kode alasan auth (BUG 1):** setiap `error.code` (`TOKEN_MISSING`, `TOKEN_MALFORMED`, `TOKEN_EXPIRED`, `TOKEN_NOT_YET_VALID`, `ISSUER_MISMATCH`, `AZP_MISMATCH`, `SIGNATURE_INVALID`, `JWKS_FETCH_FAILED`, `EMAIL_UNVERIFIED`, `CLERK_BACKEND_ERROR`) mengembalikan pesan yang sesuai dan log server hanya `[auth] code=<KODE> path=<path>` (tanpa token/email).
- [x] **Toleransi jam 10 detik:** `exp`/`nbf`/`iat` selisih ≤ 10 detik diterima; lebih dari itu ditolak dengan kode yang tepat.
- [x] **Issuer & azp:** issuer diturunkan dari `CLERK_PUBLISHABLE_KEY`; `azp` diizinkan bagi `CLERK_AUTHORIZED_PARTIES`, origin frontend API Clerk, dan `localhost`/`127.0.0.1` pada `pk_test_` (proxy Vite 5173 → Wrangler 8788).
- [x] **Sesi belum login:** pesan "Silakan login" hanya untuk `TOKEN_MISSING`; kode lain menampilkan pesan sesuai alasannya.
- [x] **Token segar & retry:** klien memakai `getToken({ skipCache: true })` setiap permintaan dan mengulang sekali pada `401` dengan token baru; `fetchProfile` tidak lagi menandai `incomplete` saat error.
- [x] **Lookup publik anti-500:** kelima endpoint lookup dapat diakses tanpa login; bila DB gagal balas `200` dengan `{ "data": [] }` dan log `code=LOOKUP_DB_ERROR`; hasil unik dan urut abjad (`Lainnya` di akhir).
- [x] **Seed idempotent (BUG 2):** `pnpm db:seed` dijalankan dua kali berturut-turut; jumlah tetap `universities 14, study_programs 84, industries 13, districts 12, villages 172, org_periods 1, org_leaders 4`.
- [x] **Prodi Polinema (BUG 3):** 36 entri kampus utama Malang (17 D4, 11 D3, 1 D2, 5 S2, 1 S3 + "Lainnya") dari polinema.ac.id, verifikasi 29 Oktober 2026; nama kanonik tanpa prefiks jenjang, `degree_level` terpisah, label dropdown menampilkan jenjang.

---

## 3. Pengujian Privasi & Perlindungan Data (UU PDP)

- [ ] **Kebocoran Alamat Detail:**
  - Ambil respons JSON dari endpoint `GET /api/members` dan `GET /api/members/:username`.
  - Pastikan properti `addressDetail` **TIDAK ADA** dalam payload respons JSON.
- [ ] **Saklar Sembunyikan Kontak (`hide_contact`):**
  - Anggota A menyalakan opsi "Sembunyikan kontak saya dari direktori".
  - Anggota B melihat profil Anggota A di direktori: field WhatsApp dan Email tampil sebagai `null` / tertutup.
  - Admin Konten atau Super Admin melihat profil Anggota A: nomor kontak tetap dapat dilihat untuk keperluan validasi.
- [ ] **Audit Trail Akses Data Sensitif:**
  - Setiap kali admin membuka detail lengkap anggota atau mengekspor data, periksa tabel `audit_logs` untuk memastikan nama admin, waktu, dan aksi tercatat.
  - Pastikan metadata audit log tidak membocorkan plain password, alamat lengkap, atau token.

---

## 4. Pengujian Unggahan Berkas (Uploads)

- [ ] Unggah foto dengan ukuran > 5 MB: Ditolak oleh validasi klien dan server (`400 Bad Request`).
- [ ] Unggah file bukan gambar (misal: file `.exe` atau `.sh` yang diubah ekstensi menjadi `.jpg`): Ditolak oleh server berbasis pemeriksaan Magic Number MIME type.
- [ ] Unggah foto valid: Berhasil dikompresi menjadi WebP dengan ukuran ≤ 400 KB di Cloudflare R2.
- [ ] Unggah PDF AD/ART dengan ukuran > 10 MB: Ditolak oleh server.
- [ ] Batas maksimal jumlah foto: Uji coba mengunggah foto ke-31 pada Program Kerja ditolak sistem.

---

## 5. Pengujian Responsivitas & Kinerja Mobile

- [x] Buka semua halaman publik pada viewport 360px (lebar layar smartphone kecil). Pastikan tidak ada horizontal scrollbar liar (*overflow-x*).
- [x] Navbar mobile: Menu hamburger responsif, mudah ditutup, dan link navigasi dapat diklik tanpa tumpang tindih.
- [x] PDF Viewer AD/ART: Tampil tertanam atau menampilkan tombol alternatif unduh langsung di peramban mobile (iOS Safari & Android Chrome).
- [x] Sematan video YouTube menggunakan domain `youtube-nocookie.com` dengan atribut `loading="lazy"`.
- [x] Seluruh teks narasi pengurus dan foto bertanda `[Placeholder - Menunggu Teks/Foto Resmi Pengurus]`.
- [ ] Lighthouse Mobile Audit (Target: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90).

---

## 6. Verifikasi Modul Halaman Publik (Fase 2)
- [x] **Beranda (`/`):** Hero section, quick links card, 4 pilar keunggulan, proker unggulan, kilas galeri, CTA banner, footer multi-kolom.
- [x] **Profil (`/profil`):** Definisi organisasi resmi PRD, sejarah placeholder, kontak sekretariat.
- [x] **Visi & Misi (`/profil/visi-misi`):** Pernyataan visi dan 4 butir misi terstruktur.
- [x] **Struktur Organisasi (`/profil/struktur`):** Filter/pemilih periode (2026/2027 dan 2025/2026), 4 jabatan inti (Pembina, Penasihat, Ketua, Wakil Ketua Umum).
- [x] **AD / ART (`/profil/ad-art`):** Penampil dokumen PDF tertanam (`<object>`), tombol unduh, tombol buka di tab baru, arsip riwayat versi.
- [x] **Program Kerja (`/program-kerja`):** Pencarian teks, filter tahun, filter universitas mitra, kartu responsif, empty state.
- [x] **Detail Program Kerja (`/program-kerja/:slug`):** Deskripsi rinci, tujuan, sasaran peserta, penanggung jawab, galeri foto, video YouTube.
- [x] **Galeri (`/galeri` & `/galeri/:slug`):** Grid album per tahun, jumlah foto, lightbox modal pratinjau foto, video aftermovie.
- [x] **Pendaftaran (`/daftar`):** Ringkasan syarat 12 kecamatan Pacitan, alur 3 langkah, tombol pendaftaran Google.
- [x] **Kebijakan Privasi & Syarat Penggunaan:** Kepatuhan UU PDP No. 27/2022, ditandai draf menunggu tinjauan pengurus.
- [x] **Halaman 404:** Tampilan error route ramah pengguna dengan tombol kembali ke beranda.
