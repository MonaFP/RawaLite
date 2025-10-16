# 01-core INDEX

> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: VALIDATED_GUIDE-CORE-ARCHITECTURE-INDEX-2025-10-16.md
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

## 🏗️ Übersicht: System-Architektur

### 🎯 Zweck
Architekturelle Entscheidungen, Electron-Konfiguration, System-Design und strukturelle Problemlösungen.

### 📁 Struktur

#### 📋 Root-Dateien
- ✅ `ARCHITEKTUR.md` - **Hauptarchitektur-Dokumentation (inkl. SQLiteAdapter Status)**
- `V1-5-2-CONTEXT-ARCHITECTURE.md` - v1.5.2 ThemeContext + NavigationContext Architektur
- `LESSONS-LEARNED-versionssync-mechanismus.md` - Versionssynchronisation
- `SQLITE-MIGRATION-ARCHITECTURE.md` - SQLite Migration Architektur
- `LESSONS-LEARNED-ipc-filesystem-api.md` - IPC Filesystem API
- `LESSONS-LEARNED-zentrale-pfadabstraktion.md` - Zentrale Pfad-Abstraktion

#### 🔧 troubleshooting/
- **solved/**: Gelöste Architektur-Probleme
  - `ERR_FILE_NOT_FOUND_FIX_COMPLETE.md` - Vollständige ERR_FILE_NOT_FOUND Lösung
  - `ERR_FILE_NOT_FOUND_QUICKREF.md` - Schnelle ERR_FILE_NOT_FOUND Referenz
- **active/**: Bekannte offene Architektur-Probleme

#### ⚡ electron/
- **solved/**: Gelöste Electron-Probleme
  - `LESSONS-LEARNED-electron-html-loading-fehler.md` - HTML Loading Probleme
- **active/**: Bekannte offene Electron-Probleme

### 🚀 KI-Hinweise
- **solved/** → Bewährte Architektur-Lösungen
- **active/** → Bekannte Architektur-Risiken

## 🔗 **Related Topics**

> **See Also:**
> - [Development Workflows](../03-development/) - Development environment and debugging
> - [Database Design](../05-database/) - Database architecture and SQLite integration
> - [IPC Patterns](../07-ipc/) - Inter-process communication architecture
> - [Security](../10-security/) - Security architecture and authentication
> - [Deployment](../11-deployment/) - Deployment architecture and update system