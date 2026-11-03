import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Entorno } from "../lib/types";
const verificadores = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function verificarAcceso(
  request: Request,
  env: Entorno,
  desarrollo = false,
): Promise<string | null> {
  const url = new URL(request.url);
  if (
    desarrollo &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
    env.PERMITIR_ADMIN_LOCAL === "true"
  )
    return env.CORREO_ADMIN;
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.CORREO_ADMIN)
    return null;
  const dominio = env.ACCESS_TEAM_DOMAIN.replace(/^https:\/\//, "").replace(
    /\/$/,
    "",
  );
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(dominio)) return null;
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return null;
  try {
    let llaves = verificadores.get(dominio);
    if (!llaves) {
      llaves = createRemoteJWKSet(
        new URL(`https://${dominio}/cdn-cgi/access/certs`),
      );
      verificadores.set(dominio, llaves);
    }
    const { payload } = await jwtVerify(token, llaves, {
      issuer: `https://${dominio}`,
      audience: env.ACCESS_AUD,
      algorithms: ["RS256"],
    });
    return typeof payload.email === "string" &&
      payload.email.toLowerCase() === env.CORREO_ADMIN.toLowerCase()
      ? payload.email
      : null;
  } catch {
    return null;
  }
}
export function mismoOrigen(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origen = request.headers.get("origin");
  return !!origen && origen === new URL(request.url).origin;
}
