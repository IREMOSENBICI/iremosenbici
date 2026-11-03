import type { APIRoute } from "astro";
import { entorno as env } from "../../server/env";
import { json, responderError } from "../../lib/http";
import { mapasPersonales } from "../../lib/maps";
import {
  ciudadPublica,
  viajePublico,
  etapasMapaPublicas,
  fotosMapaPublicas,
} from "../../server/data";
export const GET: APIRoute = async ({ url }) => {
  try {
    const slug = url.searchParams.get("viaje");
    const viaje = slug ? await viajePublico(env, slug) : null;
    if (slug && !viaje) return json({ error: "Viaje no encontrado." }, 404);
    const [etapas, fotos, ciudad] = await Promise.all([
      etapasMapaPublicas(env, viaje?.id),
      fotosMapaPublicas(env, viaje?.id),
      ciudadPublica(env),
    ]);
    return json({
      proveedor: "google_mymaps",
      mapas: mapasPersonales,
      sincronizacion_automatica: false,
      ciudad,
      fotos,
      etapas: etapas.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        ruta: e.ruta_json ? JSON.parse(e.ruta_json) : null,
      })),
    });
  } catch (e) {
    return responderError(e);
  }
};
