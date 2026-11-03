import type { APIRoute } from "astro";
import { entorno } from "../server/env";
export const GET: APIRoute = () =>
  new Response(
    entorno.ENTORNO === "produccion"
      ? "User-agent: *\nDisallow: /admin\nDisallow: /api/admin/\nSitemap: https://www.iremosenbici.com/sitemap.xml\n"
      : "User-agent: *\nDisallow: /\n",
    { headers: { "Content-Type": "text/plain" } },
  );
