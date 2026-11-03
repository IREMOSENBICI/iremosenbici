import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { RutaSegura } from "./types";
const lista = <T>(valor: T | T[] | undefined): T[] =>
  valor === undefined ? [] : Array.isArray(valor) ? valor : [valor];
export function limpiarRuta(valor: unknown): RutaSegura {
  if (
    !valor ||
    typeof valor !== "object" ||
    (valor as any).type !== "FeatureCollection" ||
    !Array.isArray((valor as any).features)
  )
    throw new Error("El recorrido debe ser una colección de líneas.");
  let puntos = 0;
  const features = (valor as any).features.map((f: any) => {
    if (
      f?.type !== "Feature" ||
      f.geometry?.type !== "LineString" ||
      !Array.isArray(f.geometry.coordinates) ||
      f.geometry.coordinates.length < 2
    )
      throw new Error("Cada segmento necesita al menos dos puntos.");
    const coordinates = f.geometry.coordinates.map((p: unknown) => {
      if (
        !Array.isArray(p) ||
        p.length < 2 ||
        !Number.isFinite(p[0]) ||
        !Number.isFinite(p[1]) ||
        Math.abs(p[0]) > 180 ||
        Math.abs(p[1]) > 90
      )
        throw new Error("Hay coordenadas inválidas.");
      if (++puntos > 10000)
        throw new Error(
          "El recorrido supera 10.000 puntos. Reduce el archivo antes de importarlo.",
        );
      return [Number(p[0].toFixed(6)), Number(p[1].toFixed(6))] as [
        number,
        number,
      ];
    });
    return {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates },
    };
  });
  if (features.length < 1 || features.length > 200)
    throw new Error("El recorrido debe contener entre 1 y 200 segmentos.");
  return { type: "FeatureCollection", features };
}
export function importarRuta(xml: string): RutaSegura {
  if (new TextEncoder().encode(xml).length > 5 * 1024 * 1024)
    throw new Error("El archivo no puede superar 5 MB.");
  if (/<!DOCTYPE|<!ENTITY|<\s*(?:\w+:)?NetworkLink\b/i.test(xml))
    throw new Error(
      "No se admiten entidades ni enlaces externos en el archivo.",
    );
  // El validador incluido funciona en navegador; fast-xml-validator requiere Buffer de Node.
  if (XMLValidator.validate(xml) !== true) {
    throw new Error("El archivo XML no es válido.");
  }
  const doc = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    processEntities: false,
  }).parse(xml);
  const lineas: [number, number][][] = [];
  if (doc.gpx) {
    for (const pista of lista<any>(doc.gpx.trk))
      for (const segmento of lista<any>(pista.trkseg))
        lineas.push(
          lista<any>(segmento.trkpt).map((p) => [
            Number(p["@_lon"]),
            Number(p["@_lat"]),
          ]),
        );
    for (const ruta of lista<any>(doc.gpx.rte))
      lineas.push(
        lista<any>(ruta.rtept).map((p) => [
          Number(p["@_lon"]),
          Number(p["@_lat"]),
        ]),
      );
  } else if (doc.kml) {
    const visitar = (n: any, profundidad = 0) => {
      if (profundidad > 30)
        throw new Error("El archivo tiene demasiados niveles.");
      if (!n || typeof n !== "object") return;
      for (const l of lista<any>(n.LineString)) {
        const texto =
          typeof l.coordinates === "string"
            ? l.coordinates
            : String(l.coordinates ?? "");
        lineas.push(
          texto
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((p: string) => {
              const [lon, lat] = p.split(",");
              return [Number(lon), Number(lat)];
            }),
        );
      }
      for (const [k, v] of Object.entries(n))
        if (["Document", "Folder", "Placemark", "MultiGeometry"].includes(k))
          for (const item of lista(v)) visitar(item, profundidad + 1);
    };
    visitar(doc.kml);
  } else throw new Error("Selecciona un archivo GPX o KML.");
  return limpiarRuta({
    type: "FeatureCollection",
    features: lineas
      .filter((p) => p.length >= 2)
      .map((coordinates) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates },
      })),
  });
}
export function recortarRuta(
  ruta: RutaSegura,
  inicio: number,
  final: number,
  excluidos: number[] = [],
): RutaSegura | null {
  const features = ruta.features
    .filter((_, i) => !excluidos.includes(i))
    .map((f) => {
      const n = f.geometry.coordinates.length;
      const desde = Math.floor((n * Math.max(0, inicio)) / 100);
      const hasta = n - Math.floor((n * Math.max(0, final)) / 100);
      return {
        ...f,
        geometry: {
          ...f.geometry,
          coordinates: f.geometry.coordinates.slice(desde, hasta),
        },
      };
    })
    .filter((f) => f.geometry.coordinates.length >= 2);
  return features.length
    ? limpiarRuta({ type: "FeatureCollection", features })
    : null;
}
