import { describe, it, expect } from "vitest";
import { importarRuta, limpiarRuta, recortarRuta } from "../src/lib/routes";
const gpx =
  '<gpx><metadata><time>2026-11-01T02:04:06Z</time><link href="https://privado.example"/></metadata><wpt lat="1" lon="2"><name>Hotel privado</name></wpt><trk><name>Ruta privada</name><trkseg><trkpt lat="10.123456789" lon="-67.1"><ele>123</ele><time>2026-11-01T02:04:06Z</time></trkpt><trkpt lat="10.2" lon="-67.2"/></trkseg></trk></gpx>';
describe("privacidad de recorridos", () => {
  it("extrae solo geometría GPX, sin horarios, elevación, hoteles ni enlaces", () => {
    const ruta = importarRuta(gpx);
    expect(ruta.features).toHaveLength(1);
    expect(ruta.features[0].geometry.coordinates).toEqual([
      [-67.1, 10.123457],
      [-67.2, 10.2],
    ]);
    expect(JSON.stringify(ruta)).not.toMatch(
      /time|2026|Hotel|privado|ele|https/,
    );
  });
  it("depura KML anidado con espacios de nombres", () => {
    const r = importarRuta(
      '<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Folder><Placemark><name>Nombre privado</name><description><![CDATA[<img src="https://privado.example"/>]]></description><TimeStamp><when>2026-01-01</when></TimeStamp><MultiGeometry><LineString><coordinates>-67,10,100 -66,11,200</coordinates></LineString></MultiGeometry></Placemark></Folder></Document></kml>',
    );
    expect(r.features[0].geometry.coordinates).toEqual([
      [-67, 10],
      [-66, 11],
    ]);
    expect(JSON.stringify(r)).not.toMatch(/privado|Time|2026|100|200/);
  });
  it.each([
    '<!DOCTYPE gpx [<!ENTITY x SYSTEM "file:///etc/passwd">]><gpx/>',
    "<kml><NetworkLink><Link><href>https://x.test</href></Link></NetworkLink></kml>",
    "<gpx><trk></gpx>",
    "<html/>",
  ])("rechaza XML inválido o referencias externas", (xml) =>
    expect(() => importarRuta(xml)).toThrow(),
  );
  it("rechaza coordenadas fuera de rango y recorridos excesivos", () => {
    const r = importarRuta(gpx);
    r.features[0].geometry.coordinates[0] = [181, 10];
    expect(() => limpiarRuta(r)).toThrow(/inválidas/);
    r.features[0].geometry.coordinates = Array.from({ length: 10001 }, () => [
      1, 2,
    ]);
    expect(() => limpiarRuta(r)).toThrow(/10.000/);
  });
  it("no conserva propiedades añadidas por un cliente", () => {
    const r = importarRuta(gpx) as any;
    r.features[0].properties = { tiempo: "2026", hotel: "privado" };
    r.features[0].geometry.coordinates[0].push(998);
    r.enlace = "https://x.test";
    expect(JSON.stringify(limpiarRuta(r))).not.toMatch(/2026|hotel|998|enlace/);
  });
  it("retira los extremos y segmentos sin modificar el original", () => {
    const r = importarRuta(gpx);
    r.features[0].geometry.coordinates = Array.from({ length: 10 }, (_, i) => [
      i,
      i,
    ]);
    r.features.push(structuredClone(r.features[0]));
    const recortada = recortarRuta(r, 20, 30, [1]);
    expect(recortada?.features).toHaveLength(1);
    expect(recortada?.features[0].geometry.coordinates).toEqual([
      [2, 2],
      [3, 3],
      [4, 4],
      [5, 5],
      [6, 6],
    ]);
    expect(r.features[0].geometry.coordinates).toHaveLength(10);
    expect(recortarRuta(r, 95, 95)).toBeNull();
  });
});
