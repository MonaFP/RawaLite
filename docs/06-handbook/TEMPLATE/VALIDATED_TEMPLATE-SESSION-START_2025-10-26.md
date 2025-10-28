# � Session-Start Template - [SESSION_TYP] - [DATUM]
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 26.10.2025 (Phase 1: Echtes Template erstellt)  
> **Status:** Template | **Typ:** Ausfüllbares Session-Start Template  
> **Schema:** `VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md`  
> **Usage:** Kopiere und fülle Platzhalter aus für neue sessions

> **🎯 AUSFÜLLBARES TEMPLATE - Platzhalter ersetzen**  
> **Zweck:** Strukturierte Session-Vorbereitung mit Checkliste  
> **Pattern:** [PLATZHALTER] durch aktuelle Werte ersetzen

## 📋 **SESSION-START CHECKLIST TEMPLATE**

### **📝 Session Information (AUSFÜLLEN):**
```markdown
**Session Datum:** [YYYY-MM-DD]
**Session Typ:** [Development|Database|UI|Debugging|Release|Theme]
**Hauptziel:** [SPEZIFISCHE_AUFGABE_BESCHREIBUNG]
**Betroffene Bereiche:** [DATABASE|UI|BACKEND|FRONTEND|PDF|THEME]
**Geschätzte Dauer:** [STUNDEN_SCHÄTZUNG]
**Verantwortlich:** [ENTWICKLER_NAME]
```

### **✅ PRE-SESSION CHECKLIST (ABHAKEN):**
- [ ] **Alle Terminals geschlossen** (taskkill /F /IM node.exe && taskkill /F /IM electron.exe)
- [ ] **Critical Fixes gelesen:** [06-handbook/REFERENCE/VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md)
- [ ] **Database Schema geprüft:** [06-handbook/REFERENCE/VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md)
- [ ] **Project Rules gelesen:** [06-handbook/REFERENCE/VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md)
- [ ] **Anti-patterns reviewed:** [06-handbook/ANTIPATTERN/VALIDATED_ANTIPATTERN-KI-MISTAKES_2025-10-26.md](../ANTIPATTERN/VALIDATED_ANTIPATTERN-KI-MISTAKES_2025-10-26.md)
- [ ] **Known Issues checked:** [06-handbook/ISSUES/](../ISSUES/) (falls vorhanden)
- [ ] **Validation executed:** `pnpm validate:critical-fixes`

### **🎯 SESSION SCOPE (AUSFÜLLEN):**
```markdown
**Hauptziel:** [BESCHREIBUNG_DER_HAUPTAUFGABE]

**Betroffene Dateien (geschätzt):**
- [DATEI_1]: [BESCHREIBUNG_ÄNDERUNG]
- [DATEI_2]: [BESCHREIBUNG_ÄNDERUNG]
- [DATEI_N]: [BESCHREIBUNG_ÄNDERUNG]

**Betroffene Datenbank-Tabellen:**
- [TABELLE_1]: [ART_DER_ÄNDERUNG]
- [TABELLE_2]: [ART_DER_ÄNDERUNG]

**Migrations erforderlich:** [JA|NEIN]
**Migration Nummer (falls neu):** [042|043|044|...]

**Tests erforderlich:** [JA|NEIN]
**Test-Typ:** [UNIT|INTEGRATION|E2E]
```

### **🔧 TECHNICAL CONTEXT (AUSFÜLLEN):**
```markdown
**Current Migration Status:** [AKTUELLE_MIGRATION_NUMMER]
**Database Schema Version:** [SCHEMA_VERSION]
**Critical Dependencies:** 
- better-sqlite3: [VERSION]
- electron: [VERSION]
- Theme System: [AKTUELLE_THEME_VERSION]

**Service Layer Pattern:** [WELCHE_SERVICES_BETROFFEN]
- DatabaseThemeService: [RELEVANT|NICHT_RELEVANT]
- DatabaseConfigurationService: [RELEVANT|NICHT_RELEVANT]
- DatabaseNavigationService: [RELEVANT|NICHT_RELEVANT]
- [WEITERE_SERVICES]: [RELEVANT|NICHT_RELEVANT]

**Field-Mapper Required:** [JA|NEIN]
**SQL Queries:** [ANZAHL_GESCHÄTZT]
```

### **🎯 SUCCESS CRITERIA (ABHAKEN AM SESSION-ENDE):**
- [ ] **Hauptziel erreicht:** [BESCHREIBUNG_ERGEBNIS]
- [ ] **Alle critical fixes preserved:** `pnpm validate:critical-fixes` ✅
- [ ] **No forbidden patterns introduced:** Code-Review durchgeführt ✅
- [ ] **Database schema integrity maintained:** Schema unverändert oder Migration korrekt ✅
- [ ] **Field-mapper used for all SQL:** Alle SQL-Queries über convertSQLQuery() ✅
- [ ] **Service layer patterns followed:** Keine direkten DB-Zugriffe ✅
- [ ] **Tests passing:** [ALLE|RELEVANTE] Tests erfolgreich ✅
- [ ] **Documentation updated:** [NEUE_DATEIEN_ERSTELLT] ✅

### **🚨 EMERGENCY PROTOCOLS (BEI PROBLEMEN):**
```bash
# ABI Issues:
pnpm remove better-sqlite3 && pnpm add better-sqlite3@12.4.1 && node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs

# Database Issues:
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs

# Process Issues:
taskkill /F /IM node.exe && taskkill /F /IM electron.exe

# Validation Issues:
pnpm validate:critical-fixes
pnpm validate:docs-structure
```

### **📝 SESSION NOTES (WÄHREND DER SESSION AUSFÜLLEN):**
```markdown
**Startzeit:** [HH:MM]
**Endzeit:** [HH:MM]

**Durchgeführte Schritte:**
1. [SCHRITT_1_BESCHREIBUNG]
2. [SCHRITT_2_BESCHREIBUNG]
3. [SCHRITT_N_BESCHREIBUNG]

**Entdeckte Probleme:**
- [PROBLEM_1]: [LÖSUNG_ODER_STATUS]
- [PROBLEM_2]: [LÖSUNG_ODER_STATUS]

**Unerwartete Erkenntnisse:**
- [ERKENNTNIS_1]
- [ERKENNTNIS_2]

**Offene Punkte für nächste Session:**
- [ ] [OFFENER_PUNKT_1]
- [ ] [OFFENER_PUNKT_2]
```

### **📁 RELATED DOCUMENTATION:**
- **Core Rules:** [06-handbook/REFERENCE/VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md)
- **Database Schema:** [06-handbook/REFERENCE/VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md)
- **Documentation Paths:** [06-handbook/REFERENCE/VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-DOCUMENTATION-PATHS_2025-10-26.md)
- **Lessons Learned Template:** [06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md](VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md)

---

**📍 Location:** `docs/06-handbook/TEMPLATE/VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md`  
**Purpose:** Ausfüllbares Template für strukturierte Session-Vorbereitung  
**Access:** 06-handbook template system  
**Usage:** Kopiere Template, ersetze [PLATZHALTER], arbeite Checkliste ab