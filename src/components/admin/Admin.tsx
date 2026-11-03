import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type {
  Viaje,
  Etapa,
  Foto,
  CiudadPublica,
  RutaSegura,
  Visibilidad,
} from "../../lib/types";
import { mapasPersonales } from "../../lib/maps";
import RouteEditor from "./RouteEditor";
import PanoramaCalibration from "./PanoramaCalibration";
type Contenido = {
  viajes: Viaje[];
  etapas: Etapa[];
  fotos: Foto[];
  ubicacion: (CiudadPublica & { visible: number }) | null;
  borradores: { id: string; tipo: string; titulo: string; contenido: string }[];
  servicios: { mapas: boolean; correo: boolean; fotos: boolean };
};
type Mensaje = { texto: string; error?: boolean };
type Resultado = { mensaje: string; id?: string };
async function api<T = Resultado>(
  url: string,
  datos?: unknown,
  archivo?: File,
) {
  const respuesta = await fetch(
    url,
    datos !== undefined || archivo
      ? {
          method: "POST",
          headers: { "Content-Type": archivo?.type || "application/json" },
          body: archivo || JSON.stringify(datos),
        }
      : undefined,
  );
  const resultado = await respuesta.json().catch(() => ({
    error:
      "No se pudo leer la respuesta. Comprueba tu sesión e inténtalo de nuevo.",
  }));
  if (!respuesta.ok)
    throw new Error(
      (resultado as { error?: string }).error ||
        "No se pudo completar la operación.",
    );
  return resultado as T;
}
function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <label>
      {titulo}
      {children}
    </label>
  );
}
function VisibilidadSelect({
  valor,
  cambiar,
}: {
  valor: Visibilidad;
  cambiar: (valor: Visibilidad) => void;
}) {
  return (
    <Campo titulo="Visibilidad">
      <select
        value={valor}
        onChange={(e) => cambiar(e.target.value as Visibilidad)}
      >
        <option value="borrador">Borrador · solo yo</option>
        <option value="publicado">Publicado · visible en la web</option>
      </select>
    </Campo>
  );
}
function Guardar({
  ocupado,
  nuevo = false,
}: {
  ocupado: boolean;
  nuevo?: boolean;
}) {
  return (
    <div className="save-bar">
      <button className="btn btn-dark" disabled={ocupado} type="submit">
        {ocupado ? "Guardando…" : nuevo ? "Crear contenido" : "Guardar cambios"}
      </button>
      <small>Para retirar contenido, guárdalo como borrador.</small>
    </div>
  );
}

export default function Admin() {
  const [contenido, setContenido] = useState<Contenido | null>(null);
  const [pestana, setPestana] = useState("ciudad");
  const [seleccion, setSeleccion] = useState("");
  const [mensaje, setMensaje] = useState<Mensaje>({
    texto: "Cargando tu contenido…",
  });
  const [ocupado, setOcupado] = useState(false);
  const [tipoSubida, setTipoSubida] = useState("foto");
  const [sucio, setSucio] = useState(false);
  async function cargar() {
    const d = await api<Contenido>("/api/admin/contenido");
    setContenido(d);
    return d as Contenido;
  }
  useEffect(() => {
    void cargar()
      .then(() => setMensaje({ texto: "" }))
      .catch((e) => setMensaje({ texto: e.message, error: true }));
  }, []);
  useEffect(() => {
    const salir = (e: BeforeUnloadEvent) => {
      if (sucio) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", salir);
    return () => window.removeEventListener("beforeunload", salir);
  }, [sucio]);
  function elegir(p: string, id = "") {
    if (
      sucio &&
      !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?")
    )
      return;
    setPestana(p);
    setSeleccion(id);
    setSucio(false);
    setMensaje({ texto: "" });
  }
  async function ejecutar(accion: () => Promise<any>, id?: string) {
    setOcupado(true);
    setMensaje({ texto: "Guardando…" });
    try {
      const resultado = await accion();
      await cargar();
      setSucio(false);
      if (id) setSeleccion(id);
      setMensaje({ texto: resultado.mensaje || "Cambios guardados." });
      return true;
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
      return false;
    } finally {
      setOcupado(false);
    }
  }
  const guardar = (tipo: string, datos: any) =>
    ejecutar(() => api("/api/admin/contenido", { tipo, datos }), datos.id);
  const props = { ocupado, onDirty: () => setSucio(true) };
  return (
    <div className="wrap admin-shell">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">IREMOSENBICI · MI ESPACIO</span>
          <h1>Tu próxima historia.</h1>
          <p>
            Publica cuando tú decidas. Los mapas se actualizan en Google My
            Maps.
          </p>
        </div>
        <a href="/" className="text-link" target="_blank" rel="noopener">
          Ver la web ↗
        </a>
      </div>
      <nav className="admin-tabs" aria-label="Secciones del panel">
        {[
          ["ciudad", "Mis mapas"],
          ["viajes", "Viajes"],
          ["etapas", "Etapas y rutas"],
          ["fotos", "Fotografías"],
          ["archivo", "Archivo heredado"],
        ].map(([id, titulo]) => (
          <button
            key={id}
            aria-current={pestana === id ? "true" : undefined}
            disabled={ocupado}
            onClick={() => elegir(id)}
          >
            {titulo}
          </button>
        ))}
      </nav>
      <p
        className={`admin-status ${mensaje.error ? "error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {mensaje.texto}
      </p>
      {!contenido && mensaje.error && (
        <button className="btn btn-dark" onClick={() => location.reload()}>
          Recargar el panel
        </button>
      )}
      {contenido && (
        <>
          {pestana === "ciudad" && <MapasPersonales />}
          {pestana === "viajes" && (
            <div className="admin-grid">
              <aside className="admin-list" aria-label="Viajes">
                <button disabled={ocupado} onClick={() => elegir("viajes")}>
                  + Crear viaje
                </button>
                {contenido.viajes.map((v) => (
                  <button
                    key={v.id}
                    disabled={ocupado}
                    aria-current={seleccion === v.id ? "true" : undefined}
                    onClick={() => elegir("viajes", v.id)}
                  >
                    {v.titulo}
                    <small>
                      {v.visibilidad} · {v.estado.replace("_", " ")}
                    </small>
                  </button>
                ))}
              </aside>
              <ViajeEditor
                key={`${seleccion}-${contenido.viajes.find((v) => v.id === seleccion)?.revision || 0}`}
                viaje={contenido.viajes.find((v) => v.id === seleccion)}
                guardar={guardar}
                {...props}
              />
            </div>
          )}
          {pestana === "etapas" && (
            <div className="admin-grid">
              <aside className="admin-list" aria-label="Etapas">
                <button disabled={ocupado} onClick={() => elegir("etapas")}>
                  + Crear etapa
                </button>
                {contenido.etapas.map((e) => (
                  <button
                    key={e.id}
                    disabled={ocupado}
                    aria-current={seleccion === e.id ? "true" : undefined}
                    onClick={() => elegir("etapas", e.id)}
                  >
                    {e.titulo}
                    <small>
                      {e.visibilidad} · {e.estado}
                    </small>
                  </button>
                ))}
              </aside>
              <EtapaEditor
                key={`${seleccion}-${contenido.etapas.find((e) => e.id === seleccion)?.revision || 0}`}
                etapa={contenido.etapas.find((e) => e.id === seleccion)}
                viajes={contenido.viajes}
                guardar={guardar}
                {...props}
              />
            </div>
          )}
          {pestana === "fotos" && (
            <div className="admin-grid">
              <aside className="admin-list" aria-label="Fotografías">
                <label>
                  Tipo de fotografía
                  <select
                    value={tipoSubida}
                    disabled={ocupado}
                    onChange={(e) => setTipoSubida(e.target.value)}
                  >
                    <option value="foto">Foto normal</option>
                    <option value="panorama_360">Foto 360°</option>
                  </select>
                </label>
                <label>
                  Subir fotografía
                  <input
                    disabled={ocupado}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (
                        sucio &&
                        !window.confirm(
                          "¿Descartar los cambios de la foto actual?",
                        )
                      )
                        return;
                      await ejecutar(async () => {
                        if (f.size > 10 * 1024 * 1024)
                          throw new Error("La fotografía supera 10 MB.");
                        const r = await api<Resultado & { id: string }>(
                          `/api/admin/fotos?tipo=${tipoSubida}`,
                          undefined,
                          f,
                        );
                        setSeleccion(r.id);
                        return r;
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
                <p className="admin-help">
                  JPG, PNG o WebP, hasta 10 MB. Para 360°, exporta desde
                  Insta360 una imagen 2:1 de hasta 8192 × 4096. Se guarda una
                  copia para la web y el original completo con sus metadatos,
                  inicialmente en borrador. Si contiene GPS, se recupera su
                  ubicación.
                </p>
                {contenido.fotos.map((f) => (
                  <button
                    key={f.id}
                    disabled={ocupado}
                    aria-current={seleccion === f.id ? "true" : undefined}
                    onClick={() => elegir("fotos", f.id)}
                  >
                    {f.titulo}
                    <small>{f.visibilidad}</small>
                  </button>
                ))}
              </aside>
              {contenido.fotos.find((f) => f.id === seleccion) ? (
                <FotoEditor
                  key={`${seleccion}-${contenido.fotos.find((f) => f.id === seleccion)?.revision}`}
                  foto={contenido.fotos.find((f) => f.id === seleccion)!}
                  contenido={contenido}
                  guardar={guardar}
                  {...props}
                />
              ) : (
                <div className="admin-panel">
                  <h2>Un álbum a tu ritmo.</h2>
                  <p>
                    Sube una fotografía o selecciona una del listado. Añade una
                    descripción antes de publicarla.
                  </p>
                </div>
              )}
            </div>
          )}
          {pestana === "archivo" && (
            <section className="admin-panel">
              <h2>Archivo del sitio original</h2>
              <p>
                Estas referencias se conservan como borradores. No representan
                información vigente ni etapas realizadas. Puedes recuperar su
                contenido y crear una nueva etapa revisada.
              </p>
              <ul className="draft-list">
                {contenido.borradores.map((b) => (
                  <li key={b.id}>
                    <strong>{b.titulo}</strong>
                    <small>{b.tipo}</small>
                    <p>{b.contenido}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="service-list" aria-label="Estado de servicios">
            <span>
              Mapas:{" "}
              {contenido.servicios.mapas
                ? "configurados"
                : "pendientes de configurar"}
            </span>
            <span>
              Correo:{" "}
              {contenido.servicios.correo
                ? "configurado"
                : "pendiente de configurar"}
            </span>
            <span>
              Procesador de fotos:{" "}
              {contenido.servicios.fotos ? "disponible" : "no disponible"}
            </span>
            <a href="/cdn-cgi/access/logout">Cerrar sesión</a>
          </div>
        </>
      )}
    </div>
  );
}

type EditorProps = {
  ocupado: boolean;
  onDirty: () => void;
  guardar: (tipo: string, datos: any) => Promise<boolean>;
};
function ViajeEditor({
  viaje,
  guardar,
  ocupado,
  onDirty,
}: EditorProps & { viaje?: Viaje }) {
  const [d, set] = useState(
    () =>
      viaje || {
        id: crypto.randomUUID(),
        slug: "",
        titulo: "",
        resumen: "",
        descripcion: "",
        estado: "planificado",
        visibilidad: "borrador",
        revision: 0,
      },
  );
  const cambiar = (clave: string, valor: string) => {
    set((v) => ({ ...v, [clave]: valor }));
    onDirty();
  };
  return (
    <form
      className="admin-editor"
      onSubmit={(e) => {
        e.preventDefault();
        void guardar("viaje", d);
      }}
    >
      <fieldset disabled={ocupado}>
        <h2>{viaje ? "Editar viaje" : "Un nuevo viaje"}</h2>
        <Campo titulo="Título">
          <input
            value={d.titulo}
            maxLength={140}
            required
            onChange={(e) => cambiar("titulo", e.target.value)}
          />
        </Campo>
        <Campo titulo="Dirección del viaje (solo minúsculas, números y guiones)">
          <input
            value={d.slug}
            pattern="[a-z0-9-]+"
            maxLength={100}
            required
            onChange={(e) => cambiar("slug", e.target.value)}
          />
        </Campo>
        <p className="admin-help">
          /viajes/{d.slug || "nombre-del-viaje"} · Conserva esta dirección
          después de compartirla.
        </p>
        <Campo titulo="Presentación breve">
          <textarea
            rows={3}
            value={d.resumen}
            maxLength={400}
            required
            onChange={(e) => cambiar("resumen", e.target.value)}
          />
        </Campo>
        <Campo titulo="Historia y detalles">
          <textarea
            rows={8}
            value={d.descripcion}
            maxLength={15000}
            onChange={(e) => cambiar("descripcion", e.target.value)}
          />
        </Campo>
        <div className="form-two">
          <Campo titulo="Estado">
            <select
              value={d.estado}
              onChange={(e) => cambiar("estado", e.target.value)}
            >
              <option value="planificado">Planificado</option>
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
            </select>
          </Campo>
          <VisibilidadSelect
            valor={d.visibilidad as Visibilidad}
            cambiar={(v) => cambiar("visibilidad", v)}
          />
        </div>
        <Guardar ocupado={ocupado} nuevo={!viaje} />
      </fieldset>
    </form>
  );
}
function EtapaEditor({
  etapa,
  viajes,
  guardar,
  ocupado,
  onDirty,
}: EditorProps & { etapa?: Etapa; viajes: Viaje[] }) {
  const [d, set] = useState(() => ({
    id: etapa?.id || crypto.randomUUID(),
    viaje_id: etapa?.viaje_id || viajes[0]?.id || "",
    titulo: etapa?.titulo || "",
    descripcion: etapa?.descripcion || "",
    ciudad: etapa?.ciudad || "",
    pais: etapa?.pais || "",
    estado: etapa?.estado || "planificada",
    visibilidad: etapa?.visibilidad || "borrador",
    orden: etapa?.orden || 0,
    ruta: etapa?.ruta_json ? (JSON.parse(etapa.ruta_json) as RutaSegura) : null,
    ruta_revisada: !!etapa?.ruta_revisada,
    revision: etapa?.revision || 0,
  }));
  const cambiar = (clave: string, valor: unknown) => {
    set((v) => ({ ...v, [clave]: valor }));
    onDirty();
  };
  return (
    <form
      className="admin-editor"
      onSubmit={(e) => {
        e.preventDefault();
        void guardar("etapa", d);
      }}
    >
      <fieldset disabled={ocupado}>
        <h2>{etapa ? "Editar etapa" : "Una nueva etapa"}</h2>
        <Campo titulo="Viaje">
          <select
            required
            value={d.viaje_id}
            onChange={(e) => cambiar("viaje_id", e.target.value)}
          >
            <option value="">Selecciona un viaje</option>
            {viajes.map((v) => (
              <option value={v.id} key={v.id}>
                {v.titulo}
                {v.visibilidad === "borrador" ? " (borrador)" : ""}
              </option>
            ))}
          </select>
        </Campo>
        <Campo titulo="Título">
          <input
            required
            maxLength={140}
            value={d.titulo}
            onChange={(e) => cambiar("titulo", e.target.value)}
          />
        </Campo>
        <Campo titulo="Relato de la etapa">
          <textarea
            rows={7}
            maxLength={15000}
            value={d.descripcion}
            onChange={(e) => cambiar("descripcion", e.target.value)}
          />
        </Campo>
        <div className="form-two">
          <Campo titulo="Ciudad">
            <input
              maxLength={120}
              value={d.ciudad}
              onChange={(e) => cambiar("ciudad", e.target.value)}
            />
          </Campo>
          <Campo titulo="País">
            <input
              maxLength={100}
              value={d.pais}
              onChange={(e) => cambiar("pais", e.target.value)}
            />
          </Campo>
        </div>
        <div className="form-two">
          <Campo titulo="Estado de la etapa">
            <select
              value={d.estado}
              onChange={(e) => cambiar("estado", e.target.value)}
            >
              <option value="planificada">Planificada</option>
              <option value="completada">Completada</option>
            </select>
          </Campo>
          <Campo titulo="Orden dentro del viaje">
            <input
              type="number"
              min={0}
              max={10000}
              value={d.orden}
              onChange={(e) => cambiar("orden", Number(e.target.value))}
            />
          </Campo>
        </div>
        <RouteEditor
          ruta={d.ruta}
          revisada={d.ruta_revisada}
          onChange={(ruta, revisada) => {
            set((v) => ({ ...v, ruta, ruta_revisada: revisada }));
            onDirty();
          }}
        />
        <VisibilidadSelect
          valor={d.visibilidad as Visibilidad}
          cambiar={(v) => cambiar("visibilidad", v)}
        />
        {d.ruta && d.estado !== "completada" && (
          <p className="admin-help">
            Esta etapa tiene trazado y aún está planificada: puedes guardarla
            como borrador. Para publicar una etapa planificada, retira su
            trazado detallado.
          </p>
        )}
        <Guardar ocupado={ocupado} nuevo={!etapa} />
      </fieldset>
    </form>
  );
}
function FotoEditor({
  foto,
  contenido,
  guardar,
  ocupado,
  onDirty,
}: EditorProps & { foto: Foto; contenido: Contenido }) {
  const [d, set] = useState(foto);
  const cambiar = (clave: string, valor: unknown) => {
    set((v) => ({ ...v, [clave]: valor }));
    onDirty();
  };
  return (
    <form
      className="admin-editor"
      onSubmit={(e) => {
        e.preventDefault();
        void guardar("foto", d);
      }}
    >
      <fieldset disabled={ocupado}>
        <h2>Editar fotografía{d.tipo === "panorama_360" ? " 360°" : ""}</h2>
        <img
          className="photo-admin"
          src={`/api/admin/fotos?id=${d.id}`}
          alt={d.alternativa}
        />
        <Campo titulo="Título">
          <input
            required
            maxLength={140}
            value={d.titulo}
            onChange={(e) => cambiar("titulo", e.target.value)}
          />
        </Campo>
        <Campo titulo="Descripción de la imagen para personas que no pueden verla">
          <textarea
            required
            rows={3}
            maxLength={300}
            value={d.alternativa}
            onChange={(e) => cambiar("alternativa", e.target.value)}
          />
        </Campo>
        <Campo titulo="Pie de foto">
          <textarea
            rows={3}
            maxLength={2000}
            value={d.pie}
            onChange={(e) => cambiar("pie", e.target.value)}
          />
        </Campo>
        <Campo titulo="Viaje (opcional)">
          <select
            value={d.viaje_id || ""}
            onChange={(e) => {
              set((v) => ({
                ...v,
                viaje_id: e.target.value || null,
                etapa_id: null,
              }));
              onDirty();
            }}
          >
            <option value="">Galería general</option>
            {contenido.viajes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.titulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo titulo="Etapa (opcional)">
          <select
            value={d.etapa_id || ""}
            disabled={!d.viaje_id}
            onChange={(e) => cambiar("etapa_id", e.target.value || null)}
          >
            <option value="">Sin etapa</option>
            {contenido.etapas
              .filter((e) => e.viaje_id === d.viaje_id)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.titulo}
                </option>
              ))}
          </select>
        </Campo>
        <VisibilidadSelect
          valor={d.visibilidad}
          cambiar={(v) => cambiar("visibilidad", v)}
        />
        {d.tipo === "panorama_360" && (
          <PanoramaCalibration
            id={d.id}
            norte={d.norte_grados}
            onChange={(v) => cambiar("norte_grados", v)}
          />
        )}
        <h3>Ubicación en MAPA-RUTA</h3>
        <p className="admin-help">
          Las coordenadas se leen del archivo cuando están disponibles. Puedes
          corregirlas o introducirlas manualmente. La publicación aparece en la
          galería. Para situarla en el mapa, añade un marcador en Google My Maps
          y enlaza la página de la fotografía. No hay sincronización automática.
        </p>
        <div className="form-two">
          <Campo titulo="Latitud">
            <input
              type="number"
              min="-90"
              max="90"
              step="any"
              value={d.latitud ?? ""}
              required={d.longitud !== null}
              onChange={(e) =>
                cambiar(
                  "latitud",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Campo>
          <Campo titulo="Longitud">
            <input
              type="number"
              min="-180"
              max="180"
              step="any"
              value={d.longitud ?? ""}
              required={d.latitud !== null}
              onChange={(e) =>
                cambiar(
                  "longitud",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Campo>
        </div>
        {!!d.tiene_original && (
          <p>
            <a href={`/api/admin/fotos?id=${d.id}&original=1`}>
              Descargar original con metadatos
            </a>
          </p>
        )}
        <p className="admin-help">
          Una foto vinculada a un viaje o una etapa en borrador tampoco será
          visible públicamente.
        </p>
        <Guardar ocupado={ocupado} />
      </fieldset>
    </form>
  );
}
function MapasPersonales() {
  return (
    <section className="admin-panel">
      <h2>Mis mapas de Google</h2>
      <p>
        La web muestra los mapas originales de tu cuenta de Google. Edita sus
        rutas, fotos y ubicación en My Maps; los cambios se verán al recargar la
        web. Inicia sesión con la cuenta propietaria de cada mapa.
      </p>
      <div className="button-row">
        <a
          className="btn btn-dark"
          href={mapasPersonales.recorrido.editar}
          target="_blank"
          rel="noopener"
        >
          Editar MAPA-RUTA ↗
        </a>
        <a
          className="btn btn-outline"
          href={mapasPersonales.ubicacion.editar}
          target="_blank"
          rel="noopener"
        >
          Editar mapa de Contactanos ↗
        </a>
      </div>
      <p className="admin-help">
        En My Maps puedes importar GPX/KML, añadir marcadores y fotos, y elegir
        Satélite en Mapa base. Mantén cada mapa público para que los visitantes
        puedan verlo. No necesitas activar Google Cloud ni facturación.
      </p>
      <p className="admin-help">
        Las fotos y etapas guardadas en este panel se conservan en la web, pero
        no se transfieren automáticamente a My Maps. Las fotos 360 mantienen su
        visor: puedes enlazar su página desde un marcador del mapa.
      </p>
    </section>
  );
}
