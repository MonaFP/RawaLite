# RawaLite – Kurz-Instructions für KI

> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 17.10.2025 (ROOT_ Migration für KI-Accessibility)  
> **Status:** Production Ready | **Typ:** KI-Coding-Instructions  
> **Schema:** `ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md`  
> **🛡️ ROOT-PROTECTED:** Dieses Dokument NIEMALS aus /docs Root verschieben!

> **⚠️ CRITICAL:** [ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - **MANDATORY READ - Session-Killer-Fehler verhindern**
> **🛡️ NEVER violate:** [ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - Geschützte Code-Patterns
> **🏗️ ALWAYS use:** Field-Mapper + convertSQLQuery() - Nie hardcoded snake_case SQL
> **📱 ELECTRON-specific:** `!app.isPackaged` für Environment-Detection - Nie process.env.NODE_ENV
> **📚 BEFORE coding:** docs/ semantic_search für verwandte Probleme - Nie ohne Dokumentations-Review

**If Critical Pattern Missing:** STOP immediately, re-implement from registry, test thoroughly.

## 📅 DOKUMENTATIONS-STANDARDS - ZWINGEND ERFORDERLICH

**JEDES DOKUMENT MUSS FOLGENDE DATUMS-HEADER ENTHALTEN:**

```markdown
> **Erstellt:** DD.MM.YYYY | **Letzte Aktualisierung:** DD.MM.YYYY (Grund der Änderung)  
> **Status:** Production Ready/Draft/WIP | **Typ:** Guide/Fix/Report/etc.
```

**VORGABEN:**
1. **MANDATORY:** Jedes neue Dokument braucht Datums-Header
2. **MANDATORY:** Bei JEDER Änderung "Letzte Aktualisierung" mit Grund erweitern  
3. **MANDATORY:** Heutiges Datum verwenden: 17.10.2025
4. **MANDATORY:** Grund der Änderung spezifizieren (z.B. "ROOT_ Migration", "Bugfix XY")
5. **FORBIDDEN:** Dokumente ohne Datums-Header erstellen oder ändern

**Beispiele:**
```markdown
> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 17.10.2025 (ROOT_ Migration)  
> **Erstellt:** 12.10.2025 | **Letzte Aktualisierung:** 17.10.2025 (Schema-Erweiterung)  
```

## 📁 DOCUMENTATION STRUCTURE RULES - MANDATORY

**BEFORE CREATING OR MOVING ANY DOCUMENTATION:**

1. **MANDATORY:** Follow docs/ folder structure (00-meta to 13-deprecated)
2. **MANDATORY:** Check correct folder purpose before placement
3. **MANDATORY:** Use consistent naming patterns (LESSONS-LEARNED-topic.md)
4. **MANDATORY:** Update INDEX.md files when adding content
5. **FORBIDDEN:** Create duplicate files in multiple folders
6. **FORBIDDEN:** Mix different topics in same folder

**Folder Structure (MUST FOLLOW):**

> **📋 Complete Structure:** See [VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md](VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md) for detailed folder contents and current structure.

```
docs/
├── ROOT_VALIDATED_*               Root-critical KI documents (NEVER move!)
├── 00-meta/           Meta-documentation, project management
├── 01-standards/      Code standards, conventions, guidelines  
├── 02-architecture/   System design, architecture decisions
├── 03-development/    Development workflows, debugging, setup
├── 04-testing/        Testing strategies, test documentation
├── 05-database/       Database design, migrations, schemas
├── 06-paths/          Path management, file system access
├── 07-ipc/            IPC communication patterns
├── 08-ui/             User interface design, components
├── 09-pdf/            PDF generation, document handling
├── 10-security/       Security concepts, authentication
├── 11-deployment/     Deployment, updates, distribution
├── 12-lessons/        Lessons learned, retrospectives
├── 13-deprecated/     Deprecated/obsolete content
├── 14-implementations/ Implementation details, code examples
└── 15-session-summary/ Session notes and summaries

Each folder MUST contain exactly: final/, wip/, plan/, sessions/
```

**File Placement Rules:**
- **Development workflows** → `03-development/`
- **Architecture decisions** → `02-architecture/`
- **Database related** → `05-database/`
- **Deployment/Updates** → `11-deployment/`
- **Lessons Learned** → `12-lessons/` (unless topic-specific)
- **Cross-cutting concerns** → Use **cross-references**, not duplicates

**Naming Standards:**
- `LESSONS-LEARNED-specific-topic.md` for lessons
- `INDEX.md` for folder overview (ALL CAPS)
- **ROOT_VALIDATED_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md** for root-critical documents
- **VALIDATED_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md** for KI-verified document status
- Standard folders: `final/`, `wip/`, `plan/`, `sessions/` (ENFORCED)

**Cross-Reference Pattern:**
```markdown
> **Related:** See [Topic](../folder/file.md) for implementation details
> **See also:** [Related Topic](../other-folder/related.md)
```

## 🔍 PRÄFIX SYSTEM (KI-FREUNDLICH)

**For KI Status Recognition and Quality Assurance:**

### **ROOT_VALIDATED_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md Pattern:**
- **Purpose:** KI-critical documents that MUST stay in /docs root
- **Format:** `ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md`
- **Usage:** For session-critical documentation that KI needs immediate access to
- **Benefit:** Prevents accidental reorganization, ensures maximum accessibility

### **VALIDATED_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md Pattern:**
- **Purpose:** KI-friendly status validation marker
- **Format:** `VALIDATED_GUIDE-SUSTAINABLE-ARCHITECTURE-FIX_2025-10-15.md`
- **Usage:** After manual developer review and status confirmation
- **Benefit:** Prevents status confusion in future KI sessions

### **SOLVED_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md Pattern:**
- **Purpose:** Problem completely resolved and tested
- **Format:** `SOLVED_FIX-FORMAT-CURRENCY-EXTRA-ZERO_2025-10-15.md`
- **Usage:** When issue is fully implemented, validated and user-confirmed
- **Benefit:** Clear distinction between documented vs. solved problems

**Validation Workflow:**
1. Document created/moved → Standard naming
2. Developer reviews content and status
3. Developer confirms correct folder placement
4. Move to correct folder with VALIDATED_ prefix
5. **NEW:** If problem solved completely → SOLVED_ prefix
6. **CRITICAL:** If KI needs root access → ROOT_ prefix
7. Future KI sessions recognize validated/solved status

**Examples:**
```
ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md
ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md
VALIDATED_GUIDE-SUSTAINABLE-ARCHITECTURE-FIX_2025-10-15.md
SOLVED_FIX-FORMAT-CURRENCY-EXTRA-ZERO_2025-10-15.md
LESSON_FIX-DATABASE-SCHEMA-MIGRATION-FIX_2025-10-15.md
COMPLETED_IMPL-MIGRATION-013-DISCOUNT-SYSTEM_2025-10-15.md
WIP_PLAN-PACKAGE-PRICE-DISPLAY-FIELD-MAPPING_2025-10-15.md
```

## 📋 **VOLLSTÄNDIGE SCHEMA-REFERENZ**

### **Schema-Format:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md
```

### **STATUS-PRÄFIXE (8 Typen):**
| **Präfix** | **Bedeutung** | **KI-Verhalten** |
|:--|:--|:--|
| `ROOT_` | **KI-kritische Dokumente die IMMER im /docs Root bleiben** | **Niemals verschieben!** |
| `VALIDATED_` | Validierte, stabile Dokumentation | **Verlässliche Quelle** |
| `SOLVED_` | Gelöste Probleme und Fixes | **Fertige Lösung** |
| `LESSON_` | Lessons Learned und Debugging | **Vergleichende Analyse** |
| `WIP_` | Work in Progress | **Nur Orientierung** |
| `COMPLETED_` | Abgeschlossene Implementierungen | **Fertige Reports** |
| `PLAN_` | Planungsdokumente und Roadmaps | **Entwurfsstatus** |
| `DEPRECATED_` | Veraltete, ersetzte Dokumentation | **Ignorieren** |

### **TYP-KATEGORIEN (8 Typen):**
| **Typ** | **Verwendung** | **Beispiele** |
|:--|:--|:--|
| `GUIDE-` | Leitfäden, Anleitungen | Implementierungs-Guidelines |
| `FIX-` | Lessons Learned, Debugging, Fixes | Bug-Fixes, Debug-Sessions |
| `IMPL-` | Implementierungen, Features | Feature-Implementierungen |
| `REPORT-` | Berichte, Analysen | Session-Reports, Analyse-Berichte |
| `REGISTRY-` | Listen, Registries, Collections | Sammlungen, Path-Management |
| `TEMPLATE-` | Vorlagen, Templates | Copy&Paste Templates |
| `TRACKING-` | Status-Tracking, Quality-Tracking | Fortschritts-Tracking |
| `PLAN-` | Planungsdokumente, Roadmaps | Projekt-Planungen, Strategien |

**KI Recognition Rules:**
- ✅ ROOT_ prefix = NEVER move from /docs root, highest priority access
- ✅ VALIDATED_ prefix = Status is confirmed and correct
- 🎯 SOLVED_ prefix = Problem fully resolved and implemented
- ❌ No prefix = Needs manual review for status accuracy
- 🔄 Use prefix system for all document reorganization

## 🔑 Kernregeln

Dies ist die **Kurzfassung** der verbindlichen Projektregeln, optimiert für KI-Prompts.  
Immer strikt befolgen, keine Abweichungen.

**WICHTIG – NICHT VERHANDELBAR:**
In diesem Projekt gelten die RawaLite Coding Instructions als unveränderliche Referenz-Dokumente.

Du darfst keine Änderungen an PROJECT_OVERVIEW.md, RawaLite – AI Coding Instructions oder anderen Projekt-Dokumenten vornehmen.

Du darfst die Instruktionen nicht kürzen, umschreiben, interpretieren oder in anderes Format bringen.

Wenn du in Konflikt mit diesen Instruktionen kommst: nicht improvisieren, sondern sofort nachfragen.

Dein Fokus liegt ausschließlich auf Code-Änderungen, Bugfixes, Tests und Umsetzung innerhalb bestehender Patterns.

Die Dokumentation ist Read-Only und darf von dir niemals verändert oder überschrieben werden.

Bestätige bitte jedes Mal, dass du die Dokumentation nicht angepasst hast.

## 🛡️ CRITICAL FIX PRESERVATION RULES - NICHT VERHANDELBAR

**BEFORE ANY FILE EDIT OR VERSION CHANGE:**

1. **MANDATORY:** Check [ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md)
2. **MANDATORY:** Verify file is not listed in critical fixes
3. **MANDATORY:** If file IS listed → preserve ALL required patterns
4. **MANDATORY:** Run `pnpm validate:critical-fixes` before version bump
5. **FORBIDDEN:** Remove Promise-based WriteStream patterns
6. **FORBIDDEN:** Remove file system flush delays  
7. **FORBIDDEN:** Add duplicate event handlers
8. **FORBIDDEN:** Change established port configurations

**Critical Files (EXTRA CAUTION):**
- `src/main/services/GitHubApiService.ts` - WriteStream race condition fix
- `src/main/services/UpdateManagerService.ts` - File flush delay + event handler fix
- `vite.config.mts` + `electron/main.ts` - Port consistency

**If Critical Pattern Missing:** STOP immediately, re-implement from registry, test thoroughly.

## 🔑 Kernregeln

- **PNPM-only** – niemals `npm` oder `yarn` verwenden.  
- **Alles in-App** – keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  
- **Paths**:  
  - Nur über `src/lib/paths.ts` (`PATHS`).  
  - Standalone: `src/lib/path-utils.ts`.  
  - **Verboten:** direkter `app.getPath()`.  
- **Persistenz**:  
  - Primary: SQLite (better-sqlite3) - Native module für Performance.  
  - Legacy: Dexie-Adapter verfügbar für Migration.  
  - Einstiegspunkt: `src/persistence/index.ts`.  
  - Adapter-Parität, Migration additiv & idempotent.  
  - **Verboten:** Direktimporte `SQLiteAdapter`/`DexieAdapter`.  
- **Nummernkreise**:  
  - Präfix, Stellen, aktueller Zähler, Reset (Nie/Jährlich/Monatlich).  
  - Atomar, Jahres-Reset optional.  
- **Lokale Installation**:
  - **Immer vor Installation neuen Build erstellen**: `pnpm build && pnpm dist`
  - Dann erst `.\install-local.cmd` ausführen
  - Sicherstellt aktuelle Code-Änderungen in der Installation

---

## 🚫 Verbotene Muster (niemals generieren)

- `npm` oder `yarn` Befehle.  
- `app.getPath()` außerhalb `paths.ts`.  
- `shell.openExternal`, externe Links, `window.open`, `target="_blank"`.  
- PDF-Assets aus dem Netz.  
- Direktimporte von `SQLiteAdapter` oder `DexieAdapter`.  
- SQL.js oder sql-wasm Referenzen (deprecated).
- Veraltete IPC-Channels wie `database:backup` (jetzt `backup:hot`).
- Dynamische IPC-Kanäle.  
- Node-APIs direkt im Renderer.
- Lokale Installation ohne vorherigen Build (`.\install-local.cmd` ohne `pnpm build && pnpm dist`).

---

## ✅ Ziel für KI
- **Nur Regeln anwenden** 
- Änderungen immer in Einklang mit den Master-Dokumenten in `/docs`.  
- Keine Duplikate oder widersprüchlichen Aussagen erzeugen.  
- Entwickler fragen bei Unklarheiten

---

## ✅ docs-Struktur

> **📋 Aktuelle Struktur:** Siehe [VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md](VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md) für vollständige Ordner-Inhalte und Details.

- ** Änderung nur nach Abnahme und Aufforderung durch Entwickler **-
- **hier ergänzen/aktualisieren bei neuen Inhalten** - 
docs/
├── ROOT_VALIDATED_*               Root-critical KI documents (NEVER move!)
├── 00-meta/            Meta-documentation, project management
├── 01-standards/       Code standards, conventions, guidelines  
├── 02-architecture/    System design, architecture decisions
├── 03-development/     Development workflows, debugging, setup
├── 04-testing/         Testing strategies, test documentation
├── 05-database/        Database design, migrations, schemas
├── 06-paths/           Path management, file system access
├── 07-ipc/             IPC communication patterns
├── 08-ui/              User interface design, components
├── 09-pdf/             PDF generation, document handling
├── 10-security/        Security concepts, authentication
├── 11-deployment/      Deployment, updates, distribution
├── 12-lessons/         Lessons learned, retrospectives
└── 13-deprecated/      Deprecated/obsolete content

---

## 🔧 **VALIDATION & SCRIPTS SYSTEM**

### **Critical Validations (Session-essentiell)**
```bash
# ZWINGEND vor jeder Code-Änderung
pnpm validate:critical-fixes

# Documentation Structure
pnpm validate:documentation-structure

# Database Integrity
pnpm validate:migrations
```

### **Scripts Registry & Schema Validation**
```bash
# Scripts Registry Synchronisation (neu)
node scripts/VALIDATE_SCRIPTS_REGISTRY_SYNC.mjs

# Schema Compliance Check
# Prüft KATEGORIE_SCOPE_SUBJECT_ACTION.ext Format
# 95.3% Schema Compliance aktuell (42/43 Scripts)
```

**Scripts System Overview:**
- **42 Scripts** mit KATEGORIE_SCOPE_SUBJECT_ACTION.ext Schema
- **Automatische Registry:** [ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md](ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md)
- **Schema Guide:** [ROOT_VALIDATED_GUIDE-SCRIPTS-SCHEMA_2025-10-17.md](ROOT_VALIDATED_GUIDE-SCRIPTS-SCHEMA_2025-10-17.md)
- **Validation:** Filesystem ↔ Registry ↔ Package.json Sync

---

**📍 Location:** `/docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md`  
**Purpose:** Essential KI coding guidelines and project rules  
**Access:** Direct from /docs root for maximum KI accessibility  
**Protection:** ROOT_ prefix prevents accidental reorganization