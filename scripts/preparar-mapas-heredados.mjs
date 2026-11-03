// Genera SQL privado e idempotente; jamás incluir su salida ni los KML en Git.
import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
const directorio = path.resolve('artifacts/mapas-heredados');
const sql = [];
const textoSql = (valor) => `'${String(valor).replaceAll("'", "''")}'`;
const lista = (valor) => valor === undefined ? [] : [].concat(valor);
let etapas = 0;
for (const nombre of ['ruta', 'recomendaciones']) {
  const xml = fs.readFileSync(path.join(directorio, `${nombre}.kml`), 'utf8');
  if (/<!DOCTYPE|<!ENTITY|<\s*(?:\w+:)?NetworkLink\b/i.test(xml)) throw new Error('KML con referencias externas.');
  const doc = new XMLParser({ removeNSPrefix: true, processEntities: false }).parse(xml);
  const lineas = [], lugares = [];
  function visitar(n, titulo = '') {
    if (!n || typeof n !== 'object') return;
    if (n.name) titulo = String(n.name);
    for (const linea of lista(n.LineString)) {
      const puntos = String(linea.coordinates).trim().split(/\s+/).map(p => {
        const [lon, lat] = p.split(',').map(Number);
        if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon)>180 || Math.abs(lat)>90) throw new Error('Coordenadas inválidas');
        return [Number(lon.toFixed(6)), Number(lat.toFixed(6))];
      });
      lineas.push({titulo, puntos});
    }
    if (n.Point) lugares.push(titulo);
    for (const [clave, valor] of Object.entries(n)) if (['kml', 'Document', 'Folder', 'Placemark', 'MultiGeometry'].includes(clave)) for (const item of lista(valor)) visitar(item, titulo);
  }
  visitar(doc);
  let numero = 0;
  for (const linea of lineas) {
    // Dividir, sin inventar ni simplificar geometría. Un punto compartido conserva la continuidad.
    for (let inicio=0; inicio < linea.puntos.length-1; inicio += 2999) {
      const puntos = linea.puntos.slice(inicio, inicio+3000);
      const ruta = { type:'FeatureCollection', features:[{ type:'Feature', properties:{}, geometry:{type:'LineString',coordinates:puntos} }] };
      numero++; etapas++;
      const titulo = `${linea.titulo.slice(0,110)}${linea.puntos.length>3000 ? ` · parte ${Math.floor(inicio/2999)+1}` : ''}`;
      const descripcion = `Recuperado del mapa antiguo «${nombre}». Itinerario sin verificar: revisar ciudades, extremos y puntos sensibles antes de publicar. La geometría conserva los puntos de origen, sin tiempos, elevaciones ni enlaces externos.`;
      sql.push(`INSERT OR IGNORE INTO etapas(id,viaje_id,titulo,descripcion,estado,visibilidad,orden,ruta_json,ruta_revisada) VALUES(${textoSql(`heredado-${nombre}-${numero}`)},'venezuela-costa-rica',${textoSql(titulo)},${textoSql(descripcion)},'planificada','borrador',${100+etapas},${textoSql(JSON.stringify(ruta))},0);`);
    }
  }
  const contenido = `Mapa recuperado: ${lineas.length} trazados, importados en ${numero} etapas privadas sin revisar. ${lugares.length} lugares conservados como referencias: ${lugares.join('; ')}. No representan ubicaciones actuales ni visitas realizadas.`;
  sql.push(`UPDATE borradores_heredados SET contenido=${textoSql(contenido)} WHERE id=${textoSql(nombre==='ruta'?'mapa-ruta':'mapa-recomendaciones')};`);
}
fs.writeFileSync(path.join(directorio, 'importar.sql'), sql.join('\n'));
console.log(`Preparadas ${etapas} etapas privadas. SQL en artifacts/mapas-heredados/importar.sql; no se ha publicado ningún trazado.`);
