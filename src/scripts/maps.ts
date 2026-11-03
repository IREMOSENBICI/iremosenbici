import "leaflet/dist/leaflet.css";
import type { DatosMapa, FotoMapa } from "../lib/types";

export function tarjetaFoto(foto: FotoMapa) {
  const tarjeta = document.createElement("a");
  tarjeta.className = "mapa-foto";
  tarjeta.href = `/fotografias/${encodeURIComponent(foto.id)}`;
  const imagen = document.createElement("img");
  imagen.src = `/media/${encodeURIComponent(foto.id)}?mini=1`;
  imagen.alt = foto.alternativa;
  imagen.width = 200;
  imagen.height = 125;
  imagen.loading = "lazy";
  const titulo = document.createElement("strong");
  titulo.textContent = foto.titulo;
  const tipo = document.createElement("span");
  tipo.textContent =
    foto.tipo === "panorama_360" ? "Abrir foto 360°" : "Abrir fotografía";
  tarjeta.appendChild(imagen);
  tarjeta.appendChild(titulo);
  tarjeta.appendChild(tipo);
  return tarjeta;
}

async function mapaLeaflet(
  canvas: HTMLElement,
  datos: DatosMapa,
  status: HTMLElement,
) {
  if (!datos.teselas)
    throw new Error("El mapa no está disponible en este momento.");
  const L = await import("leaflet");
  const mapa = L.map(canvas, { scrollWheelZoom: false }).setView([10, -75], 4);
  const capa = L.tileLayer(datos.teselas, {
    maxZoom: 18,
    attribution:
      '© <a href="https://www.geoapify.com/">Geoapify</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);
  capa.on("tileerror", () => {
    status.textContent =
      "No se pudo cargar parte de la cartografía. Intenta recargar la página.";
  });
  const limites = L.latLngBounds([]);
  for (const etapa of datos.etapas) {
    const ruta = L.geoJSON(etapa.ruta, {
      style: { color: "#397047", weight: 4 },
    }).addTo(mapa);
    const titulo = document.createElement("span");
    titulo.textContent = etapa.titulo;
    ruta.bindPopup(titulo);
    if (ruta.getBounds().isValid()) limites.extend(ruta.getBounds());
  }
  for (const foto of datos.fotos) {
    const icono = L.divIcon({
      className: "mapa-marcador",
      html:
        foto.tipo === "panorama_360"
          ? "<span>360°</span>"
          : '<span aria-hidden="true">📷</span>',
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });
    L.marker([foto.latitud, foto.longitud], {
      icon: icono,
      title: foto.titulo,
      alt: foto.titulo,
    })
      .addTo(mapa)
      .bindPopup(tarjetaFoto(foto));
    limites.extend([foto.latitud, foto.longitud]);
  }
  if (datos.ciudad) {
    const p = datos.ciudad;
    const texto = document.createElement("span");
    texto.textContent = `${p.ciudad}, ${p.pais}`;
    L.circleMarker([p.latitud, p.longitud], {
      radius: 9,
      color: "#20281f",
      fillColor: "#ffff00",
      fillOpacity: 1,
    })
      .addTo(mapa)
      .bindPopup(texto);
    limites.extend([p.latitud, p.longitud]);
  }
  const centrar = () =>
    limites.isValid()
      ? mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 16 })
      : mapa.setView([10, -75], 4);
  centrar();
  new ResizeObserver(() => mapa.invalidateSize()).observe(canvas);
  return { centrar };
}

export function iniciarMapas() {
  let datosGenerales: Promise<DatosMapa> | undefined;
  document.querySelectorAll<HTMLElement>(".map-widget").forEach((widget) => {
    const boton = widget.querySelector<HTMLButtonElement>(".abrir-mapa")!;
    const canvas = widget.querySelector<HTMLElement>(".map-canvas")!;
    const status = widget.querySelector<HTMLElement>(".map-status")!;
    const centrar = widget.querySelector<HTMLButtonElement>(".centrar-mapa")!;
    let iniciado = false;
    const abrir = async () => {
      if (iniciado) return;
      iniciado = true;
      boton.disabled = true;
      status.textContent = "Cargando el mapa…";
      try {
        const pedir = async () => {
          const r = await fetch(
            `/api/mapa?${new URLSearchParams(widget.dataset.viaje ? { viaje: widget.dataset.viaje } : {})}`,
          );
          if (!r.ok)
            throw new Error("No se pudo cargar el mapa. Inténtalo de nuevo.");
          return (await r.json()) as DatosMapa;
        };
        const datos = await (widget.dataset.viaje
          ? pedir()
          : (datosGenerales ??= pedir()));
        canvas.hidden = false;
        const control =
          datos.proveedor === "google"
            ? await (await import("./maps-google")).mapaGoogle(canvas, datos)
            : await mapaLeaflet(canvas, datos, status);
        centrar.hidden = false;
        centrar.addEventListener("click", () => control.centrar());
        boton.hidden = true;
        status.textContent =
          datos.etapas.length || datos.fotos.length
            ? `${datos.etapas.length} rutas · ${datos.fotos.length} fotografías en el mapa`
            : "";
      } catch (e) {
        status.textContent = (e as Error).message;
        boton.disabled = false;
        boton.textContent = "Volver a cargar el mapa";
        iniciado = false;
        datosGenerales = undefined;
      }
    };
    boton.addEventListener("click", () => void abrir());
    if (widget.dataset.automatico === "true") {
      const observador = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((e) => e.isIntersecting)) {
            observador.disconnect();
            void abrir();
          }
        },
        { rootMargin: "250px" },
      );
      observador.observe(widget);
    }
  });
}
