# KuLtura-astro

Fork de [KuLtura.cl](https://kultura.cl) — sitio estático con **Astro 6** (markdown como fuente de contenido). El estado del proyecto y las fases pendientes (Decap CMS, OAuth, deploy automático) están en [`PLAN.md`](PLAN.md).

## Requisitos

- Node.js (recomendado 20+) y npm
- Windows + PowerShell 5.1 funciona, con salvedades (ver [Notas](#notas))

## Instalación

```powershell
npm install
```

Si npm bloquea los install-scripts de esbuild/sharp y `npm run dev` o `npm run build` fallan por eso:

```powershell
npm install-scripts approve
# o bien:
npm rebuild esbuild sharp
```

## Uso

```powershell
npm run dev      # servidor de desarrollo con HMR
npm run build    # build estático a dist/
npx serve dist   # previsualizar el build producido
```

## Contenido

Los artículos viven en `src/content/articulos/*.md` con frontmatter en español:

```yaml
---
titulo: Título del artículo
categoria: musica        # musica | arte | literatura | fotografia | columnas
fecha: 2026-08-03
autor: Nombre Autor
portada: /images/portadas/archivo.jpg
resumen: Texto opcional
estado: publico          # publico | privado | archivado | borrador
ocultar_portada: "false"
ocultar_resumen: "false"
ocultar_autor: "true"
---
```

- El schema Zod está en `src/content.config.ts` (colección `articulos`). `fecha` se normaliza sola a `YYYY-MM-DD`; los `ocultar_*` son strings, no booleans.
- **Estados**: `publico` aparece en la portada y tiene enlace directo; `privado` solo enlace directo; `borrador` y `archivado` no se publican (404).
- **Embeds de YouTube**: un párrafo con `@youtube <URL>` se convierte en iframe (plugin en `src/remark-youtube.mjs`).

```markdown
@youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

## Edición con Decap CMS (local, sin OAuth)

El panel de administración vive en `/admin/` (Decap CMS vía CDN; página en `src/pages/admin/index.astro`, config en `public/admin/config.yml`). Para probarlo localmente:

```powershell
npx decap-server   # terminal 1: proxy git local (puerto 8081)
npm run dev        # terminal 2: servidor de desarrollo
```

Luego abrir `http://localhost:4321/admin/`. Con `local_backend: true` los cambios se commitean al repo local directamente. Los artículos se guardan en `src/content/articulos/` y las imágenes suben a `public/images/portadas/`.

El editor incluye un componente **YouTube**: inserta un bloque `@youtube <URL>` (la misma sintaxis que interpreta el build).

## Pruebas

```powershell
npm test        # node --test (descubrimiento automático de tests/*.test.js)
```

La verificación completa es `npm test` + `npm run build`.

## Notas

- **`node --test tests/` falla en Windows**: `node --test` no acepta el directorio como argumento; usar `node --test` pelado.
- **PowerShell 5.1**: no soporta `&&` ni redirección `<`; usar `;` o `cmd /c`.
- La rama principal es `main`.
