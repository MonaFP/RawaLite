# 20-paths INDEX

## 🛤️ Übersicht: Pfad-Management

### 🎯 Zweck
Pfad-Abstraktionen, Filesystem-APIs und Pfad-bezogene Konfigurationen.

### 📁 Struktur

#### 📋 Root-Dateien
- **[PATHS-SYSTEM-DOCUMENTATION.md](PATHS-SYSTEM-DOCUMENTATION.md)** - Vollständige PATHS System Dokumentation
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