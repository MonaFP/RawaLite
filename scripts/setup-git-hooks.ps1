# RawaLite Git Hooks Setup Script (PowerShell)
# Sets up pre-commit hooks for Windows development

Write-Host "🔧 Setting up RawaLite Git Hooks..." -ForegroundColor Cyan

$gitHooksDir = ".git/hooks"
$preCommitHook = "$gitHooksDir/pre-commit"
$preCommitCmd = "$gitHooksDir/pre-commit.cmd"

# Ensure hooks directory exists
if (!(Test-Path $gitHooksDir)) {
    New-Item -ItemType Directory -Path $gitHooksDir -Force
    Write-Host "✅ Created .git/hooks directory" -ForegroundColor Green
}

# Create bash pre-commit hook
$bashHookContent = @'
#!/bin/sh
# RawaLite pre-commit validation hook

echo "🔍 Running RawaLite pre-commit validation..."

# Check if package.json version changed (indicates version bump)
if git diff --cached --name-only | grep -q "package.json"; then
  echo "✅ package.json version update detected"
  
  # Critical fixes validation (MANDATORY)
  if ! pnpm validate:critical-fixes; then
    echo "❌ COMMIT BLOCKED: Critical fixes validation failed!"
    echo "📋 Check docs/00-meta/CRITICAL-FIXES-REGISTRY.md for required patterns"
    exit 1
  fi
  
  # Migration validation (MANDATORY)
  if ! pnpm validate:migrations; then
    echo "❌ COMMIT BLOCKED: Migration index validation failed!"
    exit 1
  fi
  
  # TypeScript + Lint
  if ! pnpm typecheck || ! pnpm lint; then
    echo "❌ COMMIT BLOCKED: TypeScript/Lint validation failed!"
    exit 1
  fi
  
  echo "✅ Version bump validation passed!"
else
  echo "ℹ️  Regular commit (no version bump)"
  
  # Basic validation for regular commits
  if ! pnpm validate:critical-fixes; then
    echo "❌ COMMIT BLOCKED: Critical fixes validation failed!"
    exit 1
  fi
  
  echo "✅ Basic validation passed!"
fi

echo "🎉 Pre-commit validation successful!"
exit 0
'@

# Create Windows .cmd wrapper
$cmdHookContent = @'
@echo off
REM RawaLite pre-commit hook (Windows)
echo 🔍 Running RawaLite pre-commit validation...

REM Check if package.json changed
git diff --cached --name-only | findstr "package.json" >nul
if %errorlevel% == 0 (
    echo ✅ package.json version update detected
    
    REM Critical validations
    call pnpm validate:critical-fixes
    if %errorlevel% neq 0 (
        echo ❌ COMMIT BLOCKED: Critical fixes validation failed!
        echo 📋 Check docs/00-meta/CRITICAL-FIXES-REGISTRY.md
        exit /b 1
    )
    
    call pnpm validate:migrations
    if %errorlevel% neq 0 (
        echo ❌ COMMIT BLOCKED: Migration validation failed!
        exit /b 1
    )
    
    call pnpm typecheck
    if %errorlevel% neq 0 (
        echo ❌ COMMIT BLOCKED: TypeScript validation failed!
        exit /b 1
    )
    
    echo ✅ Version bump validation passed!
) else (
    echo ℹ️  Regular commit
    
    call pnpm validate:critical-fixes
    if %errorlevel% neq 0 (
        echo ❌ COMMIT BLOCKED: Critical fixes validation failed!
        exit /b 1
    )
    
    echo ✅ Basic validation passed!
)

echo 🎉 Pre-commit validation successful!
exit /b 0
'@

# Write hook files
$bashHookContent | Out-File -FilePath $preCommitHook -Encoding UTF8
$cmdHookContent | Out-File -FilePath $preCommitCmd -Encoding UTF8

# Make bash hook executable (if on Unix-like system)
if (Get-Command "chmod" -ErrorAction SilentlyContinue) {
    chmod +x $preCommitHook
    Write-Host "✅ Made bash hook executable" -ForegroundColor Green
}

Write-Host "✅ Git hooks setup completed!" -ForegroundColor Green
Write-Host "📋 Hooks installed:" -ForegroundColor Yellow
Write-Host "   - $preCommitHook (bash)" -ForegroundColor White
Write-Host "   - $preCommitCmd (Windows)" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test hooks with: git add . && git commit -m 'test'" -ForegroundColor Cyan