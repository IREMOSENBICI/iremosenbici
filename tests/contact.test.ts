import { afterEach, it, expect, vi } from "vitest";
import { basePrueba } from "./database";
import { enviarContacto } from "../src/server/contact";
const datos = {
  nombre: "Persona de prueba",
  email: "prueba@example.com",
  asunto: "Prueba técnica",
  mensaje: "Mensaje sintético, sin envío real",
  empresa: "",
  solicitud: "d811ac24-2cf8-4456-a36e-1f8997e43824",
};
const solicitud = (cambios = {}) =>
  new Request("https://www.iremosenbici.com/api/contacto", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": "192.0.2.1",
    },
    body: JSON.stringify({ ...datos, ...cambios }),
  });
afterEach(() => vi.unstubAllGlobals());
it("confirma el envío únicamente cuando Resend devuelve un identificador", async () => {
  const { env, db } = basePrueba();
  env.RESEND_API_KEY = "clave-de-prueba";
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ id: "envio-confirmado" }), { status: 200 }),
    );
  vi.stubGlobal("fetch", fetch);
  const respuesta = await enviarContacto(solicitud(), env);
  expect(respuesta.status).toBe(200);
  const opciones = fetch.mock.calls[0][1];
  expect(JSON.parse(opciones.body).to).toEqual(["destino@example.com"]);
  expect(opciones.headers["Idempotency-Key"]).toContain(datos.solicitud);
  db.close();
});
it.each([
  new Response("{}", { status: 500 }),
  new Response("{}", { status: 200 }),
])(
  "no da un agradecimiento falso cuando el proveedor falla",
  async (resultado) => {
    const { env, db } = basePrueba();
    env.RESEND_API_KEY = "clave";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resultado));
    const respuesta = await enviarContacto(solicitud(), env);
    expect(respuesta.status).toBe(502);
    expect(await respuesta.text()).not.toContain("Gracias");
    db.close();
  },
);
it("avisa de configuración pendiente sin invocar el proveedor", async () => {
  const { env, db } = basePrueba();
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  expect((await enviarContacto(solicitud(), env)).status).toBe(503);
  expect(fetch).not.toHaveBeenCalled();
  db.close();
});
it("rechaza correo inválido, honeypot y solicitudes excesivas", async () => {
  const { env, db } = basePrueba();
  env.RESEND_API_KEY = "clave";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response('{"id":"confirmado"}')),
  );
  expect(
    (await enviarContacto(solicitud({ email: "incorrecto" }), env)).status,
  ).toBe(400);
  expect(
    (await enviarContacto(solicitud({ empresa: "robot" }), env)).status,
  ).toBe(400);
  for (let i = 0; i < 3; i++)
    expect((await enviarContacto(solicitud(), env)).status).toBe(200);
  expect((await enviarContacto(solicitud(), env)).status).toBe(429);
  db.close();
});
