# Peta Jalan Pengembangan (Roadmap) — Website KAPPAMA

Dokumen ini memantau status fase pengerjaan proyek, daftar pertanyaan terbuka untuk pemilik proyek, manajemen risiko, dan backlog fitur masa depan (v2).

---

## 1. Status Fase Pengerjaan

| Fase | Deskripsi | Status | Keterangan / Capaian |
|:---:|---|:---:|---|
| **Fase 0** | **Fondasi Dokumen & Penyelarasan PRD** | 🟢 Selesai | Seluruh dokumen Bagian 14 telah disetujui pemilik proyek dan jawaban terbuka telah disepakati. |
| **Fase 1** | **Scaffold & Infrastruktur Dasar** | 🟢 Selesai | Vite+React+TS, Hono Pages Functions, Drizzle ORM skema 17 tabel & migrasi, Vitest 100% lulus, CI workflow. |
| **Fase 2** | **Desain Sistem & Halaman Publik** | 🟢 Selesai | Beranda, Profil (Tentang, Visi-Misi, Struktur 4 jabatan, AD/ART viewer PDF), Program Kerja, Galeri, responsif 360px. |
| **Fase 3** | **Auth, Onboarding, Persetujuan, & Direktori** | 🟡 Selesai (menunggu persetujuan Fase 4) | Sudah lengkap: Clerk auth context/guard, verifikasi sesi server (JWKS + Backend API), widget Turnstile nyata & verifikasi fail-closed, onboarding + persetujuan UU PDP, status & ajukan ulang, antrean persetujuan, tangguhkan/pulihkan, kelola peran dengan guard Super Admin terakhir, direktori + filter prodi + pagination 20/halaman, seed 12 kecamatan & 172 desa/kelurahan resmi, 32 test lulus. |
| **Fase 4A** | **Panel Admin — Manajemen Konten** | 🟡 Selesai (menunggu persetujuan Fase 4B) | Shell admin responsif per peran, dashboard ringkasan, CRUD profil organisasi (tentang/visi/misi), periode & pengurus, unggah PDF AD/ART (+ cadangan tautan), CRUD program kerja & album dengan banyak foto/urutan/kaption/YouTube, signed upload Cloudinary, audit log `CONTENT_*`, endpoint publik hanya konten terbit, 74 test lulus. |
| **Fase 4B** | **Panel Admin — Anggota, Peran, Statistik, Ekspor** | ⚪ Belum Dimulai | Manajemen anggota & peran lanjutan, statistik agregat, ekspor data. |
| **Fase 4** | **Panel Admin & Manajemen Organisasi** | 🟡 Sedang Berjalan (4A selesai) | CRUD Konten, Antrean persetujuan, Manajemen anggota & peran, Statistik, Ekspor data. |
| **Fase 5** | **Hardening, Aksesibilitas, & Kesiapan Rilis** | ⚪ Belum Dimulai | Audit keamanan, E2E testing, uji batas waktu, optimasi Lighthouse mobile. |
| **Fase 6** | **Peluncuran Domain Kustom & Email Aktif** | ⚪ Ditunda (Pasca Domain) | Pembelian domain kustom, Clerk production, verifikasi DNS Resend, `EMAIL_ENABLED=true`. |

*Keterangan Status:* ⚪ Belum Dimulai · 🟡 Sedang Berjalan / Menunggu Persetujuan · 🟢 Selesai

---

## 2. Kesepakatan Pertanyaan Terbuka (Dikonfirmasi Pemilik Proyek)

1. **Definisi "Angkatan":** Disepakati sebagai **tahun masuk kuliah** (format YYYY, misal: 2024).
2. **Visibilitas Direktori:** Disetujui bahwa detail alamat (`dusun/RT/RW/jalan`) **hanya** terlihat oleh pemilik data, Admin Konten, dan Super Admin. WhatsApp dan email tampil untuk sesama anggota `active`, dengan opsi saklar *"sembunyikan kontak saya"*.
3. **Filter Kampus di Program Kerja:** Dipertahankan sebagai label opsional bersama filter tahun pelaksanaan.
4. **Alur Pendaftaran:** Disetujui 100% melalui alur: `Klik Daftar` -> `Login Google (Clerk)` -> `Onboarding Profil Lengkap` (+ Turnstile & persetujuan UU PDP). Tidak ada formulir terpisah.
5. **Palet Warna & Aset:** Disetujui warna dasar Biru Dongker `#0F1E36` dan Emas Soga `#D97706`. Sebelum logo & foto kegiatan resmi disediakan di `docs/design-reference/`, aplikasi menggunakan placeholder berlabel `[Placeholder - Menunggu Teks/Foto Resmi Pengurus]`.
6. **Domain Kustom:** Belum ditentukan. Selama belum ada domain kustom, aplikasi beroperasi menggunakan subdomain `pages.dev`, Clerk development instance, dan `EMAIL_ENABLED=false`. Notifikasi pendaftaran tetap dapat dipantau langsung di halaman `/status`.
7. **Foto Profil Anggota:** Default sementara memakai avatar Google dari Clerk. Fitur unggahan foto profil mandiri anggota ditunda untuk menghemat kuota dan meminimalkan pengolahan data pribadi.

---

## 3. Manajemen Risiko & Mitigasi

| Risiko Teridentifikasi | Tingkat Dampak | Rencana Mitigasi |
|---|:---:|---|
| **Auto-aktif 24 jam meloloskan data palsu** | Sedang | Pembatasan pilihan kecamatan wajib di Pacitan, Turnstile bot protection, notifikasi email ke admin, dan hak admin menangguhkan (*suspend*) akun sewaktu-waktu. |
| **Paparan Data Pribadi Mahasiswa (UU PDP)** | Tinggi | Endpoint direktori menyaring alamat sensitif, kontak memiliki saklar sembunyikan, otorisasi ketat di sisi server, pencatatan audit log untuk setiap aksi ekspor dan penyuntingan. |
| **Keterbatasan Tanpa Domain Kustom Awal** | Rendah | Menggunakan Clerk Development Instance dan menonaktifkan pengiriman email keluar (`EMAIL_ENABLED=false`). Seluruh status pendaftaran dapat dipantau langsung di web (`/status`). |
| **Kehabisan Kuota Free Tier (Cloudinary / Neon / Functions)** | Rendah | Kompresi WebP di sisi klien (≤ 400KB), video hanya melalui sematan YouTube, optimasi transformasi Cloudinary (f_auto, q_auto), kueri database efisien dengan indeks yang tepat. |
| **Pergantian Pengurus Tiap Periode** | Sedang | Prosedur serah terima hak akses terdokumentasi rapi di `deployment.md` dan `security-privacy.md`, mewajibkan minimal ada 1 Super Admin aktif setiap saat. |

---

## 4. Backlog Fitur Masa Depan (Rilis v2)

Fitur-fitur ini sengaja ditunda agar v1 fokus pada keandalan sistem pendataan dan citra organisasi:
1. **Papan Lowongan & Jejaring Karier Alumni (Job Board):**
   - Fasilitas alumni memasang info lowongan kerja, magang, atau mentorship untuk anggota aktif.
2. **Modul Penggalangan Dana & Donasi Online:**
   - Fasilitas donasi beasiswa atau kegiatan sosial KAPPAMA, terintegrasi payment gateway (setelah organisasi berbadan hukum resmi).
3. **Pusat Pengumuman & Blog Berita Dinamis:**
   - Ruang rilis pers dan artikel tulisan karya anggota KAPPAMA.
4. **Forum Diskusi Interaktif Antaranggota:**
   - Ruang tanya jawab seputar perkuliahan dan kehidupan mahasiswa Pacitan di Malang.
