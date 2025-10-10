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

#### 🔴 PROBLEM: GitHub Actions Workflow Failed  
```
SYMPTOM: gh workflow run erfolgreich getriggert, aber Build fails
DIAGNOSIS: Workflow-Pipeline Fehler in .github/workflows/release.yml
```
**SOLUTION STEPS:**
- [ ] 📊 **Check Workflow Status:** `gh run list --workflow=release.yml --limit=1`
- [ ] 🔍 **Detailed Logs:** `gh run view --log` für spezifische Fehler-Details
- [ ] 🔧 **Common Fixes:** Native module rebuild, dependency conflicts, build permissions
- [ ] � **Retry Workflow:** `gh run rerun` wenn temporärer Fehler

#### 🔴 PROBLEM: GitHub Actions Build Success aber keine Assets
```
SYMPTOM: Workflow zeigt "completed", aber gh release view zeigt leere assets
DIAGNOSIS: Asset-Upload Step fehlgeschlagen oder falsche Pfade
```
**SOLUTION STEPS:**
- [ ] � **Check Build Artifacts:** Workflow Logs nach "Create distribution" Step prüfen
- [ ] 🔍 **Asset Paths:** dist-release/ Verzeichnis in Actions Logs validieren  
- [ ] � **Manual Asset Upload:** `gh release upload vX.X.X dist-release/*.exe dist-release/*.yml`
- [ ] ✅ **Re-validate:** `gh release view vX.X.X --json assets`

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

#### 🔴 PROBLEM: Workflow Dispatch Tag Mismatch
```
SYMPTOM: gh workflow run -f tag=vX.X.X läuft, aber buildet falschen Code
DIAGNOSIS: Workflow checkt HEAD aus statt spezifizierten Tag
```
**SOLUTION STEPS:**
- [ ] � **Verify Tag:** `git tag -l vX.X.X` - existiert Tag überhaupt?
- [ ] 🔄 **Push Tags:** `git push origin --tags` falls Tag nur lokal
- [ ] 🔧 **Workflow Fix:** Checke .github/workflows/release.yml checkout step
- [ ] ✅ **Retry:** Nach Tag-Push erneut `gh workflow run release.yml -f tag=vX.X.X`

#### 🔴 PROBLEM: CLI Release vs GitHub Actions Conflict
```
SYMPTOM: CLI Release erstellt, dann GitHub Actions fehlschlagen
DIAGNOSIS: Release existiert bereits, Actions können nicht überschreiben
```
**SOLUTION STEPS:**
- [ ] 🗑️ **Delete Release:** `gh release delete vX.X.X --yes` 
- [ ] 🏷️ **Keep Tag:** Tag bleibt erhalten für Actions
- [ ] � **Trigger Actions:** `gh workflow run release.yml -f tag=vX.X.X`
- [ ] ⏰ **Monitor:** Actions erstellen Release neu mit Assets

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

# GitHub Actions Diagnostics  
gh workflow list                    # Available workflows
gh run list --workflow=release.yml --limit=5  # Recent runs
gh run view --log                   # Latest run details
gh api repos/MonaFP/RawaLite/releases  # Raw API check

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