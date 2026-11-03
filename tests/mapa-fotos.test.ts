import { it, expect } from "vitest";
import sharp from "sharp";
import { ubicacionFoto } from "../src/lib/foto-ubicacion";
import { fotoSchema } from "../src/lib/validation";
import { fotosMapaPublicas, etapasMapaPublicas } from "../src/server/data";
import { basePrueba } from "./database";

it("recupera coordenadas EXIF sur/oeste sin modificar el original", async () => {
  const imagen = await sharp({
    create: { width: 32, height: 16, channels: 3, background: "#abc" },
  })
    .withExif({
      IFD3: {
        GPSLatitudeRef: "S",
        GPSLatitude: "12/1 30/1 0/1",
        GPSLongitudeRef: "W",
        GPSLongitude: "66/1 15/1 0/1",
      },
    })
    .jpeg()
    .toBuffer();
  const antes = Buffer.from(imagen);
  expect(await ubicacionFoto(imagen)).toEqual({
    latitud: -12.5,
    longitud: -66.25,
  });
  expect(imagen).toEqual(antes);
});

it("no inventa una ubicación para una foto sin GPS o metadatos ilegibles", async () => {
  const imagen = await sharp({
    create: { width: 32, height: 16, channels: 3, background: "#abc" },
  })
    .png()
    .toBuffer();
  expect(await ubicacionFoto(imagen)).toEqual({
    latitud: null,
    longitud: null,
  });
  expect(await ubicacionFoto(new Uint8Array([0, 1, 2]))).toEqual({
    latitud: null,
    longitud: null,
  });
});

it("exige coordenadas completas y válidas y admite cero como coordenada", () => {
  const foto = {
    id: crypto.randomUUID(),
    titulo: "Foto",
    alternativa: "Paisaje",
    pie: "",
    viaje_id: null,
    etapa_id: null,
    visibilidad: "publicado",
    revision: 1,
    latitud: 0,
    longitud: 0,
  };
  expect(fotoSchema.safeParse(foto).success).toBe(true);
  expect(
    fotoSchema.safeParse({ ...foto, latitud: null, longitud: null }).success,
  ).toBe(true);
  expect(fotoSchema.safeParse({ ...foto, longitud: null }).success).toBe(false);
  expect(fotoSchema.safeParse({ ...foto, latitud: 91 }).success).toBe(false);
  expect(fotoSchema.safeParse({ ...foto, longitud: -181 }).success).toBe(false);
});

it("el mapa global reúne fotos normales y 360 publicadas y retira sus coordenadas al ocultarlas", async () => {
  const { db, env } = basePrueba();
  db.exec(`
    INSERT INTO fotos(id,titulo,alternativa,clave,miniatura,visibilidad,latitud,longitud) VALUES
      ('normal','Normal','Paisaje','normal','normal-mini','publicado',0,0),
      ('privada','Privada','Paisaje','privada','privada-mini','borrador',1,2),
      ('sin-gps','Sin GPS','Paisaje','sin-gps','sin-gps-mini','publicado',NULL,NULL);
    INSERT INTO fotos(id,titulo,alternativa,clave,miniatura,visibilidad,latitud,longitud,tipo,viaje_id,etapa_id)
      VALUES('panorama','Panorama','Paisaje','panorama','panorama-mini','publicado',10,-66,'panorama_360','venezuela-costa-rica','venezuela');
  `);
  expect((await fotosMapaPublicas(env)).map((f) => f.id).sort()).toEqual([
    "normal",
    "panorama",
  ]);
  expect(
    (await fotosMapaPublicas(env, "venezuela-costa-rica")).map((f) => f.id),
  ).toEqual(["panorama"]);
  expect(Object.keys((await fotosMapaPublicas(env))[0])).not.toContain(
    "original",
  );
  db.exec("UPDATE etapas SET visibilidad='borrador' WHERE id='venezuela'");
  expect((await fotosMapaPublicas(env)).map((f) => f.id)).toEqual(["normal"]);
  db.exec("UPDATE fotos SET visibilidad='borrador' WHERE id='normal'");
  expect(await fotosMapaPublicas(env)).toEqual([]);
  db.close();
});

it("el mapa de portada incluye trazados revisados de todos los viajes y respeta los borradores", async () => {
  const { db, env } = basePrueba();
  expect(await etapasMapaPublicas(env)).toEqual([]);
  db.exec(
    "UPDATE etapas SET estado='completada',ruta_revisada=1,ruta_json='{}' WHERE id='venezuela'",
  );
  expect((await etapasMapaPublicas(env)).map((e) => e.id)).toEqual([
    "venezuela",
  ]);
  expect(await etapasMapaPublicas(env, "otro")).toEqual([]);
  db.exec("UPDATE viajes SET visibilidad='borrador'");
  expect(await etapasMapaPublicas(env)).toEqual([]);
  db.close();
});
