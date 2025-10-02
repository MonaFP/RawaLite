# RawaLite Documentation - KI-Optimierte Struktur

## 🎯 Lückenlose Nummerierung für KI-Navigation

### 📁 Hauptkategorien (00-12)

| Kategorie | Zweck | Status |
|-----------|--------|---------|
| **[00-meta/](00-meta/)** | 🤖 KI-Instruktionen, Standards, Workflows | ✅ Vollständig |
| **[01-architecture/](01-architecture/)** | 🏗️ System-Design, Electron-Architektur | ✅ Migriert |
| **[02-development/](02-development/)** | 👨‍💻 Development Guides, Build Processes | ✅ Konsolidiert |
| **[03-testing/](03-testing/)** | 🧪 Test Strategies, Debugging | 🔄 In Aufbau |
| **[04-database/](04-database/)** | 🗄️ SQLite, Schema-Konsistenz, Field-Mapping | ✅ Vollständig |
| **[05-paths/](05-paths/)** | 🛤️ PATHS System, Filesystem APIs | ✅ Migriert |
| **[06-ipc/](06-ipc/)** | 🔗 IPC Communication, Security | ✅ Konsolidiert |
| **[07-ui/](07-ui/)** | 🎨 UI/UX, Themes, React Components | ✅ Migriert |
| **[08-pdf/](08-pdf/)** | 📄 PDF Generation, Export | ✅ Migriert |
| **[09-security/](09-security/)** | 🔒 Security Guidelines, Validation | ✅ Bereinigt |
| **[10-deployment/](10-deployment/)** | 🚀 Build, Updates, Distribution | ✅ Konsolidiert |
| **[11-lessons/](11-lessons/)** | 📚 Konsolidierte Lessons Learned | 🔄 In Aufbau |
| **[12-deprecated/](12-deprecated/)** | 📦 Legacy Documentation | ✅ Archiviert |

### 🚀 KI-Navigation Prinzipien

#### **Start-Sequenz für KI:**
1. **00-meta/INSTRUCTIONS-KI.md** - Haupt-KI-Instruktionen
2. **00-meta/SCHEMA-CONSISTENCY-STANDARDS.md** - Database Standards
3. **04-database/** - Für alle Database-Arbeiten
4. **01-architecture/** - Für System-Design

#### **Workflow-Orientierte Progression:**
```
Meta Standards → Architecture → Development → Testing → Implementation → Deployment
    00-meta   →  01-arch     →   02-dev    → 03-test →   04-11        →  10-deploy
```

### 📋 active/solved Pattern

Jede Kategorie enthält:
- **active/**: Bekannte offene Probleme/WIP
- **solved/**: Bewährte Lösungspatterns

### 🔄 Migration Status

#### ✅ **Abgeschlossen:**
- Schema-Konsistenz-Reparatur (13 Issues behoben)
- Numbering Circles Integration (Dual-System → Unified IPC)
- Field-Mapper System (100% camelCase↔snake_case)
- PATHS System Compliance
- IPC Architecture Dokumentation
- **KI-Optimierte Dokumentationsreorganisation (00-12 Struktur)**

#### 🎯 **KI-Optimierungen:**
- Lückenlose 00-12 Nummerierung
- Eindeutige Kategorienamen
- Workflow-orientierte Struktur
- Konsolidierte Lessons Learned

### 📋 Change Documentation

- **[00-meta/REORGANIZATION-CHANGE-LOG.md](00-meta/REORGANIZATION-CHANGE-LOG.md)** - Vollständiger Change Log der Reorganisation
- **[00-meta/solved/LESSONS-LEARNED-DOCUMENTATION-REORGANIZATION.md](00-meta/solved/LESSONS-LEARNED-DOCUMENTATION-REORGANIZATION.md)** - Lessons Learned und Best Practices

### 🔗 Legacy Mapping

| Alt (inkonsistent) | Neu (KI-optimiert) | Migration |
|-------------------|-------------------|-----------|
| 00-standards/ | 00-meta/ | ✅ Fertig |
| 10-architecture/ | 01-architecture/ | ✅ Fertig |
| 20-paths/ | 05-paths/ | ✅ Fertig |
| 30-development/ + 30-updates/ | 02-development/ + 10-deployment/ | ✅ Fertig |
| 40-pdf/ | 08-pdf/ | ✅ Fertig |
| 50-persistence/ | 04-database/ | ✅ Fertig |
| 60-security/ | 09-security/ + 06-ipc/ | ✅ Fertig |
| 80-ui-theme/ | 07-ui/ | ✅ Fertig |
| 90-deprecated/ | 12-deprecated/ | ✅ Fertig |
| 99-glossary/ | [Distribuiert] | 🔄 Aufgelöst |