# ============================================================================
# Batch-Umbenennung Dokumentationsdateien - RawaLite v1.0.42.5
# Basiert auf REVIEW_REFAKTOR.md Tabelle
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"
$BasePath = "c:\Users\ramon\Desktop\RawaLite\docs"

Write-Host "🔄 BATCH DOCUMENTATION RENAME SCRIPT" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Mode: $(if($DryRun) {'DRY RUN (no changes)'} else {'LIVE EXECUTION'})" -ForegroundColor $(if($DryRun) {'Yellow'} else {'Red'})
Write-Host "Base Path: $BasePath" -ForegroundColor Gray
Write-Host ""

# Zähler für Statistiken
$script:TotalFiles = 0
$script:RenamedFiles = 0
$script:SkippedFiles = 0
$script:ErrorFiles = 0

# Hilfsfunktion für sichere Umbenennung
function Rename-DocumentFile {
    param(
        [string]$OldPath,
        [string]$NewPath,
        [string]$Description
    )
    
    $script:TotalFiles++
    
    # Prüfe ob Quelldatei existiert
    if (-not (Test-Path $OldPath)) {
        Write-Host "⚠️  SKIP: $Description" -ForegroundColor Yellow
        Write-Host "     Source not found: $(Split-Path $OldPath -Leaf)" -ForegroundColor Gray
        $script:SkippedFiles++
        return
    }
    
    # Prüfe ob Zieldatei bereits existiert
    if (Test-Path $NewPath) {
        Write-Host "⚠️  SKIP: $Description" -ForegroundColor Yellow
        Write-Host "     Target exists: $(Split-Path $NewPath -Leaf)" -ForegroundColor Gray
        $script:SkippedFiles++
        return
    }
    
    # Führe Umbenennung durch
    try {
        if ($DryRun) {
            Write-Host "🔍 DRY: $Description" -ForegroundColor Cyan
        } else {
            Move-Item -Path $OldPath -Destination $NewPath -Force:$Force
            Write-Host "✅ DONE: $Description" -ForegroundColor Green
        }
        
        Write-Host "     $(Split-Path $OldPath -Leaf) → $(Split-Path $NewPath -Leaf)" -ForegroundColor Gray
        $script:RenamedFiles++
    }
    catch {
        Write-Host "❌ ERROR: $Description" -ForegroundColor Red
        Write-Host "     $($_.Exception.Message)" -ForegroundColor Red
        $script:ErrorFiles++
    }
    
    Write-Host ""
}

Write-Host "🎯 Starting systematic file renaming..." -ForegroundColor Green
Write-Host ""

# ============================================================================
# 01-CORE VERBLEIBENDE DATEIEN
# ============================================================================
Write-Host "📁 01-CORE Verbleibende Dateien" -ForegroundColor Magenta

Rename-DocumentFile `
    "$BasePath\01-core\final\STEP-03-09-IPC.md" `
    "$BasePath\01-core\final\VALIDATED_GUIDE-STEP-03-09-IPC-2025-10-15.md" `
    "01-core: STEP-03-09-IPC"

Rename-DocumentFile `
    "$BasePath\01-core\final\STEP-10-13-INTEGRATION.md" `
    "$BasePath\01-core\final\VALIDATED_GUIDE-STEP-10-13-INTEGRATION-2025-10-15.md" `
    "01-core: STEP-10-13-INTEGRATION"

Rename-DocumentFile `
    "$BasePath\01-core\final\SYSTEM-ANALYSIS-TODO-PLAN.md" `
    "$BasePath\01-core\final\WIP_PLAN-SYSTEM-ANALYSIS-TODO-2025-10-15.md" `
    "01-core: SYSTEM-ANALYSIS-TODO-PLAN"

Rename-DocumentFile `
    "$BasePath\01-core\final\TESTING-STANDARDS.md" `
    "$BasePath\01-core\final\VALIDATED_GUIDE-TESTING-STANDARDS-2025-10-15.md" `
    "01-core: TESTING-STANDARDS"

Rename-DocumentFile `
    "$BasePath\01-core\final\TIMESHEET-SYSTEM-ARCHITECTURE.md" `
    "$BasePath\01-core\final\VALIDATED_GUIDE-TIMESHEET-SYSTEM-ARCHITECTURE-2025-10-15.md" `
    "01-core: TIMESHEET-SYSTEM-ARCHITECTURE"

Rename-DocumentFile `
    "$BasePath\01-core\final\TIMESHEETS-ARCHITECTURE.md" `
    "$BasePath\01-core\final\VALIDATED_GUIDE-TIMESHEETS-ARCHITECTURE-2025-10-15.md" `
    "01-core: TIMESHEETS-ARCHITECTURE"

Rename-DocumentFile `
    "$BasePath\01-core\final\TROUBLESHOOTING.md" `
    "$BasePath\01-core\final\VALIDATED_GUIDE-TROUBLESHOOTING-CORE-2025-10-15.md" `
    "01-core: TROUBLESHOOTING"

Rename-DocumentFile `
    "$BasePath\01-core\final\UNRESOLVED-SQLITE-MIGRATION.md" `
    "$BasePath\01-core\final\WIP_REPORT-UNRESOLVED-SQLITE-MIGRATION-2025-10-15.md" `
    "01-core: UNRESOLVED-SQLITE-MIGRATION"

Rename-DocumentFile `
    "$BasePath\01-core\final\WORKFLOW-PROTOCOL.md" `
    "$BasePath\01-core\final\VALIDATED_GUIDE-WORKFLOW-PROTOCOL-2025-10-15.md" `
    "01-core: WORKFLOW-PROTOCOL"

Rename-DocumentFile `
    "$BasePath\01-core\final\WORKFLOWS.md" `
    "$BasePath\01-core\final\VALIDATED_GUIDE-WORKFLOWS-2025-10-15.md" `
    "01-core: WORKFLOWS"

# WIP Dateien
Rename-DocumentFile `
    "$BasePath\01-core\wip\BUILD_CACHE_PROCESS_MANAGEMENT.md" `
    "$BasePath\01-core\wip\WIP_GUIDE-BUILD-CACHE-PROCESS-MANAGEMENT-2025-10-15.md" `
    "01-core: BUILD_CACHE_PROCESS_MANAGEMENT"

Rename-DocumentFile `
    "$BasePath\01-core\wip\BUILD-INSTALLATION-MATRIX.md" `
    "$BasePath\01-core\wip\WIP_GUIDE-BUILD-INSTALLATION-MATRIX-2025-10-15.md" `
    "01-core: BUILD-INSTALLATION-MATRIX"

Rename-DocumentFile `
    "$BasePath\01-core\wip\ELECTRON-BUILDER-FILE-LOCKING.md" `
    "$BasePath\01-core\wip\WIP_FIX-ELECTRON-BUILDER-FILE-LOCKING-2025-10-15.md" `
    "01-core: ELECTRON-BUILDER-FILE-LOCKING"

Rename-DocumentFile `
    "$BasePath\01-core\wip\REACT-FALSY-GOTCHAS_TROUBLESHOOTING.md" `
    "$BasePath\01-core\wip\WIP_GUIDE-REACT-FALSY-GOTCHAS-TROUBLESHOOTING-2025-10-15.md" `
    "01-core: REACT-FALSY-GOTCHAS"

# ============================================================================
# 02-DEV DATEIEN
# ============================================================================
Write-Host "📁 02-DEV Dateien" -ForegroundColor Magenta

Rename-DocumentFile `
    "$BasePath\02-dev\final\ABI-SAFE-DATABASE-TOOLS.md" `
    "$BasePath\02-dev\final\VALIDATED_GUIDE-ABI-SAFE-DATABASE-TOOLS-2025-10-15.md" `
    "02-dev: ABI-SAFE-DATABASE-TOOLS"

Rename-DocumentFile `
    "$BasePath\02-dev\final\DATA-IMPORT-IMPLEMENTATION.md" `
    "$BasePath\02-dev\final\COMPLETED_IMPL-DATA-IMPORT-2025-10-15.md" `
    "02-dev: DATA-IMPORT-IMPLEMENTATION"

Rename-DocumentFile `
    "$BasePath\02-dev\final\DEV-PROD-SEPARATION-IMPLEMENTATION.md" `
    "$BasePath\02-dev\final\COMPLETED_IMPL-DEV-PROD-SEPARATION-2025-10-15.md" `
    "02-dev: DEV-PROD-SEPARATION-IMPLEMENTATION"

Rename-DocumentFile `
    "$BasePath\02-dev\final\IMPL-INDEX.md" `
    "$BasePath\02-dev\final\VALIDATED_REGISTRY-IMPL-INDEX-2025-10-15.md" `
    "02-dev: IMPL-INDEX"

Rename-DocumentFile `
    "$BasePath\02-dev\final\IMPL-RÜCKWÄRTSKOMPATIBILITÄT-IMPLEMENTATION-SUMMARY_11.10.2025.md" `
    "$BasePath\02-dev\final\COMPLETED_IMPL-RÜCKWÄRTSKOMPATIBILITÄT-SUMMARY-2025-10-11.md" `
    "02-dev: RÜCKWÄRTSKOMPATIBILITÄT"

# Continue with more 02-dev files...
Rename-DocumentFile `
    "$BasePath\02-dev\final\LESSONS-LEARNED-dev-prod-asset-loading-problems.md" `
    "$BasePath\02-dev\final\LESSON_FIX-DEV-PROD-ASSET-LOADING-PROBLEMS-2025-10-15.md" `
    "02-dev: LESSONS-LEARNED dev-prod-asset-loading"

Rename-DocumentFile `
    "$BasePath\02-dev\final\LESSONS-LEARNED-electron-html-loading-fehler.md" `
    "$BasePath\02-dev\final\LESSON_FIX-ELECTRON-HTML-LOADING-FEHLER-2025-10-15.md" `
    "02-dev: LESSONS-LEARNED electron-html-loading"

Rename-DocumentFile `
    "$BasePath\02-dev\final\LESSONS-LEARNED-typescript-unused-imports.md" `
    "$BasePath\02-dev\final\LESSON_FIX-TYPESCRIPT-UNUSED-IMPORTS-2025-10-15.md" `
    "02-dev: LESSONS-LEARNED typescript-unused-imports"

# ============================================================================
# STATISTIKEN
# ============================================================================
Write-Host "📊 BATCH RENAME SUMMARY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Total Files Processed: $($script:TotalFiles)" -ForegroundColor White
Write-Host "Successfully Renamed:   $($script:RenamedFiles)" -ForegroundColor Green
Write-Host "Skipped (exists/missing): $($script:SkippedFiles)" -ForegroundColor Yellow
Write-Host "Errors:                 $($script:ErrorFiles)" -ForegroundColor Red
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN completed - no files were actually renamed" -ForegroundColor Yellow
    Write-Host "Run with -DryRun:`$false to execute the renames" -ForegroundColor Yellow
} else {
    Write-Host "✅ Batch rename completed!" -ForegroundColor Green
    if ($script:ErrorFiles -eq 0) {
        Write-Host "🎉 All files processed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some errors occurred - please review the output above" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Next step: Run 'pnpm validate:critical-fixes' to ensure system integrity" -ForegroundColor Cyan