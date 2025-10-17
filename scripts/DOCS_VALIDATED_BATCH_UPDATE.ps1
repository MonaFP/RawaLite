# Batch Update Script for VALIDATED Documents
# Updates headers and filenames for documents with specific date patterns
param(
    [string]$FromDate = "2025-10-15",  # Default old date
    [string]$ToDate = "2025-10-17",    # Default new date
    [string]$RootPath = "C:\Users\ramon\Desktop\RawaLite\docs",
    [string]$UpdateReason = "Content modernization + ROOT_ integration"
)

Write-Host "🔄 Batch Document Update Tool" -ForegroundColor Cyan
Write-Host "From Date: $FromDate → To Date: $ToDate" -ForegroundColor Yellow
Write-Host "Root Path: $RootPath" -ForegroundColor Yellow
Write-Host "Update Reason: $UpdateReason" -ForegroundColor Yellow
Write-Host ""

$oldDate = $FromDate
$newDate = $ToDate

# Get all VALIDATED documents with old date format
$files = Get-ChildItem -Path $RootPath -Recurse -Filter "*VALIDATED*$oldDate.md"

Write-Host "Found $($files.Count) documents to update..." -ForegroundColor Yellow

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    
    # Create backup
    $backupPath = "$($file.FullName).bak"
    if (-not (Test-Path $backupPath)) {
        Copy-Item -Path $file.FullName -Destination $backupPath
        Write-Host "  ✅ Backup created" -ForegroundColor Green
    }
    
    # Read content
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Update header pattern 1: Simple headers
    $content = $content -replace '(\*\*Letzte Aktualisierung:\*\*\s*)[^|]*(\|[^*]*)?', ('$1' + $newDate + ' (' + $UpdateReason + ')$2')
    $content = $content -replace '(\*\*Datum:\*\*\s*)[^*]*', ('$1' + $newDate)
    $content = $content -replace '(\*\*Aktualisiert:\*\*\s*)[^|]*(\|[^*]*)?', ('$1' + $newDate + ' (' + $UpdateReason + ')$2')
    
    # Update header pattern 2: Markdown quote headers
    $content = $content -replace '(>\s*\*\*[^:]*:\*\*\s*[^|]*\|\s*\*\*Letzte Aktualisierung:\*\*\s*)[^(]*(\([^)]*\))?', ('$1' + $newDate + ' (' + $UpdateReason + ')')
    
    # Add ROOT_ integration header if not present
    if ($content -notmatch 'ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES') {
        # Find first # header
        if ($content -match '^#[^#].*$') {
            $headerEnd = $content.IndexOf("`n", $content.IndexOf($matches[0])) + 1
            if ($headerEnd -gt 0) {
                $beforeHeader = $content.Substring(0, $headerEnd)
                $afterHeader = $content.Substring($headerEnd)
                
                $rootIntegration = @"

> **⚠️ CRITICAL:** [../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - **MANDATORY READ vor jeder Änderung**  
> **🛡️ NEVER violate:** Siehe [../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - Essential patterns  
> **📚 ALWAYS:** `pnpm validate:critical-fixes` vor Änderungen  

"@
                $content = $beforeHeader + $rootIntegration + $afterHeader
            }
        }
    }
    
    # Write updated content
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    
    # Rename file
    $newFileName = $file.Name -replace $oldDate, $newDate
    $newFilePath = Join-Path -Path $file.Directory.FullName -ChildPath $newFileName
    
    if ($file.FullName -ne $newFilePath) {
        Move-Item -Path $file.FullName -Destination $newFilePath
        Write-Host "  ✅ Renamed to: $newFileName" -ForegroundColor Green
    } else {
        Write-Host "  ✅ Content updated" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Batch update completed! Updated $($files.Count) documents." -ForegroundColor Green
Write-Host "🔍 Running critical fixes validation..." -ForegroundColor Yellow

# Run validation
Set-Location "C:\Users\ramon\Desktop\RawaLite"
& pnpm validate:critical-fixes