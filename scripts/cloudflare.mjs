import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const raiz = fileURLToPath(new URL("../", import.meta.url));
const resultado = spawnSync(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url),
    ),
    ...process.argv.slice(2),
  ],
  {
    cwd: raiz,
    stdio: "inherit",
    env: {
      ...process.env,
      XDG_CONFIG_HOME: fileURLToPath(
        new URL("../.wrangler/cuenta/", import.meta.url),
      ),
      CLOUDFLARE_ACCOUNT_ID: "1a9b246cafcf45c527a8061e7a3590ad",
    },
  },
);
process.exit(resultado.status ?? 1);
