export type Visibilidad = "borrador" | "publicado";
export interface Viaje {
  id: string;
  slug: string;
  idioma: string;
  titulo: string;
  resumen: string;
  descripcion: string;
  estado: "planificado" | "en_curso" | "completado";
  visibilidad: Visibilidad;
  revision: number;
  actualizado: string;
}
export interface Etapa {
  id: string;
  viaje_id: string;
  titulo: string;
  descripcion: string;
  ciudad: string;
  pais: string;
  estado: "planificada" | "completada";
  visibilidad: Visibilidad;
  orden: number;
  ruta_json: string | null;
  ruta_revisada: number;
  revision: number;
  actualizado: string;
}
export interface Foto {
  id: string;
  viaje_id: string | null;
  etapa_id: string | null;
  titulo: string;
  alternativa: string;
  pie: string;
  visibilidad: Visibilidad;
  revision: number;
  tipo: "foto" | "panorama_360";
  norte_grados: number | null;
  latitud: number | null;
  longitud: number | null;
  tiene_original?: number;
}
export interface CiudadPublica {
  ciudad: string;
  pais: string;
  latitud: number;
  longitud: number;
  fecha_publicacion: string;
}
export interface Entorno {
  DATOS: D1Database;
  FOTOS: R2Bucket;
  IMAGENES: ImagesBinding;
  ENTORNO: string;
  ORIGEN_SITIO: string;
  CORREO_ADMIN: string;
  CORREO_DESTINO: string;
  CORREO_REMITENTE: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  GEOAPIFY_API_KEY?: string;
  PROVEEDOR_MAPA?: "geoapify" | "google";
  GOOGLE_MAPS_API_KEY?: string;
  RESEND_API_KEY?: string;
  SECRETO_SITIO?: string;
  PERMITIR_ADMIN_LOCAL?: string;
}
export type FotoMapa = Pick<
  Foto,
  "id" | "titulo" | "alternativa" | "pie" | "tipo"
> & {
  latitud: number;
  longitud: number;
};
export interface DatosMapa {
  proveedor: "geoapify" | "google";
  google: { clave: string } | null;
  teselas: string | null;
  ciudad: CiudadPublica | null;
  etapas: { id: string; titulo: string; ruta: RutaSegura }[];
  fotos: FotoMapa[];
}
export interface RutaSegura {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Record<string, never>;
    geometry: { type: "LineString"; coordinates: [number, number][] };
  }[];
}
