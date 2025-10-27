# � Meta-Documentation & KI-Instructions

> **Purpose:** Meta-Documentation, KI-Instructions, Critical Fixes und Central Path Management.

## 🚨 **CRITICAL SYSTEMS (MUST READ)**

### **🗂️ CENTRAL PATH MANAGEMENT**
- **[ROOT_VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-20.md](../../ROOT_VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-20.md)** - 🚀 **PATHS.md SYSTEM**
  - **104+ Path Constants** für alle Dokumentations-Cross-References
  - **Import-like Syntax:** `[PATHS.md](PATHS.md#CONSTANT)`
  - **Single Source of Truth** - Zentrale Pfadverwaltung
  - **Status:** ✅ PRODUKTIV - Alle 7 Ordner migriert
  - **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

### **🛡️ Critical Fixes Registry**
- **[VALIDATED_REGISTRY-CRITICAL-FIXES-2025-10-15.md](VALIDATED_REGISTRY-CRITICAL-FIXES-2025-10-15.md)** - 13 aktive kritische Fixes
  - WriteStream Race Conditions, File System Flush Delays
  - Event Handler Konflikte, Port-Konsistenz, Database Schema
  - **MANDATORY:** Vor jeder Code-Änderung prüfen!

### **🤖 KI Instructions**
- **[VALIDATED_GUIDE-INSTRUCTIONS-KI-2025-10-15.md](VALIDATED_GUIDE-INSTRUCTIONS-KI-2025-10-15.md)** - KI-Coding Guidelines
  - Präfix-System, Dokumentationsstruktur, Verbotene Muster
  - PATHS.md Integration, Cross-Reference Standards

## 📋 **Contents**

### **🚨 Hotfix Workflows**
- **[HOTFIX-WORKFLOW-PROMPT.md](HOTFIX-WORKFLOW-PROMPT.md)** - Kritischer Hotfix-Prozess
  - Emergency Response Workflow
  - Fast-Track Release Pipeline
  - Critical Fix Validation

### **🚀 Release Workflows**
- **[RELEASE-WORKFLOW-PROMPT.md](RELEASE-WORKFLOW-PROMPT.md)** - Standard Release-Prozess
- **[RELEASE-CHECKLIST-COMPACT.md](RELEASE-CHECKLIST-COMPACT.md)** - Kompakte Release-Checkliste
- **[RELEASE-TROUBLESHOOTING-PROMPT.md](RELEASE-TROUBLESHOOTING-PROMPT.md)** - Release-Debugging Guide

## 🎯 **KI-Navigation**

**Release Workflow:**
1. ✅ **Patch Release:** `pnpm release:patch`
2. ✅ **Minor Release:** `pnpm release:minor`
3. ✅ **Hotfix Release:** Follow `HOTFIX-WORKFLOW-PROMPT.md`

**Bei Release-Problemen:**
1. ✅ **Troubleshooting:** `RELEASE-TROUBLESHOOTING-PROMPT.md`
2. ✅ **Validation:** `pnpm validate:critical-fixes`
3. ✅ **Recovery:** Follow documented procedures

## 🔗 **Related Topics**
- [Project Management](../project-management/) - Status und Planning
- [Critical Fixes](../critical-fixes/) - Fix Preservation
- [Scripts](../../scripts/) - Automation Tools