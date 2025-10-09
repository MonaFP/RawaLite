# ⚡ QUICK RELEASE CHECKLIST - Copy & Paste zu VS Code Chat

## RAPID WORKFLOW ACTIVATION
**Kopiere in VS Code Chat:** *"Release Checklist schnell abarbeiten - [patch/minor/major]"*

## ✅ COMPACT CHECKLIST
```
[ ] 🔍 validate + test + clean git status
[ ] 📈 bump package.json version  
[ ] 🏷️ git commit + tag + push --tags
[ ] 🚀 gh release create + generate-notes
[ ] ⏰ wait for GitHub Actions assets (5-10 Min)
[ ] ✅ verify UpdateManager functional
[ ] 🎉 release ready for testusers
```

## 📊 VERSION TRACKING
- **Current:** v1.0.33 (UpdateManager Asset Fix + Testuser Experience)
- **Next Patch:** v1.0.34 (Bugfixes/Small improvements)
- **Next Minor:** v1.1.0 (New features)
- **Critical Fixes:** 14/14 active (CRITICAL-FIXES-REGISTRY.md)

## 🚨 QUICK VALIDATION
```bash
pnpm validate:critical-fixes  # → 14/14 ✅
pnpm test                     # → All passing ✅  
git status                    # → Clean ✅
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
**"Quick Release: patch für [Beschreibung] - alle Steps durchführen"**