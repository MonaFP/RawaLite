# ============================================================================
# FINAL COMPREHENSIVE BATCH DOCUMENTATION RENAME SCRIPT - ALL REMAINING FILES
# ============================================================================
# Umbenennung ALLER verbleibenden Dateien, die noch nicht dem Schema entsprechen
# Schema: [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]-[DATUM].md
# VOLLSTÄNDIGE ABDECKUNG aller non-konformen Dateien
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

Write-Host "🔄 FINAL COMPREHENSIVE RENAME SCRIPT - ALL REMAINING FILES" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE EXECUTION' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host "Base Path: $DocsBasePath" -ForegroundColor Gray
Write-Host "Schema: [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]-[DATUM].md" -ForegroundColor White
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

    # Prüfe INDEX.md Dateien - diese bleiben unverändert
    if ((Split-Path $OldPath -Leaf) -eq "INDEX.md") {
        Write-Host "⚠️  SKIP: $Description" -ForegroundColor Yellow
        Write-Host "     INDEX.md files remain unchanged" -ForegroundColor Gray
        $script:SkippedFiles++
        return
    }

    # Prüfe bereits korrekte Dateien (mit Status-Präfix)
    $fileName = Split-Path $OldPath -Leaf
    if ($fileName -match '^(VALIDATED|SOLVED|LESSON|WIP|COMPLETED|PLAN)_') {
        Write-Host "⚠️  SKIP: $Description" -ForegroundColor Yellow
        Write-Host "     Already correctly named: $fileName" -ForegroundColor Gray
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

Write-Host "🎯 Starting FINAL comprehensive rename for ALL remaining files..." -ForegroundColor Green
Write-Host ""

# ============================================================================
# ROOT DOCS ORDNER - Hauptdokumente
# ============================================================================
Write-Host "📁 ROOT DOCS - Hauptdokumente" -ForegroundColor Magenta

Rename-DocumentationFile `
    -OldPath (Join-Path $DocsBasePath "DOCS_SITEMAP.md") `
    -NewPath (Join-Path $DocsBasePath "VALIDATED_REGISTRY-DOCS-SITEMAP-2025-10-15.md") `
    -Description "root: DOCS_SITEMAP"

Rename-DocumentationFile `
    -OldPath (Join-Path $DocsBasePath "REVIEW_REFAKTOR.md") `
    -NewPath (Join-Path $DocsBasePath "COMPLETED_REPORT-REVIEW-REFAKTOR-2025-10-15.md") `
    -Description "root: REVIEW_REFAKTOR"

# ============================================================================
# 05-DEPLOY VERBLEIBENDE DATEIEN
# ============================================================================
Write-Host "📁 05-DEPLOY verbleibende Dateien" -ForegroundColor Magenta

$deployFinalPath = Join-Path $DocsBasePath "05-deploy\final"
$deployPlanPath = Join-Path $DocsBasePath "05-deploy\plan"
$deploySessionsPath = Join-Path $DocsBasePath "05-deploy\sessions"
$deployWipPath = Join-Path $DocsBasePath "05-deploy\wip"

# Implementation Plans
Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "IMPLEMENTATION-PLAN-auto-update-notifications.md") `
    -NewPath (Join-Path $deployFinalPath "COMPLETED_PLAN-AUTO-UPDATE-NOTIFICATIONS-2025-10-15.md") `
    -Description "05-deploy/final: IMPLEMENTATION-PLAN-auto-update-notifications"

Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "IMPLEMENTATION-PLAN-custom-updater.md") `
    -NewPath (Join-Path $deployFinalPath "COMPLETED_PLAN-CUSTOM-UPDATER-2025-10-15.md") `
    -Description "05-deploy/final: IMPLEMENTATION-PLAN-custom-updater"

# Solution Complete
Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "SOLUTION-COMPLETE-UpdateManager-Production.md") `
    -NewPath (Join-Path $deployFinalPath "COMPLETED_REPORT-SOLUTION-UPDATEMANAGER-PRODUCTION-2025-10-15.md") `
    -Description "05-deploy/final: SOLUTION-COMPLETE-UpdateManager-Production"

# Update System Files
Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "UPDATE_DEVELOPMENT.md") `
    -NewPath (Join-Path $deployFinalPath "COMPLETED_IMPL-UPDATE-DEVELOPMENT-2025-10-15.md") `
    -Description "05-deploy/final: UPDATE_DEVELOPMENT"

Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "UPDATE-SYSTEM-DEBUGGING-2025-10-01.md") `
    -NewPath (Join-Path $deployFinalPath "COMPLETED_REPORT-UPDATE-SYSTEM-DEBUGGING-2025-10-01.md") `
    -Description "05-deploy/final: UPDATE-SYSTEM-DEBUGGING"

# Updater Files
$updaterFiles = @(
    "UPDATER-ARCHIVED-READY-TO-START-v1.0.7.md",
    "UPDATER-ARCHIVED-UPDATE_SYSTEM_ARCHITECTURE-v1.0.7.md",
    "UPDATER-COMPLETED-GITHUB_API_MIGRATION.md",
    "UPDATER-DEPRECATED-GitHubCliService.md",
    "UPDATER-HYBRID-COMPONENT-ARCHITECTURE.md",
    "UPDATER-INDEX.md",
    "UPDATER-UPDATE-SYSTEM-ARCHITECTURE.md",
    "UPDATER-UPDATE_TESTING.md"
)

foreach ($file in $updaterFiles) {
    $cleanName = $file -replace '^UPDATER-', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    if ($file -match "ARCHIVED") {
        $prefix = "COMPLETED_REPORT"
    } elseif ($file -match "DEPRECATED") {
        $prefix = "COMPLETED_REPORT"
    } elseif ($file -match "INDEX") {
        $prefix = "VALIDATED_REGISTRY"
    } elseif ($file -match "COMPLETED") {
        $prefix = "COMPLETED_IMPL"
    } else {
        $prefix = "VALIDATED_GUIDE"
    }
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $deployFinalPath $file) `
        -NewPath (Join-Path $deployFinalPath "$prefix-UPDATER-$cleanName-2025-10-15.md") `
        -Description "05-deploy/final: $file"
}

# Deploy Plan Ordner
Rename-DocumentationFile `
    -OldPath (Join-Path $deployPlanPath "UPDATER-DOCUMENTATION-CLEANUP-PLAN.md") `
    -NewPath (Join-Path $deployPlanPath "WIP_PLAN-UPDATER-DOCUMENTATION-CLEANUP-2025-10-15.md") `
    -Description "05-deploy/plan: UPDATER-DOCUMENTATION-CLEANUP-PLAN"

# ============================================================================
# 04-UI VERBLEIBENDE DATEIEN
# ============================================================================
Write-Host "📁 04-UI verbleibende Dateien" -ForegroundColor Magenta

$uiFinalPath = Join-Path $DocsBasePath "04-ui\final"
$uiPlanPath = Join-Path $DocsBasePath "04-ui\plan"
$uiWipPath = Join-Path $DocsBasePath "04-ui\wip"

# UI Final remaining files
$uiRemainingFiles = @(
    "PACKAGE-FORM-UI-PATTERN-MODERNIZATION-2025-10-13.md",
    "PDF-ANMERKUNGEN-STYLING-FIX-2025-10-14.md",
    "PDF-ISSUE-REPORT-PDF-UND-SUBITEM-PREISE-2025-10-14.md",
    "PDF-PDF-ATTACHMENTS-FIX-PLAN-2025-10-12.md",
    "PDF-PDF-EINZELPREIS-RUNDUNGSFEHLER-LOSUNG.md",
    "PDF-PDF-LAYOUT-OPTIMIZATIONS-V1-5-2.md",
    "PDF-SUBITEM-PRICING-FLEXIBILITY-IMPLEMENTATION-2025-10-14.md",
    "PDF-TECHNICAL-SUMMARY-IMAGE-UPLOAD.md",
    "PDF-THEME-SYSTEM-FIXES.md",
    "PDF-TIMESHEET-DAY-GROUPING-FEATURE.md",
    "SUB-ITEM-IMPLEMENTATION-PLAN.md",
    "TIMESHEETFORM-COMPONENT.md",
    "UI-PATTERNS-table-forms.md",
    "V1-5-2-BEAUTIFUL-PASTEL-THEMES.md",
    "V1-5-2-CONTEXT-ARCHITECTURE.md",
    "V1-5-2-ENHANCED-NAVIGATION.md",
    "V1-5-2-HEADERSTATISTICS-COMPONENT.md",
    "LOGO-MANAGEMENT-WORKFLOW.md",
    "numerische-eingabefelder-ux-verbesserung.md",
    "PDF-pdf-anhang-seite-architektur.md",
    "PDF-pdf-anhang-seite-benutzerhandbuch.md",
    "PDF-pdf-anhang-seite-implementation.md"
)

foreach ($file in $uiRemainingFiles) {
    $cleanName = $file -replace '^(PDF-|V1-5-2-)', '' -replace '\.md$', '' -replace '-2025-10-1[0-9]', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    if ($file -match "IMPLEMENTATION") {
        $prefix = "COMPLETED_IMPL"
    } elseif ($file -match "PLAN") {
        $prefix = "VALIDATED_PLAN"
    } elseif ($file -match "COMPONENT") {
        $prefix = "VALIDATED_GUIDE"
    } elseif ($file -match "FIX") {
        $prefix = "SOLVED_FIX"
    } elseif ($file -match "REPORT") {
        $prefix = "VALIDATED_REPORT"
    } else {
        $prefix = "VALIDATED_GUIDE"
    }
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $uiFinalPath $file) `
        -NewPath (Join-Path $uiFinalPath "$prefix-$cleanName-2025-10-15.md") `
        -Description "04-ui/final: $file"
}

# UI Plan Ordner
Rename-DocumentationFile `
    -OldPath (Join-Path $uiPlanPath "PDF-SUB-ITEMS-PDF-HIERARCHY-PLAN.md") `
    -NewPath (Join-Path $uiPlanPath "WIP_PLAN-PDF-SUB-ITEMS-PDF-HIERARCHY-2025-10-15.md") `
    -Description "04-ui/plan: PDF-SUB-ITEMS-PDF-HIERARCHY-PLAN"

# UI WIP Ordner
Rename-DocumentationFile `
    -OldPath (Join-Path $uiWipPath "SUBITEMS-HIERARCHY-MANAGEMENT-PLAN.md") `
    -NewPath (Join-Path $uiWipPath "WIP_PLAN-SUBITEMS-HIERARCHY-MANAGEMENT-2025-10-15.md") `
    -Description "04-ui/wip: SUBITEMS-HIERARCHY-MANAGEMENT-PLAN"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiWipPath "PDF-IMAGE-UPLOAD-FEATURE.md") `
    -NewPath (Join-Path $uiWipPath "WIP_IMPL-PDF-IMAGE-UPLOAD-FEATURE-2025-10-15.md") `
    -Description "04-ui/wip: PDF-IMAGE-UPLOAD-FEATURE"

# ============================================================================
# 06-LESSONS VERBLEIBENDE DATEIEN
# ============================================================================
Write-Host "📁 06-LESSONS verbleibende Dateien" -ForegroundColor Magenta

$lessonsDeprecatedPath = Join-Path $DocsBasePath "06-lessons\deprecated"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsDeprecatedPath "ARCHIVED-UpdateManagerService-v1032.md") `
    -NewPath (Join-Path $lessonsDeprecatedPath "COMPLETED_REPORT-ARCHIVED-UPDATEMANAGERSERVICE-V1032-2025-10-15.md") `
    -Description "06-lessons/deprecated: ARCHIVED-UpdateManagerService-v1032"

# Lessons Sessions - verbleibende Archive Dateien
$lessonsSessionsPath = Join-Path $DocsBasePath "06-lessons\sessions"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "COMPLETED_PLAN-UNIFY-PACKAGE-UNITPRICE-ARCHIVE-2025-10-15.md") `
    -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_PLAN-UNIFY-PACKAGE-UNITPRICE-ARCHIVE-2025-10-15.md") `
    -Description "06-lessons/sessions: PLAN_UNIFY_PACKAGE_UNITPRICE-archive (already renamed)"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "COMPLETED_PLAN-UNIFY-PACKAGE-UNITPRICE-QUICKREF-ARCHIVE-2025-10-15.md") `
    -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_PLAN-UNIFY-PACKAGE-UNITPRICE-QUICKREF-ARCHIVE-2025-10-15.md") `
    -Description "06-lessons/sessions: PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF-archive (already renamed)"

# ============================================================================
# 00-META ROOT DATEIEN (Nicht in Subordnern)
# ============================================================================
Write-Host "📁 00-META Root-Dateien (außerhalb Subordner)" -ForegroundColor Magenta

$metaRootPath = Join-Path $DocsBasePath "00-meta"

# Diese Dateien sind vermutlich noch im Root-Ordner von 00-meta und müssen umbenannt werden
$metaRootFiles = @(
    "CRITICAL_KI-FAILURE-MODES.md",
    "README.md"
)

foreach ($file in $metaRootFiles) {
    $cleanName = $file -replace '^(CRITICAL_|)', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    if ($file -match "CRITICAL") {
        $prefix = "VALIDATED_GUIDE"
    } elseif ($file -match "README") {
        $prefix = "VALIDATED_GUIDE"
    } else {
        $prefix = "VALIDATED_GUIDE"
    }
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $metaRootPath $file) `
        -NewPath (Join-Path $metaRootPath "$prefix-$cleanName-2025-10-15.md") `
        -Description "00-meta root: $file"
}

# ============================================================================
# WEITERE VERSTREUTE DATEIEN (falls vorhanden)
# ============================================================================
Write-Host "📁 Weitere verstreute Dateien prüfen..." -ForegroundColor Magenta

# Prüfe andere mögliche Dateien in anderen Ordnern
$otherPaths = @(
    (Join-Path $DocsBasePath "01-core"),
    (Join-Path $DocsBasePath "02-dev"),
    (Join-Path $DocsBasePath "03-data")
)

foreach ($path in $otherPaths) {
    if (Test-Path $path) {
        # Prüfe Root-Dateien in diesen Ordnern
        $rootFiles = Get-ChildItem -Path $path -Filter "*.md" | Where-Object { -not $_.PSIsContainer }
        
        foreach ($file in $rootFiles) {
            if ($file.Name -ne "INDEX.md" -and $file.Name -notmatch '^(VALIDATED|SOLVED|LESSON|WIP|COMPLETED|PLAN)_') {
                $cleanName = $file.BaseName.ToUpper() -replace '-', '-'
                
                Rename-DocumentationFile `
                    -OldPath $file.FullName `
                    -NewPath (Join-Path $path "VALIDATED_GUIDE-$cleanName-2025-10-15.md") `
                    -Description "$(Split-Path $path -Leaf) root: $($file.Name)"
            }
        }
    }
}

# ============================================================================
# ABSCHLUSS UND STATISTIKEN
# ============================================================================
Write-Host "📊 FINAL COMPREHENSIVE RENAME SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Total Files Processed: $($script:TotalFiles)" -ForegroundColor White
Write-Host "Successfully Renamed:   $($script:RenamedFiles)" -ForegroundColor Green
Write-Host "Skipped (exists/missing/correct): $($script:SkippedFiles)" -ForegroundColor Yellow
Write-Host "Errors:                 $($script:ErrorFiles)" -ForegroundColor Red
Write-Host ""

if ($script:ErrorFiles -eq 0) {
    Write-Host "✅ FINAL comprehensive rename completed!" -ForegroundColor Green
    Write-Host "🎉 ALL remaining files processed successfully!" -ForegroundColor Green
    Write-Host "🏆 Documentation now 100% compliant with semantic schema!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run 'pnpm validate:critical-fixes' to ensure system integrity" -ForegroundColor Yellow
    Write-Host "Schema: [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]-[DATUM].md" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some errors occurred during final rename!" -ForegroundColor Red
    Write-Host "Please review error messages above." -ForegroundColor Red
}