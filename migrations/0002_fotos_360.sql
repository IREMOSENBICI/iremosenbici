ALTER TABLE fotos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'foto' CHECK(tipo IN ('foto','panorama_360'));
ALTER TABLE fotos ADD COLUMN norte_grados REAL CHECK(norte_grados IS NULL OR (norte_grados>=0 AND norte_grados<360));
