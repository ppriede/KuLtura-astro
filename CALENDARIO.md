# CALENDARIO.md — Calendario de Eventos (integración completa)

> Documento de continuidad: captura el estado actual del calendario de eventos integrado en KuLtura-astro, las decisiones tomadas y cómo seguir desarrollando. Creado el 2026-08-28 tras integrar el trabajo hecho en `KuLtura-monitor-eventos`.

## 1. Qué es

Página pública `/calendario/` con todos los conciertos/eventos monitoreados, combinando **dos fuentes**:

| Fuente | Archivo origen | Color |
|---|---|---|
| **PortalTicket** (antes "KuLtura") | `eventos_nuevos_*.json` | Morado (`--accent`) |
| **Cooperativa.cl** | `cooperativa_conciertos_*.json` | Celeste (`#7ec8e3`) |

Características:
- FullCalendar 6 (CDN) con vistas **Mes / Semana / Lista**, locale español
- Eventos muestran **solo el nombre** (sin hora), título completo sin truncar
- **Lightbox** al hacer clic: título, fecha, lugar, link a ticket, badge de fuente
- Responde al **tema claro/oscuro** de KuLtura (usa las CSS variables del sitio)
- ~730+ eventos (agosto 2026 → julio 2027)

## 2. Arquitectura y flujo

```
KuLtura-monitor-eventos/                    (proyecto hermano, fuente de verdad)
├── eventos_nuevos_*.json                   ← raw PortalTicket (monitor)
├── cooperativa_conciertos_*.json           ← raw Cooperativa (monitor)
└── convertir_calendario.py                 ← normaliza + fusiona + parsea fechas
        │  genera
        ▼
    eventos_calendario.json  ──copiado a──▶  KuLtura-astro/public/eventos.json
                                                    │
                                                    ▼
        KuLtura-astro/src/pages/calendario.astro ◀── FullCalendar + lightbox
        KuLtura-astro/public/js/calendario.js   (lógica del calendario)
```

**Puntos clave:**
- `eventos_calendario.json` tiene estructura `{ generated, sources, total_events, events: [...] }`
- Cada evento: `{ slug, title, start (ISO), date_label, venue, url, source }`
- `public/eventos.json` se sirve estáticamente → **sin CORS** (mismo origen en deploy)
- El script `convertir_calendario.py` maneja: fechas con año ("Sábado 12 de septiembre 2026, 19:30"), fechas cortas sin año ("1 de agosto" → infiere 2026/2027 según mes actual), typo "setpiembre", venues con "-" residual, dedup por slug

## 3. Archivos involucrados en KuLtura-astro

| Archivo | Rol |
|---|---|
| `src/pages/calendario.astro` | Página; layout `Base.astro` + estilos FullCalendar con CSS vars del tema |
| `public/js/calendario.js` | Lógica: init FullCalendar, fetch `/eventos.json`, contadores por fuente, lightbox |
| `public/eventos.json` | Datos servidos al frontend (generado+copy) |
| `publicar.ps1` | Paso 1 nuevo: regenera calendario desde `../KuLtura-monitor-eventos/` y copia a `public/eventos.json` ANTES del build (fallback silencioso si el script no existe) |
| `test_calendario_astro.py` | Test Playwright de la página integrada (ver §6) |

## 4. Comandos de uso

```powershell
# Dev server + probar
cd C:\Users\pprie\OneDrive\DEV\KuLtura-astro
npx astro dev                      # → http://localhost:4321/calendario/
```

```powershell
# Regenerar datos (cuando llegan JSONs nuevos al monitor)
# Opción A: doble clic en KuLtura-monitor-eventos\regenerar.bat
# Opción B:
cd C:\Users\pprie\OneDrive\DEV\KuLtura-monitor-eventos
python convertir_calendario.py
copy eventos_calendario.json ..\KuLtura-astro\public\eventos.json
```

```powershell
# Publicar (build + commit + push + auto-deploy Cloudflare; regenera calendario solo)
.\publicar.ps1
```

## 5. Pitfalls ya resueltos (NO repetir)

1. **Astro + FullCalendar CDN**: los `<script src>` de CDN DEBEN llevar `is:inline` o Astro los bundleriza como módulos y FullCalendar no carga. El JS propio va en `public/js/calendario.js` (archivo estático, no pasa por el bundler).
2. **No usar `eventSources` con URL**: FullCalendar interpreta `{events:[...]}` como array plano y pierde todo. Usar el callback `events: function(fetchInfo, success, failure)` → `successCallback(data.events)`.
3. **CORS**: `fetch()` falla con `file://`. El standalone necesita `python -m http.server`; la versión Astro sirve el JSON desde `public/` (sin problema).
4. **Puertos Windows**: 8080 suele estar bloqueado; 8765 y 3000 funcionan.
5. **Drag & drop / evento.url**: `url` es propiedad nativa de FullCalendar; en el lightbox leer `event.url || extendedProps.url`.
6. **`fc-event-time` oculto**: CSS `display:none` para día/semana (solo nombre visible).
7. **Eventos multi-fecha** ("22, 23 y 24 de agosto", "28 y 29 de enero"): el parser NO los maneja; se loguean y quedan fuera (≈55 eventos). Zona de mejora futura (ver §7).
8. **Año en fechas cortas**: Cooperativa da "1 de agosto" sin año. Regla actual: mes ≥ mes actual → 2026, mes < → 2027. La cartelera cubre agosto 2026 → julio 2027.
9. **OneDrive**: verificar con `ls` tras copias (desincronización posible).

## 6. Test automatizado

```powershell
cd C:\Users\pprie\OneDrive\DEV\KuLtura-astro
# con dev server arriba:
python test_calendario_astro.py     # 14 checks: título, logo, conteo>100, badges,
                                    # FullCalendar render, eventos en grid, Semana,
                                    # lightbox (abre/venea/link/cierra Escape), footer
```

Requiere: `pip install playwright` + `playwright install chromium` (ya instalado).

## 7. Próximos pasos / ideas

- [ ] **Parsear eventos multi-fecha** ("22, 23 y 24 de agosto") → duplicar evento en cada día o tomar primera fecha
- [ ] Agregar link "Calendario" en la navegación/header del sitio (hoy la URL es directa)
- [ ] Filtrar por fuente o por comuna en la página
- [ ] Auto-commit del JSON cuando cambie (cron) para que el deploy recoja eventos sin intervención

## 8. Contexto de conversación (para continuar)

- Trabajo hecho en sesión Hermes (superagente-86) entre KuLtura-monitor-eventos y KuLtura-astro.
- El standalone `calendario.html` en KuLtura-monitor-eventos sigue existiendo como referencia rápida local; la versión integrada de Astro es la que se publica.
- Skill Hermes relacionado: `event-calendar-dashboard` (documenta el pipeline completo).
- Tema activo de la sesión: deepseek/deepseek-v4-flash-0731 (OpenRouter).