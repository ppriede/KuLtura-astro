import { defineConfig } from "astro/config";
import { remarkYoutube } from "./src/remark-youtube.mjs";

export default defineConfig({
  site: "https://kultura-cl.pages.dev",
  // ponytail: remarkPlugins está deprecated en v6 pero validate.js lo migra al processor; migrar a unified({...}) al subir a v7
  markdown: { remarkPlugins: [remarkYoutube] },
  vite: {
    server: {
      allowedHosts: [
        'kultura.tail67f654.ts.net',
        // Agrega aquí otros subdominios Tailscale de servicios si los tienes
      ],
    },
  },
});
