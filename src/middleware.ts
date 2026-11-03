import { defineMiddleware } from "astro:middleware";
import { entorno } from "./server/env";
import { verificarAcceso, mismoOrigen } from "./server/auth";
import { json } from "./lib/http";
const antiguas: Record<string, string> = {
  "/index.html": "/",
  "/ruta-venezuela-costarica.html": "/#mapa-ruta",
  "/viajes/venezuela-costa-rica": "/#mapa-ruta",
  "/viajes/venezuela-costa-rica/": "/#mapa-ruta",
  "/menu.html": "/",
  "/menu-rutas.html": "/#mapa-ruta",
  "/somos.html": "/#quienes",
  "/hacemos.html": "/#hacemos",
  "/rutas.html": "/#mapa-ruta",
  "/galeria.html": "/#galeria",
  "/patrocinantes.html": "/#patrocinantes",
  "/donaciones.html": "/#donaciones",
  "/contactenos.html": "/#contact",
  "/footer.html": "/#footer",
  "/rutas/mapa-vene-costa.html": "/#mapa-ruta",
  "/rutas/fotos-vene-costa.html": "/#galeria",
  "/rutas/recomienda-vene-costa.html": "/#mapa-ruta",
  "/rutas/agradecemos-vene-costa.html": "/#patrocinantes",
};
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!mismoOrigen(context.request))
    return json({ error: "Origen de solicitud no permitido." }, 403);
  const privado =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/");
  const pruebaProtegida =
    entorno.ENTORNO !== "produccion" && !import.meta.env.DEV;
  if (privado || pruebaProtegida) {
    const identidad = await verificarAcceso(
      context.request,
      entorno,
      import.meta.env.DEV,
    );
    if (!identidad)
      return pathname.startsWith("/api/")
        ? json(
            { error: "Necesitas iniciar sesión con la cuenta administradora." },
            401,
          )
        : new Response(
            '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Acceso privado · Iremosenbici</title><body><h1>Área privada de Iremosenbici</h1><p>Accede desde el dominio protegido con tu cuenta administradora.</p><a href="/">Volver a la web</a></body></html>',
            {
              status: 401,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
              },
            },
          );
    context.locals.administrador = identidad;
  }
  if (antiguas[pathname] && context.request.method === "GET")
    return context.redirect(antiguas[pathname], 301);
  const response = await next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(),camera=(),microphone=(),accelerometer=(self),gyroscope=(self),magnetometer=(self)",
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-src https://www.instagram.com https://snapwidget.com https://www.google.com; worker-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  response.headers.set("Cache-Control", "no-store");
  if (privado || entorno.ENTORNO !== "produccion")
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
});
