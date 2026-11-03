import { it, expect } from "vitest";
import { verificarAcceso, mismoOrigen } from "../src/server/auth";
import { basePrueba } from "./database";
it("cierra el acceso cuando falta configuración o el token es inválido", async () => {
  const { env, db } = basePrueba();
  expect(
    await verificarAcceso(
      new Request("https://www.iremosenbici.com/admin"),
      env,
    ),
  ).toBeNull();
  env.ACCESS_TEAM_DOMAIN = "iremosenbici.cloudflareaccess.com";
  env.ACCESS_AUD = "audiencia";
  expect(
    await verificarAcceso(
      new Request("https://www.iremosenbici.com/admin", {
        headers: { "Cf-Access-Jwt-Assertion": "falso" },
      }),
      env,
    ),
  ).toBeNull();
  db.close();
});
it("el acceso de desarrollo requiere servidor local, modo desarrollo y opción explícita", async () => {
  const { env, db } = basePrueba();
  env.PERMITIR_ADMIN_LOCAL = "true";
  expect(
    await verificarAcceso(new Request("http://localhost/admin"), env, true),
  ).toBe(env.CORREO_ADMIN);
  expect(
    await verificarAcceso(
      new Request("https://www.iremosenbici.com/admin"),
      env,
      true,
    ),
  ).toBeNull();
  expect(
    await verificarAcceso(new Request("http://localhost/admin"), env, false),
  ).toBeNull();
  env.PERMITIR_ADMIN_LOCAL = "false";
  expect(
    await verificarAcceso(new Request("http://localhost/admin"), env, true),
  ).toBeNull();
  db.close();
});
it("bloquea mutaciones sin origen o de otros sitios", () => {
  const url = "https://www.iremosenbici.com/api/admin/contenido";
  expect(mismoOrigen(new Request(url, { method: "POST" }))).toBe(false);
  expect(
    mismoOrigen(
      new Request(url, {
        method: "POST",
        headers: { Origin: "https://otro.example" },
      }),
    ),
  ).toBe(false);
  expect(
    mismoOrigen(
      new Request(url, {
        method: "POST",
        headers: { Origin: "https://www.iremosenbici.com" },
      }),
    ),
  ).toBe(true);
});
