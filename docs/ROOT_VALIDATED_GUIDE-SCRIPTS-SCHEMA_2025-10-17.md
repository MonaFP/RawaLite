# Scripts Naming Schema & Standards Guide

> **Erstellt:** 17.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-AUTO-DETECTION SYSTEM Integration)  
> **Status:** Production Ready | **Typ:** Guide - Scripts Schema & Standards  
> **Schema:** `ROOT_VALIDATED_GUIDE-SCRIPTS-SCHEMA_2025-10-17.md` ✅ **SCHEMA-COMPLIANT**  
> **🛡️ ROOT-PROTECTED:** Kritisch für Script-Management, NIEMALS verschieben!

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Production Ready (automatisch durch "76.3% Schema Compliance" erkannt)
> - **TEMPLATE-QUELLE:** ROOT_VALIDATED_GUIDE Template
> - **AUTO-UPDATE:** Bei Scripts-Änderung automatisch Schema-Guide aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "Production Ready", "42/55 Scripts", "Authoritative naming schema"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **✅ STATUS = Production Ready:**
> - ✅ **Scripts-Schema** - Verlässliche Quelle für KATEGORIE_SCOPE_SUBJECT_ACTION.ext Format
> - ✅ **Naming-Standards** - Authoritative Standards für alle Automation-Scripts
> - 🎯 **AUTO-REFERENCE:** Bei Script-Creation dieses Schema befolgen
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "SCRIPT NAMING ERROR" → Schema-Compliance-Check erforderlich

> **⚠️ SCRIPT REALITY CHECK:** 76.3% Schema Compliance (42/55 Scripts) (26.10.2025)  
> **Registry Status:** Scripts Registry sync validated  
> **Template Integration:** KI-SESSION-BRIEFING Workflow mandatory  
> **Critical Function:** Authoritative naming schema for all automation scripts

## 📋 **SCHEMA-ÜBERSICHT (KI-PRÄFIX-ERKENNUNGSREGELN)**

### **Document Classification:**
- **STATUS-PRÄFIX:** `ROOT_VALIDATED_` ✅ **KI-kritisch, höchste Priorität, niemals verschieben**
- **TYP-KATEGORIE:** `GUIDE-` ✅ **Leitfaden/Anleitung** 
- **SUBJECT:** `SCRIPTS-SCHEMA` ✅ **Spezifisch identifiziert**
- **DATUM:** `2025-10-17` ✅ **Gültig und aktuell**

### **KI-Interpretation:** 
- **Thema:** Scripts Naming Schema & Standards (Automation Scripts Management)
- **Status:** ROOT_VALIDATED (höchste KI-Priorität, niemals verschieben)
- **Quelle:** /docs Root (KI-kritisch)
- **Priorität:** Höchste (Root-geschützt, verlässliche Quelle)

---

## 🎯 **MANDATORY SESSION-START PROTOCOL (KI-Template-Vorgaben)**

**ZWINGEND VOR SCRIPT-ENTWICKLUNG:**
- [ ] 📋 [06-handbook/TEMPLATE/VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md](06-handbook/TEMPLATE/) öffnen und ausfüllen
- [ ] 📝 [06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md](06-handbook/TEMPLATE/) bereithalten
- [ ] 🔍 [../.github/prompts/KI-SESSION-BRIEFING.prompt.md](../.github/prompts/KI-SESSION-BRIEFING.prompt.md) befolgen
- [ ] 📋 [ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md](ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md) prüfen

**⚠️ OHNE TEMPLATE-NUTZUNG = SESSION INVALID**

---

This document defines the authoritative naming schema and standards for all RawaLite automation scripts.

## 📋 **SCRIPTS NAMING SCHEMA**

### **Naming Convention:**
```
KATEGORIE_SCOPE_SUBJECT_ACTION.ext

Beispiele:
BUILD_NATIVE_ELECTRON_REBUILD.cjs
VALIDATE_GLOBAL_CRITICAL_FIXES.mjs
DEV_PARALLEL_SERVICES_START.ps1
MAINTAIN_LOCAL_INSTALL_DEPLOY.cmd
```

---

## 🏗️ **KATEGORIE_SCOPE_SUBJECT_ACTION.ext Schema**

### **1. KATEGORIEN (6 Haupt-Kategorien)**

#### **BUILD_** - Build-Prozesse & Compilation
- **Zweck:** Build-Artefakte, Native Modules, Compilation
- **Beispiele:** `BUILD_NATIVE_ELECTRON_REBUILD.cjs`, `BUILD_GLOBAL_ARTIFACTS_CLEAN.cjs`
- **Typische Scopes:** GLOBAL, NATIVE, VSCODE
- **Typische Actions:** BUILD, REBUILD, CLEAN, CLEANUP, VERIFY

#### **VALIDATE_** - Testing, Validation & Guards  
- **Zweck:** System-Validation, Pre-Checks, Guards
- **Beispiele:** `VALIDATE_GLOBAL_CRITICAL_FIXES.mjs`, `VALIDATE_DOCS_STRUCTURE_CHECK.mjs`
- **Typische Scopes:** GLOBAL, DATABASE, DOCS, RELEASE, NATIVE
- **Typische Actions:** CHECK, VERIFY, GUARD

#### **DEV_** - Development Environment & Testing
- **Zweck:** Development Tools, Environment Setup, Testing
- **Beispiele:** `DEV_GLOBAL_ENVIRONMENT_START.cjs`, `DEV_IPC_DIRECT_TEST.cjs`
- **Typische Scopes:** GLOBAL, PARALLEL, IPC, UPDATE, GITHUB
- **Typische Actions:** START, TEST, RESTART

#### **MAINTAIN_** - Maintenance & Operations
- **Zweck:** System-Wartung, Cleanup, Installation, Updates
- **Beispiele:** `MAINTAIN_LOCAL_INSTALL_DEPLOY.cmd`, `MAINTAIN_GIT_HOOKS_SETUP.js`
- **Typische Scopes:** GLOBAL, LOCAL, PROCESS, NATIVE, GIT, NPMRC, VERSION
- **Typische Actions:** CLEAN, FIX, DEPLOY, SETUP, UPDATE, VERIFY

#### **ANALYZE_** - Analysis & Inspection
- **Zweck:** Code-Analyse, Debugging, Inspection Tools
- **Beispiele:** `ANALYZE_DATABASE_SCHEMA_INSPECT.cjs`, `ANALYZE_ASSETS_GUARD_CHECK.cjs`
- **Typische Scopes:** DATABASE, ASSETS, SCHEMA
- **Typische Actions:** INSPECT, ANALYZE, GUARD, CHECK

#### **DOCS_** - Documentation Tools
- **Zweck:** Documentation-Management, Batch-Updates
- **Beispiele:** `DOCS_VALIDATED_BATCH_UPDATE.ps1`
- **Typische Scopes:** VALIDATED, SCHEMA, STRUCTURE
- **Typische Actions:** UPDATE, SYNC, VALIDATE

---

### **2. SCOPE-LEVEL (Anwendungsbereich)**

#### **Globale Scopes**
- **GLOBAL_** - Projektweite Operationen
- **NATIVE_** - Native Module Operations (better-sqlite3, bindings)
- **DATABASE_** - Database-spezifische Operationen
- **RELEASE_** - Release & Deployment-spezifisch
- **DOCS_** - Documentation-spezifisch

#### **Service-spezifische Scopes**
- **VSCODE_** - VS Code Integration
- **IPC_** - Inter-Process Communication
- **GITHUB_** - GitHub API/CLI Operations
- **UPDATE_** - Update-Manager-spezifisch
- **PARALLEL_** - Multi-Service Operations
- **ELECTRON_** - Electron-spezifisch
- **ABI_** - Application Binary Interface
- **ASAR_** - ASAR Packaging
- **ASSETS_** - Asset Management

#### **Spezifische Scopes**
- **LOCAL_** - Lokale Installation/Environment
- **PROCESS_** - Process Management
- **GIT_** - Git Hooks/Operations
- **NPMRC_** - NPM Configuration
- **VERSION_** - Version Management
- **MIGRATION_** - Database Migrations
- **HIERARCHY_** - Data Hierarchy
- **COMPLIANCE_** - Standards Compliance
- **BINDINGS_** - Native Bindings
- **SQLITE3_** - SQLite3-spezifisch
- **PATHS_** - Path Management
- **STRUCTURE_** - Structure Validation
- **VALIDATED_** - Validated Documentation

---

### **3. SUBJECT (Was wird bearbeitet)**

#### **Technische Subjects**
- **ARTIFACTS** - Build-Artefakte
- **ELECTRON** - Electron Framework
- **CRITICAL_FIXES** - Critical Fixes Registry
- **STRUCTURE** - Struktur-Validation
- **ENVIRONMENT** - Development Environment
- **MODULES** - Native/Node Modules
- **CACHE** - Cache-Systeme
- **SERVICES** - Service-Management
- **SCHEMA** - Schema-Definitionen
- **ASSETS** - Asset-Files
- **HOOKS** - Git Hooks
- **CONFIGURATION** - Config-Files

#### **Data/Content Subjects**
- **DATABASE** - Database Operations
- **MIGRATION** - Database Migrations
- **HIERARCHY** - Data Hierarchy
- **BATCH** - Batch Operations
- **DOCUMENTATION** - Documentation
- **VERSION** - Version Information

#### **System Subjects**
- **INSTALL** - Installation Processes
- **UNPACK** - Unpacking Operations  
- **BINDINGS** - Native Bindings
- **COMPATIBILITY** - ABI/Version Compatibility

---

### **4. ACTION-PATTERNS (Was wird getan)**

#### **Validation Actions**
- **_CHECK** - Einfache Validation ohne Report
- **_VERIFY** - Umfassende Validation mit detailliertem Report
- **_GUARD** - Preventive Checks vor kritischen Operationen

#### **Build Actions**
- **_BUILD** - Kompilierung/Build-Prozess
- **_REBUILD** - Vollständiger Rebuild
- **_CLEAN** - Artefakte entfernen
- **_CLEANUP** - Umfassende Bereinigung

#### **Service Actions**
- **_START** - Service/Environment starten
- **_RESTART** - Service neu starten
- **_DEPLOY** - Deployment-Prozess
- **_TEST** - Test-Ausführung

#### **Maintenance Actions**
- **_FIX** - Problem-Reparatur
- **_SETUP** - Einrichtung/Konfiguration
- **_UPDATE** - Inhalts-/Config-Updates
- **_SYNC** - Synchronisation zwischen Systemen

#### **Analysis Actions**
- **_INSPECT** - Detaillierte Analyse
- **_ANALYZE** - Umfassende Analyse
- **_INDEX** - Index-Operationen

---

## 🎯 **FILE EXTENSIONS & BEDEUTUNG**

### **Script Types**
- **`.cjs`** - CommonJS Node.js Scripts (Legacy Compatibility)
- **`.mjs`** - ES Module Node.js Scripts (Modern Standard)
- **`.js`** - JavaScript (Context-dependent)
- **`.ts`** - TypeScript Scripts (Type-safe)
- **`.ps1`** - PowerShell Scripts (Windows-specific)
- **`.cmd`** - Windows Batch Scripts (Legacy Windows)

### **Extension Guidelines**
- **Prefer `.mjs`** für neue Node.js Scripts (ES Modules)
- **Use `.cjs`** nur bei Legacy-Compatibility-Requirements
- **Use `.ps1`** für Windows-spezifische Automation
- **Use `.ts`** für type-kritische Scripts mit TSX-Runner
- **Use `.cmd`** nur für einfache Windows-Batch-Operationen

---

## 📊 **SCHEMA-VALIDIERUNG**

### **Format-Check**
```regex
^(BUILD|VALIDATE|DEV|MAINTAIN|ANALYZE|DOCS)_[A-Z]+_[A-Z_]+_[A-Z]+\.(cjs|mjs|js|ts|ps1|cmd)$
```

### **Naming Rules**
1. **MANDATORY:** Alle Teile UPPERCASE mit Underscore-Trennung
2. **MANDATORY:** Kategorie aus definierten 6 Kategorien
3. **MANDATORY:** Scope muss logisch zur Kategorie passen
4. **MANDATORY:** Subject beschreibt konkret bearbeitetes Element
5. **MANDATORY:** Action beschreibt konkrete Operation
6. **FORBIDDEN:** Leerzeichen, Bindestriche, Sonderzeichen (außer _)
7. **FORBIDDEN:** Mehrdeutige Abkürzungen

### **Logical Validation**
- **BUILD + VALIDATE** Actions müssen zu Kategorie passen
- **GLOBAL Scope** nur bei projektweiten Operationen
- **CRITICAL Subject** nur bei session-kritischen Scripts
- **Service Scopes** nur bei service-spezifischen Operationen

---

## 🔧 **PACKAGE.JSON INTEGRATION**

### **Script-Referenz Standards**
```json
{
  "scripts": {
    "validate:critical-fixes": "node scripts/VALIDATE_GLOBAL_CRITICAL_FIXES.mjs",
    "build:clean": "node scripts/BUILD_GLOBAL_ARTIFACTS_CLEAN.cjs",
    "dev:environment": "node scripts/DEV_GLOBAL_ENVIRONMENT_START.cjs"
  }
}
```

### **Naming Convention für package.json**
- **Format:** `kategorie:operation` (lowercase mit Bindestrichen)
- **Mapping:** `validate:critical-fixes` → `VALIDATE_GLOBAL_CRITICAL_FIXES.mjs`
- **Consistency:** Jeder Script sollte package.json-Referenz haben

---

## 🚨 **CRITICAL SCRIPTS (Session-Blocker)**

### **Kategorie: 🔴 CRITICAL (Session-kritisch)**
```
VALIDATE_GLOBAL_CRITICAL_FIXES.mjs       # Critical Fixes Validation
BUILD_NATIVE_ELECTRON_REBUILD.cjs        # ABI Management Critical
```

### **Kategorie: 🟡 IMPORTANT (Build-Pipeline)**
```
VALIDATE_DOCS_STRUCTURE_CHECK.mjs        # Documentation Compliance
VALIDATE_DATABASE_MIGRATION_INDEX.mjs    # Database Integrity
BUILD_NATIVE_ARTIFACTS_CLEANUP.mjs       # Build Pipeline
```

### **Kategorie: 🔸 STANDARD (Standard-Funktionalität)**
```
DEV_GLOBAL_ENVIRONMENT_START.cjs         # Development Environment
MAINTAIN_LOCAL_INSTALL_DEPLOY.cmd        # Local Installation
ANALYZE_DATABASE_SCHEMA_INSPECT.cjs      # Analysis Tools
```

---

## 📋 **MAINTENANCE GUIDELINES**

### **Bei Script-Erstellung**
1. **Schema-Konformität prüfen** (KATEGORIE_SCOPE_SUBJECT_ACTION.ext)
2. **Logische Zuordnung validieren** (Kategorie ↔ Scope ↔ Action)
3. **Package.json-Referenz hinzufügen**
4. **Scripts Registry aktualisieren** (`ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md`)
5. **Functionality testen**

### **Bei Script-Änderungen**
1. **Critical Fixes prüfen** (falls Script in Critical List)
2. **Schema-Konformität beibehalten**
3. **Package.json-Referenzen aktualisieren** (bei Umbenennung)
4. **Registry-Status aktualisieren** (Last Validated)
5. **Downstream-Abhängigkeiten prüfen**

### **Validation Commands**
```bash
# Schema Validation (kommend)
pnpm validate:scripts-schema

# Registry Sync Check (kommend)
pnpm validate:scripts-registry

# Critical Fixes (bestehend)
pnpm validate:critical-fixes
```

---

## 🔗 **RELATED DOCUMENTS**

- **Scripts Registry:** `ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md`
- **Critical Fixes:** `ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md`
- **Documentation Paths:** `ROOT_VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-20.md`
- **KI Instructions:** `ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md`

---

**📌 Dieses Schema ist bindend für alle zukünftigen Script-Entwicklungen!**  
**🛡️ ROOT-Status: Kritisch für Projekt-Konsistenz - NIEMALS verschieben!**