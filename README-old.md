# RawaLite - Professionelle Geschäftsverwaltung

![RawaLite Logo](assets/rawalite-logo.png)

> **Version 1.7.1** - Professionelle Desktop-Anwendung für Geschäftsverwaltung mit einheitlichem Update-System

## 🏢 **Proprietäre Software**

**© 2025 MonaFP. Alle Rechte vorbehalten.**

Dies ist proprietäre Software. Aller Quellcode, Dokumentation und zugehörige Materialien sind vertraulich und durch Urheberrecht geschützt.

## ⚡ **Funktionen**

- � **Kundenverwaltung** - Komplette Kundendatenbank mit Auto-Nummerierung (K-001, K-002, ...)
- 📦 **Paketverwaltung** - Hierarchische Pakete mit Unterpositionen (PAK-001, PAK-002, ...)
- 📋 **Professionelle Angebote** - Vom Entwurf bis zur Annahme-Workflow (AN-2025-0001, ...)
- 🧾 **Rechnungsverwaltung** - Komplettes Abrechnungssystem mit Status-Verfolgung (RE-2025-0001, ...)
- ⏱️ **Leistungsnachweis-Verwaltung** - Tätigkeitsbasierte Zeiterfassung (LN-2025-0001, ...)
- 🎨 **5 Pastel-Themes** - Salbeigrün, Himmelblau, Lavendel, Pfirsich, Rosé mit Custom-Colors
- 🔄 **Flexible Navigation** - Header- oder Sidebar-Navigation mit komplementären Widgets
- 🏢 **Firmen-Branding** - Logo-Integration und professionelle Präsentation
- 📊 **Dashboard-Übersicht** - Echtzeit-Geschäftsstatistiken mit Widget-System
- 💾 **Lokale Datenbank** - Sichere SQLite-basierte Datenspeicherung mit Auto-Migration
- 📄 **PDF-Export** - Production-ready PDF-Generation mit Theme-Integration und DIN 5008 Compliance
- 🔄 **Einheitliches Update-System** - electron-updater mit automatischen Backups & Migration
- 📦 **Robustes Backup-System** - ZIP-basierte Archivierung mit automatischer Datei-Persistierung

## 🚀 **Technologie-Stack (v1.7.1)**

- **Runtime:** Node.js 20, pnpm 10.15.1 (Primary Package Manager)
- **Desktop:** Electron 31.7.7 + electron-updater 6.6.2 (Native PDF Engine)
- **Frontend:** React 18.3.1 + TypeScript 5.9.2 (strict mode)
- **Router:** React Router DOM 7.8.2
- **Build:** Vite 5.4.20 + esbuild 0.23.1 + electron-builder 24.13.3
- **Datenbank:** SQLite (SQL.js 1.13.0) + IndexedDB (Dexie 4.2.0) - Adapter Pattern
- **Testing:** Vitest 2.1.8 (Unit) + Playwright 1.55.0 (E2E)
- **PDF-System:** Native webContents.printToPDF + Theme Integration
- **Update-System:** electron-updater → GitHub Releases (In-App Only)

## � **Installation für Tester**

### **Windows-Installation**

1. **Herunterladen** des Installers: `RawaLite Setup 1.7.1.exe`
2. **Installer ausführen** als Administrator (Rechtsklick → "Als Administrator ausführen")
3. **Installationsassistent** folgen - Installationspfad auswählen
4. **RawaLite starten** über Startmenü oder Desktop-Verknüpfung

### **Automatische Updates (v1.7.1)**

- 🔄 **In-App Updates:** Vollständig integrierte Update-Funktion ohne externe Navigation
- � **Automatische Backups:** Vor jeder Installation wird automatisch ein Backup erstellt
- 🔗 **electron-updater:** Offizielle Update-Library mit latest.yml aus GitHub Releases
- 🛡️ **Sicherheit:** Keine externen Links, alle Updates laufen über die App

## �️ **Development Setup (pnpm-only)**

⚠️ **WICHTIG:** Dieses Projekt ist **PNPM-ONLY**. npm oder yarn werden nicht unterstützt.

### **Voraussetzungen**
- Node.js 20.x
- pnpm 10.x (`npm install -g pnpm`)

### **Installation**
```bash
# Repository klonen
git clone https://github.com/MonaFP/RawaLite.git
cd RawaLite

# Dependencies installieren (PNPM-ONLY)
pnpm install

# Development-Server starten
pnpm dev
```

### **Verfügbare Scripts (pnpm-only)**
```bash
# Development
pnpm dev                    # Vite + Electron Development
pnpm dev:web               # Nur Frontend (Browser)

# Building & Release
pnpm build                 # Production Build
pnpm dist                  # electron-builder → GitHub Release
pnpm release:dry           # Lokaler Build ohne Upload

# Testing & Validation
pnpm test                  # Unit Tests (Vitest)
pnpm e2e                   # E2E Tests (Playwright)
pnpm typecheck             # TypeScript Validation
pnpm lint                  # ESLint Check

# CI Guards (COPILOT_INSTRUCTIONS.md)
pnpm guard:external        # Prüfung auf externe Links
pnpm guard:pdf             # PDF-Template Asset Check
pnpm guard:release:assets  # Release Asset Validation
```

### **Validation Scripts**
```bash
node validate-version-sync.mjs    # package.json ↔ VersionService Sync
node validate-ipc-types.mjs       # IPC Security & Types Check
node guard-release-assets.mjs     # electron-updater Asset Guard
```

## 🔧 **Architektur-Übersicht**

### **Update-System (Neu in v1.7.1)**
```
┌─────────────────────────────────────────────────────────────┐
│                 UpdateOrchestrator Hook                     │
├─────────────────────────────────────────────────────────────┤
│  electron-updater  │  BackupService  │  UpdateService      │
│  (Primary)         │  (ZIP Archives) │  (Migration Only)   │
└─────────────────────────────────────────────────────────────┘
```

**Ein Transport, eine State-Machine, robuste Hooks.**

### **Persistenz-Adapter (Parität)**
```
┌─────────────────────────────────────────────────────────────┐
│            Unified Persistence Interface                    │
├─────────────────────────────────────────────────────────────┤
│   SQLiteAdapter    │      IndexedDBAdapter                 │
│   (Production)     │      (Dev Fallback)                   │
└─────────────────────────────────────────────────────────────┘
```

### **PDF-System (Offline & Deterministisch)**
- **Templates:** `templates/*.html` ohne externe Ressourcen
- **Service:** `PDFService` + `PDFPostProcessor` (einziger Weg)
- **Theme-Integration:** Dynamische Farben aus Settings
- **Assets:** Logos/Fonts lokal eingebettet (Base64/Binary)

## 🔒 **Security & Compliance**

### **IPC Security (contextIsolation: true)**
- Whitelist-basierte IPC-Kanäle in `preload.ts`
- Typisierte IPC-Definitionen in `src/types/ipc.ts`
- Keine dynamischen Channel-Namen oder Shell-Zugriff

### **COPILOT_INSTRUCTIONS.md Compliance**
- ✅ **pnpm-only:** Alle Scripts und CI verwenden ausschließlich pnpm
- ✅ **In-App Updates:** Keine externen Links oder Browser-Navigation
- ✅ **PDF Offline:** Alle Assets eingebettet, keine CDN/HTTP-Ressourcen
- ✅ **Release Pipeline:** electron-builder → GitHub mit Asset-Guards

## 📋 **Changelog v1.7.1 - Update-System Konsolidierung**

### **🔄 Update-System Redesign**
- **Neu:** Einheitlicher UpdateOrchestrator Hook kombiniert electron-updater + Backup + Migration
- **Neu:** Automatische Backups vor jeder Installation (ZIP-basiert)
- **Neu:** Migration-Koordination nach App-Neustart
- **Verbessert:** electron-updater als einziger Transport (GitHub HTTP nur Fallback)
- **Entfernt:** Fragmentierte Update-Wege und externe Navigation aus App-Menü

### **🚀 Release Pipeline Automation**
- **Neu:** pnpm-only Scripts mit npm-run-all2 für parallele Ausführung
- **Neu:** Asset-Guard Scripts für Release-Validation (latest.yml, .exe, .blockmap, .zip)
- **Neu:** electron-builder → GitHub automatische Publikation
- **Fix:** TypeScript-Fehler in UpdatesPage.tsx behoben (orchestrated state API)

### **🛡️ Security & Compliance**
- **Entfernt:** shell.openExternal aus App-Menü und IPC-Handler
- **Neu:** CI Guards für externe Links und PDF-Assets
- **Neu:** IPC Security Validator mit Type-Konsistenz-Checks
- **Verbessert:** ESLint-Konfiguration mit Test-Script-Ausschluss

## 📚 **Weitere Dokumentation**

- `docs/PROJECT_OVERVIEW.md` - Vollständige Projekt-Architektur
- `docs/THEMES_NAVIGATION.md` - Theme-System und Navigation
- `docs/PDF_SYSTEM.md` - PDF-Generation und Templates
- `docs/RELEASE_GUIDELINES.md` - Release-Prozess und Asset-Management
- `.github/copilot-instructions.md` - Entwicklungsrichtlinien (unveränderlich)

---

**© 2025 MonaFP. Alle Rechte vorbehalten.**
- **Build**: Vite 5.4.20 + electron-builder 24.13.3
- **Package Manager**: pnpm 10.15.1

### **Produktionsreife Features**
- ✅ **Auto-Update System**: GitHub Releases Integration
- ✅ **PDF-Generation**: Theme-aware mit DIN 5008 Compliance
- ✅ **Extended Debug**: Umfassende Diagnostik-Pipeline
- ✅ **Template Engine**: Handlebars-kompatible PDF-Templates
- ✅ **Theme System**: 5 Pastel-Themes mit Navigation-Modi
- ✅ **Migration System**: Automatic database schema evolution

### **Debugging Excellence**
RawaLite v1.5.6 implementiert **Extended Debug Patterns** als Standard:
- 🔍 **Template Diagnostics**: Variable resolution tracking
- 📊 **Processing Order**: Conditionals → Formatters → Variables
- 🔄 **Field Mapping**: Comprehensive data flow analysis
- ⚡ **5-10x Faster**: Immediate problem identificationaltungslösung
## 📋 **Changelog v1.7.1 - Update-System Konsolidierung**

### **🔄 Update-System Redesign**
- **Neu:** Einheitlicher UpdateOrchestrator Hook kombiniert electron-updater + Backup + Migration
- **Neu:** Automatische Backups vor jeder Installation (ZIP-basiert)
- **Neu:** Migration-Koordination nach App-Neustart
- **Verbessert:** electron-updater als einziger Transport (GitHub HTTP nur Fallback)
- **Entfernt:** Fragmentierte Update-Wege und externe Navigation aus App-Menü

### **🚀 Release Pipeline Automation**
- **Neu:** pnpm-only Scripts mit npm-run-all2 für parallele Ausführung
- **Neu:** Asset-Guard Scripts für Release-Validation (latest.yml, .exe, .blockmap, .zip)
- **Neu:** electron-builder → GitHub automatische Publikation
- **Fix:** TypeScript-Fehler in UpdatesPage.tsx behoben (orchestrated state API)

### **🛡️ Security & Compliance**
- **Entfernt:** shell.openExternal aus App-Menü und IPC-Handler
- **Neu:** CI Guards für externe Links und PDF-Assets
- **Neu:** IPC Security Validator mit Type-Konsistenz-Checks
- **Verbessert:** ESLint-Konfiguration mit Test-Script-Ausschluss

## 🔧 **Troubleshooting & Known Issues**

### **Update-System**
```bash
# Update-Logs prüfen (Electron DevTools)
# Hauptprozess: Electron → Toggle Developer Tools
# Renderer: F12 → Console

# Manueller Backup vor kritischen Updates
pnpm run backup:manual

# Update-Cache leeren (falls Updates nicht erkannt werden)
# Windows: %APPDATA%/RawaLite/updates/*
# Datei löschen und App neu starten
```

### **Development**
```bash
# Falls pnpm install fehlschlägt
pnpm store prune           # Cache leeren
rm -rf node_modules        # Dependencies neu installieren
pnpm install

# TypeScript-Fehler nach Updates
pnpm typecheck             # Vollständige Validierung
pnpm lint                  # Lint-Regeln prüfen

# Asset-Guards vor Release
node guard-release-assets.mjs    # electron-updater Vollständigkeit
node validate-version-sync.mjs   # Version-Synchronisation
```

## 📚 **Weitere Dokumentation**

- `docs/PROJECT_OVERVIEW.md` - Vollständige Projekt-Architektur
- `docs/THEMES_NAVIGATION.md` - Theme-System und Navigation
- `docs/PDF_SYSTEM.md` - PDF-Generation und Templates
- `docs/RELEASE_GUIDELINES.md` - Release-Prozess und Asset-Management
- `.github/copilot-instructions.md` - Entwicklungsrichtlinien (unveränderlich)

---

**© 2025 MonaFP. Alle Rechte vorbehalten.**

1. **win-unpacked Ordner** aus Distribution extrahieren
2. **RawaLite.exe** direkt ausführen (keine Installation erforderlich)
3. **Daten bleiben lokal** im Anwendungsverzeichnis

### **Erststart**

1. **Firmendaten einrichten** - Gehe zu Einstellungen → Firmendaten
2. **Theme auswählen** - Einstellungen → Design (5 Pastel-Themes verfügbar)
3. **Navigation konfigurieren** - Header- oder Sidebar-Modus
4. **Auto-Nummerierung prüfen** - Einstellungen → Nummernkreise
5. **Tätigkeiten erstellen** - Einstellungen → Tätigkeiten (für Leistungsnachweise)
6. **Beginnen** mit dem ersten Kunden

### **Test-Bereiche (Version 1.5.6 - Production Ready)**

- ✅ **PDF-Generation** - Theme-aware mit nativer Electron PDF-Engine
- ✅ **Extended Debug System** - Umfassende Diagnostik für alle Komponenten
- ✅ **Template Engine** - Handlebars-kompatible PDF-Templates mit korrekter Processing-Order
- ✅ **Auto-Nummerierung** - Sequentielle und jährliche Nummernkreise
- ✅ **Theme-System** - 5 Pastel-Themes + Custom Colors mit sofortiger Anwendung
- ✅ **Navigation-Modi** - Header/Sidebar-Navigation mit Widget-Positionierung
- ✅ **SQLite-Persistierung** - Design-Settings überleben App-Reload
- ✅ **Kundenverwaltung** (erstellen, bearbeiten, löschen) mit K-xxx Nummern
- ✅ **Paketerstellung** mit hierarchischer Struktur (PAK-xxx)
- ✅ **Angebots-Workflow** (Entwurf → versendet → angenommen) AN-2025-xxxx
- ✅ **Rechnungsgenerierung** und Status-Verfolgung (RE-2025-xxxx)
- ✅ **Leistungsnachweis-Erstellung** mit Tätigkeiten (LN-2025-xxxx)
- ✅ **Theme-aware PDF-Export** für alle Dokumente mit DIN 5008 Compliance
- ✅ **Update-System** - GitHub Releases Integration
- ✅ **Einstellungskonfiguration** mit Reload-Persistierung

## 📋 **Systemanforderungen**

- **Windows:** 10/11 (x64)
- **macOS:** 10.15+ (Intel/Apple Silicon) *[Geplant]*
- **Linux:** Ubuntu 18.04+ oder gleichwertig *[Geplant]*
- **Arbeitsspeicher:** 4GB RAM minimum (8GB empfohlen)
- **Speicherplatz:** 200MB freier Speicherplatz
- **Internet:** Für Update-Checks (optional)

## � **Test-System & Qualitätssicherung**

### **Unit Tests (Vitest)**
```bash
pnpm test                    # Läuft Unit Tests für Business Logic
```

**Aktuelle Test-Coverage:**
- ✅ **Auto-Nummerierung** - SettingsAdapter.test.ts (4 Tests)
  - Sequentielle Kundennummern (K-001, K-002, ...)
  - Jährliche Angebots-/Rechnungsnummern (AN-2025-0001, RE-2025-0001, ...)
  - Jahreswechsel-Reset für yearly numbering
  - Error handling für unbekannte Nummernkreise

### **Integration Tests (Node.js)**
```bash
# Database & Persistence Tests
node tests/integration/database/verification.js

# Design System Tests  
node tests/integration/design/persistence.js

# Update System Tests
node tests/integration/update-system/github-api.js
```

**Test-Struktur:**
```
tests/
├── unit/                    # Vitest Unit Tests
│   ├── SettingsAdapter.test.ts  # ✅ Auto-Nummerierung
│   └── hooks/               # Hook Tests (Pfad-Issues)
└── integration/             # Node.js Integration Tests
    ├── database/            # ✅ SQLite & Persistence
    ├── design/              # ✅ Theme & UI Tests
    ├── persistence/         # ✅ Data Consistency  
    └── update-system/       # ✅ GitHub API & Updates
```

## 🏗️ **Build & Distribution (Production Ready)**

### **Development**
```bash
pnpm dev                     # Electron + Vite Development mit Extended Debug
pnpm typecheck               # TypeScript Validation
pnpm lint                    # ESLint Code Quality
```

### **Production Build**
```bash
pnpm build                   # Vite Production Build + Electron Bundle
pnpm dist                    # Electron Distributables (Setup.exe + portable)
```

**Build-Ergebnisse (v1.5.6):**
- **RawaLite Setup 1.5.6.exe** - ~170 MB Installer für Windows
- **win-unpacked/** - Portable Version (keine Installation)
- **Build-Zeit** - ~4 Sekunden für kompletten Build
- **PDF-Engine** - Native Electron webContents.printToPDF integriert
- **Extended Debug** - Comprehensive diagnostics im Development Build

### **GitHub Release Workflow**
```bash
# Version Management (package.json + VersionService.ts synchron halten)
& "C:\Program Files\GitHub CLI\gh.exe" release create v1.5.6 \
  --title "RawaLite v1.5.6 - Production-Ready PDF System" \
  --notes "✅ Native PDF Engine ✅ Extended Debug ✅ Theme Integration"
```

## 🐛 **Tests & Feedback (v1.5.6)**

**Für Beta-Tester:**

1. **PDF-Generation testen** - Theme-aware Export für alle Dokumente
2. **Extended Debug prüfen** - Template variable resolution validation
3. **Theme-Integration testen** - Dynamische Farben in generierten PDFs
4. **Kern-Features prüfen** (Auto-Nummerierung, Theme-System, Navigation)
5. **Update-System testen** - GitHub Release Detection 
6. **Performance prüfen** - UI-Reaktionsfähigkeit, SQLite-Operations

**Bekannte Issues:**
- Hook Unit Tests haben Import-Pfad-Probleme (werden debugged)
- Cache-Warnungen in Electron (harmlos, Permission-Issue)
- Setup.exe benötigt Admin-Rechte für Installation

**Performance-Metriken:**
- **App-Start** - ~2-3 Sekunden (inkl. SQLite-Initialisierung)
- **Theme-Switching** - Sofort (< 100ms)
- **Database-Queries** - < 50ms für typische CRUD-Operationen
- **PDF-Generation** - 1-3 Sekunden je nach Komplexität

**BEHOBEN in v1.5.6:**
- ✅ **Datenverlust beim App-Neustart** - Business-Daten werden jetzt garantiert persistiert
- ✅ **Memory-Only Storage Bug** - run() und withTx() führen automatische Persistierung durch
- ✅ **Design-Settings nach Reload** - Theme und Navigation-Modus bleiben erhalten

## 🔄 **Updates & Releases**

### **Version 1.5.6 - Kritische Datenpersistierung behoben** 🔥
- **CRITICAL FIX:** Behebt Datenverlust beim App-Neustart
- **Problemanalyse:** Business-Daten wurden nur in Memory gespeichert, nie persistiert
- **Lösung:** Automatische Persistierung nach jeder Datenänderung (run/withTx)
- **Deutsches Menü:** Entfernt Development-Features für Enduser
- **Installer:** Klassischer Dialog mit Pfad-Auswahl (oneClick=false)
- **Vollständige Datensicherheit:** Alle CRUD-Operationen werden garantiert gespeichert

### **Version 1.5.5 - Design-Settings Reload-Persistierung**
- **Theme-Persistierung:** Design-Einstellungen überleben App-Reload
- **SQLite-Optimierung:** Race-Conditions zwischen Hooks behoben
- **Datenschutz:** Persönliche Hardware-Daten aus Releases entfernt

**GitHub Releases Integration:**
- **Repository:** [MonaFP/RawaLite](https://github.com/MonaFP/RawaLite)
- **Update-Check:** Automatisch über GitHub API
- **Download:** Manuell über Browser (Setup.exe Download)
- **Daten-Erhaltung:** SQLite-Datenbank bleibt bei Updates erhalten

**Release-Workflow:**
```bash
# Version aktualisieren (package.json + VersionService.ts)
git tag v1.5.6 && git push origin main --tags
& "C:\Program Files\GitHub CLI\gh.exe" release create v1.5.6 --title "..." --notes "..."
```

## 📚 **Dokumentation (v1.5.6)**

### **Comprehensive Documentation Suite**
- **[PDF System Architecture](docs/PDF_SYSTEM.md)** - Native PDF Engine, Template Processing, Debug Patterns
- **[Extended Debug Standards](docs/DEBUGGING_STANDARDS.md)** - Comprehensive diagnostics methodology
- **[Projektübersicht](PROJECT_OVERVIEW.md)** - v1.5.6 Architektur & Production-Ready Features
- **[Entwicklerhandbuch](docs/DEV_GUIDE.md)** - Extended Debug Pattern als Standard
- **[Architektur](docs/ARCHITEKTUR.md)** - PDF Generation & Debug Layer
- **[Theme-System](docs/THEMES_NAVIGATION.md)** - Design & Navigation
- **[Installationsanleitung](docs/INSTALL.md)** - Detaillierte Installationsanweisungen

### **Technical Deep Dives**
- **PDF Engine**: Native Electron webContents.printToPDF with theme integration
- **Template System**: Handlebars-compatible with corrected processing order
- **Debug Architecture**: Extended patterns for 5-10x faster development cycles
- **GitHub Integration**: Real API integration for update system (NO simulation)

## 📞 **Support & Development (v1.5.6)**

**Für Entwickler (Extended Debug Environment):**
```bash
# Voraussetzungen
Node.js 20.18.0, pnpm 10.15.1, PowerShell 7.5.2

# Installation
git clone https://github.com/MonaFP/RawaLite.git
cd RawaLite
pnpm install

# Entwicklung mit Extended Debug (Standard)
pnpm dev                     # Extended Debug aktiviert für alle Komponenten

# Debugging Excellence
# - Template variable resolution tracking
# - Field mapping validation
# - Processing order diagnostics
# - 5-10x faster problem identification

# Testing Suite
pnpm test                    # Unit Tests (Vitest)
pnpm e2e                     # E2E Tests (Playwright)
node tests/integration/database/verification.js  # Integration Tests

# Production Build
pnpm build && pnpm dist     # Native PDF Engine + Extended Debug
```

**Production-Ready Environment:**
- **OS:** Windows mit PowerShell v7.5.2 (Core) 
- **PDF Engine:** Native Electron webContents.printToPDF
- **Debug System:** Extended patterns für immediate problem detection
- **Package Manager:** pnpm (Performance-optimiert für große Projekte)
- **VS Code:** Latest LTS mit TypeScript IntelliSense

---

**RawaLite** - Professionelle Geschäftsverwaltung leicht gemacht.  
© 2025 MonaFP. Alle Rechte vorbehalten.
