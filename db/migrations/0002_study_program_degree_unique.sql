-- Satu nama prodi boleh muncul di jenjang berbeda (mis. D4 dan D3 Teknik
-- Elektronika di Polinema). Ganti batas UNIQUE 2 kolom dengan 3 kolom.
DROP INDEX IF EXISTS "idx_study_programs_univ_name";
CREATE UNIQUE INDEX IF NOT EXISTS "idx_study_programs_univ_name"
  ON "study_programs" USING btree ("university_id","name","degree_level");
