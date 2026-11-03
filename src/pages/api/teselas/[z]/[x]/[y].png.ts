import type { APIRoute } from "astro";
import { entorno as env } from "../../../../../server/env";
export const GET: APIRoute = async ({ params, request }) => {
  const z = Number(params.z),
    x = Number(params.x),
    y = Number(params.y);
  if (
    ![z, x, y].every(Number.isInteger) ||
    z < 0 ||
    z > 18 ||
    x < 0 ||
    y < 0 ||
    x >= 2 ** z ||
    y >= 2 ** z
  )
    return new Response(null, { status: 400 });
  if (!env.GEOAPIFY_API_KEY) return new Response(null, { status: 503 });
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(
    new URL(`/api/teselas/${z}/${x}/${y}.png`, request.url),
  );
  const existente = await cache?.match(cacheKey);
  if (existente) return existente;
  const response = await fetch(
    `https://maps.geoapify.com/v1/tile/carto/${z}/${x}/${y}.png?apiKey=${encodeURIComponent(env.GEOAPIFY_API_KEY)}`,
    { signal: AbortSignal.timeout(10000) },
  );
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  )
    return new Response(null, { status: 503 });
  const mapa = new Response(response.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control":
        response.headers.get("Cache-Control") || "public, max-age=3600",
    },
  });
  if (!mapa.headers.get("Cache-Control")?.includes("no-store"))
    await cache?.put(cacheKey, mapa.clone());
  return mapa;
};
