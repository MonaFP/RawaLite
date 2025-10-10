# 🚀 RELEASE WORKFLOW PROMPT - Copy & Paste zu VS Code Chat

## CONTEXT
Du bist GitHub Copilot und hilfst beim Release-Prozess für RawaLite. Führe einen strukturierten, vollständigen Release-Workflow durch.

## INSTRUCTIONS
Arbeite diese Phasen systematisch ab und validiere jeden Schritt:

### PHASE 1: Pre-Release Validation (MUSS bestehen)
- [ ] 🔍 **Critical Fixes:** `pnpm validate:critical-fixes` ausführen (Erwarte: 14/14 fixes validated successfully)
- [ ] 🧪 **Tests:** `pnpm test` ausführen (Erwarte: All tests passing)  
- [ ] 📊 **Git Status:** `git status` prüfen (Erwarte: working tree clean)
- [ ] 📈 **Current Version:** package.json Version ermitteln und nächste Version vorschlagen

### PHASE 2: Version Management & Git Operations
- [ ] 📝 **Version Bump:** Basierend auf Changes bestimme Release-Typ (patch/minor/major)
- [ ] 📄 **Update package.json:** Version entsprechend aktualisieren
- [ ] 🏷️ **Git Operations:** Commit + Tag erstellen mit Format `vX.X.X`
- [ ] 🔄 **Push:** Git push mit Tags: `git push origin main --tags`

### PHASE 3: GitHub Actions Release (PRIMARY METHOD)
- [ ] 🚀 **Trigger GitHub Actions:** `gh workflow run release.yml -f tag=vX.X.X`
- [ ] ⏰ **Monitor Actions:** GitHub Actions Tab überwachen (5-10 Minuten)
- [ ] � **Check Workflow Status:** Stelle sicher, dass alle Steps erfolgreich sind
- [ ] 📦 **Verify Build Artifacts:** Actions sollten automatisch Assets erstellen
- [ ] 🚨 **MANDATORY ASSET VALIDATION:** Nach Actions-Completion: `gh release view vX.X.X --json assets`
- [ ] ✅ **Release Publishing:** Actions published Release automatisch nach erfolgreicher Asset-Erstellung

### PHASE 3-FALLBACK: Manual CLI Release (ONLY IF ACTIONS FAIL)
- [ ] 🚨 **Use only if GitHub Actions failed:** Nur bei Actions-Fehlern verwenden
- [ ] 🏗️ **Manual Build:** `pnpm clean && pnpm build && pnpm dist`
- [ ] 🚀 **Create Release:** `gh release create vX.X.X --title "🚀 RawaLite vX.X.X" --generate-notes dist-release/RawaLite-Setup-X.X.X.exe dist-release/latest.yml`
- [ ] 📝 **Release Notes:** Automatische Generation mit GitHub CLI

### PHASE 4: Post-Release Verification  
- [ ] 🧪 **UpdateManager Test:** Simuliere Update-Check und Download-Fähigkeit
- [ ] � **Backward Compatibility:** Teste ältere Version → neue Version Updates ⚠️ NEW REQUIREMENT
- [ ] �📱 **User Communication:** GitHub Release-Link für Testuser bereitstellen
- [ ] 📚 **Documentation:** Updates in CRITICAL-FIXES-REGISTRY.md falls nötig
- [ ] 🎉 **Success Confirmation:** Bestätige funktionalen Release für End-User

### ⚠️ CRITICAL COMPATIBILITY CHECKS (NEW)
- [ ] **Asset Naming:** Verwende IMMER `RawaLite-Setup-X.X.X.exe` Format (nicht Punkte!)
- [ ] **Version Compatibility:** Teste mindestens N-2 Versionen → neue Version  
- [ ] **Error Messages:** Prüfe ob ältere Versionen hilfreiche Fehlermeldungen bekommen
- [ ] **API Changes:** Keine Breaking Changes in GitHub Release API Structure

## CURRENT PROJECT STATE
- **Repository:** MonaFP/RawaLite
- **Branch:** main  
- **Package Manager:** pnpm (⚠️ NIEMALS npm verwenden!)
- **Critical Fixes:** 12 active fixes (siehe CRITICAL-FIXES-REGISTRY.md) ⚠️ OUTDATED COUNT
- **GitHub Actions:** .github/workflows/release.yml vorhanden
- **Current Version:** 1.0.34 (aus package.json) ⚠️ OUTDATED

## RELEASE TYPES
- **patch** (1.0.34 → 1.0.35): Bugfixes, Critical Fixes, kleine Verbesserungen
- **minor** (1.0.34 → 1.1.0): Neue Features, größere Verbesserungen  
- **major** (1.0.34 → 2.0.0): Breaking Changes, Architektur-Änderungen

## CRITICAL VALIDATION COMMANDS
```bash
# Diese Befehle MÜSSEN vor Release erfolgreich sein:
pnpm validate:critical-fixes  # Muss "15/15 fixes validated successfully" zeigen
pnpm test                     # Muss "All tests passing" zeigen  
git status                    # Muss "working tree clean" zeigen

# GitHub Actions Workflow Commands:
gh workflow run release.yml -f tag=vX.X.X    # Trigger Actions build
gh run list --workflow=release.yml --limit=1  # Check latest run status
gh run view --log                             # View detailed logs if failed
```

## EXPECTED OUTPUTS
- ✅ **Neuer Git Tag:** vX.X.X im Repository
- ✅ **GitHub Actions Erfolg:** Workflow-Status "completed" 
- ✅ **GitHub Release:** Mit automatisch generierten Release Notes
- ✅ **Build Assets:** RawaLite-Setup-X.X.X.exe + latest.yml verfügbar (via Actions)
- ✅ **UpdateManager:** Funktional für Testuser (Download + Installation)
- ✅ **Critical Fixes:** Alle 15 Fixes validiert und dokumentiert

## ERROR HANDLING STRATEGIES
- **Critical Fixes Failed:** STOP sofort → Identifiziere fehlenden Fix in CRITICAL-FIXES-REGISTRY.md
- **Tests Failed:** STOP sofort → Repariere Tests vor Release
- **Git Issues:** Resolve conflicts → Clean working tree → Retry
- **GitHub Actions Failed:** Check Workflow logs → Fix issues → Retry OR fallback zu manueller Methode
- **Asset Validation Failed:** Verwende GitHub Actions logs für Debugging → Retry Build
- **Backward Compatibility Failed:** STOP → Analysiere Breaking Changes → Fix oder Revert

## MANUAL FALLBACK PROCEDURES
Falls GitHub Actions fehlschlägt:
```bash
# 🚨 CRITICAL: Nur bei GitHub Actions Failure verwenden!
# Emergency Manual Build & Upload
pnpm clean:release:force
pnpm build
pnpm dist  # May require native module rebuild

# MANDATORY: Asset-Namen prüfen
ls dist-release/              # Muss RawaLite-Setup-X.X.X.exe zeigen

# MANDATORY: Release mit Assets erstellen (nicht nur upload)
gh release create vX.X.X --generate-notes "dist-release/RawaLite-Setup-X.X.X.exe" "dist-release/latest.yml"

# MANDATORY: Final Validation
gh release view vX.X.X --json assets | jq '.assets[].name'  # Muss .exe zeigen
```

## ⚠️ CRITICAL ASSET VALIDATION RULES (NEW)
- [ ] **NEVER** ignore empty assets array: `{"assets": []}`
- [ ] **ALWAYS** check asset size: Must be >100MB for .exe file
- [ ] **ALWAYS** verify asset naming: `RawaLite-Setup-X.X.X.exe` format
- [ ] **STOP RELEASE** if UpdateManager would get "Failed to parse URL from" error
- [ ] **DELETE RELEASE** if no assets and recreate with manual build

## SUCCESS CRITERIA
- [ ] UpdateManager zeigt neues Update an
- [ ] Download über UpdateManager funktioniert  
- [ ] Installation über UpdateManager funktioniert
- [ ] Alle Testuser können problemlos updaten
- [ ] GitHub Release hat vollständige Assets

## PROMPT USAGE EXAMPLES
```
"Führe Release-Workflow durch - patch release für UpdateManager fixes"
"Release durchführen - minor version für neue Features"  
"Hotfix release nötig - kritischer Bug in Production"
```

---

## 🎯 WORKFLOW ACTIVATION
**Kopiere diesen Prompt in VS Code Chat und sage:**
**"Führe einen Release-Workflow durch - Typ: [patch/minor/major] für [Beschreibung der Änderungen]"**

**Beispiel:** *"Führe einen Release-Workflow durch - Typ: patch für Critical Fix der UpdateManager Asset Validation"*