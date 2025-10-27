# 01-core - Standards & Core Architecture

> **Purpose:** Coding Standards, System Architecture, Security, IPC, and Path Management  
> **Last Updated:** 2025-10-26 (Legacy Document Reorganization + 06-handbook Integration)  
> **Status:** ✅ ACTIVE | **Validation Status:** 100% KI-PRÄFIX-ERKENNUNGSREGELN konform  
> **Consolidates:** Core architecture + legacy document cleanup

> **🎯 LEGACY REORGANIZATION RESULTS (26.10.2025):**  
> **Migration Applied:** 13 Dokumente älter als 5 Tage reorganisiert  
> **Quality Enhancement:** 5 hochwertige Architektur-Dokumente nach 06-handbook migriert  
> **Architecture:** Architektur-Referenzen jetzt zentral in 06-handbook/REFERENCE/  
> **Schema:** [STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

## 📁 **STATUS-PRÄFIX Folder Structure** 

### **📂 VALIDATED/** - Validierte, stabile Core-Dokumentation (7 Dateien)
- **Complete System Architecture:** [VALIDATED_GUIDE-CORE-SYSTEM-ARCHITECTURE_2025-10-18.md](VALIDATED/VALIDATED_GUIDE-CORE-SYSTEM-ARCHITECTURE_2025-10-18.md) - 6-layer architecture with Database-Theme-System integration
- **Debugging Standards:** [VALIDATED_GUIDE-DEBUGGING-SYSTEMATIC-APPROACH_2025-10-15.md](VALIDATED/VALIDATED_GUIDE-DEBUGGING-SYSTEMATIC-APPROACH_2025-10-15.md) - Systematic problem-solving approach
- **✅ CURRENT:** Nur noch aktuell relevante Core-Standards (alle älteren migriert)

### **📂 COMPLETED/** - Abgeschlossene Core-Implementierungen (2 Dateien)
- Fertige Reports und Implementierungsdokumentation (aktuelle Implementations)

### **📂 DEPRECATED/** - Veraltete Core-Dokumentation (8 Dateien)
- **Main.ts Refactor Plan** (obsolete - bereits umgesetzt)
- **Refactor Completion Report** (obsolete - einmaliger Report)
- **4x Implementation Steps** (obsolete - bereits abgeschlossen)
- **Critical Fixes Impact Report** (obsolete - superseded durch aktuelle Registry)
- **Documentation Quality Tracking** (obsolete - Quality-Tracking etabliert)

### **📂 KNOWLEDGE_ONLY/** - Core-Knowledge Archive (1 Datei)
- **ERR_FILE_NOT_FOUND QuickRef** (historisch wertvoll für ähnliche Probleme)

### **📂 SOLVED/** - Gelöste Core-Probleme (0 Dateien)
- Derzeit leer - alle SOLVED Dokumente archiviert oder migriert

### **📂 LESSON/** - Core-Lessons Learned (0 Dateien)
- Bereit für zukünftige Core-Lessons

### **📂 PLAN/** - Core-Planungen (0 Dateien)
- Bereit für zukünftige Core-Planungen

## 🎯 **HOCHWERTIGE ARCHITEKTUR-DOKUMENTE MIGRIERT**

**⬆️ NACH 06-HANDBOOK VERSCHOBEN (bessere KI-Zugänglichkeit):**
- **Testing Standards** → [06-handbook/REFERENCE/VALIDATED_REFERENCE-TESTING-STANDARDS_2025-10-26.md](../06-handbook/REFERENCE/VALIDATED_REFERENCE-TESTING-STANDARDS_2025-10-26.md)
- **IPC Architecture** → [06-handbook/REFERENCE/VALIDATED_REFERENCE-IPC-ARCHITECTURE_2025-10-26.md](../06-handbook/REFERENCE/VALIDATED_REFERENCE-IPC-ARCHITECTURE_2025-10-26.md)
- **PATHS System** → [06-handbook/REFERENCE/VALIDATED_REFERENCE-PATHS-SYSTEM_2025-10-26.md](../06-handbook/REFERENCE/VALIDATED_REFERENCE-PATHS-SYSTEM_2025-10-26.md)
- **Security Architecture** → [06-handbook/REFERENCE/VALIDATED_REFERENCE-SECURITY-ARCHITECTURE_2025-10-26.md](../06-handbook/REFERENCE/VALIDATED_REFERENCE-SECURITY-ARCHITECTURE_2025-10-26.md)
- **Quick Reference Template** → [06-handbook/TEMPLATE/VALIDATED_TEMPLATE-QUICK-REFERENCE_2025-10-26.md](../06-handbook/TEMPLATE/VALIDATED_TEMPLATE-QUICK-REFERENCE_2025-10-26.md)

**Grund:** Diese Dokumente waren zu wertvoll für DEPRECATED/KNOWLEDGE_ONLY und bieten aktuelle Architektur-Guidance für KI-Sessions.

### **� WIP/** - Work in Progress
- Aktuelle Arbeitsdokumente (nur zur Orientierung)

### **📂 PLAN/** - Planungsdokumente  
- Roadmaps und Konzepte (Entwurfsstatus)

### **📂 DEPRECATED/** - Veraltete Dokumentation
- Ersetzte oder obsolete Inhalte

---

## 🎯 **Quick Navigation**

### **🚀 For Development:**
1. ✅ **System Architecture:** [VALIDATED_GUIDE-CORE-SYSTEM-ARCHITECTURE_2025-10-18.md](VALIDATED/VALIDATED_GUIDE-CORE-SYSTEM-ARCHITECTURE_2025-10-18.md) - Complete 6-layer system with Database-Theme-System
2. ✅ **Debugging Approach:** [VALIDATED_GUIDE-DEBUGGING-SYSTEMATIC-APPROACH_2025-10-15.md](VALIDATED/VALIDATED_GUIDE-DEBUGGING-SYSTEMATIC-APPROACH_2025-10-15.md) - Systematic problem-solving
3. ✅ **Architecture Overview:** [PATHS.md](../PATHS.md#ARCHITECTURE_OVERVIEW) - Complete system architecture
4. ✅ **Coding Standards:** [PATHS.md](../PATHS.md#CODING_STANDARDS) - Complete guidelines  
5. ✅ **Quick Reference:** [PATHS.md](../PATHS.md#QUICK_REFERENCE) - 1-page KI reference

### **🔧 For Implementation:**
- **Testing Standards:** [PATHS.md](../PATHS.md#TESTING_STANDARDS) - Unit, Integration, E2E guidelines
- **Workflows:** [PATHS.md](../PATHS.md#WORKFLOWS) - Git, Release, Emergency procedures
- **Path Management:** [PATHS.md](../PATHS.md#PATHS_SYSTEM) - Central abstraction
- **Security:** [PATHS.md](../PATHS.md#SECURITY_GUIDE) - IPC & Database patterns

### **📊 STATUS-PRÄFIX Navigation:**
- **VALIDATED/**: Verlässliche Hauptquellen (14 Dateien)
- **SOLVED/**: Implementierte Fixes und Lösungen  
- **COMPLETED/**: Abgeschlossene Implementierungen
- **LESSON/**: Debugging-Erfahrungen
- **KNOWLEDGE_ONLY/**: Historische Archiv-Referenzen
- **WIP/**: Aktuelle Arbeit (nur Orientierung)
- **PLAN/**: Konzepte und Roadmaps
- **DEPRECATED/**: Veraltete Inhalte (ignorieren)

---

## 🏷️ **Tags & Topics**

<!-- tags: CORE, STANDARDS, ARCHITECTURE, SECURITY, IPC, PATHS -->

**Consolidated Topics:**
- **Standards:** Coding, Testing, Documentation
- **Architecture:** System design, Electron structure, Refactoring
- **Security:** IPC security, Database access patterns
- **Paths:** Central path management system
- **IPC:** Inter-process communication patterns

---

## 🔗 **Cross-References**

> **Related:** [02-dev/](../02-dev/) for development workflows and testing  
> **See also:** [03-data/](../03-data/) for database architecture integration  

---

**File Count:** 14 VALIDATED + weitere Dateien in STATUS-PRÄFIX Struktur  
**Migration Date:** 2025-10-26 (STATUS-PRÄFIX System)  
**Structure:** KI-optimized semantic organization with STATUS-PRÄFIX schema