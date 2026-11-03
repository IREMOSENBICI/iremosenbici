import type { APIRoute } from "astro";
import { entorno as env } from "../../../server/env";
import { json, ErrorHttp, responderError } from "../../../lib/http";
export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Falta la fotografía." }, 400);
  const fila = await env.DATOS.prepare(
    "SELECT clave,miniatura FROM fotos WHERE id=?",
  )
    .bind(id)
    .first<{ clave: string; miniatura: string }>();
  const archivo = fila
    ? await env.FOTOS.get(
        url.searchParams.get("completa") === "1" ? fila.clave : fila.miniatura,
      )
    : null;
  return archivo
    ? new Response(archivo.body, {
        headers: { "Content-Type": "image/webp", "Cache-Control": "no-store" },
      })
    : new Response("No encontrada", { status: 404 });
};
export const POST: APIRoute = async ({ request, url }) => {
  try {
    const tipo =
      url.searchParams.get("tipo") === "panorama_360" ? "panorama_360" : "foto";
    if (!env.IMAGENES || !env.FOTOS)
      throw new ErrorHttp(503, "El procesamiento de fotos no está disponible.");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        request.headers.get("content-type") || "",
      )
    )
      throw new ErrorHttp(415, "Sube una imagen JPG, PNG o WebP.");
    const lector = request.body?.getReader();
    if (!lector) throw new ErrorHttp(400, "Selecciona una fotografía.");
    const partes: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.length;
      if (total > 10 * 1024 * 1024) {
        await lector.cancel();
        throw new ErrorHttp(413, "La fotografía supera 10 MB.");
      }
      partes.push(value);
    }
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const p of partes) {
      buffer.set(p, offset);
      offset += p.length;
    }
    const entrada = () => new Blob([buffer]).stream();
    const info = await env.IMAGENES.info(entrada());
    if (
      !("width" in info) ||
      !("height" in info) ||
      info.width * info.height > 40000000
    )
      throw new ErrorHttp(
        400,
        "La imagen debe ser estática y no superar 40 megapíxeles.",
      );
    if (
      tipo === "panorama_360" &&
      Math.abs(info.width / info.height - 2) > 0.02
    )
      throw new ErrorHttp(
        400,
        "Exporta la foto 360 como una panorámica equirectangular completa 2:1 (por ejemplo 8192 × 4096), de hasta 10 MB.",
      );
    // WebP descarta EXIF/GPS. Nunca se guarda ni sirve el original; si falla la transformación, no se publica.
    const grande = await env.IMAGENES.input(entrada())
      .transform({
        width: tipo === "panorama_360" ? 4096 : 1920,
        fit: "scale-down",
      })
      .output({ format: "image/webp", quality: 85 });
    const chica = await env.IMAGENES.input(entrada())
      .transform({ width: 640, fit: "scale-down" })
      .output({ format: "image/webp", quality: 80 });
    const id = crypto.randomUUID();
    const clave = `procesadas/${id}.webp`;
    const miniatura = `procesadas/${id}-640.webp`;
    await env.FOTOS.put(clave, await grande.response().arrayBuffer(), {
      httpMetadata: { contentType: "image/webp" },
    });
    try {
      await env.FOTOS.put(miniatura, await chica.response().arrayBuffer(), {
        httpMetadata: { contentType: "image/webp" },
      });
      await env.DATOS.prepare(
        "INSERT INTO fotos(id,titulo,alternativa,clave,miniatura,tipo) VALUES(?,'Fotografía sin publicar','Descripción pendiente',?,?,?)",
      )
        .bind(id, clave, miniatura, tipo)
        .run();
    } catch (error) {
      await env.FOTOS.delete([clave, miniatura]);
      throw error;
    }
    return json(
      { id, mensaje: "Fotografía procesada y guardada como borrador." },
      201,
    );
  } catch (error) {
    return responderError(error);
  }
};
