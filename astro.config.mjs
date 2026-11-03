import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://www.iremosenbici.com",
  output: "server",
  adapter: cloudflare({ imagesBindingName: "IMAGENES" }),
  integrations: [react()],
  session: false,
  security: { checkOrigin: true },
  devToolbar: { enabled: false },
});
