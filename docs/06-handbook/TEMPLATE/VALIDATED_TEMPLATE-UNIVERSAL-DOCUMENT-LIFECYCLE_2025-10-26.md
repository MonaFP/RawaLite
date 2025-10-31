# 🔄 [PROBLEM/FEATURE NAME] - [CURRENT_STATUS]

> **Erstellt:** DD.MM.YYYY | **Letzte Aktualisierung:** 29.10.2025 (KI-AUTO-DETECTION SYSTEM Integration - CAVE-Entfernung)  
> **Status:** Production Ready | **Typ:** Template - Universal Document Lifecycle  
> **Schema:** `VALIDATED_TEMPLATE-UNIVERSAL-DOCUMENT-LIFECYCLE_2025-10-26.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Production Ready (automatisch durch "universal lifecycle template" erkannt)
> - **TEMPLATE-QUELLE:** 06-handbook TEMPLATE Universal Document Lifecycle Template
> - **AUTO-UPDATE:** Bei Document-Lifecycle-Änderung automatisch Template aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "universal lifecycle template", "Production Ready"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = Production Ready:**
> - ✅ **Lifecycle-Template** - Verlässliche Vorlage für Universal-Document-Lifecycle und Status-Management
> - ✅ **Document-Lifecycle** - Strukturiertes Template mit Status-Transition-Management
> - 🎯 **AUTO-REFERENCE:** Bei Document-Lifecycle IMMER dieses Template verwenden
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "UNIVERSAL DOCUMENT LIFECYCLE" → Template kopieren und anwenden

> **⚠️ LIFECYCLE-TEMPLATE STATUS:** Production Ready für alle Document-Lifecycle-Workflows (29.10.2025)  
> **Template Integration:** KI-SESSION-BRIEFING compatible mit Document-Lifecycle-Management  
> **Critical Function:** Strukturierte Document-Lifecycle mit vollständiger Status-Transition-Control

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** [CURRENT_STATUS] (wird automatisch durch Keywords erkannt)
> - **TEMPLATE-QUELLE:** VALIDATED_TEMPLATE-UNIVERSAL-DOCUMENT-LIFECYCLE_2025-10-26.md
> - **AUTO-UPDATE:** Bei Status-Änderung automatisch KI-Verhaltensregeln anpassen
> - **STATUS-KEYWORDS:** Erkannt durch Content-Analysis + Filename-Parsing

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **🚧 WENN STATUS = WIP:**
> - ❌ **Code ist experimentell** - NIEMALS als fertige Lösung verwenden
> - ❌ **Nur zur Orientierung** über aktuellen Entwicklungsstand
> - ⚠️ **AUTO-TRIGGER:** Bei Keywords "LÖSUNG GEFUNDEN" → Status LESSON
> - 🔄 **TEMPLATE-UPDATE:** Automatische KI-Regeln-Anpassung bei Status-Wechsel
> 
> **🎓 WENN STATUS = LESSON:**
> - ✅ **Problem-Patterns** für vergleichende Analyse nutzen
> - ⚠️ **Code-Beispiele** nur als Debugging-Referenz, nicht kopieren
> - 🔍 **PFLICHT:** Vor Code-Verwendung aktuelle Implementierung validieren
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "✅ ABGESCHLOSSEN" → Status SOLVED
> 
> **🎯 WENN STATUS = SOLVED:**
> - ✅ **Architektur-Patterns** als verlässliche Referenz nutzen
> - ✅ **Problem-Kontext** für vergleichende Analyse verwenden
> - ❌ **NIEMALS Code 1:1 kopieren** ohne aktuelle Implementierung zu prüfen
> - ⚠️ **PFLICHT:** Vor jeder Code-Verwendung grep_search + Validierung
> - 📋 **STATUS FINAL:** Keine weiteren Auto-Transitions
> 
> **📚 WENN STATUS = VALIDATED:**
> - ✅ **Verlässliche Architektur-Referenz** für Implementierung
> - ✅ **Code-Patterns** können nach Validierung verwendet werden
> - ⚠️ **EMPFOHLEN:** Aktuelle Implementierung prüfen vor Code-Übernahme
> 
> **📖 WENN STATUS = KNOWLEDGE_ONLY:**
> - ✅ **Historische Architektur-Referenz** für Verständnis
> - ❌ **Code-Beispiele VERALTET** - ZWINGEND aktuelle Implementierung prüfen
> - ⚠️ **PFLICHT:** Vor jeder Verwendung semantic_search + grep_search
> 
> **🗑️ WENN STATUS = DEPRECATED:**
> - ❌ **Vollständig ignorieren** außer für historische Recherche
> - ❌ **NIEMALS Code oder Patterns** aus diesem Dokument verwenden

---

## 📋 **KI-AUTO-DETECTION KEYWORDS**

### **Status-Erkennungs-Matrix:**
```typescript
// 🤖 KI nutzt diese Keywords für automatische Status-Erkennung:
const STATUS_DETECTION_KEYWORDS = {
  WIP: ["🚧", "experimentell", "work in progress", "testing", "trying", "draft"],
  LESSON: ["lösung gefunden", "lessons learned", "🎓", "pattern erkannt", "debugging"],
  SOLVED: ["✅ abgeschlossen", "vollständig getestet", "produktiv", "gelöst", "implementiert"],
  VALIDATED: ["geprüft", "validiert", "freigegeben", "approved", "reviewed"],
  KNOWLEDGE_ONLY: ["historisch", "archiv", "veraltet aber referenz", "legacy"],
  DEPRECATED: ["veraltet", "ersetzt", "deprecated", "nicht mehr verwenden", "obsolete"]
};
```

### **Automatische Status-Transitions:**
```typescript
// 🤖 KI erkennt automatisch Status-Wechsel durch Content-Keywords:
const AUTO_TRANSITIONS = {
  "LÖSUNG GEFUNDEN": "WIP → LESSON",
  "✅ ABGESCHLOSSEN": "LESSON → SOLVED", 
  "VOLLSTÄNDIG GETESTET": "LESSON/VALIDATED → SOLVED",
  "PRODUKTIV BESTÄTIGT": "VALIDATED → SOLVED",
  "ERSETZT DURCH": "SOLVED/VALIDATED → DEPRECATED"
};
```

---

## 🎯 **PROBLEM/FEATURE DESCRIPTION**

### **Problem-Beschreibung:**
[Beschreibung des ursprünglichen Problems oder der gewünschten Funktion]

### **Symptome/Requirements:**
- [Symptom/Requirement 1]
- [Symptom/Requirement 2]
- [etc.]

### **Root Cause/Context:**
[Grundursache des Problems oder Kontext der Anforderung]

---

## 🛠️ **SOLUTION/IMPLEMENTATION (Status-abhängig)**

### **Lösungsansatz:**
[Beschreibung der gewählten Lösung oder Implementierungsstrategie]

### **Implementierte/Geplante Änderungen:**
1. **[Komponente/Datei]:** [Beschreibung der Änderung]
2. **[Komponente/Datei]:** [Beschreibung der Änderung]
3. **etc.**

### **Code-Beispiele (KI-WARNUNG eingebettet):**
```typescript
// ⚠️ KI-AUTO-WARNING: Status = [CURRENT_STATUS]
// ⚠️ VERHALTENSREGEL: [Entsprechende Regel basierend auf Status]
// ⚠️ VALIDATION REQUIRED: IMMER aktuelle Implementierung prüfen!

// [STATUS]-QUALITÄT CODE:
interface ExamplePattern {
  // Pattern-Struktur hier
  // Kommentare zeigen Verwendungskontext
}

// VERWENDUNG: [Wie das Pattern angewendet wird]
const implementationExample = {
  // Beispiel-Implementation
  // Mit Status-spezifischen Warnungen
};
```

---

## ✅ **VALIDATION & TESTING (Status-abhängig)**

### **Test-Strategie:**
- [ ] [Test-Typ 1]: [Beschreibung]
- [ ] [Test-Typ 2]: [Beschreibung]
- [ ] [Regression Tests]: [Beschreibung]

### **Erfolgs-Kriterien:**
- [ ] [Kriterium 1]: [Status]
- [ ] [Kriterium 2]: [Status]
- [ ] [etc.]: [Status]

### **Validierungs-Commands:**
```bash
# ⚠️ KI-WARNUNG: Commands könnten veraltet sein - vor Verwendung prüfen!
pnpm validate:critical-fixes
pnpm test
# [Weitere relevante Commands]
```

---

## 📚 **LESSONS LEARNED & PATTERNS (Transferierbar)**

### **Was funktioniert hat:**
- [Erfolgsfaktor 1]
- [Erfolgsfaktor 2]

### **Fallstricke vermeiden:**
- [Fallstrick 1] → [Vermeidungsstrategie]
- [Fallstrick 2] → [Vermeidungsstrategie]

### **Wiederverwendbare Patterns:**
- [Pattern 1]: [Anwendungsbereich]
- [Pattern 2]: [Anwendungsbereich]

---

## 🔗 **CROSS-REFERENCES & RELATED ISSUES**

### **Verwandte Probleme:**
- [Link zu verwandtem SOLVED/LESSON Dokument]
- [Link zu verwandtem ROOT_VALIDATED Dokument]

### **Betroffene Komponenten:**
- [Komponente 1]: [Art der Betroffenheit]
- [Komponente 2]: [Art der Betroffenheit]

---

## 🚨 **MAINTENANCE & MONITORING**

### **Monitoring Points:**
- [Was überwacht werden sollte]
- [Warnsignale für Regression]

### **Update Requirements:**
- [Wann dieses Dokument aktualisiert werden sollte]
- [Abhängigkeiten die Änderungen erfordern könnten]

---

**🤖 KI-USAGE SUMMARY:**
- **Status**: [CURRENT_STATUS] → [Entsprechende KI-Verhaltensregeln aktiv]
- **Auto-Detection**: ✅ Keywords erkannt, Template-Regeln automatisch geladen
- **Code-Usage**: [Status-spezifische Code-Verwendungsregeln]
- **Validation**: [Status-spezifische Validierungsanforderungen]

*Template Version: Universal Lifecycle Template v1.0 - Auto-Detection Active*