# 05-deploy - Deployment & Update System

> **Purpose:** Deployment Processes, Auto-Update System, Distribution, and Release Management  
> **Last Updated:** 2025-10-15  
> **Status:** ✅ ACTIVE  
> **Consolidates:** deployment + update-manager + distribution  
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: VALIDATED_GUIDE-DEPLOYMENT-UPDATES-INDEX-2025-10-16.md
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

### **📂 final/** - Completed Deployment Documentation

#### **🚀 Deployment & Distribution**
- **DEPLOYMENT_UPDATES.md** - Deployment process documentation
- **UPDATE_DEVELOPMENT.md** - Update system development guide
- **IMPLEMENTATION-COMPLETE.md** - Implementation completion status

#### **🔄 Update Manager System (Prefixed UPDATER-)**
- **UPDATER-UPDATE-SYSTEM-ARCHITECTURE.md** - Update system architecture
- **UPDATER-HYBRID-COMPONENT-ARCHITECTURE.md** - Hybrid component design
- **UPDATER-UPDATE_TESTING.md** - Update testing procedures
- **UPDATER-DOWNLOAD-VERIFICATION-BUG.md** - Download verification fixes

#### **🔧 Auto-Update Implementation**
- **IMPLEMENTATION-PLAN-auto-update-notifications.md** - Notification system
- **IMPLEMENTATION-PLAN-custom-updater.md** - Custom updater implementation
- **GITHUB-API-MIGRATION-PLAN.md** - GitHub API integration

#### **📚 Deployment Lessons Learned**
- **LESSONS-LEARNED-custom-updater-implementation.md** - Custom updater lessons
- **LESSONS-LEARNED-download-verification-regression.md** - Download verification issues
- **LESSONS-LEARNED-NSIS-INSTALLER-PROBLEMS.md** - NSIS installer solutions
- **LESSONS-LEARNED-UPDATE-INSTALLATION-ERROR.md** - Installation error fixes
- **LESSONS-LEARNED-v1042-rückwärtskompatibilität-fixes.md** - Compatibility fixes

### **📂 plan/** - Deployment Planning
- **UPDATER-DOCUMENTATION-CLEANUP-PLAN.md** - Update manager documentation plan

### **📂 sessions/** - Deployment Sessions
- Currently empty

### **📂 wip/** - Work-in-Progress
- Currently empty

---

## 🎯 **Quick Navigation**

### **🚀 For Deployment:**
1. ✅ **Process:** [PATHS.md](../PATHS.md#DEPLOYMENT_UPDATES) - Deployment documentation
2. ✅ **Update system:** [PATHS.md](../PATHS.md#UPDATE_DEVELOPMENT) - Update development guide
3. ✅ **Architecture:** [PATHS.md](../PATHS.md#UPDATE_SYSTEM_ARCHITECTURE) - System architecture

### **🔄 For Update Manager:**
- **Hybrid Architecture:** [PATHS.md](../PATHS.md#UPDATER_HYBRID_ARCHITECTURE) - Component architecture
- **Testing:** [PATHS.md](../PATHS.md#UPDATE_TESTING) - Testing procedures
- **Registry:** [PATHS.md](../PATHS.md#UPDATER_REGISTRY) - Complete updater index

### **🔧 For Implementation:**
- **Custom Updater:** [PATHS.md](../PATHS.md#CUSTOM_UPDATER) - Custom updater guide
- **GitHub API:** [PATHS.md](../PATHS.md#GITHUB_API_MIGRATION) - API integration
- **Auto-Update:** [PATHS.md](../PATHS.md#AUTO_UPDATE_NOTIFICATIONS) - Notification system

### **🐛 For Fixes & Issues:**
- **Download Verification:** [PATHS.md](../PATHS.md#DOWNLOAD_VERIFICATION_BUG) - Verification fixes
- **Asset Validation:** [PATHS.md](../PATHS.md#RELEASE_ASSET_VALIDATION) - Asset validation system
- **Safe Updates:** [PATHS.md](../PATHS.md#SAFE_PACKAGE_UPDATES) - Package update safety

---

## 🏷️ **Tags & Topics**

<!-- tags: DEPLOY, UPDATE, DISTRIBUTION, INSTALLER, RELEASE -->

**Deployment Topics:**
- **Distribution:** Electron Builder, NSIS, release packaging
- **Auto-Update:** Download verification, installation, error handling
- **GitHub Integration:** API migration, release assets, validation
- **Compatibility:** Backward compatibility, version management
- **Testing:** Update testing, verification, error scenarios

---

## 🔗 **Cross-References**

> **Related:** [PATHS.md](../PATHS.md#CORE_INDEX) for deployment architecture and standards  
> **See also:** [PATHS.md](../PATHS.md#DEVELOPMENT_INDEX) for build processes and deployment debugging  

---

**File Count:** 35+ files migrated from 11-deployment + 12-update-manager (with UPDATER- prefixes)  
**Migration Date:** 2025-10-15  
**Structure:** 7-folder v2 system consolidation