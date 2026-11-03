import type { APIRoute } from "astro";
import { entorno as env } from "../../../server/env";
import { cuerpo, json, ErrorHttp, responderError } from "../../../lib/http";
import { viajeSchema, etapaSchema, fotoSchema } from "../../../lib/validation";
import { limpiarRuta } from "../../../lib/routes";
export const GET: APIRoute = async () => {
  try {
    const [viajes, etapas, fotos, ubicacion, borradores] = await Promise.all([
      env.DATOS.prepare("SELECT * FROM viajes ORDER BY actualizado DESC").all(),
      env.DATOS.prepare("SELECT * FROM etapas ORDER BY viaje_id,orden").all(),
      env.DATOS.prepare(
        "SELECT id,viaje_id,etapa_id,titulo,alternativa,pie,visibilidad,revision,tipo,norte_grados,latitud,longitud,original IS NOT NULL AS tiene_original FROM fotos ORDER BY actualizado DESC",
      ).all(),
      env.DATOS.prepare("SELECT * FROM ubicacion_publica WHERE id=1").first(),
      env.DATOS.prepare("SELECT * FROM borradores_heredados").all(),
    ]);
    return json({
      viajes: viajes.results,
      etapas: etapas.results,
      fotos: fotos.results,
      ubicacion,
      borradores: borradores.results,
      servicios: {
        mapas:
          env.PROVEEDOR_MAPA === "google"
            ? !!env.GOOGLE_MAPS_API_KEY
            : !!env.GEOAPIFY_API_KEY,
        correo: !!env.RESEND_API_KEY,
        fotos: !!env.IMAGENES,
      },
    });
  } catch (e) {
    return responderError(e);
  }
};
export const POST: APIRoute = async ({ request }) => {
  try {
    const { tipo, datos } = await cuerpo(request);
    let resultado: D1Result;
    if (tipo === "viaje") {
      const d = viajeSchema.parse(datos);
      const argumentos = [
        d.slug,
        d.titulo,
        d.resumen,
        d.descripcion,
        d.estado,
        d.visibilidad,
      ];
      resultado =
        d.revision === 0
          ? await env.DATOS.prepare(
              "INSERT INTO viajes(slug,titulo,resumen,descripcion,estado,visibilidad,id) VALUES(?,?,?,?,?,?,?)",
            )
              .bind(...argumentos, d.id)
              .run()
          : await env.DATOS.prepare(
              "UPDATE viajes SET slug=?,titulo=?,resumen=?,descripcion=?,estado=?,visibilidad=?,revision=revision+1,actualizado=datetime('now') WHERE id=? AND revision=?",
            )
              .bind(...argumentos, d.id, d.revision)
              .run();
    } else if (tipo === "etapa") {
      const d = etapaSchema.parse(datos);
      let ruta: string | null = null;
      if (d.ruta) {
        try {
          ruta = JSON.stringify(limpiarRuta(d.ruta));
        } catch (e) {
          throw new ErrorHttp(400, (e as Error).message);
        }
      }
      if (
        ruta &&
        d.visibilidad === "publicado" &&
        (d.estado !== "completada" || !d.ruta_revisada)
      )
        throw new ErrorHttp(
          400,
          "Publica el trazado solo cuando hayas completado la etapa y revisado sus puntos sensibles.",
        );
      if (
        !(await env.DATOS.prepare("SELECT id FROM viajes WHERE id=?")
          .bind(d.viaje_id)
          .first())
      )
        throw new ErrorHttp(400, "Selecciona un viaje existente.");
      const argumentos = [
        d.viaje_id,
        d.titulo,
        d.descripcion,
        d.ciudad,
        d.pais,
        d.estado,
        d.visibilidad,
        d.orden,
        ruta,
        d.ruta_revisada ? 1 : 0,
      ];
      resultado =
        d.revision === 0
          ? await env.DATOS.prepare(
              "INSERT INTO etapas(viaje_id,titulo,descripcion,ciudad,pais,estado,visibilidad,orden,ruta_json,ruta_revisada,id) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            )
              .bind(...argumentos, d.id)
              .run()
          : await env.DATOS.prepare(
              "UPDATE etapas SET viaje_id=?,titulo=?,descripcion=?,ciudad=?,pais=?,estado=?,visibilidad=?,orden=?,ruta_json=?,ruta_revisada=?,revision=revision+1,actualizado=datetime('now') WHERE id=? AND revision=?",
            )
              .bind(...argumentos, d.id, d.revision)
              .run();
    } else if (tipo === "foto") {
      const d = fotoSchema.parse(datos);
      if (d.etapa_id) {
        const etapa = await env.DATOS.prepare(
          "SELECT viaje_id FROM etapas WHERE id=?",
        )
          .bind(d.etapa_id)
          .first<{ viaje_id: string }>();
        if (!etapa || etapa.viaje_id !== d.viaje_id)
          throw new ErrorHttp(
            400,
            "La etapa debe pertenecer al viaje seleccionado.",
          );
      }
      if (
        d.viaje_id &&
        !(await env.DATOS.prepare("SELECT id FROM viajes WHERE id=?")
          .bind(d.viaje_id)
          .first())
      )
        throw new ErrorHttp(400, "El viaje no existe.");
      resultado = await env.DATOS.prepare(
        "UPDATE fotos SET titulo=?,alternativa=?,pie=?,viaje_id=?,etapa_id=?,visibilidad=?,norte_grados=?,latitud=?,longitud=?,revision=revision+1,actualizado=datetime('now') WHERE id=? AND revision=?",
      )
        .bind(
          d.titulo,
          d.alternativa,
          d.pie,
          d.viaje_id,
          d.etapa_id,
          d.visibilidad,
          d.norte_grados,
          d.latitud,
          d.longitud,
          d.id,
          d.revision,
        )
        .run();
    } else throw new ErrorHttp(400, "Tipo de contenido desconocido.");
    if (resultado.meta.changes !== 1)
      throw new ErrorHttp(
        409,
        "El contenido cambió en otra sesión. Recarga antes de guardar para no sobrescribirlo.",
      );
    return json({ mensaje: "Cambios guardados." });
  } catch (e) {
    return responderError(e);
  }
};
