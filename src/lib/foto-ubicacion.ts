import { gps } from "exifr";

/** Lee las coordenadas sin modificar el archivo. El original siempre se conserva. */
export async function ubicacionFoto(buffer: Uint8Array) {
  try {
    const datos = await gps(buffer);
    if (
      datos &&
      Number.isFinite(datos.latitude) &&
      Number.isFinite(datos.longitude) &&
      Math.abs(datos.latitude) <= 90 &&
      Math.abs(datos.longitude) <= 180
    )
      return { latitud: datos.latitude, longitud: datos.longitude };
  } catch {
    // Metadatos ausentes, no compatibles o dañados: el panel permite indicar la ubicación.
  }
  return { latitud: null, longitud: null };
}
