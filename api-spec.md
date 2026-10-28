# Spesifikasi API (API Specification) — Website KAPPAMA

Seluruh endpoint berakar pada `/api`. Format respon selalu menggunakan amplop standar JSON:
- **Respon Sukses:** `{ "data": ... , "meta": ... }`
- **Respon Gagal:** `{ "error": { "code": "ERROR_CODE", "message": "Pesan ramah dalam Bahasa Indonesia", "details": ... } }`

---

## 1. Konvensi Status HTTP & Kode Galat

| HTTP Status | Kode Error | Deskripsi |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Skema Zod gagal, format data tidak valid |
| `401` | `UNAUTHORIZED` | Token sesi Clerk tidak ada, tidak valid, atau kadaluwarsa |
| `403` | `FORBIDDEN` | Peran pengguna tidak memiliki hak akses (atau status bukan `active`) |
| `404` | `NOT_FOUND` | Data atau entitas yang diminta tidak ditemukan |
| `409` | `CONFLICT` | Username telah terdaftar atau slug duplikat |
| `429` | `RATE_LIMITED` | Batas request terlampaui (Turnstile/Rate limiter) |
| `500` | `INTERNAL_SERVER_ERROR` | Terjadi kesalahan pada fungsi server |

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

### 4.3 CRUD Konten (Proker, Galeri, Profil, AD/ART)
- `POST/PUT/DELETE /api/admin/programs`
- `POST/PUT/DELETE /api/admin/albums`
- `PUT /api/admin/org/profile`
- `POST/PUT/DELETE /api/admin/leaders`
- `POST /api/admin/bylaws/upload` (Unggah dokumen PDF AD/ART; disiapkan opsi cadangan berkas statis `public/` atau Google Drive)
- `POST /api/admin/uploads/signature` (Membuat signature unggah aman Cloudinary untuk direct upload dari klien, menghasilkan `public_id` yang disimpan ke kolom `*_key`)

---

## 5. Kelompok Endpoint Khusus Super Admin (`/api/admin/*`)

- **`GET /api/admin/stats`**: Metrik lengkap analitik organisasi dan tren pendaftar.
- **`PUT /api/admin/users/:id/role`**: Mengubah peran pengguna (`member`, `content_admin`, `super_admin`). Body: `{ "role": "content_admin" }`. Respon `409 LAST_SUPER_ADMIN` bila mencabut Super Admin terakhir. Mencatat audit `USER_ROLE_CHANGED` (hanya peran lama/baru, tanpa data pribadi).
- **`GET /api/admin/exports/members?format=csv`**: Ekspor data lengkap anggota/alumni (wajib konfirmasi & tercatat di audit log).
- **`GET /api/admin/audit-logs`**: Melihat log jejak audit aktivitas sensitif admin.
- **`POST/PUT/DELETE /api/admin/master-data/:entity`**: Penyesuaian master kampus, prodi, dan industri.
