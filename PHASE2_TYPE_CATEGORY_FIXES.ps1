# Phase 2: Type-Category Fixes for 52 files
# Strategy: Intelligente TYPE-Kategorie-Zuordnung basierend auf Dateinamen + Status-Präfix

$basePath = "C:\Users\ramon\Desktop\RawaLite"
$renames = @()

# === PHASE 2 RULES ===
# COMPLETED_* + PHASE/STEP/IMPL → COMPLETED_IMPL-*
# KNOWLEDGE_ONLY_COMPLETED_* → KNOWLEDGE_ONLY_IMPL-*
# LESSON_* ohne TYP → LESSON_FIX-*
# Alle anderen ohne TYP → intelligente Zuweisung basierend auf Content-Type

# ===== 02-dev: 4 COMPLETED_PHASE2-STEP files =====
$phase2_dev = @(
    @{src='02-dev/COMPLETED/COMPLETED_PHASE2-STEP1-BACKEND-IPC-HANDLERS_2025-11-03.md'; type='IMPL'},
    @{src='02-dev/COMPLETED/COMPLETED_PHASE2-STEP2-FRONTEND-BINDING-INTEGRATION_2025-11-03.md'; type='IMPL'},
    @{src='02-dev/COMPLETED/COMPLETED_PHASE2-STEP3-CROSS-PROCESS-TESTING_2025-11-03.md'; type='IMPL'},
    @{src='02-dev/COMPLETED/COMPLETED_PHASE2-STEP4-DOCUMENTATION-UPDATE_2025-11-03.md'; type='IMPL'}
)

foreach ($f in $phase2_dev) {
    $oldName = Split-Path $f.src -Leaf
    # COMPLETED_PHASE2-STEP* → COMPLETED_IMPL-PHASE2-STEP*
    $newName = $oldName -replace 'COMPLETED_PHASE2-', 'COMPLETED_IMPL-PHASE2-'
    $renames += @{src=$f.src; dst=$newName; folder='02-dev'}
}

# ===== 04-ui: 1 KNOWLEDGE_ONLY_COMPLETED_VISUALISIERUNG file =====
# KNOWLEDGE_ONLY_COMPLETED_VISUALISIERUNG* → KNOWLEDGE_ONLY_IMPL-VISUALISIERUNG*
$oldName_ui = "KNOWLEDGE_ONLY_COMPLETED_VISUALISIERUNG-GRID-AUFBAU-ENHANCED-FOCUS-BAR_2025-10-24.md"
$newName_ui = "KNOWLEDGE_ONLY_IMPL-VISUALISIERUNG-GRID-AUFBAU-ENHANCED-FOCUS-BAR_2025-10-24.md"
$renames += @{src="04-ui/COMPLETED/$oldName_ui"; dst=$newName_ui; folder='04-ui'}

# ===== 06-handbook: 21 files with missing TYPE-KATEGORIE =====
# Strategy: Intelligente Zuweisung basierend auf Präfix + Inhalt
# LESSON_* → LESSON_FIX-* (für Debugging/Lessons)
# VALIDATED_TEMPLATE-* → bleibt wie ist (TEMPLATE ist TYPE)
# VALIDATED_ANTIPATTERN-* → VALIDATED_FIX-ANTIPATTERN-* (Anti-Patterns sind FIX-bezogen)
# VALIDATED_GUIDE-* → bleibt wie ist (GUIDE ist TYPE)

$handbook_files = @(
    @{src='06-handbook/LESSON/LESSON_ANTIPATTERN-KI-APP-START-SLEEP-INTERRUPTION_2025-10-28.md'; dst='LESSON_FIX-ANTIPATTERN-KI-APP-START-SLEEP-INTERRUPTION_2025-10-28.md'; type='FIX'},
    @{src='06-handbook/ANTIPATTERN/VALIDATED_ANTIPATTERN-KI-MISSING-VALIDATION_2025-10-27.md'; dst='VALIDATED_FIX-ANTIPATTERN-KI-MISSING-VALIDATION_2025-10-27.md'; type='FIX'},
    @{src='06-handbook/ANTIPATTERN/VALIDATED_ANTIPATTERN-KI-MISTAKES_2025-10-26.md'; dst='VALIDATED_FIX-ANTIPATTERN-KI-MISTAKES_2025-10-26.md'; type='FIX'},
    # Additional handbook files that need TYPE (intelligente Zuweisung)
)

# Scan 06-handbook for additional files without TYPE
$handbookPath = "$basePath\docs\06-handbook"
$handbookFiles = @(
    (Get-ChildItem -Recurse -Path "$handbookPath" -Filter "LESSON_*.md" | Where-Object {$_.Name -notmatch '_[A-Z]+-' -or $_.Name -match 'LESSON_[A-Z]+-'})
    (Get-ChildItem -Recurse -Path "$handbookPath" -Filter "VALIDATED_*.md" | Where-Object {$_.Name -notmatch '^VALIDATED_[A-Z]+-' -and $_.Name -notmatch '^VALIDATED_TEMPLATE-'})
)

foreach ($file in $handbookFiles) {
    $relativePath = $file.FullName -replace [regex]::Escape("$basePath\docs\"), ''
    $oldName = $file.Name
    
    # Intelligente Zuweisung basierend auf Präfix
    if ($oldName -match 'LESSON_') {
        $newName = $oldName -replace 'LESSON_', 'LESSON_FIX-'
    } elseif ($oldName -match 'VALIDATED_ANTIPATTERN') {
        $newName = $oldName -replace 'VALIDATED_ANTIPATTERN-', 'VALIDATED_FIX-ANTIPATTERN-'
    } elseif ($oldName -match 'VALIDATED_GUIDE') {
        # GUIDE bereits TYPE - skip
        continue
    } elseif ($oldName -match 'VALIDATED_TEMPLATE') {
        # TEMPLATE bereits TYPE - skip
        continue
    } else {
        # Default: REPORT für nicht-zugeordnete
        $newName = $oldName -replace 'VALIDATED_', 'VALIDATED_REPORT-'
    }
    
    $renames += @{src=$relativePath; dst=$newName; folder='06-handbook'}
}

# ===== 09-archive: Liberal - nur wenn clearly mismatched =====
# Skip für Archive - liberal acceptable per specification

# ===== EXECUTE RENAMES =====
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           PHASE 2: TYPE-CATEGORY FIXES                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$successCount = 0
$skipCount = 0
$failCount = 0

foreach ($rename in $renames) {
    $fullSrc = "$basePath\docs\$($rename.src)"
    $folder = Split-Path $rename.src | Split-Path -Leaf
    
    if (-not (Test-Path $fullSrc)) {
        Write-Host "⏭️  SKIP (not found): $($rename.src)"
        $skipCount++
        continue
    }
    
    if ($rename.src -eq $rename.dst) {
        Write-Host "⏭️  SKIP (same name): $($rename.dst)"
        $skipCount++
        continue
    }
    
    $dstPath = Join-Path (Split-Path $fullSrc) $rename.dst
    
    try {
        Rename-Item -Path $fullSrc -NewName $rename.dst -ErrorAction Stop
        Write-Host "✅ $($rename.folder): $($rename.src) → $($rename.dst)"
        $successCount++
    } catch {
        Write-Host "❌ ERROR: $($rename.src) - $_"
        $failCount++
    }
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              PHASE 2 RESULTS                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n📊 Statistics:"
Write-Host "   ✅ Success:        $successCount files"
Write-Host "   ⏭️  Skipped:        $skipCount files (not found or same name)"
Write-Host "   ❌ Failed:         $failCount files"
Write-Host "`nℹ️  Note: 06-handbook 21 files liberal - already TEMPLATE/GUIDE type OR correctly named"
Write-Host "         09-archive: liberal acceptable (archive folder)"
Write-Host "`n"
