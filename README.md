# Iremosenbici

Web de cicloturismo en Astro, TypeScript y CSS. React se carga en el panel privado; Leaflet y el visor Photo Sphere Viewer solo cuando se abren. Conserva las piezas originales del logo, los ciclistas del pie y el contenido real del proyecto.

La portada conserva los textos y la estética del sitio clásico (`858e08c`): cabecera fija transparente, fuentes Roboto/Raleway locales, fondos originales, cuatro perfiles con transición, seis tarjetas con giro 3D y agradecimientos, donaciones y ciclistas con desvanecimiento y cambio de dirección. Los componentes están en `src/components/classic`, el contenido en `src/data/clasico.ts` y los estilos en `src/styles/clasico.css`. Las interacciones usan TypeScript, CSS y diálogos nativos, sin jQuery ni Bootstrap. La galería utiliza las fotografías publicadas desde el panel; cuando no hay fotos, muestra las tres publicaciones originales de Instagram. Sus marcos dependen de Instagram y conservan las leyendas locales. El contacto usa el teléfono +584124329567 y el icono de X.

## Desarrollo

Requiere Node 24. Ejecutar `npm ci`, copiar `.dev.vars.example` a `.dev.vars`, generar un `SECRETO_SITIO` aleatorio y activar `PERMITIR_ADMIN_LOCAL=true` únicamente en ese archivo local. Después:

```sh
npm run db:local
npm run dev
npm run check
npm test
npm run build
```

El panel local está en http://127.0.0.1:4321/admin. El bypass local exige simultáneamente modo desarrollo, hostname local y la variable explícita; no funciona en un build publicado. `node scripts/verificar-fotos-local.mjs` comprueba el procesamiento real, ausencia de metadatos, publicación, retirada y CSRF contra ese servidor local. Genera una imagen sintética y la deja como borrador.

## Administración desde el móvil

- Entrar en `/admin` con `iremosenbici@gmail.com` y el código de Cloudflare Access. No hay contraseña propia del sitio.
- **Mi ciudad:** buscar y elegir una ciudad, revisar país y publicar. Es una decisión editorial; no se solicita GPS. También puede ocultarse.
- **Viajes:** crear el título, dirección estable, resumen y relato. Guardar como borrador o publicado. Mantener la dirección de un viaje que ya se haya compartido.
- **Etapas y rutas:** elegir viaje, ciudad y estado. Importar GPX/KML, revisar el mapa, excluir segmentos o recortar extremos. Un trazado solo puede publicarse con etapa completada y revisión marcada. Los borradores no son visibles para visitantes.
- **Fotografías:** subir JPG, PNG o WebP de hasta 10 MB y 40 megapíxeles. La web procesa dos copias WebP sin metadatos antes de almacenarlas. Completar título, descripción accesible y viaje/etapa; publicar cuando corresponda. Guardar de nuevo como borrador retira el acceso público a ambas copias.
- **Archivo heredado:** referencias históricas y mapas recuperados. Las rutas recuperadas se conservan como etapas privadas; no representan recorridos ya realizados. Los tramos largos están divididos, conservando un punto compartido y sin inventar geometría.

No se almacenan originales de fotografías. Conservar los archivos maestros de la cámara en un respaldo personal. Retirar una publicación no borra copias que alguien haya descargado antes.

## Fotos 360 de Insta360

Exportar desde Insta360 Studio/app una imagen equirectangular completa 2:1, por ejemplo 8192 × 4096, sin superar 10 MB. Seleccionar **Panorámica 360** al subirla; se publica una copia de hasta 4096 px de ancho para cuidar la memoria de móviles.

En la edición se puede abrir **Vista de calibración**, apuntar hacia el norte conocido y marcar **Esta dirección es el norte**. Guardar después la fotografía. Si no se conoce el norte, dejarlo sin calibrar. Esto guarda un ángulo, nunca coordenadas GPS.

Los visitantes abren el visor voluntariamente y pueden arrastrar, usar controles, pantalla completa y **Mirar moviendo el dispositivo**. El permiso de sensores se pide al pulsar el botón. La orientación absoluta depende del navegador y del hardware; existe alineación manual mirando al norte. HTTPS es necesario. La precisión de brújula y el permiso de iOS deben comprobarse también en dispositivos físicos.

Vídeo 360 y directos quedan para una fase posterior. La estructura de páginas permite incorporar un reproductor de vídeo 360 o emisiones externas, con consentimiento de carga y presupuesto propios; esta entrega no activa servicios de streaming.

## Datos, privacidad e idiomas

D1 separa `viajes`, `etapas`, `fotos`, `ubicacion_publica`, `borradores_heredados` y límites de contacto. Consultas públicas y edición son interfaces independientes. R2 permanece privado; la descarga pública comprueba la visibilidad y la de sus padres en cada petición. Las rutas públicas contienen solo líneas y coordenadas revisadas, sin tiempos, altitudes, puntos de interés ni referencias externas.

El sitio inicial es español, con `lang=es`, direcciones canónicas y un campo de idioma en viajes. Las futuras traducciones deben tener rutas propias, textos revisados y `hreflang`; no mostrar selector hasta que existan versiones publicadas. Evitar duplicar mecánicamente rutas o ubicación privada al traducir.

## Cloudflare y secretos

La cuenta de este proyecto es `1a9b246cafcf45c527a8061e7a3590ad`. Usar siempre `npm run cf -- ...`: el wrapper aísla la sesión de Wrangler en `.wrangler/cuenta` y evita utilizar otra cuenta del equipo. Para autenticar en otro ordenador, ejecutar `npm run cf -- login` y verificar la cuenta antes de desplegar.

| Entorno | Worker | D1 | R2 |
|---|---|---|---|
| Pruebas | iremosenbici-pruebas | iremosenbici-pruebas | iremosenbici-fotos-pruebas |
| Producción | iremosenbici | iremosenbici | iremosenbici-fotos |

Secretos de ambos Workers: `GEOAPIFY_API_KEY`, `RESEND_API_KEY`, `SECRETO_SITIO`. Nunca poner valores en Git, HTML ni JavaScript cliente. La clave Resend tiene únicamente permiso de envío para `notificaciones.iremosenbici.com`. `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD` son identificadores públicos; el servidor valida firma, audiencia, emisor, caducidad y correo del JWT.

Access protege todo `pruebas.iremosenbici.com` y `/admin*` y `/api/admin/*` del dominio principal. La política permite únicamente el correo administrador con PIN. `workers.dev` y las URLs de previsualización están desactivados. Mantener desactivada la redirección inmediata de cookies mientras los dominios tengan alojamientos distintos.

Por decisión del propietario se mantiene **Workers Free**: no se ha contratado Workers Paid. Los límites gratuitos pueden detener peticiones si se superan. Images Free tiene una cuota de transformaciones; la aplicación guarda las copias procesadas para no repetir el trabajo con cada visita. R2 tiene facturación por exceso de las cuotas autorizadas; el objetivo de presupuesto no equivale a un límite automático. Geoapify y Resend usan sus planes gratuitos. No ampliar ningún plan automáticamente.

Cloudflare tiene la alerta de facturación **Iremosenbici · aviso a US$5**, enviada a `iremosenbici@gmail.com`. Es una notificación, no un bloqueo de gasto. Revisar además las cuotas propias de mapas, correo y almacenamiento.

## Despliegue y reversión

```sh
npm run cf -- d1 migrations apply DATOS --remote
npm run deploy:pruebas
npm run cf -- d1 migrations apply DATOS --env produccion --remote
npm run deploy:produccion
```

El build de producción selecciona expresamente `CLOUDFLARE_ENV=produccion`. No desplegar un build de pruebas con la bandera de producción: las vinculaciones se resuelven al compilar. Revisar siempre el nombre de Worker, D1 y R2 que imprime Wrangler. Los dominios se configuran en `wrangler.jsonc` y deben mantenerse coherentes con el panel.

La referencia recuperable de la web clásica es la rama `respaldo/sitio-clasico-2026-11-03`, commit `858e08cfb2ed1a1667ac05053c40d334f3ef2982`. GitHub Pages conserva esa rama, carpeta raíz, como respaldo. Producción se sirve mediante la ruta de Worker `www.iremosenbici.com/*`; el CNAME `www → iremosenbici.github.io` está ahora con proxy de Cloudflare. El dominio raíz mantiene su redirección a HTTPS www. SSL está en Completo (estricto), con Usar siempre HTTPS activado.

Para revertir una versión moderna, usar el historial de implementaciones del Worker. Para volver temporalmente al sitio clásico, comprobar primero que GitHub Pages sirve correctamente la rama de respaldo y retirar la ruta `www.iremosenbici.com/*` del Worker: el CNAME conserva el origen anterior. Mantener el proxy y Usar siempre HTTPS. Comprobar portada, certificado y redirección del dominio raíz. Si también se modifica `wrangler.jsonc`, registrar ese cambio antes del siguiente despliegue para no reactivar la ruta por accidente. No borrar D1, R2, Access ni el respaldo durante una reversión.

Verificación del 3 de noviembre de 2026: 22 pruebas, tipos y builds aprobados; portada, viaje y editor sin desbordamiento a 320/390/768/1024/1440 px; navegación y tarjetas con teclado; importación, publicación condicionada y retirada de etapa; una foto 360 sintética procesada en Cloudflare con copia completa y miniatura sin EXIF/XMP/IPTC; login por PIN y validación del JWT; mapa con teselas reales; correo de prueba recibido y error local que conserva el texto. La foto sintética quedó como borrador en pruebas y no existe en producción. No se publicó ninguna ciudad de ejemplo. La brújula debe comprobarse también en móviles y tablets físicos.

Las comprobaciones HTTP de producción verificaron portada, viaje, privacidad, sitemap, robots, redirecciones antiguas, rechazo de orígenes ajenos, protección del panel/API y ausencia de fotografías de prueba o rutas privadas. La CI comprueba tipos, privacidad y build; no despliega ni necesita secretos.

Los KML recuperados y su SQL se guardan fuera de Git, en `artifacts/mapas-heredados`. `scripts/preparar-mapas-heredados.mjs` genera importaciones privadas idempotentes para una base inicial. No publicar esos archivos ni ejecutar la importación para sobrescribir una edición posterior.

