# Keamanan & Perlindungan Privasi Data — Website KAPPAMA

Dokumen ini memuat model ancaman, protokol mitigasi, kepatuhan terhadap Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27 Tahun 2022), serta tata kelola serah terima akses kepengurusan KAPPAMA.

---

## 1. Kepatuhan UU Pelindungan Data Pribadi (UU No. 27/2022)

Sebagai organisasi yang memproses data pribadi mahasiswa dan pelajar, KAPPAMA menerapkan prinsip dasar pelindungan data:
1. **Dasar Hukum & Persetujuan Eksplisit:** 
   - Setiap pendaftar wajib mencentang persetujuan pemrosesan data saat onboarding. Waktu (*timestamp*) dan versi klausul persetujuan disimpan di kolom `consent_at` dan `consent_version`.
2. **Minimisasi Data & Pembatasan Tujuan:**
   - Hanya mengumpulkan data yang relevan untuk kebutuhan keorganisasian dan jejaring alumni.
   - Kolom detail alamat (`address_detail`: RT/RW/Dusun) digolongkan sebagai **data sensitif/pribadi ketat**. Data ini **hanya** dapat diakses oleh pemilik data dan pengurus (Admin Konten / Super Admin) untuk verifikasi. Data ini **TIDAK PERNAH** dikembalikan pada endpoint direktori anggota umum.
3. **Privasi Komunikasi:**
   - Nomor WhatsApp dan email dilengkapi saklar pengaturan `hide_contact`. Jika diaktifkan anggota, kontak tidak akan ditampilkan kepada sesama anggota biasa di direktori.
4. **Hak Subjek Data:**
   - **Hak Akses & Koreksi:** Setiap anggota dapat melihat dan memperbarui data profilnya melalui menu `/profil-saya`.
   - **Hak Penghapusan (Right to be Forgotten):** Anggota berhak mengajukan permohonan penonaktifan atau penghapusan data secara mandiri atau melalui Super Admin.
   - **Hak Portabilitas Data:** Fasilitas ekspor data diri mandiri dalam format terstruktur.

---

## 2. Model Ancaman & Kontrol Keamanan

| Vektor Ancaman | Risiko | Kontrol Mitigasi Teknis |
|---|---|---|
| **Bot Scraping & Registrasi Massal** | Spam database, kehabisan kuota gratis, data palsu | Cloudflare Turnstile diverifikasi di server; rate-limiting per IP pada endpoint onboarding; proteksi bot bawaan Clerk |
| **Insecure Direct Object Reference (IDOR)** | Anggota mengedit profil orang lain atau mengakses data sensitif anggota lain | Verifikasi kepemilikan data (`userId === auth.userId`) atau validasi peran admin (`role IN ('content_admin', 'super_admin')`) di tingkat server |
| **Cross-Site Scripting (XSS)** | Penyusupan script melalui deskripsi teks kaya proker atau profil | Sanitasi HTML ketat di server (whitelist tag aman: `p`, `b`, `i`, `ul`, `ol`, `li`, `h2`, `h3`, `a`); CSP ketat melalui Cloudflare `_headers` |
| **Data Exfiltration oleh Pihak Ketiga** | Kebocoran data direktori | Seluruh endpoint direktori `/api/members/*` mewajibkan token JWT Clerk dengan status keanggotaan `active`; pencarian tidak diindeks mesin pencari (`robots.txt: Disallow /anggota/`, `noindex`) |
| **Penyalahgunaan Akun Admin** | Admin mengekspor atau menyunting data tanpa tanggung jawab | Setiap aktivitas ekspor data, persetujuan, penolakan, penangguhan (*suspend*), dan perubahan peran dicatat permanen di `audit_logs` |
| **Penyusupan Berkas Unggahan** | Unggahan malware / eksekusi skrip berbahaya lewat file gambar | Validasi MIME type & ekstensi gambar; upload menggunakan direct signed upload Cloudinary berumur pendek yang dibatasi folder dan ukuran; `CLOUDINARY_API_SECRET` tersimpan aman di server dan tidak pernah terekspos ke klien |

---

## 3. Analisis Risiko Fitur Auto-Aktif 24 Jam

PRD menetapkan bahwa jika pendaftar berstatus `pending` selama 24 jam tanpa ditolak oleh admin, statusnya berubah otomatis menjadi `active` (`approval_type = 'auto'`).

### Potensi Risiko:
Pendaftar yang bukan mahasiswa Pacitan (misal: spammer) bisa mendapatkan akses ke direktori anggota dan melihat nama serta profil anggota lain setelah 24 jam jika admin luput memeriksa antrean.

### Prosedur Mitigasi:
1. **Penyaringan Awal Ketat di Onboarding:**
   - Pendaftar wajib memilih Kecamatan yang valid dari 12 Kecamatan di Pacitan.
   - Validasi Turnstile wajib lulus sebelum data masuk status `pending`.
2. **Notifikasi Rutin:**
   - Ringkasan email transaksional dikirimkan kepada Super Admin saat ada antrean pendaftar baru yang menunggu tinjauan.
3. **Pemberian Hak Penangguhan Belakangan:**
   - Admin Konten dan Super Admin memiliki tombol langsung `Tangguhkan (Suspend)` dan `Tolak` pada setiap anggota yang telah terlanjur aktif jika ditemukan ketidaksesuaian data di kemudian hari.
4. **Pernyataan Kerahasiaan Pengurus:**
   - Seluruh pemegang peran Admin Konten dan Super Admin diwajibkan menyetujui pakta integritas kerahasiaan data keanggotaan KAPPAMA.

---

## 4. Retensi Data & Keamanan Cadangan (Backup)

- **Masa Retensi:** Data anggota aktif disimpan selama berstatus mahasiswa di Malang. Saat lulus, anggota dialihkan ke tipe `alumni`.
- **Soft-Delete:** Akun yang dihapus oleh pengguna akan ditandai `deleted_at = NOW()` dan disembunyikan dari seluruh kueri publik maupun internal. Data fisik akan dibersihkan secara terjadwal setelah periode tenggang 30 hari.
- **Pencatatan Audit Trail:** Berkas log di tabel `audit_logs` tidak mencantumkan nilai data sensitif mentah (misal: dilarang mencatat plaintext nomor WhatsApp, alamat lengkap, atau password/token), melainkan hanya referensi field yang berubah dan ID aktor.

---

## 5. Prosedur Pergantian Pengurus (Handover Protocol)

Untuk menjamin kelangsungan akses dan mencegah terkunci saat pergantian kepengurusan tahunan KAPPAMA:
1. **Aturan Minimal Super Admin:** Sistem database menolak penurunan peran atau penonaktifan jika hanya tersisa 1 (satu) Super Admin aktif di organisasi.
2. **Prosedur Serah Terima Tahunan:**
   - Super Admin demisioner mengangkat minimal 2 (dua) orang pengurus baru terpilih (misal: Ketua Umum dan Sekretaris Jenderal baru) menjadi `super_admin` melalui menu `/admin/peran`.
   - Pengurus baru mengonfirmasi akses mereka berhasil.
   - Peran pengurus demisioner diturunkan menjadi `member` atau `alumni`.
   - Seluruh mutasi peran ini tercatat otomatis di `audit_logs`.
3. **Prosedur Darurat (Emergency Recovery):**
   - Jika seluruh admin kehilangan akses, pemilik proyek dapat memanfaatkan environment variable darurat `BOOTSTRAP_SUPER_ADMIN_EMAIL` di Cloudflare Pages untuk mengembalikan hak akses akun resmi organisasi.
