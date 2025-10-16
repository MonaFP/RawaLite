# 📋 RawaLite System Analysis TODO Plan

**Basierend auf der umfassenden System-Analyse vom 2025-10-03**  
**Gesamtbewertung: 87/100 EXCELLENT → Ziel: 90+/100**

---

## 🚨 **PHASE 1: KRITISCHE LÜCKEN (Sofortige Aktionen)**

### **TODO #1: Activity Templates Implementation** ❌ CRITICAL
**Problem:** 0/6 Default Activity Templates in Database  
**Impact:** Timesheet-Funktionalität unvollständig  
**Aufwand:** 4 Stunden  
**Dateien:** 
- `src/main/db/migrations/011_add_default_activity_templates.ts`
- `src/adapters/SQLiteAdapter.ts` (getActivities validation)

**Steps:**
1. Neue Migration erstellen mit 6 Standard-Activities
2. Default Templates: "Programmierung", "Design", "Testing", "Dokumentation", "Meeting", "Support"
3. Migration in migrations/index.ts registrieren
4. SQLiteAdapter.listActivities() testen
5. UI-Test: Activity-Dropdown in TimesheetForm hat Einträge

---

### **TODO #2: Test Framework Setup** ❌ CRITICAL  
**Problem:** Keine Unit/Integration/E2E Tests vorhanden  
**Impact:** Regressions nicht erkennbar, unsichere Entwicklung  
**Aufwand:** 8 Stunden  
**Dateien:**
- `package.json` (Test Dependencies)
- `jest.config.js`
- `tests/unit/` (neue Struktur)
- `tests/integration/` (neue Struktur)

**Steps:**
1. Jest + React Testing Library + @testing-library/electron installieren
2. Jest Konfiguration für Electron + React
3. Beispiel Unit Test: `CustomerForm.test.tsx`
4. Beispiel Integration Test: `SQLiteAdapter.test.ts`
5. Test Scripts in package.json (`pnpm test`, `pnpm test:watch`)
6. CI/CD Integration vorbereiten

---

### **TODO #3: Data Import Implementation** ❌ CRITICAL
**Problem:** Nur Export, kein Import für Kundendaten  
**Impact:** Schlechte User Onboarding Experience  
**Aufwand:** 6 Stunden  
**Dateien:**
- `src/pages/EinstellungenPage.tsx`
- `src/services/ImportService.ts` (neu)
- `src/adapters/SQLiteAdapter.ts`

**Steps:**
1. ImportService.ts erstellen mit CSV-Parser
2. UI in EinstellungenPage: Import Tab + File Upload
3. CSV Format Definition (name, email, phone, street, zip, city)
4. Validation + Duplicate Detection
5. Progress Indicator für große Imports
6. Error Handling + Import Report

---

## ⚠️ **PHASE 2: QUALITÄTSVERBESSERUNGEN (2-4 Wochen)**

### **TODO #4: CSS Organization Refactoring** ⚠️ MEDIUM
**Problem:** Viele inline styles statt CSS classes  
**Impact:** Wartbarkeit und Konsistenz  
**Aufwand:** 12 Stunden  
**Dateien:**
- `src/index.css` (erweitern)
- `src/components/*.tsx` (inline styles entfernen)
- `src/pages/*.tsx` (inline styles entfernen)

**Steps:**
1. CSS Audit: Alle inline styles dokumentieren
2. Design System CSS Classes definieren (.form-field, .button-group, etc.)
3. CustomerForm.tsx refactoring (Pilot)
4. PackageForm.tsx, OfferForm.tsx, InvoiceForm.tsx refactoring
5. EinstellungenPage.tsx Tab-System zu CSS
6. CSS Variables für alle Colors/Spacing

---

### **TODO #5: Responsive Design Testing** ⚠️ MEDIUM
**Problem:** Touch-Interface und Multi-Screen nicht getestet  
**Impact:** Mobile/Tablet Nutzung eingeschränkt  
**Aufwand:** 6 Stunden  
**Dateien:**
- `src/index.css` (Media Queries)
- `src/components/Sidebar.tsx`
- `src/components/Table.tsx`

**Steps:**
1. Responsive Breakpoints definieren (768px, 1024px, 1440px)
2. Touch-friendly Button Sizes (min 44px)
3. Mobile Sidebar (Collapsible)
4. Table horizontal scroll für Mobile
5. Form Layout für schmale Screens
6. Testing auf verschiedenen Auflösungen

---

### **TODO #6: Package-Workflow Integration Test** ⚠️ MEDIUM
**Problem:** Package-to-Offer/Invoice Integration ungetestet  
**Impact:** Mögliche Bugs in Business-Workflow  
**Aufwand:** 4 Stunden  
**Dateien:**
- `src/components/OfferForm.tsx`
- `src/components/InvoiceForm.tsx`
- Manual Testing Protocol

**Steps:**
1. Test: Package mit LineItems erstellen
2. Test: Package in Offer verwenden
3. Test: Package-Preise korrekt übernommen
4. Test: Package-LineItems expandiert
5. Test: Package-Updates propagieren zu Offers
6. Bugfixes wenn nötig

---

### **TODO #7: Input Validation Enhancement** ⚠️ MEDIUM
**Problem:** Einige Edge Cases in Validierung  
**Impact:** Inkonsistente User Experience  
**Aufwand:** 4 Stunden  
**Dateien:**
- `src/lib/validation.ts` (neu)
- `src/components/*Form.tsx`

**Steps:**
1. Zentrale Validierungs-Library erstellen
2. Phone Number Validation (German format)
3. PLZ Validation (German postal codes)
4. IBAN Validation für Bankdaten
5. File Size/Type Validation für Logo Upload
6. Consistent Error Messages

---

## 🚀 **PHASE 3: ADVANCED FEATURES (1-2 Monate)**

### **TODO #8: Pagination Implementation** ⚠️ LOW
**Problem:** Keine Pagination für große Listen  
**Impact:** Performance bei >100 Einträgen  
**Aufwand:** 16 Stunden  
**Dateien:**
- `src/components/Table.tsx`
- `src/components/Pagination.tsx` (neu)
- `src/hooks/usePagination.ts` (neu)

**Steps:**
1. Pagination Component erstellen
2. usePagination Hook mit page/limit State
3. Table.tsx um Pagination erweitern
4. SQLiteAdapter LIMIT/OFFSET Queries
5. Virtual Scrolling für sehr große Listen
6. Search + Pagination Integration

---

### **TODO #9: Code Signing Implementation** ⚠️ LOW
**Problem:** Updates nicht code-signed  
**Impact:** Security Warnings bei Updates  
**Aufwand:** 8 Stunden  
**Dateien:**
- `electron-builder.yml`
- GitHub Actions CI/CD
- Certificate Management

**Steps:**
1. Code Signing Certificate beschaffen
2. electron-builder.yml für Code Signing konfigurieren
3. GitHub Secrets für Certificate
4. CI/CD Pipeline für signed builds
5. Update verification erweitern
6. Testing auf verschiedenen Windows Versionen

---

### **TODO #10: Bulk Operations** 🎯 ENHANCEMENT
**Problem:** Einzelne CRUD Operations ineffizient  
**Impact:** User Experience bei vielen Aktionen  
**Aufwand:** 20 Stunden  
**Dateien:**
- `src/components/Table.tsx`
- `src/adapters/SQLiteAdapter.ts`
- `src/hooks/*.ts`

**Steps:**
1. Multi-Select in Table Component
2. Bulk Delete für Customers/Offers/Invoices
3. Bulk Status Update für Documents
4. Bulk Export funktionen
5. Progress Indicators für bulk operations
6. Undo/Redo für bulk actions

---

### **TODO #11: Advanced PDF Features** 🎯 ENHANCEMENT
**Problem:** Basic PDF Templates  
**Impact:** Professional document appearance  
**Aufwand:** 24 Stunden  
**Dateien:**
- `electron/main.ts` (PDF templates)
- `src/services/PDFService.ts`
- `src/pages/EinstellungenPage.tsx`

**Steps:**
1. PDF Template Editor in Settings
2. Custom Header/Footer Support
3. Watermark Support
4. Multi-language PDF Templates
5. PDF/A Compliance Option
6. Batch PDF Generation

---

### **TODO #12: Advanced Search & Filtering** 🎯 ENHANCEMENT
**Problem:** Basic Search in Tables  
**Impact:** Produktivität bei vielen Daten  
**Aufwand:** 16 Stunden  
**Dateien:**
- `src/components/SearchBar.tsx` (neu)
- `src/hooks/useSearch.ts` (neu)
- `src/adapters/SQLiteAdapter.ts`

**Steps:**
1. Advanced Search Component
2. Full-text Search in SQLite (FTS5)
3. Filter by Date Ranges
4. Filter by Status/Category
5. Saved Search Queries
6. Search Analytics/Suggestions

---

## 🧪 **PHASE 4: TESTING & QUALITY ASSURANCE**

### **TODO #13: Comprehensive Test Coverage** 🧪 QUALITY
**Problem:** Test Coverage aufbauen  
**Impact:** Code Qualität und Stabilität  
**Aufwand:** 32 Stunden  
**Dateien:**
- `tests/unit/**/*.test.ts`
- `tests/integration/**/*.test.ts`
- `tests/e2e/**/*.test.ts`

**Steps:**
1. Unit Tests für alle Hooks (useCustomers, useOffers, etc.)
2. Unit Tests für alle Components
3. Integration Tests für SQLiteAdapter
4. Integration Tests für IPC Communication
5. E2E Tests für kritische User Workflows
6. Test Coverage Reports (>80% Ziel)

---

### **TODO #14: Performance Monitoring** 🧪 QUALITY
**Problem:** Keine Performance Metrics  
**Impact:** Performance Regression Detection  
**Aufwand:** 12 Stunden  
**Dateien:**
- `src/lib/performance.ts` (neu)
- `src/components/PerformanceMonitor.tsx` (neu)

**Steps:**
1. Performance Monitoring Library
2. Database Query Performance Tracking
3. React Render Performance Monitoring
4. Memory Usage Tracking
5. Performance Dashboard in DevMode
6. Automated Performance Alerts

---

### **TODO #15: Security Audit** 🔐 SECURITY  
**Problem:** Security Review pending  
**Impact:** Potential Security Vulnerabilities  
**Aufwand:** 16 Stunden  

**Steps:**
1. Dependency Security Audit (npm audit)
2. Code Security Review (ESLint Security Plugin)
3. IPC Channel Security Review
4. File System Access Security Review
5. Update Mechanism Security Review
6. Penetration Testing vorbereiten

---

## 📊 **PRIORISIERUNG & ENTSCHEIDUNGSHILFE**

### **🚨 SOFORT (TODO #1-#3):**
- **Business Impact:** CRITICAL - App Grundfunktionalität
- **User Experience:** Zeiterfassung vollständig, Testing für Stabilität
- **Aufwand Total:** 18 Stunden (1-2 Wochen)

### **⚠️ KURZFRISTIG (TODO #4-#7):**
- **Business Impact:** MEDIUM - Benutzerfreundlichkeit
- **Code Quality:** Wartbarkeit und Konsistenz
- **Aufwand Total:** 26 Stunden (2-3 Wochen)

### **🚀 MITTELFRISTIG (TODO #8-#12):**
- **Business Impact:** LOW-MEDIUM - Advanced Features
- **Competitive Advantage:** Professional Features
- **Aufwand Total:** 84 Stunden (6-8 Wochen)

### **🧪 LANGFRISTIG (TODO #13-#15):**
- **Business Impact:** QUALITY - Long-term Stability
- **Enterprise Readiness:** Professional Development
- **Aufwand Total:** 60 Stunden (4-6 Wochen)

---

## 🎯 **EMPFOHLENE ARBEITSREIHENFOLGE**

### **Sprint 1 (Woche 1-2):** Critical Foundation
- TODO #1: Activity Templates
- TODO #2: Test Framework Setup  
- TODO #3: Data Import

### **Sprint 2 (Woche 3-4):** Quality Improvements
- TODO #4: CSS Organization
- TODO #5: Responsive Design
- TODO #6: Package Workflow Test

### **Sprint 3 (Woche 5-8):** Advanced Features (Optional)
- TODO #8: Pagination
- TODO #10: Bulk Operations
- TODO #11: Advanced PDF

### **Sprint 4 (Woche 9-12):** Quality Assurance (Optional)
- TODO #13: Test Coverage
- TODO #14: Performance Monitoring
- TODO #15: Security Audit

---

**📋 Verwende diesen Plan um zu entscheiden, welche TODOs du priorisieren möchtest. Jeder TODO ist in sich abgeschlossen und kann einzeln bearbeitet werden.**

*Erstellt: 2025-10-03*  
*Basis: System-Analyse 87/100*  
*Ziel: 90+/100 Professional Grade*