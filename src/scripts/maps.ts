import "leaflet/dist/leaflet.css";
import type { CiudadPublica, RutaSegura } from "../lib/types";
import { paisesPlanificados } from "../data/site";
export function iniciarMapas() {
  document.querySelectorAll<HTMLElement>(".map-widget").forEach((widget) => {
    const boton = widget.querySelector<HTMLButtonElement>(".abrir-mapa")!;
    const canvas = widget.querySelector<HTMLElement>(".map-canvas")!;
    const status = widget.querySelector<HTMLElement>(".map-status")!;
    boton.addEventListener("click", async () => {
      boton.disabled = true;
      status.textContent = "Cargando el mapa…";
      try {
        const response = await fetch(
          `/api/mapa?${new URLSearchParams(widget.dataset.viaje ? { viaje: widget.dataset.viaje } : {})}`,
        );
        if (!response.ok)
          throw new Error(
            "No pudimos cargar el mapa. Las etapas siguen disponibles en esta página.",
          );
        const datos = (await response.json()) as {
          teselas: string | null;
          etapas: { titulo: string; ruta: RutaSegura | null }[];
          ciudad: CiudadPublica | null;
        };
        if (!datos.teselas)
          throw new Error(
            "El mapa está temporalmente fuera de servicio. Puedes consultar las ciudades y etapas en esta página.",
          );
        const L = await import("leaflet");
        canvas.hidden = false;
        const mapa = L.map(canvas, { scrollWheelZoom: false }).setView(
          [10, -75],
          4,
        );
        const capa = L.tileLayer(datos.teselas, {
          maxZoom: 18,
          attribution:
            '© <a href="https://www.geoapify.com/">Geoapify</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapa);
        capa.on("tileerror", () => {
          status.textContent =
            "La cartografía no pudo cargarse. Las fichas de las etapas siguen disponibles.";
        });
        const limites: L.LatLngExpression[] = [];
        if (widget.dataset.viaje === "venezuela-costa-rica") {
          const puntos = paisesPlanificados.map(
            (p) => [p.lat, p.lon] as L.LatLngTuple,
          );
          L.polyline(puntos, { color: "#71796b", dashArray: "5 9", weight: 2 })
            .addTo(mapa)
            .bindTooltip(
              "Conexión orientativa entre ciudades del proyecto; no es un trazado navegable.",
            );
          paisesPlanificados.forEach((p) => {
            const texto = document.createElement("span");
            texto.textContent = `${p.ciudad}, ${p.nombre} · Itinerario planificado`;
            L.circleMarker([p.lat, p.lon], {
              radius: 7,
              color: "#263d2e",
              fillColor: "#e8ee66",
              fillOpacity: 1,
            })
              .addTo(mapa)
              .bindPopup(texto);
          });
          limites.push(...puntos);
        }
        for (const etapa of datos.etapas || [])
          if (etapa.ruta) {
            const ruta = L.geoJSON(etapa.ruta, {
              style: { color: "#397047", weight: 4 },
            }).addTo(mapa);
            const texto = document.createElement("span");
            texto.textContent = etapa.titulo;
            ruta.bindPopup(texto);
            limites.push(
              ruta.getBounds().getSouthWest(),
              ruta.getBounds().getNorthEast(),
            );
          }
        if (datos.ciudad) {
          const p = datos.ciudad;
          const texto = document.createElement("span");
          texto.textContent = `Última ciudad compartida: ${p.ciudad}, ${p.pais}. Ubicación aproximada.`;
          L.circleMarker([p.latitud, p.longitud], {
            radius: 11,
            color: "#20281f",
            weight: 3,
            fillColor: "#e8ee66",
            fillOpacity: 1,
          })
            .addTo(mapa)
            .bindPopup(texto);
          limites.push([p.latitud, p.longitud]);
        }
        if (limites.length)
          mapa.fitBounds(L.latLngBounds(limites), {
            padding: [35, 35],
            maxZoom: 10,
          });
        status.textContent = datos.etapas?.some((e) => e.ruta)
          ? "Se muestran únicamente trazados publicados de etapas completadas."
          : "Los puntos representan ciudades. Las conexiones son orientativas y no indican pasos realizados.";
        boton.textContent = "Mapa abierto";
      } catch (e) {
        status.textContent = (e as Error).message;
        boton.disabled = false;
      }
    });
  });
}
