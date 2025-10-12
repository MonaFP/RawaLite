#!/usr/bin/env sh

# Husky Setup Script für RawaLite
echo "🔧 Setting up Husky Git Hooks for RawaLite..."

# Install husky if not already installed
if ! command -v husky &> /dev/null; then
  echo "📦 Installing Husky..."
  pnpm add --save-dev husky
fi

# Initialize husky
echo "🚀 Initializing Husky..."
pnpm exec husky install

# Make hook files executable
echo "🔒 Making hook files executable..."
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Install lint-staged if not already present
if ! pnpm list lint-staged &> /dev/null; then
  echo "📦 Installing lint-staged..."
  pnpm add --save-dev lint-staged
fi

echo "✅ Husky setup complete!"
echo ""
echo "🎯 Git hooks now active:"
echo "  - pre-commit: Linting, type checking, documentation sync check"
echo "  - commit-msg: Conventional commit format validation" 
echo ""
echo "📚 See docs/WORKFLOWS.md for commit message format guidelines"