# 🤖 KI-Präfix-Erkennungs-Regeln (Semantic Metadata Recognition)

> **Status:** VALIDATED ✅  
> $12025-10-17**Ziel:** Der KI-Kontext erkennt Dokumentstatus, Thema und Qualität allein anhand des Dateinamens.  
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

Diese Präfixe sind **verbindlich** für alle Dateien in `docs/` und **alle KI-gestützten Sessions** (Copilot, ChatGPT, Claude).

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: VALIDATED_GUIDE-KI-PREFIX-RECOGNITION-RULES-2025-10-15.md
```

### **STATUS-PRÄFIXE:**
- `VALIDATED_` - Validierte, stabile Dokumentation (verlässliche Quelle)
- `SOLVED_` - Gelöste Probleme und Fixes (fertige Lösung)
- `LESSON_` - Lessons Learned und Debugging (vergleichende Analyse)
- `WIP_` - Work in Progress (nur Orientierung)
- `COMPLETED_` - Abgeschlossene Implementierungen (fertige Reports)
- `PLAN_` - Planungsdokumente und Roadmaps (Entwurfsstatus)
- `KNOWLEDGE_ONLY_` - Historische Debug-Insights ohne aktuellen Code (nur Konzepte)
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

---

## 🏷️ Präfix-System (Statuskennung)

| Präfix | Bedeutung | KI-Verhalten |
|:--|:--|:--|
| `VALIDATED_` | Inhalt geprüft & freigegeben | KI behandelt als **verlässliche Quelle** |
| `SOLVED_` | Problem vollständig gelöst & getestet | KI darf Inhalte als **fertige Lösung** referenzieren |
| `DEPRECATED-YYYY-MM-DD_` | Veraltet, ersetzt durch Neues | KI **ignoriert aktiv**, nur zur Historie |
| `WIP_` | Work in Progress | KI liest zur Orientierung, **nicht zitieren** |
| `PLAN_` | Konzept/Planung | KI darf zitieren, aber mit „Entwurfsstatus" kennzeichnen |
| `LESSON_` | Erfahrungsbericht/Lesson Learned | KI nutzt für **vergleichende Analyse** |
| `KNOWLEDGE_ONLY_` | Historische Debug-Insights (veralteter Code) | KI nutzt **nur Konzepte**, niemals Code-Beispiele |

---

## 🧭 Semantic Topic Tags (Themenzuordnung)

KI erkennt Themen anhand des folgenden Musters im Dateinamen:  
`[STATUSPREFIX]-[YYYY-MM-DD]_[TOPICGROUP]-[DETAILS].md`

**Themenkürzel (TopicGroup):**

| Kürzel | Bereich | Zuordnung |
|:--|:--|:--|
| `CORE-` | Architektur, Standards, Security, IPC | docs/01-core |
| `DEV-` | Development, Build, Testing | docs/02-dev |
| `DATA-` | Database, Migration, Schema | docs/03-data |
| `UI-` | UI, UX, PDF | docs/04-ui |
| `DEPLOY-` | Deployment, Updater | docs/05-deploy |
| `LESSON-` | Lessons Learned, Retrospektiven | docs/06-lessons |
| `META-` | KI-Regeln, Projektvorgaben | docs/00-meta |

**Beispiele:**
```
VALIDATED-2025-10-20_CORE-SQLITE-MIGRATION-STRATEGY.md
SOLVED-2025-10-15_UI-CURRENCY-FORMATTING.md
WIP_DEV-PDF-GENERATION-REFACTOR.md
LESSON-2025-10-10-DB-SCHEMA-MIGRATION-PITFALLS.md
```

---

## 🧠 KI-Verhalten bei der Doku-Navigation

### ✅ KI soll:
* Bei Fragen nach Architektur, Standards oder Cross-Referenzen automatisch die *VALIDATED/SOLVED*-Dokumente durchsuchen
* Bei widersprüchlichen Inhalten die *neueste Validated-Datei* bevorzugen
* Die `VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md` als Inhaltsverzeichnis verwenden
* Topic-Tags zur schnellen Themenfindung nutzen
* Datum im Präfix für Aktualitätsbewertung verwenden

### ⚠️ KI darf:
* „WIP" oder „Plan" nur zur Orientierung, nicht als Fakt verwenden
* Bei PLAN_-Dokumenten den Entwurfsstatus explizit erwähnen

### ❌ KI darf nicht:
* Aus `DEPRECATED-`-Dokumenten ableiten, außer bei Historienfragen
* WIP-Inhalte als verlässliche Quellen zitieren
* Veraltete Dokumente ohne Deprecation-Check verwenden

---

## 📋 KI-Erkennungstest

**Test-Prompt für jede Session:**
```text
Analysiere den Dateinamen „SOLVED-2025-10-15_UI-CURRENCY-FORMATTING.md".
Antworte mit: Thema, Status, Quelle, Priorität.
```

**Erwartete Antwort:**
```
Thema: UI/PDF-Currency Formatting
Status: SOLVED (final fix implemented)
Quelle: docs/04-ui/final
Priorität: höchste (fertige Lösung)
```

---

## 🔗 Integration

### Einbindung in KI-Sessions:
1. **Primär:** In `docs/00-meta/final/VALIDATED-2025-10-15_INSTRUCTIONS-KI.md`
2. **Copilot:** Kurzversion in `.github/instructions/copilot-instructions.md`
3. **Session-Briefing:** Referenz in `.github/prompts/KI-SESSION-BRIEFING.prompt.md`
4. **Navigation:** Übersicht in `docs/VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md`

### Status-Workflow:
```
Dokument erstellt → WIP_ → PLAN_ → VALIDATED- → SOLVED- → (ggf.) DEPRECATED-
```

---

**Hinweis:** Diese Regeln sind verbindlich für alle KI-gestützten Sessions. Jede KI muss sie **vor der ersten Dateizuordnung** lesen und intern speichern.
