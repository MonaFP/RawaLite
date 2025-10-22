# ================================================================================
# FIX_FINAL_DOCUMENTATION_ISSUES.ps1
# Repariert die letzten kritischen Dokumentations-Referenz-Probleme
# ================================================================================
param(
    [string]$DocsPath = ".\docs"
)

Write-Host "🔧 FINAL DOCUMENTATION ISSUES REPAIR - START" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$DocsPath = Resolve-Path $DocsPath -ErrorAction SilentlyContinue
if (-not $DocsPath) {
    Write-Host "❌ Docs path not found!" -ForegroundColor Red
    exit 1
}

# Finale kritische Reparaturen
$finalFixes = @{
    # DOCS_SITEMAP.md nicht existent - zu INDEX.md umleiten
    "../../DOCS_SITEMAP.md" = "../../INDEX.md"
    "DOCS_SITEMAP.md" = "INDEX.md"
    
    # Template-Referenzen komplett entfernen (diese müssen als ganze Zeilen entfernt werden)
    "Related Document.*../path/file\.md" = ""
    "Required Reading.*../path/dependency\.md" = ""
    "Document Title.*../folder/file\.md" = ""
    "Related Concept.*../folder/file\.md" = ""
    
    # V1-5-2 obsolete Features zu aktuellen Systemen umleiten
    "V1-5-2-BEAUTIFUL-PASTEL-THEMES.md" = "../../ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md"
    "V1-5-2-ENHANCED-NAVIGATION.md" = "../../ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md"
    "V1-5-2-HEADERSTATISTICS-COMPONENT.md" = "../../04-ui/INDEX.md"
    
    # CSS_MODULARIZATION_SUCCESS_STORY nicht existent
    "../../../CSS_MODULARIZATION_SUCCESS_STORY.md" = "../../04-ui/INDEX.md"
    
    # MASTER_DATABASE-THEME-SYSTEM lokale Referenzen korrigieren
    "MASTER_DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md" = "../../ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md"
    
    # GitHub Pfad-Korrekturen (ein Level zu wenig)
    "../.github/prompts/KI-SESSION-BRIEFING.prompt.md" = "../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md"
    "../../.github/prompts/KI-SESSION-BRIEFING.prompt.md" = "../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md"
}

$totalFilesProcessed = 0
$totalFilesFixed = 0
$totalReplacements = 0

# Alle Markdown-Dateien im docs-Ordner durchsuchen
$markdownFiles = Get-ChildItem -Path $DocsPath -Recurse -Filter "*.md" -File

foreach ($file in $markdownFiles) {
    $totalFilesProcessed++
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileModified = $false
    
    # Finale Fixes anwenden
    foreach ($search in $finalFixes.Keys) {
        $replacement = $finalFixes[$search]
        
        if ([string]::IsNullOrEmpty($replacement)) {
            # Template-Referenzen: Ganze Zeilen entfernen mit Regex
            $pattern = ".*$search.*\r?\n?"
            if ($content -match $pattern) {
                $content = $content -replace $pattern, ""
                $fileModified = $true
                $totalReplacements++
                Write-Host "🗑️  $($file.Name): Removed template line matching: $search" -ForegroundColor Red
            }
        } else {
            # Normale Ersetzung
            if ($content -like "*$search*") {
                $content = $content -replace [regex]::Escape($search), $replacement
                $fileModified = $true
                $totalReplacements++
                Write-Host "🔄 $($file.Name): $search -> $replacement" -ForegroundColor Yellow
            }
        }
    }
    
    # Finale Bereinigungen
    $content = $content -replace "(?m)^\s*-\s*$", ""  # Entferne leere Listenpunkte
    $content = $content -replace "(?m)^\s*\*\s*$", ""  # Entferne leere Bullet Points
    $content = $content -replace "(?m)\n\n\n+", "`n`n"  # Mehrfache Leerzeilen reduzieren
    $content = $content -replace "(?m)^### Verweise\s*\n\s*\n", ""  # Entferne leere Verweise-Abschnitte
    $content = $content -replace "(?m)^## Referenzen\s*\n\s*\n", ""  # Entferne leere Referenzen-Abschnitte
    
    if ($fileModified -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $totalFilesFixed++
        Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Green
    }
    
    # Progress Update alle 50 Dateien
    if ($totalFilesProcessed % 50 -eq 0) {
        Write-Host "📊 Progress: $totalFilesProcessed files processed..." -ForegroundColor Blue
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📄 Files processed: $totalFilesProcessed" -ForegroundColor Blue
Write-Host "🔧 Files fixed: $totalFilesFixed" -ForegroundColor Green  
Write-Host "🔄 Total replacements: $totalReplacements" -ForegroundColor Yellow

if ($totalFilesFixed -gt 0) {
    Write-Host "✅ SUCCESS: All final documentation issues have been repaired!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  INFO: No final documentation issues needed fixing." -ForegroundColor Blue
}

Write-Host "🔧 FINAL DOCUMENTATION ISSUES REPAIR - COMPLETE" -ForegroundColor Cyan