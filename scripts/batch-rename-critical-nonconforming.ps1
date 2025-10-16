# ============================================================================
# FINAL NON-CONFORMING FILES BATCH RENAME SCRIPT  
# ============================================================================
# Umbenennung der wichtigsten verbleibenden non-konformen Dateien
# Schema: [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]-[DATUM].md
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$script:TotalFiles = 0
$script:RenamedFiles = 0
$script:SkippedFiles = 0
$script:ErrorFiles = 0

$DocsBasePath = "c:\Users\ramon\Desktop\RawaLite\docs"

Write-Host "🔄 FINAL NON-CONFORMING FILES RENAME" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE EXECUTION' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host ""

function Rename-DocumentationFile {
    param(
        [string]$OldPath,
        [string]$NewPath,
        [string]$Description
    )
    
    $script:TotalFiles++
    
    if (-not (Test-Path $OldPath)) {
        Write-Host "⚠️  SKIP: $Description - Source not found" -ForegroundColor Yellow
        $script:SkippedFiles++
        return
    }
    
    if (Test-Path $NewPath) {
        Write-Host "⚠️  SKIP: $Description - Target exists" -ForegroundColor Yellow
        $script:SkippedFiles++
        return
    }

    $fileName = Split-Path $OldPath -Leaf
    if ($fileName -eq "INDEX.md") {
        Write-Host "⚠️  SKIP: $Description - INDEX.md unchanged" -ForegroundColor Yellow
        $script:SkippedFiles++
        return
    }

    if ($fileName -match '^(VALIDATED|SOLVED|LESSON|WIP|COMPLETED|PLAN)_[A-Z]') {
        Write-Host "⚠️  SKIP: $Description - Already correct: $fileName" -ForegroundColor Yellow
        $script:SkippedFiles++
        return
    }
    
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
        Write-Host "❌ ERROR: $Description - $($_.Exception.Message)" -ForegroundColor Red
        $script:ErrorFiles++
    }
    
    Write-Host ""
}

# ============================================================================
# KRITISCHE NON-KONFORME DATEIEN
# ============================================================================

Write-Host "📁 Processing critical non-conforming files..." -ForegroundColor Green
Write-Host ""

# 00-meta/final
$metaFinalPath = Join-Path $DocsBasePath "00-meta\final"

Rename-DocumentationFile `
    -OldPath (Join-Path $metaFinalPath "VALIDATED-2025-10-15_INSTRUCTIONS-KI.md") `
    -NewPath (Join-Path $metaFinalPath "VALIDATED_GUIDE-INSTRUCTIONS-KI-2025-10-15.md") `
    -Description "00-meta/final: INSTRUCTIONS-KI"

Rename-DocumentationFile `
    -OldPath (Join-Path $metaFinalPath "VALIDATED-2025-10-15_KI-PREFIX-RECOGNITION-RULES.md") `
    -NewPath (Join-Path $metaFinalPath "VALIDATED_GUIDE-KI-PREFIX-RECOGNITION-RULES-2025-10-15.md") `
    -Description "00-meta/final: KI-PREFIX-RECOGNITION-RULES"

# 01-core/final  
$coreFinalPath = Join-Path $DocsBasePath "01-core\final"

Rename-DocumentationFile `
    -OldPath (Join-Path $coreFinalPath "VALIDATED-2025-10-15_DOCUMENTATION-STRUCTURE-GUIDE.md") `
    -NewPath (Join-Path $coreFinalPath "VALIDATED_GUIDE-DOCUMENTATION-STRUCTURE-2025-10-15.md") `
    -Description "01-core/final: DOCUMENTATION-STRUCTURE-GUIDE"

Rename-DocumentationFile `
    -OldPath (Join-Path $coreFinalPath "VALIDATED-2025-10-15_QUICK-REFERENCE.md") `
    -NewPath (Join-Path $coreFinalPath "VALIDATED_GUIDE-QUICK-REFERENCE-2025-10-15.md") `
    -Description "01-core/final: QUICK-REFERENCE"

# 02-dev/final
$devFinalPath = Join-Path $DocsBasePath "02-dev\final"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "IMPL-VALIDATED-2025-10-15_PACKAGE-EDIT-ROUTE-IMPLEMENTATION.md") `
    -NewPath (Join-Path $devFinalPath "VALIDATED_IMPL-PACKAGE-EDIT-ROUTE-IMPLEMENTATION-2025-10-15.md") `
    -Description "02-dev/final: PACKAGE-EDIT-ROUTE-IMPLEMENTATION"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "MINI-FIX-DELIVERY-SYSTEM-PLAN.md") `
    -NewPath (Join-Path $devFinalPath "WIP_PLAN-MINI-FIX-DELIVERY-SYSTEM-2025-10-15.md") `
    -Description "02-dev/final: MINI-FIX-DELIVERY-SYSTEM-PLAN"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "PLAN_UNIFY_PACKAGE_UNITPRICE.md") `
    -NewPath (Join-Path $devFinalPath "PLAN_PLAN-UNIFY-PACKAGE-UNITPRICE-2025-10-15.md") `
    -Description "02-dev/final: PLAN_UNIFY_PACKAGE_UNITPRICE"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF.md") `
    -NewPath (Join-Path $devFinalPath "PLAN_GUIDE-UNIFY-PACKAGE-UNITPRICE-QUICKREF-2025-10-15.md") `
    -Description "02-dev/final: PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "POWERSHELL_PACKAGE_JSON_BEST_PRACTICES.md") `
    -NewPath (Join-Path $devFinalPath "VALIDATED_GUIDE-POWERSHELL-PACKAGE-JSON-BEST-PRACTICES-2025-10-15.md") `
    -Description "02-dev/final: POWERSHELL_PACKAGE_JSON_BEST_PRACTICES"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "RAWALITE-SYSTEM-ANALYSIS-PROMPT.md") `
    -NewPath (Join-Path $devFinalPath "VALIDATED_TEMPLATE-RAWALITE-SYSTEM-ANALYSIS-PROMPT-2025-10-15.md") `
    -Description "02-dev/final: RAWALITE-SYSTEM-ANALYSIS-PROMPT"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "STATUSBERICHT-dev-prod-unterschiede-logo-assets.md") `
    -NewPath (Join-Path $devFinalPath "COMPLETED_REPORT-DEV-PROD-UNTERSCHIEDE-LOGO-ASSETS-2025-10-15.md") `
    -Description "02-dev/final: STATUSBERICHT-dev-prod-unterschiede-logo-assets"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "VALIDATED-2025-10-15_sustainable-architecture-fix.md") `
    -NewPath (Join-Path $devFinalPath "VALIDATED_FIX-SUSTAINABLE-ARCHITECTURE-2025-10-15.md") `
    -Description "02-dev/final: sustainable-architecture-fix"

Rename-DocumentationFile `
    -OldPath (Join-Path $devFinalPath "VALIDATED-2025-10-15_version-bump-automation-solution.md") `
    -NewPath (Join-Path $devFinalPath "VALIDATED_FIX-VERSION-BUMP-AUTOMATION-SOLUTION-2025-10-15.md") `
    -Description "02-dev/final: version-bump-automation-solution"

# 02-dev/plan
$devPlanPath = Join-Path $DocsBasePath "02-dev\plan"

Rename-DocumentationFile `
    -OldPath (Join-Path $devPlanPath "IMPL-FIXPLAN-package-price-display-field-mapping.md") `
    -NewPath (Join-Path $devPlanPath "WIP_PLAN-PACKAGE-PRICE-DISPLAY-FIELD-MAPPING-2025-10-15.md") `
    -Description "02-dev/plan: IMPL-FIXPLAN-package-price-display-field-mapping"

# 02-dev/sessions
$devSessionsPath = Join-Path $DocsBasePath "02-dev\sessions"

Rename-DocumentationFile `
    -OldPath (Join-Path $devSessionsPath "IMPL-SUBITEMS-PDF-PROBLEM-ANALYSIS.md") `
    -NewPath (Join-Path $devSessionsPath "COMPLETED_REPORT-IMPL-SUBITEMS-PDF-PROBLEM-ANALYSIS-2025-10-15.md") `
    -Description "02-dev/sessions: IMPL-SUBITEMS-PDF-PROBLEM-ANALYSIS"

# 02-dev/wip
$devWipPath = Join-Path $DocsBasePath "02-dev\wip"

Rename-DocumentationFile `
    -OldPath (Join-Path $devWipPath "VALIDATED-2025-10-15_LESSONS-LEARNED-dev-prod-build-discrepancies.md") `
    -NewPath (Join-Path $devWipPath "LESSON_FIX-DEV-PROD-BUILD-DISCREPANCIES-2025-10-15.md") `
    -Description "02-dev/wip: LESSONS-LEARNED-dev-prod-build-discrepancies"

# 06-lessons/deprecated
$lessonsDeprecatedPath = Join-Path $DocsBasePath "06-lessons\deprecated"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsDeprecatedPath "VALIDATED-2025-10-15_BUILD-INSTALLATION-MATRIX.md") `
    -NewPath (Join-Path $lessonsDeprecatedPath "VALIDATED_GUIDE-BUILD-INSTALLATION-MATRIX-2025-10-15.md") `
    -Description "06-lessons/deprecated: BUILD-INSTALLATION-MATRIX"

# 06-lessons/final
$lessonsFinalPath = Join-Path $DocsBasePath "06-lessons\final"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsFinalPath "SYSTEMATIC-FIX-PRESERVATION-STRATEGY.md") `
    -NewPath (Join-Path $lessonsFinalPath "VALIDATED_GUIDE-SYSTEMATIC-FIX-PRESERVATION-STRATEGY-2025-10-15.md") `
    -Description "06-lessons/final: SYSTEMATIC-FIX-PRESERVATION-STRATEGY"

# 06-lessons/sessions
$lessonsSessionsPath = Join-Path $DocsBasePath "06-lessons\sessions"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "PLAN_UNIFY_PACKAGE_UNITPRICE-archive.md") `
    -NewPath (Join-Path $lessonsSessionsPath "PLAN_PLAN-UNIFY-PACKAGE-UNITPRICE-ARCHIVE-2025-10-15.md") `
    -Description "06-lessons/sessions: PLAN_UNIFY_PACKAGE_UNITPRICE-archive"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF-archive.md") `
    -NewPath (Join-Path $lessonsSessionsPath "PLAN_GUIDE-UNIFY-PACKAGE-UNITPRICE-QUICKREF-ARCHIVE-2025-10-15.md") `
    -Description "06-lessons/sessions: PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF-archive"

# ============================================================================
# ZUSAMMENFASSUNG
# ============================================================================

Write-Host "📊 FINAL RENAME SUMMARY" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Total Files Processed: $($script:TotalFiles)" -ForegroundColor White
Write-Host "Successfully Renamed:   $($script:RenamedFiles)" -ForegroundColor Green
Write-Host "Skipped:               $($script:SkippedFiles)" -ForegroundColor Yellow
Write-Host "Errors:                $($script:ErrorFiles)" -ForegroundColor Red
Write-Host ""

if ($script:ErrorFiles -eq 0) {
    Write-Host "✅ Final rename completed successfully!" -ForegroundColor Green
    Write-Host "🎉 Schema: [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]-[DATUM].md" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Run 'pnpm validate:critical-fixes'" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some errors occurred!" -ForegroundColor Red
}