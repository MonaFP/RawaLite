## 📘 **`DOCUMENTATION-RESTRUCTURING-PLAN-v2.md`**

> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-AUTO-DETECTION SYSTEM Integration)  
> **Status:** DEPRECATED - Ersetzt durch ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION | **Typ:** Plan - Documentation Restructuring V2  
> **Schema:** `DEPRECATED_PLAN-DOCUMENTATION-RESTRUCTURING-V2-2025-10-15.md` ✅ **SCHEMA-COMPLIANT**  

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** DEPRECATED - Obsolete (automatisch durch "DEPRECATED_PLAN", "Restructuring V2" erkannt)
> - **TEMPLATE-QUELLE:** DEPRECATED Template
> - **AUTO-UPDATE:** Bei Documentation-Struktur-Fragen automatisch auf aktuelle Navigation verweisen
> - **STATUS-KEYWORDS:** Erkannt durch "DEPRECATED", "Documentation Restructuring", "V2"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **❌ STATUS = DEPRECATED:**
> - ❌ **ACTIVE IGNORE** - Nicht für aktuelle Implementierung verwenden
> - 📖 **HISTORICAL ONLY** - Nur für Verständnis alter Struktur-Entscheidungen
> - 🔄 **AUTO-REDIRECT:** Bei Struktur-Fragen auf [../../ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-20.md](../../ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-20.md) verweisen
> - ⚠️ **REPLACEMENT:** Aktuelle Documentation-Struktur in ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION

```md
# 🗂️ RawaLite Documentation Restructuring Plan (v2)

> **Ziel:** KI-optimierte, reduzierte und semantisch klar definierte Dokumentationsstruktur  
> **Autor:** MonaFP / RawaLite Dev Team  
> **Datum:** 2025-10-15  
> **Status:** Draft → VALIDATED pending review

---

## 🎯 Zielsetzung

Die aktuelle `docs/`-Struktur (15+ Ordner) ist zu detailliert für KI-Kontextverarbeitung und erschwert Zuordnung.  
Das neue Modell reduziert auf **7 Hauptkategorien**, optimiert für **semantische Suche**, **Präfix-Erkennung** und **Cross-Linking**.

---

## 🧱 Neue Struktur (Top-Level)

| Präfix | Ordner | Beschreibung |
|:--|:--|:--|
| `00-meta/` | Meta, KI-Regeln, Troubleshooting, Registry | Zentrale Richtlinien, KI-Briefings, Troubleshooting |
| `01-core/` | Standards & Architektur | Coding Standards, Architektur, Security, IPC, Paths |
| `02-dev/` | Development & Testing | Dev-Prozesse, Build, Debugging, Tests |
| `03-data/` | Database & Persistenz | Schema, Field-Mapping, Migrations, Nummernkreise |
| `04-ui/` | UI & PDF | Komponenten, UX, Layout, PDF, Visualisierung |
| `05-deploy/` | Deployment & Update-System | Updater, Installer, Distribution, Auto-Update |
| `06-lessons/` | Retros & Sessions | Lessons Learned, Solved, Validated, Session Summaries |

---

## 📂 Einheitliche Unterstruktur

Jeder Hauptordner enthält exakt diese Unterordner:

```

final/       → Freigegebene, gültige Dokumente (VALIDATED/SOLVED)
plan/        → Planungen, Entwürfe
sessions/    → Besprechungs- & Sitzungsprotokolle
wip/         → In Arbeit befindliche Doku
INDEX.md     → Kurzübersicht + Crosslinks

````

Kein Ordner enthält mehr als vier Subebenen.

---

## 🔖 Präfix-System (Status + Themenkennung)

| Präfix | Bedeutung |
|:--|:--|
| `VALIDATED_` | Dokument manuell geprüft und freigegeben |
| `SOLVED_` | Problem vollständig behoben und getestet |
| `DEPRECATED-YYYY-MM-DD_` | Obsolet, ersetzt durch Neues |
| `WIP_` | Arbeit im Gange |

Zusätzlich enthalten Dateinamen **Semantik-Tags** (KI-erkennbar):
- `UI-`, `DB-`, `CORE-`, `DEV-`, `PDF-`, `DEPLOY-`, `LESSON-` usw.  
→ z. B. `SOLVED-2025-10-15_UI-CURRENCY-FORMATTING.md`

---

## 🔄 Mapping (Alt → Neu)

| **Alt (16 Ordner)** | **Neu (9 Ordner)** | **Status** |
|:--|:--|:--|
| `00-meta/` | `00-meta/` | bleibt, nur INDEX & Registry-Review |
| `01-standards/` | `01-core/` | integriert in Standards + Architektur |
| `02-architecture/` | `01-core/` | migriert unter `final/` |
| `03-development/` | `02-dev/` | unverändert, zusammengeführt mit Testing |
| `04-testing/` | `02-dev/` | integriert |
| `05-database/` | `03-data/` | migriert 1:1 |
| `06-paths/`, `07-ipc/`, `10-security/` | `01-core/` | vereinheitlicht unter Core Architecture |
| `08-ui/`, `09-pdf/` | `04-ui/` | UI & PDF konsolidiert |
| `11-deployment/`, `12-update-manager/` | `05-deploy/` | Deployment & Updates vereint |
| `13-deprecated/` | `archive/` | archiviert |
| `14-implementations/` | `02-dev/final/` | in Implementierungsberichte integriert |
| `15-session-summary/` | `06-lessons/sessions/` | integriert in Lessons |

---

## 🔗 Crosslink-Pattern (Standard)

Jede Datei schließt mit:
```md
> **Related:** [CORE Architecture Overview](../01-core/final/ARCHITEKTUR.md)  
> **See also:** [DATA Schema Migration Plan](../03-data/plan/MIGRATION-PLAN.md)
````

---

## 🧩 KI-Erkennung – Beispiele

| Beispieldatei                                    | Bedeutung                               |
| :----------------------------------------------- | :-------------------------------------- |
| `SOLVED-2025-10-15_UI-CURRENCY-FORMATTING.md`    | Gelöstes UI/React-Formatierungsproblem  |
| `VALIDATED-2025-10-15_DB-MIGRATION-FRAMEWORK.md` | geprüfter DB-Migrationsplan             |
| `WIP_CORE-IPC-CHANNEL-STANDARDIZATION.md`        | in Arbeit befindliche IPC-Dokumentation |

---

## 🗺️ Neue INDEX.md (automatisch generiert)

```md
# Documentation Sitemap (v2)

| Bereich | Beschreibung | Letzte Änderung | Status |
|:--|:--|:--|:--|
| 00-meta | KI-Instruktionen, Registry, Troubleshooting | 2025-10-15 | ✅ Stable |
| 01-core | Coding Standards, Architektur, Security | 2025-10-15 | ⚙️ Migration |
| 02-dev | Development, Build, Tests | 2025-10-15 | ✅ Stable |
| 03-data | DB & Schema Management | 2025-10-15 | ✅ Stable |
| 04-ui | UI, UX, PDF, Visualisierung | 2025-10-15 | ✅ Stable |
| 05-deploy | Deployment & Updater | 2025-10-15 | ⚙️ Migration |
| 06-lessons | Lessons, Solved, Validated, Sessions | 2025-10-15 | 🧩 Active |
```

---

## ⚙️ Umsetzungsplan

1. **Mapping-Tabelle ausführen:**
   → Dateien mit `mv` oder `Move-Item` gemäß Tabelle verschieben
2. **Neue INDEX.md** pro Hauptordner erstellen (automatisch generierbar)
3. **INDEX.md** aus Templates regenerieren
4. **Pfad-Referenzen aktualisieren** (Crosslinks, KI-Briefings, Quick Reference)
5. **Validierung:**

   ```bash
   pnpm validate:docs-structure
   pnpm validate:links
   ```
6. **Commit + Validierung:**

   ```bash
   git add docs/
   git commit -m "docs(structure): migrate to unified 7-folder architecture (v2)"
   ```

---

## 📦 Ergebnis

✅ KI findet Themen über Präfixe, nicht mehr über tiefe Pfade
✅ Keine Duplikate oder Cross-Themen-Probleme
✅ Menschen & KI lesen dieselbe logische Struktur
✅ Vollständig rückwärtskompatibel (alte Dateien bleiben referenzierbar)

---

**Version:** 1.0 (Draft)
**Ziel-Review:** VALIDATED-2025-10-20_DOCUMENTATION-RESTRUCTURING-PLAN-v2.md

````

---

## 🤖 **Claude Prompt zur Umsetzung**

```text
SYSTEM:
Du bist ein technischer Dokumentations-Refaktor-Assistent für das Projekt RawaLite.
Deine Aufgabe ist es, die bestehende docs/ Struktur gemäß des v2-Migrationsplans umzustrukturieren.

Ziele:
- Reduziere alle bisherigen 15 Ordner auf 7 Hauptkategorien (00-meta bis 06-lessons)
- Behalte alle Dateien, benenne keine Inhalte um, nur Pfade
- Erhalte Präfixe (VALIDATED-, SOLVED-, DEPRECATED-, WIP_)
- Erstelle neue Unterordner final/, plan/, sessions/, wip/ in jedem Bereich
- Generiere neue INDEX.md pro Hauptordner (Kurzbeschreibung + Tabelle)
- Aktualisiere INDEX.md am Ende
- Erhalte bestehende Links, aktualisiere aber ihre Pfade

WICHTIG:
- Keine Inhalte verändern, nur verschieben und referenzieren
- Jede Änderung in MAPPING-Tabelle dokumentieren
- Verwende ISO-Datum (YYYY-MM-DD) in neuen Validated-Dateien
- Keine doppelten Dateien erzeugen
- Nach Abschluss: Gesamtstruktur ausgeben (tree)

INPUT:
Alle Dateien aus docs/ (aktueller Stand 2025-10-15) sind Grundlage.
Verwende MAPPING aus DOCUMENTATION-RESTRUCTURING-PLAN-v2.md.

OUTPUT:
1. Neue Ordnerstruktur (Markdown-tree)
2. Liste aller verschobenen Dateien mit altem und neuem Pfad
3. Vorschau für neue INDEX.md
4. Validierungsergebnis (fehlende oder doppelte Dateien)

ZUSÄTZLICH:
Kennzeichne Dateien, die mehrere Themen betreffen, mit Multi-Tag-Kommentar:
<!-- tags: CORE, UI --> oder <!-- tags: DATA, PDF -->
````

