# 📋 RawaLite Dokumentations-Schema - Quick Reference

> **Erstellt:** 06.11.2025 | **Letzte Aktualisierung:** 06.11.2025 (Moved to docs/ with schema)  
> **Status:** Production Ready | **Typ:** REGISTRY - Documentation Schema Summary  
> **Schema:** `VALIDATED_REGISTRY-DOCUMENTATION-SCHEMA-SUMMARY_2025-11-06.md` ✅ **SCHEMA-COMPLIANT**

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Production Ready (automatisch durch "VALIDATED_REGISTRY" erkannt)
> - **TEMPLATE-QUELLE:** ROOT_VALIDATED_REGISTRY Template System
> - **AUTO-UPDATE:** Bei Schema-Änderung automatisch diese Quick-Reference aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "VALIDATED_REGISTRY", "Documentation Schema Summary"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = Production Ready:**
> - ✅ **Schema-Registry** - Verlässliche Quelle für Dokumentations-Standards
> - ✅ **Quick-Reference** - Authoritative Kurzfassung aller wichtigen Vorgaben
> - 🎯 **AUTO-REFERENCE:** Bei Dokumentations-Fragen zuerst diese Registry nutzen
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "SCHEMA MISMATCH" → Diese Registry konsultieren

> **⚠️ SCHEMA STATUS:** 9 Status-Präfixe + 8 Typ-Kategorien + 8 Ordner-Struktur aktiv (06.11.2025)  
> **Quality Level:** 92.3% Schema Compliance (Excellent - Production Ready)  
> **Template Integration:** KI-SESSION-BRIEFING mandatory vor neuen Dokumentationen  
> **Critical Function:** Quick-Reference für alle Dokumentations-Standards

---

## 🎯 **KERN-SCHEMA (Verbindlich für ALLE Dokumente)**

### **Datei-Namenskonvention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

✅ RICHTIG:   COMPLETED_IMPL-DEVPROD-DATABASE-SEPARATION_2025-11-06.md
❌ FALSCH:    database-guide.md
❌ FALSCH:    PHASE2_DEV_TESTING_GUIDE.md (kein Präfix!)
```

---

## 📊 **STATUS-PRÄFIXE (Priorität Absteigend)**

| Präfix | Priorität | Bedeutung | KI-Verhalten | Verwendung |
|:--|:--|:--|:--|:--|
| `ROOT_` | 🔴 **HÖCHSTE** | KI-kritisch, immer im /docs Root | **NIEMALS verschieben** | Session-kritische Systeme |
| `VALIDATED_` | 🟠 **HOCH** | Validierte, stabile Quelle | **Verlässliche Referenz** | Produktionsreife Dokumentation |
| `SOLVED_` | 🟠 **HOCH** | Fertige Lösung & Fix | **Implementierungsbereit** | Problemlösungs-Dokumentation |
| `COMPLETED_` | 🟡 **MEDIUM** | Abgeschlossene Implementation | **Vollständiger Report** | Fertige Features & Sessions |
| `KNOWLEDGE_ONLY_` | 🟡 **MEDIUM** | Historisches Archiv | **Historische Referenz** | Archive & Legacy-Knowledge |
| `LESSON_` | 🟡 **MEDIUM** | Lessons Learned & Debug | **Vergleichende Analyse** | Debugging & Erfahrungsberichte |
| `PLAN_` | 🟢 **LOW** | Planungsdokument | **Entwurfsstatus** | Zukünftige Arbeiten |
| `WIP_` | 🟢 **LOW** | Work in Progress | **Nur Orientierung** | Laufende Entwicklung |
| `DEPRECATED_` | ⚫ **IGNORE** | Veraltet & ersetzt | **Ignorieren** | Alte/ersetzte Versionen |

---

## 🏷️ **TYP-KATEGORIEN (8 Typen)**

| Kürzel | Verwendung | Beispiele | Ordner |
|:--|:--|:--|:--|
| `GUIDE-` | Leitfäden & Anleitungen | Implementierungs-Guidelines, Standards | 01-core, 02-dev |
| `FIX-` | Debugging & Fixes | Bug-Fixes, Debug-Sessions, Lessons | 01-core, 02-dev, 09-archive |
| `IMPL-` | Implementierungen | Feature-Implementierungen, Completion | 01-core, 02-dev, 03-data |
| `REPORT-` | Berichte & Analysen | Session-Reports, Analysen, Status | 02-dev, 08-batch |
| `REGISTRY-` | Listen & Collections | Sammlungen, Overviews, Inventar | docs/ ROOT, 06-handbook |
| `TEMPLATE-` | Vorlagen | Copy&Paste Templates für KI | 06-handbook/TEMPLATE/ |
| `TRACKING-` | Status-Tracking | Fortschritt-Tracking, Metriken | 02-dev, 08-batch |
| `PLAN-` | Planungsdokumente | Roadmaps, Strategien, Entwürfe | 02-dev, PLAN Ordner |

---

## 📁 **ORDNERSTRUKTUR (8 Bereiche + ROOT + Archive)**

```
docs/
├── ROOT (GESCHÜTZT):
│   ├── ROOT_VALIDATED_*.md        (KI-kritische Dokumente - NIEMALS verschieben!)
│   ├── VALIDATED_REGISTRY-*.md    (Zentrale Registries)
│   └── INDEX.md                   (Diese Navigationshub)
│
├── 00-meta/                       Meta-Dokumentation, Projekt-Management
├── 01-core/                       Kern-Architektur, Testing, Standards  
├── 02-dev/                        Development Workflows, Debugging, Implementation
├── 03-data/                       Database Design, Migrations, Schemas
├── 04-ui/                         UI Design, Components, PDF, Theme System
├── 05-deploy/                     Deployment, Updates, Distribution, CI/CD
├── 06-handbook/                   Templates, References, Anti-Patterns (KI-HANDBOOK)
│   ├── TEMPLATE/                  (KI-SESSION Templates - MANDATORY USE)
│   ├── REFERENCE/                 (Database Schema, Project Core Rules)
│   ├── ANTIPATTERN/               (Session-Killer Prevention)
│   └── ISSUES/                    (Known Problems, Bug Tracking)
│
├── 08-batch/                      Batch Operations, Session Reports
└── 09-archive/                    Deprecated & Historical Content
```

### **Pro Standard-Ordner (z.B. 02-dev/):**
```
02-dev/
├── INDEX.md
├── VALIDATED/                     (Validierte, produktionsreife Inhalte)
├── COMPLETED/                     (Abgeschlossene Implementierungen)
├── SOLVED/                        (Gelöste Probleme & Fixes)
├── LESSON/                        (Lessons Learned & Debugging)
├── KNOWLEDGE_ONLY/               (Historische Archive)
├── WIP/                           (Work in Progress)
├── PLAN/                          (Planungsdokumente)
└── DEPRECATED/                   (Veraltete Inhalte)
```

---

## ✅ **OBLIGATORISCHE METADATA (Dokument-Header)**

Jedes neue Dokument **MUSS** diesen Header haben:

```markdown
> **Erstellt:** DD.MM.YYYY | **Letzte Aktualisierung:** DD.MM.YYYY (Grund)  
> **Status:** Production Ready | **Typ:** REGISTRY/GUIDE/FIX/IMPL/REPORT/TEMPLATE/TRACKING/PLAN  
> **Schema:** `[DATEINAME]` ✅ SCHEMA-COMPLIANT

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** [STATUS] (automatisch erkannt)
> - **TEMPLATE-QUELLE:** [ORDNER] KI-Instructions Template
> - **AUTO-UPDATE:** Bei [TRIGGER] automatisch [ACTION]
> - **STATUS-KEYWORDS:** Erkannt durch "[KEYWORDS]"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> - ✅ [RULE-1]
> - ✅ [RULE-2]
> - 🎯 [RULE-3]
> - 🔄 [RULE-4]

> **⚠️ [TOPIC] STATUS:** [Description] (DD.MM.YYYY)  
> **[Key Info]:** [Details]  
> **Template Integration:** [Template requirements]  
> **Critical Function:** [Why important]
```

---

## 🎓 **BEST PRACTICES**

### **✅ WAS RICHTIG IST:**
- ✅ Dateinamen mit STATUS-PRÄFIX + TYP + SUBJECT + DATUM
- ✅ Obligatorisches Datum im Header (DD.MM.YYYY Format)
- ✅ Vollständiges KI-AUTO-DETECTION SYSTEM Metadata
- ✅ Dokumente in korrektem Thema-Ordner nach Inhalt
- ✅ Cross-References zu verwandten Dokumenten
- ✅ ROOT_ Dokumente NIEMALS verschieben/umbenennen
- ✅ VALIDATED_/SOLVED_ für produktionsreife Inhalte
- ✅ KNOWLEDGE_ONLY_ für Archiv-Inhalte
- ✅ LESSON_/SOLVED_ für Debugging-Dokumentation

### **❌ WAS VERBOTEN IST:**
- ❌ Keine oder falsche Präfixe (z.B. `database-guide.md`)
- ❌ Falscher Ordner (z.B. UI in 03-data/)
- ❌ Kein Datum im Header
- ❌ ROOT_ oder VALIDATED_ Dokumente verschieben
- ❌ Kein KI-AUTO-DETECTION SYSTEM im Header
- ❌ Duplicate Content ohne klare Status-Unterscheidung
- ❌ DEPRECATED_ Inhalte ohne Archivierung
- ❌ Schema-Namen ohne Datum
- ❌ Sonderzeichen oder Leerzeichen in Dateinamen

---

## 🔍 **VALIDATION CHECKLIST für NEUE Dokumente**

```bash
# VOR jedem Commit einer neuen Dokumentation prüfen:
- [ ] Dateiname folgt Schema: [PREFIX]_[TYP]-[SUBJECT]_YYYY-MM-DD.md
- [ ] PREFIX aus 9 Status-Präfixen gewählt (ROOT_, VALIDATED_, SOLVED_, etc.)
- [ ] TYP aus 8 Typ-Kategorien gewählt (GUIDE-, FIX-, IMPL-, etc.)
- [ ] Ordner-Platzierung korrekt (00-meta bis 08-batch, nicht 09-archive bei NEU)
- [ ] Metadata-Header vollständig (Erstellt, Aktualisierung, Status, Typ)
- [ ] KI-AUTO-DETECTION SYSTEM Block vorhanden
- [ ] KI-VERHALTENSREGELN Block vorhanden (mindestens 4 Regeln)
- [ ] Keine Duplikate in anderen Ordnern (semantic search durchgeführt!)
- [ ] Cross-References aktuell (bei Referenzen zu anderen Docs)
- [ ] Status-Präfix passt zum Inhalt (COMPLETED vs WIP, VALIDATED vs PLAN)
- [ ] Datum Format korrekt (DD.MM.YYYY)
- [ ] Root-Level Dokument? → ROOT_VALIDATED_ Präfix verwenden
- [ ] Session/Batch-Report? → COMPLETED_REPORT Präfix verwenden
```

---

## 📚 **VERWANDTE DOKUMENTATION**

**ROOT Documents (KI-KRITISCH):**
- [ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-20.md](ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-20.md) - Master Sitemap & Navigation
- [ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - Entwicklungsregeln & Patterns

**Prompt-Instructions (.github/prompts/):**
- [../.github/prompts/KI-PRÄFIX-ERKENNUNGSREGELN.prompt.md](../.github/prompts/KI-PRÄFIX-ERKENNUNGSREGELN.prompt.md) - Semantic Recognition Rules
- [../.github/prompts/KI-SESSION-BRIEFING.prompt.md](../.github/prompts/KI-SESSION-BRIEFING.prompt.md) - Session-Start Template

**Handbook (06-handbook/):**
- [06-handbook/TEMPLATE/VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md](06-handbook/TEMPLATE/) - Session-Start Template
- [06-handbook/REFERENCE/VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md](06-handbook/REFERENCE/) - Project Core Rules

---

## 📊 **HÄUFIGE FEHLER & LÖSUNGEN**

| Problem | Falsch | Richtig | Grund |
|:--|:--|:--|:--|
| Kein Präfix | `database-guide.md` | `VALIDATED_GUIDE-DATABASE-SYSTEM_2025-11-06.md` | KI-Auto-Detection braucht Präfix |
| Falsches Präfix | `VALIDATED_PHASE2_DEV_TESTING.md` | `COMPLETED_REPORT-PHASE2-DEV-TESTING_2025-11-06.md` | PHASE-Docs sind abgeschlossen, nicht validiert |
| Falscher Ordner | `docs/04-ui/database-schema.md` | `docs/03-data/VALIDATED/...` | Schema gehört zu Database, nicht UI |
| Kein Datum | `VALIDATED_GUIDE-KI-INSTRUCTIONS.md` | `VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-11-06.md` | Datum für Versioning essentiell |
| ROOT verschieben | `docs/02-dev/ROOT_REGISTRY.md` | `docs/ROOT_REGISTRY.md` | ROOT_ NIEMALS in Subordner |
| Leere Metadata | Nur Dateiname | Header mit KI-AUTO-DETECTION | KI-Session erkennt Status nur mit Header |

---

## 🚀 **NÄCHSTE SCHRITTE**

1. **Neue Dokumentation schreiben:**
   - Verwende Naming-Schema: `[PREFIX]_[TYP]-[SUBJECT]_YYYY-MM-DD.md`
   - Kopiere obligatorischen Header aus dieser Registry
   - Wähle korrekten STATUS-PRÄFIX & TYP-KATEGORIE

2. **Bestehende Dokumentation aktualisieren:**
   - Prüfe Präfix-Compliance
   - Prüfe Ordner-Platzierung
   - Aktualisiere Datum im Header

3. **Root-Cleanup durchführen:**
   - Phase-Dokumente mit PREFIX versehen
   - Nach `docs/02-dev/COMPLETED/` verschieben
   - Log-Dateien archivieren/löschen

---

**📍 Referenz:** ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-20.md  
**Status:** SCHEMA REFERENCE ESTABLISHED ✅  
**Location:** docs/VALIDATED_REGISTRY-DOCUMENTATION-SCHEMA-SUMMARY_2025-11-06.md  
**Purpose:** Quick-Reference für alle Dokumentations-Standards  
**Updated:** 06.11.2025 - Integrated from root with schema compliance
