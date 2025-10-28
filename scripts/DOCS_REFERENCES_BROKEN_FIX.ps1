# Fix Broken Documentation References - Emergency Repair Script
# Repairs all broken references to the renamed central paths file

Write-Host "🚨 EMERGENCY: Fixing broken documentation references..." -ForegroundColor Red

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$docsPath = Join-Path $projectRoot "docs"

# Define the reference mapping
$oldReference = "VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md"
$newReference = "ROOT_VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-20.md"

Write-Host "🔍 Scanning for broken references..." -ForegroundColor Yellow
Write-Host "   FROM: $oldReference" -ForegroundColor Red
Write-Host "   TO:   $newReference" -ForegroundColor Green

# Get all markdown files in docs directory
$markdownFiles = Get-ChildItem -Path $docsPath -Filter "*.md" -Recurse

$totalFiles = $markdownFiles.Count
$processedFiles = 0
$fixedFiles = 0
$totalReplacements = 0

foreach ($file in $markdownFiles) {
    $processedFiles++
    $relativePath = $file.FullName.Replace($docsPath, "docs").Replace("\", "/")
    
    Write-Progress -Activity "Fixing Documentation References" -Status "Processing $relativePath" -PercentComplete (($processedFiles / $totalFiles) * 100)
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Replace all occurrences of the old reference
        $content = $content -replace [regex]::Escape($oldReference), $newReference
        
        # Count how many replacements were made
        $replacements = ([regex]::Matches($originalContent, [regex]::Escape($oldReference))).Count
        
        if ($replacements -gt 0) {
            # Write the fixed content back
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            
            $fixedFiles++
            $totalReplacements += $replacements
            
            Write-Host "✅ FIXED: $relativePath ($replacements replacements)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ ERROR processing $relativePath : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Progress -Activity "Fixing Documentation References" -Completed

Write-Host "`n🎯 REPAIR SUMMARY:" -ForegroundColor Cyan
Write-Host "   📄 Files processed: $processedFiles" -ForegroundColor White
Write-Host "   🔧 Files fixed: $fixedFiles" -ForegroundColor Green
Write-Host "   🔄 Total replacements: $totalReplacements" -ForegroundColor Yellow

if ($fixedFiles -gt 0) {
    Write-Host "`n✅ SUCCESS: All broken references have been repaired!" -ForegroundColor Green
    Write-Host "   The documentation system is now consistent." -ForegroundColor White
} else {
    Write-Host "`n⚠️  No broken references found (already fixed?)" -ForegroundColor Yellow
}

Write-Host "`n🔍 Verification: Run this to check for remaining issues:" -ForegroundColor Cyan
Write-Host "   grep -r '$oldReference' docs/" -ForegroundColor Gray

Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify the central paths file is accessible" -ForegroundColor White
Write-Host "   2. Test documentation navigation" -ForegroundColor White  
Write-Host "   3. Update any remaining hardcoded references" -ForegroundColor White

Write-Host "`n🚀 Documentation reference repair completed!" -ForegroundColor Green