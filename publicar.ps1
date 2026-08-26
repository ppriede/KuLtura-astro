# publicar.ps1 — build + commit + sync + deploy de KuLtura-astro (Astro 6)
# Uso: powershell -ExecutionPolicy Bypass -File publicar.ps1
#   Por defecto: build + commit + push (auto-deploy de Cloudflare Pages)
#   -Deploy     : además, deploy manual a Cloudflare Pages (útil si el auto-deploy falla)
#   -Force      : deploy manual aunque no haya cambios en dist/
param(
  [switch]$Deploy,
  [switch]$Force
)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== Publicar KuLtura-astro ===" -ForegroundColor Cyan

# 1. Verificar repositorio git
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
$mensaje = Read-Host "Mensaje del commit (Enter = actualización de contenido)"
$mensaje = ($mensaje -replace "[`r`n`x00-`x1F]", " ").Trim()
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