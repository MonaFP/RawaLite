<#
.SYNOPSIS
  Repariert Installationen, bei denen `update-launcher.ps1` nur unter `resources/resources/` liegt.

.DESCRIPTION
  Kopiert die PowerShell-Datei in das Legacy-Ziel `resources/update-launcher.ps1`,
  damit ältere Builds (≤ 1.8.102) den Launcher starten können.

.EXAMPLE
  pwsh scripts/repair-update-launcher.ps1
#>

param(
  [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA 'Programs/rawalite')
)

$nested = Join-Path $InstallRoot 'resources/resources/update-launcher.ps1'
$root   = Join-Path $InstallRoot 'resources/update-launcher.ps1'

if (-not (Test-Path $InstallRoot)) {
  Write-Error "RawaLite Installation wurde nicht unter $InstallRoot gefunden."
  exit 1
}

if (-not (Test-Path $nested)) {
  Write-Warning "Keine verschachtelte update-launcher.ps1 gefunden. Keine Aktion erforderlich."
  exit 0
}

try {
  New-Item -ItemType Directory -Path (Split-Path $root) -Force | Out-Null
  Copy-Item -Path $nested -Destination $root -Force
  Write-Host "✅ Launcher repariert: $nested → $root"
} catch {
  Write-Error "❌ Kopie fehlgeschlagen: $($_.Exception.Message)"
  exit 1
}
