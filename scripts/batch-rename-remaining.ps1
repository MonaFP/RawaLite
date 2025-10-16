# ============================================================================
# BATCH DOCUMENTATION RENAME SCRIPT - REMAINING FOLDERS
# ============================================================================
# Systematische Umbenennung aller verbleibenden Dokumentationsdateien
# Ordner: 03-testing, 04-database, 05-ui, 06-lessons
# Basiert auf REVIEW_REFAKTOR.md Tabelle
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# Initialisiere Statistiken
$script:TotalFiles = 0
$script:RenamedFiles = 0
$script:SkippedFiles = 0
$script:ErrorFiles = 0

$DocsBasePath = "c:\Users\ramon\Desktop\RawaLite\docs"

Write-Host "🔄 BATCH DOCUMENTATION RENAME SCRIPT - REMAINING FOLDERS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE EXECUTION' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host "Base Path: $DocsBasePath" -ForegroundColor Gray
Write-Host ""

# Hilfsfunktion für sichere Umbenennung
function Rename-DocumentationFile {
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

Write-Host "🎯 Starting systematic file renaming for remaining folders..." -ForegroundColor Green
Write-Host ""

# ============================================================================
# 03-TESTING DATEIEN
# ============================================================================
Write-Host "📁 03-TESTING Dateien" -ForegroundColor Magenta

$testingPath = Join-Path $DocsBasePath "03-testing"

# Basiert auf REVIEW_REFAKTOR.md - Zeilen für 03-testing
Rename-DocumentationFile `
    -OldPath (Join-Path $testingPath "AUTOMATED-TEST-SUITES.md") `
    -NewPath (Join-Path $testingPath "VALIDATED_GUIDE-AUTOMATED-TEST-SUITES-2025-10-15.md") `
    -Description "03-testing: AUTOMATED-TEST-SUITES"

Rename-DocumentationFile `
    -OldPath (Join-Path $testingPath "DEBUGGING-STRATEGIES.md") `
    -NewPath (Join-Path $testingPath "VALIDATED_GUIDE-DEBUGGING-STRATEGIES-2025-10-15.md") `
    -Description "03-testing: DEBUGGING-STRATEGIES"

Rename-DocumentationFile `
    -OldPath (Join-Path $testingPath "ELECTRON-TESTING-GUIDE.md") `
    -NewPath (Join-Path $testingPath "VALIDATED_GUIDE-ELECTRON-TESTING-2025-10-15.md") `
    -Description "03-testing: ELECTRON-TESTING-GUIDE"

Rename-DocumentationFile `
    -OldPath (Join-Path $testingPath "E2E-TESTING-IMPLEMENTATION.md") `
    -NewPath (Join-Path $testingPath "COMPLETED_IMPL-E2E-TESTING-2025-10-15.md") `
    -Description "03-testing: E2E-TESTING-IMPLEMENTATION"

Rename-DocumentationFile `
    -OldPath (Join-Path $testingPath "TESTING-DOCUMENTATION.md") `
    -NewPath (Join-Path $testingPath "VALIDATED_GUIDE-TESTING-DOCUMENTATION-2025-10-15.md") `
    -Description "03-testing: TESTING-DOCUMENTATION"

Rename-DocumentationFile `
    -OldPath (Join-Path $testingPath "TESTING-FRAMEWORKS.md") `
    -NewPath (Join-Path $testingPath "VALIDATED_GUIDE-TESTING-FRAMEWORKS-2025-10-15.md") `
    -Description "03-testing: TESTING-FRAMEWORKS"

Rename-DocumentationFile `
    -OldPath (Join-Path $testingPath "UNIT-TESTING-GUIDE.md") `
    -NewPath (Join-Path $testingPath "VALIDATED_GUIDE-UNIT-TESTING-2025-10-15.md") `
    -Description "03-testing: UNIT-TESTING-GUIDE"

Rename-DocumentationFile `
    -OldPath (Join-Path $testingPath "VALIDATION-PROCEDURES.md") `
    -NewPath (Join-Path $testingPath "VALIDATED_GUIDE-VALIDATION-PROCEDURES-2025-10-15.md") `
    -Description "03-testing: VALIDATION-PROCEDURES"

# ============================================================================
# 04-DATABASE DATEIEN  
# ============================================================================
Write-Host "📁 04-DATABASE Dateien" -ForegroundColor Magenta

$databasePath = Join-Path $DocsBasePath "04-database"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "DATABASE-ARCHITECTURE.md") `
    -NewPath (Join-Path $databasePath "VALIDATED_GUIDE-DATABASE-ARCHITECTURE-2025-10-15.md") `
    -Description "04-database: DATABASE-ARCHITECTURE"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "DATABASE-BACKUP-RECOVERY.md") `
    -NewPath (Join-Path $databasePath "VALIDATED_GUIDE-DATABASE-BACKUP-RECOVERY-2025-10-15.md") `
    -Description "04-database: DATABASE-BACKUP-RECOVERY"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "DATABASE-MIGRATION-GUIDE.md") `
    -NewPath (Join-Path $databasePath "VALIDATED_GUIDE-DATABASE-MIGRATION-2025-10-15.md") `
    -Description "04-database: DATABASE-MIGRATION-GUIDE"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "DATABASE-OPTIMIZATION.md") `
    -NewPath (Join-Path $databasePath "VALIDATED_GUIDE-DATABASE-OPTIMIZATION-2025-10-15.md") `
    -Description "04-database: DATABASE-OPTIMIZATION"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "DATABASE-SCHEMA-DESIGN.md") `
    -NewPath (Join-Path $databasePath "VALIDATED_GUIDE-DATABASE-SCHEMA-DESIGN-2025-10-15.md") `
    -Description "04-database: DATABASE-SCHEMA-DESIGN"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "DATABASE-TESTING.md") `
    -NewPath (Join-Path $databasePath "VALIDATED_GUIDE-DATABASE-TESTING-2025-10-15.md") `
    -Description "04-database: DATABASE-TESTING"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "MIGRATION-IMPLEMENTATION.md") `
    -NewPath (Join-Path $databasePath "COMPLETED_IMPL-DATABASE-MIGRATION-2025-10-15.md") `
    -Description "04-database: MIGRATION-IMPLEMENTATION"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "SQLITE-CONFIGURATION.md") `
    -NewPath (Join-Path $databasePath "VALIDATED_GUIDE-SQLITE-CONFIGURATION-2025-10-15.md") `
    -Description "04-database: SQLITE-CONFIGURATION"

Rename-DocumentationFile `
    -OldPath (Join-Path $databasePath "SQL-QUERY-OPTIMIZATION.md") `
    -NewPath (Join-Path $databasePath "VALIDATED_GUIDE-SQL-QUERY-OPTIMIZATION-2025-10-15.md") `
    -Description "04-database: SQL-QUERY-OPTIMIZATION"

# ============================================================================
# 05-UI DATEIEN
# ============================================================================
Write-Host "📁 05-UI Dateien" -ForegroundColor Magenta

$uiPath = Join-Path $DocsBasePath "05-ui"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiPath "COMPONENT-LIBRARY.md") `
    -NewPath (Join-Path $uiPath "VALIDATED_GUIDE-COMPONENT-LIBRARY-2025-10-15.md") `
    -Description "05-ui: COMPONENT-LIBRARY"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiPath "CSS-ARCHITECTURE.md") `
    -NewPath (Join-Path $uiPath "VALIDATED_GUIDE-CSS-ARCHITECTURE-2025-10-15.md") `
    -Description "05-ui: CSS-ARCHITECTURE"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiPath "DESIGN-SYSTEM.md") `
    -NewPath (Join-Path $uiPath "VALIDATED_GUIDE-DESIGN-SYSTEM-2025-10-15.md") `
    -Description "05-ui: DESIGN-SYSTEM"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiPath "REACT-BEST-PRACTICES.md") `
    -NewPath (Join-Path $uiPath "VALIDATED_GUIDE-REACT-BEST-PRACTICES-2025-10-15.md") `
    -Description "05-ui: REACT-BEST-PRACTICES"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiPath "RESPONSIVE-DESIGN.md") `
    -NewPath (Join-Path $uiPath "VALIDATED_GUIDE-RESPONSIVE-DESIGN-2025-10-15.md") `
    -Description "05-ui: RESPONSIVE-DESIGN"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiPath "STATE-MANAGEMENT.md") `
    -NewPath (Join-Path $uiPath "VALIDATED_GUIDE-STATE-MANAGEMENT-2025-10-15.md") `
    -Description "05-ui: STATE-MANAGEMENT"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiPath "UI-TESTING.md") `
    -NewPath (Join-Path $uiPath "VALIDATED_GUIDE-UI-TESTING-2025-10-15.md") `
    -Description "05-ui: UI-TESTING"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiPath "USER-EXPERIENCE.md") `
    -NewPath (Join-Path $uiPath "VALIDATED_GUIDE-USER-EXPERIENCE-2025-10-15.md") `
    -Description "05-ui: USER-EXPERIENCE"

# ============================================================================
# 06-LESSONS DATEIEN
# ============================================================================
Write-Host "📁 06-LESSONS Dateien" -ForegroundColor Magenta

$lessonsPath = Join-Path $DocsBasePath "06-lessons"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsPath "CODE-QUALITY-LESSONS.md") `
    -NewPath (Join-Path $lessonsPath "LESSON_GUIDE-CODE-QUALITY-2025-10-15.md") `
    -Description "06-lessons: CODE-QUALITY-LESSONS"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsPath "DEPLOYMENT-LESSONS.md") `
    -NewPath (Join-Path $lessonsPath "LESSON_GUIDE-DEPLOYMENT-2025-10-15.md") `
    -Description "06-lessons: DEPLOYMENT-LESSONS"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsPath "DEVELOPMENT-LESSONS.md") `
    -NewPath (Join-Path $lessonsPath "LESSON_GUIDE-DEVELOPMENT-2025-10-15.md") `
    -Description "06-lessons: DEVELOPMENT-LESSONS"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsPath "PERFORMANCE-LESSONS.md") `
    -NewPath (Join-Path $lessonsPath "LESSON_GUIDE-PERFORMANCE-2025-10-15.md") `
    -Description "06-lessons: PERFORMANCE-LESSONS"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsPath "SECURITY-LESSONS.md") `
    -NewPath (Join-Path $lessonsPath "LESSON_GUIDE-SECURITY-2025-10-15.md") `
    -Description "06-lessons: SECURITY-LESSONS"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsPath "TROUBLESHOOTING-LESSONS.md") `
    -NewPath (Join-Path $lessonsPath "LESSON_GUIDE-TROUBLESHOOTING-2025-10-15.md") `
    -Description "06-lessons: TROUBLESHOOTING-LESSONS"

# ============================================================================
# ABSCHLUSS UND STATISTIKEN
# ============================================================================
Write-Host "📊 BATCH RENAME SUMMARY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Total Files Processed: $($script:TotalFiles)" -ForegroundColor White
Write-Host "Successfully Renamed:   $($script:RenamedFiles)" -ForegroundColor Green
Write-Host "Skipped (exists/missing): $($script:SkippedFiles)" -ForegroundColor Yellow
Write-Host "Errors:                 $($script:ErrorFiles)" -ForegroundColor Red
Write-Host ""

if ($script:ErrorFiles -eq 0) {
    Write-Host "✅ Batch rename completed!" -ForegroundColor Green
    Write-Host "🎉 All files processed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run 'pnpm validate:critical-fixes' to ensure system integrity" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some errors occurred during batch rename!" -ForegroundColor Red
    Write-Host "Please review error messages above." -ForegroundColor Red
}