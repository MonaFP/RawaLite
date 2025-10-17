# CRITICAL KI-FAILURE-MODES

> **⚠️ MANDATORY READ vor jeder Session - Diese Fehler NIEMALS wiederholen**  
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: VALIDATED_GUIDE-KI-FAILURE-MODES-2025-10-15.md
```

### **STATUS-PRÄFIXE:**
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

## 🚨 KRITISCHE PLANUNGSFEHLER - VERHINDERN

### **1. Scope Misunderstanding (Session-Killer)**
```
❌ FEHLER: Aufgabe zu eng interpretieren
✅ RICHTIG: Vollständige Dokumentation lesen BEVOR Plan erstellen
```
- **Beispiel**: "bei invoices und offers mitprüfen" = vollständige Schema-Konsistenz, nicht nur Package
- **Prevention**: Immer `docs/05-database/final/` und verwandte Pläne prüfen
- **NEVER**: Plan ohne Dokumentations-Review erstellen

### **2. Root-Cause vs. Symptom Fix**
```
❌ FEHLER: Symptom beheben (mappedItem.amount → mappedItem.unit_price)
✅ RICHTIG: Root-Cause beheben (field-mapper.ts 'amount': 'unit_price' fehlt)
```
- **Prevention**: Field-Mapper Vollständigkeit IMMER vor DB-Fixes prüfen
- **NEVER**: Direkte Code-Fixes ohne Architektur-Analyse

### **3. Dokumentations-Ignorierung**
```
❌ FEHLER: Bestehende Analysen übersehen (FIELD_MAPPER_MISMATCHES_PLAN.md)
✅ RICHTIG: docs/ durchsuchen nach verwandten Problemen
```
- **MUST**: `semantic_search` nach Problem-Keywords
- **NEVER**: Neue Analyse ohne Check auf bestehende Dokumentation

### **4. Lessons-Learned Missachtung (HÄUFIGER FEHLER)**
```
❌ FEHLER: Immer wieder vergessen, Lessons zu erstellen/nutzen
✅ RICHTIG: VORRANGIG vorhandene Lessons konsultieren und erweitern
```
- **MUST**: `docs/*/lessons/` prüfen BEVOR neue Analyse beginnen
- **MUST**: Nach jedem Problem/Fix entsprechende Lesson erstellen/erweitern
- **PATTERN**: Problem X → docs/08-ui/lessons/LESSONS-LEARNED-X.md suchen
- **NEVER**: Debugging ohne Lessons-Check/Update-Workflow

### **5. Unvollständige Feature-Implementierung (KRITISCHER SCOPE-FEHLER)**
```
❌ FEHLER: Feature nur für Offers/Invoices implementieren, Packages "deferrieren"
✅ RICHTIG: Vollständige Cross-Entity-Analyse VOR Entscheidung über Scope
```
- **Real-Case**: `priceDisplayMode` nur für Offers/Invoices implementiert, Packages ausgelassen
- **Warum kritisch**: Package→Offer Import überträgt `priceDisplayMode` - fehlende Package-Unterstützung = Feature funktioniert NICHT
- **Prevention**: 
  - Bei Entity-Features IMMER fragen: "Werden diese Entities miteinander verknüpft?"
  - Package→Offer/Invoice Import = Package MUSS alle Offer/Invoice-Felder unterstützen
  - **NEVER**: "später implementieren" bei kritischen Abhängigkeiten
  - **MUST**: Datenfluss-Analyse BEVOR Scope-Entscheidung (UI → DB → Import → PDF)
- **Regel**: Wenn Feature für Entity A implementiert wird UND Entity B importiert A → Feature MUSS auch für B implementiert werden
- **NEVER**: KI entscheidet über Deferral - IMMER Entwickler fragen bei Scope-Unsicherheit

## 🔧 IMPLEMENTIERUNGSFEHLER - VERHINDERN

### **6. Environment-Detection falsch**
```
❌ FEHLER: process.env.NODE_ENV in Electron
✅ RICHTIG: !app.isPackaged (Electron-Standard laut Doku)
```
- **MUST**: Dev-Prod-Patterns aus docs/00-meta/ konsultieren
- **NEVER**: Node.js-Patterns blind auf Electron übertragen

### **7. Unvollständige Systematik**
```
❌ FEHLER: 50% console.log ersetzt, dann gestoppt
✅ RICHTIG: grep_search → vollständige Liste → systematisch abarbeiten
```
- **MUST**: Vollständigkeit vor Abschluss validieren
- **NEVER**: Refactoring-Tasks unvollständig lassen

### **8. Missing Validation**
```
❌ FEHLER: Keine finale Verifikation der Änderungen
✅ RICHTIG: Tests/Build nach jedem größeren Fix
```
- **MUST**: Critical-Fixes-Registry prüfen vor File-Edit
- **NEVER**: Änderungen ohne Validation abschließen

## 📋 MANDATORY WORKFLOW - JEDE SESSION

### **Pre-Implementation Checklist**
1. **📚 Dokumentation**: `semantic_search` nach Problem + verwandten Themen
2. **📖 Lessons Check**: `docs/*/lessons/` nach ähnlichen Problemen durchsuchen
3. **🔍 Existing Analysis**: `docs/*/final/` und `docs/*/solved/` prüfen
4. **⚠️ Critical Check**: `CRITICAL-FIXES-REGISTRY.md` für betroffene Dateien
5. **🏗️ Architecture**: Field-Mapper, Schema, IPC-Patterns verstehen
6. **📋 Full Scope**: Vollständigen Umfang definieren (nicht nur erstes Problem)
7. **🔗 Data Flow Analysis**: Bei Entity-Features IMMER Import/Export-Beziehungen prüfen

### **Implementation Rules**
- **ELECTRON-spezifisch**: `app.isPackaged` für Environment-Detection
- **FIELD-MAPPING**: Immer `field-mapper.ts` vor SQLiteAdapter fixes
- **SQL-QUERIES**: `convertSQLQuery()` verwenden, nie hardcoded snake_case
- **LOGGING**: `devLog()` mit Environment-Detection
- **PATHS**: Nur über `src/lib/paths.ts`, nie direkter `app.getPath()`

### **Post-Implementation Validation**
1. **✅ Completeness**: grep_search bestätigt alle Vorkommen behoben
2. **✅ Build**: `pnpm build` erfolgreich
3. **✅ Critical**: `pnpm validate:critical-fixes` grün
4. **✅ Tests**: Funktionale Tests der geänderten Features
5. **📖 Lessons Update**: Problem/Lösung in entsprechender Lessons-Datei dokumentiert

## 🎯 SESSION-ERFOLG KRITERIEN

- **Vollständigkeit**: 100% des definierten Scope implementiert
- **Systematik**: Alle verwandten Probleme identifiziert und behoben
- **Validation**: Build + Tests + Critical-Fixes bestätigt
- **Dokumentation**: Relevante Docs konsultiert und berücksichtigt
- **Architektur**: Patterns korrekt befolgt (Field-Mapping, Environment-Detection, etc.)

---

**⚠️ Bei Zweifel: STOPP und Entwickler fragen, bevor improvisieren**

---

## 📋 Zusätzliche KI-Navigation-Regeln

**Präfix-Erkennungs-System:** Siehe [VALIDATED-2025-10-15_KI-PREFIX-RECOGNITION-RULES.md](./VALIDATED-2025-10-15_KI-PREFIX-RECOGNITION-RULES.md)
- **VALIDATED-** und **SOLVED-** Dokumente bevorzugen
- **WIP_** und **PLAN_** nur zur Orientierung  
- **DEPRECATED-** aktiv ignorieren