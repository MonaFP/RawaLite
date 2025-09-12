# RawaLite - Professionelle Geschäftsverwaltungslösung

![RawaLite Logo](assets/rawalite-logo.png)

> **Version 1.5.6** - Professionelle Desktop-Anwendung für Geschäftsverwaltung

## 🏢 **Proprietäre Software**

**© 2025 MonaFP. Alle Rechte vorbehalten.**

Dies ist proprietäre Software. Aller Quellcode, Dokumentation und zugehörige Materialien sind vertraulich und durch Urheberrecht geschützt.

## ⚡ **Funktionen**

- 👥 **Kundenverwaltung** - Komplette Kundendatenbank mit Auto-Nummerierung (K-001, K-002, ...)
- 📦 **Paketverwaltung** - Hierarchische Pakete mit Unterpositionen (PAK-001, PAK-002, ...)
- 📋 **Professionelle Angebote** - Vom Entwurf bis zur Annahme-Workflow (AN-2025-0001, ...)
- 🧾 **Rechnungsverwaltung** - Komplettes Abrechnungssystem mit Status-Verfolgung (RE-2025-0001, ...)
- ⏱️ **Leistungsnachweis-Verwaltung** - Tätigkeitsbasierte Zeiterfassung (LN-2025-0001, ...)
- 🎨 **5 Pastel-Themes** - Salbeigrün, Himmelblau, Lavendel, Pfirsich, Rosé mit Custom-Colors
- 🔄 **Flexible Navigation** - Header- oder Sidebar-Navigation mit komplementären Widgets
- 🏢 **Firmen-Branding** - Logo-Integration und professionelle Präsentation
- 📊 **Dashboard-Übersicht** - Echtzeit-Geschäftsstatistiken mit Widget-System
- 💾 **Lokale Datenbank** - Sichere SQLite-basierte Datenspeicherung mit Auto-Migration
- 📄 **PDF-Export** - Professionelle Dokumentenerstellung (jsPDF + html2canvas)
- 🔄 **GitHub-Integration** - Automatische Update-Erkennung über GitHub Releases API
- 📦 **Backup-System** - ZIP-basierte Archivierung mit JSZip

## 🚀 **Technologie-Stack**

- **Desktop:** Electron 31.7.7
- **Frontend:** React 18.3.1 + TypeScript 5.9.2
- **Router:** React Router DOM 7.8.2
- **Datenbank:** SQLite (SQL.js 1.13.0) + IndexedDB (Dexie 4.2.0)
- **Build:** Vite 5.4.20 + esbuild 0.23.1
- **Package Manager:** pnpm 10.15.1
- **Testing:** Vitest 2.1.8 (Unit) + Playwright 1.55.0 (E2E) + Node.js (Integration)
- **Business Logic:** jsPDF 3.0.2, html2canvas 1.4.1, JSZip 3.10.1

## 📦 **Installation für Tester**

### **Windows-Installation**

1. **Herunterladen** des Installers: `RawaLite Setup 1.5.6.exe` (167 MB)
2. **Installer ausführen** als Administrator (Rechtsklick → "Als Administrator ausführen")
3. **Installationsassistent** folgen - **Klassischer Dialog:** Installationspfad auswählen
4. **RawaLite starten** über Startmenü oder Desktop-Verknüpfung

### **Portable Version**

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

### **Test-Bereiche (Version 1.5.5)**

- ✅ **Auto-Nummerierung** - Sequentielle und jährliche Nummernkreise
- ✅ **Theme-System** - 5 Pastel-Themes + Custom Colors mit sofortiger Anwendung
- ✅ **Navigation-Modi** - Header/Sidebar-Navigation mit Widget-Positionierung
- ✅ **SQLite-Persistierung** - Design-Settings überleben App-Reload
- ✅ **Kundenverwaltung** (erstellen, bearbeiten, löschen) mit K-xxx Nummern
- ✅ **Paketerstellung** mit hierarchischer Struktur (PAK-xxx)
- ✅ **Angebots-Workflow** (Entwurf → versendet → angenommen) AN-2025-xxxx
- ✅ **Rechnungsgenerierung** und Status-Verfolgung (RE-2025-xxxx)
- ✅ **Leistungsnachweis-Erstellung** mit Tätigkeiten (LN-2025-xxxx)
- ✅ **PDF-Export-Funktionalität** für alle Dokumente
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

## 🏗️ **Build & Distribution**

### **Development**
```bash
pnpm dev                     # Electron + Vite Development Server
pnpm typecheck               # TypeScript Validation
pnpm lint                    # ESLint Code Quality
```

### **Production Build**
```bash
pnpm build                   # Vite Production Build + Electron Bundle
pnpm dist                    # Electron Distributables (Setup.exe + portable)
```

**Build-Ergebnisse:**
- **RawaLite Setup 1.5.5.exe** - 167 MB Installer für Windows
- **win-unpacked/** - Portable Version (keine Installation)
- **Build-Zeit** - ~4 Sekunden für kompletten Build
- **Bundle-Größe** - 553 kB (komprimiert), alle Chunks < 500 kB

## 🐛 **Tests & Feedback**

**Für Beta-Tester:**

1. **Kern-Features testen** (Auto-Nummerierung, Theme-System, Navigation)
2. **Theme-Wechsel prüfen** - Alle 5 Pastel-Themes + Custom Colors
3. **Reload-Persistierung testen** - Settings bleiben nach App-Neustart erhalten
4. **PDF-Export ausprobieren** für alle Dokumente (Angebote, Rechnungen, etc.)
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

## 📚 **Dokumentation**

- **[Installationsanleitung](docs/INSTALL.md)** - Detaillierte Installationsanweisungen
- **[Projektübersicht](PROJECT_OVERVIEW.md)** - Architektur & Test-System
- **[Entwicklerhandbuch](docs/DEV_GUIDE_NEW.md)** - Für Entwickler
- **[Architektur](docs/ARCHITEKTUR_NEW.md)** - Technische Details
- **[Theme-System](docs/THEMES_NAVIGATION.md)** - Design & Navigation

## 📞 **Support & Development**

**Für Entwickler:**
```bash
# Voraussetzungen
Node.js 20.18.0, pnpm 10.15.1, PowerShell 7.5.2

# Installation
git clone https://github.com/MonaFP/RawaLite.git
cd RawaLite
pnpm install

# Entwicklung starten
pnpm dev                     # Port wechselt automatisch (5173, 5174, 5175, ...)

# Testing
pnpm test                    # Unit Tests (Vitest)
pnpm e2e                     # E2E Tests (Playwright)
node tests/integration/database/verification.js  # Integration Tests

# Production
pnpm build && pnpm dist     # Vollständiger Build + Distribution
```

**Entwicklungsumgebung:**
- **OS:** Windows mit PowerShell v7.5.2 (Core)
- **Node.js:** v20.18.0
- **Package Manager:** pnpm (NICHT npm!)
- **VS Code:** Latest LTS mit TypeScript IntelliSense

---

**RawaLite** - Professionelle Geschäftsverwaltung leicht gemacht.  
© 2025 MonaFP. Alle Rechte vorbehalten.
