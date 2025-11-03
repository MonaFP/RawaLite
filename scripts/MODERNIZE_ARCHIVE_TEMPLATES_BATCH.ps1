#!/usr/bin/env pwsh
# MODERNIZE_ARCHIVE_TEMPLATES_BATCH.ps1
# Batch-Update: Replace CAVE-markers with modern KI-AUTO-DETECTION SYSTEM
# Target: docs/09-archive/ files with outdated template pattern

param([switch]$DryRun = $false)

$ErrorActionPreference = "Continue"
Write-Host "🔄 BATCH MODERNIZATION: Archive Templates" -ForegroundColor Cyan
Write-Host "Mode: $(if ($DryRun) { 'DRY-RUN' } else { 'LIVE' })" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$caveMarker = "CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED"

Write-Host "📋 Processing archive files..." -ForegroundColor Gray
Write-Host ""

# Get all LESSON_FIX files with CAVE-markers
Get-ChildItem -Path "docs\09-archive\Knowledge\LESSON_FIX" -Filter "*.md" -File | ForEach-Object {
    $filePath = $_.FullName
    $fileName = $_.Name
    $content = Get-Content $filePath -Raw
    
    if ($content -like "*$caveMarker*") {
        Write-Host "✅ $fileName"
        if (-not $DryRun) {
            $newContent = $content -replace "CAVE:  \*\*🤖 KI-AUTO-DETECTION SYSTEM NEEDED.*?\*\*", ">>> **🤖 KI-AUTO-DETECTION SYSTEM:**`n> - **STATUS:** KNOWLEDGE_ONLY"
            Set-Content -Path $filePath -Value $newContent -Encoding UTF8
        }
        $successCount++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 MODERNIZATION: $successCount files updated" -ForegroundColor Green
if ($DryRun) { Write-Host "   (DRY-RUN - no changes)" -ForegroundColor Yellow }
Write-Host ""
