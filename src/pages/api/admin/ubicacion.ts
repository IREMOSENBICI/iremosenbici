import type { APIRoute } from "astro";
import { jwtVerify } from "jose";
import { entorno as env } from "../../../server/env";
import { cuerpo, json, ErrorHttp, responderError } from "../../../lib/http";
export const POST: APIRoute = async ({ request }) => {
  try {
    const d = await cuerpo(request, 10000);
    if (d.ocultar === true) {
      await env.DATOS.prepare(
        "UPDATE ubicacion_publica SET visible=0,revision=revision+1 WHERE id=1",
      ).run();
      return json({ mensaje: "La ciudad ya no se muestra." });
    }
    if (!env.SECRETO_SITIO || typeof d.token !== "string")
      throw new ErrorHttp(400, "Selecciona una ciudad del buscador.");
    let payload;
    try {
      ({ payload } = await jwtVerify(
        d.token,
        new TextEncoder().encode(env.SECRETO_SITIO),
        { audience: "ciudad-publica", algorithms: ["HS256"] },
      ));
    } catch {
      throw new ErrorHttp(
        400,
        "La selección venció. Busca de nuevo la ciudad.",
      );
    }
    const { ciudad, pais, latitud, longitud } = payload;
    if (
      typeof ciudad !== "string" ||
      typeof pais !== "string" ||
      typeof latitud !== "number" ||
      typeof longitud !== "number"
    )
      throw new ErrorHttp(400, "Ciudad inválida.");
    const fecha = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Caracas",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await env.DATOS.prepare(
      "INSERT INTO ubicacion_publica(id,ciudad,pais,latitud,longitud,fecha_publicacion,visible) VALUES(1,?,?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET ciudad=excluded.ciudad,pais=excluded.pais,latitud=excluded.latitud,longitud=excluded.longitud,fecha_publicacion=excluded.fecha_publicacion,visible=1,revision=revision+1",
    )
      .bind(ciudad, pais, latitud, longitud, fecha)
      .run();
    return json({ mensaje: "La ciudad elegida está publicada." });
  } catch (e) {
    return responderError(e);
  }
};
