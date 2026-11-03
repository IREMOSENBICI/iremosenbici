PRAGMA foreign_keys = ON;
CREATE TABLE viajes (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, idioma TEXT NOT NULL DEFAULT 'es',
 titulo TEXT NOT NULL, resumen TEXT NOT NULL, descripcion TEXT NOT NULL DEFAULT '',
 estado TEXT NOT NULL CHECK(estado IN ('planificado','en_curso','completado')),
 visibilidad TEXT NOT NULL DEFAULT 'borrador' CHECK(visibilidad IN ('borrador','publicado')),
 revision INTEGER NOT NULL DEFAULT 1, actualizado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE etapas (
 id TEXT PRIMARY KEY, viaje_id TEXT NOT NULL REFERENCES viajes(id), titulo TEXT NOT NULL,
 descripcion TEXT NOT NULL DEFAULT '', ciudad TEXT NOT NULL DEFAULT '', pais TEXT NOT NULL DEFAULT '',
 estado TEXT NOT NULL DEFAULT 'planificada' CHECK(estado IN ('planificada','completada')),
 visibilidad TEXT NOT NULL DEFAULT 'borrador' CHECK(visibilidad IN ('borrador','publicado')),
 orden INTEGER NOT NULL DEFAULT 0, ruta_json TEXT, ruta_revisada INTEGER NOT NULL DEFAULT 0,
 revision INTEGER NOT NULL DEFAULT 1, actualizado TEXT NOT NULL DEFAULT (datetime('now')),
 CHECK(visibilidad <> 'publicado' OR ruta_json IS NULL OR (estado='completada' AND ruta_revisada=1))
);
CREATE INDEX etapas_viaje ON etapas(viaje_id, visibilidad, orden);
CREATE TABLE fotos (
 id TEXT PRIMARY KEY, viaje_id TEXT REFERENCES viajes(id), etapa_id TEXT REFERENCES etapas(id),
 titulo TEXT NOT NULL, alternativa TEXT NOT NULL, pie TEXT NOT NULL DEFAULT '',
 clave TEXT NOT NULL UNIQUE, miniatura TEXT NOT NULL UNIQUE,
 visibilidad TEXT NOT NULL DEFAULT 'borrador' CHECK(visibilidad IN ('borrador','publicado')),
 revision INTEGER NOT NULL DEFAULT 1, actualizado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX fotos_publicas ON fotos(visibilidad, actualizado);
CREATE TABLE ubicacion_publica (
 id INTEGER PRIMARY KEY CHECK(id=1), ciudad TEXT NOT NULL, pais TEXT NOT NULL,
 latitud REAL NOT NULL, longitud REAL NOT NULL, fecha_publicacion TEXT NOT NULL,
 visible INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE borradores_heredados (
 id TEXT PRIMARY KEY, tipo TEXT NOT NULL, titulo TEXT NOT NULL, contenido TEXT NOT NULL
);
CREATE TABLE limites_contacto (clave TEXT PRIMARY KEY, cantidad INTEGER NOT NULL, vence INTEGER NOT NULL);

INSERT INTO viajes(id,slug,titulo,resumen,descripcion,estado,visibilidad) VALUES
 ('venezuela-costa-rica','venezuela-costa-rica','Venezuela → Costa Rica','Cuatro países. Un mismo sueño: conocer América a pedal.','Un proyecto que nace en Maracay y recorre las costas de Venezuela y Colombia, continúa hacia Panamá y llega a Costa Rica. Este itinerario está planificado; no representa una travesía ya realizada.','planificado','publicado');
INSERT INTO etapas(id,viaje_id,titulo,ciudad,pais,descripcion,orden,visibilidad) VALUES
 ('venezuela','venezuela-costa-rica','El comienzo, en Venezuela','Maracay','Venezuela','Desde la ciudad jardín hacia Falcón, sus costas, Coro y los médanos.',1,'publicado'),
 ('colombia','venezuela-costa-rica','La costa colombiana','Cartagena','Colombia','Riohacha, Santa Marta, Barranquilla y Cartagena: ciudades, encuentros y caminos junto al Caribe.',2,'publicado'),
 ('panama','venezuela-costa-rica','Un puente entre océanos','Ciudad de Panamá','Panamá','El proyecto contempla tramos marítimos y terrestres hasta la ciudad de Panamá y su canal.',3,'publicado'),
 ('costa-rica','venezuela-costa-rica','Hacia Costa Rica','San José','Costa Rica','Desde Paso Canoas, nuevos paisajes y caminos hasta San José. Los detalles se revisarán antes de viajar.',4,'publicado');
INSERT INTO borradores_heredados VALUES
 ('perfiles-ejemplo','perfil','Perfiles de la comunidad pendientes','Tres perfiles de ejemplo de la web clásica, sin nombres ni contenido real. No publicar hasta completarlos.'),
 ('patrocinantes-ejemplo','patrocinante','Patrocinantes pendientes','Tres tarjetas de ejemplo de la web clásica. No representan patrocinantes actuales.'),
 ('mapa-ruta','mapa','Mapa antiguo Venezuela–Costa Rica','Google My Maps: 1D8ACPdT3DBvu3fGIsiF_yLAOhizxy41h. Importar KML como borrador si está disponible.'),
 ('mapa-recomendaciones','mapa','Lugares de interés del mapa antiguo','Google My Maps: 1IECUioe6Hy5MGvzoMR22QQojijK0n6q2. Revisar y depurar antes de publicar.');
