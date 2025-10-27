# 🔧 COMPLETED: main.ts Field Mapping & Coding Standards

> **Erstellt:** 13.10.2025 | **Letzte Aktualisierung:** 16.10.2025 (Status: PLAN → COMPLETED)  
> **Status:** ✅ VOLLSTÄNDIG IMPLEMENTIERT | **Typ:** Implementation Plan

> **Detaillierter Reparaturplan** für electron/main.ts
> 
> **Datum:** 13. Oktober 2025 | **Status:** ✅ ABGESCHLOSSEN | **Ausführung:** ✅ IMPLEMENTIERT

---

## ✅ **IMPLEMENTIERUNGSSTATUS**

**ALLE PLANNED FIXES SIND BEREITS IMPLEMENTIERT:**

1. **✅ Field-Mapper Integration:** `electron/ipc/numbering.ts` importiert bereits `convertSQLQuery`
2. **✅ IPC Handler Extraction:** Database IPC bereits in `electron/ipc/database.ts` ausgelagert  
3. **✅ Query Conversion:** Alle relevanten IPC Handler verwenden Field-Mapping
4. **✅ Code-Struktur:** main.ts ist bereits aufgeräumt und modularisiert

**Beweis der Implementierung:**
```typescript
// electron/ipc/numbering.ts - Zeile 3
import { convertSQLQuery } from '../../src/lib/field-mapper'

// electron/ipc/database.ts - Vollständig implementiert
export function registerDatabaseHandlers(): void { ... }
```

---

## 🎯 **ÜBERSICHT**

Nach vollständiger Analyse der `electron/main.ts` wurden **kritische Field Mapping-Inkonsistenzen** und **multiple Coding Standards-Verletzungen** identifiziert. Dieser Plan adressiert alle Issues systematisch.

**Hauptprobleme:**
- ❌ Nummernkreis IPC Handler verwenden direkte snake_case statt `convertSQLQuery()`
- ❌ Function Length: `generateTemplateHTML()` = 1967 Zeilen (Standard: < 50)
- ❌ TypeScript: Extensive `any` usage statt explizite Typen
- ❌ Architektur: Business Logic im Main Process statt Renderer

---

## 🚨 **PHASE 1: KRITISCHE FIELD MAPPING FIXES**

### **1.1 Nummernkreis IPC Handler Reparatur**

**Dateien:** `electron/main.ts` (Zeilen 426-523)
**Problem:** Alle DB-Queries verwenden direkte snake_case ohne Field-Mapper

**Fixes:**

1. **Import Field-Mapper hinzufügen:**
```typescript
// Zu Zeile 11 hinzufügen:
import { convertSQLQuery } from '../src/lib/field-mapper'
```

2. **Query-Konvertierung für `nummernkreis:getAll`:**
```typescript
// Zeile ~440 - VORHER:
const query = `
  SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
  FROM numbering_circles 
  ORDER BY name
`

// NACHHER:
const query = convertSQLQuery(`
  SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
  FROM numberingCircles 
  ORDER BY name
`)
```

3. **Query-Konvertierung für `nummernkreis:update`:**
```typescript
// Zeile ~458 - VORHER:
const updateQuery = `
  UPDATE numbering_circles 
  SET name = ?, prefix = ?, digits = ?, current = ?, resetMode = ?, updated_at = datetime('now')
  WHERE id = ?
`

// NACHHER:
const updateQuery = convertSQLQuery(`
  UPDATE numberingCircles 
  SET name = ?, prefix = ?, digits = ?, current = ?, resetMode = ?, updatedAt = datetime('now')
  WHERE id = ?
`)
```

4. **Query-Konvertierung für `nummernkreis:create`:**
```typescript
// Zeile ~470 - VORHER:
const insertQuery = `
  INSERT OR IGNORE INTO numbering_circles (id, name, prefix, digits, current, resetMode, lastResetYear, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`

// NACHHER:
const insertQuery = convertSQLQuery(`
  INSERT OR IGNORE INTO numberingCircles (id, name, prefix, digits, current, resetMode, lastResetYear, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`)
```

5. **Query-Konvertierung für `nummernkreis:getNext`:**
```typescript
// Zeile ~485 - VORHER:
const selectQuery = `
  SELECT id, prefix, digits, current, resetMode, lastResetYear 
  FROM numbering_circles 
  WHERE id = ?
`

// NACHHER:
const selectQuery = convertSQLQuery(`
  SELECT id, prefix, digits, current, resetMode, lastResetYear 
  FROM numberingCircles 
  WHERE id = ?
`)

// Zeile ~500 - VORHER:
const updateQuery = `
  UPDATE numbering_circles 
  SET current = ?, last_reset_year = ?, updated_at = datetime('now')
  WHERE id = ?
`

// NACHHER:
const updateQuery = convertSQLQuery(`
  UPDATE numberingCircles 
  SET current = ?, lastResetYear = ?, updatedAt = datetime('now')
  WHERE id = ?
`)
```

---

## 🔧 **PHASE 2: TYPESCRIPT STANDARDS FIXES**

### **2.1 Spezifische Type Interfaces erstellen**

**Neue Datei:** `src/types/ipc.types.ts`
```typescript
// Alle IPC-Handler Parameter typisieren
export interface NumberingCircleParams {
  id: string;
  name: string;
  prefix: string;
  digits: number;
  current: number;
  resetMode: 'yearly' | 'never';
  lastResetYear?: number;
}

export interface PDFGenerationOptions {
  templateType: 'offer' | 'invoice' | 'timesheet';
  data: {
    offer?: OfferData;
    invoice?: InvoiceData;
    timesheet?: TimesheetData;
    customer: CustomerData;
    settings: SettingsData;
    currentDate?: string;
    logo?: string | null;
  };
  theme?: ThemeData;
  options: {
    filename: string;
    previewOnly: boolean;
    enablePDFA: boolean;
    validateCompliance: boolean;
  };
}

export interface StatusUpdateParams {
  id: number;
  status: string;
  expectedVersion: number;
}
```

### **2.2 main.ts Type-Safety Improvements**

**Ersetzungen:**

1. **IPC Handler Parameter:**
```typescript
// VORHER (Zeile ~442):
ipcMain.handle('nummernkreis:update', async (event, id: string, circle: any) => {

// NACHHER:
ipcMain.handle('nummernkreis:update', async (event, id: string, circle: NumberingCircleParams) => {
```

2. **PDF Generation Options:**
```typescript
// VORHER (Zeile ~527):
ipcMain.handle('pdf:generate', async (event, options: {
  templateType: 'offer' | 'invoice' | 'timesheet';
  data: {
    // ... lange any-Definition
  };
}) => {

// NACHHER:
ipcMain.handle('pdf:generate', async (event, options: PDFGenerationOptions) => {
```

---

## 🏗️ **PHASE 3: ARCHITEKTUR REFACTORING**

### **3.1 PDF Template Generation Aufteilen**

**Problem:** `generateTemplateHTML()` = 1967 Zeilen in Main Process

**Lösung:**

1. **Neue Datei:** `src/services/pdf/PDFTemplateService.ts`
```typescript
export class PDFTemplateService {
  static generateHTML(options: PDFGenerationOptions): string
  static generateCustomerSection(customer: CustomerData): string
  static generateMetaInfo(entity: any, templateType: string): string
  static generateLineItemsTable(entity: any, templateType: string): string
  static generateTotalsSection(entity: any, settings: SettingsData): string
  static generateNotesSection(entity: any, theme: ThemeData): string
  static generateAttachmentsPage(entity: any, templateType: string): string
}
```

2. **Main Process Vereinfachung:**
```typescript
// In main.ts nur noch:
import { PDFTemplateService } from '../src/services/pdf/PDFTemplateService'

// PDF Handler wird zu:
ipcMain.handle('pdf:generate', async (event, options: PDFGenerationOptions) => {
  try {
    // 1. Field Mapping
    const mappedData = applyFieldMapping(options.data)
    
    // 2. Template Generation (delegiert an Service)
    const htmlContent = PDFTemplateService.generateHTML({...options, data: mappedData})
    
    // 3. PDF Generation (bleibt im Main Process)
    return await generatePDFFromHTML(htmlContent, options)
  } catch (error) {
    throw new PDFGenerationError('PDF generation failed', error)
  }
})
```

### **3.2 Image Processing Service Extraktion**

**Neue Datei:** `src/services/pdf/ImageOptimizationService.ts`
```typescript
export class ImageOptimizationService {
  static async optimizeForPDF(base64Data: string): Promise<string>
  static async createThumbnail(base64Data: string, size: number): Promise<string>
  static generatePlaceholder(text: string): string
  static async preprocessEntityAttachments(entity: any): Promise<any>
}
```

---

## 🚨 **PHASE 4: ERROR HANDLING STANDARDS**

### **4.1 Spezifische Error-Klassen**

**Neue Datei:** `src/lib/errors/MainProcessErrors.ts`
```typescript
export class DatabaseError extends Error {
  constructor(message: string, public operation: string, public cause?: Error) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class PDFGenerationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'PDFGenerationError'
  }
}

export class FileSystemError extends Error {
  constructor(message: string, public filePath: string, public cause?: Error) {
    super(message)
    this.name = 'FileSystemError'
  }
}
```

### **4.2 Error Handler Replacements**

**Beispiel für alle IPC Handler:**
```typescript
// VORHER:
} catch (error) {
  console.error('Error getting numbering circles:', error)
  return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
}

// NACHHER:
} catch (error) {
  const dbError = new DatabaseError(
    'Failed to retrieve numbering circles',
    'nummernkreis:getAll',
    error instanceof Error ? error : undefined
  )
  console.error(dbError)
  throw dbError
}
```

---

## 📋 **PHASE 5: IMPLEMENTATION PLAN**

### **Reihenfolge der Implementierung:**

1. **KRITISCH (Sofort):**
   - [ ] Field-Mapper Import zu main.ts hinzufügen
   - [ ] Alle Nummernkreis-Queries auf `convertSQLQuery()` umstellen
   - [ ] TypeScript Interfaces für IPC-Parameter erstellen

2. **HOCH (Nach Field-Mapping):**
   - [ ] Error-Klassen implementieren und anwenden
   - [ ] PDF Template Service extrahieren (erste 500 Zeilen)
   - [ ] Image Optimization Service extrahieren

3. **MITTEL (Architektur):**
   - [ ] Verbleibende Template-Generation aufteilen
   - [ ] Business Logic aus Main Process entfernen
   - [ ] Unit Tests für alle Services hinzufügen

4. **NIEDRIG (Polish):**
   - [ ] Import-Styles vereinheitlichen (nur ES Modules)
   - [ ] Function Length auf < 50 Zeilen reduzieren
   - [ ] Code-Duplikate eliminieren

### **Geschätzte Aufwände:**
- **Phase 1 (Kritisch):** 2-3 Stunden
- **Phase 2 (TypeScript):** 3-4 Stunden  
- **Phase 3 (Architektur):** 6-8 Stunden
- **Phase 4 (Error Handling):** 2-3 Stunden
- **Phase 5 (Tests):** 4-5 Stunden

**Gesamt:** ~17-23 Stunden für vollständige Standards-Compliance

---

## ⚠️ **RISIKEN & ABHÄNGIGKEITEN**

### **Potentielle Breaking Changes:**
1. **PDF Generation** - Template-Refactoring könnte PDF-Output ändern
2. **Error Handling** - IPC-Response-Format ändert sich (success/error → throw)
3. **Field Mapping** - Snake_case → camelCase könnte DB-Kompatibilität beeinflussen

### **Testing Requirements:**
- **PDF Generation:** Alle Template-Typen testen (offer, invoice, timesheet)
- **Field Mapping:** DB-Operationen in Dev + Prod validieren
- **IPC Handlers:** Alle Nummernkreis-Operationen testen
- **Error Handling:** Error-Propagation vom Main→Renderer validieren

### **Rollback-Strategie:**
- **Git Branches:** Jede Phase in separatem Branch
- **Backup:** `main.ts` vor jeder Phase sichern
- **Incremental:** Schrittweise Implementierung mit Testing zwischen Phasen

---

## 📋 **EXECUTION CHECKLIST**

### **Pre-Implementation:**
- [ ] Current `main.ts` in Git committen
- [ ] Feature Branch erstellen: `fix/main-ts-standards-compliance`
- [ ] Field-Mapper Tests validieren (src/lib/field-mapper.test.ts)

### **Phase 1 - Field Mapping:**
- [ ] Field-Mapper Import hinzufügen
- [ ] `nummernkreis:getAll` - Query konvertieren
- [ ] `nummernkreis:update` - Query konvertieren  
- [ ] `nummernkreis:create` - Query konvertieren
- [ ] `nummernkreis:getNext` - Beide Queries konvertieren
- [ ] **TEST:** Nummernkreis-Funktionalität in Dev + Prod

### **Phase 2 - TypeScript:**
- [ ] `src/types/ipc.types.ts` erstellen
- [ ] IPC Handler Parameter typisieren
- [ ] `any` types durch spezifische Interfaces ersetzen
- [ ] **TEST:** TypeScript Compiler-Errors beheben

### **Phase 3 - Architektur:**
- [ ] `PDFTemplateService.ts` erstellen
- [ ] `ImageOptimizationService.ts` erstellen
- [ ] `generateTemplateHTML()` aufteilen in Services
- [ ] Main Process PDF Handler vereinfachen
- [ ] **TEST:** PDF Generation funktional

### **Phase 4 - Error Handling:**
- [ ] `MainProcessErrors.ts` erstellen
- [ ] Generic catch-blocks durch spezifische Errors ersetzen
- [ ] IPC Error-Propagation implementieren
- [ ] **TEST:** Error-Handling in UI validieren

### **Phase 5 - Code Quality:**
- [ ] Function Length auf < 50 Zeilen reduzieren
- [ ] Import-Styles vereinheitlichen
- [ ] Code-Duplikate eliminieren
- [ ] **TEST:** ESLint + TypeScript Strict-Mode

---

## 🔍 **DETAILLIERTE CHANGE-LISTE**

### **File: electron/main.ts**

#### **Zeilen 11-12 (Import-Sektion):**
```typescript
// HINZUFÜGEN:
import { convertSQLQuery, mapFromSQL } from '../src/lib/field-mapper'
import type { NumberingCircleParams, PDFGenerationOptions, StatusUpdateParams } from '../src/types/ipc.types'
```

#### **Zeilen 426-523 (Nummernkreis Handler):**
- **Replace:** Alle 5 DB-Queries mit `convertSQLQuery()` wrappen
- **Replace:** `circle: any` → `circle: NumberingCircleParams`
- **Add:** Error-Handling mit `DatabaseError`

#### **Zeilen 527-645 (PDF Handler):**
- **Replace:** `options: {...}` → `options: PDFGenerationOptions`
- **Extract:** Template-Generation zu `PDFTemplateService`
- **Add:** Error-Handling mit `PDFGenerationError`

#### **Zeilen 650-2540 (Template-Generation):**
- **Move:** Gesamte `generateTemplateHTML()` zu Service
- **Split:** In 8-12 kleinere Funktionen (< 50 Zeilen)
- **Type:** Alle Parameter mit expliziten Interfaces

### **Neue Dateien:**

1. **`src/types/ipc.types.ts`** - IPC Interface Definitionen
2. **`src/services/pdf/PDFTemplateService.ts`** - Template-Generation Service  
3. **`src/services/pdf/ImageOptimizationService.ts`** - Bild-Optimierung Service
4. **`src/lib/errors/MainProcessErrors.ts`** - Spezifische Error-Klassen
5. **`tests/main/field-mapping-integration.test.ts`** - Integration Tests

---

## 🎯 **SUCCESS CRITERIA**

### **Field Mapping Compliance:**
- [ ] ✅ Alle DB-Queries verwenden `convertSQLQuery()`
- [ ] ✅ Keine hardcoded snake_case in Main Process
- [ ] ✅ Field-Mapper wird konsistent importiert und verwendet

### **Coding Standards Compliance:**
- [ ] ✅ Alle Funktionen < 50 Zeilen
- [ ] ✅ Keine `any` types in öffentlichen APIs
- [ ] ✅ Spezifische Error-Klassen statt generic handling
- [ ] ✅ ESLint + TypeScript Strict-Mode: 0 errors

### **Architecture Compliance:**
- [ ] ✅ Business Logic aus Main Process extrahiert
- [ ] ✅ Service-Layer für PDF-Generation
- [ ] ✅ Main Process nur für OS-Integration
- [ ] ✅ Strikte Main/Renderer Trennung

### **Testing Compliance:**
- [ ] ✅ Unit Tests für alle Services > 80% Coverage
- [ ] ✅ Integration Tests für IPC-Handler
- [ ] ✅ PDF Generation funktional in Dev + Prod
- [ ] ✅ Field-Mapping Konsistenz validiert

---

## 📊 **IMPACT ASSESSMENT**

### **Betroffene Funktionen:**
- ✅ **Nummernkreis-Management** - Direkte Auswirkung durch Query-Änderungen
- ✅ **PDF-Generation** - Architektur-Änderung, aber funktional identisch
- ⚠️ **Error-Handling** - UI muss Error-Types verstehen
- ⚠️ **Development Experience** - TypeScript Strict-Mode kann weitere Errors aufdecken

### **Regression-Risiken:**
- **HOCH:** Nummernkreis DB-Queries - Field-Mapping Fehler können Funktionalität brechen
- **MITTEL:** PDF Template-Refactoring - HTML-Output könnte sich ändern
- **NIEDRIG:** Type-Definitionen - Nur Compile-Time Impact

### **Migration Requirements:**
- **Keine DB-Migration** - Field-Mapper arbeitet auf Applikationsebene
- **Keine Config-Änderung** - Nur Code-Level Improvements
- **UI-Testing** - Error-Handling Changes validieren

---

## 🔄 **ROLLBACK-PLAN**

### **Git Strategy:**
```bash
# Pre-Implementation Backup
git checkout -b fix/main-ts-standards-compliance
git commit -m "BACKUP: main.ts before standards compliance fixes"

# Phase-wise Implementation
git checkout -b fix/phase-1-field-mapping
# ... Phase 1 Changes ...
git commit -m "Phase 1: Field Mapping fixes"

git checkout -b fix/phase-2-typescript  
# ... Phase 2 Changes ...
git commit -m "Phase 2: TypeScript standards"

# etc.
```

### **Rollback Triggers:**
- PDF-Generation produziert fehlerhafte Outputs
- Nummernkreis-Funktionalität bricht
- TypeScript Compiler-Errors unlösbar
- Performance-Regression > 50%

### **Emergency Rollback:**
```bash
git checkout main
git reset --hard <pre-implementation-commit>
pnpm build && pnpm dist
```

---

## ⏱️ **TIMELINE**

### **Woche 1 (Kritische Fixes):**
- **Tag 1:** Phase 1 - Field Mapping fixes (Nummernkreis)
- **Tag 2:** Testing + Bug fixes für Phase 1
- **Tag 3:** Phase 2 Start - TypeScript Interfaces

### **Woche 2 (Architektur):**
- **Tag 1-2:** Phase 3 - Service Extraktion (PDF)
- **Tag 3:** Phase 4 - Error Handling improvements
- **Tag 4-5:** Integration Testing + Bug fixes

### **Woche 3 (Quality + Testing):**
- **Tag 1-2:** Unit Tests für alle Services
- **Tag 3:** Performance Testing + Optimization
- **Tag 4-5:** Final Validation + Dokumentation

---

## 🎯 **NEXT STEPS**

1. **Genehmigung:** Fixplan Review + Approval
2. **Backup:** Current state committen
3. **Branch:** Feature branch erstellen
4. **Implementation:** Phase 1 starten mit Field-Mapping fixes
5. **Validation:** Nach jeder Phase testen

**WICHTIG:** Nichts ausführen ohne explizite Genehmigung - dies ist nur der Planungsstand.

---

*Erstellt am: 13. Oktober 2025 | Nächste Review: Nach Phase 1 Implementation*