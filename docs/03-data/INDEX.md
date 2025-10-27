# 03-data - Database & Data Management

> **Purpose:** Database Schema, Field Mapping, Migrations, and Data Persistence  
> **Last Updated:** 2025-10-26 (VALIDATED Content Quality Control - Obsolete PLANs entfernt, Duplikate bereinigt)  
> **Status:** ✅ ACTIVE | **Validation Status:** 100% Schema Compliance  
> **Covers:** SQLite, Field Mapping, Migrations, Numbering Systems, Theme Database Integration

> **🎯 VALIDATED CONTENT QUALITY CONTROL (26.10.2025):**  
> **Issues Resolved:** Obsolete PLANs zu KNOWLEDGE_ONLY, veraltete REPORTs klassifiziert, Duplikate entfernt  
> **Quality Control:** VALIDATED (12→6), COMPLETED (+1), KNOWLEDGE_ONLY (+3)  
> **Schema Status:** Schema Version 46 current, 47 TypeScript migration files verified, production database validated  
> **Result:** Präzise Database-Navigation, nur aktuelle Guides in VALIDATED

## 📁 **STATUS-PRÄFIX Folder Structure**

### **📂 VALIDATED/** - Validierte Datenbank-Dokumentation (6 Dateien)

- **DATABASE-OVERVIEW-AI:** [VALIDATED_GUIDE-DATABASE-OVERVIEW-AI_2025-10-23.md](VALIDATED/VALIDATED_GUIDE-DATABASE-OVERVIEW-AI_2025-10-23.md) - **PRIMARY DB REFERENCE** - Current schema v46, Migration files 47
- **SQLite System:** [VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM-2025-10-17.md](VALIDATED/VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM-2025-10-17.md) - SQLite implementation details
- **Migration Architecture:** [VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-17.md](VALIDATED/VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-17.md) - Migration system architecture
- **Installation Guide:** [VALIDATED_GUIDE-INSTALLATION-2025-10-17.md](VALIDATED/VALIDATED_GUIDE-INSTALLATION-2025-10-17.md) - SQLite database installation & setup
- **Line Item Hierarchy:** [VALIDATED_GUIDE-LINE-ITEM-HIERARCHY-2025-10-17.md](VALIDATED/VALIDATED_GUIDE-LINE-ITEM-HIERARCHY-2025-10-17.md) - Hierarchical data patterns
- **Settings Schema Migration:** [VALIDATED_GUIDE-CROSS-REF-SETTINGS-SCHEMA-MIGRATION-2025-10-17.md](VALIDATED/VALIDATED_GUIDE-CROSS-REF-SETTINGS-SCHEMA-MIGRATION-2025-10-17.md) - Settings cross-references

### **📂 COMPLETED/** - Abgeschlossene Implementierungen (9 Dateien)
- **Migration 011:** Offer line items extension
- **Migration 013:** Discount system implementation  
- **Activity Templates:** Template system implementation
- **Numbering Circles:** Integration documentation
- **Mapping Progress:** [COMPLETED_REPORT-MAPPING-PROGRESS-2025-10-17.md](COMPLETED/COMPLETED_REPORT-MAPPING-PROGRESS-2025-10-17.md) - Field-mapping implementation completion

### **📂 KNOWLEDGE_ONLY/** - Knowledge Archive (3 Dateien)
- **Field-Mapper Plans:** [KNOWLEDGE_ONLY_PLAN-FIELD-MAPPER-MISMATCHES-2025-10-17.md](KNOWLEDGE_ONLY/KNOWLEDGE_ONLY_PLAN-FIELD-MAPPER-MISMATCHES-2025-10-17.md) - Historical analysis (bereits implementiert)
- **Mapping Implementation:** [KNOWLEDGE_ONLY_PLAN-MAPPING-IMPLEMENTATION-2025-10-17.md](KNOWLEDGE_ONLY/KNOWLEDGE_ONLY_PLAN-MAPPING-IMPLEMENTATION-2025-10-17.md) - Historical plan (bereits implementiert)
- **Database Architecture:** [KNOWLEDGE_ONLY_REPORT-DATABASE-ARCHITECTURE-CURRENT-STATE-2025-10-17.md](KNOWLEDGE_ONLY/KNOWLEDGE_ONLY_REPORT-DATABASE-ARCHITECTURE-CURRENT-STATE-2025-10-17.md) - Historical state (Schema v46, 47 migration files)

### **📂 SOLVED/** - Gelöste Probleme und Fixes
- Implementierte Database-Fixes und Lösungen

### **📂 LESSON/** - Lessons Learned
- Database-Debugging-Erfahrungen und Schema-Lessons

### **📂 KNOWLEDGE_ONLY/** - Knowledge Archive
- Historische Database-Referenz-Dokumente (sichere KI-Nutzung)

### **📂 WIP/** - Work in Progress
- Aktuelle Database-Arbeitsdokumente (nur zur Orientierung)

### **📂 PLAN/** - Database-Planungsdokumente
- Database-Roadmaps und Schema-Konzepte (Entwurfsstatus)

### **📂 DEPRECATED/** - Veraltete Database-Dokumentation
- Ersetzte oder obsolete Database-Inhalte

---

## 🎯 **Quick Navigation**

### **🗄️ For Database-Theme-System (NEW - v1.0.44):**
1. ✅ **Theme Architecture:** [Database-Theme-System Implementation](../04-ui/final/COMPLETED_IMPL-DATABASE-THEME-SYSTEM_2025-10-17.md) - Production-ready theme management with database-first architecture
2. ✅ **Migration 027:** [Theme System Migration](../04-ui/final/COMPLETED_IMPL-MIGRATION-027-THEME-SYSTEM_2025-10-17.md) - Database schema with themes, theme_colors, user_theme_preferences tables  
3. ✅ **Service Layer:** [Theme Service Implementation](../04-ui/final/COMPLETED_IMPL-THEME-SERVICE-LAYER_2025-10-17.md) - DatabaseThemeService with field-mapper integration
4. ✅ **Field Mapping:** [Theme Field Mapper](../04-ui/final/COMPLETED_IMPL-THEME-FIELD-MAPPER_2025-10-17.md) - Theme data field mapping patterns

### **🗄️ For Database Development:**
1. ✅ **PRIMARY REFERENCE:** [VALIDATED_GUIDE-DATABASE-OVERVIEW-AI_2025-10-23.md](VALIDATED/VALIDATED_GUIDE-DATABASE-OVERVIEW-AI_2025-10-23.md) - **CURRENT SCHEMA v46** - Migration files 47
2. ✅ **SQLite System:** [VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM-2025-10-17.md](VALIDATED/VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM-2025-10-17.md) - SQLite implementation details
3. ✅ **Migration Architecture:** [VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-17.md](VALIDATED/VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-17.md) - Migration system architecture
4. ✅ **Installation Setup:** [VALIDATED_GUIDE-INSTALLATION-2025-10-17.md](VALIDATED/VALIDATED_GUIDE-INSTALLATION-2025-10-17.md) - Database installation guide

### **🔧 For Implementation Examples:**
- **Field-Mapping Completion:** [COMPLETED_REPORT-MAPPING-PROGRESS-2025-10-17.md](COMPLETED/COMPLETED_REPORT-MAPPING-PROGRESS-2025-10-17.md)
- **Line Item Hierarchy:** [VALIDATED_GUIDE-LINE-ITEM-HIERARCHY-2025-10-17.md](VALIDATED/VALIDATED_GUIDE-LINE-ITEM-HIERARCHY-2025-10-17.md)
- **Settings Migration:** [VALIDATED_GUIDE-CROSS-REF-SETTINGS-SCHEMA-MIGRATION-2025-10-17.md](VALIDATED/VALIDATED_GUIDE-CROSS-REF-SETTINGS-SCHEMA-MIGRATION-2025-10-17.md)

### **🔄 For Implementation Reference:**
- **Completed Projects:** [COMPLETED/](COMPLETED/) - 8 abgeschlossene Database-Implementierungen
- **Solved Issues:** [SOLVED/](SOLVED/) - Gelöste Database-Probleme
- **Current Work:** [WIP/](WIP/) - Aktuelle Database-Projekte
- **Planning:** [PLAN/](PLAN/) - Database-Roadmaps und Konzepte

### **� STATUS-PRÄFIX Navigation:**
- **VALIDATED/**: Verlässliche Database-Quellen (12 Dateien)
- **COMPLETED/**: Abgeschlossene Database-Implementierungen (8 Dateien)
- **SOLVED/**: Implementierte Database-Fixes
- **LESSON/**: Database-Debugging-Erfahrungen
- **KNOWLEDGE_ONLY/**: Historische Database-Archiv-Referenzen
- **WIP/**: Aktuelle Database-Arbeit (nur Orientierung)
- **PLAN/**: Database-Konzepte und Roadmaps
- **DEPRECATED/**: Veraltete Database-Inhalte (ignorieren)

---

## 🏷️ **Tags & Topics**

<!-- tags: DATA, DATABASE, SQLITE, FIELD-MAPPING, MIGRATIONS -->

**Database Topics:**
- **Core:** SQLite, better-sqlite3, WAL mode, transactions
- **Schema:** Migrations, versioning, consistency, foreign keys
- **Mapping:** camelCase ↔ snake_case, field validation
- **Numbering:** Auto-numbering, prefixes, yearly resets
- **Performance:** Indexing, query optimization, production issues

---

## 🔗 **Cross-References**

> **Related:** [PATHS.md](../PATHS.md#CORE_INDEX) for architecture patterns and standards  
> **See also:** [PATHS.md](../PATHS.md#DEVELOPMENT_INDEX) for database testing and debugging workflows  

---

**File Count:** 21 total files (6 VALIDATED + 9 COMPLETED + 3 KNOWLEDGE_ONLY + 2 SOLVED + 1 INDEX)  
**Quality Control:** 2025-10-26 (Obsolete PLANs zu KNOWLEDGE_ONLY, Duplikate entfernt, PRIMARY DB REFERENCE etabliert)  
**Structure:** KI-optimized präfix system mit aktueller Database-Referenz (Schema v46, Migration files 47)