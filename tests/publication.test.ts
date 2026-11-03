import { it, expect } from "vitest";
import { basePrueba } from "./database";
import {
  viajesPublicos,
  viajePublico,
  etapasPublicas,
  fotosPublicas,
  ciudadPublica,
  FOTO_PUBLICA,
} from "../src/server/data";
it("las consultas públicas excluyen borradores, sus etapas y sus fotografías", async () => {
  const { db, env } = basePrueba();
  db.exec(
    "INSERT INTO viajes(id,slug,titulo,resumen,estado,visibilidad) VALUES('privado','privado','Secreto','No publicar','planificado','borrador'); INSERT INTO etapas(id,viaje_id,titulo,visibilidad) VALUES('etapa-privada','privado','Secreto','publicado'); INSERT INTO fotos(id,viaje_id,titulo,alternativa,clave,miniatura,visibilidad) VALUES('foto-privada','privado','Secreto','Secreto','privada','mini','publicado');",
  );
  expect((await viajesPublicos(env)).map((v) => v.id)).toEqual([
    "venezuela-costa-rica",
  ]);
  expect(await viajePublico(env, "privado")).toBeNull();
  expect(await etapasPublicas(env, "privado")).toEqual([]);
  expect(await fotosPublicas(env)).toEqual([]);
  expect(
    db.prepare(`SELECT f.id FROM fotos f WHERE ${FOTO_PUBLICA}`).all(),
  ).toEqual([]);
  db.close();
});
it("la base de datos bloquea la publicación de un trazado planificado o sin revisión", () => {
  const { db } = basePrueba();
  expect(() =>
    db.exec("UPDATE etapas SET ruta_json='{}' WHERE id='venezuela'"),
  ).toThrow();
  expect(() =>
    db.exec(
      "UPDATE etapas SET ruta_json='{}',estado='completada' WHERE id='venezuela'",
    ),
  ).toThrow();
  db.exec(
    "UPDATE etapas SET ruta_json='{}',estado='completada',ruta_revisada=1 WHERE id='venezuela'",
  );
  expect(
    db.prepare("SELECT ruta_json FROM etapas WHERE id='venezuela'").get()
      ?.ruta_json,
  ).toBe("{}");
  db.close();
});
it("retirar una etapa o un viaje retira también sus fotos públicas", async () => {
  const { db, env } = basePrueba();
  db.exec(
    "INSERT INTO fotos(id,viaje_id,etapa_id,titulo,alternativa,clave,miniatura,visibilidad) VALUES('visible','venezuela-costa-rica','venezuela','Foto','Paisaje','visible','mini','publicado');",
  );
  expect(await fotosPublicas(env)).toHaveLength(1);
  db.exec("UPDATE etapas SET visibilidad='borrador' WHERE id='venezuela'");
  expect(await fotosPublicas(env)).toHaveLength(0);
  db.exec(
    "UPDATE etapas SET visibilidad='publicado' WHERE id='venezuela';UPDATE viajes SET visibilidad='borrador'",
  );
  expect(await fotosPublicas(env)).toHaveLength(0);
  db.close();
});
it("no publica una ubicación inicial ficticia y oculta la última ciudad al retirarla", async () => {
  const { db, env } = basePrueba();
  expect(await ciudadPublica(env)).toBeNull();
  db.exec(
    "INSERT INTO ubicacion_publica(id,ciudad,pais,latitud,longitud,fecha_publicacion,visible) VALUES(1,'Ciudad de prueba','País',1,2,'2026-11-01',1)",
  );
  expect((await ciudadPublica(env))?.ciudad).toBe("Ciudad de prueba");
  db.exec("UPDATE ubicacion_publica SET visible=0");
  expect(await ciudadPublica(env)).toBeNull();
  db.close();
});
