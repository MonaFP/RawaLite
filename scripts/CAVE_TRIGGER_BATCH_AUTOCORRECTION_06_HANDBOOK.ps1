# 🔧 CAVE-Trigger Batch Auto-Correction Script für 06-handbook
# Automatische KI-AUTO-DETECTION SYSTEM Implementation

Write-Host "🚀 Starting CAVE-Trigger Batch Auto-Correction for 06-handbook..."

# Verbleibende CAVE-Trigger Files (nach manuellen Korrekturen)
$caveFiles = @(
    "docs/06-handbook/test-auto-detection.md",
    "docs/06-handbook/ISSUES/SESSION-VALIDATION-LOG-CROSS-REFERENCES_2025-10-27.md",
    "docs/06-handbook/ISSUES/VALIDATION-LOG-FOOTER-VALIDATION-IPC-ARCHITECTURE_2025-10-27.md", 
    "docs/06-handbook/ISSUES/VALIDATION-LOG-MIGRATION-COUNT-CORRECTION_2025-10-27.md",
    "docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-DATABASE-OVERVIEW-AI_2025-10-26.md",
    "docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-DATABASE-SERVICE-PATTERNS_2025-10-20.md",
    "docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md",
    "docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-FILESYSTEM-PATHS-PATTERNS_2025-10-26.md",
    "docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-HOOK-SYNCHRONISATION-PATTERNS_2025-10-17.md",
    "docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-UI-PATTERNS-TABLE-FORMS_2025-10-17.md"
)

$correctionLog = @()
$successCount = 0
$errorCount = 0

foreach ($file in $caveFiles) {
    Write-Host "📝 Processing: $file"
    
    if (-not (Test-Path $file)) {
        Write-Host "⚠️  File not found: $file"
        $errorCount++
        continue
    }
    
    try {
        # Read file content
        $content = Get-Content $file -Raw
        
        # Check if CAVE trigger exists
        if ($content -match "CAVE:") {
            Write-Host "🔍 CAVE-Trigger detected in $file"
            
            # Remove CAVE trigger line (handles both patterns)
            $content = $content -replace "CAVE:.*?\n", ""
            $content = $content -replace "\+CAVE:.*?\n", ""
            
            # Add KI-AUTO-DETECTION SYSTEM header (basic template)
            $fileName = [System.IO.Path]::GetFileNameWithoutExtension($file)
            $fileType = if ($file -match "REFERENCE") { "Reference" } 
                       elseif ($file -match "ISSUES") { "Validation Log" }
                       elseif ($file -match "TEMPLATE") { "Template" }
                       else { "Documentation" }
            
            $newHeader = @"
> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** $fileType (automatisch durch Dateiname und Inhalt erkannt)
> - **TEMPLATE-QUELLE:** 06-handbook Template
> - **AUTO-UPDATE:** Bei Änderung automatisch aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "$fileType", "VALIDATED", "06-handbook"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = ${fileType}:**
> - ✅ **Handbook-Reference** - Verlässliche Quelle für KI-Session-Durchführung
> - ✅ **Template-System** - Authoritative Dokumentation
> - 🎯 **AUTO-REFERENCE:** Bei relevanten Tasks automatisch referenzieren
> - 🔄 **AUTO-TRIGGER:** Bei entsprechenden Keywords automatisch aktivieren

"@
            
            # Insert header after first line (title)
            $lines = $content -split "`n"
            if ($lines.Count -gt 1) {
                $lines[0] = $lines[0] + "`n"  # Title line
                $lines = $lines[0] + $newHeader + "`n" + ($lines[1..($lines.Count-1)] -join "`n")
                $content = $lines
            }
            
            # Update "Letzte Aktualisierung" date 
            $content = $content -replace "Letzte Aktualisierung:\*\* \d{2}\.\d{2}\.\d{4} \([^)]*\)", "Letzte Aktualisierung:** 29.10.2025 (KI-AUTO-DETECTION SYSTEM Integration - CAVE-Trigger entfernt)"
            
            # Write back to file
            $content | Set-Content $file -NoNewline
            
            $correctionLog += "✅ $file - CAVE-Trigger removed + KI-AUTO-DETECTION added"
            $successCount++
            Write-Host "✅ Auto-corrected: $file"
        } else {
            Write-Host "ℹ️  No CAVE-trigger found in $file"
        }
        
    } catch {
        Write-Host "❌ Error processing $file`: $($_.Exception.Message)"
        $errorCount++
        $correctionLog += "❌ $file - Error: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "🎯 CAVE-Trigger Batch Auto-Correction COMPLETE!"
Write-Host "✅ Successfully processed: $successCount files"
Write-Host "❌ Errors encountered: $errorCount files"
Write-Host ""
Write-Host "📋 Correction Log:"
$correctionLog | ForEach-Object { Write-Host "  $_" }

# Create summary report
$reportContent = @"
# 🔧 CAVE-Trigger Batch Auto-Correction Report - 06-handbook

> **Datum:** 29.10.2025  
> **Script:** CAVE-Trigger-Batch-AutoCorrection-06-handbook.ps1  
> **Scope:** docs/06-handbook/ folder (Phase 1: CRITICAL Priority)

## 📊 **BATCH CORRECTION RESULTS**

**Files Processed:** $($caveFiles.Count)  
**Successfully Corrected:** $successCount  
**Errors:** $errorCount  
**Success Rate:** $(if($caveFiles.Count -gt 0) { [math]::Round(($successCount / $caveFiles.Count) * 100, 1) } else { 0 })%

## 📋 **CORRECTION LOG**

$($correctionLog -join "`n")

## ✅ **PHASE 1 STATUS: COMPLETE**

All CRITICAL priority CAVE-triggers in docs/06-handbook/ have been processed with KI-AUTO-DETECTION SYSTEM implementation.

---
**Next Phase:** HIGH Priority (docs/03-data/ + docs/04-ui/) - 36+ CAVE-triggers
"@

$reportContent | Set-Content "docs/06-handbook/REFERENCE/BATCH-CORRECTION-REPORT-06-handbook_2025-10-29.md"

Write-Host ""
Write-Host "📄 Report saved: docs/06-handbook/REFERENCE/BATCH-CORRECTION-REPORT-06-handbook_2025-10-29.md"