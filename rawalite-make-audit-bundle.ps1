
<#
.SYNOPSIS
  Erzeugt ein schlankes Audit‑ZIP deiner React/TypeScript/Vite/Electron‑App (ohne node_modules/dist/Assets),
  prüft die Größe und splittet optional in 45‑MB‑Teile (kompatibel mit ChatGPT‑Upload).

.EXAMPLE
  ./rawalite-make-audit-bundle.ps1
  ./rawalite-make-audit-bundle.ps1 -ProjectPath "C:\Users\ramon\Desktop\RawaLite" -OutBaseName "rawalite-audit-bundle" -PartSizeMB 45
#>

param(
  [string]$ProjectPath = ".",
  [string]$OutBaseName = "rawalite-audit-bundle",
  [int]$PartSizeMB = 45,
  [int]$MaxSizeMB = 50,
  [switch]$NoSplit = $false,
  [switch]$IncludeWasm = $false
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Resolve-Abs([string]$p) {
  return (Resolve-Path -Path $p).Path
}

$ProjectPath = Resolve-Abs $ProjectPath

if (-not (Test-Path $ProjectPath)) {
  throw "ProjectPath not found: $ProjectPath"
}

# Timestamped output name
$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$outName = "$OutBaseName-$stamp.zip"
$outPath = Join-Path $ProjectPath $outName

# temp staging dir
$staging = Join-Path $ProjectPath ".audit_staging_$stamp"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

# Include roots (existence checked later)
$includeRoots = @(
  "src","electron","apps","packages","public",
  "vite.config.ts","vite.config.mts","vite.config.js","vite.config.cjs",
  "tsconfig.json","tsconfig.*.json",
  "package.json","pnpm-lock.yaml","package-lock.json","yarn.lock",
  ".npmrc",".nvmrc",
  ".eslintrc"," .eslintrc.js"," .eslintrc.cjs",".eslintrc.json",".eslintrc.yml",".eslintrc.yaml",
  ".prettierrc",".prettierrc.js",".prettierrc.cjs",".prettierrc.json",".prettierrc.yml",".prettierrc.yaml",
  ".editorconfig",
  ".env.example","index.html","README*","README.*"
)

# Excludes
$excludeDirs = @("node_modules",".git","dist","out",".next",".cache",".turbo",".vite","coverage",".DS_Store")
$excludeGlobs = @("*.png","*.jpg","*.jpeg","*.gif","*.webp","*.mp4","*.mov")
if (-not $IncludeWasm) {
  $excludeGlobs += @("public/sql-wasm.wasm")
}

# Copy includes into staging using robocopy (preserves structure)
foreach ($root in $includeRoots) {
  $matches = Get-ChildItem -LiteralPath $ProjectPath -Recurse -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -like (Join-Path $ProjectPath $root) -or
    $_.Name -like $root
  } | Select-Object -ExpandProperty PSIsContainer -Unique | Out-Null

  $srcCandidates = Get-ChildItem -LiteralPath $ProjectPath -Force -Recurse -ErrorAction SilentlyContinue | Where-Object {
    $_.PSIsContainer -and ($_.FullName -like (Join-Path $ProjectPath $root))
  }

  if (Test-Path (Join-Path $ProjectPath $root)) {
    $srcPath = Join-Path $ProjectPath $root
    if ((Get-Item $srcPath).PSIsContainer) {
      $xd = @()
      foreach ($d in $excludeDirs) { $xd += @("/XD", (Join-Path $srcPath $d)) }
      $xf = @()
      foreach ($g in $excludeGlobs) { $xf += @("/XF", $g) }
      & robocopy $srcPath (Join-Path $staging $root) /E /NFL /NDL /NJH /NJS /NC /NS @xd @xf | Out-Null
    } else {
      $destDir = $staging
      Copy-Item -LiteralPath $srcPath -Destination $destDir -Force -ErrorAction SilentlyContinue
    }
  }
}

# Fallback: if nothing was staged, try minimal core files
if (-not (Get-ChildItem -Path $staging -Recurse | Measure-Object).Count) {
  Write-Warning "No include roots found. Staging minimal files: package.json, *lock*, vite.config.*, tsconfig*.json"
  @("package.json","pnpm-lock.yaml","package-lock.json","vite.config.*","tsconfig*.json","index.html") | ForEach-Object {
    $glob = Join-Path $ProjectPath $_
    Get-ChildItem -Path $glob -ErrorAction SilentlyContinue | ForEach-Object {
      Copy-Item $_.FullName -Destination $staging -Force
    }
  }
}

# Remove excluded directories if they slipped in
foreach ($dir in $excludeDirs) {
  Get-ChildItem -Path $staging -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq $dir } | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
  }
}

# Remove excluded globs
foreach ($pat in $excludeGlobs) {
  Get-ChildItem -Path $staging -Recurse -Force -ErrorAction SilentlyContinue -Include $pat | Remove-Item -Force -ErrorAction SilentlyContinue
}

# Create zip
if (Test-Path $outPath) { Remove-Item $outPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $outPath -Force

# Clean staging
Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue

# Size check
$zipInfo = Get-Item $outPath
$sizeMB = [math]::Round($zipInfo.Length/1MB,2)
Write-Host "ZIP erstellt: $outPath ($sizeMB MB)"

if ($NoSplit) {
  Write-Host "NoSplit aktiv – es wird nicht gesplittet."
  exit 0
}

if ($sizeMB -le $MaxSizeMB) {
  Write-Host "Größe <= ${MaxSizeMB}MB – Split nicht erforderlich."
  exit 0
}

# Split into parts
$partSizeBytes = $PartSizeMB * 1MB
$srcStream = [System.IO.File]::OpenRead($outPath)

try {
  $bufferSize = 4MB
  $buffer = New-Object byte[] $bufferSize
  $part = 1
  $bytesWrittenInPart = 0

  while ($srcStream.Position -lt $srcStream.Length) {
    $partSuffix = ("{0:D3}" -f $part)
    $partPath = "$outPath.$partSuffix"
    $dstStream = [System.IO.File]::Open($partPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
    try {
      $bytesWrittenInPart = 0
      while (($bytesRead = $srcStream.Read($buffer,0,$buffer.Length)) -gt 0) {
        $dstStream.Write($buffer,0,$bytesRead)
        $bytesWrittenInPart += $bytesRead
        if ($bytesWrittenInPart -ge $partSizeBytes) { break }
      }
    }
    finally {
      $dstStream.Close()
      $dstStream.Dispose()
    }
    Write-Host "Teil erzeugt: $partPath ($( [math]::Round((Get-Item $partPath).Length/1MB,2) ) MB)"
    $part++
  }
}
finally {
  $srcStream.Close()
  $srcStream.Dispose()
}

Write-Host "Splitting abgeschlossen. Original-ZIP bleibt erhalten."
