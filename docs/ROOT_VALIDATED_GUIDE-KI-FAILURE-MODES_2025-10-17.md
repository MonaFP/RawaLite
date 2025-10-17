# CRITICAL KI-FAILURE-MODES

> **⚠️ MANDATORY READ vor jeder Session - Diese Fehler NIEMALS wiederholen**  
> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 17.10.2025 (ROOT_ Migration für KI-Accessibility)  
> **Status:** KRITISCH - Session-Killer Prevention  
> **Schema:** `ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md`  
> **🛡️ ROOT-PROTECTED:** Dieses Dokument NIEMALS aus /docs Root verschieben!

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_YYYY-MM-DD.md

Diese Datei: ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md
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
- `GUIDE-` - Leitfäden, Anleitungen (wie diese Datei)
- `FIX-` - Lessons Learned, Debugging, Fixes, Problems
- `IMPL-` - Implementierungen, Features
- `REPORT-` - Berichte, Analysen, Completion-Reports
- `REGISTRY-` - Listen, Registries, Collections
- `TEMPLATE-` - Vorlagen, Templates
- `TRACKING-` - Status-Tracking, Quality-Tracking
- `PLAN-` - Planungsdokumente, Roadmaps

---

## 🚨 **SESSION-KILLER FAILURE MODES**

Diese Fehler führen zu sofortigem Session-Abbruch und müssen verhindert werden:

### **❌ FAILURE MODE 1: Kritische Fixes ignorieren**

**Problem:** KI entfernt oder überschreibt kritische Code-Patterns ohne Prüfung

**Symptome:**
- WriteStream race conditions kehren zurück
- File system flush delays werden entfernt  
- Duplicate event handlers entstehen
- Port-Inkonsistenzen zwischen dev/prod

**Prävention:**
- ✅ **IMMER FIRST:** [ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) lesen
- ✅ **BEFORE ANY FILE EDIT:** Check if file is in critical fixes registry
- ✅ **MANDATORY:** Run `pnpm validate:critical-fixes` before version changes

### **❌ FAILURE MODE 2: Dokumentations-Chaos durch falsche Reorganisation**

**Problem:** KI verschiebt Dokumente nach eigenem Schema ohne Rücksicht auf etablierte Struktur

**Symptome:**
- Cross-References brechen
- PATHS.md Konstanten werden invalid
- Dokumentations-Hierarchie wird zerstört
- Root-kritische Dokumente verschwinden in Unterordnern

**Prävention:**
- ✅ **ROOT_ Präfix respektieren:** Niemals ROOT_-Dokumente aus /docs Root verschieben
- ✅ **Schema befolgen:** [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md
- ✅ **PATHS.md nutzen:** Keine hardcoded Pfade in Cross-References

### **❌ FAILURE MODE 3: Schema-Verletzungen bei Dokumenten**

**Problem:** KI erstellt Dokumente ohne korrektes Schema oder Datums-Header

**Symptome:**
- Inkonsistente Dateinamen
- Fehlende Datums-Header
- Falsche STATUS-Präfixe
- Missing Schema-Dokumentation

**Prävention:**
- ✅ **MANDATORY:** Jedes neue Dokument braucht Datums-Header
- ✅ **Schema befolgen:** Korrekte Präfixe und Typ-Kategorien verwenden
- ✅ **Aktuelles Datum:** 17.10.2025 verwenden
- ✅ **Grund angeben:** Bei Updates immer Grund der Änderung spezifizieren

### **❌ FAILURE MODE 4: Anti-Pattern Code Generation**

**Problem:** KI generiert Code der gegen etablierte RawaLite-Standards verstößt

**Symptome:**
- `npm`/`yarn` statt `pnpm`
- `process.env.NODE_ENV` statt `!app.isPackaged`
- Direkter `app.getPath()` statt PATHS system
- `shell.openExternal` oder externe Links
- Hardcoded SQL statt Field-Mapper

**Prävention:**
- ✅ **PNPM-only:** Niemals npm/yarn verwenden
- ✅ **Electron-specific:** `!app.isPackaged` für Environment detection
- ✅ **PATHS system:** Nur über `src/lib/paths.ts`
- ✅ **Field-Mapper:** Nie hardcoded snake_case SQL
- ✅ **In-App only:** Keine externen Links oder shell.openExternal

### **❌ FAILURE MODE 5: Version/Release Chaos**

**Problem:** KI führt Releases durch ohne kritische Validierung

**Symptome:**
- Releases mit broken critical fixes
- Version bumps ohne pre-validation
- Assets fehlen oder sind korrupt
- Production builds funktionieren nicht

**Prävention:**
- ✅ **Guards FIRST:** Alle Guards vor Release ausführen
- ✅ **Validation mandatory:** `pnpm validate:critical-fixes` vor Version bump
- ✅ **Build before install:** `pnpm build && pnpm dist` vor lokaler Installation
- ✅ **Safe commands:** `pnpm safe:version` statt direkter version commands

### **❌ FAILURE MODE 6: Datenbank/Migration Chaos**

**Problem:** KI ändert Datenbankschema ohne Rücksicht auf Migration-Kette

**Symptome:**
- Broken foreign key constraints
- Schema inconsistencies
- Migration rollback failures
- Data integrity violations

**Prävention:**
- ✅ **Field-Mapper ALWAYS:** Konsistente Feld-Mappings verwenden
- ✅ **Migration validation:** Schema-Konsistenz vor Änderungen prüfen
- ✅ **SQLite Adapter:** Nie direktimporte, immer über persistence/index.ts
- ✅ **Foreign Keys:** Constraint-Ketten respektieren

---

## 🛡️ **EMERGENCY STOP CONDITIONS**

**SOFORT SESSION BEENDEN wenn:**

- ❌ **Critical Fix Pattern fehlt** - Check registry sofort
- ❌ **Validation Script fehlschlägt** - Rollback erforderlich
- ❌ **ROOT_ Dokument wird verschoben** - Anti-pattern detected
- ❌ **Schema-Violation** - Dokumentation ohne korrektes Format
- ❌ **npm/yarn command** - PNPM-only policy violation
- ❌ **External link generation** - In-app policy violation

**Recovery Action:** Zurück zu letztem validen Zustand, Problem analysieren, korrekte Implementierung

---

## 🎯 **SUCCESS PREVENTION STRATEGIES**

### **1. Session Start Ritual:**
```markdown
🚨 KRITISCHE ANWEISUNG - SOFORT LESEN:

1. ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md (ABSOLUT KRITISCH!)
2. ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md
3. .github/instructions/copilot-instructions.md

⛔ NIEMALS Code editieren ohne diese Dokumente gelesen zu haben!
```

### **2. Pre-Edit Validation:**
- ✅ File in critical fixes? → Preserve patterns
- ✅ Schema korrekt? → Follow naming convention
- ✅ Cross-references valid? → Use PATHS.md
- ✅ Anti-patterns avoided? → Check forbidden list

### **3. Pre-Release Checklist:**
```bash
pnpm validate:critical-fixes
pnpm validate:docs-structure  
pnpm typecheck
pnpm test --run
pnpm build && pnpm dist
```

---

## 📊 **FAILURE STATISTICS**

### **Most Common Session Killers:**
1. **Critical Fix Removal** (40%) - Restored from registry
2. **Documentation Chaos** (25%) - ROOT_ system implemented
3. **Schema Violations** (20%) - Template system established
4. **Anti-Pattern Code** (10%) - Guidelines strengthened
5. **Version/Release Issues** (5%) - Validation improved

### **Recovery Time:**
- **Critical Fix:** 15-30 minutes (pattern restoration)
- **Documentation:** 5-15 minutes (path correction)
- **Schema:** 2-5 minutes (format correction)
- **Anti-Pattern:** 1-10 minutes (code replacement)

---

## 🔄 **CONTINUOUS IMPROVEMENT**

**This document MUST be updated when:**
- New failure modes are discovered
- Prevention strategies evolve
- Recovery procedures improve
- Success rates change

**Feedback Loop:**
1. **Failure occurs** → Document pattern
2. **Prevention developed** → Update this guide  
3. **Success validated** → Monitor statistics
4. **Process improved** → Iterate

---

## 📌 **FINAL REMINDER**

**Jeder hier dokumentierte Failure Mode ist REAL aufgetreten.**
**Jede Prevention Strategy wurde durch Schmerz erlernt.**
**Diese Patterns MÜSSEN befolgt werden für erfolgreiche Sessions.**

**Bei Zweifel:** Fragen, nicht raten! Lieber nachfragen als Session killer riskieren.

---

**📍 Location:** `/docs/ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md`  
**Purpose:** Critical failure prevention for all KI sessions  
**Access:** Direct from /docs root for maximum KI accessibility  
**Protection:** ROOT_ prefix prevents accidental reorganization

*Letzte Aktualisierung: 2025-10-17 - ROOT_ Migration für verbesserte KI-Accessibility und Anti-Move Protection*