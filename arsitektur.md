# Dokumen Arsitektur Sistem — KAPPAMA

Dokumen ini mendokumentasikan arsitektur teknis, topologi infrastruktur, alur request, keamanan otorisasi, dan catatan keputusan arsitektur (ADR) untuk website KAPPAMA.

---

## 1. Diagram Arsitektur Tingkat Tinggi

```mermaid
flowchart TD
    Client["Browser Klien (Desktop / Mobile PWA)\nReact + Vite + Tailwind + shadcn/ui"]
    
    subgraph Cloudflare["Cloudflare Edge Network"]
        CDN["Cloudflare CDN & WAF / Turnstile"]
        PagesStatic["Cloudflare Pages Static Assets\n(HTML, JS, CSS, Media Statis & Fallback PDF)"]
        PagesFunc["Pages Functions (/functions/api/[[route]].ts)\nHono Router API Engine"]
    end

    subgraph Storage["Media & Image CDN"]
        Cloudinary["Cloudinary (Free Tier)\nStorageService (Signed Upload & Image CDN)\n*Adapter R2 disiapkan sebagai alternatif v2"]
    end

    subgraph Auth["Identity Provider"]
        Clerk["Clerk Auth\nGoogle OAuth & Session JWT"]
    end

    subgraph Database["Database Cloud"]
        Neon["Neon Serverless PostgreSQL\n(Drizzle ORM + @neondatabase/serverless)"]
    end

    subgraph EmailProvider["Transaksional Email"]
        Resend["Resend API\n(Notifikasi Pendaftaran & Status)"]
    end

    Client -->|Akses Halaman & Aset| PagesStatic
    Client -->|Turnstile Challenge| CDN
    Client -->|Login Google| Clerk
    Client -->|API Request + Bearer JWT| PagesFunc
    
    PagesFunc -->|Verifikasi JWT Token| Clerk
    PagesFunc -->|SQL Queries via HTTP/WebSocket| Neon
    PagesFunc -->|Buat Upload Signature & Hapus Media| Cloudinary
    PagesFunc -->|Kirim Transaksional Email| Resend
    Client -->|Direct Signed Upload Berkas Foto| Cloudinary
    Client -->|Ambil Gambar Teroptimasi (f_auto, q_auto)| Cloudinary
```

---

## 2. Struktur Direktori Proyek

```text
kappama/
├── .github/
│   └── workflows/
│       └── ci.yml               # Lint, typecheck, dan unit test otomatis
├── docs/                        # Aset dokumentasi pendukung
│   └── design-reference/        # Referensi visual desain (home-reference.png)
├── functions/                   # Cloudflare Pages Functions (Backend API)
│   ├── [[path]].ts              # Catch-all entrypoint Hono untuk Pages Functions
│   └── api/
│       ├── _middleware/         # Middleware auth Clerk, Turnstile, error handler
│       ├── public/              # Route API publik (organisasi, proker, galeri)
│       ├── me/                  # Route data profil & onboarding pengguna login
│       ├── members/             # Route direktori anggota (auth active member)
│       ├── lookups/             # Route master data wilayah, kampus, prodi
│       └── admin/               # Route khusus admin (konten, peran, persetujuan, upload signature)
├── src/                         # Frontend Application (React 18 + Vite)
│   ├── assets/                  # SVG, icon lokal, motif batik Pacitan
│   ├── components/              # Komponen UI
│   │   ├── ui/                  # Komponen UI primitives
│   │   ├── layout/              # Navbar, Footer, AdminSidebar, PageHeader
│   │   ├── common/              # EmptyState, ErrorBoundary, LoadingSkeleton, TurnstileWidget
│   │   └── modules/             # Komponen modular per domain fitur (proker, galeri, direktori)
│   ├── hooks/                   # Custom react hooks (auth, query, media query)
│   ├── lib/                     # Utilitas klien (api-client, utils, formatter)
│   ├── pages/                   # Komponen halaman berdasarkan rute
│   │   ├── public/              # Beranda, Profil, Proker, Galeri, Kebijakan Privasi
│   │   ├── member/              # Onboarding, Status, Direktori, ProfilSaya
│   │   └── admin/               # Panel admin & dashboard
│   ├── routes/                  # Definisi router & route guard
│   ├── App.tsx                  # Root component (Provider wrapper)
│   └── main.tsx                 # Entry point klien
├── shared/                      # Kode & Skema Bersama Frontend + Backend
│   ├── schema/                  # Zod validation schema (auth, member, proker, etc.)
│   ├── services/
│   │   └── storage/             # Abstraksi StorageService (Cloudinary + Mock dev)
│   ├── types/                   # TypeScript interfaces & enums
│   └── utils/                   # Utilitas bersama (getEffectiveStatus)
├── db/                          # Database & ORM
│   ├── schema.ts                # Drizzle ORM PostgreSQL schema
│   ├── migrations/              # Berkas migrasi Drizzle
│   └── seed/                    # Seed master data wilayah, kampus, & dummy dev
├── public/                      # Aset statis publik (favicon, robots.txt, _headers, fallback PDF)
├── drizzle.config.ts            # Konfigurasi migrasi Drizzle
├── vite.config.ts               # Konfigurasi Vite
├── tailwind.config.ts           # Konfigurasi tema Tailwind (Navy & Gold Soga)
├── tsconfig.json
├── package.json
└── [Dokumen Bagian 14]         # PRD, tujuan.md, arsitektur.md, dll.
```

---

## 3. Alur Unggah Berkas & Abstraksi StorageService

Untuk menjaga fleksibilitas dan tidak mengikat kode aplikasi ke satu vendor penyimpanan:
1. Seluruh operasi media dibungkus dalam antarmuka `StorageService`:
   - `createUploadSignature(options)`: Membuat parameter dan signature berumur pendek di server menggunakan `CLOUDINARY_API_SECRET`.
   - `buildImageUrl(publicId, options)`: Membangun URL responsif CDN dengan transformasi otomatis (`f_auto,q_auto`, lebar sesuai tampilan).
   - `deleteImage(publicId)`: Menghapus gambar di penyimpanan awan.
2. Alur Pengunggahan Gambar (Direct Signed Upload):
   ```mermaid
   sequenceDiagram
       autonumber
       actor Admin as Browser Admin
       participant Function as Pages Function (/api/admin/uploads/signature)
       participant Cloudinary as Cloudinary API / CDN
       participant DB as Neon Database

       Admin->>Function: Minta signature unggah (POST folder, tipe berkas)
       Function->>Function: Validasi sesi Admin (Clerk) & otorisasi
       Function->>Function: Buat SHA-1 HMAC Signature dengan CLOUDINARY_API_SECRET
       Function-->>Admin: Kembalikan { signature, timestamp, apiKey, folder, uploadUrl }
       Admin->>Cloudinary: POST multipart/form-data langsung ke uploadUrl
       Cloudinary-->>Admin: 200 OK + { public_id, secure_url, format, bytes }
       Admin->>Function: Kirim data entitas (misal Proker/Galeri) dengan photo_key = public_id
       Function->>DB: Simpan public_id ke kolom *_key
   ```
3. Penyajian Gambar:
   - Klien memanggil `storageService.buildImageUrl(photo_key, { width: 800 })`.
   - Menghasilkan URL langsung CDN Cloudinary: `https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,w_800/<public_id>`.
4. Penanganan Khusus Berkas PDF AD/ART:
   - Pengiriman berkas PDF mentah dari akun Cloudinary gratis berpotensi dibatasi oleh setelan keamanan akun bawaan.
   - Jika terbukti dibatasi pada uji coba Fase 4, disiapkan 2 opsi cadangan tanpa mengubah antarmuka admin:
     a. Berkas statis di folder `public/docs/ad-art-kappama.pdf` yang disajikan via Cloudflare Pages.
     b. Tautan sematan dokumen Google Drive / viewer alternatif.

---

## 4. Mekanisme Lazy Auto-Active 24 Jam

Karena Cloudflare Pages Functions tidak menyediakan cron job bawaan gratis, aturan PRD Bagian 7 diimplementasikan secara **lazy evaluation**:

1. Saat pengguna menyelesaikan onboarding:
   - `status = 'pending'`
   - `submitted_at = NOW()`
   - `approval_type = NULL`
2. Fungsi utilitas server tunggal `getEffectiveStatus(member)` dieksekusi di setiap pengecekan otorisasi:
   - Jika waktu `now() >= submitted_at + 24 jam`, otomatis dihitung sebagai `active`.
   - Server memperbarui baris database secara inline/asynchronous (`status = 'active'`, `approval_type = 'auto'`) dan mencatatnya ke `audit_logs`.

---

## 5. Estimasi Pemakaian Kuota Gratis (Free Tier)

| Layanan | Batas Gratis Resmi | Estimasi Pemakaian KAPPAMA (v1) | Status Keamanan Kuota |
|---|---|---|---|
| **Cloudflare Pages** | Build 500/bln, Unlimited bandwidth | ~50 build/bln, ~10 GB bandwidth | Sangat Aman |
| **Pages Functions** | 100.000 requests / hari | Rata-rata < 1.000 requests / hari | Sangat Aman |
| **Cloudinary** | 25 Kredit / bulan (~25 GB bandwidth / penyimpanan / 25.000 transformasi) | Estimasi ±450 foto/tahun terkompresi WebP (~180 MB storage, < 2 Kredit/bulan) | Sangat Aman |
| **Neon PostgreSQL** | 0.5 GiB storage, compute sharing | < 50 MB data teks untuk ±500 pengguna | Sangat Aman |
| **Clerk Auth** | 10.000 Monthly Active Users (MAU) | < 200 MAU per tahun | Sangat Aman |
| **Resend** | 100 email / hari, 3.000 email / bulan | < 20 email / hari | Sangat Aman |
| **Turnstile** | Bebas kuota wajar | < 500 tantangan / bulan | Sangat Aman |

---

## 6. Catatan Keputusan Arsitektur (ADR)

### ADR-001: Penggunaan Hono pada Cloudflare Pages Functions
- **Konteks:** Dibutuhkan router API backend yang efisien, ringan, type-safe, dan kompatibel penuh dengan Cloudflare Workers/Pages runtime.
- **Keputusan:** Menggunakan Hono (`hono/tiny` atau `hono`) di dalam `/functions/[[path]].ts`.
- **Konsekuensi:** Routing API terpusat, middleware mudah di-chain, integrasi Zod validator bawaan sangat ringkas.

### ADR-002: Lazy Auto-Approval vs Cron Worker
- **Konteks:** Syarat pendaftar otomatis berstatus `active` setelah 24 jam tanpa cron berbayar.
- **Keputusan:** Menggunakan evaluasi lazy di fungsi `getEffectiveStatus()` pada middleware server dan query handler, lalu write-through persistence ke Neon.
- **Konsekuensi:** Biaya tetap Rp0, logika waktu teruji deterministik melalui unit test tanpa ketergantungan trigger background.

### ADR-003: Drizzle ORM dengan @neondatabase/serverless
- **Konteks:** Database Neon memerlukan koneksi fleksibel yang dapat berjalan pada lingkungan serverless/edge tanpa koneksi pool stateful yang menggantung.
- **Keputusan:** Menggunakan Drizzle ORM dipadukan dengan driver HTTP Neon (`neon()` dari `@neondatabase/serverless`).
- **Konsekuensi:** Startup cepat (cold start rendah), migrasi otomatis via CLI, schema type-safety di TypeScript.

### ADR-004: Penggunaan Cloudinary via StorageService menggantikan Cloudflare R2 untuk v1
- **Konteks:** Aktivasi Cloudflare R2 memerlukan penautan metode pembayaran kartu kredit/debit internasional yang saat ini belum bisa diaktifkan oleh pemilik proyek.
- **Keputusan:** Menggunakan Cloudinary free-tier melalui antarmuka abstraksi `StorageService` dengan metode signed upload langsung dari browser klien ke Cloudinary. Database menyimpan `public_id` Cloudinary pada kolom `*_key`.
- **Alternatif Ditolak:** Menyimpan berkas media mentah di database Neon (menghabiskan kuota database) atau memaksa R2 tanpa kartu.
- **Konsekuensi:** Biaya tetap Rp0 tanpa butuh kartu kredit, foto otomatis mendapat optimasi CDN (`f_auto,q_auto`), dan adapter R2 tetap dapat dipasang di kemudian hari melalui `StorageService` tanpa merombak kode fitur.
