import type { Entorno } from "../lib/types";
import { contactoSchema } from "../lib/validation";
import { cuerpo, ErrorHttp, json, responderError } from "../lib/http";
export async function enviarContacto(request: Request, env: Entorno) {
  try {
    const dato = contactoSchema.parse(await cuerpo(request, 10000));
    if (dato.empresa)
      throw new ErrorHttp(400, "No pudimos validar el formulario.");
    if (!env.RESEND_API_KEY)
      throw new ErrorHttp(
        503,
        "El formulario no está disponible ahora. Puedes escribir a iremosenbici@gmail.com.",
      );
    const hora = Math.floor(Date.now() / 3600000);
    const origen = request.headers.get("CF-Connecting-IP") || "local";
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(
        `${env.SECRETO_SITIO || "contacto"}:${origen}:${hora}`,
      ),
    );
    const clave = Array.from(new Uint8Array(hash), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const contador = await env.DATOS.prepare(
      "INSERT INTO limites_contacto(clave,cantidad,vence) VALUES(?,1,?) ON CONFLICT(clave) DO UPDATE SET cantidad=cantidad+1 RETURNING cantidad",
    )
      .bind(clave, (hora + 1) * 3600)
      .first<{ cantidad: number }>();
    if (!contador || contador.cantidad > 3)
      throw new ErrorHttp(
        429,
        "Has enviado varios mensajes. Espera una hora antes de volver a intentarlo.",
      );
    await env.DATOS.prepare("DELETE FROM limites_contacto WHERE vence < ?")
      .bind(hora * 3600)
      .run();
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contacto-${dato.solicitud}`,
      },
      body: JSON.stringify({
        from: env.CORREO_REMITENTE,
        to: [env.CORREO_DESTINO],
        reply_to: dato.email,
        subject: `[Iremosenbici] ${dato.asunto}`,
        text: `Nombre: ${dato.nombre}\nCorreo: ${dato.email}\n\n${dato.mensaje}`,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!respuesta.ok)
      throw new ErrorHttp(
        502,
        "El servicio de correo no aceptó el mensaje. Conservamos tu texto para que puedas reintentarlo.",
      );
    const envio = (await respuesta.json()) as { id?: string };
    if (!envio.id)
      throw new ErrorHttp(
        502,
        "No se pudo confirmar el envío. Inténtalo de nuevo.",
      );
    return json({
      mensaje: "¡Gracias por escribir! Tu mensaje ha sido enviado.",
    });
  } catch (error) {
    return responderError(error);
  }
}
