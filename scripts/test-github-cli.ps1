# 🔍 GitHub CLI Integration Test
# Part of RawaLite Custom Updater Implementation Plan
# Tests GitHub CLI availability, authentication, and repository access

param(
    [switch]$Verbose,
    [switch]$ShowDetails
)

Write-Host "🔍 Testing GitHub CLI Integration..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray

# Helper function for detailed output
function Write-Detail($message, $color = "Gray") {
    if ($ShowDetails) {
        Write-Host "  └─ $message" -ForegroundColor $color
    }
}

# Step 1: Check GitHub CLI installation
Write-Host "`n📦 Step 1: Checking GitHub CLI installation..." -ForegroundColor Yellow

try {
    $ghVersion = gh --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GitHub CLI found" -ForegroundColor Green
        Write-Detail "Version: $($ghVersion -split "`n" | Select-Object -First 1)"
    } else {
        throw "GitHub CLI not found"
    }
} catch {
    Write-Host "❌ GitHub CLI not found" -ForegroundColor Red
    Write-Host "Please install from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host "Or use: winget install GitHub.CLI" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check authentication status
Write-Host "`n🔐 Step 2: Checking authentication status..." -ForegroundColor Yellow

try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GitHub CLI authenticated" -ForegroundColor Green
        if ($ShowDetails) {
            Write-Detail "Auth status: $($authStatus -join ' | ')"
        }
    } else {
        throw "Not authenticated"
    }
} catch {
    Write-Host "❌ GitHub CLI not authenticated" -ForegroundColor Red
    Write-Host "Please run: gh auth login" -ForegroundColor Yellow
    Write-Host "Then select 'Login with a web browser' for best experience" -ForegroundColor Yellow
    exit 1
}

# Step 3: Test repository access
Write-Host "`n🔗 Step 3: Testing repository access..." -ForegroundColor Yellow

try {
    Write-Detail "Accessing MonaFP/RawaLite repository..."
    $repoInfo = gh api repos/MonaFP/RawaLite --jq '{name: .name, private: .private, default_branch: .default_branch}' 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Repository access confirmed" -ForegroundColor Green
        $repo = $repoInfo | ConvertFrom-Json
        Write-Detail "Repository: $($repo.name)"
        Write-Detail "Default branch: $($repo.default_branch)"
        Write-Detail "Private: $($repo.private)"
    } else {
        throw "Repository access failed"
    }
} catch {
    Write-Host "❌ Failed to access repository" -ForegroundColor Red
    Write-Host "Please check repository permissions and name" -ForegroundColor Yellow
    exit 1
}

# Step 4: Test releases API
Write-Host "`n📋 Step 4: Testing releases API..." -ForegroundColor Yellow

try {
    Write-Detail "Fetching latest release information..."
    
    # First check if we can access releases endpoint at all
    $allReleases = gh api repos/MonaFP/RawaLite/releases --jq 'length' 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        $releaseCount = [int]$allReleases
        
        if ($releaseCount -eq 0) {
            Write-Host "✅ Releases API working (no releases yet)" -ForegroundColor Green
            Write-Detail "Release count: 0 (expected for new project)"
            Write-Detail "API access confirmed - ready for first release"
        } else {
            # Try to get latest release
            $latestRelease = gh api repos/MonaFP/RawaLite/releases/latest --jq '{tag_name: .tag_name, name: .name, published_at: .published_at, assets_count: (.assets | length)}' 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Releases API working" -ForegroundColor Green
                $release = $latestRelease | ConvertFrom-Json
                Write-Detail "Latest version: $($release.tag_name)"
                Write-Detail "Release name: $($release.name)"
                Write-Detail "Published: $($release.published_at)"
                Write-Detail "Assets count: $($release.assets_count)"
            } else {
                Write-Host "✅ Releases API accessible (latest release query failed)" -ForegroundColor Green
                Write-Detail "Found $releaseCount releases but couldn't fetch latest"
                Write-Detail "This might be a pre-release or draft release"
            }
        }
    } else {
        throw "Cannot access releases API"
    }
} catch {
    Write-Host "❌ Releases API access failed" -ForegroundColor Red
    Write-Host "Please check repository permissions" -ForegroundColor Yellow
    exit 1
}

# Step 5: Test download capability (simulation)
Write-Host "`n⬇️ Step 5: Testing download capability..." -ForegroundColor Yellow

try {
    # Test if we can access assets (if any exist)
    $assets = gh api repos/MonaFP/RawaLite/releases/latest --jq '.assets[] | {name: .name, download_url: .browser_download_url, size: .size}' 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $assets) {
        Write-Host "✅ Download URLs accessible" -ForegroundColor Green
        $assetList = $assets | ConvertFrom-Json
        if ($assetList) {
            Write-Detail "Available assets:"
            foreach ($asset in $assetList) {
                Write-Detail "  - $($asset.name) ($([math]::Round($asset.size/1MB, 2)) MB)"
            }
        }
    } else {
        Write-Host "⚠️ No assets found in latest release" -ForegroundColor Yellow
        Write-Detail "This is expected before first release with assets"
    }
} catch {
    Write-Host "⚠️ Could not check download assets" -ForegroundColor Yellow
    Write-Detail "This is not critical for initial setup"
}

# Final summary
Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "✅ GitHub CLI installation: OK" -ForegroundColor Green
Write-Host "✅ Authentication: OK" -ForegroundColor Green  
Write-Host "✅ Repository access: OK" -ForegroundColor Green
Write-Host "✅ Releases API: OK" -ForegroundColor Green

Write-Host "`n🎯 GitHub CLI Integration Ready!" -ForegroundColor Green
Write-Host "Next step: Implement GitHubCliService.ts" -ForegroundColor Cyan

# Additional info for developers
if ($ShowDetails) {
    Write-Host "`n💡 Developer Notes:" -ForegroundColor Cyan
    Write-Host "  - Rate limits: Authenticated requests have 5000/hour limit" -ForegroundColor Gray
    Write-Host "  - API Base: https://api.github.com" -ForegroundColor Gray
    Write-Host "  - Downloads: Use browser_download_url from assets" -ForegroundColor Gray
    Write-Host "  - Auth: Current session valid for repository access" -ForegroundColor Gray
}

exit 0