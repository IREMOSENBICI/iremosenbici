import type { APIRoute } from "astro";
import { entorno } from "../server/env";
import { viajesPublicos } from "../server/data";
export const GET: APIRoute = async () => {
  const urls = [
    "/",
    "/privacidad",
    ...(await viajesPublicos(entorno))
      .filter((v) => v.slug !== "venezuela-costa-rica")
      .map((v) => `/viajes/${encodeURIComponent(v.slug)}`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((p) => `<url><loc>https://www.iremosenbici.com${p}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
