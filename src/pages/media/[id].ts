import type { APIRoute } from "astro";
import { entorno as env } from "../../server/env";
import { FOTO_PUBLICA } from "../../server/data";
export const GET: APIRoute = async ({ params, url }) => {
  if (!/^[a-f0-9-]{36}$/.test(params.id || ""))
    return new Response("No encontrado", { status: 404 });
  const foto = await env.DATOS.prepare(
    `SELECT f.clave,f.miniatura FROM fotos f WHERE f.id=? AND ${FOTO_PUBLICA}`,
  )
    .bind(params.id)
    .first<{ clave: string; miniatura: string }>();
  if (!foto) return new Response("No encontrado", { status: 404 });
  const imagen = await env.FOTOS.get(
    url.searchParams.get("mini") === "1" ? foto.miniatura : foto.clave,
  );
  if (!imagen) return new Response("No encontrado", { status: 404 });
  return new Response(imagen.body, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
