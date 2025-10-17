# 🛠️ Installation & Setup - RawaLite

> **Vollständige Installations-Anleitung** für Entwicklung und Deployment
> 
> **Letzte Aktualisierung:** 29. September 2025 | **Version:** 1.1.0

---

## 🎯 **Systemanforderungen**

### **Entwicklung**
- **Node.js:** Version 20.x oder höher
- **pnpm:** Version 9.x (Package Manager)
- **Git:** Für Versionskontrolle
- **VS Code:** Empfohlener Editor (optional)

### **Build & Deployment (Windows)**
- **NSIS:** Erforderlich für Windows-Installer-Build
- **Windows SDK:** Für native Dependencies
- **Code Signing Certificate:** Optional für signierte Builds

---

## 🚀 **Schnellstart (Entwicklung)**

```bash
# 1. Repository klonen
git clone <repository-url>
cd RawaLite

# 2. Dependencies installieren  
pnpm install --frozen-lockfile

# 3. Development Server starten
pnpm dev

# 4. In separatem Terminal: Tests ausführen
pnpm test
```

---

## 📦 **Build-Befehle**

```bash
# Development Build
pnpm dev:all              # Startet Vite + Electron im Dev-Modus

# Production Build
pnpm build            # TypeScript + Vite Production Build

# Distribution Build  
pnpm dist             # Erstellt NSIS-Installer für Windows

# Testing
pnpm test             # Unit Tests mit Vitest
pnpm e2e              # End-to-End Tests mit Playwright
pnpm typecheck        # TypeScript Validation
pnpm lint             # ESLint Code Quality Check
```

---

## 🔧 **Erweiterte Konfiguration**

### **IDE Setup (VS Code)**
Empfohlene Extensions:
- TypeScript + JavaScript
- ESLint
- Prettier
- Electron

### **Debugging Setup**
- React DevTools für Frontend-Debugging
- Electron DevTools für Main Process
- VS Code Debugger-Konfiguration verfügbar

---

## 🚨 **Troubleshooting**

**Node Version Issues:**
```bash
nvm install 20
nvm use 20
```

**PNPM Installation:**
```bash
npm install -g pnpm@9
```

**Build Failures:**
- Siehe [debugging.md](../03-development/debugging.md) für systematische Debugging-Hilfe

---

*Detaillierte Setup-Informationen und Troubleshooting in der vollständigen Dokumentation verfügbar.*