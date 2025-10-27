# 🔄 STATUS-PRÄFIX MIGRATION PROMPT

> **Purpose:** Standardisierter Prompt für die Migration aller docs/ Ordner zu STATUS-PRÄFIX Struktur  
> **Usage:** Nach jedem Ordner verwenden für konsistente KI-PRÄFIX-ERKENNUNGSREGELN Implementierung  
> **Schema:** Vollständige Migration von Legacy-Struktur zu STATUS-PRÄFIX Ordnern

## 📋 **MIGRATION PROMPT (Copy & Paste Ready)**

```
Follow instructions in [KI-PRÄFIX-ERKENNUNGSREGELN.prompt.md](file:///c%3A/Users/ramon/Desktop/RawaLite/.github/prompts/KI-PR%C3%84FIX-ERKENNUNGSREGELN.prompt.md).

Führe folgende STATUS-PRÄFIX Migration für [ORDNER-NAME] durch:

1. **STATUS-PRÄFIX UNTERORDNER ERSTELLEN:**
   - Erstelle alle STATUS-PRÄFIX Unterordner (AUSSER ROOT_)
   - VALIDATED/, SOLVED/, LESSON/, KNOWLEDGE_ONLY/, WIP/, COMPLETED/, PLAN/, DEPRECATED/

2. **DATEIEN VERSCHIEBEN:**
   - Verschiebe alle Dateien nach STATUS-PRÄFIX in entsprechende Unterordner
   - Analysiere Dateinamen für korrekte STATUS-PRÄFIX Zuordnung

3. **LEGACY-ORDNER BEREINIGEN:**
   - Entferne leere Legacy-Ordner (final/, plan/, sessions/, wip/, etc.)

4. **INDEX.md AKTUALISIEREN:**
   - Aktualisiere INDEX.md mit neuer STATUS-PRÄFIX Struktur
   - Dokumentiere Dateiverteilung pro STATUS-PRÄFIX Ordner
   - Ergänze KI-PRÄFIX-ERKENNUNGSREGELN Integration
   - Aktualisiere Cross-References mit anderen docs/ Ordnern

5. **VERIFIZIERUNG:**
   - Liste finale Ordnerstruktur auf
   - Bestätige 100% KI-PRÄFIX-ERKENNUNGSREGELN Konformität
```

## 🎯 **ORDNER-SPEZIFISCHE ANPASSUNGEN**

### **Erwartete STATUS-PRÄFIX Verteilung pro Ordner:**

| **Ordner** | **Primäre STATUS-PRÄFIXE** | **Sekundäre STATUS-PRÄFIXE** |
|:--|:--|:--|
| `01-core/` | VALIDATED, SOLVED | COMPLETED, LESSON |
| `02-dev/` | WIP, LESSON | VALIDATED, SOLVED |
| `03-data/` | COMPLETED, VALIDATED | SOLVED, PLAN |
| `04-ui/` | PLAN, COMPLETED | VALIDATED, WIP |
| `05-deploy/` | SOLVED, VALIDATED | COMPLETED, PLAN |
| `06-lessons/` | LESSON | KNOWLEDGE_ONLY, DEPRECATED |
| `08-batch/` | PLAN, WIP | COMPLETED, VALIDATED |
| `09-archive/` | DEPRECATED, KNOWLEDGE_ONLY | LESSON |

## 🔧 **TEMPLATE: INDEX.md STRUKTUR**

```markdown
# [ORDNER-NUMMER]-[ORDNER-NAME] - [Beschreibung]

> **Purpose:** [Ordner-spezifischer Zweck]  
> **Last Updated:** 2025-10-26 (STATUS-PRÄFIX Migration Complete)  
> **Status:** ✅ ACTIVE | **Validation Status:** 100% KI-PRÄFIX-ERKENNUNGSREGELN konform

## 📁 **STATUS-PRÄFIX Folder Structure**

### **📂 VALIDATED/** - [Anzahl] Dokumente
- [Liste der VALIDATED Dokumente]

### **📂 SOLVED/** - [Anzahl] Dokumente  
- [Liste der SOLVED Dokumente]

### **📂 COMPLETED/** - [Anzahl] Dokumente
- [Liste der COMPLETED Dokumente]

### **📂 LESSON/** - [Anzahl] Dokumente
- [Liste der LESSON Dokumente]

### **📂 WIP/** - [Anzahl] Dokumente
- [Liste der WIP Dokumente]

### **📂 PLAN/** - [Anzahl] Dokumente
- [Liste der PLAN Dokumente]

### **📂 KNOWLEDGE_ONLY/** - [Anzahl] Dokumente
- [Liste der KNOWLEDGE_ONLY Dokumente]

### **📂 DEPRECATED/** - [Anzahl] Dokumente
- [Liste der DEPRECATED Dokumente]

---

## 🧠 **KI-PRÄFIX-ERKENNUNGSREGELN Integration**

**STATUS-PRÄFIX Hierarchie für [ORDNER-NAME]:**
```
ROOT_VALIDATED (im /docs Root) > VALIDATED > SOLVED > COMPLETED > KNOWLEDGE_ONLY > PLAN > WIP > LESSON
(DEPRECATED = ignorieren)
```

**KI-Verhalten:**
- **VALIDATED/**: KI behandelt als verlässliche [THEMA]-Quelle
- **SOLVED/**: KI referenziert als fertige [THEMA]-Lösung
- **COMPLETED/**: KI nutzt für abgeschlossene [THEMA]-Reports
- **LESSON/**: KI nutzt für vergleichende [THEMA]-Analyse
- **WIP/**: KI liest zur Orientierung, nicht zitieren
- **PLAN/**: KI zitiert mit Entwurfsstatus-Kennzeichnung
- **KNOWLEDGE_ONLY/**: KI nutzt für historische [THEMA]-Referenz mit Verifikation
- **DEPRECATED/**: KI ignoriert aktiv

---

## 🔗 **Cross-References (STATUS-PRÄFIX konform)**

> **Related Documentation Folders:**
> - **[00-meta/](../00-meta/)** - Meta-documentation (VALIDATED/SOLVED structure)
> - **[Other relevant folders]** - [Beschreibung] ([Expected STATUS-PRÄFIX] structure)

---

**File Count:** [X] VALIDATED, [Y] SOLVED, [Z] COMPLETED, etc. = [TOTAL] total files  
**Migration Date:** 2025-10-26  
**Structure:** STATUS-PRÄFIX optimierte KI-Navigation  
**Schema Compliance:** 100% KI-PRÄFIX-ERKENNUNGSREGELN konform
```

## 🚀 **USAGE INSTRUCTIONS**

1. **Copy Prompt:** Kopiere den Migration Prompt oben
2. **Replace [ORDNER-NAME]:** Ersetze mit aktuellem Ordner (z.B. "01-core")
3. **Execute:** Führe Migration durch
4. **Verify:** Bestätige 100% KI-PRÄFIX-ERKENNUNGSREGELN Konformität
5. **Next Folder:** Wiederhole für nächsten Ordner

**Reihenfolge:** 01-core → 02-dev → 03-data → 04-ui → 05-deploy → 06-lessons → 08-batch → 09-archive

---

**🧠 KI RECOGNITION:** Dieser Prompt standardisiert die STATUS-PRÄFIX Migration für optimale KI-Navigation.