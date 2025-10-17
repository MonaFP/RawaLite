# 🤖 KI-Session Briefing - Copy & Paste Template

> **Erstellt:** 16.10.2025 | **Letzte Aktualisierung:** 17.10.2025 (ROOT_ Migration für KI-Accessibility)  
> **Status:** KRITISCH - Session-Start Template | **Typ:** KI-Template  
> **Schema:** `ROOT_VALIDATED_TEMPLATE-KI-SESSION-BRIEFING_2025-10-17.md`  
> **🛡️ ROOT-PROTECTED:** Dieses Dokument NIEMALS aus /docs Root verschieben!

> **⚠️ WICHTIG: Verwende dieses Briefing für JEDE neue KI-Session!**  
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: VALIDATED_TEMPLATE-KI-SESSION-BRIEFING-2025-10-16.md
```

### **STATUS-PRÄFIXE:**
- `ROOT_` - **KI-kritische Dokumente die IMMER im /docs Root bleiben (NIEMALS verschieben!)**
- `VALIDATED_` - Validierte, stabile Dokumentation (verlässliche Quelle)
- `SOLVED_` - Gelöste Probleme und Fixes (fertige Lösung)
- `LESSON_` - Lessons Learned und Debugging (vergleichende Analyse)
- `WIP_` - Work in Progress (nur Orientierung)
- `COMPLETED_` - Abgeschlossene Implementierungen (fertige Reports)
- `PLAN_` - Planungsdokumente und Roadmaps (Entwurfsstatus)
- `DEPRECATED_` - Veraltete, ersetzte Dokumentation (ignorieren)

### **TYP-KATEGORIEN:**
- `GUIDE-` - Leitfäden, Anleitungen
- `FIX-` - Lessons Learned, Debugging, Fixes, Problems
- `IMPL-` - Implementierungen, Features
- `REPORT-` - Berichte, Analysen, Completion-Reports
- `REGISTRY-` - Listen, Registries, Collections
- `TEMPLATE-` - Vorlagen, Templates (wie diese Datei)
- `TRACKING-` - Status-Tracking, Quality-Tracking
- `PLAN-` - Planungsdokumente, Roadmaps

---

---

## 📋 Standard-Briefing für neue GitHub Copilot Sessions

```
🚨 KRITISCHE ANWEISUNG - SOFORT LESEN:

Bitte lese ZUERST und VOLLSTÄNDIG diese Dokumente, bevor du irgendwelche Code-Änderungen machst:

1. /docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md (ABSOLUT KRITISCH!)
2. /docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md
3. /docs/ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md
4. .github/instructions/copilot-instructions.md

DANN folge der optimalen Lesereihenfolge aus docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md

⛔ NIEMALS Code editieren ohne diese Dokumente gelesen zu haben!
⛔ NIEMALS kritische Fixes aus CRITICAL-FIXES-REGISTRY.md entfernen!
⛔ IMMER vor Version-Changes: pnpm validate:critical-fixes ausführen!
⛔ BEACHTE PRÄFIX-SYSTEM: 
   - ROOT_ → **KI-kritisch, NIEMALS verschieben!**
   - VALIDATED_ → **verlässliche Quelle**
   - SOLVED_ → **fertige Lösung** 
   - WIP_ → nur Orientierung
   - DEPRECATED_ → **ignorieren**

Bei Unsicherheit: Frag nach und validiere zuerst!
```

---

## 📝 Erweiterte Briefing-Varianten

### 🔧 Für Development-Tasks:
```
Neue KI-Session für Development:

1. PFLICHT: docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md lesen
2. PFLICHT: docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md lesen  
3. Dann: docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DEVELOPMENT_INDEX + docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#CORE_INDEX
4. Bei Code-Änderungen: pnpm validate:critical-fixes vor jedem Commit

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🗄️ Für Database/Backend-Tasks:
```
Neue KI-Session für Database/Backend:

1. PFLICHT: docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md lesen
2. PFLICHT: docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md lesen
3. Dann: docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DATA_INDEX + docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#CORE_INDEX
4. Immer: pnpm validate:critical-fixes vor Änderungen

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🎨 Für UI/Frontend-Tasks:
```
Neue KI-Session für UI/Frontend:

1. PFLICHT: docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md lesen
2. PFLICHT: docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md lesen
3. Dann: docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#UI_INDEX + docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#CORE_INDEX
4. Standards: docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#CORE_INDEX beachten

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🚀 Für Release/Deployment-Tasks:
```
Neue KI-Session für Release/Deployment:

1. PFLICHT: docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md lesen
2. PFLICHT: docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md lesen
3. Dann: docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DEPLOY_INDEX + docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#CORE_INDEX
4. ZWINGEND: pnpm validate:critical-fixes && pnpm validate:docs-structure
5. Verwende: pnpm safe:version statt pnpm version
6. Verwende: pnpm safe:dist statt pnpm safe:dist

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🐛 Für Debugging/Troubleshooting:
```
Neue KI-Session für Debugging:

1. PFLICHT: docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md lesen
2. PFLICHT: docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md lesen
3. Dann: docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#META_INDEX + docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#LESSONS_INDEX
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
1. `docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md`
2. `docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md`
3. `docs/ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md`
4. `.github/instructions/copilot-instructions.md`

### Phase 2: Projekt-Orientierung
4. `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DOCUMENTATION_STRUCTURE`
5. `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#META_INDEX`
6. `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#CORE_INDEX`
7. `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#ARCHITECTURE_OVERVIEW`

### Phase 3: Task-abhängig
- Development: `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DEVELOPMENT_INDEX` + `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DEBUGGING_GUIDE`
- Database: `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DATA_INDEX` + `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#SQLITE_DATABASE_SYSTEM`
- UI: `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#UI_INDEX` + `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#UI_PATTERNS_TABLE_FORMS`
- Security: `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#SECURITY_GUIDE` + `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#IPC_DATABASE_SECURITY`
- Deployment: `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DEPLOY_INDEX` + `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#DEPLOYMENT_UPDATES`

### Phase 4: Deep-Dive
- `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#LESSONS_INDEX`
- `docs/VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md#TROUBLESHOOTING_CORE`

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

**📍 Location:** `/docs/ROOT_VALIDATED_TEMPLATE-KI-SESSION-BRIEFING_2025-10-17.md`  
**Purpose:** Essential KI session start template for all new sessions  
**Access:** Direct from /docs root für maximum KI accessibility  
**Protection:** ROOT_ prefix prevents accidental reorganization

*Letzte Aktualisierung: 2025-10-17 - ROOT_ Migration für verbesserte KI-Accessibility*