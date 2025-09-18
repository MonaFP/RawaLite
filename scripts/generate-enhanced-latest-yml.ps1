# Enhanced latest.yml Generator für maximale Legacy-Kompatibilität (v1.7.9+)
param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    [Parameter(Mandatory=$true)]
    [string]$SetupExePath,
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "release\latest.yml"
)

Write-Host "🔧 Enhanced latest.yml Generator für Legacy-Kompatibilität (v1.7.9+)" -ForegroundColor Cyan

# Validate Setup.exe exists
if (!(Test-Path $SetupExePath)) {
    Write-Host "❌ Setup.exe not found: $SetupExePath" -ForegroundColor Red
    exit 1
}

# Calculate SHA512 of Setup.exe (Base64 format required by electron-updater)
Write-Host "📋 Calculating SHA512 hash..." -ForegroundColor Yellow
$hash = Get-FileHash $SetupExePath -Algorithm SHA512
$sha512Base64 = [Convert]::ToBase64String([System.Convert]::FromHexString($hash.Hash))

# Get file information
$setupFile = Get-Item $SetupExePath
$setupSize = $setupFile.Length
$filename = $setupFile.Name
$releaseDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"

Write-Host "✅ File Info: $filename ($([math]::Round($setupSize/1MB, 1)) MB)" -ForegroundColor Green

# Generate enhanced latest.yml with FULL legacy compatibility
$enhancedLatestYml = @"
# RawaLite Auto-Update Metadata (Enhanced for Legacy Compatibility v1.7.9+)
version: $Version
files:
  - url: $filename
    sha512: $sha512Base64
    size: $setupSize
    # Legacy compatibility parameters
    blockMapSize: 0
path: $filename
sha512: $sha512Base64
releaseDate: '$releaseDate'

# LEGACY COMPATIBILITY: electron-updater v4.x/v5.x parameters
channel: latest
provider: github
owner: MonaFP
repo: RawaLite
releaseType: release
vPrefixedTagName: true
allowUnsigned: true
verifySignature: false

# Additional compatibility metadata for older versions
updateInfo:
  version: $Version
  path: $filename
  sha512: $sha512Base64
  size: $setupSize
  releaseDate: '$releaseDate'
  
# Auto-update behavior configuration
autoUpdate:
  enabled: true
  channel: latest
  allowDowngrade: false
  allowPrerelease: false
  
# Download behavior for legacy clients
download:
  provider: github
  owner: MonaFP
  repo: RawaLite
  private: false
  requestHeaders:
    User-Agent: "RawaLite-UpdateClient"
    
# Staging and rollout configuration
staging:
  percentage: 100
  enabled: false

# Signature verification (disabled for unsigned builds)
signature:
  verifySignature: false
  allowUnsigned: true
  disableKeychain: true
  allowInsecureConnection: true
"@

# Write enhanced latest.yml
try {
    $enhancedLatestYml | Set-Content -Path $OutputPath -Encoding UTF8
    Write-Host "✅ Enhanced latest.yml generated: $OutputPath" -ForegroundColor Green
    
    # Validate generated file
    if (Test-Path $OutputPath) {
        $generatedSize = (Get-Item $OutputPath).Length
        Write-Host "📋 Generated file size: $generatedSize bytes" -ForegroundColor Gray
        
        # Basic validation
        $content = Get-Content $OutputPath -Raw
        if ($content -match "version:\s*$Version" -and $content -match "sha512:\s*[A-Za-z0-9+/=]{88}") {
            Write-Host "✅ latest.yml validation passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ latest.yml validation failed - invalid content" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "❌ Failed to create latest.yml file" -ForegroundColor Red
        return $false
    }
} catch {
    Write-Host "❌ Error generating latest.yml: $($_.Exception.Message)" -ForegroundColor Red
    return $false
}