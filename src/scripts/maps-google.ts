/// <reference types="google.maps" />
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { DatosMapa } from "../lib/types";
import { tarjetaFoto } from "./maps";

let configurado = false;

/** Adaptador preparado; solo se carga al elegir Google explícitamente en el servidor. */
export async function mapaGoogle(canvas: HTMLElement, datos: DatosMapa) {
  if (!datos.google?.clave)
    throw new Error("Google Maps está pendiente de configurar.");
  if (!configurado) {
    setOptions({ key: datos.google.clave, v: "quarterly", language: "es" });
    configurado = true;
  }
  const { Map, InfoWindow } = (await importLibrary(
    "maps",
  )) as google.maps.MapsLibrary;
  const mapa = new Map(canvas, {
    center: { lat: 10, lng: -75 },
    zoom: 4,
    mapTypeId: "hybrid",
    gestureHandling: "cooperative",
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
  });
  const limites = new google.maps.LatLngBounds();
  const ventana = new InfoWindow();
  for (const etapa of datos.etapas) {
    for (const feature of mapa.data.addGeoJson(etapa.ruta)) {
      feature.setProperty("titulo", etapa.titulo);
      feature.getGeometry()?.forEachLatLng((p) => limites.extend(p));
    }
  }
  for (const foto of datos.fotos) {
    const position = { lat: foto.latitud, lng: foto.longitud };
    mapa.data.add({
      id: foto.id,
      geometry: new google.maps.Data.Point(position),
      properties: { foto: foto.id, titulo: foto.titulo },
    });
    limites.extend(position);
  }
  if (datos.ciudad) {
    const position = { lat: datos.ciudad.latitud, lng: datos.ciudad.longitud };
    mapa.data.add({
      geometry: new google.maps.Data.Point(position),
      properties: { titulo: `${datos.ciudad.ciudad}, ${datos.ciudad.pais}` },
    });
    limites.extend(position);
  }
  mapa.data.setStyle((f) => ({
    strokeColor: "#ffff00",
    strokeWeight: 4,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: f.getProperty("foto") ? 10 : 7,
      fillColor: "#ffff00",
      fillOpacity: 1,
      strokeColor: "#263d2e",
      strokeWeight: 2,
    },
    title: String(f.getProperty("titulo") || ""),
  }));
  mapa.data.addListener("click", (evento: google.maps.Data.MouseEvent) => {
    const foto = datos.fotos.find(
      (f) => f.id === evento.feature.getProperty("foto"),
    );
    const texto = document.createElement("span");
    texto.textContent = String(evento.feature.getProperty("titulo") || "");
    ventana.setContent(foto ? tarjetaFoto(foto) : texto);
    ventana.setPosition(evento.latLng);
    ventana.open({ map: mapa });
  });
  const centrar = () => {
    if (limites.isEmpty()) {
      mapa.setCenter({ lat: 10, lng: -75 });
      mapa.setZoom(4);
      return;
    }
    mapa.fitBounds(limites, 40);
    google.maps.event.addListenerOnce(mapa, "idle", () => {
      if ((mapa.getZoom() || 0) > 16) mapa.setZoom(16);
    });
  };
  centrar();
  return { centrar };
}
