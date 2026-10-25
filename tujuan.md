# Dokumen Tujuan & Prinsip Produk — KAPPAMA

## 1. Latar Belakang
**KAPPAMA (Keluarga Pelajar Pacitan di Malang)** adalah organisasi mahasiswa daerah yang mewadahi para pelajar dan mahasiswa asal Kabupaten Pacitan, Jawa Timur, yang sedang menempuh studi di Kota Malang. 

Selama ini pendataan keanggotaan dilakukan secara sporadis dan manual melalui spreadsheet/formulir online yang terpisah-pisah, menyulitkan pembaruan data anggota berkala, pelacakan alumni, dan penyajian profil resmi organisasi secara kredibel kepada publik dan calon mahasiswa baru asal Pacitan.

Website KAPPAMA dirancang sebagai solusi terpadu berbasis web yang ringan, profesional, berbiaya Rp0 (memanfaatkan free-tier modern), dan mudah dirawat oleh pergantian kepengurusan tahunan.

---

## 2. Tiga Pilar Produk
1. **Citra Organisasi (Publik):**
   - Media representasi resmi profil KAPPAMA, visi & misi, struktur pengurus per periode, transparansi AD/ART (viewer PDF), dokumentasi program kerja, dan album galeri kegiatan.
2. **Pendataan Anggota & Direktori (Internal Anggota):**
   - Menggantikan spreadsheet manual dengan pendaftaran akun Google (Clerk) + verifikasi Turnstile + onboarding data terstruktur.
   - Dilengkapi alur persetujuan admin dengan mekanisme *lazy auto-active* 24 jam.
   - Direktori anggota aktif dan alumni dengan pencarian serta filter mendalam (khusus anggota berstatus `active`).
3. **Fondasi Jejaring Alumni:**
   - Pengumpulan data pekerjaan alumni (status karier, instansi, posisi, bidang industri, domisili kerja) sejak v1 guna menyiapkan jejaring karier dan potensi filantropi daerah di masa depan.

---

## 3. Pengguna Sasaran (Aktor)
- **Pengunjung Umum & Calon Mahasiswa Baru:** Mahasiswa/pelajar asal Pacitan di Malang atau masyarakat umum yang ingin mengenal KAPPAMA dan mendaftar.
- **Anggota Aktif:** Mahasiswa Pacitan di Malang yang terdaftar resmi; mengakses direktori jejaring, memperbarui data diri, dan beralih ke status alumni saat lulus.
- **Alumni KAPPAMA:** Lulusan perguruan tinggi di Malang asal Pacitan yang tetap terhubung dengan almamater kedaerahan.
- **Admin Konten:** Pengurus yang mengelola konten publik (profil, proker, galeri, AD/ART) dan memverifikasi pendaftar serta data keanggotaan.
- **Super Admin:** Pengurus inti pengelola hak akses, ekspor data, master data, dan pemantau audit log.

---

## 4. Indikator Keberhasilan (KPI)
| Aspek | Indikator Target |
|---|---|
| **Kualitas Web Publik** | Skor Google Lighthouse Mobile: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90 |
| **Akurasi Data** | 100% data tersimpan di PostgreSQL (Neon) dengan skema baku dan validasi wilayah resmi Kemendagri |
| **Efisiensi Pengurus** | Admin memvalidasi atau sistem meng-auto-aktifkan pendaftar dalam 24 jam tanpa intervensi manual server cron |
| **Biaya Operasional** | Rp0/bulan pada v1 memanfaatkan batas gratis Cloudflare Pages, R2, Neon, Clerk, dan Resend |
| **Keamanan Data** | Zero data leak; data pribadi detail alamat dan kontak terproteksi di tingkat server sesuai UU PDP No. 27/2022 |

---

## 5. Prinsip Produk
- **Sederhana & Hemat Biaya:** Menghindari over-engineering; arsitektur stateless edge functions tanpa server background berbayar.
- **Mobile First:** Mayoritas anggota mengakses menggunakan ponsel pintar (responsif mulai lebar 360px).
- **Privasi sebagai Prioritas (Privacy by Design):** Data kontak memiliki saklar sembunyikan; data alamat sensitif hanya dapat diakses pemilik dan admin dengan pencatatan audit log ketat.
- **Transparansi & Akuntabilitas:** Setiap aksi perubahan data sensitif, persetujuan, penolakan, dan ekspor terekam di audit trail.

---

## 6. Ruang Lingkup yang Sengaja Dikecualikan dari v1 (Non-Goals)
Fitur-fitur berikut ditunda ke rilis v2 atau fase berikutnya:
1. **Papan Lowongan/Karier Interaktif:** Hanya mengumpulkan data pekerjaan alumni di v1.
2. **Payment Gateway & Donasi Online:** Butuh badan hukum resmi, rekening penampung yayasan/organisasi, dan kepatuhan finansial.
3. **Forum Diskusi / Obrolan (Chat) Real-time:** Membebani kuota compute dan memicu biaya database.
4. **Blog / Berita Dinamis Terpisah:** Sudah terwakili oleh deskripsi kaya Program Kerja & Galeri.
5. **Aplikasi Mobile Native (Android/iOS):** Cukup web responsif PWA-ready.
6. **Multi-bahasa (Inggris):** Seluruh antarmuka fokus 100% Bahasa Indonesia.
