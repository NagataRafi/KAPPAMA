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

- [ ] Buka semua halaman publik pada viewport 360px (lebar layar smartphone kecil). Pastikan tidak ada horizontal scrollbar liar (*overflow-x*).
- [ ] Navbar mobile: Menu hamburger responsif, mudah ditutup, dan link navigasi dapat diklik tanpa tumpang tindih.
- [ ] PDF Viewer AD/ART: Tampil tertanam atau menampilkan tombol alternatif unduh langsung di peramban mobile (iOS Safari & Android Chrome).
- [ ] Lighthouse Mobile Audit:
  - Skor Performance ≥ 85
  - Skor Accessibility ≥ 90
  - Skor SEO ≥ 90
