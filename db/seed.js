import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Fungsi membaca env file sederhana
function loadEnv() {
  const envPaths = ['.env', '.dev.vars'];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL tidak ditemukan di .env atau .dev.vars!');
  process.exit(1);
}

const sql = neon(dbUrl);

async function seed() {
  console.log('🌱 Memulai proses seeding data master KAPPAMA...');

  // 1. Wilayah Pacitan (Districts & Villages)
  const regionsRaw = fs.readFileSync(path.resolve('db/seed/pacitan-regions.json'), 'utf-8');
  const { districts, villages } = JSON.parse(regionsRaw);

  console.log(`📍 Memasukkan ${districts.length} kecamatan...`);
  for (const d of districts) {
    await sql`
      INSERT INTO districts (id, name, created_at)
      VALUES (${d.id}, ${d.name}, NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;
  }

  console.log(`📍 Memasukkan ${villages.length} desa/kelurahan Pacitan...`);
  for (const v of villages) {
    await sql`
      INSERT INTO villages (id, district_id, name, created_at)
      VALUES (${v.id}, ${v.districtId}, ${v.name}, NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;
  }

  // 2. Universitas, Prodi, Industri
  const univRaw = fs.readFileSync(path.resolve('db/seed/universities-industries.json'), 'utf-8');
  const { universities, studyPrograms, industries } = JSON.parse(univRaw);

  console.log(`🎓 Memasukkan ${universities.length} perguruan tinggi...`);
  const univMap = new Map();
  for (const u of universities) {
    const res = await sql`
      INSERT INTO universities (name, abbreviation, city, is_active)
      VALUES (${u.name}, ${u.abbreviation}, ${u.city}, true)
      ON CONFLICT (name) DO UPDATE SET
        abbreviation = EXCLUDED.abbreviation,
        city = EXCLUDED.city,
        is_active = true,
        updated_at = NOW()
      RETURNING id, abbreviation
    `;
    if (res.length > 0) {
      univMap.set(res[0].abbreviation, res[0].id);
    }
  }

  console.log(`📚 Memasukkan ${studyPrograms.length} program studi...`);
  for (const sp of studyPrograms) {
    const univId = univMap.get(sp.univAbbr);
    if (univId) {
      await sql`
        INSERT INTO study_programs (university_id, name, degree_level, is_active)
        VALUES (${univId}, ${sp.name}, ${sp.degreeLevel}, true)
        ON CONFLICT (university_id, name, degree_level) DO UPDATE SET
          degree_level = EXCLUDED.degree_level,
          is_active = true,
          updated_at = NOW()
      `;
    }
  }

  console.log(`💼 Memasukkan ${industries.length} bidang industri...`);
  for (const ind of industries) {
    await sql`
      INSERT INTO industries (name, is_active)
      VALUES (${ind}, true)
      ON CONFLICT (name) DO UPDATE SET
        is_active = true,
        updated_at = NOW()
    `;
  }

  // 3. Periode & Struktur Kepengurusan
  console.log('🏛️ Menyiapkan periode dan struktur kepengurusan awal...');
  const periodRes = await sql`
    INSERT INTO org_periods (period_label, start_year, end_year, is_current)
    SELECT '2026/2027', 2026, 2027, true
    WHERE NOT EXISTS (
      SELECT 1 FROM org_periods WHERE period_label = '2026/2027'
    )
    RETURNING id
  `;
  const periodId = periodRes.length > 0 ? periodRes[0].id : (await sql`SELECT id FROM org_periods WHERE period_label = '2026/2027' LIMIT 1`)[0]?.id;

  if (periodId) {
    const leaders = [
      { position: 'pembina', name: '[Placeholder - Pembina KAPPAMA]', campus: 'Dosen Pembina', order: 1 },
      { position: 'penasihat', name: '[Placeholder - Penasihat KAPPAMA]', campus: 'Dewan Pertimbangan', order: 2 },
      { position: 'ketua', name: '[Placeholder - Ketua Umum]', campus: 'Universitas Brawijaya', order: 3 },
      { position: 'wakil_ketua_umum', name: '[Placeholder - Wakil Ketua Umum]', campus: 'Universitas Negeri Malang', order: 4 },
    ];

    for (const l of leaders) {
      await sql`
        INSERT INTO org_leaders (period_id, position, name, campus_study, sort_order)
        SELECT ${periodId}, ${l.position}, ${l.name}, ${l.campus}, ${l.order}
        WHERE NOT EXISTS (
          SELECT 1 FROM org_leaders
          WHERE period_id = ${periodId} AND position = ${l.position}
        )
      `;
    }
  }

  // 4. Profil Organisasi & AD/ART
  console.log('📄 Menyiapkan profil organisasi & dokumen AD/ART...');
  const existingOrg = await sql`SELECT id FROM org_profile LIMIT 1`;
  if (existingOrg.length === 0) {
    await sql`
      INSERT INTO org_profile (about_text, vision_text, missions, contact_email, contact_instagram, contact_address)
      VALUES (
        'KAPPAMA (Keluarga Pelajar Pacitan di Malang) adalah organisasi mahasiswa daerah yang mewadahi para pelajar dan mahasiswa asal Pacitan, Jawa Timur, yang sedang menempuh studi di Kota Malang.',
        'Mewujudkan wadah kekeluargaan mahasiswa Pacitan di Malang yang solid, mandiri, berkarakter, dan berkontribusi nyata bagi kemajuan daerah.',
        ${JSON.stringify([
          'Mempererat persaudaraan dan solidaritas seluruh pelajar dan mahasiswa Pacitan di Malang.',
          'Mengembangkan potensi intelektual, kepemimpinan, dan kewirausahaan anggota.',
          'Membangun jejaring sinergis antara mahasiswa aktif dan alumni di berbagai bidang profesi.',
          'Menginisiasi program pengabdian masyarakat yang berdampak langsung bagi Kabupaten Pacitan.'
        ])},
        'halo@kappama.org',
        '@kappama_malang',
        'Kota Malang, Jawa Timur'
      )
    `;
  }

  const existingBylaws = await sql`SELECT id FROM bylaws_documents LIMIT 1`;
  if (existingBylaws.length === 0) {
    await sql`
      INSERT INTO bylaws_documents (title, file_key, effective_date, is_active)
      VALUES ('AD/ART KAPPAMA Periode 2026/2027', '/docs/ad-art-kappama-sample.pdf', '2026-01-01', true)
    `;
  }

  console.log('✅ Seeding data master selesai dengan sukses!');
}

seed().catch((err) => {
  console.error('❌ Gagal menjalankan seed:', err);
  process.exit(1);
});
