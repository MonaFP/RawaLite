# 🔄 Development Workflows & Processes - RawaLite

> **Comprehensive Git-Workflow, Release-Prozesse & Emergency-Procedures** für das RawaLite-Projekt
> 
> **Letzte Aktualisierung:** 12. Oktober 2025 | **Version:** 2.0 (Consolidation)

---

## 🎯 **Übersicht**

Dieser Leitfaden definiert **verbindliche Workflows** für Entwicklung, Code Reviews, Releases und Wartung der RawaLite-Anwendung.

### 🔗 **Verwandte GitHub-Integration**
- **Pull Request Template:** `/.github/PULL_REQUEST_TEMPLATE.md` - Referenziert diese Workflows
- **Issue Templates:** `/.github/ISSUE_TEMPLATE/` - Bug Reports und Feature Requests
- **CI/CD Workflows:** `/.github/workflows/ci.yml` - Automatisierte Tests und Builds

---

## 🌿 **Git Workflow**

### **Branch Strategy**
```
main                    # Production-ready Code
├── develop            # Integration Branch (wenn Mehrpersonen-Team)  
├── feature/xxx        # Feature Branches
├── bugfix/xxx         # Bug Fix Branches
├── hotfix/xxx         # Critical Production Fixes
└── release/x.x.x      # Release Preparation
```

### **Branch Naming Conventions**
```bash
# Feature Branches
feature/add-customer-validation
feature/implement-pdf-export  
feature/update-dashboard-ui

# Bug Fix Branches
bugfix/fix-customer-creation
bugfix/resolve-sqlite-locks
bugfix/correct-invoice-totals

# Hotfix Branches (Critical)
hotfix/security-patch-1.2.1
hotfix/data-corruption-fix

# Release Branches
release/1.1.0
release/2.0.0
```

### **Commit Message Format**
```bash
# Format: <type>(<scope>): <description>
#
# Types: feat, fix, docs, style, refactor, perf, test, chore, hotfix
# Scopes: customers, invoices, offers, packages, ui, db, electron
# Special: hotfix for emergency releases

# Examples:
feat(customers): add email validation to customer form
fix(db): resolve SQLite transaction deadlock
docs(api): update persistence adapter documentation  
refactor(hooks): extract common validation logic
perf(db): add indices for invoice queries
test(customers): add integration tests for customer CRUD
chore(deps): update electron to version 31.2.0
hotfix(critical): fix data corruption in customer deletion

# Breaking Changes (MAJOR version)
feat(api)!: change customer interface to include required phone
BREAKING CHANGE: customer.phone is now required field

# Emergency Hotfix Format
hotfix(critical): [EMERGENCY] fix UpdateManager crash
hotfix(security): [CRITICAL] prevent SQL injection in search

# Multi-line for complex changes
fix(invoices): resolve calculation errors in VAT computation

- Fix rounding errors in VAT calculations
- Add validation for negative line item amounts  
- Update tests for edge cases
- Closes #123, #124
```

---

## 🚀 **Development Workflow**

### **1. Feature Development**
```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/add-advanced-search

# 2. Develop with frequent commits
git add .
git commit -m "feat(search): add basic search infrastructure"
git commit -m "feat(search): implement customer name filtering"
git commit -m "feat(search): add date range filtering"

# 3. Keep feature branch up-to-date
git checkout main
git pull origin main  
git checkout feature/add-advanced-search
git rebase main

# 4. Final testing before PR
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e

# 5. Create Pull Request
git push origin feature/add-advanced-search
# → Create PR via GitHub/GitLab interface
```

### **2. Code Review Prozess**

#### **PR Requirements Checklist**
- [ ] **Tests:** Alle neuen Features haben Tests
- [ ] **Documentation:** README/Docs aktualisiert bei API-Änderungen
- [ ] **TypeScript:** Keine `any` Types, strict mode compliant
- [ ] **Performance:** Keine offensichtlichen Performance-Probleme
- [ ] **Security:** Input Validation, SQL Injection Prevention
- [ ] **Backward Compatibility:** Breaking Changes dokumentiert

#### **Review Guidelines**
```markdown
# Code Review Template

## ✅ **Functionality**
- [ ] Feature funktioniert wie spezifiziert
- [ ] Edge Cases sind behandelt
- [ ] Error Handling ist implementiert
- [ ] User Experience ist intuitiv

## 🏗️ **Code Quality** 
- [ ] Code folgt den Coding Standards
- [ ] Keine Code Duplications
- [ ] Funktionen sind gut testbar
- [ ] Naming ist konsistent und aussagekräftig

## 🧪 **Testing**
- [ ] Unit Tests decken neue Funktionalität ab
- [ ] Integration Tests für komplexe Features
- [ ] Manual Testing durchgeführt
- [ ] PDF-Sub-Items visuell geprüft (Angebot/Rechnung/Paket PDF-Export mit Sub-Items)
- [ ] Edge Cases getestet

## 📚 **Documentation**
- [ ] JSDoc für neue public APIs
- [ ] README aktualisiert bei neuen Features
- [ ] Breaking Changes dokumentiert
- [ ] Migration Guide bei DB-Schema-Änderungen

## 🔒 **Security & Performance**
- [ ] Input Validation implementiert
- [ ] SQL Queries verwenden Prepared Statements
- [ ] Keine Memory Leaks
- [ ] Performance-Impact akzeptabel
```

### **3. Merge Process**
```bash
# Nach erfolgreichem Review:

# Option A: Merge Commit (für Feature Branches)
git checkout main
git merge --no-ff feature/add-advanced-search
git push origin main

# Option B: Squash Merge (für kleine Features)
git checkout main  
git merge --squash feature/add-advanced-search
git commit -m "feat(search): implement advanced customer search functionality"
git push origin main

# Option C: Rebase Merge (für saubere Historie)
git checkout feature/add-advanced-search
git rebase main
git checkout main
git merge feature/add-advanced-search
git push origin main

# Cleanup
git branch -d feature/add-advanced-search
git push origin --delete feature/add-advanced-search
```

---

## 📦 **Release Workflow**

### **1. Semantic Versioning**
```
Version Format: MAJOR.MINOR.PATCH

MAJOR: Breaking Changes (API-Änderungen, DB-Schema-Inkompatibilität)
MINOR: New Features (Backward Compatible)
PATCH: Bug Fixes (Backward Compatible)

Examples:
1.0.0 → 1.0.1  # Bug Fix Release
1.0.1 → 1.1.0  # Feature Release  
1.1.0 → 2.0.0  # Breaking Change Release

Pre-releases:
1.1.0-alpha.1   # Alpha Version
1.1.0-beta.2    # Beta Version
1.1.0-rc.1      # Release Candidate
```

### **2. Release Preparation**
```bash
# 1. Create release branch
git checkout main
git pull origin main
git checkout -b release/1.1.0

# 2. Clean build caches for accurate build time measurement
Remove-Item -Path "dist-release", "dist-web", "dist-electron" -Recurse -Force -ErrorAction SilentlyContinue
pnpm store prune

# 3. Update version numbers
# package.json
{
  "version": "1.1.0"
}

# 3. Update CHANGELOG.md
## [1.1.0] - 2025-09-29

### Added
- Advanced customer search functionality
- PDF export for invoices
- Dashboard performance improvements

### Fixed  
- SQLite transaction deadlock issue
- Invoice calculation rounding errors

### Changed
- Updated Electron to 31.2.0
- Improved error messages for better UX

### Deprecated
- Legacy settings API (will be removed in 2.0.0)

# 4. Update PROJECT_OVERVIEW.md
- Update version references
- Add new features to feature list
- Update statistics if needed

# 5. Run full test suite
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint  
pnpm test
pnpm e2e
pnpm build
pnpm validate:line-items   # Requires RAWALITE_DB_PATH or --db path

# 6. Create Release Commit
git add .
git commit -m "chore(release): prepare release 1.1.0"
git push origin release/1.1.0
```

### **3. Release Process**
```bash
# 1. Merge release branch to main
git checkout main
git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin main --tags

# 2. Build production artifacts
pnpm dist

# 3. Create GitHub Release
# - Upload artifacts from dist/ folder
# - Copy CHANGELOG section as release notes
# - Mark as pre-release if needed

# 4. Cleanup
git branch -d release/1.1.0
git push origin --delete release/1.1.0
```

### **4. Hotfix Process**
```bash
# For critical production bugs:

# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-data-loss-fix

# 2. Implement fix
git commit -m "fix(db): prevent data loss in customer deletion"

# 3. Update version (PATCH increment)
# package.json: "1.1.0" → "1.1.1"

# 4. Test thoroughly
pnpm test
pnpm e2e
pnpm build

# 5. Merge to main and create release
git checkout main
git merge --no-ff hotfix/critical-data-loss-fix
git tag -a v1.1.1 -m "Hotfix release 1.1.1"
git push origin main --tags

# 6. Build and deploy immediately
pnpm dist
# Upload to GitHub releases

# 7. Cleanup
git branch -d hotfix/critical-data-loss-fix
```

---

## 🚨 **Emergency Hotfix Workflow**

### **CRITICAL Production Issues - Fast-Track Process**

**⚠️ Use only for:** Security vulnerabilities, data corruption, app crashes, critical functionality broken

#### **Phase 1: Emergency Assessment (1-2 Min)**
```bash
# Quick status check
git status                    # Must be clean
pnpm validate:critical-fixes  # Must pass - verify preserved fixes
```

**Emergency Decision Matrix:**
- [ ] 🔥 **Blocker/Critical:** App unusable or data at risk → EMERGENCY MODE
- [ ] 🟡 **High Priority:** Important feature broken → Standard Hotfix
- [ ] 🟢 **Medium/Low:** Minor issues → Wait for next release

#### **Phase 2: Fast-Track Implementation (5-10 Min)**
```bash
# Emergency hotfix branch (optional - can work directly on main)
git checkout -b hotfix/v1.0.X

# Implement ONLY the critical fix
# NO additional features or refactoring
git add .
git commit -m "🚨 HOTFIX: [Critical Fix Description]"

# Auto-increment patch version
# Update package.json: 1.0.33 → 1.0.34
```

#### **Phase 3: Minimal Validation (2-3 Min)**
```bash
# SKIP full test suite for emergency
pnpm validate:critical-fixes  # MUST pass - non-negotiable
# SKIP: pnpm test (too slow for emergency)
# SKIP: pnpm e2e (too slow for emergency)

# Quick manual verification of fix only
```

#### **Phase 4: Emergency Release (2-3 Min)**
```bash
# Emergency tag and release
git tag v1.0.34
git push origin main --tags

# GitHub Release (prioritize speed)
gh release create v1.0.34 \
  --title "🚨 EMERGENCY HOTFIX RawaLite v1.0.34" \
  --notes "Critical fix for [specific issue]"

# CRITICAL: Verify release has assets
gh release view v1.0.34 --json assets
# If assets: [] → IMMEDIATE fallback: pnpm dist + manual upload
```

#### **Phase 5: Emergency Communication (1 Min)**
```bash
# Immediate user notification template:
# 🚨 CRITICAL HOTFIX: RawaLite v1.0.X
# ⚠️ PROBLEM: [Brief critical issue description]
# ✅ SOLUTION: [Brief fix description]  
# 📦 AVAILABLE NOW: UpdateManager or GitHub Release
# ⏰ Please update immediately!
```

### **Emergency Shortcuts & Skip Conditions**

**✅ SKIP in Emergency:**
- ❌ Full test suite (too time-consuming)
- ❌ Code review (post-emergency review acceptable)
- ❌ Feature testing (only test the critical fix)
- ❌ Documentation updates (minimal necessary only)
- ❌ Release planning (emergency mode)

**✅ MANDATORY in Emergency:**
- ✅ `pnpm validate:critical-fixes` (preserve existing fixes)
- ✅ Manual verification of fix (reproduce problem + verify solution)
- ✅ Asset verification (release must have downloadable files)
- ✅ Immediate user communication

### **Post-Emergency Actions**
```bash
# After emergency resolved:
# 1. Full validation
pnpm test && pnpm e2e  # Run skipped tests

# 2. Post-mortem documentation
# Add to lessons learned: Why wasn't this caught earlier?

# 3. Process improvement
# Update CI/CD to prevent similar issues
```

### **Emergency Success Criteria**
- [ ] Fix deployed within 15-20 minutes total
- [ ] Critical functionality restored
- [ ] No existing fixes broken (critical-fixes validation passed)
- [ ] Users immediately notified
- [ ] Release assets available for download

---

## 🔧 **CI/CD Pipeline**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [ published ]

jobs:
  test:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - name: Install pnpm
      run: npm install -g pnpm
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Type check
      run: pnpm typecheck
    
    - name: Lint
      run: pnpm lint
    
    - name: Unit tests
      run: pnpm test
    
    - name: Build application
      run: pnpm build
    
    - name: E2E tests
      run: pnpm e2e
  
  build-release:
    needs: test
    runs-on: windows-latest
    if: github.event_name == 'release'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Build distributables
      run: pnpm dist
    
    - name: Upload release assets
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ github.event.release.upload_url }}
        asset_path: ./release/rawalite-Setup-*.exe
        asset_name: rawalite-Setup.exe
        asset_content_type: application/octet-stream
```

### **Quality Gates**
```yaml
# Automatic quality checks that must pass:

# 1. Code Quality
- TypeScript strict mode: ✅ No errors
- ESLint: ✅ No warnings  
- Prettier: ✅ Consistent formatting

# 2. Testing
- Unit test coverage: ✅ > 80%
- All tests passing: ✅ 
- E2E tests passing: ✅

# 3. Build
- Development build: ✅ Successful
- Production build: ✅ Successful
- Electron dist: ✅ Successful

# 4. Security
- No known vulnerabilities: ✅
- Dependencies up-to-date: ✅
- Code scanning passed: ✅
```

---

## 📋 **Issue Management**

### **Issue Templates**
```markdown
# Bug Report Template
## 🐛 Bug Description
<!-- Clear description of the bug -->

## 🔄 Steps to Reproduce
1. Open RawaLite application
2. Navigate to [specific page]
3. Click on [specific button]
4. Error occurs

## ✅ Expected Behavior
<!-- What should have happened -->

## ❌ Actual Behavior  
<!-- What actually happened -->

## 📊 Environment
- OS: [Windows 11 / macOS 14 / Ubuntu 22.04]
- RawaLite Version: [1.1.0]
- Node Version: [20.x]

## 📎 Additional Context
<!-- Screenshots, error messages, logs -->

---

# Feature Request Template  
## 🎯 Feature Description
<!-- Clear description of the requested feature -->

## 💡 Use Case
<!-- Why is this feature needed? -->

## 📋 Acceptance Criteria
- [ ] User can...
- [ ] System should...
- [ ] Error handling for...

## 🎨 Design Mockups
<!-- If applicable, attach UI mockups -->

## 🔧 Technical Considerations
<!-- Any technical constraints or requirements -->
```

### **Issue Labels**
```
Priority:
🔴 priority/critical    # Security, data loss, app crashes
🟡 priority/high       # Important features, significant bugs
🟢 priority/medium     # Standard features and bugs
⚪ priority/low        # Nice-to-have, minor improvements

Type:
🐛 bug                 # Something is broken
✨ enhancement         # New feature or improvement  
📚 documentation       # Documentation updates
🧪 testing            # Test-related changes
🔧 maintenance        # Code maintenance, refactoring

Area:
🖥️ area/ui            # User interface changes
🗄️ area/database      # Database-related issues
⚡ area/performance    # Performance improvements
🔒 area/security       # Security-related issues
📦 area/build         # Build and deployment issues
```

---

## 🔧 **Build Performance Optimization**

### **Cache Management**
```bash
# Cache cleanup for accurate builds and troubleshooting

# 1. Full cache cleanup (when build issues occur)
Remove-Item -Path "dist-release", "dist-web", "dist-electron" -Recurse -Force -ErrorAction SilentlyContinue
pnpm store prune

# 2. Measure clean build time
Measure-Command { pnpm dist }

# 3. Partial cache cleanup (for faster iterations) 
Remove-Item -Path "dist-web", "dist-electron" -Recurse -Force -ErrorAction SilentlyContinue
pnpm build

# 4. PNPM store optimization (monthly)
pnpm store prune
```

### **Build Time Benchmarks**
```bash
# Expected build times (after cache cleanup):
# - Clean build: ~40s (TypeScript + Vite + ESBuild + Code Signing)  
# - Incremental build: ~10s (cached dependencies)
# - Development build: ~5s (no signing, cached)

# Performance factors:
# - Code signing: +20s (Windows certificate validation)
# - ASAR integrity: +5s (Electron security check)
# - better-sqlite3 rebuild: +10s (native module compilation)
```

### **Cache Troubleshooting**
```bash
# When experiencing build issues:

# 1. Check cache corruption
pnpm store problems

# 2. Nuclear option (complete reset)
Remove-Item -Path "node_modules", "pnpm-lock.yaml", "dist-*" -Recurse -Force
pnpm install --frozen-lockfile
pnpm build

# 3. Verify clean slate
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

---

## 🏆 **Code Quality Workflows**

### **Pre-commit Hooks**
```bash
# .husky/pre-commit
#!/usr/bin/env sh

echo "🔍 Running pre-commit checks..."

# 1. Lint staged files
echo "📏 Linting staged files..."
npx lint-staged

# 2. Type checking
echo "🔧 Type checking..."
pnpm typecheck

# 3. Quick tests for affected areas
echo "🧪 Running unit tests..."
pnpm test --run --reporter=basic

echo "✅ Pre-commit checks passed!"
```

```json
// package.json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "docs/**/*.md": [
      "prettier --write"
    ],
    "*.{json,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

### **Pull Request Automation**
```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-validation:
    runs-on: ubuntu-latest
    
    steps:
    - name: Check PR title format
      uses: amannn/action-semantic-pull-request@v5
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        types: |
          feat
          fix
          docs
          style
          refactor
          perf
          test
          chore
        scopes: |
          customers
          invoices
          offers
          packages
          ui
          db
          electron
          
    - name: Check for documentation updates
      run: |
        if [[ ${{ contains(github.event.pull_request.changed_files.*.filename, 'src/') }} ]]; then
          echo "Source code changed - checking for documentation updates..."
          if [[ ! ${{ contains(github.event.pull_request.changed_files.*.filename, 'docs/') && !contains(github.event.pull_request.changed_files.*.filename, 'README.md') }} ]]; then
            echo "⚠️ Consider updating documentation for source code changes"
            exit 1
          fi
        fi
```

---

## 📊 **Monitoring & Metrics**

### **Development Metrics**
```typescript
// Development KPIs tracking
interface DevelopmentMetrics {
  // Code Quality
  codeQuality: {
    testCoverage: number;        // Target: >80%
    lintWarnings: number;        // Target: 0
    tsErrors: number;           // Target: 0
    codeComplexity: number;     // Target: <10 cyclomatic
  };
  
  // Performance
  performance: {
    buildTime: number;          // Target: <2min
    testRuntime: number;        // Target: <30s
    bundleSize: number;         // Target: <50MB
    startupTime: number;        // Target: <3s
  };
  
  // Process
  process: {
    avgPRReviewTime: number;    // Target: <24h
    avgTimeToMerge: number;     // Target: <48h
    hotfixFrequency: number;    // Target: <1/month
    releaseFrequency: number;   // Target: 1/month
  };
}
```

### **Quality Dashboard**
```bash
# Quality metrics script
#!/bin/bash

echo "📊 RawaLite Quality Dashboard"
echo "================================"

# Test Coverage
echo "🧪 Test Coverage:"
pnpm test --reporter=json | jq '.coverage.percent'

# Bundle Size
echo "📦 Bundle Size:"
du -h dist/

# Build Time
echo "⏱️ Build Time:"
time pnpm build

# Dependencies  
echo "📚 Dependencies:"
pnpm audit --audit-level moderate

# Code Complexity
echo "🔧 Code Complexity:"
npx madge --circular --extensions ts,tsx src/

echo "✅ Quality check complete"
```

---

## 🔄 **Maintenance Workflows**

### **Regular Maintenance Tasks**

#### **Weekly Tasks**
```bash
# Weekly maintenance checklist
- [ ] Update dependencies (pnpm update)  
- [ ] Review and close old issues
- [ ] Check for security vulnerabilities (pnpm audit)
- [ ] Run performance benchmarks
- [ ] Review error logs from production
- [ ] Update documentation if needed
```

#### **Monthly Tasks**  
```bash
# Monthly maintenance checklist
- [ ] Major dependency updates
- [ ] Performance optimization review
- [ ] Database optimization (vacuum, reindex)
- [ ] Documentation audit and updates
- [ ] Security review and updates
- [ ] Backup and disaster recovery testing
```

#### **Quarterly Tasks**
```bash  
# Quarterly maintenance checklist
- [ ] Architecture review
- [ ] Technology stack evaluation  
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] Documentation overhaul
- [ ] Process improvements review
```

### **Status-Übersicht Aktualisierung**

Die zentrale Status-Datei `/docs/10-architecture/STATUS-OVERVIEW.md` muss bei jeder größeren Änderung aktuell gehalten werden.

#### **Automatische Trigger für Status-Updates**
```bash
# Status-Update ist erforderlich bei:
- [ ] Neuen Features (Pages, Components, Services)
- [ ] Abgeschlossenen Implementierungen
- [ ] Architektur-Änderungen
- [ ] Release-Vorbereitung
- [ ] Produktionsreife-Änderungen
```

#### **Status-Update Workflow**
```bash
# 1. Nach Feature-Implementierung
# Prüfe Vollständigkeits-Status der betroffenen Komponenten
pnpm build  # Validiere dass Build funktioniert

# 2. Aktualisiere STATUS-OVERVIEW.md
# - Vollständigkeits-Prozente anpassen
# - Neue Komponenten hinzufügen  
# - Gesamtstatus neu berechnen
# - Datum aktualisieren

# 3. Validierung
# Prüfe dass alle Einträge aktuell sind:
find src/ -name "*.ts" -o -name "*.tsx" | wc -l  # Dateien zählen
grep -r "TODO\|FIXME\|XXX" src/  # Offene Punkte finden

# 4. Commit der Status-Änderung
git add docs/10-architecture/STATUS-OVERVIEW.md
git commit -m "docs(status): update completion status after [feature-name]"
```

#### **Monatliche Status-Validierung**
```bash
# Vollständige Status-Überprüfung (monatlich)

# 1. Komponenten-Inventar
echo "=== PAGES ==="
find src/pages -name "*.tsx" | wc -l
find src/pages -name "*.tsx" -exec grep -l "TODO\|FIXME" {} \;

echo "=== COMPONENTS ==="  
find src/components -name "*.tsx" | wc -l
find src/components -name "*.tsx" -exec grep -l "TODO\|FIXME" {} \;

echo "=== HOOKS ==="
find src/hooks -name "*.ts" | wc -l
find src/hooks -name "*.ts" -exec grep -l "TODO\|FIXME" {} \;

echo "=== SERVICES ==="
find src/services -name "*.ts" | wc -l  
find src/services -name "*.ts" -exec grep -l "TODO\|FIXME" {} \;

# 2. Build-Status validieren
pnpm build --reporter=basic

# 3. Status-Datei entsprechend aktualisieren
# /docs/10-architecture/STATUS-OVERVIEW.md

# 4. Produktionsreife neu bewerten
echo "Aktueller Build-Output:"
ls -la dist-electron/ dist-web/
```

#### **Status-Update Checkliste**
```markdown
# Bei jeder Aktualisierung von STATUS-OVERVIEW.md:

- [ ] **Datum aktualisiert** (Stand: DD. Monat YYYY)
- [ ] **Version aktualisiert** (falls Release)
- [ ] **Gesamtstatus neu berechnet** (Prozentsatz)
- [ ] **Neue Komponenten hinzugefügt** (falls vorhanden)
- [ ] **Vollständigkeits-Status angepasst** (pro Komponente)
- [ ] **Produktionsreife-Bewertung überprüft**
- [ ] **Build-Status validiert** (pnpm build erfolgreich)
- [ ] **Verbleibende Arbeiten aktualisiert**
- [ ] **Commit mit aussagekräftiger Message**
```

#### **Quartalsweise Vollvalidierung**
```bash
# Umfassende Status-Validierung (alle 3 Monate)

# 1. Vollständige Code-Analyse
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l
grep -r "any\|@ts-ignore\|TODO\|FIXME" src/ --include="*.ts" --include="*.tsx"

# 2. Architektur-Konsistenz prüfen
ls -la src/{pages,components,hooks,services,adapters}/

# 3. Test-Coverage analysieren  
pnpm test --coverage

# 4. Performance-Baseline
pnpm build
ls -lah dist-electron/ dist-web/

# 5. STATUS-OVERVIEW.md komplett überarbeiten
# - Alle Komponenten neu bewerten
# - Architektur-Änderungen dokumentieren
# - Neue Metriken hinzufügen
# - Roadmap-Status aktualisieren
```

### **Dependency Management**
```bash
# Safe dependency update process

# 1. Check for updates
pnpm outdated

# 2. Update patch versions (safe)
pnpm update --latest --depth 0

# 3. Test everything
pnpm typecheck && pnpm lint && pnpm test && pnpm e2e

# 4. Update minor versions (with caution)
pnpm update electron@^31.0.0

# 5. Test thoroughly  
pnpm build && pnpm dist

# 6. Update major versions (one at a time)
pnpm add react@^19.0.0
# Run full test suite
# Fix breaking changes if needed
# Update documentation
```

---

## 📞 **Emergency Procedures**

### **Critical Bug Response**
```bash
# When critical production bug is reported:

# 1. Immediate Assessment (within 30 minutes)
- Verify bug reproduction
- Assess impact and severity
- Determine if hotfix is needed

# 2. Emergency Hotfix (if critical)
git checkout main
git checkout -b hotfix/emergency-fix-$(date +%Y%m%d)

# 3. Implement minimal fix
# Focus on fixing the issue, not perfect code

# 4. Expedited testing
pnpm test --reporter=basic
pnpm e2e --quick

# 5. Emergency release
git tag -a v1.1.1-hotfix.1 -m "Emergency hotfix"
pnpm dist
# Deploy immediately

# 6. Post-incident review
# Document what happened
# Plan permanent fix if needed
# Update processes to prevent recurrence
```

### **Communication Protocols**
```markdown
# Incident Communication Template

## 🚨 INCIDENT ALERT

**Severity:** Critical/High/Medium/Low
**Status:** Investigating/Identified/Monitoring/Resolved  
**Started:** [timestamp]
**Impact:** [description of user impact]

### Summary
Brief description of the issue

### Current Status  
What we know and what we're doing

### Next Update
When we'll provide the next update

### Timeline
- [timestamp] Issue reported
- [timestamp] Investigation started
- [timestamp] Root cause identified
- [timestamp] Fix deployed
- [timestamp] Issue resolved
```

---

*Letzte Aktualisierung: 29. September 2025 | Nächste Review: Dezember 2025*
