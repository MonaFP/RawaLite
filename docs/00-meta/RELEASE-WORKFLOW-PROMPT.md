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

### PHASE 2: Version Management
- [ ] 📝 **Version Bump:** Basierend auf Changes bestimme Release-Typ (patch/minor/major)
- [ ] 📄 **Update package.json:** Version entsprechend aktualisieren
- [ ] 🏷️ **Git Operations:** Commit + Tag erstellen mit Format `vX.X.X`
- [ ] 🔄 **Push:** Git push mit Tags: `git push origin main --tags`

### PHASE 3: GitHub Release Creation
- [ ] 🚀 **Create Release:** `gh release create vX.X.X --title "🚀 RawaLite vX.X.X" --generate-notes`
- [ ] 📝 **Release Notes:** Automatische Generation mit GitHub CLI
- [ ] ⏰ **Monitor Actions:** GitHub Actions Status überwachen (.github/workflows/release.yml)
- [ ] ✅ **Asset Check:** Warte auf und validiere Assets (.exe + .yml Dateien)

### PHASE 4: Post-Release Verification  
- [ ] 🧪 **UpdateManager Test:** Simuliere Update-Check und Download-Fähigkeit
- [ ] 📱 **User Communication:** GitHub Release-Link für Testuser bereitstellen
- [ ] 📚 **Documentation:** Updates in CRITICAL-FIXES-REGISTRY.md falls nötig
- [ ] 🎉 **Success Confirmation:** Bestätige funktionalen Release für End-User

## CURRENT PROJECT STATE
- **Repository:** MonaFP/RawaLite
- **Branch:** main  
- **Package Manager:** pnpm (⚠️ NIEMALS npm verwenden!)
- **Critical Fixes:** 14 active fixes (siehe CRITICAL-FIXES-REGISTRY.md)
- **GitHub Actions:** .github/workflows/release.yml vorhanden
- **Current Version:** 1.0.33 (aus package.json)

## RELEASE TYPES
- **patch** (1.0.33 → 1.0.34): Bugfixes, Critical Fixes, kleine Verbesserungen
- **minor** (1.0.33 → 1.1.0): Neue Features, größere Verbesserungen  
- **major** (1.0.33 → 2.0.0): Breaking Changes, Architektur-Änderungen

## CRITICAL VALIDATION COMMANDS
```bash
# Diese Befehle MÜSSEN vor Release erfolgreich sein:
pnpm validate:critical-fixes  # Muss "14/14 fixes validated successfully" zeigen
pnpm test                     # Muss "All tests passing" zeigen  
git status                    # Muss "working tree clean" zeigen
```

## EXPECTED OUTPUTS
- ✅ **Neuer Git Tag:** vX.X.X im Repository
- ✅ **GitHub Release:** Mit automatisch generierten Release Notes
- ✅ **Build Assets:** RawaLite.Setup.X.X.X.exe + latest.yml verfügbar
- ✅ **UpdateManager:** Funktional für Testuser (Download + Installation)
- ✅ **Critical Fixes:** Alle 14 Fixes validiert und dokumentiert

## ERROR HANDLING STRATEGIES
- **Critical Fixes Failed:** STOP sofort → Identifiziere fehlenden Fix in CRITICAL-FIXES-REGISTRY.md
- **Tests Failed:** STOP sofort → Repariere Tests vor Release
- **Git Issues:** Resolve conflicts → Clean working tree → Retry
- **GitHub Actions Failed:** Fallback zu manueller Asset-Erstellung via `pnpm dist`
- **Asset Validation Failed:** Verwende dist-release/ backup für manuellen Upload

## MANUAL FALLBACK PROCEDURES
Falls GitHub Actions fehlschlägt:
```bash
# Emergency Manual Build & Upload
pnpm clean:release:force
pnpm build
pnpm dist  # May require native module rebuild
gh release upload vX.X.X dist-release/*.exe dist-release/*.yml
```

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