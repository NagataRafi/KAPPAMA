# PRD — Website KAPPAMA (Keluarga Pelajar Pacitan di Malang)

> Dokumen ini adalah sumber kebenaran utama (single source of truth) untuk agen pengembang (Antigravity / OpenCode).
> Baca seluruh dokumen sebelum menulis kode. Jika ada konflik antara dokumen ini dan asumsi Anda, dokumen ini menang.
> Jika ada hal yang tidak jelas, catat di bagian "Pertanyaan Terbuka" pada `roadmap.md` dan tanyakan ke pemilik proyek, jangan menebak untuk hal yang menyangkut data pribadi, keamanan, atau biaya.

Versi dokumen: 1.2 (revisi 1.1: Admin Konten dapat menyetujui/menolak pendaftar dan menyunting/menonaktifkan data anggota; revisi 1.2: penyimpanan gambar memakai Cloudinary lewat `StorageService`, Cloudflare R2 ditunda karena aktivasinya terkendala metode pembayaran) · Tanggal: 25 Oktober 2026 · Pemilik proyek: Muhammad Rafi Nagata Afendi

---

## 0. Aturan Kerja Agen (WAJIB)

1. **Mulai dari dokumentasi.** Sebelum membuat kode aplikasi, buat file dokumen pada Bagian 14 di root repositori (kecuali dinyatakan lain). Isi awalnya harus diturunkan dari PRD ini, bukan template kosong.
2. **Bekerja per fase** sesuai Bagian 15. Jangan melompat fase. Setiap akhir fase: perbarui `changelog.md`, `roadmap.md`, dan jalankan `testing-checklist.md` untuk fase tersebut.
3. **Bahasa:** seluruh antarmuka pengguna dan konten dalam **Bahasa Indonesia**. Nama variabel, kode, dan nama tabel dalam bahasa Inggris. Dokumen `.md` ditulis dalam Bahasa Indonesia.
4. **Jangan menyimpan rahasia di repositori.** Semua kunci (Clerk, Neon, Resend, Cloudinary, Turnstile) lewat environment variable. Buat `.env.example` tanpa nilai asli.
5. **Jangan menambah layanan berbayar** atau melampaui batas gratis tanpa persetujuan pemilik proyek.
6. **Setiap keputusan teknis penting** dicatat di `arsitektur.md` bagian "Catatan Keputusan" (apa, kenapa, alternatif yang ditolak).
7. **Data pribadi** diperlakukan sesuai Bagian 10 dan `security-privacy.md`. Jangan pernah menaruh data anggota asli di repositori, contoh, atau log. Gunakan data dummy untuk seed.
8. Gunakan commit kecil dengan pesan jelas (Conventional Commits, misal `feat(members): add onboarding form`).

---

## 1. Ringkasan Produk  

**KAPPAMA** adalah organisasi mahasiswa daerah yang mewadahi pelajar dan mahasiswa asal Pacitan, Jawa Timur, yang menempuh studi di Kota Malang.

Website ini memiliki tiga pilar:

1. **Citra organisasi** — profil, visi misi, struktur pengurus, AD/ART, program kerja, dan galeri yang bisa dilihat siapa saja tanpa login.
2. **Pendataan anggota dan alumni** — pendaftaran anggota baru, persetujuan admin, dan direktori anggota aktif serta alumni yang hanya bisa dilihat oleh anggota yang login.
3. **Jejaring alumni** — fondasi untuk jejaring karier dan donasi (data pekerjaan alumni dikumpulkan sejak v1; fitur lowongan dan donasi masuk roadmap, lihat Bagian 4).

Skala: anggota aktif kurang dari 50 orang per tahun, rata-rata ±50 anggota baru per tahun. Total data dalam beberapa tahun masih kecil, sehingga arsitektur harus **sederhana, murah, dan mudah dirawat pengurus berikutnya**.

---

## 2. Tujuan dan Indikator Keberhasilan

| Tujuan | Indikator |
|---|---|
| Menampilkan organisasi secara profesional | Semua halaman publik tampil benar di mobile dan desktop; skor Lighthouse mobile ≥ 85 (Performance), ≥ 90 (Accessibility, SEO) |
| Mengganti pendataan manual (spreadsheet/formulir) | Seluruh data anggota dan alumni tersimpan di database dengan field baku dan dropdown seragam |
| Menjaga data tetap benar | Admin dapat menyetujui/menolak pendaftar; anggota dapat memperbarui data sendiri |
| Mudah dirawat | Admin konten dapat mengubah konten tanpa menyentuh kode; seluruh biaya bulanan Rp0 pada v1 |
| Menyiapkan jejaring alumni | Data pekerjaan alumni terkumpul dan dapat diekspor/disaring |

---

## 3. Aktor dan Hak Akses

### 3.1 Aktor

| Aktor | Login | Deskripsi |
|---|---|---|
| **Pengunjung** | Tidak | Siapa saja yang membuka website |
| **Anggota** | Ya (Google via Clerk) | Anggota KAPPAMA, bertipe *aktif* atau *alumni*. Hanya status `active` yang boleh melihat direktori |
| **Admin Konten** | Ya | Pengurus yang mengelola konten publik **dan** keanggotaan: menyetujui/menolak pendaftar serta menyunting/menonaktifkan data anggota mana pun |
| **Super Admin** | Ya | Pengurus inti: semua hak Admin Konten + manajemen peran, ekspor, statistik, master data, audit log, pengaturan |

### 3.2 Matriks Hak Akses

| Kemampuan | Pengunjung | Anggota (pending/rejected) | Anggota (active) | Admin Konten | Super Admin |
|---|:--:|:--:|:--:|:--:|:--:|
| Lihat Beranda, Profil, Visi Misi, Struktur, AD/ART, Program Kerja, Galeri | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daftar/login | ✅ | — | — | — | — |
| Lengkapi dan ubah profil sendiri | ❌ | ✅ | ✅ | ✅ | ✅ |
| Lihat status pendaftaran sendiri | ❌ | ✅ | ✅ | ✅ | ✅ |
| Lihat direktori anggota dan alumni | ❌ | ❌ | ✅ | ✅ (jika `active`) | ✅ |
| CRUD Program Kerja, Album/Foto, video YouTube | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ubah Profil organisasi, Visi Misi, Struktur per periode, unggah AD/ART | ❌ | ❌ | ❌ | ✅ | ✅ |
| Setujui/tolak pendaftar | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit/nonaktifkan data anggota mana pun | ❌ | ❌ | ❌ | ✅ | ✅ |
| Kelola peran (angkat/cabut Admin Konten/Super Admin) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ekspor CSV/Excel | ❌ | ❌ | ❌ | ❌ | ✅ |
| Dashboard statistik | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola master data (kampus, prodi, dll.) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lihat audit log | ❌ | ❌ | ❌ | ❌ | ✅ |

Aturan penting:
- Peran disimpan di **database** (sumber kebenaran) dan disalin ke Clerk `publicMetadata` untuk kebutuhan UI saja. **Otorisasi selalu diperiksa di server** (API), bukan hanya di UI.
- Harus selalu ada minimal **satu** Super Admin aktif. Sistem menolak pencabutan Super Admin terakhir.
- Super Admin pertama dibuat lewat prosedur bootstrap terdokumentasi di `deployment.md` (misalnya variabel `BOOTSTRAP_SUPER_ADMIN_EMAIL`), bukan lewat endpoint publik.

---

## 4. Lingkup

### 4.1 Masuk v1
1. Profil organisasi + sub-menu Visi Misi, Struktur Organisasi, AD/ART
2. Program Kerja (deskripsi, foto, video YouTube)
3. Galeri (album foto dan video YouTube)
4. Pendaftaran anggota baru + onboarding profil
5. Direktori anggota aktif dan alumni (khusus login)
6. Profil anggota (ubah data sendiri, termasuk perubahan aktif → alumni)
7. Panel admin: persetujuan, manajemen konten, manajemen pengguna, statistik, ekspor, audit log
8. Notifikasi email (lihat Bagian 13, dengan catatan batasan domain)

### 4.2 Di luar v1 (masuk `roadmap.md` sebagai fase lanjut)
- Papan lowongan/karier alumni
- Donasi/penggalangan dana (butuh keputusan hukum, transparansi, dan payment gateway)
- Berita/pengumuman/blog
- Forum atau chat antaranggota
- Aplikasi mobile native
- Versi bahasa Inggris

> Catatan: tujuan "jejaring karier dan donasi" tetap dipertahankan. Untuk v1, hanya data pekerjaan alumni yang dikumpulkan agar fitur lanjutan nanti punya fondasi data.

---

## 5. Stack dan Keputusan Teknis

Layanan yang **sudah ditetapkan pemilik proyek** (jangan diganti):

| Kebutuhan | Layanan |
|---|---|
| Hosting frontend + fungsi server | Cloudflare Pages (+ Pages Functions) |
| Database | Neon (PostgreSQL) |
| Autentikasi | Clerk (login Google) |
| Email | Resend |
| Penyimpanan gambar | Cloudinary (paket Free), diakses lewat antarmuka `StorageService`. Cloudflare R2 ditunda sebagai adapter alternatif (lihat 5.1 butir 5) |
| Verifikasi bukan robot | Cloudflare Turnstile (dan proteksi bot bawaan Clerk) |

Pilihan teknis yang **diusulkan** (agen boleh mengusulkan perubahan beralasan lewat `arsitektur.md`, tetapi harus tetap muat di tier gratis dan deployable ke Cloudflare Pages):

- **Frontend:** React + Vite + TypeScript + Tailwind CSS, komponen UI dengan shadcn/ui (Radix). Routing: React Router. Data fetching: TanStack Query.
- **Backend:** Cloudflare **Pages Functions** (folder `/functions`) memakai Hono sebagai router API di bawah `/api/*`.
- **ORM/Migrasi:** Drizzle ORM + `@neondatabase/serverless` (driver HTTP/WebSocket yang cocok untuk edge).
- **Validasi:** Zod (skema dibagi pakai bersama antara frontend dan backend).
- **Auth di server:** verifikasi token sesi Clerk di setiap request ber-otorisasi (`@clerk/backend`).
- **Penyimpanan gambar:** Cloudinary. Unggahan dari Admin memakai **signed upload**: Function memverifikasi peran Admin, membuat signature dengan `CLOUDINARY_API_SECRET` (rahasia, hanya di server), lalu klien mengirim berkas langsung ke Cloudinary. Gambar disajikan dari CDN Cloudinary dengan transformasi otomatis (`f_auto,q_auto`, lebar sesuai layar). Semua akses lewat `StorageService` (metode: buat signature unggah, bangun URL, hapus) dengan adapter `CloudinaryStorage` dan adapter lokal/mock untuk pengembangan. Adapter R2 boleh ditambahkan nanti tanpa mengubah kode fitur.
- **Email:** Resend SDK/REST dari Function.
- **Linting/format/test:** ESLint, Prettier, Vitest (unit), Playwright (E2E ringan untuk alur kritis).
- **Manajer paket:** pnpm.

### 5.1 Batasan layanan yang HARUS diperhatikan agen

1. **Tanpa domain sendiri**, Clerk hanya dapat memakai *development instance*, dan Resend hanya dapat mengirim email ke alamat pemilik akun Resend (belum bisa ke anggota). Pemilik proyek berencana membeli domain. Maka:
   - **Fase 1–3** dibangun dengan Clerk development instance dan subdomain `*.pages.dev`.
   - Fitur email ke anggota **dibangun dengan antarmuka (abstraksi) yang bisa dimatikan** lewat flag, lalu diaktifkan setelah domain terverifikasi di Resend.
   - Selama email belum aktif, notifikasi status pendaftaran harus tetap terlihat **di dalam aplikasi** (halaman status).
   - Migrasi ke Clerk production + domain kustom didokumentasikan di `deployment.md` sebagai checklist tersendiri.
2. **Cron/penjadwalan:** Pages Functions tidak mendukung Cron Trigger. Aturan "otomatis aktif setelah 24 jam" harus dihitung **secara lazy** di server (lihat Bagian 7). Worker terpisah dengan Cron boleh ditambahkan sebagai pelengkap (misalnya untuk mengirim email), bukan sebagai satu-satunya mekanisme.
3. **Kuota gratis:** pantau batas Neon (penyimpanan dan jam komputasi), Cloudinary (25 kredit/bulan sebagai satu kuota bersama untuk penyimpanan, bandwidth, dan transformasi; penyimpanan juga menghitung salinan hasil transformasi), Resend (100 email/hari, 3.000/bulan), Pages Functions (request harian). Dokumentasikan perkiraan pemakaian di `arsitektur.md`.
4. Neon bisa "tidur" saat idle sehingga request pertama lambat; tangani dengan skeleton/loading state yang baik dan jangan menganggapnya error.
5. **Penyimpanan (revisi 1.2):** aktivasi R2 butuh metode pembayaran yang belum bisa disambungkan pemilik proyek, jadi v1 memakai Cloudinary.
   - Variabel lingkungan: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (rahasia). Hapus `R2_BUCKET_NAME` dari `.env.example` dan `wrangler.toml`; binding R2 boleh dihapus sampai adapter R2 benar-benar dipakai.
   - Simpan **`public_id` Cloudinary** (bukan URL penuh) di kolom `*_key`; URL dibangun lewat `StorageService` agar penyimpanan bisa dipindah nanti.
   - **PDF AD/ART:** pengiriman PDF dari akun Cloudinary gratis belum terverifikasi dan mungkin diblokir secara bawaan oleh setelan keamanan akun. Agen harus mengujinya pada Fase 2/4. Jika tidak bisa diaktifkan, pakai cadangan: berkas statis di `public/` (diganti lewat deploy) atau tautan PDF dari Google Drive, tanpa mengubah antarmuka admin.
   - Hitung estimasi pemakaian kredit di `arsitektur.md` (perkiraan awal: ±450 foto per tahun × ±400 KB masih jauh di bawah kuota).
   - Pantau kuota dan jangan melewati batas gratis tanpa persetujuan pemilik proyek.

---

## 6. Spesifikasi Fitur

### F1. Profil Organisasi (publik)

Menu **Profil** dengan sub-menu:

| Sub-menu | Isi | Dikelola oleh |
|---|---|---|
| **Tentang KAPPAMA** | Pengertian organisasi (teks kaya ringan), sejarah singkat, logo, kontak resmi (email, Instagram, alamat sekretariat jika ada) | Admin Konten |
| **Visi & Misi** | Visi (teks) dan misi (daftar bernomor) | Admin Konten |
| **Struktur Organisasi** | Per **periode**: **Pembina, Penasihat, Ketua, Wakil Ketua Umum** (nama, foto, kampus/prodi opsional). Pengunjung dapat memilih periode (default = periode terbaru/aktif) | Admin Konten |
| **AD/ART** | PDF yang **ditampilkan di halaman (viewer tertanam)** dan **dapat diunduh**. Riwayat versi disimpan (judul, tanggal berlaku, file) dan versi terbaru ditandai aktif | Admin Konten |

Aturan:
- Teks pembuka "Tentang" memakai definisi dari pemilik proyek: *"KAPPAMA (Keluarga Pelajar Pacitan di Malang) adalah organisasi mahasiswa daerah yang mewadahi para pelajar dan mahasiswa asal Pacitan, Jawa Timur, yang sedang menempuh studi di Kota Malang."* Konten lain berupa placeholder yang bisa diedit admin, bukan karangan fakta. **Jangan mengarang sejarah, visi, atau nama pengurus.**
- Struktur organisasi hanya 4 jabatan di atas. Model data tetap dibuat generik (tabel jabatan) agar mudah dikembangkan nanti, tetapi UI v1 hanya menampilkan empat itu.
- Viewer PDF: `<iframe>`/`<object>` atau pdf.js; harus ada tombol unduh dan fallback jika browser mobile tidak bisa menampilkan.

### F2. Program Kerja (publik)

- **Daftar program kerja** berbentuk kartu (gambar sampul, judul, tahun, ringkasan, tanggal pelaksanaan). Tidak perlu login.
- **Filter:** per **tahun** dan per **universitas** (universitas dipakai sebagai label opsional pada program, misalnya program yang digelar di/bekerja sama dengan kampus tertentu). Ada juga pencarian judul.
- **Detail program kerja:** judul, tahun/periode, tanggal dan lokasi, deskripsi rinci (teks kaya ringan), tujuan, sasaran, penanggung jawab (teks), galeri foto program (lightbox), dan **video YouTube** (satu atau lebih, disematkan lewat URL/ID).
- **Admin Konten** (dan Super Admin) membuat, mengubah, menghapus (soft delete), dan mengatur status *draft/terbit*.
- Upload foto: lihat batas pada Bagian 10.
- Video **hanya tautan YouTube** (validasi URL, simpan video ID, sematkan dengan `youtube-nocookie.com`, lazy-load). Tidak ada unggah video ke penyimpanan gambar.

### F3. Direktori Anggota & Alumni (khusus login, status `active`)

**Akses:** hanya anggota berstatus `active`. Pengunjung diarahkan ke login; anggota `pending/rejected` diarahkan ke halaman status.

**Tampilan:**
- Tab/penyaring tipe: **Semua · Anggota Aktif · Alumni**
- Tabel/kartu dengan pencarian nama dan filter: **angkatan, universitas, program studi, kecamatan asal, tipe**
- Halaman detail anggota
- Pagination (mis. 20 per halaman)

**Field data anggota (semua):**

| Field | Tipe/Input | Wajib |
|---|---|---|
| Nama lengkap | teks | Ya |
| Username | teks unik, huruf kecil/angka/underscore, 3–20 karakter | Ya |
| Email | otomatis dari akun Google (tidak bisa diubah) | Ya |
| Nomor WhatsApp | format Indonesia, dinormalisasi ke `+62…` | Ya |
| Instagram | username (tanpa URL) | Tidak |
| LinkedIn | URL profil | **Opsional** |
| Tipe | `aktif` / `alumni` | Ya |
| Angkatan | tahun (YYYY) — default dipahami sebagai tahun masuk kuliah (lihat Pertanyaan Terbuka) | Ya |
| Universitas | dropdown master data + opsi "Lainnya" | Ya |
| Program studi | dropdown bergantung pada universitas + opsi "Lainnya" | Ya |
| Alamat asal (Pacitan) | **dropdown berjenjang:** Kecamatan → Desa/Kelurahan, ditambah kolom detail (dusun/RT/RW/jalan) | Ya |
| Foto profil | opsional (jika tidak ada, pakai avatar Google) | Tidak |

**Field khusus alumni** (muncul bila tipe = `alumni`):

| Field | Input | Wajib |
|---|---|---|
| Tahun lulus | tahun | Ya |
| Status saat ini | `bekerja` / `wirausaha` / `studi lanjut` / `mencari kerja` / `lainnya` | Ya |
| Jabatan/posisi | teks | Jika bekerja/wirausaha |
| Instansi/perusahaan/usaha | teks | Jika bekerja/wirausaha |
| Bidang/industri | dropdown master data | Disarankan |
| Kota tempat bekerja | teks | Tidak |

**Pilihan "daftar sebagai":** saat mengisi data, anggota memilih **Anggota Aktif** atau **Alumni**; formulir menyesuaikan field-nya (seperti daftar alumni anggota KAPPAMA).

**Visibilitas data antar-anggota (default yang diusulkan, harap dikonfirmasi pemilik proyek):**
- Terlihat oleh anggota `active`: nama, foto, tipe, angkatan, universitas, prodi, **kecamatan dan desa asal**, data pekerjaan alumni, Instagram, LinkedIn.
- **WhatsApp dan email:** terlihat oleh anggota `active`, namun setiap anggota punya **saklar "sembunyikan kontak saya dari direktori"** (default: tampil).
- **Detail alamat lengkap (dusun/RT/RW/jalan):** hanya terlihat oleh pemilik data, Admin Konten, dan Super Admin (diperlukan untuk verifikasi dan pengelolaan data). Setiap akses admin ke detail anggota dicatat di audit log. Ini data pribadi sensitif dan tidak diperlukan untuk jejaring antaranggota.
- Seluruh data **tidak pernah** tampil ke publik/pengunjung dan tidak boleh muncul di sitemap, SEO, atau API publik.

**Ubah data sendiri:** lewat menu **Profil Saya**. Perubahan tipe `aktif → alumni` dilakukan anggota sendiri (memunculkan field alumni). Perubahan data tidak memerlukan persetujuan ulang, kecuali perubahan nama lengkap/universitas yang dicatat di audit log.

### F4. Galeri (publik)

- Album per **tahun/kegiatan** (judul, tanggal, deskripsi singkat, foto sampul).
- Isi album: foto (grid + lightbox) dan tautan video YouTube.
- Filter per tahun. Opsional: album dapat dikaitkan ke Program Kerja.
- Admin Konten mengelola album/foto (unggah banyak sekaligus, ubah urutan, hapus).

### F5. Pendaftaran Anggota Baru dan Onboarding

Halaman publik **Daftar Anggota**: penjelasan syarat singkat (pelajar/mahasiswa asal Pacitan yang menempuh studi di Malang), alur pendaftaran, tombol **Daftar dengan Google**.

Alur:
1. Pengguna klik daftar → login Google (Clerk). Proteksi bot Clerk aktif.
2. Setelah login pertama, pengguna **wajib** menyelesaikan **Onboarding** sebelum mengakses fitur lain (route guard di klien dan server):
   - **Nama lengkap** (wajib)
   - **Username** (wajib, unik)
   - **Nomor WhatsApp** (wajib)
   - Lalu field anggota pada F3 (tipe, angkatan, universitas, prodi, alamat asal, dst.)
   - **Verifikasi "bukan robot"** (Cloudflare Turnstile), token **diverifikasi di server**
   - Persetujuan pemrosesan data pribadi (checkbox; simpan waktu dan versi teks persetujuan)
3. Setelah kirim: status `pending`, waktu `submitted_at` dicatat. Pengguna melihat halaman status ("menunggu persetujuan, maksimal 24 jam").
4. Alur persetujuan mengikuti Bagian 7.

### F6. Panel Admin (`/admin`)

**Admin Konten dan Super Admin (hak setara untuk poin di bawah ini):**
- Kelola Program Kerja, Album/Foto, Profil/Visi-Misi, Struktur per periode, AD/ART.
- **Antrean persetujuan:** daftar pendaftar `pending` dengan sisa waktu menuju auto-aktif; aksi Setujui / Tolak (alasan wajib) / Lihat detail.
- **Manajemen anggota:** cari, filter, ubah data, nonaktifkan (suspend), pulihkan. Setiap penyuntingan atau penangguhan oleh admin wajib dicatat di audit log (siapa, kapan, field apa yang berubah, tanpa menyimpan isi data pribadi di log).

**Khusus Super Admin:**
- **Manajemen peran:** angkat/cabut Admin Konten dan Super Admin (dengan konfirmasi).
- **Dashboard statistik:** total anggota aktif, total alumni, pendaftar pending, sebaran per universitas, per angkatan, per kecamatan, tren pendaftar per bulan.
- **Ekspor CSV dan Excel (.xlsx)** dengan filter yang sama dengan direktori. Ekspor mencantumkan data pribadi → wajib konfirmasi, dicatat di audit log (siapa, kapan, filter).
- **Master data:** universitas, program studi, bidang industri, kecamatan/desa (baca-saja kecuali koreksi).
- **Audit log:** persetujuan/penolakan, penyuntingan/penangguhan data anggota oleh admin, perubahan peran, ekspor, penghapusan, perubahan data sensitif. Hanya Super Admin yang dapat melihat audit log.

---

## 7. Alur Persetujuan dengan Auto-Aktif 24 Jam

Status keanggotaan: `incomplete` → `pending` → `active` | `rejected` | `suspended`.

Aturan:
1. Saat onboarding selesai: status = `pending`, `submitted_at = now()`.
2. **Admin (Admin Konten atau Super Admin) menyetujui** → `active`, catat `approved_by`, `approved_at`.
3. **Admin (Admin Konten atau Super Admin) menolak** (alasan wajib) → `rejected`. Pengguna melihat alasan, dapat memperbaiki data dan **mengajukan ulang** (reset `submitted_at`).
4. **Jika `pending` dan sudah lewat 24 jam sejak `submitted_at` tanpa ditolak** → dianggap `active` otomatis (`approval_type = 'auto'`).
5. **Implementasi lazy (wajib):** status efektif dihitung di server: bila `status = 'pending' AND now() >= submitted_at + interval '24 hours'` maka diperlakukan sebagai `active` dan **dipersist** (update) saat pertama kali ada request yang menyentuh data tersebut (login, buka direktori, buka antrean admin). Semua pemeriksaan akses memakai fungsi tunggal `getEffectiveStatus()` agar konsisten dan mudah diuji.
6. Pendaftar yang sudah auto-aktif tetap dapat **ditangguhkan/ditolak belakangan** oleh Admin Konten atau Super Admin.
7. Seluruh transisi dicatat di `audit_log`.
8. Tulis unit test untuk batas waktu (23:59, 24:00, 24:01), pengajuan ulang, dan penolakan sebelum 24 jam.

> Catatan risiko untuk `security-privacy.md`: karena auto-aktif membuka akses direktori tanpa verifikasi manusia, Admin diminta rutin meninjau antrean. Pertimbangkan penyaringan otomatis (mis. kecamatan asal harus di Pacitan) dan pembatasan laju pendaftaran.

---

## 8. Model Data (tingkat tinggi — rincian di `database-schema.md`)

Entitas inti (nama tabel dalam bahasa Inggris, snake_case, `uuid` sebagai PK, `created_at/updated_at`):

- `users` — `clerk_user_id` (unik), email, role (`member|content_admin|super_admin`), timestamps
- `member_profiles` — user_id, full_name, username (unik), whatsapp, instagram, linkedin, member_type (`active|alumni`), cohort_year, university_id, university_other, study_program_id, study_program_other, district_id, village_id, address_detail, photo_key, hide_contact, status, submitted_at, approved_at, approved_by, approval_type (`manual|auto`), rejection_reason, consent_at, consent_version, deleted_at
- `alumni_details` — member_id, graduation_year, current_status, job_title, organization, industry_id, work_city
- `universities`, `study_programs`, `industries` — master data (ada flag `is_active`)
- `districts` (kecamatan), `villages` (desa/kelurahan) — wilayah Kabupaten Pacitan
- `org_periods` — label periode (mis. 2026/2027), tahun mulai/akhir, `is_current`
- `org_leaders` — period_id, position (`pembina|penasihat|ketua|wakil_ketua_umum`), name, photo_key, campus/prodi opsional, urutan
- `org_profile` — satu baris: teks tentang, visi, misi (terstruktur), kontak resmi, logo_key
- `bylaws_documents` — judul, file_key, tanggal berlaku, `is_active`
- `programs` — judul, slug, tahun, tanggal, lokasi, ringkasan, deskripsi, tujuan, sasaran, penanggung jawab, cover_key, university_id (opsional), status (`draft|published`)
- `program_media` — program_id, tipe (`image|youtube`), file_key / youtube_id, caption, urutan
- `albums`, `album_media` — struktur serupa untuk galeri, optional `program_id`
- `audit_logs` — actor_id, action, entity, entity_id, metadata (JSON tanpa data pribadi berlebih), ip_hash, created_at
- `export_logs` (boleh digabung ke audit_logs)

Aturan data:
- Kolom `*_key` (photo_key, logo_key, file_key, cover_key) menyimpan `public_id` Cloudinary (atau path berkas statis bila memakai cadangan PDF), bukan URL penuh.
- Indeks pada: `member_profiles(status, member_type)`, `(university_id)`, `(cohort_year)`, `(district_id)`, `username`, dan pencarian nama (trigram/`ILIKE` cukup untuk skala ini).
- Soft delete untuk anggota dan konten; hapus permanen hanya oleh Super Admin dengan konfirmasi.
- Migrasi lewat Drizzle, tersimpan di repositori, dapat dijalankan ulang.
- Seed: master data kecamatan, universitas Malang, contoh prodi, bidang industri; **data dummy** untuk pengembangan.

---

## 9. Master Data dan Dropdown

1. **Kecamatan Kabupaten Pacitan (12):** Donorojo, Pringkuku, Punung, Pacitan, Kebonagung, Arjosari, Nawangan, Bandar, Tegalombo, Tulakan, Ngadirojo, Sudimoro.
2. **Desa/Kelurahan:** agen harus mengambil dari sumber resmi (mis. data wilayah administratif Kemendagri/BPS) dan **memverifikasi** hasilnya, lalu menyimpan sumber dan tanggal pengambilan di `database-schema.md`. Jangan menulis daftar desa dari ingatan.
3. **Universitas di Malang (seed awal, bisa ditambah Super Admin):** Universitas Brawijaya, Universitas Negeri Malang, UIN Maulana Malik Ibrahim, Politeknik Negeri Malang, Universitas Muhammadiyah Malang, Universitas Islam Malang, Universitas Tribhuwana Tunggadewi, Universitas Kanjuruhan, Institut Teknologi Nasional Malang, Universitas Widyagama, Universitas Merdeka, STIKI Malang, Poltekkes Kemenkes Malang, dan **Lainnya** (teks bebas, ditinjau Super Admin untuk dijadikan master data). Agen memverifikasi nama resmi sebelum seed.
4. **Program studi:** master per universitas; boleh dimulai kosong/ringkas dengan opsi "Lainnya", lalu tumbuh dari input "Lainnya" yang disetujui admin.
5. **Bidang industri:** daftar singkat baku (pendidikan, teknologi informasi, kesehatan, keuangan, pemerintahan, manufaktur, pertanian, wirausaha, dll.).

---

## 10. Persyaratan Non-Fungsional

### 10.1 Keamanan
- Otorisasi di server untuk **setiap** endpoint; pola "deny by default".
- Validasi semua input dengan Zod di server; escape/sanitasi konten teks kaya (whitelist tag; cegah XSS).
- Turnstile diverifikasi di server pada onboarding dan formulir publik lain.
- Rate limiting pada endpoint sensitif (onboarding, unggah, ekspor, pencarian direktori).
- Unggahan file: hanya Admin Konten/Super Admin yang dapat meminta signature unggah; signature berumur singkat dan dibatasi ke folder (`kappama/<jenis>/`), tipe berkas, dan ukuran; validasi tipe MIME dan ekstensi; `public_id` di-generate (UUID), tidak mempercayai nama dari klien. `CLOUDINARY_API_SECRET` tidak pernah dikirim ke klien.
- Header keamanan (CSP, X-Content-Type-Options, Referrer-Policy, frame-ancestors) melalui `_headers`; sematan YouTube diizinkan lewat CSP.
- Tidak ada data anggota pada respons API publik, sitemap, atau log. Log tidak boleh memuat WA/email/alamat.
- Pencegahan IDOR: akses data anggota selalu diperiksa terhadap peran dan status pemohon.
- Secret hanya di environment variable Cloudflare; `.env` masuk `.gitignore`.

### 10.2 Privasi dan kepatuhan
- Patuhi prinsip **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi**: tujuan jelas, persetujuan eksplisit, minimisasi data, hak akses/koreksi/penghapusan.
- Sediakan halaman **Kebijakan Privasi** dan **Syarat Penggunaan** (draf oleh agen, **ditandai harus ditinjau pengurus**; agen bukan penasihat hukum).
- Fitur **"Hapus akun/data saya"** (permintaan ke Super Admin atau penghapusan mandiri dengan konfirmasi) dan **"Ekspor data saya"** disiapkan minimal sebagai alur permintaan.
- Masa retensi data dan prosedur pergantian pengurus (serah terima akses Super Admin) didokumentasikan di `security-privacy.md`.

### 10.3 Batas unggahan (default, bisa dikonfigurasi)
- Foto: JPG/PNG/WebP, maks 5 MB per file sebelum kompres; klien mengompres ke WebP, sisi terpanjang ≤ 1600 px (sampul ≤ 1920 px), sasaran ≤ 400 KB.
- Maksimal 30 foto per program dan 60 foto per album.
- Foto profil: maks 2 MB, dipotong persegi.
- PDF AD/ART: maks 10 MB.
- Hitung estimasi pemakaian kredit Cloudinary (penyimpanan + bandwidth + transformasi) dan tulis di `arsitektur.md`.

### 10.4 Performa
- Halaman publik ringan: gambar responsif (`srcset`), lazy-loading, font terbatas, kode ter-split per route.
- Gambar disajikan dari CDN Cloudinary dengan `f_auto,q_auto` dan lebar sesuai layar; cache header untuk aset statis. Gambar statis bawaan situs (hero, logo, ornamen) boleh ditaruh di `public/`.
- Target: LCP < 2,5 detik pada jaringan 4G.

### 10.5 Aksesibilitas dan SEO
- Kontras warna memenuhi WCAG AA; navigasi keyboard; label form; teks alt pada gambar.
- Responsif mulai 360 px; mobile-first (mayoritas pengguna mahasiswa lewat ponsel).
- Meta tag, Open Graph, sitemap, dan `robots.txt` untuk **halaman publik saja**; halaman anggota/admin `noindex`.

### 10.6 Keandalan
- Penanganan error ramah pengguna (halaman 404/500, toast, state kosong).
- Pencadangan: dokumentasikan prosedur ekspor/backup database berkala (mis. dump manual atau fitur point-in-time Neon sesuai tier) di `deployment.md`.

---

## 11. Desain dan Antarmuka

### 11.1 Karakter visual
- **Formal organisasi, modern, dan bernuansa budaya Pacitan.**
- **Warna utama: biru dongker (navy).** Warna aksen hangat (mis. emas/kuning soga atau amber lembut yang terinspirasi batik) untuk CTA dan sorotan. Kode warna pasti ditentukan di `design-system.md` dan dikonfirmasi pemilik proyek.
- Nuansa budaya Pacitan: gunakan **motif batik/ornamen secara halus** (pola latar tipis, pembatas section, ikon) dan fotografi lokal; agen harus **meriset dan menggunakan motif yang benar** (batik Pacitan dan ikon daerah), serta tidak memakai aset berhak cipta tanpa izin. Aset foto/ilustrasi asli disediakan pemilik proyek; sebelum itu gunakan placeholder yang jelas bertanda.
- Tipografi: kombinasi sans-serif modern yang terbaca (mis. Plus Jakarta Sans/Inter) dengan opsi judul serif tipis untuk kesan formal. Final di `design-system.md`.

### 11.2 Referensi desain terlampir
Pemilik proyek menyediakan satu gambar referensi (halaman beranda situs wisata). **Simpan di `docs/design-reference/home-reference.png`** (pemilik proyek menaruhnya; jika berkas belum ada, minta ke pemilik proyek). **Tiru struktur dan nuansa layout, bukan merek, teks, atau gambarnya.** Elemen yang dipetik dan dipetakan ke KAPPAMA:

| Elemen referensi | Padanan di KAPPAMA |
|---|---|
| Navigasi atas lengket (logo, menu, ikon aksi) | Logo KAPPAMA, menu: Beranda · Profil ▾ · Program Kerja · Galeri · Anggota · Daftar; tombol Masuk/avatar |
| Hero layar penuh dengan judul besar, subjudul, CTA oranye | Hero foto Pacitan/kegiatan KAPPAMA, tagline organisasi, CTA "Daftar Anggota" + "Lihat Program Kerja" |
| Kartu pencarian melayang menimpa hero | Kartu melayang berisi tautan cepat (Profil, Program Kerja, Galeri, Direktori) atau statistik ringkas |
| Deretan 4 poin keunggulan dengan ikon | "Mengapa KAPPAMA": persaudaraan, pengembangan diri, jejaring alumni, pengabdian daerah |
| Kartu destinasi populer (gambar + harga) | Kartu **Program Kerja unggulan** (gambar + tahun + judul) |
| Chip kategori | Chip filter tahun dan universitas |
| Seksi editorial 2 kolom (panduan/cerita) | Cuplikan galeri/kegiatan terbaru |
| Banner CTA lebar penuh | Banner ajakan mendaftar/menghubungkan alumni |
| Baris statistik (100+, 50K+, 4.8…) | Statistik: anggota aktif, alumni, program kerja, kampus (dihitung nyata dari database, bukan angka karangan) |
| Footer multi-kolom + newsletter | Footer: tautan, kontak, media sosial, kebijakan privasi (tanpa newsletter di v1) |

Ciri visual yang dipertahankan: sudut membulat besar, banyak ruang putih, bayangan lembut, foto besar berkualitas, hierarki tipografi tegas, ornamen organik halus (diganti ornamen batik).

### 11.3 Halaman dan rute

Publik:
`/` Beranda · `/profil` (Tentang) · `/profil/visi-misi` · `/profil/struktur` · `/profil/ad-art` · `/program-kerja` · `/program-kerja/:slug` · `/galeri` · `/galeri/:slug` · `/daftar` · `/kebijakan-privasi` · `/syarat-penggunaan` · 404

Anggota (login):
`/onboarding` · `/status` · `/anggota` (direktori) · `/anggota/:username` · `/profil-saya`

Admin:
`/admin` (dashboard) · `/admin/persetujuan` · `/admin/anggota` · `/admin/program-kerja` · `/admin/galeri` · `/admin/profil-organisasi` · `/admin/struktur` · `/admin/ad-art` · `/admin/peran` · `/admin/master-data` · `/admin/ekspor` · `/admin/audit-log`

Catatan akses rute admin: `/admin/persetujuan`, `/admin/anggota`, `/admin/program-kerja`, `/admin/galeri`, `/admin/profil-organisasi`, `/admin/struktur`, `/admin/ad-art` dapat diakses Admin Konten dan Super Admin. `/admin` (dashboard statistik), `/admin/peran`, `/admin/master-data`, `/admin/ekspor`, `/admin/audit-log` hanya Super Admin. Admin Konten yang membuka `/admin` melihat ringkasan tugasnya saja (jumlah pendaftar pending, draf konten).

### 11.4 Komponen dan status UI
Semua daftar punya state: loading (skeleton), kosong (dengan ajakan tindakan), error (dengan coba lagi). Semua form punya validasi inline berbahasa Indonesia. Aksi destruktif memakai dialog konfirmasi.

---

## 12. Kontrak API (garis besar — rincian di `api-spec.md`)

Prefiks `/api`. Respons JSON konsisten (`{ data }` / `{ error: { code, message } }`). Contoh grup endpoint:

- Publik (GET): `/api/public/org`, `/api/public/leaders?period=`, `/api/public/bylaws`, `/api/public/programs`, `/api/public/programs/:slug`, `/api/public/albums`, `/api/public/albums/:slug`, `/api/public/stats`
- Anggota: `GET/PUT /api/me`, `POST /api/me/onboarding`, `GET /api/me/status`, `GET /api/members`, `GET /api/members/:username`, lookup master data (`/api/lookups/*`)
- Admin konten (juga dapat diakses Super Admin): CRUD `/api/admin/programs`, `/api/admin/albums`, `/api/admin/org`, `/api/admin/leaders`, `/api/admin/bylaws`, `POST /api/admin/uploads`, `/api/admin/approvals`, `/api/admin/members`
- Khusus Super Admin: `/api/admin/roles`, `/api/admin/stats`, `/api/admin/exports`, `/api/admin/master-data`, `/api/admin/audit-logs`

Semua endpoint non-publik: verifikasi token Clerk → muat user dari DB → periksa peran dan `getEffectiveStatus()`.

---

## 13. Email (Resend)

Template email (Bahasa Indonesia, sederhana, tanpa data berlebihan):
1. Pendaftaran diterima (menunggu persetujuan)
2. Disetujui oleh admin
3. Ditolak (dengan alasan dan cara mengajukan ulang)
4. Otomatis aktif setelah 24 jam
5. Notifikasi ke Super Admin: ada pendaftar baru (digabung/diringkas agar tidak melewati 100 email/hari)

Aturan:
- Dibungkus abstraksi `EmailService` dengan flag `EMAIL_ENABLED`. Bila belum ada domain terverifikasi, email dinonaktifkan dan seluruh status tetap dapat dilihat di dalam aplikasi.
- Jangan memasukkan data pribadi sensitif dalam email. Sediakan tautan ke aplikasi.
- Catat kegagalan kirim tanpa membocorkan alamat email di log.

---

## 14. File Dokumen yang WAJIB Dibuat Agen

Buat di **root repositori** (kecuali `docs/` bila dinyatakan). Isi harus konkret dan diturunkan dari PRD ini. Perbarui sepanjang proyek.

| File | Isi minimum |
|---|---|
| `tujuan.md` | Latar belakang KAPPAMA, tujuan produk, pengguna sasaran, indikator keberhasilan, prinsip produk, apa yang sengaja *tidak* dikerjakan |
| `arsitektur.md` | Diagram arsitektur (Mermaid), alur request, struktur folder, alur autentikasi dan otorisasi, alur signed upload ke Cloudinary, logika lazy auto-approve, estimasi kuota layanan gratis, **Catatan Keputusan** (ADR ringkas) |
| `agents.md` | Panduan untuk agen AI: gambaran proyek, perintah penting (install/dev/test/build/migrate/deploy), konvensi kode dan penamaan, struktur folder, aturan keamanan/privasi, hal yang dilarang, cara menjalankan test, definisi selesai. Jika alat agen mengharapkan nama `AGENTS.md`, sediakan salinan/tautan dengan nama itu agar kedua alat (Antigravity dan OpenCode) membacanya |
| `changelog.md` | Format Keep a Changelog + SemVer; entri awal `0.1.0` (dokumentasi dan scaffold); diperbarui tiap fase/fitur |
| `database-schema.md` | ERD (Mermaid), tabel dan kolom lengkap, indeks, relasi, aturan soft delete, sumber dan tanggal data wilayah, strategi migrasi dan seed |
| `api-spec.md` | Daftar endpoint, metode, peran yang diizinkan, skema request/response (Zod), kode error, contoh |
| `design-system.md` | Token warna (navy + aksen), tipografi, spasi, radius, bayangan, komponen, pola ornamen batik, aturan gambar, state UI, aksesibilitas, pemetaan referensi desain pada Bagian 11.2 |
| `security-privacy.md` | Model ancaman ringkas, kontrol keamanan, matriks akses, penanganan data pribadi (UU PDP), persetujuan, retensi, hak pengguna, serah terima pengurus, risiko auto-aktif 24 jam, prosedur insiden |
| `deployment.md` | Pembuatan proyek Cloudflare Pages, akun dan kredensial Cloudinary, koneksi Neon, setup Clerk (dev → prod), Turnstile, Resend, daftar environment variable, bootstrap Super Admin, migrasi database, **checklist migrasi ke domain kustom**, backup/restore, rollback |
| `testing-checklist.md` | Checklist per fitur dan per peran (uji akses terlarang, uji batas 24 jam, uji unggahan, uji mobile), skenario E2E, uji keamanan dasar, uji aksesibilitas dan performa |
| `roadmap.md` | Fase dan status, backlog v2 (lowongan alumni, donasi, berita), **Pertanyaan Terbuka**, risiko |

Tambahan yang diperbolehkan jika berguna: `README.md` (ringkas, cara menjalankan), `CONTRIBUTING.md`, `.env.example`, `docs/design-reference/`.

---

## 15. Fase Pengerjaan dan Definisi Selesai

| Fase | Cakupan | Selesai bila |
|---|---|---|
| **0 — Fondasi dokumen** | Semua file Bagian 14 dibuat dan konsisten; konfirmasi Pertanyaan Terbuka dengan pemilik proyek | Pemilik proyek menyetujui dokumen |
| **1 — Scaffold & infrastruktur** | Repo, Vite+React+TS+Tailwind, Pages Functions, koneksi Neon + Drizzle + migrasi awal, Clerk dev, `StorageService` (adapter Cloudinary + mock), CI dasar, deploy pertama ke `*.pages.dev` | Halaman kosong ter-deploy, `/api/health` berjalan, DB terhubung |
| **2 — Desain & halaman publik** | Design system, layout, Beranda, Profil (4 sub-menu), Program Kerja, Galeri (dengan data dummy/admin) | Semua halaman publik sesuai desain, responsif, lolos target Lighthouse |
| **3 — Auth, onboarding, direktori** | Login Google, onboarding + Turnstile, status, alur persetujuan + lazy 24 jam, direktori + filter, Profil Saya, aktif→alumni | Alur uji penuh dari daftar sampai tampil di direktori berhasil; uji batas waktu lulus |
| **4 — Panel admin** | CRUD konten, unggah Cloudinary (uji juga PDF AD/ART), antrean persetujuan, manajemen anggota & peran, statistik, ekspor, master data, audit log | Semua hak akses pada matriks Bagian 3.2 terbukti lewat uji |
| **5 — Hardening & rilis** | Keamanan, privasi (kebijakan, hapus/ekspor data), performa, aksesibilitas, SEO, uji E2E, dokumentasi final | `testing-checklist.md` hijau; pemilik proyek menyetujui rilis |
| **6 — Domain & email** | Beli domain, Clerk production, verifikasi domain Resend, aktifkan `EMAIL_ENABLED` | Email notifikasi berfungsi ke anggota nyata |

Definisi selesai untuk setiap fitur: kode ter-lint, tipe aman, test relevan lulus, hak akses diuji, state loading/kosong/error ada, tampilan mobile dicek, dokumentasi dan `changelog.md` diperbarui.

---

## 16. Risiko dan Pertanyaan Terbuka (salin ke `roadmap.md`)

**Risiko**
1. Auto-aktif 24 jam membuka direktori tanpa verifikasi manusia → mitigasi: tinjauan rutin, rate limit, pembatasan kecamatan Pacitan, kemampuan suspend.
2. Data pribadi pelajar (termasuk alamat dan WA) → mitigasi: akses login saja, alamat detail hanya untuk pemilik dan admin, UU PDP, audit ekspor dan audit akses/penyuntingan oleh admin. Karena Admin Konten kini juga menyentuh data pribadi, jumlah akun admin dijaga sedikit dan setiap admin menyetujui pernyataan kerahasiaan data.
3. Tanpa domain, Clerk production dan email anggota belum bisa dipakai → mitigasi: Fase 6 dan flag email.
4. Kuota gratis habis (Cloudinary/Neon/Functions) → mitigasi: kompres gambar, video lewat YouTube, pantau pemakaian.
5. Pergantian pengurus tiap periode → mitigasi: dokumentasi serah terima, minimal dua Super Admin.
6. Konten (foto, logo, motif) berhak cipta → mitigasi: hanya aset milik/izin KAPPAMA.

**Pertanyaan terbuka (agen wajib menanyakan ke pemilik proyek pada Fase 0)**
1. (Terjawab) "Angkatan" = tahun masuk kuliah (format YYYY).
2. (Terjawab) Visibilitas default disetujui: alamat detail hanya untuk pemilik dan admin; WA/email tampil ke anggota `active` dengan saklar sembunyikan.
3. (Terjawab, v1.1) Admin Konten dan Super Admin sama-sama berhak menyetujui/menolak pendaftar serta menyunting/menonaktifkan data anggota mana pun.
4. (Terjawab) Filter universitas pada Program Kerja dipertahankan sebagai label opsional, bersama filter tahun.
5. (Terjawab) Pendaftaran = Daftar → Login Google (Clerk) → Onboarding profil lengkap; tidak ada formulir terpisah.
6. (Sebagian terjawab) Palet awal biru dongker `#0F1E36` dan emas soga `#D97706`. Logo resmi dan foto/video kegiatan belum tersedia: gunakan placeholder yang jelas bertanda.
7. Rencana donasi: siapa pengelola dana dan bagaimana pertanggungjawabannya (ditunda ke v2).
8. Nama domain yang akan dibeli dan jadwal pembeliannya (belum ditentukan; sementara `*.pages.dev`).
9. Foto profil anggota: apakah anggota boleh mengunggah foto sendiri ke Cloudinary, atau v1 cukup memakai avatar Google dari Clerk (lebih sedikit data pribadi dan kuota)? Default sementara: avatar Google, unggahan foto profil ditunda sampai diputuskan.

---

## 17. Perintah Awal untuk Agen

1. Baca PRD ini sampai selesai dan ringkas pemahaman Anda dalam 10 baris.
2. Ajukan pertanyaan terbuka pada Bagian 16 yang belum terjawab (maksimal satu batch).
3. Buat seluruh file pada Bagian 14 (Fase 0), lalu minta persetujuan sebelum masuk Fase 1.
4. Setelah disetujui, kerjakan fase berurutan dan laporkan kemajuan di akhir tiap fase (apa selesai, apa yang diuji, apa yang butuh keputusan).