# 🏢 RawaLite


> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** VALIDATED (Archivierte Dokumentation)
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch Dateiname, Schema-Konformität

> **Moderne Desktop-Anwendung für Rechnungs- und Angebotsverwaltung**  
> Electron + React + TypeScript + SQLite  
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

[![Version](https://img.shields.io/badge/version-1.8.117-blue)](https://github.com/MonaFP/RawaLite/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Electron](https://img.shields.io/badge/electron-31.2.0-brightgreen)](https://electronjs.org/)
[![React](https://img.shields.io/badge/react-18.3.1-blue)](https://reactjs.org/)

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: VALIDATED_GUIDE-README-QUICKSTART-2025-10-16.md
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

## 🎯 **Start hier**

- **🤖 KI-Entwicklung:** [docs/00-meta/final/CRITICAL_KI-FAILURE-MODES.md](docs/00-meta/final/CRITICAL_KI-FAILURE-MODES.md) - **MANDATORY READ vor jeder Session**
- **📚 Dokumentation:** [docs/INDEX.md](docs/INDEX.md) - Vollständige Projekt-Dokumentation
- **🛡️ Critical Fixes:** [docs/00-meta/final/CRITICAL-FIXES-REGISTRY.md](docs/00-meta/final/CRITICAL-FIXES-REGISTRY.md) - Geschützte Code-Patterns

## 🚀 **Schnellstart**

```bash
# Installation
pnpm install

# Entwicklung starten
pnpm dev:all

# Production Build
pnpm dist
```

## 📋 **Features**

- 👥 **Kundenverwaltung** - Vollständige Kundendatenbank
- 📦 **Pakete & Services** - Modulare Leistungsbausteine  
- 📄 **Angebotserstellung** - Professionelle Angebote mit Line Items
- 🧾 **Rechnungsstellung** - Automatische Rechnungsgenerierung
- 📊 **Dashboard** - Übersicht und Statistiken
- 🔒 **Offline-First** - Lokale SQLite-Datenbank
- 🎨 **Dark Theme** - Moderne Benutzeroberfläche

## 🏗️ **Technologie-Stack**

- **Frontend:** React 18.3.1 + TypeScript 5.5.4
- **Desktop:** Electron 31.2.0
- **Database:** better-sqlite3 12.4.1 (Native SQLite)
- **Build:** Vite 5.4.0 + esbuild
- **Package Manager:** pnpm

## 📚 **Dokumentation**

### 🎯 **Für Entwickler**
- **[Installation Guide](docs/50-persistence/INSTALL.md)** - Setup & Dependencies
- **[Entwickler-Guide](docs/00-standards/DEV_GUIDE.md)** - Erste Schritte
- **[Coding Standards](docs/00-standards/standards.md)** - Code-Konventionen
- **[Workflows](docs/00-standards/workflows/WORKFLOWS.md)** - Git & CI/CD

### 🏗️ **Architektur**
- **[System-Architektur](docs/10-architecture/ARCHITEKTUR.md)** - Technische Details
- **[Database System](docs/50-persistence/SQLITE-DATABASE-SYSTEM.md)** - SQLite Implementation
- **[IPC Security](docs/60-security/ipc/IPC-DATABASE-SECURITY.md)** - Sicherheitskonzept

### 📖 **Vollständige Übersicht**
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Detaillierte Projektbeschreibung
- **[docs/](docs/)** - Vollständige Dokumentationsstruktur

## 🔧 **Entwicklung**

```bash
# Dependencies installieren
pnpm install

# Development Mode
pnpm dev:all                # Startet Vite + Electron

# Testing
pnpm test              # Unit Tests (Vitest)
pnpm test:critical-fixes  # Critical Fix Regression Tests
pnpm e2e               # E2E Tests (Playwright)

# Linting & Formatting
pnpm lint              # ESLint Check
pnpm typecheck         # TypeScript Check

# Production Build
pnpm build             # Build für Production
pnpm dist              # Electron Installer erstellen

# 🛡️ Fix Preservation System
pnpm validate:critical-fixes  # Validate critical code patterns
pnpm safe:version patch       # Safe version bump with validation
pnpm safe:dist               # Safe build with critical fix validation
```

### 🛡️ **Critical Fix Preservation System**

RawaLite nutzt ein **systematisches Fix-Preservation System** um kritische Bugfixes dauerhaft zu schützen:

- **📋 Central Registry** - [`docs/00-meta/CRITICAL-FIXES-REGISTRY.md`](docs/00-meta/CRITICAL-FIXES-REGISTRY.md)
- **🔍 Automated Validation** - Pattern-Detection bei jedem Build
- **🧪 Regression Tests** - Unit Tests für kritische Code-Patterns  
- **🚫 Pre-commit Hooks** - Automatische Validation vor Git-Commits
- **🤖 KI Guidelines** - GitHub Copilot Integration für Entwickler-KIs

**Verwendung:**
```bash
# Vor Version-Updates:
pnpm validate:critical-fixes  # ✅ Muss erfolgreich sein
pnpm safe:version patch       # Verwendet Validation automatisch

# Bei Code-Änderungen:
# Git pre-commit hook validiert automatisch
git commit -m "..."          # Läuft validation + tests
```

**Geschützte Fixes:**
- WriteStream race condition (Download-Verification)
- File system flush delays (Update-System)  
- Event handler race conditions (Installation)
- Port consistency (Development environment)

## 🗄️ **Database**

RawaLite nutzt **better-sqlite3** als native SQLite-Implementierung mit:

- **WAL Mode** für bessere Performance
- **Hot Backup System** für Datensicherheit
- **Schema Migrations** für Updates
- **IPC-Security** für sichere Kommunikation

## 📁 **Projekt-Struktur**

```
RawaLite/
├── electron/          # Electron Main Process
├── src/               # React Frontend
│   ├── main/db/       # SQLite Database Layer
│   ├── components/    # UI Components
│   ├── pages/         # Route Components
│   ├── hooks/         # Business Logic
│   ├── adapters/      # Data Access Layer
│   └── services/      # External Services
├── docs/              # Dokumentation
├── tests/             # Unit Tests
└── e2e/               # E2E Tests
```

## 🔒 **Sicherheit**

- **Context Isolation** - Sichere Electron-Architektur
- **IPC Whitelisting** - Kontrollierte Main↔Renderer Kommunikation
- **Input Validation** - Schutz vor SQLi und XSS
- **Local-First** - Keine Cloud-Abhängigkeiten

## 📈 **Status**

- ✅ **Version 1.8.117** - Stabile Release
- ✅ **SQLite Migration** - Komplett auf better-sqlite3 migriert
- ✅ **Production Ready** - Vollständige Feature-Set
- 🔄 **Active Development** - Kontinuierliche Verbesserungen

## 🤝 **Contributing**

1. **[Entwickler-Guide](docs/00-standards/DEV_GUIDE.md)** lesen
2. **[Coding Standards](docs/00-standards/standards.md)** befolgen
3. **[Workflow](docs/00-standards/workflows/WORKFLOWS.md)** einhalten
4. Pull Request mit Template erstellen

## 📄 **Lizenz**

MIT License - siehe [LICENSE](LICENSE) für Details.

---

**RawaLite** - Professionelle Rechnungsverwaltung für Desktop  
*Entwickelt mit ❤️ und modernen Web-Technologien*