# 🚀 PHASE 3: VERSION BUMP & RELEASE - QUICK START GUIDE

> **Date:** 2025-11-05  
> **Prerequisite:** Phase 2 COMPLETE (commit 1672c9f6)  
> **Target Version:** v1.0.79 (from v1.0.78)  
> **Duration:** ~10 minutes  
> **Status:** READY TO EXECUTE

---

## 🎯 PHASE 3 OBJECTIVES

1. ✅ Version bump: v1.0.78 → v1.0.79
2. ✅ Git tag + commit
3. ✅ GitHub release + artifacts
4. ✅ Automated release workflow

---

## 📋 QUICK START - 5 COMMANDS

### **Step 1: Pre-Release Validation** (1 min)
```bash
cd c:\Users\ramon\Desktop\RawaLite

# Validate critical fixes are preserved
pnpm validate:critical-fixes

# Expected output: ✅ All critical fixes verified
```

### **Step 2: Version Bump** (1 min)
```bash
# IMPORTANT: Use SAFE version command (not pnpm version directly!)
pnpm safe:version patch

# Expected: v1.0.78 → v1.0.79
# Updates: package.json, package-lock.yaml, git state
```

### **Step 3: Create Release** (2 min)
```bash
# Automated release workflow (git commit + tag + GitHub)
pnpm release:patch

# This command does:
# 1. Creates git commit: "chore: release v1.0.79"
# 2. Creates git tag: "v1.0.79"
# 3. Pushes to GitHub
# 4. Triggers GitHub Actions
# 5. Creates GitHub Release
```

### **Step 4: Verify Release** (1 min)
```bash
# Check git status
git log --oneline -1          # Should show v1.0.79 commit
git tag -l | tail -5          # Should show v1.0.79 tag

# Check GitHub (web browser)
# https://github.com/MonaFP/RawaLite/releases
# Should show v1.0.79 release with artifacts
```

### **Step 5: Verify Package.json** (Optional verification)
```bash
# Check version was updated
cat package.json | Select-String '"version"'

# Expected: "version": "1.0.79"
```

---

## ⚠️ IMPORTANT RULES

### **✅ MANDATORY: Use `pnpm safe:version` NOT `pnpm version`**
**Reason:** npm config conflicts detected previously (18.10.2025)
```bash
# ✅ CORRECT:
pnpm safe:version patch

# ❌ FORBIDDEN:
pnpm version patch    # This causes npm config errors!
```

### **✅ MANDATORY: Pre-flight validation**
```bash
pnpm validate:critical-fixes    # Must pass before release!
```

### **✅ MANDATORY: Follow exact command order**
1. validate:critical-fixes
2. safe:version patch
3. release:patch
4. verify on GitHub

Do NOT skip steps or reorder!

---

## 🔍 VALIDATION CHECKLIST

**Before Running Phase 3:**
- [ ] Phase 2 committed (commit 1672c9f6) ✅
- [ ] Working directory clean (`git status` shows clean)
- [ ] Branch is `main`
- [ ] Internet connection available (for GitHub push)
- [ ] GitHub credentials configured (for release creation)

**Running Phase 3:**
- [ ] pnpm validate:critical-fixes passes
- [ ] pnpm safe:version patch succeeds
- [ ] pnpm release:patch succeeds

**After Phase 3:**
- [ ] git log shows v1.0.79 commit
- [ ] git tag shows v1.0.79
- [ ] GitHub release visible (https://github.com/MonaFP/RawaLite/releases)
- [ ] Release artifacts available

---

## 🚨 TROUBLESHOOTING

### **Problem: "pnpm safe:version not found"**
```bash
# Solution: Check package.json scripts section
cat package.json | Select-String -Pattern "safe:version"

# Should show: "safe:version": "..."
# If not found, use: pnpm version patch (but watch for npm config issues)
```

### **Problem: "GitHub push failed"**
```bash
# Check git remote
git remote -v

# Should show: origin = https://github.com/MonaFP/RawaLite

# Try push manually:
git push origin main
git push origin --tags
```

### **Problem: "Pre-commit validation failed"**
```bash
# Run manual validation:
pnpm build
pnpm typecheck
pnpm validate:migrations

# Fix any errors, then retry release
```

### **Problem: "better-sqlite3 ABI mismatch"**
```bash
# Run ABI rebuild:
node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs

# Then retry validation:
pnpm validate:critical-fixes
```

---

## 📊 RELEASE ARTIFACTS (What gets created)

### **Git Commit:**
```
commit 1234abcd (v1.0.79)
Author: Your Name
Date: 2025-11-05

    chore: release v1.0.79
    
    Generated from: pnpm release:patch
```

### **Git Tag:**
```
tag v1.0.79
ref: v1.0.79
commit 1234abcd
```

### **GitHub Release:**
```
Release: v1.0.79
Title: Version 1.0.79
Notes: Automated release from pnpm release:patch
Assets:
  - RawaLite-Setup-1.0.79.exe (from dist-release/)
  - RawaLite-1.0.79-win.zip
  - latest.yml (update manifest)
```

### **Package Files:**
```
Updated:
- package.json (version: 1.0.79)
- package-lock.yaml (updated versions)
- All TypeScript builds (dist-electron/, dist-web/)
```

---

## 📋 RELEASE WORKFLOW DIAGRAM

```
┌─────────────────────────────┐
│ Phase 2: Dev Testing       │
│ (COMPLETE - commit 1672c9f6)│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Step 1: Validate            │
│ pnpm validate:critical-fixes│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Step 2: Bump Version        │
│ pnpm safe:version patch     │
│ v1.0.78 → v1.0.79          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Step 3: Create Release      │
│ pnpm release:patch          │
│ (git + tag + GitHub)       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ GitHub Release Available   │
│ v1.0.79 with artifacts    │
└─────────────────────────────┘
               │
               ▼
        ┌─────────────┐
        │  Phase 4:   │
        │  Production │
        │ Deployment  │
        └─────────────┘
```

---

## 🎯 SUCCESS CRITERIA

**Phase 3 Successful When:**
- [ ] ✅ `pnpm validate:critical-fixes` passes
- [ ] ✅ `pnpm safe:version patch` succeeds
- [ ] ✅ `pnpm release:patch` completes
- [ ] ✅ `git log --oneline -1` shows v1.0.79 commit
- [ ] ✅ `git tag -l` includes v1.0.79
- [ ] ✅ GitHub release v1.0.79 visible
- [ ] ✅ Release artifacts available
- [ ] ✅ No errors in process

---

## 📝 AFTER PHASE 3 - NEXT STEPS

### **Immediate (Within 1 hour):**
1. ✅ Verify release on GitHub
2. ✅ Check release artifacts are available
3. ✅ Update project documentation if needed

### **Short-term (Within 1 day):**
1. ✅ Run Phase 4 production deployment (if applicable)
2. ✅ Announce release to team/users
3. ✅ Monitor for issues in v1.0.79

### **Documentation (Mandatory):**
1. ✅ Create release notes
2. ✅ Document breaking changes (if any)
3. ✅ Update CHANGELOG.md

---

## 💡 KEY POINTS

- **Version Format:** v1.0.79 (semantic versioning)
- **Patch Release:** Only patch increment (1.0.78 → 1.0.79)
- **Automated:** All git + GitHub operations automated
- **Safe:** pnpm safe:version prevents npm config conflicts
- **Validated:** Critical fixes preserved pre-release

---

## ⏱️ ESTIMATED TIMELINE

| Step | Command | Duration | Status |
|------|---------|----------|--------|
| 1. Validate | `pnpm validate:critical-fixes` | 1-2 min | Ready |
| 2. Version | `pnpm safe:version patch` | 1 min | Ready |
| 3. Release | `pnpm release:patch` | 2-3 min | Ready |
| 4. Verify | Manual check | 2-3 min | Ready |
| **Total** | **All steps** | **~10 min** | ✅ Ready |

---

## ✅ READY FOR PHASE 3

**Current Status:** Phase 2 COMPLETE  
**Next Action:** Execute Phase 3 commands above  
**Expected Outcome:** v1.0.79 released to GitHub  
**Timeline:** ~10 minutes

**Proceed with Phase 3 when ready!**

---

*Phase 3 Quick Start Guide | Option B3 Hybrid-Stabilität Release | 2025-11-05*
