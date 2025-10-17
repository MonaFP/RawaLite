# 🤖 KI-Session Briefing - Copy & Paste Template

> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 17.10.2025 (Content modernization + ROOT_ integration)  
> **Status:** VALIDATED - Reviewed and updated  
> **Schema:** `VALIDATED_TEMPLATE-KI-SESSION-BRIEFING_2025-10-17.md`

> **⚠️ CRITICAL:** [../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - **MANDATORY READ vor jeder Session**  
> **🛡️ NEVER violate:** Siehe [../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - Essential session patterns  
> **📚 ALWAYS:** Folge den aktuellen ROOT_ Dokumenten  

**⚠️ WICHTIG: Verwende dieses Briefing für JEDE neue KI-Session!**

---

## 📋 Standard-Briefing für neue GitHub Copilot Sessions

```
🚨 KRITISCHE ANWEISUNG - SOFORT LESEN:

Bitte lese ZUERST und VOLLSTÄNDIG diese Dokumente, bevor du irgendwelche Code-Änderungen machst:

1. /docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md (ABSOLUT KRITISCH!)
2. /docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md
3. /docs/ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md  
4. .github/instructions/copilot-instructions.md

DANN folge der optimalen Lesereihenfolge aus docs/00-meta/DOCUMENTATION-STRUCTURE-GUIDE.md

⛔ NIEMALS Code editieren ohne diese Dokumente gelesen zu haben!
⛔ NIEMALS kritische Fixes aus CRITICAL-FIXES-REGISTRY.md entfernen!
⛔ IMMER vor Version-Changes: pnpm validate:critical-fixes ausführen!

Bei Unsicherheit: Frag nach und validiere zuerst!
```

---

## 📝 Erweiterte Briefing-Varianten

### 🔧 Für Development-Tasks:
```
Neue KI-Session für Development:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen  
3. Dann: docs/03-development/INDEX.md + docs/01-standards/INDEX.md
4. Bei Code-Änderungen: pnpm validate:critical-fixes vor jedem Commit

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🗄️ Für Database/Backend-Tasks:
```
Neue KI-Session für Database/Backend:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen
3. Dann: docs/05-database/INDEX.md + docs/06-paths/INDEX.md + docs/07-ipc/INDEX.md
4. Immer: pnpm validate:critical-fixes vor Änderungen

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🎨 Für UI/Frontend-Tasks:
```
Neue KI-Session für UI/Frontend:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen
3. Dann: docs/08-ui/INDEX.md + docs/07-ipc/INDEX.md
4. Standards: docs/01-standards/INDEX.md beachten

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🚀 Für Release/Deployment-Tasks:
```
Neue KI-Session für Release/Deployment:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen
3. Dann: docs/11-deployment/INDEX.md + docs/10-security/INDEX.md
4. ZWINGEND: pnpm validate:critical-fixes && pnpm validate:docs-structure
5. Verwende: pnpm safe:version statt pnpm version
6. Verwende: pnpm safe:dist statt pnpm dist

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🐛 Für Debugging/Troubleshooting:
```
Neue KI-Session für Debugging:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen
3. Dann: docs/00-meta/TROUBLESHOOTING.md + docs/12-lessons/INDEX.md
4. Prüfe: Sind bekannte Fixes noch vorhanden?
5. Validiere: pnpm validate:critical-fixes

Problem-Kontext: [DEIN PROBLEM HIER EINFÜGEN]
```

---

## 🎯 Quick-Validation Commands

```bash
# Vor jeder Code-Änderung:
pnpm validate:critical-fixes

# Vor Documentation-Änderungen:
pnpm validate:docs-structure

# Vor Releases:
pnpm validate:critical-fixes && pnpm validate:docs-structure

# Sichere Version-Befehle:
pnpm safe:version patch
pnpm safe:dist
```

---

## 🚨 Emergency Stop Conditions

**SOFORT STOPPEN wenn:**
- ❌ Critical pattern aus REGISTRY fehlt
- ❌ Validation script fehlschlägt  
- ❌ Anti-patterns entdeckt
- ❌ WriteStream.end() ohne Promise wrapper
- ❌ Multiple process.on('close') handlers
- ❌ Port-Änderungen von 5174 in dev

**Bei Zweifel:** Fragen, nicht raten!

---

## 📚 Vollständige Dokumentations-Reihenfolge

### Phase 1: Kritische Grundlagen (PFLICHT)
1. `docs/00-meta/CRITICAL-FIXES-REGISTRY.md`
2. `docs/00-meta/INSTRUCTIONS-KI.md`
3. `.github/copilot-instructions.md`

### Phase 2: Projekt-Orientierung
4. `docs/00-meta/DOCUMENTATION-STRUCTURE-GUIDE.md`
5. `docs/00-meta/ONBOARDING-GUIDE.md`
6. `docs/01-standards/INDEX.md`
7. `docs/02-architecture/INDEX.md`

### Phase 3: Task-abhängig
- Development: `docs/03-development/` + `docs/04-testing/`
- Database: `docs/05-database/` + `docs/06-paths/`
- UI: `docs/08-ui/` + `docs/07-ipc/`
- Security: `docs/10-security/`
- Deployment: `docs/11-deployment/`

### Phase 4: Deep-Dive
- `docs/12-lessons/INDEX.md`
- `docs/00-meta/TROUBLESHOOTING.md`

---

## ✅ Session-Erfolg Checkliste

- [ ] Kritische Dokumente vollständig gelesen
- [ ] Task-spezifische Dokumentation durchgegangen
- [ ] Validation-Commands erfolgreich ausgeführt
- [ ] Alle Änderungen validiert
- [ ] Keine Anti-patterns eingeführt
- [ ] Fix-preservation bestätigt

---

**📌 Diese Datei immer aktuell halten bei Struktur-Änderungen!**

*Letzte Aktualisierung: 2025-10-03*