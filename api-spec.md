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
- **`GET /api/members?type=active&university=&district=&cohort=&search=&page=1`**
  - **Akses:** Khusus Anggota Login yang berstatus `active` (diverifikasi via `getEffectiveStatus()`).
  - **Catatan Keamanan:** Kolom `address_detail` disaring (tidak disertakan). Nomor WA & email di-null-kan jika `hide_contact === true`.

- **`GET /api/members/:username`**
  - **Akses:** Khusus Anggota Login berstatus `active`.

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
- **`GET /api/admin/members`**: Daftar semua anggota (lengkap dengan alamat detail untuk audit).
- **`PUT /api/admin/members/:id`**: Sunting data anggota oleh admin (tercatat di `audit_logs`).
- **`POST /api/admin/members/:id/suspend`**: Nonaktifkan status akun anggota.
- **`POST /api/admin/members/:id/restore`**: Mengaktifkan kembali akun yang disuspend.

### 4.3 CRUD Konten (Proker, Galeri, Profil, AD/ART)
- `POST/PUT/DELETE /api/admin/programs`
- `POST/PUT/DELETE /api/admin/albums`
- `PUT /api/admin/org/profile`
- `POST/PUT/DELETE /api/admin/leaders`
- `POST /api/admin/bylaws/upload`
- `POST /api/admin/uploads` (Upload gambar ke R2, menghasilkan file key)

---

## 5. Kelompok Endpoint Khusus Super Admin (`/api/admin/*`)

- **`GET /api/admin/stats`**: Metrik lengkap analitik organisasi dan tren pendaftar.
- **`GET /api/admin/roles`**: Daftar pengguna berstatus admin.
- **`PUT /api/admin/roles/:userId`**: Mengangkat / mencabut peran `content_admin` atau `super_admin`. (Ditolak jika mencabut super admin terakhir).
- **`GET /api/admin/exports/members?format=csv`**: Ekspor data lengkap anggota/alumni (wajib konfirmasi & tercatat di audit log).
- **`GET /api/admin/audit-logs`**: Melihat log jejak audit aktivitas sensitif admin.
- **`POST/PUT/DELETE /api/admin/master-data/:entity`**: Penyesuaian master kampus, prodi, dan industri.
