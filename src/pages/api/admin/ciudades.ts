import type { APIRoute } from "astro";
import { SignJWT } from "jose";
import { entorno as env } from "../../../server/env";
import { json, ErrorHttp, responderError } from "../../../lib/http";
export const GET: APIRoute = async ({ url }) => {
  try {
    const q = (url.searchParams.get("q") || "").trim();
    if (q.length < 3 || q.length > 100)
      throw new ErrorHttp(400, "Escribe al menos tres letras de la ciudad.");
    if (!env.GEOAPIFY_API_KEY || !env.SECRETO_SITIO)
      throw new ErrorHttp(
        503,
        "La búsqueda de ciudades aún no está configurada.",
      );
    const parametros = new URLSearchParams({
      text: q,
      type: "city",
      format: "json",
      lang: "es",
      limit: "6",
      apiKey: env.GEOAPIFY_API_KEY,
    });
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?${parametros}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok)
      throw new ErrorHttp(
        502,
        "El buscador de ciudades no está disponible. Inténtalo más tarde.",
      );
    const resultado = (await response.json()) as { results?: any[] };
    const ciudades = await Promise.all(
      (resultado.results || [])
        .filter(
          (c) =>
            c.city &&
            c.country &&
            Number.isFinite(c.lat) &&
            Number.isFinite(c.lon),
        )
        .map(async (c) => {
          const dato = {
            ciudad: c.city,
            pais: c.country,
            latitud: Number(c.lat.toFixed(4)),
            longitud: Number(c.lon.toFixed(4)),
          };
          const token = await new SignJWT(dato)
            .setProtectedHeader({ alg: "HS256" })
            .setAudience("ciudad-publica")
            .setExpirationTime("30m")
            .sign(new TextEncoder().encode(env.SECRETO_SITIO));
          return {
            ciudad: dato.ciudad,
            pais: dato.pais,
            region: c.state || "",
            token,
          };
        }),
    );
    return json({ ciudades });
  } catch (e) {
    return responderError(e);
  }
};
