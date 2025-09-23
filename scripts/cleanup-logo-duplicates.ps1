# Skript zur Bereinigung von Logo-Duplikaten

# 1. Behalte nur das Logo im assets-Verzeichnis (es ist kleiner und wahrscheinlich optimiert)
$sourceLogo = ".\assets\rawalite-logo.png"
$rootLogo = ".\rawalite-logo.png"

# Prüfe, ob das Logo im assets-Verzeichnis existiert
if (-not (Test-Path $sourceLogo)) {
    Write-Host "❌ Quelldatei nicht gefunden: $sourceLogo" -ForegroundColor Red
    exit 1
}

# Prüfe, ob das Logo im Root-Verzeichnis existiert
if (Test-Path $rootLogo) {
    Write-Host "Entferne Duplikat im Root-Verzeichnis: $rootLogo" -ForegroundColor Yellow
    Remove-Item -Path $rootLogo -Force
    
    if (-not (Test-Path $rootLogo)) {
        Write-Host "✅ Duplikat im Root-Verzeichnis erfolgreich entfernt" -ForegroundColor Green
    } else {
        Write-Host "❌ Fehler beim Entfernen des Duplikats im Root-Verzeichnis" -ForegroundColor Red
    }
}

# Überprüfe, ob ein symlink erstellt werden sollte
$createSymlink = Read-Host "Soll ein Symlink im Root-Verzeichnis erstellt werden? (j/n)"

if ($createSymlink -eq 'j') {
    try {
        New-Item -ItemType SymbolicLink -Path $rootLogo -Target $sourceLogo -Force
        Write-Host "✅ Symlink im Root-Verzeichnis erstellt" -ForegroundColor Green
    } catch {
        Write-Host "❌ Fehler beim Erstellen des Symlinks: $_" -ForegroundColor Red
    }
}

# 2. Überprüfe, ob das Logo im public-Verzeichnis benötigt wird
$publicLogo = ".\public\rawalite-logo.png"
if (Test-Path $publicLogo) {
    $keepPublic = Read-Host "Soll das Logo im public-Verzeichnis behalten werden? (j/n)"
    
    if ($keepPublic -ne 'j') {
        Write-Host "Entferne Duplikat im public-Verzeichnis: $publicLogo" -ForegroundColor Yellow
        Remove-Item -Path $publicLogo -Force
        
        if (-not (Test-Path $publicLogo)) {
            Write-Host "✅ Duplikat im public-Verzeichnis erfolgreich entfernt" -ForegroundColor Green
        } else {
            Write-Host "❌ Fehler beim Entfernen des Duplikats im public-Verzeichnis" -ForegroundColor Red
        }
    } else {
        Write-Host "Logo im public-Verzeichnis wird beibehalten" -ForegroundColor Cyan
    }
}

Write-Host "`nBereinigung abgeschlossen!" -ForegroundColor Green
