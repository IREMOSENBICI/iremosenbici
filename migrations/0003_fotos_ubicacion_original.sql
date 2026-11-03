-- Se conserva el original completo; las copias WebP solo optimizan su visualización.
ALTER TABLE fotos ADD COLUMN original TEXT;
ALTER TABLE fotos ADD COLUMN original_tipo TEXT;
ALTER TABLE fotos ADD COLUMN latitud REAL CHECK(latitud IS NULL OR (latitud >= -90 AND latitud <= 90));
ALTER TABLE fotos ADD COLUMN longitud REAL CHECK(longitud IS NULL OR (longitud >= -180 AND longitud <= 180));
CREATE INDEX fotos_mapa ON fotos(visibilidad, latitud, longitud);
