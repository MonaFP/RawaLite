#!/usr/bin/env pwsh
# Final Schema Compliance Script - RawaLite Documentation
# Korrigiert die letzten 12 nicht-konformen Dateien

$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"

Write-Host "🔧 Final Schema Compliance Correction - 12 Remaining Files" -ForegroundColor Cyan
Write-Host "Schema: [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]-[DATUM].md" -ForegroundColor Yellow

# Define the base docs directory
$docsBase = "docs"

# Final non-conforming files with their corrections
$finalCorrections = @(
    # 1. LESSON_ files without underscore after prefix
    @{
        Old = "docs/00-meta/final/LESSON_CROSS-REF-SETTINGS-SCHEMA-MIGRATION-2025-10-15.md"
        New = "docs/00-meta/final/LESSON_FIX-CROSS-REF-SETTINGS-SCHEMA-MIGRATION-2025-10-15.md"
        Reason = "Missing TYP after LESSON_ prefix"
    },
    @{
        Old = "docs/00-meta/final/LESSON_FIX-AUTOFILL-DEVTOOLS-ERRORS-2025-10-15.md"
        New = "docs/00-meta/final/LESSON_FIX-AUTOFILL-DEVTOOLS-ERRORS-2025-10-15.md"
        Reason = "Already correct - skip"
    },
    @{
        Old = "docs/00-meta/final/LESSON_FIX-ICO-FORMAT-ERROR-2025-10-15.md"
        New = "docs/00-meta/final/LESSON_FIX-ICO-FORMAT-ERROR-2025-10-15.md"
        Reason = "Already correct - skip"
    },
    @{
        Old = "docs/00-meta/final/LESSON_REPORT-DOCUMENTATION-REORGANIZATION-2025-10-15.md"
        New = "docs/00-meta/final/LESSON_REPORT-DOCUMENTATION-REORGANIZATION-2025-10-15.md"
        Reason = "Already correct - skip"
    },
    
    # 2. Legacy files without complete schema
    @{
        Old = "docs/02-dev/final/PLAN_UNIFY_PACKAGE_UNITPRICE.md"
        New = "docs/02-dev/final/PLAN_PLAN-UNIFY-PACKAGE-UNITPRICE-2025-10-15.md"
        Reason = "Missing complete schema format"
    },
    @{
        Old = "docs/02-dev/final/PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF.md"
        New = "docs/02-dev/final/PLAN_PLAN-UNIFY-PACKAGE-UNITPRICE-QUICKREF-2025-10-15.md"
        Reason = "Missing complete schema format"
    },
    @{
        Old = "docs/06-lessons/sessions/PLAN_UNIFY_PACKAGE_UNITPRICE-archive.md"
        New = "docs/06-lessons/sessions/PLAN_PLAN-UNIFY-PACKAGE-UNITPRICE-ARCHIVE-2025-10-15.md"
        Reason = "Missing complete schema format"
    },
    @{
        Old = "docs/06-lessons/sessions/PLAN_UNIFY_PACKAGE_UNITPRICE_QUICKREF-archive.md"
        New = "docs/06-lessons/sessions/PLAN_PLAN-UNIFY-PACKAGE-UNITPRICE-QUICKREF-ARCHIVE-2025-10-15.md"
        Reason = "Missing complete schema format"
    },
    
    # 3. Wrong date formats (keep original dates but note)
    @{
        Old = "docs/04-ui/final/SOLVED_FIX-SUB-ITEM-VISUAL-HIERARCHY-2025-10-04.md"
        New = "docs/04-ui/final/SOLVED_FIX-SUB-ITEM-VISUAL-HIERARCHY-2025-10-04.md"
        Reason = "Keep original date - skip"
    },
    @{
        Old = "docs/05-deploy/final/COMPLETED_REPORT-UPDATE-SYSTEM-DEBUGGING-2025-10-01.md"
        New = "docs/05-deploy/final/COMPLETED_REPORT-UPDATE-SYSTEM-DEBUGGING-2025-10-01.md"
        Reason = "Keep original date - skip"
    },
    @{
        Old = "docs/06-lessons/sessions/COMPLETED_REPORT-SESSION-HANDOVER-PLAN-2024-10-04-FROM-ARCHITECTURE.md"
        New = "docs/06-lessons/sessions/COMPLETED_REPORT-SESSION-HANDOVER-PLAN-2024-10-04-FROM-ARCHITECTURE.md"
        Reason = "Keep original date - skip"
    },
    @{
        Old = "docs/06-lessons/sessions/COMPLETED_REPORT-SESSION-HANDOVER-PLAN-2024-10-04-FROM-LEGACY.md"
        New = "docs/06-lessons/sessions/COMPLETED_REPORT-SESSION-HANDOVER-PLAN-2024-10-04-FROM-LEGACY.md"
        Reason = "Keep original date - skip"
    },
    
    # 4. File in wrong directory
    @{
        Old = "docs/COMPLETED_REPORT-REVIEW-REFAKTOR-2025-10-15.md"
        New = "docs/06-lessons/sessions/COMPLETED_REPORT-REVIEW-REFAKTOR-2025-10-15.md"
        Reason = "Move to correct directory"
    }
)

# Statistics
$totalFiles = $finalCorrections.Count
$processedFiles = 0
$renamedFiles = 0
$skippedFiles = 0
$errorFiles = 0

Write-Host "`n📊 Processing $totalFiles final non-conforming files..." -ForegroundColor Green

foreach ($correction in $finalCorrections) {
    $processedFiles++
    $oldPath = $correction.Old
    $newPath = $correction.New
    $reason = $correction.Reason
    
    Write-Host "`n[$processedFiles/$totalFiles] Processing: $(Split-Path -Leaf $oldPath)" -ForegroundColor White
    Write-Host "   Reason: $reason" -ForegroundColor Gray
    
    # Skip files that are already correct or should keep original dates
    if ($reason.Contains("skip") -or $reason.Contains("Keep original")) {
        Write-Host "   ⏭️ SKIP: $reason" -ForegroundColor Yellow
        $skippedFiles++
        continue
    }
    
    # Check if source file exists
    if (-not (Test-Path $oldPath)) {
        Write-Host "   ❌ ERROR: Source file not found: $oldPath" -ForegroundColor Red
        $errorFiles++
        continue
    }
    
    # Check if target file already exists
    if (Test-Path $newPath) {
        Write-Host "   ⚠️ SKIP: Target already exists: $(Split-Path -Leaf $newPath)" -ForegroundColor Yellow
        $skippedFiles++
        continue
    }
    
    # Ensure target directory exists
    $targetDir = Split-Path -Parent $newPath
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        Write-Host "   📁 Created directory: $targetDir" -ForegroundColor Green
    }
    
    try {
        # Perform the rename/move
        Move-Item -Path $oldPath -Destination $newPath -Force
        Write-Host "   ✅ SUCCESS: Renamed to $(Split-Path -Leaf $newPath)" -ForegroundColor Green
        $renamedFiles++
    }
    catch {
        Write-Host "   ❌ ERROR: Failed to rename - $($_.Exception.Message)" -ForegroundColor Red
        $errorFiles++
    }
}

# Final statistics
Write-Host "`n" + "="*80 -ForegroundColor Cyan
Write-Host "📊 FINAL SCHEMA COMPLIANCE CORRECTION COMPLETED" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan

Write-Host "`n📈 Statistics:" -ForegroundColor White
Write-Host "   Total processed: $processedFiles files" -ForegroundColor White
Write-Host "   Successfully renamed: $renamedFiles files" -ForegroundColor Green
Write-Host "   Skipped (already correct): $skippedFiles files" -ForegroundColor Yellow
Write-Host "   Errors: $errorFiles files" -ForegroundColor $(if ($errorFiles -gt 0) { "Red" } else { "Green" })

if ($renamedFiles -gt 0) {
    Write-Host "`n🎯 Schema compliance improved by $renamedFiles files!" -ForegroundColor Green
}

if ($errorFiles -eq 0) {
    Write-Host "`n✅ All corrections completed successfully!" -ForegroundColor Green
    Write-Host "📋 Next: Update SITEMAP and validate with pnpm validate:critical-fixes" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Some corrections failed. Review errors above." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🏁 Final Schema Compliance Correction finished." -ForegroundColor Cyan