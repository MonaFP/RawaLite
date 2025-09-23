# Umfassendes Skript zur Bereinigung von Repository-Duplikaten

# 1. Bereinigung der Logo-Duplikate
Write-Host "=== Bereinigung der Logo-Duplikate ===" -ForegroundColor Cyan

$sourceLogo = ".\assets\rawalite-logo.png"
$rootLogo = ".\rawalite-logo.png"
$publicLogo = ".\public\rawalite-logo.png"

# Prüfe, ob das Logo im assets-Verzeichnis existiert
if (-not (Test-Path $sourceLogo)) {
    Write-Host "❌ Quelldatei nicht gefunden: $sourceLogo" -ForegroundColor Red
} else {
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
    
    # Prüfe, ob das Logo im public-Verzeichnis existiert
    if (Test-Path $publicLogo) {
        Write-Host "Logo im public-Verzeichnis wird beibehalten (wird für Vite benötigt)" -ForegroundColor Cyan
    }
}

# 2. Überprüfung der TypeScript-Konfigurationsdateien
Write-Host "`n=== Analyse der TypeScript-Konfigurationsdateien ===" -ForegroundColor Cyan

$mainTsConfig = ".\tsconfig.json"
$testsTsConfig = ".\tests\tsconfig.json"

if (Test-Path $mainTsConfig -and Test-Path $testsTsConfig) {
    Write-Host "Beide tsconfig.json Dateien scheinen notwendig zu sein:" -ForegroundColor Yellow
    Write-Host "- $mainTsConfig: Für das Hauptprojekt" -ForegroundColor White
    Write-Host "- $testsTsConfig: Für Test-Konfiguration" -ForegroundColor White
    Write-Host "Diese Dateien sollten beibehalten werden." -ForegroundColor Green
}

# 3. Überprüfung der db.ts Dateien
Write-Host "`n=== Analyse der db.ts Dateien ===" -ForegroundColor Cyan

$mainDbTs = ".\src\db.ts"
$sqliteDbTs = ".\src\persistence\sqlite\db.ts"

if (Test-Path $mainDbTs -and Test-Path $sqliteDbTs) {
    Write-Host "Beide db.ts Dateien haben unterschiedliche Funktionen:" -ForegroundColor Yellow
    Write-Host "- $mainDbTs: Hauptdatenbank-Export/Interface" -ForegroundColor White
    Write-Host "- $sqliteDbTs: SQLite-spezifische Implementation" -ForegroundColor White
    Write-Host "Diese Dateien sollten beibehalten werden." -ForegroundColor Green
}

# 4. Überprüfung der global.d.ts Dateien
Write-Host "`n=== Analyse der global.d.ts Dateien ===" -ForegroundColor Cyan

$rootGlobalDts = ".\src\global.d.ts"
$typesGlobalDts = ".\src\types\global.d.ts"

if (Test-Path $rootGlobalDts -and Test-Path $typesGlobalDts) {
    Write-Host "Mögliches Duplikat bei global.d.ts Dateien:" -ForegroundColor Yellow
    Write-Host "- $rootGlobalDts" -ForegroundColor White
    Write-Host "- $typesGlobalDts" -ForegroundColor White
    
    Write-Host "Überprüfe Inhalte..." -ForegroundColor Cyan
    
    try {
        $rootContent = Get-Content -Path $rootGlobalDts -Raw
        $typesContent = Get-Content -Path $typesGlobalDts -Raw
        
        if ($rootContent -eq $typesContent) {
            Write-Host "⚠️ Inhalte sind identisch. Eine der Dateien könnte entfernt werden." -ForegroundColor Yellow
            Write-Host "Empfehlung: Behalte $typesGlobalDts und entferne $rootGlobalDts" -ForegroundColor Cyan
        } else {
            Write-Host "✅ Die Dateien haben unterschiedliche Inhalte und sollten beide behalten werden." -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Fehler beim Vergleich der Dateien: $_" -ForegroundColor Red
    }
}

# 5. Überprüfung der vite-env.d.ts Dateien
Write-Host "`n=== Analyse der vite-env.d.ts Dateien ===" -ForegroundColor Cyan

$rootViteEnvDts = ".\vite-env.d.ts"
$srcViteEnvDts = ".\src\vite-env.d.ts"

if (Test-Path $rootViteEnvDts -and Test-Path $srcViteEnvDts) {
    Write-Host "Mögliches Duplikat bei vite-env.d.ts Dateien:" -ForegroundColor Yellow
    Write-Host "- $rootViteEnvDts" -ForegroundColor White
    Write-Host "- $srcViteEnvDts" -ForegroundColor White
    
    Write-Host "Überprüfe Inhalte..." -ForegroundColor Cyan
    
    try {
        $rootContent = Get-Content -Path $rootViteEnvDts -Raw
        $srcContent = Get-Content -Path $srcViteEnvDts -Raw
        
        if ($rootContent -eq $srcContent) {
            Write-Host "⚠️ Inhalte sind identisch. Eine der Dateien könnte entfernt werden." -ForegroundColor Yellow
            Write-Host "Empfehlung: Behalte $srcViteEnvDts und entferne $rootViteEnvDts" -ForegroundColor Cyan
        } else {
            Write-Host "✅ Die Dateien haben unterschiedliche Inhalte und sollten beide behalten werden." -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Fehler beim Vergleich der Dateien: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Bereinigung abgeschlossen! ===" -ForegroundColor Green
Write-Host "Einige Dateien wurden entfernt, andere als notwendige Duplikate identifiziert." -ForegroundColor Cyan
