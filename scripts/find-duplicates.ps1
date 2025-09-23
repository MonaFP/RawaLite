# Skript zur Identifizierung potentieller Duplikate im Repository
$ErrorActionPreference = "SilentlyContinue"

# Ordner, die überprüft werden sollen
$excludeDirs = @(
    "node_modules",
    ".git",
    "dist",
    "dist-electron",
    "release"
)

# Dateitypen, die überprüft werden sollen (erweitert)
$filePatterns = @(
    "*.md",
    "*.ts",
    "*.tsx",
    "*.js",
    "*.jsx",
    "*.json",
    "*.yml",
    "*.html",
    "*.css",
    "*.scss",
    "*.svg",
    "*.png",
    "*.ico"
)

# Funktion zur Überprüfung, ob ein Pfad einen ausgeschlossenen Ordner enthält
function ShouldExclude($path) {
    foreach ($dir in $excludeDirs) {
        if ($path -like "*\$dir\*") {
            return $true
        }
    }
    return $false
}

Write-Host "Suche nach Duplikaten im Repository..." -ForegroundColor Cyan
Write-Host "Dies kann einen Moment dauern..." -ForegroundColor Yellow
Write-Host ""

# 1. Suche nach doppelten Dateinamen (unabhängig vom Pfad)
Write-Host "Überprüfe auf doppelte Dateinamen..." -ForegroundColor Cyan

$allFiles = foreach ($pattern in $filePatterns) {
    Get-ChildItem -Path . -Filter $pattern -File -Recurse | Where-Object { -not (ShouldExclude $_.FullName) }
}

$duplicateNames = $allFiles | Group-Object -Property Name | Where-Object { $_.Count -gt 1 }

Write-Host "Gefundene Dateinamen-Duplikate: $($duplicateNames.Count)" -ForegroundColor Yellow
foreach ($group in $duplicateNames) {
    Write-Host "`nDateiname: $($group.Name) ($($group.Count) Vorkommen)" -ForegroundColor Magenta
    foreach ($file in $group.Group) {
        Write-Host "  - $($file.FullName)" -ForegroundColor White
    }
}

# 2. Suche nach ähnlichen Ordnernamen
Write-Host "`n`nÜberprüfe auf ähnliche Ordnernamen..." -ForegroundColor Cyan

$allDirs = Get-ChildItem -Path . -Directory -Recurse | Where-Object { -not (ShouldExclude $_.FullName) }
$dirNames = $allDirs | ForEach-Object { $_.Name }
$similarDirs = @{}

foreach ($dir1 in $dirNames) {
    foreach ($dir2 in $dirNames) {
        if ($dir1 -ne $dir2 -and $dir1 -like "*$dir2*" -or $dir2 -like "*$dir1*") {
            if (-not $similarDirs.ContainsKey($dir1)) {
                $similarDirs[$dir1] = @()
            }
            if (-not $similarDirs[$dir1].Contains($dir2)) {
                $similarDirs[$dir1] += $dir2
            }
        }
    }
}

Write-Host "Ähnliche Ordnernamen gefunden: $($similarDirs.Keys.Count)" -ForegroundColor Yellow
foreach ($key in $similarDirs.Keys) {
    if ($similarDirs[$key].Count -gt 0) {
        Write-Host "`nOrdner '$key' ähnlich zu:" -ForegroundColor Magenta
        foreach ($similar in $similarDirs[$key]) {
            Write-Host "  - $similar" -ForegroundColor White
        }
    }
}

# 3. Suche nach doppelten JSON-Konfigurationsdateien
Write-Host "`n`nÜberprüfe auf ähnliche Konfigurationsdateien..." -ForegroundColor Cyan

$configFiles = Get-ChildItem -Path . -Filter "*.json" -File -Recurse | Where-Object { -not (ShouldExclude $_.FullName) -and $_.Name -like "*config*" }
Write-Host "Gefundene Konfigurationsdateien: $($configFiles.Count)" -ForegroundColor Yellow

if ($configFiles.Count -gt 1) {
    Write-Host "Potentiell ähnliche Konfigurationsdateien:" -ForegroundColor Magenta
    foreach ($file in $configFiles) {
        Write-Host "  - $($file.FullName)" -ForegroundColor White
    }
}

# 4. Suche nach doppelten Bildern (basierend auf Namen)
Write-Host "`n`nÜberprüfe auf doppelte Bilddateien..." -ForegroundColor Cyan

$imageFiles = Get-ChildItem -Path . -Include @("*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.ico") -File -Recurse | Where-Object { -not (ShouldExclude $_.FullName) }
$duplicateImages = $imageFiles | Group-Object -Property Name | Where-Object { $_.Count -gt 1 }

Write-Host "Gefundene Bild-Duplikate: $($duplicateImages.Count)" -ForegroundColor Yellow
foreach ($group in $duplicateImages) {
    Write-Host "`nBilddatei: $($group.Name) ($($group.Count) Vorkommen)" -ForegroundColor Magenta
    foreach ($file in $group.Group) {
        Write-Host "  - $($file.FullName)" -ForegroundColor White
    }
}

Write-Host "`nDuplikat-Analyse abgeschlossen!" -ForegroundColor Green

# Ausgabe zusammenfassende Statistik
Write-Host "`n=== Zusammenfassung ===" -ForegroundColor Cyan
Write-Host "Dateinamen-Duplikate: $($duplicateNames.Count)" -ForegroundColor Yellow
Write-Host "Ähnliche Ordnernamen: $($similarDirs.Keys.Count)" -ForegroundColor Yellow
Write-Host "Konfigurationsdateien: $($configFiles.Count)" -ForegroundColor Yellow
Write-Host "Bild-Duplikate: $($duplicateImages.Count)" -ForegroundColor Yellow
