# 03-data - Database & Data Management

> **Purpose:** Database Schema, Field Mapping, Migrations, and Data Persistence  
> **Last Updated:** 2025-10-15  
> **Status:** ✅ ACTIVE  
> **Covers:** SQLite, Field Mapping, Migrations, Numbering Systems

## 📁 **Standard Folder Structure**

### **📂 final/** - Completed Database Documentation

#### **🗄️ Database Architecture**
- **DATABASE-ARCHITECTURE-CURRENT-STATE.md** - Complete database overview
- **SQLITE-DATABASE-SYSTEM.md** - SQLite implementation details
- **SQLITE-MIGRATION-ARCHITECTURE.md** - Migration system architecture
- **BETTER-SQLITE3-PRODUCTION-ISSUES.md** - Production database issues

#### **📋 Schema & Migrations**
- **MIGRATION-011-offer-line-items-extension.md** - Line items extension
- **MIGRATION-013-DISCOUNT-SYSTEM.md** - Discount system implementation
- **TIMESHEET-MIGRATION-009-010.md** - Timesheet schema evolution

#### **🔄 Field Mapping System**
- **FIELD_MAPPER_MISMATCHES_PLAN.md** - Field mapping consistency plan
- **MAPPING_IMPLEMENTATION_PLAN.md** - Implementation strategy
- **MAPPING_PROGRESS_REPORT.md** - Current mapping status

#### **🔢 Numbering Systems**
- **NUMMERNKREISE.md** - Numbering circles system
- **NUMBERING-CIRCLES-INTEGRATION.md** - Integration documentation
- **NUMMERNKREISE-PRODUCTION-BUG.md** - Production bug fixes

#### **📚 Database Lessons Learned**
- **LESSONS-LEARNED-DISCOUNT-PROJECT.md** - Discount system lessons
- **LESSONS-LEARNED-database-schema-migration-fix.md** - Migration lessons
- **LESSONS-LEARNED-SCHEMA-CONSISTENCY.md** - Schema consistency patterns
- **LESSONS-LEARNED-SQLITE-BOOLEAN-BINDING.md** - SQLite binding issues
- **LESSONS-LEARNED-offer-foreign-key-constraint-fix.md** - Foreign key fixes

### **📂 plan/** - Database Planning
- Currently empty

### **📂 sessions/** - Database Sessions
- Currently empty

### **📂 wip/** - Work-in-Progress
- Currently empty

---

## 🎯 **Quick Navigation**

### **🗄️ For Database Development:**
1. ✅ **Overview:** [PATHS.md](../PATHS.md#DATABASE_ARCHITECTURE_STATE) - Complete database overview
2. ✅ **SQLite setup:** [PATHS.md](../PATHS.md#SQLITE_DATABASE_SYSTEM) - SQLite implementation
3. ✅ **Migrations:** [PATHS.md](../PATHS.md#SQLITE_MIGRATION_ARCHITECTURE) - Migration system

### **🔄 For Field Mapping:**
- **Mapping Issues:** [PATHS.md](../PATHS.md#FIELD_MAPPER_MISMATCHES) - Mapping consistency
- **Implementation:** [PATHS.md](../PATHS.md#MAPPING_IMPLEMENTATION) - Implementation guide
- **Progress:** [PATHS.md](../PATHS.md#MAPPING_PROGRESS) - Current status

### **🔢 For Numbering Systems:**
- **Core System:** [PATHS.md](../PATHS.md#NUMBERING_CIRCLES) - Integration guide
- **Implementation:** [PATHS.md](../PATHS.md#SQLITE_ADAPTER) - SQLite adapter details

### **📋 For Schema & Migrations:**
- **Line Items:** [PATHS.md](../PATHS.md#MIGRATION_011_OFFER_ITEMS) - Offer line items extension
- **Discount System:** [PATHS.md](../PATHS.md#MIGRATION_013_DISCOUNT) - Discount implementation
- **Timesheet Data:** [PATHS.md](../PATHS.md#TIMESHEET_MIGRATION) - Timesheet schema evolution

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

**File Count:** 32 files migrated from 05-database/  
**Migration Date:** 2025-10-15  
**Structure:** 7-folder v2 system