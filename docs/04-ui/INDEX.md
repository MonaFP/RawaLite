# 04-ui - User Interface & PDF Generation

> **Purpose:** UI Components, UX Design, PDF Generation, and Visual Systems  
> **Last Updated:** 2025-10-16 (Search/Filter System Implementation Complete)  
> **Status:** ✅ ACTIVE  
> **Consolidates:** ui + pdf + visual design + theming + search/filter  
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: VALIDATED_GUIDE-UI-COMPONENTS-INDEX-2025-10-16.md
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
- `GUIDE-` - Leitfäden, Anleitungen
- `FIX-` - Lessons Learned, Debugging, Fixes, Problems
- `IMPL-` - Implementierungen, Features
- `REPORT-` - Berichte, Analysen, Completion-Reports
- `REGISTRY-` - Listen, Registries, Collections
- `TEMPLATE-` - Vorlagen, Templates
- `TRACKING-` - Status-Tracking, Quality-Tracking
- `PLAN-` - Planungsdokumente, Roadmaps

---

## 📁 **Standard Folder Structure**

### **📂 final/** - Completed UI Documentation

#### **🎨 UI Components & Patterns**
- **COMPLETED_IMPL-LINE-ITEMS-POSITION-REORDERING-2025-10-16.md** - ✅ **Line Items Drag-Drop Position Reordering System**
- **SOLVED_IMPL-SEARCH-AND-FILTER-SYSTEM-2025-10-15.md** - ✅ **Universal Search/Filter System (ALL 5 Pages Complete)**
- **SOLVED_FIX-RABATT-BERECHNUNG-STATUS-SYNC-BUG-2025-10-16.md** - ✅ **Rabatt-System State-Sync Fix**
- **UI-PATTERNS-table-forms.md** - Table-like forms design pattern
- **COMPONENT-AUDIT-REPORT-2025-10-14.md** - UI component audit results
- **SUB-ITEM-VISUAL-HIERARCHY-FIX-2025-10-04.md** - ✅ **Sub-item hierarchy solution**
- **SUB-ITEM-IMPLEMENTATION-PLAN.md** - Sub-item system implementation
- **TIMESHEETFORM-COMPONENT.md** - Timesheet form design

#### **🎨 Theming & Navigation**
- **V1-5-2-BEAUTIFUL-PASTEL-THEMES.md** - Pastel theme system
- **V1-5-2-ENHANCED-NAVIGATION.md** - Enhanced navigation patterns
- **V1-5-2-CONTEXT-ARCHITECTURE.md** - Context management architecture

#### **📄 PDF Generation (Prefixed PDF-)**
- **PDF-THEME-SYSTEM-FIXES.md** - ✅ **Theme system parameter-based fixes**
- **PDF-LAYOUT-OPTIMIZATIONS-V1-5-2.md** - PDF layout improvements
- **PDF-LESSONS-LEARNED-PDF-FIELD-MAPPING.md** - PDF field mapping lessons
- **PDF-LESSONS-LEARNED-container-page-breaks.md** - Page break handling
- **PDF-pdf-anhang-seite-implementation.md** - PDF attachment system

#### **🔧 Component Fixes & Lessons**
- **SOLVED-2025-10-15_DEBUG-REPORT-formatCurrency-extra-zero.md** - ✅ **Currency formatting fix**
- **LESSONS-LEARNED-STATUS-DROPDOWN-COMPLETE-FIX.md** - Status dropdown solutions
- **LESSONS-LEARNED-responsive-table-design.md** - Responsive design patterns
- **LESSONS-LEARNED-react-hooks-anti-patterns.md** - React hooks best practices

### **📂 plan/** - UI Planning
- **PDF-SUB-ITEMS-PDF-HIERARCHY-PLAN.md** - PDF hierarchy planning

### **📂 sessions/** - UI Sessions
- **COMPLETED_REPORT-ANGEBOTE-SEARCH-FILTER-IMPLEMENTATION-SESSION-2025-10-16.md** - ✅ **Search/Filter Implementation Session Report**  
- **LESSON_BUG-RABATT-BERECHNUNG-STATUS-SYNC-2025-10-16.md** - ✅ **Rabatt-System Bug Analysis & Fix**

### **📂 wip/** - Work-in-Progress
- **SUBITEMS-HIERARCHY-MANAGEMENT-PLAN.md** - Sub-items hierarchy planning
- **PDF-IMAGE-UPLOAD-FEATURE.md** - Image upload system development

---

## 🎯 **Quick Navigation**

### **🎨 For UI Development:**
1. ✅ **Search/Filter System:** [SOLVED_IMPL-SEARCH-AND-FILTER-SYSTEM-2025-10-15.md](final/SOLVED_IMPL-SEARCH-AND-FILTER-SYSTEM-2025-10-15.md) - Universal search system
2. ✅ **UI Patterns:** [PATHS.md](../PATHS.md#UI_PATTERNS_TABLE_FORMS) - Table-like forms design
3. ✅ **Components:** [PATHS.md](../PATHS.md#HEADERSTATISTICS_COMPONENT) - Statistics component
4. ✅ **Navigation:** [PATHS.md](../PATHS.md#ENHANCED_NAVIGATION) - Enhanced navigation

### **📄 For PDF Development:**
- **PDF Architecture:** [PATHS.md](../PATHS.md#PDF_ANHANG_SEITE_ARCHITEKTUR) - PDF attachment system
- **PDF Layout:** [PATHS.md](../PATHS.md#PDF_LAYOUT_OPTIMIZATIONS) - Layout improvements
- **PDF Registry:** [PATHS.md](../PATHS.md#PDF_REGISTRY) - Complete PDF index

### **🎨 For Theming & Design:**
- **Theme System:** [PATHS.md](../PATHS.md#BEAUTIFUL_PASTEL_THEMES) - Pastel theme system
- **Focus Mode:** [PATHS.md](../PATHS.md#FOCUS_MODE_V2) - Focus mode v2
- **Theme Fixes:** [PATHS.md](../PATHS.md#THEME_SYSTEM_FIXES) - Theme system fixes

### **🔧 For Component Fixes:**
- **Search/Filter System:** [SOLVED_IMPL-SEARCH-AND-FILTER-SYSTEM-2025-10-15.md](final/SOLVED_IMPL-SEARCH-AND-FILTER-SYSTEM-2025-10-15.md) - ✅ **Universal Search System (Complete)**
- **Rabatt-System Fix:** [SOLVED_FIX-RABATT-BERECHNUNG-STATUS-SYNC-BUG-2025-10-16.md](final/SOLVED_FIX-RABATT-BERECHNUNG-STATUS-SYNC-BUG-2025-10-16.md) - ✅ **State-Sync Bug behoben**
- **Status Dropdown:** [PATHS.md](../PATHS.md#STATUS_DROPDOWN_COMPLETE_FIX) - Complete dropdown fix
- **Responsive Design:** [PATHS.md](../PATHS.md#RESPONSIVE_TABLE_DESIGN) - Responsive patterns
- **Currency Format:** [PATHS.md](../PATHS.md#FORMAT_CURRENCY_FIX) - Currency formatting fix

---

## 🏷️ **Tags & Topics**

<!-- tags: UI, PDF, COMPONENTS, THEMES, UX -->

**UI Topics:**
- **Components:** Forms, tables, dropdowns, hierarchy, sub-items
- **Theming:** Pastel themes, dark mode, navigation, responsive design
- **PDF:** Generation, theming, field mapping, attachments, hierarchy
- **UX:** Patterns, accessibility, responsive design, user workflows
- **Performance:** React optimization, state management, rendering

---

## 🔗 **Cross-References**

> **Related:** [PATHS.md](../PATHS.md#CORE_INDEX) for UI coding standards and architecture  
> **See also:** [PATHS.md](../PATHS.md#DATA_INDEX) for data-driven UI components integration  

---

**File Count:** 80+ files migrated from 08-ui + 09-pdf (with PDF- prefixes)  
**Migration Date:** 2025-10-15  
**Structure:** 7-folder v2 system consolidation