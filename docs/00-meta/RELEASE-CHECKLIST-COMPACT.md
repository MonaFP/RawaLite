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
[ ] 🚨 MANDATORY: gh release view vX.X.X --json assets (MUST show assets!)
[ ] ❌ IF assets: [] → DELETE release + manual build: pnpm dist
[ ] 🔧 Manual upload: gh release upload vX.X.X dist-release/RawaLite-Setup-X.X.X.exe
[ ] ✅ verify UpdateManager functional (NO "Failed to parse URL" error!)
[ ] 🎉 release ready for testusers
```

## 📊 VERSION TRACKING
- **Current:** v1.0.33 (UpdateManager Asset Fix + Testuser Experience)
- **Next Patch:** v1.0.34 (Bugfixes/Small improvements)
- **Next Minor:** v1.1.0 (New features)
- **Critical Fixes:** 14/14 active (CRITICAL-FIXES-REGISTRY.md)

## 🚨 CRITICAL ASSET VALIDATION (NEW)
```bash
# MANDATORY nach jedem Release:
gh release view vX.X.X --json assets    # → MUSS Assets zeigen!

# VERBOTEN - Release ohne Assets:
{"assets": []}  # ❌ SOFORT LÖSCHEN!

# ERFORDERLICH - Release mit Assets:
{"assets": [{"name": "RawaLite-Setup-X.X.X.exe", "size": 106000000}]}  # ✅

# Bei fehlendem Asset - SOFORTIGER Fallback:
gh release delete vX.X.X --yes
pnpm dist
gh release create vX.X.X --generate-notes dist-release/RawaLite-Setup-X.X.X.exe
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