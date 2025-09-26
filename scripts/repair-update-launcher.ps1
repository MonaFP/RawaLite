<#
.SYNOPSIS
  Aktualisiert den Update-Launcher einer bestehenden RawaLite-Installation.

.DESCRIPTION
  Kopiert die aktuelle `resources/update-launcher.ps1` aus diesem Repository in die
  installierte Anwendung (sowohl Legacy- als auch verschachtelten Pfad), damit ältere
  Builds (≤ 1.8.102) das neue Update-Verhalten nutzen.

.EXAMPLE
  pwsh scripts/repair-update-launcher.ps1
#>

param(
  [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA 'Programs/rawalite'),
  [string]$SourceLauncher = (Join-Path $PSScriptRoot '..' 'resources' 'update-launcher.ps1')
)

$root = Join-Path $InstallRoot 'resources/update-launcher.ps1'
$nested = Join-Path $InstallRoot 'resources/resources/update-launcher.ps1'

if (-not (Test-Path $InstallRoot)) {
  Write-Error "RawaLite Installation wurde nicht unter $InstallRoot gefunden."
  exit 1
}

if (-not (Test-Path $SourceLauncher)) {
  if (Test-Path $nested) {
    Write-Warning "Lokaler Launcher fehlt – verwende vorhandene verschachtelte Version."
    $SourceLauncher = $nested
  } else {
    Write-Error "Keine Launcher-Quelle gefunden (erwarte $SourceLauncher)."
    exit 1
  }
}

try {
  New-Item -ItemType Directory -Path (Split-Path $root) -Force | Out-Null
  Copy-Item -Path $SourceLauncher -Destination $root -Force
  Write-Host "✅ Launcher aktualisiert: $SourceLauncher → $root"

  if (Test-Path $nested) {
    Copy-Item -Path $SourceLauncher -Destination $nested -Force
    Write-Host "✅ Verschachtelte Kopie synchronisiert: $SourceLauncher → $nested"
  }
} catch {
  Write-Error "❌ Kopie fehlgeschlagen: $($_.Exception.Message)"
  exit 1
}
