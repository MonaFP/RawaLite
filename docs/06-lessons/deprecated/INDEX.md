# 13-deprecated - Deprecated & Legacy Documentation

> **Purpose:** Deprecated documentation, legacy code patterns, migration guides, and obsolete implementations

## 📋 **Contents**

### **📦 Deprecated Patterns**
- **Legacy Code Patterns:** Outdated implementation patterns that should not be used
- **Obsolete APIs:** Deprecated API patterns and their modern replacements
- **Migration Guides:** How to migrate from deprecated patterns to current standards

### **🔄 Migration Documentation**
- **Field Mapping Legacy:** Old field mapping patterns → new field-mapper system
- **IPC Legacy Patterns:** Deprecated IPC communication → unified `window.rawalite` pattern
- **UI Legacy Components:** Outdated component patterns → v1.5.2 theme system
- **Database Legacy:** Old database patterns → SQLiteAdapter with field mapping

### **⚠️ Known Deprecated Issues**
- **Legacy API Endpoints:** Outdated API patterns still present in codebase
- **Old Documentation Structure:** Pre-reorganization documentation patterns
- **Deprecated Dependencies:** Outdated packages and their modern replacements
- **Legacy Build Patterns:** Old build configurations and deployment methods

### **✅ Successfully Migrated**
- **Documentation Structure:** Legacy `/final/`, `/plan/`, `/sessions/`, `/wip/` → thematic organization
- **Field Mapping System:** Manual field conversion → automated field-mapper.ts
- **IPC Communication:** Multiple communication channels → unified `window.rawalite`
- **Theme System:** Hardcoded styles → v1.5.2 Beautiful Pastel Themes with CSS Custom Properties

### **🗂️ Legacy Archive**
Historical reference for deprecated patterns and solutions:

#### ✅ solved/
Successfully migrated legacy problems (kept for reference)
- Migration success stories and lessons learned
- Deprecated pattern solutions that worked before migration

#### ⚠️ active/
Legacy problems requiring migration or cleanup
- Known deprecated patterns still in use
- Legacy code that needs modernization

## 🚨 **Migration Warnings**

### **DO NOT USE These Patterns:**
- Direct field name hardcoding instead of field-mapper
- Multiple IPC communication channels
- Hardcoded CSS styles instead of theme system
- Direct database queries without SQLiteAdapter

### **USE INSTEAD:**
- ✅ **Field Mapping:** `mapFromSQL()` / `mapToSQL()` from field-mapper.ts
- ✅ **IPC Communication:** `window.rawalite` unified interface
- ✅ **Styling:** v1.5.2 theme system with CSS Custom Properties
- ✅ **Database:** SQLiteAdapter with type-safe operations

## 🔗 **Related Topics**

- [Standards](../01-standards/) - Current coding standards and best practices
- [Architecture](../02-architecture/) - Modern architecture patterns and decisions
- [Database](../05-database/) - Current database patterns and field mapping
- [UI Components](../08-ui/) - Modern UI components and theme system
- [Migration Documentation](../02-architecture/final/) - Migration experiences and modernization strategies

## 📈 **Status**

- **Last Updated:** 2025-10-12
- **Active Deprecated Issues:** Legacy API patterns, old documentation structure
- **Documentation Status:** Comprehensive - Deprecated patterns documented with migration paths
- **Migration Progress:** Major systems migrated, minor cleanup remaining
- **Reference Value:** ✅ Complete historical reference for deprecated patterns and solutions