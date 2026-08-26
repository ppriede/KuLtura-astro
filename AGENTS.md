# AGENTS.md — KuLtura-astro

Sitio estático Astro 6 (fork de KuLtura.cl). **Leer PLAN.md primero**: es la fuente de verdad de estado/fases. Frontmatter, UI y labels van en español.

## Comandos

```powershell
npm run dev      # dev server HMR
npm run build    # build estático a dist/
npm test         # node --test (descubrimiento auto de tests/*.test.js)
npx serve dist   # previsualizar build
npx decap-server # (Fase 3) proxy git local para probar Decap sin OAuth
```

- **`node --test tests/` FALLA en esta máquina** (no acepta directorio) — usar `node --test` pelado.
- **PowerShell 5.1**: sin `&&` ni redirección `<`; usar `;`, `cmd /c`, o piping.
- Sin lint/typecheck configurado. `npm test` + `npm run build` es la verificación completa.
- npm local bloquea install-scripts (esbuild/sharp): si el build falla por eso, `npm install-scripts approve` o `npm rebuild esbuild sharp`.

## Contenido

- **CREAR.md**: formato de entrada para crear artículos desde un mensaje simple (`post: <categoria>, <URL>` → artículo + portada descargada).

- Artículos: `src/content/articulos/*.md`. Schema Zod en `src/content.config.ts` (colección `articulos`). Cualquier cambio de schema espejarlo luego en `public/admin/config.yml` (Decap, Fase 3) — ambos deben coincidir.
- Campos: `titulo`, `categoria` (musica/arte/literatura/fotografia/columnas), `fecha`, `autor`, `portada`, `resumen` (default ""), `estado` (publico/privado/archivado/borrador, default publico), `ocultar_portada/resumen` (default "false"), `ocultar_autor` (default **"true"** — el autor va oculto salvo que se ponga "false").
- **`ocultar_*` son strings** ("true"/"false") via `z.coerce.string()` para tolerar booleans de Decap. No asumir booleans.
- **`fecha`**: YAML la interpreta como Date → transform normaliza a "YYYY-MM-DD" (medianoche UTC = correcta). No re-formatear a mano.
- Estados: publico en portada + link directo; privado solo link directo; borrador/archivado = 404. `[slug].astro` los excluye de getStaticPaths.

## Embeds YouTube (`src/remark-youtube.mjs`)

- Sintaxis en markdown: `@youtube <URL>` en su propio párrafo.
- **Gotcha**: remark-gfm auto-linkea la URL ANTES del plugin — el plugin lee `c.url` de nodos `link`, no solo `c.value`. No "arreglar" eso.
- `YT_ID_RE` exportado para reusar en el editor component de Decap (Fase 3).

## Config / quirks

- `astro.config.mjs`: `markdown.remarkPlugins` está deprecated en Astro 6 pero FUNCIONA (validate.js lo migra). No migrar a `processor: unified({...})` — no está cableado en esta versión (comentario `ponytail:`). `site` apunta a `https://kultura.cl` (ajustar al dominio real de CF Pages).
- Fechas renderizadas con `formatFecha` en `src/lib/shared.js` (arma Date en hora local para no correrse 1 día al oeste de UTC). Usar ese helper, no `toLocaleDateString` directo sobre Date UTC.
- Rama `main` (se renombró desde `master` local).
- Decap (Fase 3): `public/admin/config.yml` (backend github `ppriede/KuLtura-astro`, `local_backend: true`) + página admin en `src/pages/admin/index.astro` (NO en public/: Astro 6 dev no sirve directory index de public/ → `/admin/` daba 404). **Ambos scripts llevan `is:inline`** (Astro empaqueta scripts sino — el CDN de Decap se rompía). **El `<link rel="cms-config-url">` apunta a `/admin/config.yml`** — sin él Decap resuelve config.yml relativo a la página y `/admin` sin slash final da 404. Editor component YouTube inline; regex de ID **duplicado** (espejo de `YT_ID_RE`) — no importable desde `src/` (ESM fuera de public/). Si cambia un regex, cambiar ambos.
- Para probar Decap en dev: `npx decap-server` en una terminal + `npm run dev` en otra → `/admin/`.
- Fase 4 (OAuth, CF Pages auto-deploy) aún no implementada — ver PLAN.md.
- `README.md` duplica comandos/schema/contenido — si algo de eso cambia, actualizar ambos.
