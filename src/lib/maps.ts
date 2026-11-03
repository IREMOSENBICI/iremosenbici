// Mapas públicos que ya estaban incrustados en la web original.
// Se editan en la cuenta propietaria de My Maps, sin claves ni Google Cloud.
function mapaPersonal(id: string) {
  const parametros = new URLSearchParams({ mid: id, hl: "es" });
  return {
    insertar: `https://www.google.com/maps/d/embed?${parametros}`,
    ver: `https://www.google.com/maps/d/viewer?${parametros}`,
    editar: `https://www.google.com/maps/d/edit?${parametros}`,
  };
}

export const mapasPersonales = {
  recorrido: mapaPersonal("1D8ACPdT3DBvu3fGIsiF_yLAOhizxy41h"),
  ubicacion: mapaPersonal("1_uUMG3hVJ6JinIVzGcVn231JLOymJz2U"),
};
