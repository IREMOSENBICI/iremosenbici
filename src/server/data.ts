import type {
  Entorno,
  Viaje,
  Etapa,
  Foto,
  CiudadPublica,
  FotoMapa,
} from "../lib/types";
export async function viajesPublicos(env: Entorno) {
  return (
    await env.DATOS.prepare(
      "SELECT id,slug,idioma,titulo,resumen,descripcion,estado,visibilidad,revision,actualizado FROM viajes WHERE visibilidad='publicado' AND idioma='es' ORDER BY actualizado DESC",
    ).all<Viaje>()
  ).results;
}
export async function viajePublico(env: Entorno, slug: string) {
  return env.DATOS.prepare(
    "SELECT id,slug,idioma,titulo,resumen,descripcion,estado,visibilidad,revision,actualizado FROM viajes WHERE slug=? AND visibilidad='publicado' AND idioma='es'",
  )
    .bind(slug)
    .first<Viaje>();
}
export async function etapasPublicas(env: Entorno, viajeId: string) {
  return (
    await env.DATOS.prepare(
      "SELECT e.id,e.viaje_id,e.titulo,e.descripcion,e.ciudad,e.pais,e.estado,e.visibilidad,e.orden,CASE WHEN e.estado='completada' AND e.ruta_revisada=1 THEN e.ruta_json ELSE NULL END AS ruta_json,e.ruta_revisada,e.revision,e.actualizado FROM etapas e JOIN viajes v ON e.viaje_id=v.id WHERE e.viaje_id=? AND e.visibilidad='publicado' AND v.visibilidad='publicado' ORDER BY e.orden,e.id",
    )
      .bind(viajeId)
      .all<Etapa>()
  ).results;
}
export const FOTO_PUBLICA =
  "f.visibilidad='publicado' AND (f.viaje_id IS NULL OR EXISTS(SELECT 1 FROM viajes v WHERE v.id=f.viaje_id AND v.visibilidad='publicado')) AND (f.etapa_id IS NULL OR EXISTS(SELECT 1 FROM etapas e JOIN viajes v ON v.id=e.viaje_id WHERE e.id=f.etapa_id AND e.visibilidad='publicado' AND v.visibilidad='publicado'))";
export async function fotosPublicas(env: Entorno, viajeId?: string) {
  return (
    await env.DATOS.prepare(
      `SELECT f.id,f.viaje_id,f.etapa_id,f.titulo,f.alternativa,f.pie,f.tipo,f.norte_grados FROM fotos f WHERE ${FOTO_PUBLICA} ${viajeId ? "AND f.viaje_id=?" : ""} ORDER BY f.actualizado DESC LIMIT 60`,
    )
      .bind(...(viajeId ? [viajeId] : []))
      .all<Foto>()
  ).results;
}
export async function ciudadPublica(env: Entorno) {
  return env.DATOS.prepare(
    "SELECT ciudad,pais,latitud,longitud,fecha_publicacion FROM ubicacion_publica WHERE id=1 AND visible=1",
  ).first<CiudadPublica>();
}
export async function fotosMapaPublicas(env: Entorno, viajeId?: string) {
  return (
    await env.DATOS.prepare(
      `SELECT f.id,f.titulo,f.alternativa,f.pie,f.tipo,f.latitud,f.longitud FROM fotos f
     WHERE ${FOTO_PUBLICA} AND f.latitud IS NOT NULL AND f.longitud IS NOT NULL
     ${viajeId ? "AND f.viaje_id=?" : ""} ORDER BY f.actualizado DESC`,
    )
      .bind(...(viajeId ? [viajeId] : []))
      .all<FotoMapa>()
  ).results;
}
export async function etapasMapaPublicas(env: Entorno, viajeId?: string) {
  return (
    await env.DATOS.prepare(
      `SELECT e.id,e.titulo,e.ruta_json FROM etapas e JOIN viajes v ON v.id=e.viaje_id
     WHERE e.visibilidad='publicado' AND v.visibilidad='publicado'
     AND e.estado='completada' AND e.ruta_revisada=1 AND e.ruta_json IS NOT NULL
     ${viajeId ? "AND e.viaje_id=?" : ""} ORDER BY e.orden,e.id`,
    )
      .bind(...(viajeId ? [viajeId] : []))
      .all<Pick<Etapa, "id" | "titulo" | "ruta_json">>()
  ).results;
}
