import assert from "node:assert/strict";

const base = process.argv[2] || "https://www.iremosenbici.com";
const pagina = await fetch(base);
assert.equal(pagina.status, 200);
const html = await pagina.text();
assert.ok(html.includes('id="mapa-ruta"'));
assert.ok(html.includes("Ver Ruta"));
assert.ok(!html.includes("Ver todo el recorrido"));
assert.ok(!html.includes("Rutas · Fotografías · 360°"));
const marcos = [
  ...html.matchAll(/<iframe\b[^>]*class="[^"]*map-google-personal[^>]*>/g),
];
assert.equal(
  marcos.length,
  2,
  "Ambos mapas deben estar integrados en la portada",
);
for (const [marco] of marcos) {
  assert.ok(marco.includes('loading="lazy"'));
  assert.ok(marco.includes('title="Mapa de'));
  assert.ok(marco.includes('src="https://www.google.com/maps/d/embed?mid='));
}
const csp = pagina.headers.get("content-security-policy");
assert.ok(csp.includes("https://www.google.com"));
assert.ok(!csp.includes("geoapify"));
const respuesta = await fetch(`${base}/api/mapa`);
assert.equal(respuesta.status, 200);
const mapa = await respuesta.json();
assert.equal(mapa.proveedor, "google_mymaps");
assert.equal(mapa.sincronizacion_automatica, false);
assert.ok(!("google" in mapa) && !("teselas" in mapa));
assert.ok(Array.isArray(mapa.fotos) && Array.isArray(mapa.etapas));
for (const nombre of ["recorrido", "ubicacion"]) {
  const url = new URL(mapa.mapas[nombre].insertar);
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.pathname, "/maps/d/embed");
  assert.ok(!url.searchParams.has("key"));
  // Una petición sin cookies debe poder ver ambos mapas, sin iniciar sesión.
  const publico = await fetch(url);
  assert.equal(publico.status, 200);
  assert.ok(!publico.url.includes("accounts.google.com"));
  assert.ok((await publico.text()).includes("Google My Maps"));
}
const retirado = await fetch(`${base}/api/teselas/4/4/7.png`);
assert.equal(retirado.status, 404);
for (const ruta of ["/viajes/venezuela-costa-rica", "/rutas.html"]) {
  const redireccion = await fetch(base + ruta, { redirect: "manual" });
  assert.equal(redireccion.status, 301);
  assert.equal(redireccion.headers.get("location"), "/#mapa-ruta");
}
console.log(
  JSON.stringify({
    portada: 200,
    mapas: 2,
    proveedor: mapa.proveedor,
    publicosSinSesion: true,
    proxyGeoapify: retirado.status,
  }),
);
