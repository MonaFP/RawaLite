# ============================================================================
# COMPREHENSIVE BATCH DOCUMENTATION RENAME SCRIPT - ALL SUBFOLDERS
# ============================================================================
# Vollständige Umbenennung ALLER Dateien in Subordnern (03-06) 
# Neue Namenskonvention: [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]-[DATUM].md
# TYP-Kategorien: GUIDE-, FIX-, IMPL-, REPORT-, REGISTRY-, TEMPLATE-, TRACKING-, PLAN-
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

Write-Host "🔄 COMPREHENSIVE SUBFOLDERS RENAME SCRIPT" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
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

Write-Host "🎯 Starting comprehensive file renaming for ALL subfolders..." -ForegroundColor Green
Write-Host ""

# ============================================================================
# 03-DATA/FINAL DATEIEN
# ============================================================================
Write-Host "📁 03-DATA/final Dateien" -ForegroundColor Magenta

$dataFinalPath = Join-Path $DocsBasePath "03-data\final"

# ACTIVITY-TEMPLATES-IMPLEMENTATION.md → COMPLETED_IMPL-ACTIVITY-TEMPLATES-2025-10-15.md
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "ACTIVITY-TEMPLATES-IMPLEMENTATION.md") `
    -NewPath (Join-Path $dataFinalPath "COMPLETED_IMPL-ACTIVITY-TEMPLATES-2025-10-15.md") `
    -Description "03-data/final: ACTIVITY-TEMPLATES-IMPLEMENTATION"

# CROSS-REF-settings-schema-migration.md → VALIDATED_GUIDE-CROSS-REF-SETTINGS-SCHEMA-MIGRATION-2025-10-15.md
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "CROSS-REF-settings-schema-migration.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_GUIDE-CROSS-REF-SETTINGS-SCHEMA-MIGRATION-2025-10-15.md") `
    -Description "03-data/final: CROSS-REF-settings-schema-migration"

# DATABASE-ARCHITECTURE-CURRENT-STATE.md → VALIDATED_REPORT-DATABASE-ARCHITECTURE-CURRENT-STATE-2025-10-15.md
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "DATABASE-ARCHITECTURE-CURRENT-STATE.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_REPORT-DATABASE-ARCHITECTURE-CURRENT-STATE-2025-10-15.md") `
    -Description "03-data/final: DATABASE-ARCHITECTURE-CURRENT-STATE"

# FIELD_MAPPER_MISMATCHES_PLAN.md → VALIDATED_PLAN-FIELD-MAPPER-MISMATCHES-2025-10-15.md
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "FIELD_MAPPER_MISMATCHES_PLAN.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_PLAN-FIELD-MAPPER-MISMATCHES-2025-10-15.md") `
    -Description "03-data/final: FIELD_MAPPER_MISMATCHES_PLAN"

# INSTALL.md → VALIDATED_GUIDE-INSTALL-2025-10-15.md
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "INSTALL.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_GUIDE-INSTALL-2025-10-15.md") `
    -Description "03-data/final: INSTALL"

# INSTALLATION-GUIDE.md → VALIDATED_GUIDE-INSTALLATION-2025-10-15.md
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "INSTALLATION-GUIDE.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_GUIDE-INSTALLATION-2025-10-15.md") `
    -Description "03-data/final: INSTALLATION-GUIDE"

# Alle LESSONS-LEARNED Dateien → LESSON_FIX
$lessonsLearnedFiles = @(
    "LESSONS-LEARNED-API-PATH-COMPLIANCE.md",
    "LESSONS-LEARNED-database-schema-migration-fix.md",
    "LESSONS-LEARNED-DISCOUNT-PROJECT.md",
    "LESSONS-LEARNED-invoices-numbering-timestamp-fix.md",
    "LESSONS-LEARNED-migration-017-platform-default-fix.md",
    "LESSONS-LEARNED-nummernkreis-debugging.md",
    "LESSONS-LEARNED-offer-foreign-key-constraint-fix.md",
    "LESSONS-LEARNED-offer-foreign-key-fix.md",
    "LESSONS-LEARNED-SCHEMA-CONSISTENCY.md",
    "LESSONS-LEARNED-settings-offers-mapping-debug.md",
    "LESSONS-LEARNED-settings-schema-migration.md",
    "LESSONS-LEARNED-SQLITE-BOOLEAN-BINDING.md",
    "LESSONS-LEARNED-sqlite-nummernkreis-system.md"
)

foreach ($file in $lessonsLearnedFiles) {
    $cleanName = $file -replace '^LESSONS-LEARNED-', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $dataFinalPath $file) `
        -NewPath (Join-Path $dataFinalPath "LESSON_FIX-$cleanName-2025-10-15.md") `
        -Description "03-data/final: $file"
}

# Weitere wichtige Dateien
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "LINE-ITEM-HIERARCHY.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_GUIDE-LINE-ITEM-HIERARCHY-2025-10-15.md") `
    -Description "03-data/final: LINE-ITEM-HIERARCHY"

Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "MAPPING_IMPLEMENTATION_PLAN.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_PLAN-MAPPING-IMPLEMENTATION-2025-10-15.md") `
    -Description "03-data/final: MAPPING_IMPLEMENTATION_PLAN"

Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "MAPPING_PROGRESS_REPORT.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_REPORT-MAPPING-PROGRESS-2025-10-15.md") `
    -Description "03-data/final: MAPPING_PROGRESS_REPORT"

# Migration Dateien
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "MIGRATION-011-offer-line-items-extension.md") `
    -NewPath (Join-Path $dataFinalPath "COMPLETED_IMPL-MIGRATION-011-OFFER-LINE-ITEMS-EXTENSION-2025-10-15.md") `
    -Description "03-data/final: MIGRATION-011"

Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "MIGRATION-013-DISCOUNT-SYSTEM.md") `
    -NewPath (Join-Path $dataFinalPath "COMPLETED_IMPL-MIGRATION-013-DISCOUNT-SYSTEM-2025-10-15.md") `
    -Description "03-data/final: MIGRATION-013"

# Weitere System-Dateien
Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "NUMBERING-CIRCLES-INTEGRATION.md") `
    -NewPath (Join-Path $dataFinalPath "COMPLETED_IMPL-NUMBERING-CIRCLES-INTEGRATION-2025-10-15.md") `
    -Description "03-data/final: NUMBERING-CIRCLES-INTEGRATION"

Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "SQLITE-ADAPTER-COMPLETION.md") `
    -NewPath (Join-Path $dataFinalPath "COMPLETED_IMPL-SQLITE-ADAPTER-2025-10-15.md") `
    -Description "03-data/final: SQLITE-ADAPTER-COMPLETION"

Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "SQLITE-DATABASE-SYSTEM.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM-2025-10-15.md") `
    -Description "03-data/final: SQLITE-DATABASE-SYSTEM"

Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "SQLITE-MIGRATION-ARCHITECTURE.md") `
    -NewPath (Join-Path $dataFinalPath "VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE-2025-10-15.md") `
    -Description "03-data/final: SQLITE-MIGRATION-ARCHITECTURE"

Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "TIMESHEET-MIGRATION-009-010.md") `
    -NewPath (Join-Path $dataFinalPath "COMPLETED_IMPL-TIMESHEET-MIGRATION-009-010-2025-10-15.md") `
    -Description "03-data/final: TIMESHEET-MIGRATION-009-010"

Rename-DocumentationFile `
    -OldPath (Join-Path $dataFinalPath "TIMESHEET-SYSTEM-IMPLEMENTATION.md") `
    -NewPath (Join-Path $dataFinalPath "COMPLETED_IMPL-TIMESHEET-SYSTEM-2025-10-15.md") `
    -Description "03-data/final: TIMESHEET-SYSTEM-IMPLEMENTATION"

# ============================================================================
# 04-UI/FINAL DATEIEN
# ============================================================================
Write-Host "📁 04-UI/final Dateien" -ForegroundColor Magenta

$uiFinalPath = Join-Path $DocsBasePath "04-ui\final"

# Aktionsplan und Audits
Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "AKTIONSPLAN-COMPONENT-AUDIT-2025-10-14.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_PLAN-COMPONENT-AUDIT-2025-10-14.md") `
    -Description "04-ui/final: AKTIONSPLAN-COMPONENT-AUDIT"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "COMPONENT-AUDIT-REPORT-2025-10-14.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_REPORT-COMPONENT-AUDIT-2025-10-14.md") `
    -Description "04-ui/final: COMPONENT-AUDIT-REPORT"

# Analysis Dateien → REPORT
$analysisFiles = @(
    "ANALYSIS-deutsch-vs-englisch-zahlenformat.md",
    "ANALYSIS-formatCurrency-verwendung-und-widerspruch.md",
    "ANALYSIS-readonly-summe-display-problem.md"
)

foreach ($file in $analysisFiles) {
    $cleanName = $file -replace '^ANALYSIS-', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $uiFinalPath $file) `
        -NewPath (Join-Path $uiFinalPath "VALIDATED_REPORT-$cleanName-2025-10-15.md") `
        -Description "04-ui/final: $file"
}

# Debugging Reports
Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "DEBUGGING-REPORT-package-locale-formatierung-test.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_REPORT-DEBUGGING-PACKAGE-LOCALE-FORMATIERUNG-TEST-2025-10-15.md") `
    -Description "04-ui/final: DEBUGGING-REPORT"

# Final Fix
Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "FINAL-FIX-package-locale-formatierung.md") `
    -NewPath (Join-Path $uiFinalPath "SOLVED_FIX-PACKAGE-LOCALE-FORMATIERUNG-2025-10-15.md") `
    -Description "04-ui/final: FINAL-FIX"

# Focus Mode Dateien
Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "focus-mode-v2-technical.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_GUIDE-FOCUS-MODE-V2-TECHNICAL-2025-10-15.md") `
    -Description "04-ui/final: focus-mode-v2-technical"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "focus-mode-v2.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_GUIDE-FOCUS-MODE-V2-2025-10-15.md") `
    -Description "04-ui/final: focus-mode-v2"

# Hook und Implementation Guides
Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "HOOK-SYNCHRONISATION-STATUS-UPDATES.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_GUIDE-HOOK-SYNCHRONISATION-STATUS-UPDATES-2025-10-15.md") `
    -Description "04-ui/final: HOOK-SYNCHRONISATION"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "IMPLEMENTATION-GUIDE-V1-5-2.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_GUIDE-IMPLEMENTATION-V1-5-2-2025-10-15.md") `
    -Description "04-ui/final: IMPLEMENTATION-GUIDE"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "IMPLEMENTATION-REPORT-fix1-fix2c.md") `
    -NewPath (Join-Path $uiFinalPath "COMPLETED_REPORT-IMPLEMENTATION-FIX1-FIX2C-2025-10-15.md") `
    -Description "04-ui/final: IMPLEMENTATION-REPORT"

# Input Helpers
Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "input-helpers-utility-documentation.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_GUIDE-INPUT-HELPERS-UTILITY-DOCUMENTATION-2025-10-15.md") `
    -Description "04-ui/final: input-helpers"

# ============================================================================
# UI LESSONS-LEARNED DATEIEN (BATCH)
# ============================================================================

$uiLessonsFiles = @(
    "LESSONS-LEARNED-duplicate-items-react-state-management.md",
    "LESSONS-LEARNED-invoice-form-save-feedback-subitems-deletion.md",
    "LESSONS-LEARNED-modal-vs-inline-ui-components.md",
    "LESSONS-LEARNED-package-total-localization-number-formatting.md",
    "LESSONS-LEARNED-react-hooks-anti-patterns.md",
    "LESSONS-LEARNED-responsive-design-css-conflicts.md",
    "LESSONS-LEARNED-responsive-table-design.md",
    "LESSONS-LEARNED-search-filter-react-error.md",
    "LESSONS-LEARNED-status-dropdown-analysis.md",
    "LESSONS-LEARNED-STATUS-DROPDOWN-COMPLETE-FIX.md",
    "LESSONS-LEARNED-status-dropdown-css-spezifitaet.md",
    "LESSONS-LEARNED-STATUS-DROPDOWN-FIX.md",
    "LESSONS-LEARNED-status-update-refresh-problems.md",
    "LESSONS-LEARNED-status-updates-css-refactoring.md",
    "LESSONS-LEARNED-SUB-ITEM-POSITIONING-ISSUE.md",
    "LESSONS-LEARNED-subitems-hierarchy-management-architecture-failure.md",
    "LESSONS-LEARNED-timesheets-redesign.md",
    "LESSONS-LEARNED-v1-5-2-theme-navigation-system.md"
)

foreach ($file in $uiLessonsFiles) {
    $cleanName = $file -replace '^LESSONS-LEARNED-', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $uiFinalPath $file) `
        -NewPath (Join-Path $uiFinalPath "LESSON_FIX-$cleanName-2025-10-15.md") `
        -Description "04-ui/final: $file"
}

# ============================================================================
# PDF-SPEZIFISCHE DATEIEN (04-UI/FINAL)
# ============================================================================

# PDF Lessons
$pdfLessonsFiles = @(
    "PDF-LESSONS-LEARNED-container-page-breaks.md",
    "PDF-LESSONS-LEARNED-IMAGE-UPLOAD-SYSTEM.md",
    "PDF-LESSONS-LEARNED-PDF-ATTACHMENTS-NOTES.md",
    "PDF-LESSONS-LEARNED-PDF-FIELD-MAPPING.md",
    "PDF-LESSONS-LEARNED-pdf-logo-field-mapping.md",
    "PDF-LESSONS-LEARNED-sub-items-dev-prod-consistency-fix.md",
    "PDF-LESSONS-LEARNED-sub-items-pdf-architecture-analysis.md"
)

foreach ($file in $pdfLessonsFiles) {
    $cleanName = $file -replace '^PDF-LESSONS-LEARNED-', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $uiFinalPath $file) `
        -NewPath (Join-Path $uiFinalPath "LESSON_FIX-PDF-$cleanName-2025-10-15.md") `
        -Description "04-ui/final: $file"
}

# PDF Andere Dateien
Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "pdf-einzelpreis-angebote-field-mapping.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_GUIDE-PDF-EINZELPREIS-ANGEBOTE-FIELD-MAPPING-2025-10-15.md") `
    -Description "04-ui/final: pdf-einzelpreis"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "PDF-INDEX.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_REGISTRY-PDF-INDEX-2025-10-15.md") `
    -Description "04-ui/final: PDF-INDEX"

Rename-DocumentationFile `
    -OldPath (Join-Path $uiFinalPath "PDF-ISSUE-REPORT-PDF-UND-SUBITEM-PREISE-2025-10-14.md") `
    -NewPath (Join-Path $uiFinalPath "VALIDATED_REPORT-PDF-ISSUE-PDF-UND-SUBITEM-PREISE-2025-10-14.md") `
    -Description "04-ui/final: PDF-ISSUE-REPORT"

# ============================================================================
# 05-DEPLOY/FINAL DATEIEN
# ============================================================================
Write-Host "📁 05-DEPLOY/final Dateien" -ForegroundColor Magenta

$deployFinalPath = Join-Path $DocsBasePath "05-deploy\final"

# Deployment Updates
Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "DEPLOYMENT_UPDATES.md") `
    -NewPath (Join-Path $deployFinalPath "VALIDATED_GUIDE-DEPLOYMENT-UPDATES-2025-10-15.md") `
    -Description "05-deploy/final: DEPLOYMENT_UPDATES"

# Bug Reports
Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "DOWNLOAD-VERIFICATION-BUG.md") `
    -NewPath (Join-Path $deployFinalPath "SOLVED_FIX-DOWNLOAD-VERIFICATION-BUG-2025-10-15.md") `
    -Description "05-deploy/final: DOWNLOAD-VERIFICATION-BUG"

# Implementation Plans
Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "GITHUB-API-MIGRATION-PLAN.md") `
    -NewPath (Join-Path $deployFinalPath "COMPLETED_PLAN-GITHUB-API-MIGRATION-2025-10-15.md") `
    -Description "05-deploy/final: GITHUB-API-MIGRATION-PLAN"

Rename-DocumentationFile `
    -OldPath (Join-Path $deployFinalPath "IMPLEMENTATION-COMPLETE.md") `
    -NewPath (Join-Path $deployFinalPath "COMPLETED_REPORT-IMPLEMENTATION-2025-10-15.md") `
    -Description "05-deploy/final: IMPLEMENTATION-COMPLETE"

# Deploy Lessons Learned
$deployLessonsFiles = @(
    "LESSONS-LEARNED-custom-updater-implementation.md",
    "LESSONS-LEARNED-download-verification-regression.md",
    "LESSONS-LEARNED-DOWNLOAD-VERIFICATION-REGRESSION2.md",
    "LESSONS-LEARNED-NATIVE-UPDATE-DIALOG-TESTING.md",
    "LESSONS-LEARNED-NSIS-INSTALLER-PROBLEMS.md",
    "LESSONS-LEARNED-release-asset-validation-system.md",
    "LESSONS-LEARNED-safe-package-updates.md",
    "LESSONS-LEARNED-UPDATE-INSTALLATION-ERROR-v32-v34.md",
    "LESSONS-LEARNED-UPDATE-INSTALLATION-ERROR.md",
    "LESSONS-LEARNED-UPDATE-MANAGER-WINDOW-PROBLEMS.md",
    "LESSONS-LEARNED-update-system-analysis.md",
    "LESSONS-LEARNED-updateDialog-repair-2025-10-02.md",
    "LESSONS-LEARNED-updatemanager-design-problems.md",
    "LESSONS-LEARNED-v1041-AutoUpdatePreferences-crash.md",
    "LESSONS-LEARNED-v1041-update-compatibility-fix.md",
    "LESSONS-LEARNED-v1042-erweiterte-optionen-update-problems.md",
    "LESSONS-LEARNED-v1042-rückwärtskompatibilität-fixes.md",
    "LESSONS-LEARNED-versionssync-mechanismus.md"
)

foreach ($file in $deployLessonsFiles) {
    $cleanName = $file -replace '^LESSONS-LEARNED-', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $deployFinalPath $file) `
        -NewPath (Join-Path $deployFinalPath "LESSON_FIX-$cleanName-2025-10-15.md") `
        -Description "05-deploy/final: $file"
}

# ============================================================================
# 06-LESSONS/SESSIONS DATEIEN
# ============================================================================
Write-Host "📁 06-LESSONS/sessions Dateien" -ForegroundColor Magenta

$lessonsSessionsPath = Join-Path $DocsBasePath "06-lessons\sessions"

# ARCH-SESSION Dateien → SESSION_REPORT
$archSessionFiles = @(
    "ARCH-SESSION-2025-10-10-repository-status-post-session.md",
    "ARCH-SESSION-2025-10-13-documentation-update-v1.0.13.md",
    "ARCH-SESSION-2025-10-13-repository-status-post-session.md"
)

foreach ($file in $archSessionFiles) {
    $cleanName = $file -replace '^ARCH-SESSION-', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $lessonsSessionsPath $file) `
        -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_REPORT-ARCH-SESSION-$cleanName.md") `
        -Description "06-lessons/sessions: $file"
}

# SESSION Dateien → SESSION_REPORT  
$sessionFiles = @(
    "CHAT-SESSION-SUMMARY-2025-10-01-from-update-manager.md",
    "DEV-SESSION-2025-10-10-v1.0.10-development-duplicate.md",
    "DEV-SESSION-2025-10-10-v1.0.10-development-report.md",
    "IMPL-SESSION-2025-10-13-field-mapping-subitems-analysis.md",
    "IMPL-SESSION-2025-10-13-subitems-packageform-pdf-fixes.md",
    "SESSION-2025-10-14-ABI-MISMATCH-AND-TEST-STATUS.md",
    "SESSION-2025-10-14-DATABASE-STRUCTURE-REPORT.md",
    "SESSION-2025-10-14-PACKAGELINEITEM-UNITPRICE-IMPLEMENTATION.md",
    "SESSION-2025-10-14-PACKAGELINEITEM-UNITPRICE-PLANNING.md",
    "SESSION-2025-10-14-PDF-SUBITEMS-BUG-SOLUTIONS.md",
    "SESSION-2025-10-14-SCHEMA-FIXES-AND-KI-FAILURE-ANALYSIS.md",
    "SESSION-2025-10-14-SOLUTION-COMPLIANCE-REVIEW.md",
    "SESSION-2025-10-14-VALIDATION-REPORT.md",
    "SESSION-2025-10-15-CURRENCY-FORMATTING-PROBLEM-HANDOVER.md",
    "SESSION-2025-10-15-PRICEDISPLAYMODE-FIX-AND-CURRENCY-BUG-ANALYSIS.md",
    "SESSION-HANDOVER-PLAN-2024-10-04-from-architecture.md",
    "SESSION-HANDOVER-PLAN-2024-10-04-from-legacy.md"
)

foreach ($file in $sessionFiles) {
    $cleanName = $file -replace '^(CHAT-SESSION-SUMMARY|DEV-SESSION|IMPL-SESSION|SESSION)-', '' -replace '\.md$', ''
    $cleanName = $cleanName.ToUpper() -replace '-', '-'
    
    Rename-DocumentationFile `
        -OldPath (Join-Path $lessonsSessionsPath $file) `
        -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_REPORT-SESSION-$cleanName.md") `
        -Description "06-lessons/sessions: $file"
}

# Spezielle Dateien
Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "CHAT_SUMMARY_PDF_ATTACHMENTS_12.10.2025.md") `
    -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_REPORT-CHAT-SUMMARY-PDF-ATTACHMENTS-2025-10-12.md") `
    -Description "06-lessons/sessions: CHAT_SUMMARY_PDF_ATTACHMENTS"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "IMPROVED-CLAUDE-PROMPT-PACKAGE-EDIT-ROUTE.md") `
    -NewPath (Join-Path $lessonsSessionsPath "VALIDATED_TEMPLATE-IMPROVED-CLAUDE-PROMPT-PACKAGE-EDIT-ROUTE-2025-10-15.md") `
    -Description "06-lessons/sessions: IMPROVED-CLAUDE-PROMPT"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "LEGACY-SESSION-2025-10-04-briefing.md") `
    -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_REPORT-LEGACY-SESSION-2025-10-04-BRIEFING.md") `
    -Description "06-lessons/sessions: LEGACY-SESSION"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "UI-SESSION-erfolgreiche-problemloesung-summary.md") `
    -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_REPORT-UI-SESSION-ERFOLGREICHE-PROBLEMLOESUNG-SUMMARY-2025-10-15.md") `
    -Description "06-lessons/sessions: UI-SESSION"

# PLAN Dateien
Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "PLAN_UNIFY_PACKAGE_UNITPRICE-archive.md") `
    -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_PLAN-UNIFY-PACKAGE-UNITPRICE-ARCHIVE-2025-10-15.md") `
    -Description "06-lessons/sessions: PLAN_UNIFY_PACKAGE_UNITPRICE-archive"

Rename-DocumentationFile `
    -OldPath (Join-Path $lessonsSessionsPath "PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF-archive.md") `
    -NewPath (Join-Path $lessonsSessionsPath "COMPLETED_PLAN-UNIFY-PACKAGE-UNITPRICE-QUICKREF-ARCHIVE-2025-10-15.md") `
    -Description "06-lessons/sessions: PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF-archive"

# ============================================================================
# ABSCHLUSS UND STATISTIKEN
# ============================================================================
Write-Host "📊 COMPREHENSIVE RENAME SUMMARY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Total Files Processed: $($script:TotalFiles)" -ForegroundColor White
Write-Host "Successfully Renamed:   $($script:RenamedFiles)" -ForegroundColor Green
Write-Host "Skipped (exists/missing/correct): $($script:SkippedFiles)" -ForegroundColor Yellow
Write-Host "Errors:                 $($script:ErrorFiles)" -ForegroundColor Red
Write-Host ""

if ($script:ErrorFiles -eq 0) {
    Write-Host "✅ Comprehensive rename completed!" -ForegroundColor Green
    Write-Host "🎉 All subfolders processed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run 'pnpm validate:critical-fixes' to ensure system integrity" -ForegroundColor Yellow
    Write-Host "Schema established: [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]-[DATUM].md" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some errors occurred during comprehensive rename!" -ForegroundColor Red
    Write-Host "Please review error messages above." -ForegroundColor Red
}