# Iremosenbici

Web de cicloturismo en Astro, TypeScript y CSS. React se carga en el panel privado; Leaflet se usa para revisar la geometría de rutas y Photo Sphere Viewer para fotografías 360. Los mapas públicos se incrustan desde Google My Maps. Conserva las piezas originales del logo, los ciclistas del pie y el contenido real del proyecto.

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

El panel local está en http://127.0.0.1:4321/admin. El bypass local exige simultáneamente modo desarrollo, hostname local y la variable explícita; no funciona en un build publicado. `node scripts/verificar-fotos-local.mjs` comprueba el procesamiento real, conservación exacta del original y GPS, publicación en el mapa, retirada y CSRF contra ese servidor local. Genera una imagen sintética y la deja como borrador.

## Administración desde el móvil

- Entrar en `/admin` con `iremosenbici@gmail.com` y el código de Cloudflare Access. No hay contraseña propia del sitio.
- **Mis mapas:** enlaces para editar MAPA-RUTA y Contactanos en Google My Maps con la cuenta propietaria. Sus cambios se ven al recargar la web; no se solicita GPS al navegador.
- **Viajes:** crear el título, dirección estable, resumen y relato. Guardar como borrador o publicado. Mantener la dirección de un viaje que ya se haya compartido.
- **Etapas y rutas:** elegir viaje, ciudad y estado. Importar GPX/KML, revisar las líneas en una vista sin cartografía, excluir segmentos o recortar extremos. Un trazado solo puede publicarse con etapa completada y revisión marcada. Los borradores no son visibles para visitantes. Este archivo local no se sincroniza con My Maps: importar allí el GPX/KML elegido para mostrarlo en el mapa público.
- **Fotografías:** subir JPG, PNG o WebP de hasta 10 MB y 40 megapíxeles. Se conserva el original íntegro (incluidos EXIF/GPS/XMP) en R2 y se generan dos copias WebP para visualizar. La lectura de GPS compatible rellena latitud/longitud sin redondear; si faltan o el formato de metadatos no se reconoce, pueden introducirse en el panel. El original puede descargarse desde el editor. Publicar una foto la muestra en la galería; guardar como borrador la retira de la web y bloquea las copias públicas. Sus coordenadas quedan disponibles para futuras integraciones, pero no se sincronizan automáticamente con Google My Maps. Los marcadores o fotos añadidos a My Maps se administran allí de forma independiente. Las fotos subidas antes de este cambio no pueden recuperar metadatos ya descartados: deben volver a subirse desde el original si se desean conservar.

## MAPA-RUTA y Google My Maps sin facturación

La sección principal `/#mapa-ruta` sustituye Rutas e incrusta el Google My Maps original Venezuela–Costa Rica. Contactanos incrusta su mapa original independiente («Esta zona»). Ambos cargan automáticamente al acercarse a la sección y conservan su base satelital guardada en My Maps. El botón **Ver Ruta** abre el recorrido completo en Google. No se cambia ni se afirma una nueva ubicación: se muestra el contenido que ya tenía el mapa original. La antigua página `/viajes/venezuela-costa-rica` y sus enlaces heredados redirigen a la sección; se excluye del sitemap sin borrar los datos del viaje.

Los identificadores y enlaces están centralizados en `src/lib/maps.ts`. Se reutilizan los mapas públicos de la web clásica. Para cambiar de mapa, sustituir su identificador allí y comprobar la vista sin iniciar sesión. La cuenta propietaria gestiona sus capas, rutas, fotografías, marcadores y mapa base en My Maps. Para ver satélite por defecto, guardar **Mapa base → Satélite** en el editor de Google. El iframe respeta esa selección; no fuerza parámetros no documentados ni oculta los controles o atribuciones de Google.

No se utiliza Geoapify ni Google Maps Platform. Se retiraron sus llamadas, el proxy de teselas, el buscador de ciudades y el adaptador de Maps JavaScript API. No hacen falta claves de Google, proyecto Cloud ni cuenta de facturación. My Maps se integra mediante su opción **Insertar en mi sitio** y exige que el mapa sea público. La CSP permite el iframe de `https://www.google.com`, sin añadir scripts de Google al documento principal. Cualquier secreto antiguo de Geoapify que permanezca en el entorno queda sin uso; no se ha cancelado ni modificado la cuenta externa.

Los originales, coordenadas, trazados y visor 360 se conservan en Cloudflare. `/api/mapa` mantiene los datos públicos filtrados, los enlaces a My Maps y `sincronizacion_automatica: false`, sin claves. **Publicar una foto o etapa en el panel no la añade automáticamente a My Maps.** Hay que importarla o crear su marcador en Google; una foto 360 puede enlazarse a `/fotografias/ID` para abrir el visor de la web. Vídeos, interactividad de ubicación desde el panel y sincronización automática siguen pendientes. No se ha publicado contenido en Google Maps/Street View ni modificado los mapas de la cuenta.

- **Archivo heredado:** referencias históricas y mapas recuperados. Las rutas recuperadas se conservan como etapas privadas; no representan recorridos ya realizados. Los tramos largos están divididos, conservando un punto compartido y sin inventar geometría.

Se almacenan los originales de las nuevas fotografías con sus metadatos y pueden descargarse desde el panel privado. Conviene conservar también los archivos maestros de la cámara en un respaldo personal. Retirar una publicación no borra copias que alguien haya descargado antes.

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

| Entorno    | Worker               | D1                   | R2                         |
| ---------- | -------------------- | -------------------- | -------------------------- |
| Pruebas    | iremosenbici-pruebas | iremosenbici-pruebas | iremosenbici-fotos-pruebas |
| Producción | iremosenbici         | iremosenbici         | iremosenbici-fotos         |

Secretos utilizados por ambos Workers: `RESEND_API_KEY`, `SECRETO_SITIO`. Nunca poner valores en Git, HTML ni JavaScript cliente. La clave Resend tiene únicamente permiso de envío para `notificaciones.iremosenbici.com`. `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD` son identificadores públicos; el servidor valida firma, audiencia, emisor, caducidad y correo del JWT.

Access protege todo `pruebas.iremosenbici.com` y `/admin*` y `/api/admin/*` del dominio principal. La política permite únicamente el correo administrador con PIN. `workers.dev` y las URLs de previsualización están desactivados. Mantener desactivada la redirección inmediata de cookies mientras los dominios tengan alojamientos distintos.

Por decisión del propietario se mantiene **Workers Free**: no se ha contratado Workers Paid. Los límites gratuitos pueden detener peticiones si se superan. Images Free tiene una cuota de transformaciones; la aplicación guarda las copias procesadas para no repetir el trabajo con cada visita. R2 tiene facturación por exceso de las cuotas autorizadas; el objetivo de presupuesto no equivale a un límite automático. Resend usa su plan gratuito. Google My Maps no requiere activar facturación. No ampliar ningún plan automáticamente.

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
