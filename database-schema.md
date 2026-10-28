# Dokumen Skema Database — Website KAPPAMA

Dokumen ini mendefinisikan Entity Relationship Diagram (ERD), spesifikasi tabel, kolom, indeks, aturan relasi, dan strategi data wilayah Pacitan untuk PostgreSQL (Neon).

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o| member_profiles : "has profile"
    member_profiles ||--o| alumni_details : "has alumni data"
    users ||--o{ audit_logs : "creates"
    
    universities ||--o{ study_programs : "offers"
    universities ||--o{ member_profiles : "belongs to"
    study_programs ||--o{ member_profiles : "enrolled in"
    
    districts ||--o{ villages : "contains"
    districts ||--o{ member_profiles : "origin district"
    villages ||--o{ member_profiles : "origin village"
    
    industries ||--o{ alumni_details : "works in"
    
    org_periods ||--o{ org_leaders : "has leaders"
    
    programs ||--o{ program_media : "contains"
    universities ||--o{ programs : "associated with"
    programs ||--o{ albums : "linked to"
    albums ||--o{ album_media : "contains"

    users {
        uuid id PK
        string clerk_user_id UK
        string email
        string role "member | content_admin | super_admin"
        timestamp created_at
        timestamp updated_at
    }

    member_profiles {
        uuid id PK
        uuid user_id FK
        string full_name
        string username UK
        string whatsapp
        string instagram
        string linkedin
        string member_type "active | alumni"
        int cohort_year
        uuid university_id FK
        string university_other
        uuid study_program_id FK
        string study_program_other
        string district_id FK
        string village_id FK
        string address_detail
        string photo_key
        boolean hide_contact
        string status "incomplete | pending | active | rejected | suspended"
        timestamp submitted_at
        timestamp approved_at
        uuid approved_by FK
        string approval_type "manual | auto"
        string rejection_reason
        timestamp consent_at
        string consent_version
        timestamp deleted_at
    }

    alumni_details {
        uuid id PK
        uuid member_id FK,UK
        int graduation_year
        string current_status "working | entrepreneur | studying | job_seeking | other"
        string job_title
        string organization
        uuid industry_id FK
        string work_city
    }

    universities {
        uuid id PK
        string name
        string abbreviation
        string city
        boolean is_active
    }

    study_programs {
        uuid id PK
        uuid university_id FK
        string name
        string degree_level
        boolean is_active
    }

    districts {
        string id PK "Kode Wilayah BPS/Kemendagri"
        string name
    }

    villages {
        string id PK "Kode Wilayah BPS/Kemendagri"
        string district_id FK
        string name
    }

    industries {
        uuid id PK
        string name
        boolean is_active
    }

    org_periods {
        uuid id PK
        string period_label
        int start_year
        int end_year
        boolean is_current
    }

    org_leaders {
        uuid id PK
        uuid period_id FK
        string position "pembina | penasihat | ketua | wakil_ketua_umum"
        string name
        string photo_key
        string campus_study
        int sort_order
    }

    org_profile {
        uuid id PK
        string about_text
        string vision_text
        jsonb missions
        string contact_email
        string contact_instagram
        string contact_address
        string logo_key
        timestamp updated_at
    }

    bylaws_documents {
        uuid id PK
        string title
        string file_key
        date effective_date
        boolean is_active
        timestamp created_at
    }

    programs {
        uuid id PK
        string title
        string slug UK
        int year
        date event_date
        string location
        string summary
        text description
        string objectives
        string targets
        string pic_name
        string cover_key
        uuid university_id FK
        string status "draft | published"
        timestamp deleted_at
    }

    program_media {
        uuid id PK
        uuid program_id FK
        string media_type "image | youtube"
        string file_key
        string youtube_id
        string caption
        int sort_order
    }

    albums {
        uuid id PK
        string title
        string slug UK
        int year
        date event_date
        string description
        string cover_key
        uuid program_id FK
        string status "draft | published"
        timestamp deleted_at
    }

    album_media {
        uuid id PK
        uuid album_id FK
        string media_type "image | youtube"
        string file_key
        string youtube_id
        string caption
        int sort_order
    }

    audit_logs {
        uuid id PK
        uuid actor_id FK
        string action
        string entity
        uuid entity_id
        jsonb metadata
        string ip_hash
        timestamp created_at
    }
```

---

## 2. Definisi Indeks Kinerja & Keamanan

Untuk menjamin kueri cepat pada skala pertumbuhan data dan pencegahan scanning lambat:
1. `member_profiles`:
   - `idx_member_profiles_status_type`: `(status, member_type)`
   - `idx_member_profiles_university`: `(university_id)`
   - `idx_member_profiles_cohort`: `(cohort_year)`
   - `idx_member_profiles_district`: `(district_id)`
   - `idx_member_profiles_username`: `(username)` UNIQUE
   - `idx_member_profiles_full_name_trgm`: Indeks trigram (`gin (full_name gin_trgm_ops)`) atau B-tree untuk kueri pencarian nama.
2. `programs`:
   - `idx_programs_status_year`: `(status, year)`
   - `idx_programs_slug`: `(slug)` UNIQUE
3. `albums`:
   - `idx_albums_status_year`: `(status, year)`
   - `idx_albums_slug`: `(slug)` UNIQUE
4. `audit_logs`:
   - `idx_audit_logs_actor_created`: `(actor_id, created_at DESC)`
   - `idx_audit_logs_entity`: `(entity, entity_id)`

---

## 3. Aturan Penyimpanan Media & Penghapusan Lunak (Soft Delete)

### 3.1 Aturan Kolom Kunci Media (*_key)
Seluruh kolom penyimpan referensi media (`photo_key`, `logo_key`, `file_key`, `cover_key`) **hanya menyimpan `public_id` Cloudinary** (misal: `kappama/programs/proker-1-cover`) atau path berkas statis lokal (misal: `/docs/ad-art-kappama.pdf` pada opsi cadangan PDF), **bukan URL absolut penuh**. URL CDN teroptimasi dibangun secara dinamis di klien dan server melalui antarmuka `StorageService`.

### 3.2 Aturan Penghapusan Lunak (Soft Delete)
Tabel berikut menerapkan soft delete dengan kolom `deleted_at timestamp with time zone`:
- `member_profiles`
- `programs`
- `albums`

Semua kueri aplikasi secara default menerapkan filter `WHERE deleted_at IS NULL`. Tindakan penghapusan permanen (*hard delete*) hanya diizinkan untuk peran **Super Admin** melalui konfirmasi khusus dengan pencatatan eksplisit di `audit_logs`.

---

## 4. Master Data Wilayah Pacitan (Sumber Resmi & Validasi)

Sesuai aturan PRD Bagian 9 & 14, daftar kecamatan dan desa/kelurahan diambil dari rujukan resmi Pemerintah Kabupaten Pacitan, BPS, dan Kemendagri (Kabupaten Pacitan: kode `35.01`).

- **Sumber Data:**
  1. Ringkasan LPPD Kabupaten Pacitan Tahun 2024, Tabel 1.4 "Jumlah Kecamatan dan Desa/Kelurahan" (sumber Dukcapil Pemkab Pacitan), <https://ppid.pacitankab.go.id/wp-content/uploads/2025/08/LPPD-2024.pdf>
  2. BPS SIG Bridging API (kode BPS dan kode Dagri per kecamatan/desa), <https://sig.bps.go.id/rest-bridging/getwilayah?level=kecamatan&parent=3501> dan `?level=desa&parent=<kode_bps>`
  3. Peraturan Daerah Kabupaten Pacitan Nomor 6 Tahun 2022 tentang Pembentukan Desa Ketro Harjo, Kecamatan Tulakan (kode Desa `35.01.10.2017`).
- **Tanggal Verifikasi:** 28 Oktober 2026.
- **Jumlah Wilayah:** 12 Kecamatan, 172 Desa/Kelurahan (167 Desa + 5 Kelurahan).
- **Catatan Rekonsiliasi:** BPS SIG Bridging hanya memuat 171 entri (166 desa + 5 kelurahan) karena Desa Ketro Harjo (`35.01.10.2017`) belum terdaftar di API tersebut. Entri itu ditambahkan berdasarkan Perda No. 6 Tahun 2022 dan Tabel 1.4 LPPD 2024, sehingga total menjadi 172 entri sesuai angka resmi Pemkab Pacitan.
- **Pemetaan Ulang:** Data seed lama memakai kode Dagri yang tidak cocok dengan nama desa (mis. `35.01.04.2001` tertulis "Belah"). Berkas `db/seed/pacitan-regions.json` ditulis ulang dari API BPS; 6 baris `villages` lama yang tidak ada di daftar resmi dihapus dari database saat rekonsiliasi.

### 12 Kecamatan Resmi Kabupaten Pacitan:
1. `35.01.01` - Donorojo
2. `35.01.02` - Pringkuku
3. `35.01.03` - Punung
4. `35.01.04` - Pacitan (5 kelurahan: Pacitan, Pucangsewu, Sidoharjo, Ploso, Baleharjo)
5. `35.01.05` - Kebonagung
6. `35.01.06` - Arjosari
7. `35.01.07` - Nawangan
8. `35.01.08` - Bandar
9. `35.01.09` - Tegalombo
10. `35.01.10` - Tulakan (termasuk Desa Ketro Harjo)
11. `35.01.11` - Ngadirojo
12. `35.01.12` - Sudimoro

Data lengkap 172 desa/kelurahan di-seed dari berkas `db/seed/pacitan-regions.json`. Verifikasi pasca-seed: `SELECT COUNT(*) FROM villages` = 172 dan 5 baris berkode kelurahan (`35.01.04.1xxx`).

---

## 5. Strategi Migrasi & Seed Drizzle ORM

1. Skema didefinisikan secara deklaratif di `db/schema.ts`.
2. Generator migrasi dijalankan melalui:
   ```bash
   pnpm db:generate
   ```
   menghasilkan berkas SQL di folder `db/migrations/`.
3. Migrasi diterapkan ke Neon via:
   ```bash
   pnpm db:migrate
   ```
4. Seed master data (`pnpm db:seed`) mengeksekusi urutan:
   - Master 12 Kecamatan dan 172 Desa/Kelurahan Pacitan (idempotent, `ON CONFLICT DO UPDATE`).
   - Master 14 Perguruan Tinggi di Malang + opsi "Lainnya".
   - Master 53 Program Studi populer per universitas.
   - Master 13 Bidang Industri umum.
   - Periode kepengurusan saat ini (`org_periods`).
   - Placeholder profil organisasi (`org_profile`).
5. Seed anggota dummy (`node db/seed-members.js`) **tidak** dijalankan otomatis. Skrip menolak berjalan kecuali `SEED_DUMMY_MEMBERS=true`, dan semua baris dummy ditandai `users.clerk_user_id` berawalan `user_dummy_`. Hapus dengan:
   ```sql
   DELETE FROM users WHERE clerk_user_id LIKE 'user_dummy_%';
   ```
