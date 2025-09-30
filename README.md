# 🏢 RawaLite

> **Moderne Desktop-Anwendung für Rechnungs- und Angebotsverwaltung**  
> Electron + React + TypeScript + SQLite

[![Version](https://img.shields.io/badge/version-1.8.117-blue)](https://github.com/MonaFP/RawaLite/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Electron](https://img.shields.io/badge/electron-31.2.0-brightgreen)](https://electronjs.org/)
[![React](https://img.shields.io/badge/react-18.3.1-blue)](https://reactjs.org/)

## 🚀 **Schnellstart**

```bash
# Installation
pnpm install

# Entwicklung starten
pnpm dev

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
pnpm dev                # Startet Vite + Electron

# Testing
pnpm test              # Unit Tests (Vitest)
pnpm e2e               # E2E Tests (Playwright)

# Linting & Formatting
pnpm lint              # ESLint Check
pnpm typecheck         # TypeScript Check

# Production Build
pnpm build             # Build für Production
pnpm dist              # Electron Installer erstellen
```

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