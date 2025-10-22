# ================================================================================
# FIX_TEMPLATE_DOCUMENTATION_REFERENCES.ps1
# Repariert Template-Referenzen und placeholder links in Dokumentation
# ================================================================================
param(
    [string]$DocsPath = ".\docs"
)

Write-Host "🔧 TEMPLATE REFERENCE REPAIR - START" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$DocsPath = Resolve-Path $DocsPath -ErrorAction SilentlyContinue
if (-not $DocsPath) {
    Write-Host "❌ Docs path not found!" -ForegroundColor Red
    exit 1
}

# Template-Referenzen die entfernt oder ersetzt werden müssen
$templateReplacements = @{
    # Placeholder-Links entfernen
    "'Related Document' -> ../path/file.md" = ""
    "'Required Reading' -> ../path/dependency.md" = ""
    "'Document Title' -> ../folder/file.md" = ""
    "'Related Concept' -> ../folder/file.md" = ""
    
    # Spezifische fehlerhafte Referenzen reparieren
    "'DOCS_SITEMAP.md' -> ../../DOCS_SITEMAP.md" = "'DOCS Sitemap' -> ../../INDEX.md"
    "'Migration 009' -> ../TIMESHEET-MIGRATION-009-010.md" = "'Migration 009' -> ./TIMESHEET-MIGRATION-009-010.md"
    "'Timesheet System Architecture' -> ../../02-architecture/TIMESHEET-SYSTEM-ARCHITECTURE.md" = "'Timesheet System Architecture' -> ../INDEX.md"
    "'SQLiteAdapter' -> ../FIELD-MAPPING-CONSISTENCY.md" = "'SQLite Adapter' -> ./FIELD-MAPPING-CONSISTENCY.md"
    "'TimesheetForm Component' -> ../../08-ui/components/TIMESHEETFORM-COMPONENT.md" = "'TimesheetForm Component' -> ../../04-ui/INDEX.md"
    
    # Korrigiere fehlerhafte GitHub-Referenzen  
    "'KI-SESSION-BRIEFING.prompt.md' -> ../.github/prompts/KI-SESSION-BRIEFING.prompt.md" = "'KI-SESSION-BRIEFING.prompt.md' -> ../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md"
    "'KI-SESSION-BRIEFING.prompt.md' -> ../../.github/prompts/KI-SESSION-BRIEFING.prompt.md" = "'KI-SESSION-BRIEFING.prompt.md' -> ../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md"
    
    # V1-5-2 System Referenzen korrigieren (veraltete Features)
    "'Beautiful Pastel Themes' -> V1-5-2-BEAUTIFUL-PASTEL-THEMES.md" = "'Theme System' -> ./final_THEME/MASTER_DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md"
    "'HeaderStatistics Component' -> V1-5-2-HEADERSTATISTICS-COMPONENT.md" = "'Header Statistics' -> ../../04-ui/INDEX.md"
    "'Enhanced Navigation System' -> V1-5-2-ENHANCED-NAVIGATION.md" = "'Navigation System' -> ../../ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md"
    
    # Korrigiere fehlerhafte Archive-Referenzen
    "'CSS_MODULARIZATION_SUCCESS_STORY.md' -> ../../../CSS_MODULARIZATION_SUCCESS_STORY.md" = "'CSS Modularization' -> ../../04-ui/INDEX.md"
    
    # Korrigiere Standard INDEX-Referenzen
    "'DATABASE-ARCHITECTURE-CURRENT-STATE.md' -> DATABASE-ARCHITECTURE-CURRENT-STATE.md" = "'Database Architecture' -> ../INDEX.md"
    "'NUMMERNKREISE.md' -> NUMMERNKREISE.md" = "'Numbering System' -> ../INDEX.md"
    "'LESSONS-LEARNED-SCHEMA-CONSISTENCY.md' -> LESSONS-LEARNED-SCHEMA-CONSISTENCY.md" = "'Schema Consistency' -> ../INDEX.md"
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
    
    # Für jede Template-Ersetzung
    foreach ($search in $templateReplacements.Keys) {
        $replacement = $templateReplacements[$search]
        
        if ($content -like "*$search*") {
            if ([string]::IsNullOrEmpty($replacement)) {
                # Wenn Replacement leer ist, entferne die ganze Zeile
                $lines = $content -split "`n"
                $newLines = @()
                foreach ($line in $lines) {
                    if ($line -notlike "*$search*") {
                        $newLines += $line
                    }
                }
                $content = $newLines -join "`n"
            } else {
                # Normale Ersetzung
                $content = $content -replace [regex]::Escape($search), $replacement
            }
            $fileModified = $true
            $totalReplacements++
            
            Write-Host "🔄 $($file.Name): $search" -ForegroundColor Yellow
        }
    }
    
    # Spezielle Bereinigungen für leere Referenz-Abschnitte
    $content = $content -replace "(?m)^\s*-\s*$", ""  # Entferne leere Listenpunkte
    $content = $content -replace "(?m)^\s*\*\s*$", ""  # Entferne leere Bullet Points
    $content = $content -replace "(?m)^### Verweise\s*\n\s*\n", ""  # Entferne leere Verweise-Abschnitte
    $content = $content -replace "(?m)^## Referenzen\s*\n\s*\n", ""  # Entferne leere Referenzen-Abschnitte
    
    # Mehrfache Leerzeilen reduzieren
    $content = $content -replace "(?m)\n\n\n+", "`n`n"
    
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
    Write-Host "✅ SUCCESS: All template references have been cleaned up!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  INFO: No template references needed fixing." -ForegroundColor Blue
}

Write-Host "🔧 TEMPLATE REFERENCE REPAIR - COMPLETE" -ForegroundColor Cyan