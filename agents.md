# Panduan Agen Pengembang (Agents Guide) — Website KAPPAMA

> Dokumen ini adalah panduan instruksional wajib bagi agen kecerdasan buatan (Antigravity, OpenCode, dan agen lainnya) yang berkontribusi pada repositori Website KAPPAMA.
> Salinan ini identik dengan `agents.md`.

---

## 1. Gambaran Proyek
KAPPAMA adalah website organisasi mahasiswa daerah asal Pacitan di Malang yang mengintegrasikan profil publik, pendaftaran dan onboarding anggota baru berbasis Google Auth (Clerk), persetujuan admin dengan auto-approve lazy 24 jam, serta direktori anggota dan alumni.

Seluruh sistem dirancang agar berjalan di atas **free-tier** (Cloudflare Pages, Neon PostgreSQL, Clerk, Resend, Cloudflare R2, dan Turnstile).

---

## 2. Perintah Penting (Commands Reference)

Manajer paket yang digunakan adalah **pnpm**.

| Perintah | Deskripsi |
|---|---|
| `pnpm install` | Memasang seluruh dependensi repositori |
| `pnpm dev` | Menjalankan Vite dev server lokal (frontend) |
| `pnpm dev:functions` | Menjalankan Wrangler Pages Functions lokal dengan binding env |
| `pnpm build` | Membangun aset produksi frontend (`dist/`) |
| `pnpm lint` | Menjalankan ESLint untuk pemeriksaan kode |
| `pnpm format` | Menjalankan Prettier untuk format kode |
| `pnpm test` | Menjalankan unit test dengan Vitest |
| `pnpm test:e2e` | Menjalankan Playwright E2E test |
| `pnpm db:generate` | Menghasilkan berkas migrasi Drizzle dari `db/schema.ts` |
| `pnpm db:migrate` | Menerapkan migrasi Drizzle ke database Neon |
| `pnpm db:seed` | Menjalankan seed master data wilayah, kampus, prodi, dan dummy data |

---

## 3. Konvensi Kode dan Penamaan

1. **Bahasa:**
   - Antarmuka Pengguna (UI), label, pesan validasi, toast, dan dokumen `.md`: **Bahasa Indonesia**.
   - Nama variabel, fungsi, interface, type, file kode, dan nama kolom/tabel database: **Bahasa Inggris**.
2. **Penamaan File & Folder:**
   - Komponen React: `PascalCase.tsx` (misal: `MemberCard.tsx`, `PageHeader.tsx`).
   - Hooks: `camelCase.ts` diawali `use` (misal: `useMembers.ts`, `useAuthProfile.ts`).
   - Utilitas, schema, & route handlers: `kebab-case.ts` (misal: `api-client.ts`, `member-schema.ts`).
   - Tabel dan kolom database: `snake_case` (misal: `member_profiles`, `submitted_at`).
3. **Validasi:**
   - Gunakan **Zod** untuk seluruh skema input. Skema ditaruh di folder `shared/schema/` agar dapat digunakan bersama di klien dan backend.
4. **Otorisasi Server:**
   - Selalu periksa sesi Clerk dan peran di tabel database (bukan sekadar `publicMetadata`).
   - Akses data anggota wajib memanggil `getEffectiveStatus()` untuk memastikan aturan 24 jam konsisten.

---

## 4. Aturan Keamanan & Privasi (WAJIB)

- **Tidak Ada Hardcoded Secret:** Dilarang keras menaruh kunci API, token, atau connection string di dalam repositori atau pesan commit. Gunakan file `.env` lokal (yang ada di `.gitignore`) dan buat `.env.example`.
- **Perlindungan Data Pribadi (UU PDP No. 27/2022):**
  - Kolom alamat detail (`address_detail`: RT/RW, dusun, jalan) **TIDAK BOLEH** dikembalikan pada endpoint direktori anggota umum. Hanya pemilik profil dan admin yang berhak melihat.
  - Nomor WhatsApp dan email wajib menghormati flag `hide_contact`.
  - Log aplikasi dilarang mencatat email, nomor telepon, alamat, atau token pengguna.
- **Pencegahan XSS:** Seluruh konten deskripsi teks kaya dari admin wajib disanitasi menggunakan whitelist tag HTML yang ketat.
- **Pencegahan IDOR:** Setiap operasi `GET / PUT / DELETE` yang melibatkan ID data anggota wajib memvalidasi apakah pengakses adalah pemilik data atau memiliki peran admin yang sah.

---

## 5. Larangan Keras (Do Not Do)

1. **Dilarang menambah layanan berbayar** atau menggunakan fitur yang melewati batas gratis tanpa persetujuan eksplisit pemilik proyek.
2. **Dilarang mengarang sejarah, visi misi, atau nama pengurus KAPPAMA.** Gunakan teks resmi yang diberikan atau placeholder berlabel `[Placeholder - Menunggu Teks Resmi Pengurus]`.
3. **Dilarang mengarang nama desa/kelurahan di Pacitan.** Gunakan data resmi Kemendagri / BPS yang terverifikasi.
4. **Dilarang melompat fase pengerjaan.** Patuhi urutan Fase 0 hingga Fase 6 pada PRD Bagian 15.
5. **Dilarang mengunggah video langsung ke Cloudflare R2.** Video hanya diizinkan via tautan YouTube (disematkan melalui ID video).

---

## 6. Prosedur Pengujian (Testing)

- **Unit Test (Vitest):**
  - Uji fungsi utilitas `getEffectiveStatus()` untuk skenario:
    - 23 jam 59 menit (status tetap `pending`).
    - Tepat 24 jam 00 menit (status menjadi `active`).
    - 24 jam 01 menit (status menjadi `active`).
    - Pendaftar yang ditolak sebelum 24 jam (status tetap `rejected`).
    - Pengajuan ulang setelah ditolak (reset `submitted_at`).
- **Integration Test:**
  - Uji endpoint otorisasi: verifikasi penolakan akses `401/403` bagi non-login atau anggota pending yang mencoba melihat direktori.

---

## 7. Definisi Selesai (Definition of Done)

Setiap modul atau fase dinyatakan selesai hanya jika:
1. Kode berhasil dikompilasi tanpa galat TypeScript (`tsc --noEmit`).
2. ESLint bersih tanpa peringatan kritis (`pnpm lint`).
3. Seluruh unit test terkait berhasil lulus (`pnpm test`).
4. Matriks hak akses terverifikasi di sisi backend.
5. Memiliki state UI yang lengkap: *Loading (Skeleton)*, *Empty State*, *Error State*, dan *Success Toast*.
6. Tampilan antarmuka telah diverifikasi pada breakpoint mobile (360px) dan desktop.
7. Berkas `changelog.md` dan `roadmap.md` diperbarui dengan status terkini.

---

## 8. Mode Ponytail — Lazy Senior Developer (WAJIB)

Aturan ini digabungkan dari repositori resmi <https://github.com/DietrichGebert/ponytail> (`AGENTS.md` + `INSTALL.md`, bagian OpenCode). Aturan lama pada Bagian 1–7 tetap berlaku dan tidak digantikan.

### 8.1 Sikap kerja
- Jawab dengan perubahan terkecil yang menyelesaikan seluruh masalah. Kode terbaik adalah kode yang tidak ditulis.
- Sebelum menulis, baca tugas dan kode yang disentuh. Daftar semua tempat perubahan harus menjangkau: pemanggil, test, fixture, konfigurasi, ekspor. Periksa risiko bagi pengguna: data yang bisa hilang atau terekspos, pemanggil yang berhenti bekerja. Itu batas lingkup; fitur tambahan bukan lingkup.

### 8.2 Urutan pilihan solusi
Ambil pilihan pertama yang benar-benar berfungsi:
1. Apakah fitur ini perlu ada? Lewati fitur, opsi, dan fleksibilitas yang tidak diminta; sebutkan dalam satu baris.
2. Sudah ada di kode ini (helper, komponen, service, pola)? Pakai seperti kode sekitarnya.
3. Pustaka standar atau fitur platform? Pakai, kecuali proyek punya sendiri.
4. Dependensi yang sudah terpasang? Pakai. Jangan menambah dependensi hanya untuk beberapa baris.
5. Bisa jadi satu baris yang jelas dibaca sekilas? Satu baris.
6. Selain itu: kode minimum yang bekerja.

### 8.3 Aturan implementasi
- Malas pada solusi, tidak pada perubahan: selesaikan seluruh bagian yang dibutuhkan tugas, termasuk pemanggil, test, dan fixture yang rusak.
- Tanpa abstraksi, wrapper, konversi tipe, opsi, konfigurasi, atau kode "untuk nanti" yang tidak diminta. Hapus lebih baik daripada menambah. Ikuti struktur, lapisan, antarmuka, dan konvensi yang sudah ada.
- Diff terpendek yang bekerja menang, setelah semua bagian yang harus disentuh diketahui. Satu baris yang butuh didekode bukan berarti pendek.
- Komentar hanya untuk alasan yang tidak bisa ditunjukkan kode, satu baris.
- Perbaikan bug: cari semua pemanggil fungsi yang disentuh, lalu perbaiki akar masalah sekali di kode bersama.
- Kode yang dipindah atau digabung tetap membawa penanganan galat dan validasinya.
- Antara opsi yang sama besarnya, pilih yang benar pada kasus tepi.
- Kode malas tanpa pemeriksaan belum selesai: logika baru yang tidak sepele (percabangan, perulangan, parser, uang, keamanan, atau skrip/aplikasi baru) meninggalkan satu test kecil atau self-check berbasis assert. Perubahan sepele tidak perlu.
- Shortcut dengan batasan yang diketahui diberi komentar: `shortcut: <batasannya>, <kapan harus ditingkatkan>`.

### 8.4 Batas minimalis Ponytail vs PRD (WAJIB)
Aturan minimalis Ponytail **tidak boleh** mengurangi:
1. Keamanan dan otorisasi server (validasi Clerk, peran dari database, penolakan `401/403`).
2. Privasi data pribadi sesuai UU PDP No. 27/2022 (penyaringan `address_detail`, `hide_contact`, larangan logging data pribadi).
3. Validasi server-side (Zod, Turnstile, sanitasi XSS, pencegahan IDOR).
4. Aksesibilitas dan state UI yang diwajibkan PRD (loading, empty, error, success toast, breakpoint 360px/desktop).

Jika instruksi Ponytail bertentangan dengan empat poin di atas atau dengan Bagian 4–7, aturan PRD dan keamanan yang menang. Skip bagian yang tidak dikerjakan dan sebutkan satu baris di akhir jawaban, beserta risiko yang perlu diketahui pengguna.
