# CREAR.md — Creación de mensajes (artículos)

Especificación del formato de entrada para el agente de creación: recibe un mensaje
simple y ejecuta las acciones necesarias para publicar un artículo nuevo. Se expande
con nuevos tipos/categorías agregando secciones de acciones, sin romper las existentes.

## Sintaxis de entrada

```
post: <categoria>, <URL de YouTube>
```

- `categoria`: musica | arte | literatura | fotografia | columnas
- `URL`: cualquier URL de YouTube (watch, youtu.be, shorts). El ID se extrae con
  `YT_ID_RE` (`src/remark-youtube.mjs`).

Overrides opcionales (extensible):

```
post: <categoria>, <url>, autor: <nombre>, estado: <estado>
```

## Acciones para `post` (video de YouTube)

1. **Metadata**: `yt-dlp -J --no-playlist <url>` → título en el campo `title`.
   (yt-dlp está instalado en esta máquina. Sin él, oEmbed:
   `https://www.youtube.com/oembed?url=<url>&format=json` — el título trae sufijo
   " - YouTube", quitarlo.)
2. **Slug** desde el título: minúsculas, sin acentos (NFD → quitar diacríticos),
   no-alfanuméricos → `-`, colapsar guiones repetidos.
3. **Portada**: descargar miniatura a `public/images/portadas/<slug>.jpg`.
   Probar `https://i.ytimg.com/vi/<ID>/maxresdefault.jpg`; si es 404, usar `hqdefault.jpg`.
4. **Crear** `src/content/articulos/<slug>.md` (frontmatter espejo de
   `src/content.config.ts`):

```markdown
---
titulo: <título del video>
categoria: <categoria>
fecha: <hoy, fecha local YYYY-MM-DD>
autor: <autor del override, si no "KuLtura.cl">
resumen:
portada: images/portadas/<slug>.jpg
ocultar_portada: "false"
ocultar_resumen: "true"
estado: <estado del override, si no publico>
---

@youtube <URL>
```

5. **Verificar**: `npm run build`. Si `<slug>.md` ya existe, no sobreescribir — avisar.

## Notas

- `portada` va **sin** `/` inicial (`images/portadas/...`); `[slug].astro` le antepone `/`.
- `fecha` string "YYYY-MM-DD" (el schema la normaliza solo si llega como Date); `ocultar_*`
  son strings; `ocultar_autor` omitido = oculto (default "true").
- Cuerpo: `@youtube <URL>` en su propio párrafo (plugin `src/remark-youtube.mjs`).
- La portada vive en `public/images/portadas/` (mismo folder que usa Decap como
  `media_folder`).
