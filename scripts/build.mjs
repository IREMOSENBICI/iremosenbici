import { spawnSync } from "node:child_process";
const ambiente = process.argv[2];
if (!["produccion", "pruebas"].includes(ambiente))
  throw new Error("Ambiente no permitido");
const resultado = spawnSync(
  process.execPath,
  ["node_modules/astro/bin/astro.mjs", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CLOUDFLARE_ENV: ambiente === "produccion" ? "produccion" : "",
    },
  },
);
process.exit(resultado.status ?? 1);
