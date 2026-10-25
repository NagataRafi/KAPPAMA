# Peta Jalan Pengembangan (Roadmap) — Website KAPPAMA

Dokumen ini memantau status fase pengerjaan proyek, daftar pertanyaan terbuka untuk pemilik proyek, manajemen risiko, dan backlog fitur masa depan (v2).

---

## 1. Status Fase Pengerjaan

| Fase | Deskripsi | Status | Keterangan / Capaian |
|:---:|---|:---:|---|
| **Fase 0** | **Fondasi Dokumen & Penyelarasan PRD** | 🟡 Menunggu Persetujuan | Seluruh dokumen Bagian 14 telah dibuat konkret dan siap ditinjau pemilik proyek. |
| **Fase 1** | **Scaffold & Infrastruktur Dasar** | ⚪ Belum Dimulai | Repo Vite+React+TS, Hono Pages Functions, Neon DB, Drizzle, Clerk dev instance. |
| **Fase 2** | **Desain Sistem & Halaman Publik** | ⚪ Belum Dimulai | Beranda, Profil (Tentang, Visi-Misi, Struktur, AD/ART), Program Kerja, Galeri. |
| **Fase 3** | **Auth, Onboarding, Persetujuan, & Direktori** | ⚪ Belum Dimulai | Google Auth, Turnstile, Onboarding, Lazy auto-approve 24 jam, Direktori internal. |
| **Fase 4** | **Panel Admin & Manajemen Organisasi** | ⚪ Belum Dimulai | CRUD Konten, Antrean persetujuan, Manajemen anggota & peran, Statistik, Ekspor data. |
| **Fase 5** | **Hardening, Aksesibilitas, & Kesiapan Rilis** | ⚪ Belum Dimulai | Audit keamanan, E2E testing, uji batas waktu, optimasi Lighthouse mobile. |
| **Fase 6** | **Peluncuran Domain Kustom & Email Aktif** | ⚪ Ditunda (Pasca Domain) | Pembelian domain kustom, Clerk production, verifikasi DNS Resend, `EMAIL_ENABLED=true`. |

*Keterangan Status:* ⚪ Belum Dimulai · 🟡 Sedang Berjalan / Menunggu Persetujuan · 🟢 Selesai

---

## 2. Pertanyaan Terbuka untuk Pemilik Proyek (Batch Fase 0)

Berikut daftar pertanyaan terbuka yang disalin dari PRD Bagian 16 untuk dikonfirmasi bersama pemilik proyek:

1. **Definisi "Angkatan":**
   Apakah field "Angkatan" dipahami sebagai tahun masuk kuliah (misal: 2024) atau tahun angkatan pengukuhan anggota di KAPPAMA? *(Default asumsi yang diusulkan: Tahun masuk kuliah).*
2. **Visibilitas Default Direktori:**
   Apakah kebijakan visibilitas berikut disetujui:
   - Detail alamat lengkap (RT/RW/Dusun) hanya bisa dilihat pemilik data dan pengurus (Admin Konten / Super Admin).
   - Nomor WhatsApp dan Email terlihat oleh sesama anggota berstatus `active`, namun anggota memiliki opsi saklar *"Sembunyikan kontak saya"*?
3. **Filter "Universitas" pada Halaman Program Kerja:**
   Apakah filter kampus pada Program Kerja relevan digunakan (sebagai label opsional proker kolaborasi antar-kampus), ataukah cukup difokuskan pada Direktori Anggota saja?
4. **Alur Pendaftaran Anggota Baru:**
   Apakah pendaftaran dilakukan 100% melalui alur: Klik Daftar -> Login Google via Clerk -> Formulir Onboarding Data Diri (seperti rancangan saat ini), atau apakah perlu ada formulir pra-pendaftaran terpisah sebelum login Google?
5. **Aset Visual & Identitas Desain:**
   - Apakah palet warna Biru Dongker (`#0F1E36`) dan Emas Soga (`#D97706`) sudah sesuai dengan identitas KAPPAMA?
   - Kapan logo resmi KAPPAMA beresolusi tinggi dan foto/dokumentasi kegiatan dapat disediakan?
6. **Rencana Domain Kustom:**
   Apakah sudah ada estimasi nama domain yang akan dibeli (misal: `kappama.org` / `kappama.id`) dan perkiraan jadwal pembeliannya untuk pelaksanaan Fase 6?

---

## 3. Manajemen Risiko & Mitigasi

| Risiko Teridentifikasi | Tingkat Dampak | Rencana Mitigasi |
|---|:---:|---|
| **Auto-aktif 24 jam meloloskan data palsu** | Sedang | Pembatasan pilihan kecamatan wajib di Pacitan, Turnstile bot protection, notifikasi email ke admin, dan hak admin menangguhkan (*suspend*) akun sewaktu-waktu. |
| **Paparan Data Pribadi Mahasiswa (UU PDP)** | Tinggi | Endpoint direktori menyaring alamat sensitif, kontak memiliki saklar sembunyikan, otorisasi ketat di sisi server, pencatatan audit log untuk setiap aksi ekspor dan penyuntingan. |
| **Keterbatasan Tanpa Domain Kustom Awal** | Rendah | Menggunakan Clerk Development Instance dan menonaktifkan pengiriman email keluar (`EMAIL_ENABLED=false`). Seluruh status pendaftaran dapat dipantau langsung di web (`/status`). |
| **Kehabisan Kuota Free Tier (R2 / Neon / Functions)** | Rendah | Kompresi WebP di sisi klien (≤ 400KB), video hanya melalui sematan YouTube, kueri database efisien dengan indeks yang tepat. |
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
