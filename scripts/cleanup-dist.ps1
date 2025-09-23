# Cleanup-Script für überflüssige dist-Ordner
$ErrorActionPreference = "SilentlyContinue"

# Liste der zu entfernenden Ordner
$foldersToRemove = @(
    'dist_backup',
    'dist_clean', 
    'dist_new', 
    'dist_new_1887', 
    'dist_old_1151'
)

# Information ausgeben
Write-Host "Folgende Ordner werden entfernt:" -ForegroundColor Yellow
foreach ($folder in $foldersToRemove) {
    $size = (Get-ChildItem -Path $folder -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "- $folder ($([math]::Round($size, 2)) MB)" -ForegroundColor Cyan
}

# Sicherheitsabfrage
$confirmation = Read-Host "Möchten Sie diese Ordner entfernen? (j/n)"

if ($confirmation -eq 'j') {
    foreach ($folder in $foldersToRemove) {
        if (Test-Path $folder) {
            Write-Host "Entferne $folder..." -ForegroundColor Green
            Remove-Item -Path $folder -Recurse -Force
            if (-not (Test-Path $folder)) {
                Write-Host "✅ $folder erfolgreich entfernt" -ForegroundColor Green
            } else {
                Write-Host "❌ Konnte $folder nicht vollständig entfernen" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️ $folder existiert nicht" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nBereinigung abgeschlossen!" -ForegroundColor Green
} else {
    Write-Host "Bereinigung abgebrochen." -ForegroundColor Yellow
}
