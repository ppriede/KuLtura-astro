# PLAN.md — KuLtura-astro (fork Astro + Decap CMS)

Fork de KuLtura.cl (repo original: `ppriede/KuLtura.cl`, admin propio Express).
Este repo: https://github.com/ppriede/KuLtura-astro — sitio estático Astro + Decap CMS.

**Estado: Fases 1 y 2 COMPLETAS. Fases 3 y 4 pendientes.**

---

## Decidido con el usuario

- Repo nuevo `KuLtura-astro` (rama `main`), el repo original queda intacto
- Decap CMS con **GitHub OAuth** (no local_backend definitivo)
- **Paridad completa** de features con el sitio original
- **Auto-deploy por commit** en Cloudflare Pages (cada commit de Decap despliega)
- Orden de artículos: **fecha desc** (el reordenar manual ↑↓ del admin viejo se pierde; se puede emular con campo `orden` si se extraña)

---

## Hecho (Fases 1-2)

### Estructura

```
src/
  content.config.ts          # colección "articulos": glob loader + schema Zod
  content/articulos/*.md     # 9 artículos migrados (frontmatter español idéntico al original)
  layouts/Base.astro         # head, tema oscuro/claro (localStorage "kultura-tema"), encabezado, pie
  components/Tarjeta.astro   # tarjeta de portada (chip, fecha, resumen, autor condicionales, badge ✍️ columnas)
  pages/index.astro          # portada: grid + filtros como links (?categoria=x), solo estado "publico"
  pages/articulo/[slug].astro # artículo: archivado/borrador excluidos de getStaticPaths (404), privado accesible
  lib/shared.js              # CAT_LABELS, CAT_ORDER, formatFecha (fix zona horaria)
  remark-youtube.mjs         # plugin remark: párrafo "@youtube URL" -> iframe youtube-nocookie (exporta YT_ID_RE)
  styles/global.css          # CSS portado del original (se eliminó: esqueleto, pulso, reintentar — no aplican en estático)
public/images/               # logo.png + images/portadas/* (copiadas del repo original)
tests/                       # node --test: fecha.test.js, youtube.test.js (2/2)
```

### Schema Zod (`src/content.config.ts`)

Campos: `titulo`, `categoria` (enum musica/arte/literatura/fotografia/columnas), `fecha`,
`autor`, `portada`, `resumen` (default ""), `estado` (enum publico/privado/archivado/borrador,
default publico), `ocultar_portada`, `ocultar_resumen`, `ocultar_autor` (coerce string, defaults).

- **`fecha` se normaliza con transform**: YAML interpreta `2026-08-03` como Date; se convierte a
  string "YYYY-MM-DD" (`v.toISOString().slice(0, 10)` — medianoche UTC = fecha correcta).
  Esto también cubre el formato que escribirá Decap (datetime widget).
- Los `ocultar_*` son strings ("true"/"false") vía `z.coerce.string()` para tolerar booleans de Decap.

### Embeds de YouTube (`src/remark-youtube.mjs`)

- Sintaxis de contenido: `@youtube <URL>` (compatible con el sitio original).
- El plugin reemplaza el párrafo completo por `<div class="video"><iframe ...>` (mismo iframe
  youtube-nocookie y misma clase CSS que el original).
- **Gotcha resuelto**: remark-gfm auto-linkea la URL ANTES del plugin → hay que leer `c.url`
  de los nodos `link` (no solo `c.value`).

### Estados (paridad con el original)

| Estado    | Portada | Enlace directo |
|-----------|---------|----------------|
| publico   | sí      | sí             |
| privado   | no      | sí             |
| borrador  | no      | no (404)       |
| archivado | no      | no (404)       |

### Verificación (todo verde al cierre)

- `npm test` → 2/2 (fecha sin desfase UTC, regex YT_ID_RE)
- `npm run build` → dist/ con 9 páginas de artículo + index
- Smoke sobre `npx serve dist`: 9 tarjetas, iframes correctos, portada oculta respetada,
  autor oculto por defecto, 404 en slug inexistente, fecha "16 de agosto de 2026" (sin correrse)

---

## Pendiente

### Fase 3 — Decap CMS

1. `public/admin/index.html` (SPA de Decap, CDN: `decap-cms-app` + netlify-identity opcional)
   y `public/admin/config.yml`:
   - `backend: github`, repo `ppriede/KuLtura-astro`, branch `main`
   - `media_folder: public/images/portadas`, `public_folder: /images/portadas`
   - Colección `articulos` espejo del schema Zod: titulo (string), categoria (select),
     fecha (datetime), autor (string), portada (image con `choose_url` para pegar URL de
     i.ytimg.com), resumen (text opcional), estado (select con los 4), 3 booleans ocultar_*
   - `local_backend: true` para probar en dev sin OAuth
2. **Editor component "YouTube"** (`CMS.registerEditorComponent`) para el cuerpo markdown:
   - `pattern` compatible con `@youtube <URL>` (usar `YT_ID_RE` exportado de remark-youtube.mjs)
   - `fromBlock` re-detecta el bloque al reabrir; `toBlock` serializa `@youtube URL`;
     `toPreview` muestra miniatura/iframe
   - Referencia oficial: decapcms.org/docs/hugo (ejemplo shortcode gist)
3. Nota: los archivos .md viven en `src/content/articulos/` — Decap media_folder apunta a
   `public/`, pero la colección escribe en `src/content/` (carpetas distintas, ambos dentro
   del repo; Decap commitea ambos).

### Fase 4 — OAuth y deploy automático

1. **Paso manual del usuario** (requiere su cuenta GitHub): crear GitHub OAuth App
   (Settings → Developer settings → OAuth Apps):
   - Homepage URL: la URL del sitio en Cloudflare Pages (o http://localhost:6466 en dev)
   - Authorization callback URL: `https://<sitio>/admin/`
   - El Client ID se usa en `config.yml` (`backend.github` usa OAuth implícito de Decap)
   - El Client Secret NO se necesita en Decap (flujo de código OAuth implícito)
2. Cloudflare Pages:
   - Conectar repo `ppriede/KuLtura-astro` → build command `npm run build`, output `dist/`
   - Auto-deploy por commit: al activar "builds on push", cada commit de Decap despliega
   - `site` en `astro.config.mjs` está en `https://kultura.cl` — ajustar al dominio real del
     proyecto Pages si es otro
3. Redirecciones (opcional): los links viejos `articulo.html#id=x` se pueden mapear con
   `public/_redirects` de CF Pages si se quiere preservar URLs antiguas
4. Documentar en README (no existe todavía — el usuario pidió PLAN.md, README pendiente):
   uso local (`npm run dev`), flujo de edición (Decap → commit → deploy), OAuth

### Abierto (menor)

- Revisar frontmatter de `hesse-kassel-sancho-plagio-y-matar-al-presidente-rojas-en-vivo.md`
  (artículo que el usuario agregó; build pasó el schema, pero no se revisó su contenido)
- Decidir si mantener la sintaxis `@youtube` o migrar a `{{< youtube ID >}}` estilo Hugo
  (el usuario la conoce; con el editor component ambas son equivalentes)
- Si se necesita reordenar manual: agregar campo `orden: number` al schema y sort combinado

---

## Gotchas del entorno (Windows + PS 5.1)

- **`node --test` NO acepta directorio** (`node --test tests/` falla) — usar `node --test`
  pelado (descubrimiento automático de `*.test.js`)
- **PS 5.1**: no soporta `&&` ni redirección `<`; usar `;` / `cmd /c` / piping
- **Astro 6.4.8**: `markdown.remarkPlugins` está deprecated pero FUNCIONA (validate.js lo
  migra al processor internamente). El nuevo `markdown.processor: unified({...})` NO se
  cableó en esta versión — comentario `ponytail:` en astro.config.mjs para migrar en v7
- **npm install-scripts**: este npm bloquea scripts de install (esbuild/sharp) — si el build
  de Cloudflare Pages falla por eso, revisar `npm install-scripts approve` o usar
  `npm rebuild esbuild sharp`
- La rama local se creó como `master` y se renombró a `main` con `git branch -M main`

---

## Comandos

```powershell
npm run dev      # dev server con HMR
npm run build    # build estático a dist/
npm test         # node --test (2 tests)
npx serve dist   # previsualizar el build
```

Próximo paso sugerido: Fase 3 (Decap) — no depende de la OAuth App para arrancar con
`local_backend: true`.
