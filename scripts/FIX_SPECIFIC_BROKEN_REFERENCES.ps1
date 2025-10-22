# ================================================================================
# FIX_SPECIFIC_BROKEN_REFERENCES.ps1  
# Repariert spezifische gebrochene Referenzen aus Validierungs-Output
# ================================================================================
param(
    [string]$DocsPath = ".\docs"
)

Write-Host "🔧 SPECIFIC BROKEN REFERENCES REPAIR - START" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$DocsPath = Resolve-Path $DocsPath -ErrorAction SilentlyContinue
if (-not $DocsPath) {
    Write-Host "❌ Docs path not found!" -ForegroundColor Red
    exit 1
}

# Spezifische Reparaturen basierend auf Validierungs-Output
$specificFixes = @{
    # DOCS_SITEMAP Referenzen reparieren
    "'../../DOCS_SITEMAP.md' -> ../../DOCS_SITEMAP.md" = "'DOCS Index' -> ../../INDEX.md"
    
    # KI-SESSION-BRIEFING Pfad-Korrekturen  
    "KI-SESSION-BRIEFING.prompt.md' -> ../.github/prompts/KI-SESSION-BRIEFING.prompt.md" = "KI-SESSION-BRIEFING.prompt.md' -> ../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md"
    "KI-SESSION-BRIEFING.prompt.md' -> ../../.github/prompts/KI-SESSION-BRIEFING.prompt.md" = "KI-SESSION-BRIEFING.prompt.md' -> ../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md"
    
    # V1-5-2 veraltete Referenzen korrigieren
    "Beautiful Pastel Themes' -> V1-5-2-BEAUTIFUL-PASTEL-THEMES.md" = "Theme System' -> ./final_THEME/MASTER_DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md"
    "HeaderStatistics Component' -> V1-5-2-HEADERSTATISTICS-COMPONENT.md" = "Header Statistics' -> ../../04-ui/INDEX.md"  
    "Enhanced Navigation System' -> V1-5-2-ENHANCED-NAVIGATION.md" = "Navigation System' -> ../../ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md"
    
    # MASTER-DATABASE-THEME-SYSTEM Referenzen reparieren
    "MASTER_DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md' -> MASTER_DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md" = "MASTER Database Theme System' -> ../../ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md"
    
    # CSS_MODULARIZATION_SUCCESS_STORY korrigieren
    "CSS_MODULARIZATION_SUCCESS_STORY.md' -> ../../../CSS_MODULARIZATION_SUCCESS_STORY.md" = "CSS Modularization' -> ../../04-ui/INDEX.md"
    
    # Timesheet System Referenzen
    "Migration 009' -> ../TIMESHEET-MIGRATION-009-010.md" = "Migration 009' -> ./solved/TIMESHEET-MIGRATION-009-010.md"
    "Timesheet System Architecture' -> ../../02-architecture/TIMESHEET-SYSTEM-ARCHITECTURE.md" = "Timesheet System' -> ../INDEX.md"
    "SQLiteAdapter' -> ../FIELD-MAPPING-CONSISTENCY.md" = "SQLite Adapter' -> ./FIELD-MAPPING-CONSISTENCY.md"
    "TimesheetForm Component' -> ../../08-ui/components/TIMESHEETFORM-COMPONENT.md" = "TimesheetForm Component' -> ../../04-ui/INDEX.md"
}

# Dateien die komplett entfernt werden sollen (Template-Referenzen)
$templatesToRemove = @(
    "'Related Document' -> ../path/file.md",
    "'Required Reading' -> ../path/dependency.md", 
    "'Document Title' -> ../folder/file.md",
    "'Related Concept' -> ../folder/file.md"
)

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
    
    # Template-Referenzen entfernen
    foreach ($template in $templatesToRemove) {
        if ($content -like "*$template*") {
            # Entferne die ganze Zeile mit dieser Template-Referenz
            $lines = $content -split "`n"
            $newLines = @()
            foreach ($line in $lines) {
                if ($line -notlike "*$template*") {
                    $newLines += $line
                }
            }
            $content = $newLines -join "`n"
            $fileModified = $true
            $totalReplacements++
            Write-Host "🗑️  $($file.Name): Removed template: $template" -ForegroundColor Red
        }
    }
    
    # Spezifische Fixes anwenden
    foreach ($search in $specificFixes.Keys) {
        $replacement = $specificFixes[$search]
        
        if ($content -like "*$search*") {
            $content = $content -replace [regex]::Escape($search), $replacement
            $fileModified = $true
            $totalReplacements++
            Write-Host "🔄 $($file.Name): $search" -ForegroundColor Yellow
        }
    }
    
    # Bereinigungen
    $content = $content -replace "(?m)^\s*-\s*$", ""  # Entferne leere Listenpunkte
    $content = $content -replace "(?m)^\s*\*\s*$", ""  # Entferne leere Bullet Points
    $content = $content -replace "(?m)\n\n\n+", "`n`n"  # Mehrfache Leerzeilen reduzieren
    
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
    Write-Host "✅ SUCCESS: All specific broken references have been repaired!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  INFO: No specific broken references needed fixing." -ForegroundColor Blue
}

Write-Host "🔧 SPECIFIC BROKEN REFERENCES REPAIR - COMPLETE" -ForegroundColor Cyan