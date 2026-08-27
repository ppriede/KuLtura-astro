# KuLtura-astro

Fork de [KuLtura.cl](https://kultura.cl) — sitio estático con **Astro 6** (markdown como fuente de contenido). Desplegado en **Cloudflare Pages** con auto-deploy por push.

## Stack

| Capa | Detalle |
|------|---------|
| Framework | Astro 6 (estático) |
| CMS | Decap CMS v3 (local, sin OAuth) |
| Hosting | Cloudflare Pages (auto-deploy en cada push) |
| Contenido | Markdown con frontmatter español |
| Node | ^22.12.0 |

## Requisitos

- Node.js 22+ y npm
- Windows + PowerShell 5.1 (con salvedades, ver [Notas](#notas))

## Instalación

```powershell
npm install
```

Si npm bloquea los install-scripts de esbuild/sharp:

```powershell
npm install-scripts approve
# o bien:
npm rebuild esbuild sharp
```

## Flujo de trabajo

### 1️⃣ Editar contenido (Decap CMS local)

```powershell
# Terminal 1: proxy git local
npx decap-server

# Terminal 2: servidor de desarrollo
npm run dev
```

Luego abrir `http://localhost:4321/admin/`. Los cambios se commitean al repo local automáticamente al guardar.

El editor incluye un componente **YouTube**: inserta `@youtube <URL>`.

> **💡 Previsualizar desde otro dispositivo en la LAN / Zerotier:**
> ```powershell
> npm run dev -- --host 0.0.0.0
> ```
> Esto expone el servidor en todas las interfaces de red. Busca la IP del dispositivo anfitrión (WiFi, Zerotier, Tailscale) y desde el otro computador abre `http://<esa-ip>:4321/`.  
> ⚠️ Nota: solo sirve para previsualizar. La edición (Decap CMS) requiere `decap-server` local, no funciona remoto.

### 2️⃣ Publicar

```powershell
powershell -ExecutionPolicy Bypass -File publicar.ps1
```

Esto hace: **build estático → commit → push → auto-deploy en Cloudflare Pages**.

Para solo commit + push sin deploy manual:

```powershell
powershell -ExecutionPolicy Bypass -File publicar.ps1
```

(Por defecto el script hace solo build + commit + push; el auto-deploy de CF Pages se gatilla solo con el push.)

### 3️⃣ Creación con agente (IA)

Usar [CREAR.md](CREAR.md) para crear artículos desde un mensaje simple:

```
post: musica, https://www.youtube.com/watch?v=...
```

El agente extrae metadata, descarga portada y genera el artículo automáticamente.

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

- Schema Zod en `src/content.config.ts` (colección `articulos`). `fecha` se normaliza sola a `YYYY-MM-DD`; los `ocultar_*` son strings, no booleans.
- **Estados**: `publico` aparece en portada + enlace directo; `privado` solo enlace directo; `borrador` y `archivado` = 404.
- **Embeds YouTube**: `@youtube <URL>` en su propio párrafo se convierte en iframe youtube-nocookie.

## Pruebas

```powershell
npm test        # node --test (descubrimiento automático)
npm run build   # verificar build completo
```

## Notas

- **`node --test tests/` falla en Windows**: usar `node --test` pelado (descubrimiento automático).
- **PowerShell 5.1**: no soporta `&&` ni redirección `<`; usar `;` o `cmd /c`.
- Rama principal: `main`.
- El estado detallado del proyecto está en [`PLAN.md`](PLAN.md).



# Iniciar
```sh
npx decap-server
npx astro dev --host 0.0.0.0
```

# Tailscale con servicio
revisando con hermes

```sh
#veamos que hay configurado
tailscale serve status
tailscale serve status --json

```

```json
{
  "TCP": {
    "443": {
      "HTTPS": true
    }
  },
  "Web": {
    "ruidologo-rtx.tail67f654.ts.net:443": {
      "Handlers": {
        "/": {
          "Proxy": "http://127.0.0.1:8787"
        }
      }
    }
  }
}
```


```sh
# empezando a configurar
tailscale serve --service=svc:kultura --https=443 127.0.0.1:4321
```
En tailscale se tiene que crear el servicio, que tenga el mismo puerto



