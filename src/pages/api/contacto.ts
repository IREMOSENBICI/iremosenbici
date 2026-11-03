import type { APIRoute } from "astro";
import { entorno } from "../../server/env";
import { enviarContacto } from "../../server/contact";
export const POST: APIRoute = ({ request }) => enviarContacto(request, entorno);
