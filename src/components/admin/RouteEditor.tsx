import { useEffect, useRef, useState } from "react";
import { importarRuta, limpiarRuta, recortarRuta } from "../../lib/routes";
import type { RutaSegura } from "../../lib/types";
import "leaflet/dist/leaflet.css";

export function RoutePreview({ ruta }: { ruta: RutaSegura | null }) {
  const contenedor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ruta || !contenedor.current) return;
    let vivo = true;
    let mapa: import("leaflet").Map | undefined;
    void import("leaflet").then((L) => {
      if (!vivo || !contenedor.current) return;
      mapa = L.map(contenedor.current, { scrollWheelZoom: false });
      L.tileLayer("/api/teselas/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.geoapify.com/">Geoapify</a>',
      }).addTo(mapa);
      const capa = L.geoJSON(ruta, {
        style: { color: "#9a4d00", weight: 4 },
      }).addTo(mapa);
      mapa.fitBounds(capa.getBounds(), { padding: [25, 25], maxZoom: 14 });
      ruta.features.forEach((f) => {
        const puntos = f.geometry.coordinates;
        [puntos[0], puntos[puntos.length - 1]].forEach((p, i) =>
          L.circleMarker([p[1], p[0]], {
            radius: 6,
            color: i ? "#983223" : "#355d2c",
            fillOpacity: 1,
          })
            .bindTooltip(i ? "Final del segmento" : "Inicio del segmento")
            .addTo(mapa!),
        );
      });
    });
    return () => {
      vivo = false;
      mapa?.remove();
    };
  }, [ruta]);
  return ruta ? (
    <div
      ref={contenedor}
      className="route-preview"
      role="region"
      aria-label="Vista previa del recorrido depurado"
    />
  ) : (
    <div className="route-preview-empty">
      No hay trazado seleccionado. Las etapas también pueden publicarse solo con
      su descripción.
    </div>
  );
}

export default function RouteEditor({
  ruta,
  revisada,
  onChange,
}: {
  ruta: RutaSegura | null;
  revisada: boolean;
  onChange: (ruta: RutaSegura | null, revisada: boolean) => void;
}) {
  const [base, setBase] = useState(ruta);
  const [recortes, setRecortes] = useState<
    { inicio: number; final: number; oculto: boolean }[]
  >(ruta?.features.map(() => ({ inicio: 0, final: 0, oculto: false })) || []);
  const [error, setError] = useState("");
  async function importar(archivo?: File) {
    if (!archivo) return;
    try {
      if (archivo.size > 5 * 1024 * 1024)
        throw new Error("El archivo no puede superar 5 MB.");
      const nueva = importarRuta(await archivo.text());
      setBase(nueva);
      setRecortes(
        nueva.features.map(() => ({ inicio: 0, final: 0, oculto: false })),
      );
      onChange(nueva, false);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function recortar(i: number, cambio: Partial<(typeof recortes)[number]>) {
    const ajustes = recortes.map((r, j) => (j === i ? { ...r, ...cambio } : r));
    setRecortes(ajustes);
    if (!base) return;
    const features = base.features.flatMap((f, j) =>
      ajustes[j].oculto
        ? []
        : recortarRuta(
            { type: "FeatureCollection", features: [f] },
            ajustes[j].inicio,
            ajustes[j].final,
          )?.features || [],
    );
    onChange(
      features.length
        ? limpiarRuta({ type: "FeatureCollection", features })
        : null,
      false,
    );
  }
  return (
    <section
      className="route-editor"
      aria-label="Importación y privacidad del recorrido"
    >
      <h3>Recorrido de la etapa</h3>
      <p className="admin-help">
        Importa un GPX o KML. Solo se conservarán líneas: se descartan horas,
        elevación, nombres de puntos y referencias externas. Revisa alojamientos
        y lugares sensibles antes de publicar.
      </p>
      <label>
        Archivo GPX o KML
        <input
          type="file"
          accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml"
          onChange={(e) => void importar(e.target.files?.[0])}
        />
      </label>
      {error && (
        <p role="alert" className="admin-status error">
          {error}
        </p>
      )}
      <RoutePreview ruta={ruta} />
      {base && (
        <>
          <p className="admin-help">
            La vista previa muestra exactamente las líneas que se guardarán. Si
            falla el fondo cartográfico, las líneas siguen visibles. Verde:
            inicio; rojo: final.
          </p>
          {recortes.map((r, i) => (
            <div className="segment-editor" key={i}>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={r.oculto}
                  onChange={(e) => recortar(i, { oculto: e.target.checked })}
                />
                Retirar segmento {i + 1} (
                {base.features[i].geometry.coordinates.length} puntos)
              </label>
              {!r.oculto && (
                <div className="form-two">
                  <label>
                    Recortar inicio: {r.inicio}%
                    <input
                      type="range"
                      min="0"
                      max="95"
                      step="1"
                      value={r.inicio}
                      onChange={(e) =>
                        recortar(i, { inicio: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Recortar final: {r.final}%
                    <input
                      type="range"
                      min="0"
                      max="95"
                      step="1"
                      value={r.final}
                      onChange={(e) =>
                        recortar(i, { final: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            className="danger-link"
            onClick={() => {
              setBase(null);
              setRecortes([]);
              onChange(null, false);
            }}
          >
            Retirar todo el trazado
          </button>
        </>
      )}
      {ruta && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={revisada}
            onChange={(e) => onChange(ruta, e.target.checked)}
          />
          He revisado este trazado y he retirado los lugares sensibles. Solo
          publicaré la ruta cuando la etapa esté completada.
        </label>
      )}
    </section>
  );
}
