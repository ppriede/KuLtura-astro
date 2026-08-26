# PLAN.md — KuLtura-astro (fork Astro + Decap CMS)

Fork de KuLtura.cl (repo original: `ppriede/KuLtura.cl`, admin propio Express).
Este repo: https://github.com/ppriede/KuLtura-astro — sitio estático Astro + Decap CMS.

**Estado: Fases 1, 2 y 3 COMPLETAS. Mejoras en admin aplicadas. Fase 4 pendiente.**

---

## Decidido con el usuario

- Repo nuevo `KuLtura-astro` (rama `main`), el repo original queda intacto
- Decap CMS con **GitHub OAuth** (no local_backend definitivo)
- **Paridad completa** de features con el sitio original
- **Auto-deploy por commit** en Cloudflare Pages (cada commit de Decap despliega)
- Orden de artículos: **fecha desc** (el reordenar manual ↑↓ del admin viejo se pierde; se puede emular con campo `orden` si se extraña)

---

## Hecho (Fases 1-3)

### Estructura

```
src/
  content.config.ts          # colección "articulos": glob loader + schema Zod
  content/articulos/*.md     # 10 artículos migrados (frontmatter español idéntico al original)
  layouts/Base.astro         # head, tema oscuro/claro (localStorage "kultura-tema"), encabezado, pie
  components/Tarjeta.astro   # tarjeta de portada (chip, fecha, resumen, autor condicionales, badge ✍️ columnas)
  pages/index.astro          # portada: grid + filtros como links (?categoria=x), solo estado "publico"
  pages/articulo/[slug].astro # artículo: archivado/borrador excluidos de getStaticPaths (404), privado accesible
  lib/shared.js              # CAT_LABELS, CAT_ORDER, formatFecha (fix zona horaria)
  remark-youtube.mjs         # plugin remark: párrafo "@youtube URL" -> iframe youtube-nocookie (exporta YT_ID_RE)
  styles/global.css          # CSS portado del original (se eliminó: esqueleto, pulso, reintentar — no aplican en estático)
public/images/               # logo.png + images/portadas/* (copiadas del repo original)
public/admin/config.yml      # Decap CMS (Fase 3): backend github + colección espejo del schema
src/pages/admin/index.astro  # página admin de Decap (CDN + editor component YouTube, scripts is:inline)
tests/                       # node --test: fecha.test.js, youtube.test.js (2/2)
```

### Decap CMS (Fase 3)

- `src/pages/admin/index.astro`: SPA de Decap desde CDN (`unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js`),
  sin React UMD propio (el bundle completo incluye todo). Editor component "YouTube" registrado inline.
  **Va como página en src/pages, NO en public/**: Astro 6 dev no sirve el directory index de public/
  (`/admin/` daba 404). **Ambos scripts llevan `is:inline`** — sin eso Astro empaqueta los scripts
  en módulos `/_astro/*` y el CDN de Decap se rompe.
- `public/admin/config.yml`: backend github (`ppriede/KuLtura-astro`, `main`), `media_folder: public/images/portadas`,
  `public_folder: /images/portadas`, colección `articulos` espejo del schema Zod (fecha date-only
  `YYYY-MM-DD`, portada image con `choose_url`, estado select con default publico, 3 booleans ocultar_*).
- **Editor component YouTube**: `pattern /^@youtube\s+(.+)$/`, `fromBlock` tolera URL cruda o `[texto](url)`
  (el editor auto-linkea URLs), `toBlock` serializa `@youtube URL`, `toPreview` muestra miniatura
  i.ytimg.com. El regex de ID está duplicado inline (espejo de `YT_ID_RE`) — no se puede importar el
  .mjs de `src/` porque es ESM fuera de public/.
- **Prueba local sin OAuth**: `npx decap-server` (proxies git local, puerto 8081) + `npm run dev`
  → abrir `/admin/`. `local_backend: true` en config.yml.
- Los .md viven en `src/content/articulos/` (folder de la colección) mientras media sube a
  `public/images/portadas/` — carpetas distintas, Decap commitea ambas.
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

### Verificación (todo verde)

- `npm test` → 2/2 (fecha sin desfase UTC, regex YT_ID_RE)
- `npm run build` → dist/ con 12 páginas (index + 10 artículos + admin)
- Smoke sobre `npx serve dist`: 10 tarjetas, iframes correctos, portada oculta respetada,
  autor oculto por defecto, 404 en slug inexistente, fecha "16 de agosto de 2026" (sin correrse)

### Mejoras post-lanzamiento (aplicadas)

- **Orden en admin**: `sortable_fields: [titulo, fecha]` con `sort: "fecha:desc"` en config.yml
- **Campos booleanos opcionales**: `ocultar_portada`, `ocultar_resumen`, `ocultar_autor` con `required: false`
- **Título portada**: `KuLtura.cl` (sin subtítulo)
- **`publicar.ps1` actualizado**: build previo (`npm run build`) + deploy de `dist/` en vez de `public/`

---

## Pendiente

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
- **README.md desactualizado**: no refleja el flujo de publicación ni Fase 4 (pendiente de documentar)

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

Próximo paso sugerido: Fase 4 (OAuth + Cloudflare Pages) — requiere acciones manuales del usuario
(GitHub OAuth App, cuenta de CF).
