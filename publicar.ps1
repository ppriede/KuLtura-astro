# publicar.ps1 — build + commit + sync + deploy de KuLtura-astro (Astro 6)
# Uso: powershell -ExecutionPolicy Bypass -File publicar.ps1
#   Por defecto: build + commit + push (auto-deploy de Cloudflare Pages)
#   -Message <texto> : mensaje del commit (opcional; si se omite, pide interactivo)
#   -Deploy          : además, deploy manual a Cloudflare Pages
#   -Force           : deploy manual aunque no haya cambios en dist/
param(
  [string]$Message,
  [switch]$Deploy,
  [switch]$Force
)
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== Publicar KuLtura-astro ===" -ForegroundColor Cyan

# 1. Regenerar calendario de eventos
Write-Host "`nRegenerando calendario de eventos..." -ForegroundColor Cyan
$monitorDir = Join-Path $PSScriptRoot "..\KuLtura-monitor-eventos"
$monitorScript = Join-Path $monitorDir "convertir_calendario.py"
$destino = Join-Path $PSScriptRoot "public\eventos.json"
if (Test-Path $monitorScript) {
  python $monitorScript
  if ($LASTEXITCODE -eq 0) {
    $jsonSrc = Join-Path $monitorDir "eventos_calendario.json"
    if (Test-Path $jsonSrc) {
      Copy-Item $jsonSrc $destino -Force
      Write-Host "  → Calendario copiado a public/eventos.json" -ForegroundColor Green
    }
  } else {
    Write-Host "  ⚠ Script de eventos falló, se usará versión anterior si existe." -ForegroundColor Yellow
  }
} else {
  Write-Host "  ⚠ No se encontró $monitorScript, se usará versión anterior si existe." -ForegroundColor Yellow
}

# 2. Verificar repositorio git
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "No es un repositorio git: $PSScriptRoot" -ForegroundColor Red
  exit 1
}

# 2. Verificar cambios pendientes
$cambios = git status --porcelain
if (-not $cambios) {
  Write-Host "Sin cambios pendientes. Nada que publicar." -ForegroundColor Green
  exit 0
}
Write-Host "Cambios pendientes:" -ForegroundColor Yellow
$cambios

# 3. Build
Write-Host "`nGenerando build estático..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build falló. Revisa errores arriba." -ForegroundColor Red
  exit 1
}
Write-Host "Build OK en dist/." -ForegroundColor Green

# 4. Mensaje del commit
if ($Message) {
  $mensaje = $Message.Trim()
} else {
  $mensaje = Read-Host "Mensaje del commit (Enter = actualización de contenido)"
  $mensaje = $mensaje.Trim()
}
if (-not $mensaje) { $mensaje = "actualización de contenido" }
if ($mensaje.Length -gt 120) { $mensaje = $mensaje.Substring(0, 120).TrimEnd() }

# 5. Commit
git add -A
if ($LASTEXITCODE -ne 0) {
  Write-Host "git add falló." -ForegroundColor Red
  exit 1
}
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "No hay cambios para commitear." -ForegroundColor Yellow
  exit 0
}
$mensaje | git commit -F -
if ($LASTEXITCODE -ne 0) {
  Write-Host "Commit falló." -ForegroundColor Red
  exit 1
}
Write-Host "Commit creado." -ForegroundColor Green

# 6. Push (gatilla auto-deploy de Cloudflare Pages)
$rama = git branch --show-current
git push origin $rama
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push falló — revisa credenciales (git credential-manager)." -ForegroundColor Red
  exit 1
}
Write-Host "Push a origin/$rama OK." -ForegroundColor Green
Write-Host "  → Auto-deploy en Cloudflare Pages iniciado." -ForegroundColor Cyan

# 7. Deploy manual a Cloudflare Pages (solo si se pide explícitamente)
if (-not $Deploy) {
  Write-Host "`nHecho. Usa -Deploy para deploy manual si el auto-deploy falla." -ForegroundColor Cyan
  exit 0
}

$confirma = Read-Host "`n¿Deploy manual a Cloudflare Pages? (s/N)"
if ($confirma -notmatch "^(s|y|si|sí)$") {
  Write-Host "Deploy manual cancelado." -ForegroundColor Yellow
  exit 0
}
npx wrangler pages deploy dist/ --project-name kultura-cl
if ($LASTEXITCODE -ne 0) {
  Write-Host "Deploy falló. Si es la primera vez ejecuta 'npx wrangler login' (o define CLOUDFLARE_API_TOKEN) y vuelve a correr." -ForegroundColor Red
  exit 1
}
Write-Host "Sitio publicado. OK" -ForegroundColor Green