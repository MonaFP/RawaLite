# 🔧 RELEASE TROUBLESHOOTING PROMPT - When Things Go Wrong

## CONTEXT
GitHub Copilot Troubleshoot-Assistant für Release-Probleme bei RawaLite.

## INSTRUCTIONS
Analysiere das vorliegende Problem und führe systematisches Troubleshooting durch:

### COMMON RELEASE PROBLEMS & SOLUTIONS

#### 🔴 PROBLEM: Critical Fixes Validation Failed
```
SYMPTOM: pnpm validate:critical-fixes zeigt < 14/14 fixes
DIAGNOSIS: Ein oder mehrere Critical Fixes wurden überschrieben/entfernt
```
**SOLUTION STEPS:**
- [ ] 🔍 **Identify Missing:** Analysiere Validation Output - welcher Fix fehlt?
- [ ] 📚 **Check Registry:** CRITICAL-FIXES-REGISTRY.md für exakte Pattern
- [ ] 🔧 **Restore Fix:** Re-implementiere fehlenden Fix exakt nach Registry
- [ ] ✅ **Re-validate:** `pnpm validate:critical-fixes` bis 14/14 erreicht

#### 🔴 PROBLEM: Tests Failing Before Release
```
SYMPTOM: pnpm test zeigt failing tests
DIAGNOSIS: Code-Changes haben bestehende Tests gebrochen
```
**SOLUTION STEPS:**
- [ ] 🧪 **Identify Failures:** Welche Tests schlagen fehl?
- [ ] 🔍 **Root Cause:** Sind Tests outdated oder Code tatsächlich broken?
- [ ] 🔧 **Fix or Update:** Repariere Code oder aktualisiere Tests
- [ ] ✅ **Full Suite:** `pnpm test` muss 100% passing zeigen

#### 🔴 PROBLEM: GitHub Actions Build Failed  
```
SYMPTOM: Release created, aber keine Assets nach 10+ Minuten
DIAGNOSIS: .github/workflows/release.yml Build-Pipeline failed
```
**SOLUTION STEPS:**
- [ ] 📊 **Check Actions:** GitHub → Actions Tab → Failed Workflow analysieren
- [ ] 🔍 **Error Analysis:** Build-Log für Error-Details prüfen
- [ ] 🔧 **Manual Fallback:** Lokaler Build via `pnpm dist` + manual upload
- [ ] 📦 **Asset Upload:** `gh release upload vX.X.X dist-release/*.exe dist-release/*.yml`

#### 🔴 PROBLEM: Electron Build Failed (better-sqlite3)
```
SYMPTOM: pnpm dist fails mit ABI/native module errors
DIAGNOSIS: better-sqlite3 Compilation für falsche Node/Electron Version
```
**SOLUTION STEPS:**
- [ ] 🔧 **Clean Rebuild:** `pnpm rebuild:electron` mit native module recovery
- [ ] ⚠️ **Permission Fix:** Als Administrator ausführen falls EPERM errors
- [ ] 🔄 **Nuclear Option:** `pnpm clean && pnpm install && pnpm rebuild:electron`
- [ ] ✅ **Retry Build:** `pnpm dist` nach successful native rebuild

#### 🔴 PROBLEM: Release Assets Wrong/Missing
```
SYMPTOM: GitHub Release hat Assets, aber UpdateManager findet keine .exe
DIAGNOSIS: Asset-Namen stimmen nicht mit UpdateManager Expectations überein
```
**SOLUTION STEPS:**
- [ ] 🔍 **Asset Inspection:** GitHub Release Assets prüfen - korrekte Namen?
- [ ] 📝 **Naming Pattern:** Muss `RawaLite.Setup.X.X.X.exe` Format haben
- [ ] 🔧 **Re-upload:** Assets mit korrekten Namen neu hochladen
- [ ] 🧪 **UpdateManager Test:** Verify Update-Check erkennt neue Assets

#### 🔴 PROBLEM: UpdateManager Shows "No Updates Available"
```
SYMPTOM: Release erstellt, Assets vorhanden, aber UpdateManager sieht nichts
DIAGNOSIS: Version-Comparison Logic oder Asset-Detection Problem
```
**SOLUTION STEPS:**
- [ ] 📈 **Version Check:** package.json Version > aktuelle App Version?
- [ ] 🔍 **GitHub API:** Manuell GitHub Releases API testen
- [ ] 🧪 **Manual Test:** `pnpm dev:updatemanager` für Debug-Logs
- [ ] 🔧 **Force Refresh:** App-Cache clearen oder neu starten

### EMERGENCY PROCEDURES

#### 🚨 ROLLBACK STRATEGY
```bash
# Falls Release komplett fehlschlägt - Rollback
git tag -d vX.X.X                    # Local tag löschen
git push origin :refs/tags/vX.X.X    # Remote tag löschen  
gh release delete vX.X.X             # GitHub Release löschen
# Zurück zur vorherigen Version in package.json
```

#### 🚨 MANUAL ASSET CREATION & UPLOAD
```bash
# Notfall: Manuelle Asset-Erstellung
pnpm clean:release:force
pnpm build
pnpm dist
# Falls dist fehlschlägt:
pnpm rebuild:electron
pnpm dist
# Asset Upload:
gh release upload vX.X.X "dist-release/RawaLite Setup X.X.X.exe"
```

#### 🚨 COMMUNICATION TEMPLATE (Problem Release)
```
⚠️ RawaLite vX.X.X Release Delayed

🔧 ISSUE: [Kurze Problem-Beschreibung]
⏰ STATUS: [In Bearbeitung/Estimated Fix Time]
📱 ACTION: [Weiter vorherige Version nutzen/Warten auf Fix]

Updates folgen hier: [GitHub Issue Link]
```

## DIAGNOSTIC COMMANDS
```bash
# System Health Check
pnpm validate:critical-fixes         # Critical Fixes Status
pnpm test                           # Test Suite Status  
git status                          # Git Working Tree
node --version && pnpm --version    # Environment Info
electron --version                  # Electron Version

# Build Diagnostics
pnpm build                          # Web Build Test
pnpm dist --dry-run                 # Build Preview (if supported)
ls -la dist-release/                # Check existing artifacts
```

## 🎯 TROUBLESHOOTING ACTIVATION
**Kopiere in VS Code Chat:** *"Release Problem Troubleshooting für [spezifisches Problem]"*

**Beispiele:**
- *"Release Problem Troubleshooting für Critical Fixes Validation Failed"*
- *"Release Problem Troubleshooting für GitHub Actions Build Failed"*  
- *"Release Problem Troubleshooting für UpdateManager erkennt kein Update"*

---

## 📚 ADDITIONAL RESOURCES
- **Critical Fixes:** `/docs/00-meta/CRITICAL-FIXES-REGISTRY.md`
- **Build Issues:** `/docs/12-lessons/LESSONS-LEARNED-*-build-*.md`
- **UpdateManager:** `/docs/11-deployment/UPDATE_TESTING.md`
- **GitHub Actions:** `.github/workflows/release.yml`