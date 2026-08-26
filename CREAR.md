# CREAR.md — Creación de artículos (mensajes para agente)

Especificación del formato de entrada para que un agente IA cree artículos nuevos en KuLtura-astro. Recibe un mensaje simple y ejecuta las acciones necesarias para dejar el artículo listo (creado + build verificado).

Extensible: se pueden agregar nuevos tipos/categorías añadiendo secciones de acciones, sin romper las existentes.

## Sintaxis de entrada

```
post: <categoria>, <URL de YouTube>
```

- `categoria`: musica | arte | literatura | fotografia | columnas
- `URL`: cualquier URL de YouTube (watch, youtu.be, shorts). El ID se extrae con `YT_ID_RE` (`src/remark-youtube.mjs`).

Overrides opcionales:

```
post: <categoria>, <url>, autor: <nombre>, estado: <estado>
```

- `autor`: por defecto `KuLtura.cl`
- `estado`: publico | privado | borrador (default: publico)

## Acciones para `post` (video de YouTube)

1. **Metadata**: `yt-dlp -J --no-playlist <url>` → título en el campo `title`.
   (Si no está yt-dlp, usar oEmbed:
   `https://www.youtube.com/oembed?url=<url>&format=json` — el título trae sufijo
   " - YouTube", quitarlo.)
2. **Slug** desde el título: minúsculas, sin acentos (NFD → quitar diacríticos),
   no-alfanuméricos → `-`, colapsar guiones repetidos.
3. **Portada**: descargar miniatura a `public/images/portadas/<slug>.jpg`.
   Probar `https://i.ytimg.com/vi/<ID>/maxresdefault.jpg`; si es 404, usar `hqdefault.jpg`.
4. **Crear** `src/content/articulos/<slug>.md`:

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
- `fecha` string "YYYY-MM-DD" (el schema la normaliza sola si llega como Date).
- `ocultar_*` son strings; `ocultar_autor` omitido = oculto (default `"true"`).
- Cuerpo: `@youtube <URL>` en su propio párrafo (plugin `src/remark-youtube.mjs`).
- La portada vive en `public/images/portadas/` (mismo folder que usa Decap como `media_folder`).
- Después de crear, se puede publicar con `publicar.ps1` (build + commit + push → auto-deploy en Cloudflare Pages).
