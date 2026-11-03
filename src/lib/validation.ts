import { z } from "zod";
const texto = (max: number) => z.string().trim().min(1).max(max);
export const viajeSchema = z.object({
  id: texto(80).regex(/^[a-z0-9-]+$/),
  slug: texto(100).regex(/^[a-z0-9-]+$/),
  titulo: texto(140),
  resumen: texto(400),
  descripcion: z.string().trim().max(15000),
  estado: z.enum(["planificado", "en_curso", "completado"]),
  visibilidad: z.enum(["borrador", "publicado"]),
  revision: z.number().int().min(0),
});
export const etapaSchema = z.object({
  id: texto(80).regex(/^[a-z0-9-]+$/),
  viaje_id: texto(80),
  titulo: texto(140),
  descripcion: z.string().trim().max(15000),
  ciudad: z.string().trim().max(120),
  pais: z.string().trim().max(100),
  estado: z.enum(["planificada", "completada"]),
  visibilidad: z.enum(["borrador", "publicado"]),
  orden: z.number().int().min(0).max(10000),
  ruta: z.unknown().nullable(),
  ruta_revisada: z.boolean(),
  revision: z.number().int().min(0),
});
export const contactoSchema = z.object({
  nombre: texto(100),
  email: z.email().max(200),
  asunto: texto(160),
  mensaje: texto(5000),
  empresa: z.string().max(200).default(""),
  solicitud: z.uuid(),
});
export const fotoSchema = z.object({
  id: z.uuid(),
  titulo: texto(140),
  alternativa: texto(300),
  pie: z.string().trim().max(2000),
  viaje_id: z.string().max(80).nullable(),
  etapa_id: z.string().max(80).nullable(),
  visibilidad: z.enum(["borrador", "publicado"]),
  revision: z.number().int().min(1),
  norte_grados: z.number().min(0).lt(360).nullable().default(null),
});
