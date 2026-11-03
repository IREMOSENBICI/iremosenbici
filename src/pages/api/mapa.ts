import type { APIRoute } from "astro";
import { entorno as env } from "../../server/env";
import { json, responderError } from "../../lib/http";
import { ciudadPublica, viajePublico, etapasPublicas } from "../../server/data";
export const GET: APIRoute = async ({ url }) => {
  try {
    const slug = url.searchParams.get("viaje");
    const viaje = slug ? await viajePublico(env, slug) : null;
    if (slug && !viaje) return json({ error: "Viaje no encontrado." }, 404);
    const etapas = viaje ? await etapasPublicas(env, viaje.id) : [];
    return json({
      ciudad: await ciudadPublica(env),
      etapas: etapas.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        ciudad: e.ciudad,
        pais: e.pais,
        estado: e.estado,
        ruta: e.ruta_json ? JSON.parse(e.ruta_json) : null,
      })),
      teselas: env.GEOAPIFY_API_KEY ? "/api/teselas/{z}/{x}/{y}.png" : null,
    });
  } catch (e) {
    return responderError(e);
  }
};
