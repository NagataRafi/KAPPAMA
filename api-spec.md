# Spesifikasi API (API Specification) — Website KAPPAMA

Seluruh endpoint berakar pada `/api`. Format respon selalu menggunakan amplop standar JSON:
- **Respon Sukses:** `{ "data": ... , "meta": ... }`
- **Respon Gagal:** `{ "error": { "code": "ERROR_CODE", "message": "Pesan ramah dalam Bahasa Indonesia", "details": ... } }`

---

## 1. Konvensi Status HTTP & Kode Galat

| HTTP Status | Kode Error | Deskripsi |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Skema Zod gagal, format data tidak valid |
| `401` | `TOKEN_MISSING`, `TOKEN_MALFORMED`, `TOKEN_EXPIRED`, `TOKEN_NOT_YET_VALID`, `ISSUER_MISMATCH`, `AZP_MISMATCH`, `SIGNATURE_INVALID`, `JWKS_FETCH_FAILED`, `EMAIL_UNVERIFIED`, `CLERK_BACKEND_ERROR` | Sesi Clerk tidak ada, tidak valid, kedaluwarsa, atau gagal diverifikasi. Kode alasan spesifik ada di `error.code` |
| `403` | `FORBIDDEN` | Peran pengguna tidak memiliki hak akses (atau status bukan `active`) |
| `404` | `NOT_FOUND` | Data atau entitas yang diminta tidak ditemukan |
| `409` | `CONFLICT` | Username telah terdaftar atau slug duplikat |
| `429` | `RATE_LIMITED` | Batas request terlampaui (Turnstile/Rate limiter) |
| `500` | `INTERNAL_SERVER_ERROR`, `SERVER_MISCONFIGURED` | Terjadi kesalahan pada fungsi server, atau env Clerk/DB belum lengkap |

### 1.1 Kode Alasan Autentikasi

Setiap penolakan autentikasi mengembalikan `error.code` yang aman (tanpa token/email) dan pesan Bahasa Indonesia yang sesuai:

| `error.code` | Arti | Pesan klien |
|---|---|---|
| `TOKEN_MISSING` | Header `Authorization: Bearer` tidak dikirim | Sesi login tidak ditemukan. Silakan login ulang. |
| `TOKEN_MALFORMED` | JWT tidak berformat 3 bagian / `alg` bukan RS256 / tanpa `sub` | Sesi login tidak valid. Silakan login ulang. |
| `TOKEN_EXPIRED` | `exp` lewat lebih dari toleransi 10 detik | Sesi login sudah kedaluwarsa. Silakan login ulang. |
| `TOKEN_NOT_YET_VALID` | `nbf`/`iat` di depan lebih dari toleransi 10 detik | Jam perangkat tidak cocok dengan server. Periksa jam perangkat lalu coba lagi. |
| `ISSUER_MISMATCH` | `iss` tidak sama dengan issuer dari `CLERK_PUBLISHABLE_KEY` | Sesi login berasal dari aplikasi lain. Silakan login ulang. |
| `AZP_MISMATCH` | `azp` di luar `CLERK_AUTHORIZED_PARTIES` / issuer / loopback mode test | Sesi login tidak cocok dengan aplikasi ini. Silakan login ulang. |
| `SIGNATURE_INVALID` | Tanda tangan RS256 tidak cocok dengan JWKS Clerk | Tanda tangan sesi login tidak valid. Silakan login ulang. |
| `JWKS_FETCH_FAILED` | JWKS Clerk gagal diambil atau `kid` tidak ditemukan | Server tidak dapat memverifikasi sesi saat ini. Coba lagi beberapa saat. |
| `EMAIL_UNVERIFIED` | Email utama Clerk belum `verified` | Email akun belum terverifikasi. Verifikasi email Anda di Clerk lalu coba lagi. |
| `CLERK_BACKEND_ERROR` | Clerk Backend API gagal/`CLERK_SECRET_KEY` kosong | Server gagal memeriksa akun Anda. Coba lagi beberapa saat. |
| `SERVER_MISCONFIGURED` | `DATABASE_URL` atau `CLERK_SECRET_KEY` belum diset (HTTP 500) | Konfigurasi login server belum lengkap. |

Catatan:
- Log server hanya menulis `[auth] code=<KODE> path=<path>`; token, email, dan data pribadi tidak pernah dicatat.
- Klien mengambil token segar (`getToken({ skipCache: true })`) setiap permintaan dan mengulang **sekali** saat menerima `401` dengan token baru. Pesan "Silakan login" hanya muncul untuk pengguna yang memang belum punya sesi.
- `CLERK_AUTHORIZED_PARTIES` (opsional, dipisah koma) membatasi origin `azp`. Bila kosong, origin frontend API Clerk diizinkan; pada `pk_test_` origin `localhost`/`127.0.0.1` juga diizinkan agar proxy Vite (5173 → Wrangler 8788) bekerja.
- Lookup master data bersifat publik dan tidak pernah `500`: bila DB gagal, respon tetap `200` dengan `{ "data": [] }` dan log `code=LOOKUP_DB_ERROR`.

---

## 2. Kelompok Endpoint Publik (`/api/public/*`)

Semua endpoint ini dapat diakses oleh siapa saja (**Pengunjung**, tanpa otentikasi).

### 2.1 Informasi Organisasi
- **`GET /api/public/org`**
  - **Akses:** Publik
  - **Respon 200:**
    ```json
    {
      "data": {
        "aboutText": "KAPPAMA (Keluarga Pelajar Pacitan di Malang) adalah...",
        "visionText": "Menjadi wadah kekeluargaan...",
        "missions": ["Mempererat silaturahmi...", "Mendorong kontribusi daerah..."],
        "contactEmail": "halo@kappama.org",
        "contactInstagram": "kappama_malang",
        "contactAddress": "Kota Malang, Jawa Timur",
        "logoUrl": "/media/logos/kappama.webp"
      }
    }
    ```

### 2.2 Struktur Pengurus
- **`GET /api/public/leaders?period={periodId}`**
  - **Akses:** Publik (Jika `periodId` kosong, kembalikan periode aktif/terbaru).
  - **Respon 200:**
    ```json
    {
      "data": {
        "period": { "id": "uuid", "periodLabel": "2026/2027", "isCurrent": true },
        "leaders": [
          {
            "id": "uuid",
            "position": "ketua",
            "name": "Nama Ketua",
            "photoUrl": "/media/leaders/ketua.webp",
            "campusStudy": "Universitas Brawijaya / Ilmu Hukum",
            "sortOrder": 3
          }
        ]
      }
    }
    ```

### 2.3 AD/ART Organisasi
- **`GET /api/public/bylaws`**
  - **Akses:** Publik (Mengembalikan dokumen AD/ART berstatus aktif beserta riwayatnya).
  - **Respon 200:**
    ```json
    {
      "data": {
        "current": {
          "id": "uuid",
          "title": "AD/ART KAPPAMA Hasil Mubes VII",
          "fileUrl": "/media/docs/bylaws-v7.pdf",
          "effectiveDate": "2025-12-01"
        },
        "history": [
          { "id": "uuid", "title": "AD/ART KAPPAMA 2023", "effectiveDate": "2023-11-15" }
        ]
      }
    }
    ```

### 2.4 Program Kerja
- **`GET /api/public/programs?year=2026&universityId=&search=&page=1&limit=12`**
  - **Respon 200:** Daftar program kerja `status = 'published'` dengan pagination.
- **`GET /api/public/programs/:slug`**
  - **Respon 200:** Detail program kerja, dokumentasi foto, dan sematan video YouTube.

### 2.5 Galeri & Statistik
- **`GET /api/public/albums?year=2026&page=1`**
- **`GET /api/public/albums/:slug`**
- **`GET /api/public/stats`**
  - **Respon 200:** Menghitung jumlah nyata dari DB: total anggota aktif, alumni, proker, dan universitas mitra.

### 2.6 Lookup Master Data (Publik)

Dipakai form onboarding dan filter direktori. Tanpa autentikasi, hasil unik, urut abjad, dan `Lainnya` selalu di akhir.

- **`GET /api/lookups/districts`** → `{ "data": [{ "id": "35.01.01", "name": "Donorojo" }] }`
- **`GET /api/lookups/villages?districtId=35.01.01`** → `{ "data": [{ "id": "35.01.01.2001", "district_id": "35.01.01", "name": "..." }] }`
- **`GET /api/lookups/universities`** → `{ "data": [{ "id": "uuid", "name": "Politeknik Negeri Malang", "abbreviation": "POLINEMA", "city": "Malang" }] }`
- **`GET /api/lookups/study-programs?universityId=uuid`** → `{ "data": [{ "id": "uuid", "university_id": "uuid", "name": "Teknik Elektronika", "degree_level": "D4" }] }`
  - Nama prodi bisa sama antarjenjang; klien wajib menampilkan `degree_level` di label, mis. `D4 Teknik Elektronika`.
- **`GET /api/lookups/industries`** → `{ "data": [{ "id": "uuid", "name": "Teknologi Informasi & Perangkat Lunak" }] }`

Catatan: bila `DATABASE_URL` kosong atau query gagal, kelima endpoint tetap membalas `200` dengan `data: []`.


---

## 3. Kelompok Endpoint Pengguna & Anggota (`/api/me/*`, `/api/members/*`)

### 3.1 Status & Onboarding
- **`GET /api/me/status`**
  - **Akses:** Pengguna Login (Clerk)
  - **Respon 200:**
    ```json
    {
      "data": {
        "registered": true,
        "status": "pending",
        "submittedAt": "2026-10-25T10:00:00Z",
        "autoApproveAt": "2026-10-26T10:00:00Z",
        "rejectionReason": null
      }
    }
    ```

- **`POST /api/me/onboarding`**
  - **Akses:** Pengguna Login (status `incomplete` atau `rejected` perbaikan)
  - **Body (Zod `OnboardingInputSchema`):**
    ```json
    {
      "fullName": "Budi Santoso",
      "username": "budi_pacitan",
      "whatsapp": "+6281234567890",
      "instagram": "budi_s",
      "linkedin": "https://linkedin.com/in/budisantoso",
      "memberType": "active",
      "cohortYear": 2024,
      "universityId": "uuid",
      "universityOther": null,
      "studyProgramId": "uuid",
      "studyProgramOther": null,
      "districtId": "35.01.04",
      "villageId": "35.01.04.2001",
      "addressDetail": "Dusun Krajan RT 02 RW 01",
      "turnstileToken": "XXXX.turnstile.token",
      "consentAgreed": true,
      "consentVersion": "2026.1"
    }
    ```

### 3.2 Profil Pribadi
- **`GET /api/me/profile`**: Mengambil data lengkap akun saya (termasuk alamat detail).
- **`PUT /api/me/profile`**: Memperbarui profil sendiri (termasuk transisi `active` -> `alumni`).

### 3.3 Direktori Anggota
- **`GET /api/members?type=active&universityId=&studyProgramId=&districtId=&cohort=&search=&page=1&limit=20`**
  - **Akses:** Khusus Anggota Login yang berstatus `active` (diverifikasi via `getEffectiveStatus()`), atau admin (`content_admin`/`super_admin`).
  - **Respon 200:** `meta: { page, limit, count, total }`; `total` dihitung dengan `COUNT(*) OVER()`.
  - **Catatan Keamanan:** Kolom `address_detail` tidak pernah disertakan. Nomor WA & email di-null-kan jika `hide_contact === true` (kecuali admin).

- **`GET /api/members/:username`**
  - **Akses:** Anggota Login berstatus `active`, atau admin. Anggota `pending`/`rejected`/`suspended` menerima `403` (mencegah IDOR).
  - **Catatan Keamanan:** `addressDetail` hanya dikembalikan ke pemilik profil dan admin. Setiap akses admin ke alamat detail dicatat sebagai `ADMIN_VIEWED_ADDRESS_DETAIL` tanpa menyimpan isi alamat.

### 3.4 Verifikasi Sesi
- Sesi diverifikasi di server: tanda tangan JWT Clerk (RS256, JWKS `https://api.clerk.com/v1/jwks`) dan email terverifikasi diambil dari Clerk Backend API. Header `X-Clerk-User-Id` / `X-User-Email` tidak dipercaya.
- `POST /api/me/onboarding` fail-closed: bila `TURNSTILE_SECRET_KEY` kosong atau `siteverify` gagal, respon `400 BOT_VERIFICATION_FAILED`. Kunci uji Cloudflare tetap diverifikasi lewat `siteverify`, bukan pintasan.

---

## 4. Kelompok Endpoint Admin Konten & Super Admin (`/api/admin/*`)

### 4.1 Antrean Persetujuan Pendaftaran
- **`GET /api/admin/approvals?status=pending&page=1`**
  - **Akses:** `content_admin`, `super_admin`
- **`POST /api/admin/approvals/:id/approve`**
  - **Akses:** `content_admin`, `super_admin`
  - **Respon 200:** Ubah status menjadi `active`, `approved_by = currentUserId`, `approval_type = 'manual'`.
- **`POST /api/admin/approvals/:id/reject`**
  - **Akses:** `content_admin`, `super_admin`
  - **Body:** `{ "reason": "Data kecamatan bukan wilayah Pacitan" }` (Alasan wajib diisi).

### 4.2 Manajemen Keanggotaan
- **`POST /api/admin/members/:id/suspend`**: Nonaktifkan anggota `active`/`pending` menjadi `suspended`; mencatat audit `MEMBER_SUSPENDED`.
- **`POST /api/admin/members/:id/restore`**: Mengaktifkan kembali anggota `suspended`; mencatat audit `MEMBER_RESTORED`.
- **Akses:** `content_admin`, `super_admin`.

### 4.3 CRUD Konten (Program Kerja, Galeri, Profil, Struktur, AD/ART)
Semua endpoint di bawah ini wajib sesi Clerk dengan peran `content_admin` atau `super_admin` (diperiksa dari tabel `users`, bukan metadata klien). Tanpa sesi `401`; peran lain `403 FORBIDDEN`. Setiap perubahan menulis entri `audit_logs` (`CONTENT_*`) dengan aktor, aksi, entitas, ID entitas, dan metadata minimal tanpa data pribadi.

- **Profil organisasi**
  - `GET /api/admin/content/org` — satu baris `org_profile`.
  - `PUT /api/admin/content/org` — body `{ aboutText, visionText, missions[], contactEmail, contactInstagram, contactAddress, logoKey }` (Zod `orgProfileInputSchema`). Aksi audit: `CONTENT_ORG_UPDATED`.
- **Periode & pengurus**
  - `GET|POST /api/admin/content/periods`, `PUT|DELETE /api/admin/content/periods/:id`, `POST /api/admin/content/periods/:id/activate`.
  - `GET /api/admin/content/leaders?periodId=`, `POST /api/admin/content/leaders`, `PUT|DELETE /api/admin/content/leaders/:id`.
  - Menghapus periode menghapus pengurusnya (cascade) dan foto Cloudinary terkait.
- **AD/ART**
  - `GET|POST /api/admin/content/bylaws`, `PUT|DELETE /api/admin/content/bylaws/:id`.
  - `fileKey` menerima `public_id` Cloudinary, URL absolut (Google Drive), atau path statis `/docs/...`. Hanya satu dokumen `isActive` pada satu waktu.
- **Program kerja**
  - `GET /api/admin/content/programs` (termasuk draf), `GET|PUT|DELETE /api/admin/content/programs/:id`, `POST /api/admin/content/programs`, `POST /api/admin/content/programs/:id/status` (`{ status: "draft" | "published" }`).
  - Media: `POST /api/admin/content/programs/:id/media` (`mediaType: "image" | "youtube"`, `fileKey` atau `youtubeUrl`), `PUT|DELETE /api/admin/content/program-media/:id`.
  - Batas 30 foto per program. Hapus = soft delete (`deleted_at`) + aset Cloudinary dihapus.
- **Galeri**
  - `GET /api/admin/content/albums`, `GET|PUT|DELETE /api/admin/content/albums/:id`, `POST /api/admin/content/albums`, `POST /api/admin/content/albums/:id/status`.
  - Media: `POST /api/admin/content/albums/:id/media`, `PUT|DELETE /api/admin/content/album-media/:id`. Batas 60 foto per album.

### 4.4 Unggah Berkas (Signed Upload)
- **`POST /api/admin/uploads/signature`** — body `{ kind: "program"|"album"|"leader"|"org"|"bylaws", contentType, bytes }`.
  - Validasi server: gambar hanya `image/jpeg`, `image/png`, `image/webp` maks 5 MB; AD/ART hanya `application/pdf` maks 10 MB. Gagal → `422 VALIDATION_ERROR`.
  - `public_id` dibuat acak di server (`crypto.randomUUID()`), folder dibatasi (`kappama/programs`, `kappama/albums`, `kappama/leaders`, `kappama/org`, `kappama/bylaws`), `allowed_formats` ikut ditandatangani.
  - Cloudinary belum dikonfigurasi → `503 STORAGE_NOT_CONFIGURED` (UI menampilkan opsi tautan cadangan).
  - Klien mengunggah langsung ke Cloudinary; `CLOUDINARY_API_SECRET` tidak pernah dikirim ke browser.

### 4.5 Konten Publik (`/api/public/*`, tanpa sesi)
- `GET /api/public/org` — profil organisasi terbaru atau `data: null`.
- `GET /api/public/leaders?period=` — daftar periode + pengurus periode terpilih (default periode aktif).
- `GET /api/public/bylaws` — `{ current, history }`.
- `GET /api/public/programs?year=&search=` — hanya `status = 'published' AND deleted_at IS NULL`.
- `GET /api/public/programs/:slug` — detail + media (foto & video YouTube); draf → `404 NOT_FOUND`.
- `GET /api/public/albums`, `GET /api/public/albums/:slug` — hanya album terbit.
- `GET /api/public/stats` — jumlah anggota aktif, alumni, program terbit, kampus aktif.

Catatan keamanan konten: seluruh teks disimpan sebagai **teks biasa**. Tag HTML dibuang di server (`stripHtmlTags`) dan klien merender sebagai teks React, sehingga tidak ada jalur XSS. YouTube hanya disimpan sebagai ID video 11 karakter hasil ekstraksi server.


---

## 5. Kelompok Endpoint Khusus Super Admin (`/api/admin/*`)

- **`GET /api/admin/stats`**: Metrik lengkap analitik organisasi dan tren pendaftar.
- **`PUT /api/admin/users/:id/role`**: Mengubah peran pengguna (`member`, `content_admin`, `super_admin`). Body: `{ "role": "content_admin" }`. Respon `409 LAST_SUPER_ADMIN` bila mencabut Super Admin terakhir. Mencatat audit `USER_ROLE_CHANGED` (hanya peran lama/baru, tanpa data pribadi).
- **`GET /api/admin/exports/members?format=csv`**: Ekspor data lengkap anggota/alumni (wajib konfirmasi & tercatat di audit log).
- **`GET /api/admin/audit-logs`**: Melihat log jejak audit aktivitas sensitif admin.
- **`POST/PUT/DELETE /api/admin/master-data/:entity`**: Penyesuaian master kampus, prodi, dan industri.
