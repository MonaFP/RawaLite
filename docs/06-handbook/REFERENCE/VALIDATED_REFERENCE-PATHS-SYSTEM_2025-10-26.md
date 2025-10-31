# 🛤️ PATHS System - Management Reference

> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 29.10.2025 (KI-AUTO-DETECTION SYSTEM Integration - CAVE-Trigger entfernt)  
> **Status:** Reference | **Typ:** PATHS System Documentation  
> **Schema:** `VALIDATED_REFERENCE-PATHS-SYSTEM_2025-10-26.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Reference (automatisch durch "PATHS System", "Management Reference" erkannt)
> - **TEMPLATE-QUELLE:** 06-handbook REFERENCE Template
> - **AUTO-UPDATE:** Bei PATHS-System-Änderung automatisch Reference aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "Reference", "PATHS System", "Main/Renderer Process separation"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **🛤️ STATUS = Reference:**
> - ✅ **PATHS-Reference** - Verlässliche Quelle für Filesystem Path Management
> - ✅ **Process-Separation** - Authoritative Regeln für Main/Renderer Process path access
> - 🎯 **AUTO-REFERENCE:** Bei Path-Operations IMMER diese PATHS-Regeln befolgen
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "PATHS VIOLATION" → Emergency Stop + PATHS-Compliance Check

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für PATHS System

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** PATHS system management und filesystem patterns
- **Purpose:** Pfad-Abstraktionen, Filesystem-APIs und Pfad-bezogene Konfigurationen

## 🛤️ **PATHS SYSTEM OVERVIEW**

### 🎯 Zweck
Pfad-Abstraktionen, Filesystem-APIs und Pfad-bezogene Konfigurationen.

### 📁 Struktur

#### 📋 Root-Dateien
- **[PATHS-SYSTEM-DOCUMENTATION.md][def]** - Vollständige PATHS System Dokumentation
  - Zentrale Pfadabstraktion und sichere Filesystem-Integration
  - IPC Pipeline: Renderer → preload.ts → main.ts → app.getPath()
  - Compliance Rules: Main Process = Node.js path OK, Renderer = PATHS only
  - Alle verfügbaren PATH Kategorien und APIs
  - Testing, Debugging, Migration Guide

#### ✅ solved/
Gelöste Pfad-Management Probleme

#### ⚠️ active/
- **[NUMBERING-CIRCLES-INTEGRATION.md](active/NUMBERING-CIRCLES-INTEGRATION.md)** - Frontend-Database Integration für Nummernkreise
  - Dual-System Problem: localStorage vs SQLite Database gelöst
  - Unified IPC Architecture mit React Context
  - Main Process vs Renderer Process korrekte Trennung
  - Direct Database Access Pattern für Main Process
  - Complete Database-driven Numbering Circles System

Bekannte offene Pfad-Probleme

### 🚀 KI-Hinweise
- **PATHS-SYSTEM-DOCUMENTATION.md** → Vollständige Implementation Reference
- **solved/** → Anwendbare Pfad-Lösungen
- **active/** → Bekannte Pfad-Risiken
- **KRITISCH:** Renderer Process darf NIEMALS Node.js path APIs direkt verwenden!

### 🔗 Verwandte Dokumentation
- **[API Compliance Lessons](../05-database/LESSONS-LEARNED-API-PATH-COMPLIANCE.md)** - Legacy API Cleanup Erfahrungen
- **[Security Guidelines](../10-security/INDEX.md)** - Renderer/Main Process Isolation
- **[Persistence Integration](../05-database/INDEX.md)** - Database + PATHS Integration

[def]: PATHS-SYSTEM-DOCUMENTATION.md
