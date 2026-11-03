import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
const origen = 'http://127.0.0.1:4321'; // Nunca aceptar un servidor remoto para estas pruebas de publicación.
const contenidos = () => fetch(`${origen}/api/admin/contenido`).then(r=>r.json());
const guardar = async (datos) => {
  const r=await fetch(`${origen}/api/admin/contenido`,{method:'POST',headers:{Origin:origen,'Content-Type':'application/json'},body:JSON.stringify({tipo:'foto',datos})});
  assert.equal(r.status,200,await r.text());
};
const imagen = await sharp({create:{width:1600,height:800,channels:3,background:'#e7bd32'}})
  .withExif({IFD0:{ImageDescription:'Prueba privada con metadatos'},IFD3:{GPSLatitudeRef:'N',GPSLatitude:'10/1 0/1 0/1',GPSLongitudeRef:'W',GPSLongitude:'66/1 0/1 0/1'}}).jpeg().toBuffer();
assert.ok((await sharp(imagen).metadata()).exif,'La imagen de entrada debe contener EXIF');
const subida=await fetch(`${origen}/api/admin/fotos?tipo=panorama_360`,{method:'POST',headers:{Origin:origen,'Content-Type':'image/jpeg'},body:imagen});
assert.equal(subida.status,201,await subida.clone().text());
const {id}=await subida.json();
const inspeccionar=async(url)=>{
 const r=await fetch(url);assert.equal(r.status,200);
 const m=await sharp(Buffer.from(await r.arrayBuffer())).metadata();
 assert.equal(m.format,'webp'); assert.equal(m.exif,undefined);assert.equal(m.xmp,undefined);assert.equal(m.iptc,undefined);
 return {ancho:m.width,alto:m.height,exif:false,xmp:false,iptc:false};
};
const resultados={id,privada:await inspeccionar(`${origen}/api/admin/fotos?id=${id}&completa=1`)};
assert.equal((await fetch(`${origen}/media/${id}`)).status,404,'Un borrador no puede descargarse públicamente');
let foto=(await contenidos()).fotos.find(f=>f.id===id);
await guardar({...foto,titulo:'Prueba local 360',alternativa:'Imagen sintética para validar privacidad',pie:'Solo prueba local',visibilidad:'publicado',norte_grados:90});
resultados.publica=await inspeccionar(`${origen}/media/${id}`);
resultados.miniatura=await inspeccionar(`${origen}/media/${id}?mini=1`);
assert.equal((await fetch(`${origen}/fotografias/${id}`)).status,200);
foto=(await contenidos()).fotos.find(f=>f.id===id);
await guardar({...foto,visibilidad:'borrador'});
assert.equal((await fetch(`${origen}/media/${id}`)).status,404,'La retirada debe bloquear también la imagen completa');
assert.equal((await fetch(`${origen}/media/${id}?mini=1`)).status,404,'La retirada debe bloquear la miniatura');
const csrf=await fetch(`${origen}/api/admin/contenido`,{method:'POST',headers:{Origin:'https://otro-sitio.example','Content-Type':'application/json'},body:'{}'});
assert.equal(csrf.status,403);
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/privacidad-fotos.json',JSON.stringify(resultados,null,2));
console.log('Verificados: procesamiento real, copias sin EXIF/GPS/XMP/IPTC, borrador privado, publicación, retirada y protección de origen.');
