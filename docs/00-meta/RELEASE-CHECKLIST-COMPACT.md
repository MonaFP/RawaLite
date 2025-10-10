# ⚡ QUICK RELEASE CHECKLIST - Copy & Paste zu VS Code Chat

## RAPID WORKFLOW ACTIVATION
**Kopiere in VS Code Chat:** *"Release Checklist schnell abarbeiten - [patch/minor/major]"*

## ✅ COMPACT CHECKLIST
```
[ ] 🔍 validate + test + clean git status
[ ] 📈 bump package.json version  
[ ] 🏷️ git commit + tag + push --tags
[ ] 🎯 determine release channel (stable vs beta)
[ ] 🚀 gh workflow run release.yml -f tag=vX.X.X (PRIMARY METHOD)
[ ] ⏰ monitor GitHub Actions (5-10 Min) - check workflow status
[ ] 🚨 MANDATORY: gh release view vX.X.X --json assets (MUST show assets!)
[ ] ❌ IF GitHub Actions failed → manual fallback: pnpm dist + gh release create
[ ] ✅ verify UpdateManager functional (NO "Failed to parse URL" error!)
[ ] 🔔 test auto-update preferences respected (stable/beta channels)
[ ] 🎉 release ready for testusers
```

## 📊 VERSION TRACKING
- **Current:** v1.0.40 (Latest with GitHub Actions integration)
- **Next Patch:** v1.0.41 (Bugfixes/Small improvements)
- **Next Minor:** v1.1.0 (New features)
- **Critical Fixes:** 15/15 active (CRITICAL-FIXES-REGISTRY.md)
- **Release Method:** GitHub Actions (primary), CLI (fallback only)
- **Update Channels:** Stable/Beta Channel Support (Migration 019)
- **Feature Flags:** User-configurable feature toggles available

## 🚨 CRITICAL GITHUB ACTIONS WORKFLOW (NEW)
```bash
# PRIMARY RELEASE METHOD - GitHub Actions First:
gh workflow run release.yml -f tag=vX.X.X    # → Triggers full build pipeline

# Monitor workflow status:
gh run list --workflow=release.yml --limit=1
gh run view --log                            # If failed

# FALLBACK ONLY - Manual Release:
gh release create vX.X.X --generate-notes dist-release/RawaLite-Setup-X.X.X.exe dist-release/latest.yml
```

## 📱 TESTUSER COMMUNICATION TEMPLATE
```
🚀 RawaLite vX.X.X verfügbar!

✨ Highlights: [Kurze Feature-Liste]
🔧 Fixes: [Wichtige Bugfixes]
📦 Download: UpdateManager oder GitHub Releases

Link: https://github.com/MonaFP/RawaLite/releases/tag/vX.X.X
```

## 🎯 ONE-LINER ACTIVATION
**"GitHub Actions Release: patch für [Beschreibung] - kompletter Workflow"**