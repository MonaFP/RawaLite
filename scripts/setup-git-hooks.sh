#!/bin/sh
# .git/hooks/pre-commit
# RawaLite pre-commit validation hook

echo "🔍 Running RawaLite pre-commit validation..."

# Check if package.json version changed (indicates version bump)
if git diff --cached --name-only | grep -q "package.json"; then
  echo "✅ package.json version update detected"
  
  # Run comprehensive validation for version bumps
  echo "🔍 Running version bump validation..."
  
  # Critical fixes validation (MANDATORY)
  if ! pnpm validate:critical-fixes; then
    echo "❌ COMMIT BLOCKED: Critical fixes validation failed!"
    echo "📋 Required actions:"
    echo "  1. Check docs/00-meta/final/CRITICAL-FIXES-REGISTRY.md"
    echo "  2. Restore missing critical patterns"
    echo "  3. Run: pnpm validate:critical-fixes"
    echo "  4. Try commit again"
    exit 1
  fi
  
  # Migration validation (MANDATORY)
  if ! pnpm validate:migrations; then
    echo "❌ COMMIT BLOCKED: Migration index validation failed!"
    echo "📋 Required actions:"
    echo "  1. Check src/main/db/migrations/index.ts"
    echo "  2. Add missing migration imports/entries"
    echo "  3. Run: pnpm validate:migrations"
    echo "  4. Try commit again"
    exit 1
  fi
  
  # TypeScript validation
  if ! pnpm typecheck; then
    echo "❌ COMMIT BLOCKED: TypeScript validation failed!"
    exit 1
  fi
  
  # Linting
  if ! pnpm lint; then
    echo "❌ COMMIT BLOCKED: ESLint validation failed!"
    exit 1
  fi
  
  echo "✅ Version bump validation passed!"
else
  echo "ℹ️  Regular commit (no version bump)"
  
  # Basic validation for regular commits
  if ! pnpm validate:critical-fixes; then
    echo "❌ COMMIT BLOCKED: Critical fixes validation failed!"
    echo "📋 Check docs/00-meta/final/CRITICAL-FIXES-REGISTRY.md for required patterns"
    exit 1
  fi
  
  if ! pnpm typecheck; then
    echo "❌ COMMIT BLOCKED: TypeScript validation failed!"
    exit 1
  fi
  
  echo "✅ Basic validation passed!"
fi

echo "🎉 Pre-commit validation successful!"
exit 0