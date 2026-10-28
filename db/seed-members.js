import { neon } from '@neondatabase/serverless';
import fs from 'fs';

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
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// Data dummy tidak boleh ikut terisi tanpa persetujuan eksplisit.
// Semua baris dummy ditandai clerk_user_id berawalan 'user_dummy_'.
if (process.env.SEED_DUMMY_MEMBERS !== 'true') {
  console.error(
    'Dibatalkan: set SEED_DUMMY_MEMBERS=true untuk mengisi data anggota dummy. ' +
      'Hapus data dummy dengan: DELETE FROM users WHERE clerk_user_id LIKE \'user_dummy_%\';'
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

async function seedMembers() {
  console.log('👤 Menyiapkan data anggota dummy pengujian...');

  // Ambil beberapa ID referensi master
  const ub = (await sql`SELECT id FROM universities WHERE abbreviation = 'UB' LIMIT 1`)[0];
  const um = (await sql`SELECT id FROM universities WHERE abbreviation = 'UM' LIMIT 1`)[0];
  const polinema = (await sql`SELECT id FROM universities WHERE abbreviation = 'POLINEMA' LIMIT 1`)[0];

  const prodiTI = (await sql`SELECT id FROM study_programs WHERE name = 'Teknik Informatika' AND university_id = ${ub.id} LIMIT 1`)[0];
  const prodiPsi = (await sql`SELECT id FROM study_programs WHERE name = 'Psikologi' AND university_id = ${um.id} LIMIT 1`)[0];
  const prodiPol = (await sql`SELECT id FROM study_programs WHERE name = 'Teknik Informatika' AND university_id = ${polinema.id} LIMIT 1`)[0];

  const indTech = (await sql`SELECT id FROM industries WHERE name LIKE '%Teknologi%' LIMIT 1`)[0];

  // 1. User 1: Anggota Aktif 1 (Bagas - UB)
  const u1 = (await sql`
    INSERT INTO users (clerk_user_id, email, role)
    VALUES ('user_dummy_1', 'bagas.kappama@gmail.com', 'member')
    ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
  `)[0];

  const m1 = (await sql`
    INSERT INTO member_profiles (
      user_id, full_name, username, whatsapp, instagram, linkedin,
      member_type, cohort_year, university_id, study_program_id,
      district_id, village_id, address_detail, hide_contact,
      status, submitted_at, approved_at, approval_type
    ) VALUES (
      ${u1.id}, 'Bagas Pratama', 'bagas_pacitan', '+6281234567890', 'bagaspratama', 'https://linkedin.com/in/bagaspratama',
      'active', 2023, ${ub.id}, ${prodiTI.id},
      '35.01.04', '35.01.04.2006', 'Dusun Krajan, RT 02 / RW 01', false,
      'active', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'manual'
    )
    ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id
  `)[0];

  // 2. User 2: Anggota Aktif 2 (Siti - UM, hide_contact: true)
  const u2 = (await sql`
    INSERT INTO users (clerk_user_id, email, role)
    VALUES ('user_dummy_2', 'siti.nurhaliza@gmail.com', 'member')
    ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
  `)[0];

  await sql`
    INSERT INTO member_profiles (
      user_id, full_name, username, whatsapp, instagram, linkedin,
      member_type, cohort_year, university_id, study_program_id,
      district_id, village_id, address_detail, hide_contact,
      status, submitted_at, approved_at, approval_type
    ) VALUES (
      ${u2.id}, 'Siti Rahmawati', 'sitirahma', '+6282198765432', 'sitirahma_p', NULL,
      'active', 2024, ${um.id}, ${prodiPsi.id},
      '35.01.11', '35.01.11.2006', 'Dusun Ngadirojo Lor, RT 01 / RW 03', true,
      'active', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'auto'
    )
    ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
  `;

  // 3. User 3: Alumni (Rizky - POLINEMA, Bekerja)
  const u3 = (await sql`
    INSERT INTO users (clerk_user_id, email, role)
    VALUES ('user_dummy_3', 'rizky.alumni@gmail.com', 'member')
    ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
  `)[0];

  const m3 = (await sql`
    INSERT INTO member_profiles (
      user_id, full_name, username, whatsapp, instagram, linkedin,
      member_type, cohort_year, university_id, study_program_id,
      district_id, village_id, address_detail, hide_contact,
      status, submitted_at, approved_at, approval_type
    ) VALUES (
      ${u3.id}, 'Rizky Kurniawan, S.Tr.Kom', 'rizky_kurniawan', '+6285712341234', 'rizky.dev', 'https://linkedin.com/in/rizkykurniawan',
      'alumni', 2019, ${polinema.id}, ${prodiPol.id},
      '35.01.10', '35.01.10.2012', 'Dusun Krajan Tulakan RT 04 / RW 02', false,
      'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days', 'manual'
    )
    ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id
  `)[0];

  if (m3?.id) {
    await sql`
      INSERT INTO alumni_details (
        member_id, graduation_year, current_status, job_title, organization, industry_id, work_city
      ) VALUES (
        ${m3.id}, 2023, 'working', 'Software Engineer', 'PT Teknologi Nusantara', ${indTech.id}, 'Jakarta Selatan'
      )
      ON CONFLICT (member_id) DO UPDATE SET job_title = EXCLUDED.job_title
    `;
  }

  // 4. User 4: Pending Member (<24 jam)
  const u4 = (await sql`
    INSERT INTO users (clerk_user_id, email, role)
    VALUES ('user_dummy_4', 'calon.pendaftar@gmail.com', 'member')
    ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
  `)[0];

  await sql`
    INSERT INTO member_profiles (
      user_id, full_name, username, whatsapp, instagram, linkedin,
      member_type, cohort_year, university_id, study_program_id,
      district_id, village_id, address_detail, hide_contact,
      status, submitted_at
    ) VALUES (
      ${u4.id}, 'Dian Permatasari', 'dian_permatasari', '+6281355556666', 'dianpermata', NULL,
      'active', 2025, ${ub.id}, ${prodiTI.id},
      '35.01.02', '35.01.02.2009', 'Dusun Pringkuku RT 01', false,
      'pending', NOW() - INTERVAL '4 hours'
    )
    ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
  `;

  // 5. User 5: Pending Member (>24 jam, kandidat auto-aktif lazy)
  const u5 = (await sql`
    INSERT INTO users (clerk_user_id, email, role)
    VALUES ('user_dummy_5', 'auto.approve.test@gmail.com', 'member')
    ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
  `)[0];

  await sql`
    INSERT INTO member_profiles (
      user_id, full_name, username, whatsapp, instagram, linkedin,
      member_type, cohort_year, university_id, study_program_id,
      district_id, village_id, address_detail, hide_contact,
      status, submitted_at
    ) VALUES (
      ${u5.id}, 'Fajar Nugroho', 'fajar_nugroho', '+6289911112222', 'fajarnugroho', NULL,
      'active', 2024, ${um.id}, ${prodiPsi.id},
      '35.01.01', '35.01.01.2003', 'Dusun Donorojo Kulon', false,
      'pending', NOW() - INTERVAL '25 hours'
    )
    ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
  `;

  console.log('✅ Anggota dummy berhasil dibuat: 2 Aktif, 1 Alumni, 1 Pending (<24h), 1 Pending (>24h lazy)!');
}

seedMembers().catch((err) => {
  console.error('❌ Gagal seed members:', err);
  process.exit(1);
});
