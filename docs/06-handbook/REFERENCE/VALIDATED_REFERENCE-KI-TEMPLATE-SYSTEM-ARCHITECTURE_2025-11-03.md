# 🤖 KI-Template-System Architektur - Drei Layer Integration

> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Complete Template System Architecture Documentation)  
> **Status:** Reference | **Typ:** Architecture Guide - KI Template System  
> **Schema:** `VALIDATED_REFERENCE-KI-TEMPLATE-SYSTEM-ARCHITECTURE_2025-11-03.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Production Ready (automatisch durch "KI-Template-System" erkannt)
> - **TEMPLATE-QUELLE:** VALIDATED_REFERENCE Template
> - **AUTO-UPDATE:** Bei Template-System-Änderung automatisch diese Architektur aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "KI-Template-System Architektur", "Drei Layer Integration"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = Production Ready:**
> - ✅ **Template-Architecture** - Verlässliche Quelle für KI-Template-System
> - ✅ **Three-Layer Integration** - Authoritative Dokumentation der Template-Hierarchie
> - 🎯 **AUTO-REFERENCE:** Bei Template-Fragen IMMER diese Architektur konsultieren
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "TEMPLATE MISMATCH" → Architektur-Check erforderlich

---

## 🎯 **TEMPLATE-SYSTEM DREI-SCHICHTEN ARCHITEKTUR**

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: GLOBAL INSTRUCTIONS (Repo-Ebene)                      │
│ 📁 .github/instructions/copilot-instructions.md                 │
│ ├─ Scope: **ENTIRE PROJECT** - Global für alle KI-Sessions    │
│ ├─ Purpose: Unveränderliche Coding-Standards + Guidelines      │
│ └─ Status: **LOCKED** - Nur Dev änderungen                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Referenziert
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: SESSION BRIEFING (Session-Start-Ebene)                │
│ 📁 .github/prompts/KI-SESSION-BRIEFING.prompt.md               │
│ ├─ Scope: **PER SESSION** - Vor jeder neuen Session laden      │
│ ├─ Purpose: Session-Typ-spezifische Checklisten               │
│ └─ Status: **TEMPLATE** - Varianten für Development/DB/UI/etc  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Startet
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: SESSION-START TEMPLATE (Task-Ebene)                   │
│ 📁 docs/06-handbook/TEMPLATE/VALIDATED_TEMPLATE-SESSION-START  │
│ ├─ Scope: **INDIVIDUAL SESSION** - Pro Task ausfüllen         │
│ ├─ Purpose: Strukturierte Session-Vorbereitung + Checklists   │
│ └─ Status: **AUSFÜLLBAR** - Kopieren & Platzhalter ersetzen   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 **LAYER 1: GLOBAL INSTRUCTIONS (copilot-instructions.md)**

### **🎯 Was ist das?**
- **Zentrale KI-Coding-Richtlinie** für das gesamte Projekt
- Definiert **unveränderliche Projektregeln** unabhängig von Task-Typ
- Automatisch geladen beim GitHub Copilot Extension Start
- **Read-Only** für KI-Sessions (nur Entwickler ändern)

### **📂 Dateipfad:**
```
.github/instructions/copilot-instructions.md
↳ Wird AUTOMATISCH von GitHub Copilot geladen
↳ Gilt für: ALLE KI-Sessions in diesem Repo
```

### **🔑 Schlüsselinhalte (LAYER 1):**

| Inhalt | Zweck | Beispiel |
|:--|:--|:--|
| **Core Project Rules** | Unveränderliche Standards | "nur PNPM, nie npm" |
| **PATHS System Rules** | Main/Renderer/IPC Trennung | "Renderer: nur src/lib/paths.ts" |
| **Database Rules** | SQLite + Field-Mapper | "ALWAYS use convertSQLQuery()" |
| **Environment Detection** | Electron-spezifisch | "!app.isPackaged, nicht NODE_ENV" |
| **Critical Fix Patterns** | Session-Killer verhindern | "Promise WriteStream, 100ms delay" |
| **Verbotene Patterns** | Absolute Anti-Patterns | "❌ npm/yarn, shell.openExternal" |
| **Validation Commands** | Quick-Validierung | "pnpm validate:critical-fixes" |
| **ABI Quick-Fix** | Emergency Troubleshooting | "better-sqlite3 ABI-Problem Lösung" |
| **Database Chaos Resolution** | Bekannte Probleme | "echte DB-Location: AppData/Roaming" |
| **Theme System Rules** | Database-Theme-Patterns | "DatabaseThemeService, Field-Mapper" |
| **FILE BACKUP POLICY** | Pre-Mod Sicherung | ".backup extension mandatory" |

### **✅ Merkmale LAYER 1:**

- ✅ **Projekt-Global** - Gilt für ALLE Tasks/Sessions
- ✅ **Unveränderlich** - Sollte sich selten ändern
- ✅ **Auto-Load** - Copilot lädt automatisch
- ✅ **Hierarchie-Top** - Alle anderen Layer beziehen sich darauf
- ✅ **Kurzform** - Verweist auf detaillierte Dokumente in docs/

### **🔗 Referenzen in LAYER 1:**
```markdown
→ Verweist auf: VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md
→ Verweist auf: docs/ Sitemap Navigation
→ Verweist auf: Theme System dokumentation
```

---

## 📋 **LAYER 2: SESSION BRIEFING (KI-SESSION-BRIEFING.prompt.md)**

### **🎯 Was ist das?**
- **Session-Typ-Vorlage** mit Best Practices pro Task-Typ
- Definiert **Was muss VOR der Session gelesen werden?**
- Verschiedene **Varianten für unterschiedliche Tasks** (Development/DB/UI/Release/Theme/Debug)
- **Automatisches Copy-Paste Template** mit ausführlichen Checklisten

### **📂 Dateipfad:**
```
.github/prompts/KI-SESSION-BRIEFING.prompt.md
↳ Wird MANUELL von KI am Session-Start kopiert
↳ Gilt für: NEUE Sessions mit spezifischem Task-Typ
```

### **🔑 Schlüsselinhalte (LAYER 2):**

| Inhalt | Zweck | Beispiel |
|:--|:--|:--|
| **Standard Briefing** | Allgemein für alle Sessions | Critical Fixes, Project Rules, Anti-Patterns |
| **Development Variant** | Für Code-Development | DatabaseConfigurationService, Phase 7 Complete |
| **Database Variant** | Für DB-Änderungen | Migration Index, Schema Validation |
| **UI Variant** | Für Frontend-Tasks | Theme System, UI-Patterns |
| **Release Variant** | Für Releases/Deployment | validate:critical-fixes, pnpm safe:version |
| **Theme Variant** | Für Theme-Development | FIX-016/017/018, DatabaseThemeService |
| **Debugging Variant** | Für Troubleshooting | Lessons Learned durchsuchen, Fixes checken |

### **✅ Merkmale LAYER 2:**

- ✅ **Session-Typ-Spezifisch** - Angepasst an Task-Typ
- ✅ **Ausführlich** - Detaillierte Checklisten
- ✅ **Copy-Paste** - Kann direkt kopiert werden
- ✅ **Hierarchie-Mitte** - Verbindet Layer 1 + Layer 3
- ✅ **Auto-Aktiv** - Keywords triggern Auto-Verhalten

### **📋 LAYER 2 Standard-Struktur:**

```markdown
1. **Standard Briefing (General)**
   ├─ Lies: CRITICAL-FIXES (absolut kritisch!)
   ├─ Lies: PROJECT-CORE-RULES
   ├─ Lies: ANTIPATTERN-KI-MISTAKES
   ├─ Lies: copilot-instructions.md
   └─ Pre-Session Checklist (Backends, Haken, Validierungen)

2. **Development-Spezifisch**
   ├─ Extra: DatabaseConfigurationService
   ├─ Extra: Phase 7 Complete Status
   └─ Extra: Per-Mode Configuration System

3. **Database-Spezifisch**
   ├─ Extra: Migration System
   ├─ Extra: Schema Validation
   └─ Extra: Field-Mapper Rules

4. **UI-Spezifisch**
   ├─ Extra: Theme System
   ├─ Extra: UI-Pattern Standards
   └─ Extra: PDF-Theme Integration

5. **Release-Spezifisch**
   ├─ Extra: pnpm safe:version (NEVER pnpm version!)
   ├─ Extra: Pre-Flight Validation Suite
   └─ Extra: Zero-Tolerance Release Rules

6. **Theme-Spezifisch**
   ├─ Extra: FIX-016/017/018 (CRITICAL!)
   ├─ Extra: DatabaseThemeService Layer
   └─ Extra: Central Configuration Architecture

7. **Debugging-Spezifisch**
   ├─ Extra: Lessons Learned Recherche
   ├─ Extra: Known Fixes Validation
   └─ Extra: Critical Pattern Checks
```

### **🔗 Referenzen in LAYER 2:**
```markdown
→ Beginnt mit: LAYER 1 - copilot-instructions.md Regeln
→ Verweist auf: LAYER 3 - SESSION-START Template zum Ausfüllen
→ Verweist auf: docs/06-handbook/ Reference Documents
```

---

## 📋 **LAYER 3: SESSION-START TEMPLATE (VALIDATED_TEMPLATE-SESSION-START)**

### **🎯 Was ist das?**
- **Ausfüllbare Vorlage** für strukturierte Session-Vorbereitung
- **Pro Individual-Session kopieren** und Platzhalter ersetzen
- Definiert **Checklisten + Kontext** für DIESE konkrete Session
- **Dokumentation der Session** für zukünftige Referenz

### **📂 Dateipfad:**
```
docs/06-handbook/TEMPLATE/VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md
↳ Wird KOPIERT zu: [SESSION_TYP]-[DATUM]-[KÜRZEL].md oder lokal
↳ Gilt für: DIESE konkrete Session mit konkretem Task
```

### **🔑 Schlüsselinhalte (LAYER 3):**

| Sektion | Inhalt | Beispiel |
|:--|:--|:--|
| **Session Info** | Metadata dieser Session | Datum, Typ, Ziel, Bereiche |
| **Pre-Session Checklist** | Was abhaken vor Start? | Terminals geschlossen, Docs gelesen |
| **File Backup Protocol** | Wie Backups erstellen? | .backup extension, Copy-Item Command |
| **Session Scope** | Was ändern wir? | Affected files, tables, migrations |
| **Technical Context** | Technische Details? | Migration version, Dependencies |
| **Goals & Outcomes** | Was soll rauskommen? | Expected results, success criteria |
| **Risk Assessment** | Was kann schiefgehen? | Potential issues, mitigation |
| **Validation Plan** | Wie validieren wir? | Tests, Scripts, Checks |
| **Session Log** | Was haben wir getan? | Executed commands, decisions |
| **Lessons Learned** | Was haben wir gelernt? | Issues, Solutions, Future prevention |

### **✅ Merkmale LAYER 3:**

- ✅ **Session-Spezifisch** - Pro Task/Session einzigartig
- ✅ **Ausfüllbar** - Platzhalter [ERSETZEN]
- ✅ **Kopierbar** - Duplicate und anpassen
- ✅ **Dokumentierbar** - Session wird protokolliert
- ✅ **Referenceable** - Zukünftige Sessions lernen davon
- ✅ **Hierarchie-Unten** - Nutzt Layer 1+2 als Basis

### **🔗 Referenzen in LAYER 3:**
```markdown
→ Basiert auf: LAYER 2 - SESSION BRIEFING Checklisten
→ Enforces: LAYER 1 - copilot-instructions.md Rules
→ Speichert als: [SESSION_NAME]-2025-11-03.md in docs/08-batch/sessions/
```

---

## 🔄 **ZUSAMMENSPIEL DER DREI LAYER**

```
┌────────────────────────────────────────────────────────────────┐
│ NEW SESSION STARTS                                              │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│ LAYER 1: KI liest automatisch copilot-instructions.md          │
│          → "Projektregeln, Critical Fixes, Patterns"           │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│ LAYER 2: KI erkennt Task-Typ und wählt Briefing-Variante      │
│          → "Development? DB? UI? Theme? Release?"              │
│          → Kopiert relevante Checklisten                       │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│ LAYER 3: KI + Developer kopieren SESSION-START Template       │
│          → Füllen Platzhalter aus: Datum, Ziel, Scope         │
│          → Abhaken der Checklisten                            │
│          → Speichern für Session-Dokumentation                │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│ SESSION EXECUTION                                               │
│ ├─ Befolgt Layer 1 Guidelines                                  │
│ ├─ Nutzt Layer 2 Checklisten                                   │
│ └─ Dokumentiert in Layer 3 Template                            │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│ SESSION-END: Layer 3 Template aktualisiert                     │
│ → "Lessons Learned" hinzufügt                                  │
│ → COMPLETED_IMPL oder SOLVED_FIX Document erstellt            │
│ → Zukünftige Sessions lernen davon                            │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **PRAKTISCHES BEISPIEL: Theme-Development Session**

### **Szenario: Neue Theme-Farbe hinzufügen**

#### **LAYER 1: Global Instructions (Kopilot liest automatisch)**
```
Regeln die IMMER gelten:
✅ DatabaseThemeService nutzen (nicht direkte DB-Access)
✅ Field-Mapper für SQL-Queries
✅ Migration 027 Schema-Validierung
❌ Hardcoded Theme-Farben in Components
❌ Bypass von DatabaseThemeService
```

#### **LAYER 2: Session Briefing (Theme-Variante)**
```
THEME-SPECIFIC BRIEFING:
1. Lese: CRITICAL-FIXES (FIX-016, FIX-017, FIX-018!)
2. Lese: VALIDATED_REFERENCE-PROJECT-CORE-RULES
3. Spezifisch: DatabaseThemeService Patterns
4. Spezifisch: Per-Mode Configuration System
5. Spezifisch: Central Configuration Architecture

Pre-Session Checklist:
- [ ] FIX-016/017/018 verstanden
- [ ] Migration 027 validiert
- [ ] DatabaseThemeService verfügbar
```

#### **LAYER 3: Session-Start Template (Ausgefüllt für THIS Task)**
```
Session Info:
- Typ: Theme-Development
- Ziel: Neue Farbe "primary-accent" hinzufügen
- Affected Files: 
  * src/main/services/DatabaseThemeService.ts
  * src/renderer/contexts/DatabaseThemeManager.tsx
  * 03-data/migrations/ (neue Migration falls erforderlich)

Pre-Session Checklist:
- [x] Terminals geschlossen
- [x] Critical Fixes gelesen
- [x] Theme System docs reviewed
- [x] backup vor Änderungen plan: .backup extension

Session Scope:
- DatabaseThemeService: Add "primary-accent" color support
- Migration: Insert new color into theme_colors table
- Validation: pnpm validate:critical-fixes

Lessons Learned:
- [WIRD WÄHREND SESSION GEFÜLLT]
```

---

## 🚫 **HÄUFIGE FEHLER BEI LAYER-SYSTEM**

| Fehler | Folge | Lösung |
|:--|:--|:--|
| Layer 1 ignorieren | Sessions Kill-Patterns brechen | Layer 1 ZWINGEND vor Code |
| Layer 2 überspringen | Irrelevante Checklisten | Layer 2 = Task-Typ-Briefing |
| Layer 3 nicht ausfüllen | Session undokumentiert | Layer 3 = Protokoll dieser Session |
| Layer-Reihenfolge falsch | Kontext fehlt | IMMER: Layer 1 → 2 → 3 |
| Alte Templates verwenden | Outdated Guidelines | IMMER aktuelle Versionen |

---

## ✅ **VALIDATION CHECKLIST - Layer System Compliance**

- [ ] **Layer 1 Present:** copilot-instructions.md existiert + aktuell
- [ ] **Layer 2 Present:** KI-SESSION-BRIEFING.prompt.md mit 7 Varianten
- [ ] **Layer 3 Present:** VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md
- [ ] **Layer 1 Content:** Critical-Fixes, Patterns, Rules vollständig
- [ ] **Layer 2 Content:** Development/DB/UI/Release/Theme/Debug Varianten
- [ ] **Layer 3 Content:** 10+ Ausfüllbar Sektionen
- [ ] **Layer Linking:** Alle Layer referenzieren sich korrekt
- [ ] **KI-AUTO-DETECTION:** Alle Dokumente mit KI-AUTO-DETECTION SYSTEM
- [ ] **Präfix-System:** VALIDATED_/ROOT_VALIDATED_ Präfixe korrekt
- [ ] **Date Headers:** Alle mit Erstellungs- + Update-Datum

---

## 📚 **VERWANDTE DOKUMENTATION**

- [copilot-instructions.md](.github/instructions/copilot-instructions.md) - **Layer 1: Global**
- [KI-SESSION-BRIEFING.prompt.md](.github/prompts/KI-SESSION-BRIEFING.prompt.md) - **Layer 2: Session-Typ**
- [VALIDATED_TEMPLATE-SESSION-START](../TEMPLATE/VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md) - **Layer 3: Individual**
- [VALIDATED_REFERENCE-CRITICAL-FIXES](VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md) - **Referenced by all layers**
- [VALIDATED_REFERENCE-PROJECT-CORE-RULES](VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md) - **Layer 1 Core**
- [VALIDATED_REFERENCE-KI-TEMPLATE-QUICKREF](VALIDATED_REFERENCE-KI-TEMPLATE-QUICKREF_2025-11-03.md) - **Quick Reference Guide**

---

**📍 Location:** `docs/06-handbook/REFERENCE/VALIDATED_REFERENCE-KI-TEMPLATE-SYSTEM-ARCHITECTURE_2025-11-03.md`  
**Purpose:** Comprehensive documentation of three-layer KI template system integration  
**Access:** 06-handbook reference system  
**Status:** Production Ready, fully integrated with KI-AUTO-DETECTION SYSTEM

*Erstellt: 03.11.2025 - Complete Three-Layer Architecture Documentation*
