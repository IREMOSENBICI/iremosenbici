import { useEffect, useRef, useState } from "react";
import type { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";
export default function PanoramaCalibration({
  id,
  norte,
  onChange,
}: {
  id: string;
  norte: number | null;
  onChange: (valor: number | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState("");
  const nodo = useRef<HTMLDivElement>(null);
  const visor = useRef<Viewer | null>(null);
  useEffect(() => {
    if (!abierto || !nodo.current) return;
    let vivo = true;
    void import("@photo-sphere-viewer/core")
      .then(({ Viewer }) => {
        if (!vivo || !nodo.current) return;
        visor.current = new Viewer({
          container: nodo.current,
          panorama: `/api/admin/fotos?id=${id}&completa=1`,
          defaultYaw: `${norte || 0}deg`,
          navbar: ["zoom", "move", "fullscreen"],
          keyboard: "fullscreen",
          touchmoveTwoFingers: true,
          lang: {
            loading: "Abriendo imagen…",
            loadError: "No se pudo abrir la panorámica.",
          },
        });
      })
      .catch(() => setEstado("No se pudo abrir el visor en este dispositivo."));
    return () => {
      vivo = false;
      visor.current?.destroy();
      visor.current = null;
    };
  }, [abierto, id]);
  return (
    <section className="route-editor">
      <h3>Orientación de la foto 360</h3>
      <p className="admin-help">
        Si conoces el norte del lugar, abre el visor y coloca esa dirección en
        el centro. Esto calibra la imagen sin guardar coordenadas GPS. Si no lo
        sabes, deja la orientación sin calibrar.
      </p>
      <p>
        {norte === null
          ? "Norte sin calibrar."
          : `Norte marcado a ${norte.toFixed(1)}° dentro de la imagen.`}
      </p>
      {!abierto ? (
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setAbierto(true)}
        >
          Abrir vista de calibración
        </button>
      ) : (
        <>
          <div
            ref={nodo}
            className="panorama-calibracion"
            aria-label="Vista para marcar el norte de la fotografía"
          />
          <div className="button-row">
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                if (visor.current) {
                  onChange(
                    Number(
                      (
                        ((visor.current.getPosition().yaw * 180) / Math.PI +
                          360) %
                        360
                      ).toFixed(3),
                    ) % 360,
                  );
                  setEstado(
                    "Norte marcado. Guarda los cambios de la fotografía.",
                  );
                }
              }}
            >
              Esta dirección es el norte
            </button>
            <button
              className="danger-link"
              type="button"
              onClick={() => onChange(null)}
            >
              Quitar calibración
            </button>
          </div>
        </>
      )}
      <p role="status">{estado}</p>
    </section>
  );
}
