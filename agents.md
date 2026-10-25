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
