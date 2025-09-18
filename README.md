# RawaLite - Professionelle Geschäftsverwaltung

![RawaLite Logo](./assets/rawalite-logo.png)

> **Version 1.7.5** - Desktop-Anwendung für Geschäftsverwaltung mit einheitlichem Update-System

## 🏢 **Proprietäre Software**

**© 2025 MonaFP. Alle Rechte vorbehalten.**

## ⚡ **Funktionen**

- 👥 **Kundenverwaltung** - Auto-Nummerierung (K-001, K-002...)
- 📦 **Paketverwaltung** - Hierarchische Pakete (PAK-001...)
- 📋 **Angebote** - Workflow (AN-2025-0001...)
- 🧾 **Rechnungen** - Abrechnungssystem (RE-2025-0001...)
- ⏱️ **Leistungsnachweise** - Zeiterfassung (LN-2025-0001...)
- 🎨 **5 Pastel-Themes** - Mit Custom-Colors
- 🔄 **Flexible Navigation** - Header/Sidebar mit Widgets
- 📄 **PDF-Export** - Theme-Integration, DIN 5008
- 🔄 **Einheitliches Update-System** - electron-updater + Backups

## 🚀 **Tech-Stack (v1.7.5)**

- **Runtime:** Node.js 20, **pnpm 10.15.1** (Primary Package Manager)
- **Desktop:** Electron 31.7.7 + electron-updater 6.6.2
- **Frontend:** React 18.3.1 + TypeScript 5.9.2 (strict)
- **Build:** Vite 5.4.20 + electron-builder 24.13.3
- **DB:** SQLite (sql.js) + IndexedDB (Dexie) - Adapter Pattern
- **Update:** electron-updater → GitHub Releases (In-App Only)

## 📦 **Installation**

### **Windows**
1. Download: `RawaLite Setup 1.7.1.exe`
2. Als Administrator ausführen
3. Installationsassistent folgen

### **Automatische Updates (v1.7.1)**
- 🔄 In-App Updates ohne externe Navigation
- 📦 Automatische Backups vor Installation
- 🛡️ Vollständig über electron-updater

## 🛠️ **Development (pnpm-only)**

⚠️ **WICHTIG:** Dieses Projekt ist **PNPM-ONLY**. npm/yarn nicht unterstützt.

```bash
# Setup
pnpm install
pnpm dev                    # Vite + Electron

# Building & Release
pnpm build                 # Production Build
pnpm dist                  # electron-builder → GitHub Release
pnpm release:dry           # Lokaler Build

# Testing & Validation
pnpm test                  # Unit Tests (Vitest)
pnpm typecheck             # TypeScript
pnpm lint                  # ESLint

# CI Guards (COPILOT_INSTRUCTIONS.md)
pnpm guard:external        # Keine externen Links
pnpm guard:pdf             # PDF-Assets offline
pnpm guard:release:assets  # Release Assets complete
```

### **Validation Scripts**
```bash
node validate-version-sync.mjs    # package.json ↔ VersionService
node validate-ipc-types.mjs       # IPC Security Check
node guard-release-assets.mjs     # electron-updater Assets
```

## � **Dokumentation**

### 📖 **Hauptdokumentation**
- **[📊 System Status (v1.7.2)](docs/SYSTEM_STATUS_V1_7_2.md)** - Vollständiger aktueller Status
- **[📋 Projekt-Übersicht](docs/PROJECT_OVERVIEW.md)** - Architektur & Features
- **[🛠️ Developer Guide](docs/DEV_GUIDE.md)** - Setup & Development
- **[📚 Dokumentations-Übersicht](docs/README.md)** - Alle verfügbaren Docs

### 🔧 **Spezial-Dokumentation**
- **[🎨 Themes & Navigation](docs/THEMES_NAVIGATION.md)** - UI/UX System
- **[📄 PDF System](docs/PDF_SYSTEM.md)** - Template Engine & Generation
- **[🔄 Auto-Updater](docs/AUTO_UPDATER_IMPLEMENTATION.md)** - Update-System
- **[🚀 Release Process](docs/RELEASE_PROCESS.md)** - Build & Deployment

---

## �🔧 **Architektur**

### **Update-System (v1.7.1)**
```
UpdateOrchestrator Hook
├── electron-updater (Primary)
├── BackupService (ZIP Archives)
└── UpdateService (Migration Only)
```

**Ein Transport, eine State-Machine, robuste Hooks.**

### **Persistenz-Adapter**
```
Unified Interface
├── SQLiteAdapter (Production)
└── IndexedDBAdapter (Dev Fallback)
```

## 🔒 **Security & Compliance**

- ✅ **pnpm-only:** Alle Scripts verwenden ausschließlich pnpm
- ✅ **In-App Updates:** Keine externen Links/Browser-Navigation
- ✅ **PDF Offline:** Alle Assets eingebettet, keine CDN/HTTP
- ✅ **IPC Security:** contextIsolation: true, typisierte Kanäle
- ✅ **Release Pipeline:** electron-builder → GitHub mit Asset-Guards

## 📋 **Changelog v1.7.1**

### **🔄 Update-System Redesign**
- **Neu:** UpdateOrchestrator Hook (electron-updater + Backup + Migration)
- **Neu:** Automatische ZIP-Backups vor Installation
- **Verbessert:** electron-updater als einziger Transport
- **Entfernt:** Externe Navigation aus App-Menü

### **🚀 Release Pipeline**
- **Neu:** pnpm-only Scripts mit npm-run-all2
- **Neu:** Asset-Guard für Release-Validation
- **Fix:** TypeScript-Fehler in UpdatesPage.tsx

### **🛡️ Security**
- **Entfernt:** shell.openExternal aus IPC
- **Neu:** CI Guards für externe Links/PDF-Assets
- **Neu:** IPC Security Validator

## 🔧 **Troubleshooting**

### **Updates**
```bash
# Update-Logs prüfen: F12 → Console
# Cache leeren: %APPDATA%/RawaLite/updates/* löschen
```

### **Development**
```bash
# Dependencies zurücksetzen
pnpm store prune && rm -rf node_modules && pnpm install

# Vollvalidierung
pnpm typecheck && pnpm lint
node validate-version-sync.mjs
```

## 📚 **Dokumentation**

- `docs/PROJECT_OVERVIEW.md` - Vollständige Architektur
- `docs/THEMES_NAVIGATION.md` - Theme-System
- `docs/PDF_SYSTEM.md` - PDF-Generation
- `.github/copilot-instructions.md` - Entwicklungsrichtlinien

---

**© 2025 MonaFP. Alle Rechte vorbehalten.**