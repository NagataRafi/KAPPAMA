-- Dedupe master data, arahkan ulang foreign key, lalu pasang batas UNIQUE.
-- Drizzle menjalankan berkas migrasi ini dalam satu transaksi, jadi data dan
-- constraint berubah bersama atau tidak sama sekali.
--
-- Urutan penting: FK study_programs.university_id diarahkan SEBELUM universitas
-- duplikat dihapus, karena FK tersebut memakai ON DELETE CASCADE.

-- 1) universities: pertahankan satu baris per nama (created_at paling awal).
WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) AS keep_id
  FROM universities
), mapping AS (
  SELECT id AS duplicate_id, keep_id FROM ranked WHERE id <> keep_id
)
UPDATE study_programs sp
SET university_id = mapping.keep_id
FROM mapping
WHERE sp.university_id = mapping.duplicate_id;

WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) AS keep_id
  FROM universities
), mapping AS (
  SELECT id AS duplicate_id, keep_id FROM ranked WHERE id <> keep_id
)
UPDATE member_profiles mp
SET university_id = mapping.keep_id
FROM mapping
WHERE mp.university_id = mapping.duplicate_id;

WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) AS keep_id
  FROM universities
), mapping AS (
  SELECT id AS duplicate_id, keep_id FROM ranked WHERE id <> keep_id
)
UPDATE programs p
SET university_id = mapping.keep_id
FROM mapping
WHERE p.university_id = mapping.duplicate_id;

WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) AS keep_id
  FROM universities
)
DELETE FROM universities u
USING ranked
WHERE u.id = ranked.id AND ranked.id <> ranked.keep_id;

-- 2) study_programs: pertahankan satu baris per (university_id, name).
WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY university_id, name ORDER BY created_at ASC, id ASC
    ) AS keep_id
  FROM study_programs
), mapping AS (
  SELECT id AS duplicate_id, keep_id FROM ranked WHERE id <> keep_id
)
UPDATE member_profiles mp
SET study_program_id = mapping.keep_id
FROM mapping
WHERE mp.study_program_id = mapping.duplicate_id;

WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY university_id, name ORDER BY created_at ASC, id ASC
    ) AS keep_id
  FROM study_programs
)
DELETE FROM study_programs sp
USING ranked
WHERE sp.id = ranked.id AND ranked.id <> ranked.keep_id;

-- 3) industries: pertahankan satu baris per nama.
WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) AS keep_id
  FROM industries
), mapping AS (
  SELECT id AS duplicate_id, keep_id FROM ranked WHERE id <> keep_id
)
UPDATE alumni_details al
SET industry_id = mapping.keep_id
FROM mapping
WHERE al.industry_id = mapping.duplicate_id;

WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) AS keep_id
  FROM industries
)
DELETE FROM industries i
USING ranked
WHERE i.id = ranked.id AND ranked.id <> ranked.keep_id;

-- 4) Batas UNIQUE (pertahanan berlapis setelah seed idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS "idx_universities_name" ON "universities" USING btree ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_study_programs_univ_name" ON "study_programs" USING btree ("university_id","name");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_industries_name" ON "industries" USING btree ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_districts_name" ON "districts" USING btree ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_villages_district_name" ON "villages" USING btree ("district_id","name");
