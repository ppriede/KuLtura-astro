# CREAR.md — Creación de artículos (mensajes para agente)

Especificación del formato de entrada para que un agente IA cree artículos nuevos en KuLtura-astro. Recibe un mensaje simple y ejecuta las acciones necesarias para dejar el artículo listo (creado + build verificado).

Extensible: se pueden agregar nuevos tipos/categorías añadiendo secciones de acciones, sin romper las existentes.

## Sintaxis de entrada

Dos formatos:

### ✅ Formato 1 — Título automático (desde YouTube)

```
post: <categoria>, <URL de YouTube>
```

El agente extrae el título del video vía `yt-dlp` o oEmbed.

### ✏️ Formato 2 — Título personalizado

```
post: <categoria>, <título personalizado>, <URL de YouTube>
```

El agente usa el título que le pasas en vez de extraerlo del video.

### En ambos formatos:

- `categoria`: musica | arte | literatura | fotografia | columnas
- `URL`: cualquier URL de YouTube (watch, youtu.be, shorts). El ID se extrae con `YT_ID_RE`.

Overrides opcionales (se agregan al final):

```
post: <categoria>, <URL>, autor: <nombre>, estado: <estado>
post: <categoria>, <título>, <URL>, autor: <nombre>, estado: <estado>
```

- `autor`: por defecto `KuLtura.cl`
- `estado`: publico | privado | borrador (default: publico)

## Acciones para `post` (video de YouTube)

1. **Detectar cuántos argumentos hay**: separar por coma.
   - Si son 2 → `categoria` + `URL` → extraer título del video (paso 2)
   - Si son 3 → `categoria` + `titulo` + `URL` → usar el título tal cual
   - Parsear overrides (`autor:`, `estado:`) al final
2. **Metadata** (solo si se auto-extrae título): `yt-dlp -J --no-playlist <url>` → `title`.
   (Sin yt-dlp, oEmbed: `https://www.youtube.com/oembed?url=<url>&format=json` — quitar
   sufijo " - YouTube")
3. **Slug** desde el título (auto-extraído o personalizado): minúsculas, sin acentos
   (NFD → quitar diacríticos), no-alfanuméricos → `-`, colapsar guiones repetidos.
4. **Portada**: descargar miniatura a `public/images/portadas/<slug>.jpg`.
   Probar `https://i.ytimg.com/vi/<ID>/maxresdefault.jpg`; si 404, usar `hqdefault.jpg`.
5. **Crear** `src/content/articulos/<slug>.md`:

```markdown
---
titulo: <título del video (auto o personalizado)>
categoria: <categoria>
fecha: <hoy, fecha local YYYY-MM-DD>
autor: <autor del override, si no "KuLtura.cl">
resumen:
portada: images/portadas/<slug>.jpg
ocultar_portada: "true"
ocultar_resumen: "true"
estado: <estado del override, si no publico>
---

@youtube <URL>
```

6. **Verificar**: `npm run build`. Si `<slug>.md` ya existe, no sobreescribir — avisar.

7. **Preguntar al usuario** si quiere publicar (commit + push). Si confirma, ejecutar:
   ```
   publicar.ps1 -Message "<título del artículo>"
   ```
   Si no, indicar que el artículo queda creado localmente y puede publicarse después.

## Notas

- `portada` va **sin** `/` inicial (`images/portadas/...`); `[slug].astro` le antepone `/`.
- `fecha` string "YYYY-MM-DD" (el schema la normaliza sola si llega como Date).
- `ocultar_*` son strings; `ocultar_autor` omitido = oculto (default `"true"`).
- Cuerpo: `@youtube <URL>` en su propio párrafo (plugin `src/remark-youtube.mjs`).
  **Expandir** enlaces cortos a su forma completa:
  - `https://youtu.be/ID` → `https://www.youtube.com/watch?v=ID`
  - Esto asegura compatibilidad con el editor component de Decap CMS y consistencia en todos los artículos.
- La portada vive en `public/images/portadas/` (mismo folder que usa Decap como `media_folder`).
- Después de crear, publicar con: `publicar.ps1 -Message "<título del artículo>"`.