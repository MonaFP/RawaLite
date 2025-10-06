# 👥 Team Onboarding Guide - RawaLite

> **Setup-Guide für neue Entwickler und das Fix-Preservation System**  
> **Erstellt:** 2025-10-03 | **Status:** Production Ready

---

## 🎯 **Übersicht**

Dieser Guide hilft neuen Team-Mitgliedern beim Setup von RawaLite und erklärt das **Critical Fix Preservation System**.

## 🚀 **Schneller Einstieg (5 Minuten)**

### **1. Repository Setup**
```bash
# 1. Repository klonen
git clone https://github.com/MonaFP/RawaLite.git
cd RawaLite

# 2. Dependencies installieren (pnpm erforderlich!)
pnpm install

# 3. Entwicklung starten
pnpm dev:all
```

### **2. Fix-Preservation System testen**
```bash
# Kritische Fixes validieren
pnpm validate:critical-fixes

# Regression Tests ausführen
pnpm test:critical-fixes

# Test: Commit blockieren (sollte funktionieren)
git add .
git commit -m "test commit"  # Läuft validation automatisch
```

## 🛡️ **Fix-Preservation System verstehen**

### **Was ist das?**
Ein **4-Schicht-Verteidigungssystem** gegen kritische Bugfix-Regression:

1. **📋 Central Registry** - Dokumentiert alle kritischen Fixes
2. **🔍 Automated Validation** - Überprüft Code-Patterns automatisch  
3. **🧪 Regression Tests** - Unit Tests für kritische Fixes
4. **🚫 Pre-commit Hooks** - Blockiert gefährliche Commits

### **Warum existiert es?**
**Problem:** Kritische Fixes (z.B. WriteStream race conditions) sind bereits 3x verloren gegangen durch:
- Version-Updates ohne Validation
- KI-Code-Refactoring ohne Pattern-Awareness
- Copy-Paste ohne Verständnis der ursprünglichen Bugfixes

**Lösung:** Systematische Preservation mit automatischer Validation.

## 📋 **Die 4 Schichten im Detail**

### **Schicht 1: Central Registry**
📍 `docs/00-meta/CRITICAL-FIXES-REGISTRY.md`

**Zweck:** Single Source of Truth für alle kritischen Fixes

**Enthält:**
- Exakte Code-Patterns die erhalten bleiben müssen
- Begründung warum der Fix kritisch ist
- Dateipfade und betroffene Funktionen

### **Schicht 2: Automated Validation**  
📍 `scripts/validate-critical-fixes.mjs`

**Zweck:** Automatische Pattern-Detection zur Laufzeit

**Funktionen:**
- Scannt Source-Code nach kritischen Patterns
- Erkennt gefährliche Anti-Patterns  
- Farbige Output mit detailliertem Report

```bash
# Manuell ausführen:
pnpm validate:critical-fixes
```

### **Schicht 3: Regression Tests**
📍 `tests/critical-fixes/CriticalPatterns.test.ts`

**Zweck:** Unit Tests die kritische Patterns überprüfen

**Vorteile:**
- Läuft in CI/CD Pipeline
- Integriert in normale Test-Suite
- Fails fast bei Pattern-Verlust

```bash
# Regression Tests ausführen:
pnpm test:critical-fixes
```

### **Schicht 4: Pre-commit Hooks**
📍 `.git/hooks/pre-commit` + `.git/hooks/pre-commit.cmd`

**Zweck:** Commits blockieren wenn kritische Patterns fehlen

**Workflow:**
1. Developer: `git commit -m "..."`
2. Hook läuft: `validate:critical-fixes` + `test:critical-fixes`
3. Bei Erfolg: ✅ Commit erlaubt
4. Bei Fehler: ❌ Commit blockiert + Anweisungen

## 🎯 **Kritische Fixes - Was ist geschützt?**

| **Fix** | **Datei** | **Problem verhindert** |
|---|---|---|
| **WriteStream Race Condition** | `GitHubApiService.ts` | Download-Verification Paradox |
| **File System Flush Delay** | `UpdateManagerService.ts` | Datei-Timing Race Conditions |
| **Event Handler Race** | `UpdateManagerService.ts` | Doppelte Installation-Handler |
| **Port Consistency** | `vite.config.mts` + `electron/main.ts` | Dev-Environment Crashes |

## 🔧 **Entwickler Workflows**

### **Standard Development**
```bash
# Normal entwickeln:
pnpm dev:all                    # ✅ Wie gewohnt
git add .
git commit -m "feature"     # ✅ Hook läuft automatisch
git push                    # ✅ Wie gewohnt
```

### **Version Updates**
```bash
# ❌ NICHT:
pnpm version patch

# ✅ STATTDESSEN:  
pnpm safe:version patch     # Mit kritischer Validation
```

### **Production Builds**
```bash
# ❌ NICHT:
pnpm dist

# ✅ STATTDESSEN:
pnpm safe:dist             # Mit kritischer Validation
```

## 🚨 **Troubleshooting**

### **Pre-commit Hook schlägt fehl**
```bash
🚨 COMMIT BLOCKED: Critical fixes validation failed!

📋 Required actions:
  1. Check docs/00-meta/CRITICAL-FIXES-REGISTRY.md
  2. Restore missing critical patterns  
  3. Run: pnpm validate:critical-fixes
  4. Try commit again
```

**Lösung:**
1. `pnpm validate:critical-fixes` ausführen für Details
2. Registry überprüfen: `docs/00-meta/CRITICAL-FIXES-REGISTRY.md`
3. Fehlende Patterns wiederherstellen
4. Erneut committen

### **Validation Script gibt Fehler**
```bash
❌ MISSING: Critical pattern not found!
   📋 Expected pattern: await new Promise<void>((resolve, reject) => {
```

**Lösung:**
1. **Niemals** das Pattern "reparieren" durch Umschreibung
2. Original-Pattern aus Registry kopieren
3. Code-Review mit Senior Developer

### **Tests schlagen fehl**
```bash
❌ CRITICAL: WriteStream Promise Pattern in GitHubApiService
```

**Lösung:**
1. Betroffene Datei öffnen (`src/main/services/GitHubApiService.ts`)
2. Registry checken für korrektes Pattern
3. Pattern exakt wiederherstellen

## 📚 **Weitere Ressourcen**

### **Dokumentation**
- 📋 **[CRITICAL-FIXES-REGISTRY.md](../CRITICAL-FIXES-REGISTRY.md)** - Alle kritischen Patterns
- 🤖 **[INSTRUCTIONS-KI.md](../INSTRUCTIONS-KI.md)** - KI-Guidelines  
- 🛠️ **[Troubleshooting Guide](../TROUBLESHOOTING.md)** - Problem-Lösungen

### **Entwicklung**
- 🏗️ **[Architektur Docs](../../01-architecture/)** - System-Design
- 🔧 **[Development Guide](../../00-standards/)** - Code-Standards
- 📊 **[Database Docs](../../04-database/)** - SQLite System

## ✅ **Onboarding Checklist**

**Für neue Entwickler:**

- [ ] Repository geklont und Dependencies installiert
- [ ] `pnpm dev:all` erfolgreich ausgeführt  
- [ ] `pnpm validate:critical-fixes` verstanden
- [ ] `pnpm test:critical-fixes` ausgeführt
- [ ] Test-Commit gemacht (Hook getestet)
- [ ] CRITICAL-FIXES-REGISTRY.md gelesen
- [ ] Mindestens 1 kritisches Pattern verstanden
- [ ] Troubleshooting-Szenarien durchgespielt

**Für Team Leads:**

- [ ] Neues Mitglied hat Zugang zu Repository
- [ ] Setup Review durchgeführt  
- [ ] Fix-Preservation System erklärt
- [ ] Code-Review Standards vermittelt
- [ ] Ansprechpartner für Fragen benannt

---

## 🎯 **Nächste Schritte**

1. **[Code Standards](../../00-standards/standards.md)** - Coding Guidelines
2. **[Architektur](../../01-architecture/)** - System verstehen  
3. **[First Issue](../../00-meta/GOOD-FIRST-ISSUES.md)** - Erste Aufgabe finden

**Welcome to the team! 🚀**