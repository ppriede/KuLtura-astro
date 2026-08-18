import { defineConfig } from "astro/config";
import { remarkYoutube } from "./src/remark-youtube.mjs";

export default defineConfig({
  site: "https://kultura.cl",
  // ponytail: remarkPlugins está deprecated en v6 pero validate.js lo migra al processor; migrar a unified({...}) al subir a v7
  markdown: { remarkPlugins: [remarkYoutube] },
});
