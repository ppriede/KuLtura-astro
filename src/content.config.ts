import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const articulos = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articulos" }),
  schema: z.object({
    titulo: z.string(),
    categoria: z.enum(["musica", "arte", "literatura", "fotografia", "columnas"]),
    // YAML interpreta 2026-08-03 como Date; normalizar a "YYYY-MM-DD" (medianoche UTC = fecha correcta)
    fecha: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
      .transform((v) => (typeof v === "string" ? v : v.toISOString().slice(0, 10))),
    autor: z.string(),
    portada: z.string(),
    resumen: z.coerce.string().default(""),
    estado: z.enum(["publico", "privado", "archivado", "borrador"]).default("publico"),
    ocultar_portada: z.coerce.string().default("false"),
    ocultar_resumen: z.coerce.string().default("false"),
    ocultar_autor: z.coerce.string().default("true"),
  }),
});

export const collections = { articulos };
