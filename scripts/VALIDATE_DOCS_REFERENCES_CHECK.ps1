# Documentation Reference Validator
# Validates all documentation references and detects broken links

Write-Host "🔍 DOCUMENTATION REFERENCE VALIDATOR" -ForegroundColor Cyan

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$docsPath = Join-Path $projectRoot "docs"

# Critical files that must exist
$criticalFiles = @(
    "ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md",
    "ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md",
    "ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md",
    "ROOT_VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-20.md",
    "ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-20.md"
)

Write-Host "`n📋 Validating critical ROOT files..." -ForegroundColor Yellow

$missingCritical = @()
foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $docsPath $file
    if (-not (Test-Path $fullPath)) {
        $missingCritical += $file
        Write-Host "❌ MISSING: $file" -ForegroundColor Red
    } else {
        Write-Host "✅ FOUND: $file" -ForegroundColor Green
    }
}

Write-Host "`n🔗 Scanning for broken internal references..." -ForegroundColor Yellow

$brokenRefs = @()
$validatedRefs = 0

# Get all markdown files
$markdownFiles = Get-ChildItem -Path $docsPath -Filter "*.md" -Recurse

foreach ($file in $markdownFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Find markdown links [text](path.md)
    $links = [regex]::Matches($content, '\[([^\]]+)\]\(([^)]+\.md)\)')
    
    foreach ($link in $links) {
        $linkPath = $link.Groups[2].Value
        $linkText = $link.Groups[1].Value
        
        # Skip external links
        if ($linkPath.StartsWith("http")) { continue }
        
        # Resolve relative path
        $basePath = Split-Path -Parent $file.FullName
        $targetPath = Join-Path $basePath $linkPath
        $targetPath = [System.IO.Path]::GetFullPath($targetPath)
        
        if (-not (Test-Path $targetPath)) {
            $relativePath = $file.FullName.Replace($docsPath, "docs").Replace("\", "/")
            $brokenRefs += @{
                File = $relativePath
                LinkText = $linkText  
                LinkPath = $linkPath
                Line = ($content.Substring(0, $link.Index) -split "`n").Count
            }
            Write-Host "❌ BROKEN: $relativePath -> $linkPath" -ForegroundColor Red
        } else {
            $validatedRefs++
        }
    }
}

Write-Host "`n📊 VALIDATION RESULTS:" -ForegroundColor Cyan
Write-Host "   ✅ Valid references: $validatedRefs" -ForegroundColor Green
Write-Host "   ❌ Broken references: $($brokenRefs.Count)" -ForegroundColor Red
Write-Host "   🚨 Missing critical files: $($missingCritical.Count)" -ForegroundColor Red

if ($brokenRefs.Count -eq 0 -and $missingCritical.Count -eq 0) {
    Write-Host "`n🎉 SUCCESS: Documentation system is healthy!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n🚨 ISSUES DETECTED:" -ForegroundColor Red
    
    if ($missingCritical.Count -gt 0) {
        Write-Host "`n💥 Missing critical files:" -ForegroundColor Red
        foreach ($file in $missingCritical) {
            Write-Host "   - $file" -ForegroundColor Red
        }
    }
    
    if ($brokenRefs.Count -gt 0) {
        Write-Host "`n🔗 Broken references:" -ForegroundColor Red
        foreach ($ref in $brokenRefs) {
            Write-Host "   📄 $($ref.File):$($ref.Line)" -ForegroundColor White
            Write-Host "      '$($ref.LinkText)' -> $($ref.LinkPath)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n🛠️  Recommended actions:" -ForegroundColor Yellow
    Write-Host "   1. Run FIX_BROKEN_DOCUMENTATION_REFERENCES.ps1" -ForegroundColor White
    Write-Host "   2. Restore missing critical files from backups" -ForegroundColor White
    Write-Host "   3. Update outdated references manually" -ForegroundColor White
    
    exit 1
}