# 🚨 HOTFIX WORKFLOW PROMPT - Critical Production Issues

## CONTEXT
EMERGENCY: Kritischer Bug in Production erkannt, sofortiger Hotfix-Release erforderlich.

## INSTRUCTIONS
Führe FAST-TRACK Release durch mit minimaler, aber sicherer Validation:

### EMERGENCY PHASE 1: Critical Assessment (1-2 Min)
- [ ] 🔥 **Issue Analysis:** Schweregrad bestimmen (Blocker/Critical/High)
- [ ] 🎯 **Scope Definition:** NUR den kritischen Fix, keine zusätzlichen Changes
- [ ] 📊 **Impact Assessment:** Betroffene User/Features identifizieren
- [ ] ⚡ **Quick Git Status:** Uncommitted changes stash/commit

### EMERGENCY PHASE 2: Hotfix Implementation (5-10 Min)
- [ ] 🌿 **Hotfix Branch:** `git checkout -b hotfix/v1.0.X` (optional, kann direkt main)
- [ ] 🔧 **Critical Fix Only:** Implementiere NUR den notwendigen Fix
- [ ] 🧪 **Minimal Testing:** Nur direkt betroffene Funktionalität testen
- [ ] 📝 **Patch Version:** Auto-increment patch version (1.0.33 → 1.0.34)

### EMERGENCY PHASE 3: Fast-Track Release (2-3 Min)
- [ ] ⚠️ **Skip Full Test Suite:** Nur critical-fixes validation laufen lassen
- [ ] 🏷️ **Emergency Tag:** Git commit + tag mit "HOTFIX:" prefix
- [ ] 🚀 **Immediate Release:** GitHub Release mit "🚨 HOTFIX" im Titel
- [ ] ⏰ **Monitor Actions:** GitHub Actions für Assets (oder manual fallback)
- [ ] 🚨 **CRITICAL ASSET CHECK:** `gh release view vX.X.X --json assets` - MUSS Assets haben!
- [ ] ❌ **EMERGENCY FALLBACK:** Bei `assets: []` → SOFORT `pnpm dist` + manual upload

### EMERGENCY PHASE 4: Rapid Deployment (1-2 Min)
- [ ] 🧪 **Quick UpdateManager Test:** Nur Update-Check + Download verifizieren
- [ ] 📱 **Emergency Communication:** Testuser sofort über Hotfix informieren
- [ ] 📚 **Minimal Documentation:** Hotfix in CRITICAL-FIXES-REGISTRY.md falls nötig

## HOTFIX VALIDATION (MINIMAL)
```bash
# Nur das Nötigste - keine Full Test Suite!
pnpm validate:critical-fixes  # Muss bestehen
# SKIP: pnpm test (zu langsam für Hotfix)
git status                    # Muss clean sein
```

## EMERGENCY COMMANDS
```bash
# Hotfix Fast-Track (falls Scripts vorhanden)
git checkout -b hotfix/v1.0.34  # Optional
# ... implement fix ...
git add . && git commit -m "🚨 HOTFIX: [Critical Fix Description]"
git tag v1.0.34
git push origin main --tags
gh release create v1.0.34 --title "🚨 HOTFIX RawaLite v1.0.34" --notes "Critical fix for [issue]"
```

## SKIP IN HOTFIX
- ❌ **Full Test Suite:** Zu zeitaufwändig für Emergency
- ❌ **Feature Testing:** Nur betroffene Funktionalität
- ❌ **Documentation Updates:** Minimal necessary only
- ❌ **Code Review:** Post-Hotfix Review möglich
- ❌ **Release Planning:** Emergency Mode

## FOCUS IN HOTFIX
- ✅ **Speed:** Maximal 15-20 Minuten für kompletten Workflow
- ✅ **Safety:** Critical Fixes müssen bestehen
- ✅ **Minimal Scope:** Nur der notwendige Fix
- ✅ **Quick Communication:** Testuser müssen schnell informiert werden

## POST-HOTFIX ACTIONS
- [ ] 🔄 **Merge Back:** Hotfix zurück in main mergen (falls Branch verwendet)
- [ ] 📝 **Full Testing:** Vollständige Test-Suite nach Hotfix laufen lassen
- [ ] 📚 **Documentation:** Hotfix-Lessons in LESSONS-LEARNED dokumentieren
- [ ] 🎯 **Root Cause:** Analyse warum der Bug nicht früher erkannt wurde

## HOTFIX COMMUNICATION TEMPLATE
```
🚨 CRITICAL HOTFIX: RawaLite v1.0.X

⚠️ PROBLEM: [Kurze Beschreibung des kritischen Issues]
✅ LÖSUNG: [Kurze Beschreibung des Fixes]
📦 SOFORT VERFÜGBAR: UpdateManager oder GitHub Release

⏰ Bitte umgehend updaten!
Link: https://github.com/MonaFP/RawaLite/releases/tag/v1.0.X
```

## 🎯 HOTFIX ACTIVATION
**Kopiere in VS Code Chat:** *"EMERGENCY HOTFIX für [kritisches Problem] - Fast-Track Release durchführen"*

**Beispiel:** *"EMERGENCY HOTFIX für UpdateManager crashes - Fast-Track Release durchführen"*

---

## ⚡ EMERGENCY SUCCESS CRITERIA
- [ ] Fix deployed within 20 minutes
- [ ] UpdateManager functional
- [ ] Testuser informed immediately
- [ ] Critical systems restored