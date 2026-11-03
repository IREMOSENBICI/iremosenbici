import { env } from "cloudflare:workers";
import type { Entorno } from "../lib/types";
export const entorno = env as unknown as Entorno;
