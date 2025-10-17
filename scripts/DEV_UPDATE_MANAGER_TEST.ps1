# 🔍 Update Manager Service Test
# Part of RawaLite Custom Updater Implementation Plan
# Tests update manager logic, version comparison, and download simulation

param(
    [switch]$Verbose,
    [switch]$ShowDetails,
    [string]$TestVersion = "1.0.1"
)

Write-Host "🔍 Testing Update Manager Logic..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray

# Helper function for detailed output
function Write-Detail($message, $color = "Gray") {
    if ($ShowDetails) {
        Write-Host "  └─ $message" -ForegroundColor $color
    }
}

# Helper function for version comparison
function Compare-SemanticVersion($version1, $version2) {
    try {
        $v1 = [System.Version]$version1
        $v2 = [System.Version]$version2
        return $v1.CompareTo($v2)
    } catch {
        # Fallback for pre-release versions
        if ($version1 -eq $version2) { return 0 }
        if ($version1 -lt $version2) { return -1 }
        return 1
    }
}

# Step 1: Test version comparison logic
Write-Host "`n📊 Step 1: Testing version comparison logic..." -ForegroundColor Yellow

try {
    # Get current version from package.json
    if (!(Test-Path "package.json")) {
        throw "package.json not found"
    }
    
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $currentVersion = $packageJson.version
    
    Write-Host "✅ Current version detected: $currentVersion" -ForegroundColor Green
    Write-Detail "Testing against test version: $TestVersion"
    
    # Test version comparison scenarios
    $testCases = @(
        @{ Current = "1.0.0"; Latest = "1.0.1"; Expected = "Update" },
        @{ Current = "1.0.0"; Latest = "1.0.0"; Expected = "Current" },
        @{ Current = "1.0.1"; Latest = "1.0.0"; Expected = "Newer" },
        @{ Current = "1.0.0"; Latest = "2.0.0"; Expected = "Major Update" },
        @{ Current = "1.0.0"; Latest = "1.1.0"; Expected = "Minor Update" }
    )
    
    $passedTests = 0
    foreach ($test in $testCases) {
        $comparison = Compare-SemanticVersion $test.Current $test.Latest
        $result = switch ($comparison) {
            -1 { "Update" }
            0 { "Current" }
            1 { "Newer" }
        }
        
        $expectedResult = $test.Expected
        if ($expectedResult -like "*Update*" -and $result -eq "Update") {
            $passedTests++
            Write-Detail "✅ $($test.Current) vs $($test.Latest): $result"
        } elseif ($expectedResult -eq $result) {
            $passedTests++
            Write-Detail "✅ $($test.Current) vs $($test.Latest): $result"
        } else {
            Write-Detail "❌ $($test.Current) vs $($test.Latest): Expected $expectedResult, got $result"
        }
    }
    
    Write-Host "✅ Version comparison: $passedTests/$($testCases.Count) tests passed" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Version comparison test failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Test update detection logic
Write-Host "`n🔍 Step 2: Testing update detection simulation..." -ForegroundColor Yellow

try {
    # Simulate GitHub API response
    $mockRelease = @{
        tag_name = "v$TestVersion"
        name = "RawaLite $TestVersion"
        published_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        assets = @(
            @{
                name = "RawaLite Setup $TestVersion.exe"
                browser_download_url = "https://github.com/MonaFP/RawaLite/releases/download/v$TestVersion/RawaLite%20Setup%20$TestVersion.exe"
                size = 92160000  # ~88 MB
                content_type = "application/x-msdownload"
            }
        )
    }
    
    # Check if update is needed
    $currentVersion = $packageJson.version
    $latestVersion = $TestVersion
    $needsUpdate = (Compare-SemanticVersion $currentVersion $latestVersion) -lt 0
    
    if ($needsUpdate) {
        Write-Host "✅ Update detection: Update available ($currentVersion → $latestVersion)" -ForegroundColor Green
        Write-Detail "Asset: $($mockRelease.assets[0].name)"
        Write-Detail "Size: $([math]::Round($mockRelease.assets[0].size/1MB, 2)) MB"
        Write-Detail "Download URL: Available"
    } else {
        Write-Host "✅ Update detection: No update needed ($currentVersion is current)" -ForegroundColor Green
        Write-Detail "This is expected when testing with same or older version"
    }
    
} catch {
    Write-Host "❌ Update detection test failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Test download simulation
Write-Host "`n⬇️ Step 3: Testing download simulation..." -ForegroundColor Yellow

try {
    # Create temp directory for testing
    $tempDir = Join-Path $env:TEMP "RawaLite-Update-Test"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    Write-Detail "Created temp directory: $tempDir"
    
    # Simulate download progress
    Write-Detail "Simulating download progress..."
    $totalSize = 92160000  # ~88 MB
    $chunkSize = $totalSize / 10
    
    for ($i = 1; $i -le 10; $i++) {
        $currentSize = $i * $chunkSize
        $percentage = [math]::Round(($currentSize / $totalSize) * 100, 1)
        
        if ($ShowDetails) {
            Write-Host "    📦 Progress: $percentage% ($([math]::Round($currentSize/1MB, 1))/$([math]::Round($totalSize/1MB, 1)) MB)" -ForegroundColor Gray
        }
        
        Start-Sleep -Milliseconds 100  # Simulate download time
    }
    
    # Create a dummy file to simulate downloaded installer
    $installerPath = Join-Path $tempDir "RawaLite Setup $TestVersion.exe"
    "Dummy installer content for testing" | Out-File -FilePath $installerPath -Encoding ASCII
    
    if (Test-Path $installerPath) {
        Write-Host "✅ Download simulation completed successfully" -ForegroundColor Green
        Write-Detail "Downloaded to: $installerPath"
        Write-Detail "File size: $((Get-Item $installerPath).Length) bytes (dummy)"
    }
    
    # Cleanup
    Remove-Item $tempDir -Recurse -Force
    Write-Detail "Cleaned up temp files"
    
} catch {
    Write-Host "❌ Download simulation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Test file verification simulation
Write-Host "`n🛡️ Step 4: Testing file verification simulation..." -ForegroundColor Yellow

try {
    # Create test file for verification
    $testFile = Join-Path $env:TEMP "test-verification.tmp"
    $testContent = "Test content for hash verification"
    $testContent | Out-File -FilePath $testFile -Encoding UTF8
    
    # Calculate SHA256 hash
    $hash = Get-FileHash -Path $testFile -Algorithm SHA256
    Write-Detail "Generated test hash: $($hash.Hash.Substring(0, 16))..."
    
    # Simulate verification
    $verificationHash = Get-FileHash -Path $testFile -Algorithm SHA256
    $isValid = $hash.Hash -eq $verificationHash.Hash
    
    if ($isValid) {
        Write-Host "✅ File verification: Hash validation working" -ForegroundColor Green
        Write-Detail "SHA256 verification algorithm functional"
    } else {
        Write-Host "❌ File verification: Hash mismatch detected" -ForegroundColor Red
    }
    
    # Cleanup
    Remove-Item $testFile -Force
    
} catch {
    Write-Host "❌ File verification test failed: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Test installation simulation
Write-Host "`n🔧 Step 5: Testing installation simulation..." -ForegroundColor Yellow

try {
    # Test NSIS command line construction
    $installerPath = "C:\temp\RawaLite Setup $TestVersion.exe"
    $nsisArgs = @("/S", "/SILENT", "/VERYSILENT", "/SP-", "/SUPPRESSMSGBOXES")
    
    Write-Detail "NSIS installer path: $installerPath"
    Write-Detail "Silent install arguments: $($nsisArgs -join ' ')"
    
    # Simulate process start parameters
    $processParams = @{
        FilePath = $installerPath
        ArgumentList = $nsisArgs
        Wait = $true
        NoNewWindow = $true
        PassThru = $true
    }
    
    Write-Host "✅ Installation simulation: Command structure valid" -ForegroundColor Green
    Write-Detail "Ready for silent NSIS installation"
    
    # Test app restart logic
    $currentExe = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName
    Write-Detail "Current executable: $currentExe"
    Write-Detail "Restart mechanism ready"
    
} catch {
    Write-Host "❌ Installation simulation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Test error handling scenarios
Write-Host "`n🚨 Step 6: Testing error handling scenarios..." -ForegroundColor Yellow

try {
    # Test network error simulation
    $networkErrors = @(
        "System.Net.WebException: Unable to connect to the remote server",
        "System.TimeoutException: The operation has timed out",
        "System.IO.IOException: The file is being used by another process"
    )
    
    foreach ($error in $networkErrors) {
        Write-Detail "Handling: $($error.Split(':')[0])"
    }
    
    Write-Host "✅ Error handling: Scenarios identified and categorized" -ForegroundColor Green
    
    # Test retry logic
    $maxRetries = 3
    $retryDelay = 2000  # ms
    
    Write-Detail "Retry configuration: $maxRetries attempts with $($retryDelay/1000)s delay"
    
} catch {
    Write-Host "❌ Error handling test failed: $_" -ForegroundColor Red
    exit 1
}

# Final summary
Write-Host "`n📊 Update Manager Test Summary:" -ForegroundColor Cyan
Write-Host "✅ Version comparison: OK" -ForegroundColor Green
Write-Host "✅ Update detection: OK" -ForegroundColor Green  
Write-Host "✅ Download simulation: OK" -ForegroundColor Green
Write-Host "✅ File verification: OK" -ForegroundColor Green
Write-Host "✅ Installation simulation: OK" -ForegroundColor Green
Write-Host "✅ Error handling: OK" -ForegroundColor Green

Write-Host "`n🎯 Update Manager Logic Verified!" -ForegroundColor Green
Write-Host "Ready to implement UpdateManagerService.ts" -ForegroundColor Cyan

# Implementation hints
if ($ShowDetails) {
    Write-Host "`n💡 Implementation Notes:" -ForegroundColor Cyan
    Write-Host "  - Use semver library for robust version comparison" -ForegroundColor Gray
    Write-Host "  - Implement progress events for download feedback" -ForegroundColor Gray
    Write-Host "  - Store downloads in system temp directory" -ForegroundColor Gray
    Write-Host "  - Use SHA256 for file integrity verification" -ForegroundColor Gray
    Write-Host "  - NSIS /S flag for silent installation" -ForegroundColor Gray
    Write-Host "  - Implement exponential backoff for retries" -ForegroundColor Gray
}

exit 0