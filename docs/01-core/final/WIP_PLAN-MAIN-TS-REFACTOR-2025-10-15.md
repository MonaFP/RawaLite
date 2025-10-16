# 🔧 Main.ts Refactor Plan - Modulare Struktur

> **Comprehensive refactoring plan** für `electron/main.ts` → modulare Architektur
> 
> **Erstellt:** 13. Oktober 2025 | **Status:** ✅ COMPLETED | **Version:** 2.0

---

## 🎯 **Refactor-Überblick**

### **Ziel** ✅ ERREICHT
Aufteilen der monolithischen `electron/main.ts` (2565+ Zeilen) in wohldefinierte Module ohne Verhaltensänderungen.

### **Prinzipien** ✅ ERFÜLLT
- ✅ **Strukturänderungen nur** - keine Business-Logik-Änderungen
- ✅ **PNPM-only** - keine externen Dependencies
- ✅ **Security maintained** - `contextIsolation: true`, `sandbox: true`
- ✅ **Critical Fixes preserved** - alle 15 aktiven Fixes erhalten

### **Endergebnis**
- **12 neue Module** erfolgreich erstellt
- **97% Code-Reduzierung** (2565+ → 92 Zeilen in main.ts)
- **Alle Critical Fixes** validiert und erhalten
- **TypeScript & Build** vollständig funktionsfähig

### **Erreichte Struktur** ✅
```
electron/
├── main.ts                      # ✅ 92 Zeilen (Bootstrap only)
├── windows/
│   ├── main-window.ts           # ✅ Hauptfenster-Management
│   └── update-window.ts         # ✅ Update-Manager-Fenster
└── ipc/
    ├── paths.ts                 # ✅ Pfad-Handler
    ├── filesystem.ts            # ✅ Dateisystem-Handler
    ├── status.ts                # ✅ Status-Handler
    ├── numbering.ts             # ✅ Nummernkreis-Handler
    ├── pdf-core.ts              # ✅ PDF Kern-Handler
    ├── pdf-templates.ts         # ✅ PDF Template-Generator
    ├── database.ts              # ✅ Database-Handler (CRITICAL FIX-012)
    ├── backup.ts                # ✅ Backup-Handler
    ├── files.ts                 # ✅ File-Handler
    ├── update-manager.ts        # ✅ Update Manager-Handler
    └── updates.ts               # ✅ Bereits vorhanden
```

---

## 📋 **Detaillierte Schritte**

### **Schritt 0: Vorbereitung**
- **Ziel:** Strukturelle Vorbereitung ohne Code-Änderungen
- **Dateien:** Ordner erstellen, Marker setzen
- **Risiko:** Low
- **Dokumentation:** [STEP-00-PREPARATION.md](./refactor-steps/STEP-00-PREPARATION.md)

### **Schritt 1-2: Window Management**
- **Ziel:** Fenster-Creation in separate Module
- **Dateien:** `windows/mainWindow.ts`, `windows/updateManagerWindow.ts`
- **Risiko:** Low-Medium
- **Dokumentation:** [STEP-01-02-WINDOWS.md](./refactor-steps/STEP-01-02-WINDOWS.md)

### **Schritt 3-9: IPC Handler Separation**
- **Ziel:** IPC-Handler in thematische Module aufteilen
- **Dateien:** `ipc/*.ts` Module
- **Risiko:** Medium-High (PDF/DB kritisch)
- **Dokumentation:** [STEP-03-09-IPC.md](./refactor-steps/STEP-03-09-IPC.md)

### **Schritt 10-13: Integration & Cleanup**
- **Ziel:** Integration validieren, Dokumentation, Cleanup
- **Dateien:** Finale main.ts, Dokumentation
- **Risiko:** Low
- **Dokumentation:** [STEP-10-13-INTEGRATION.md](./refactor-steps/STEP-10-13-INTEGRATION.md)

---

## ⚠️ **Critical Fixes Considerations**

### **Betroffene Fixes**
- **FIX-007 (PDF Theme System):** Parameter-based Theme Detection erhalten
- **FIX-012 (SQLite Parameter Binding):** NULL conversion patterns erhalten
- **Weitere SQL-bezogene Fixes:** Bei DB-IPC Migration prüfen

### **Validation Requirements**
```bash
# Nach jedem Schritt:
pnpm validate:critical-fixes

# Nach PDF/DB Steps (8,9):
pnpm test:critical-fixes
```

**Details:** [CRITICAL-FIXES-IMPACT.md](./refactor-steps/CRITICAL-FIXES-IMPACT.md)

---

## 🧪 **Testing Strategy**

### **Guard Protocol**
```bash
# Standard Guards nach jedem Schritt:
pnpm typecheck && pnpm lint && pnpm test && pnpm guard:cjs && pnpm guard:pkgtype && pnpm guard:assets && pnpm validate:critical-fixes
```

### **Dev-Smoke Testing**
- **Nach Schritt 2:** Update Manager Dev-Modus
- **Nach Schritt 6:** Nummernkreise funktionsfähig
- **Nach Schritt 9:** PDF-Export funktionsfähig
- **Nach Schritt 12:** Vollständiger E2E-Durchlauf

**Details:** [TESTING-STRATEGY.md](./refactor-steps/TESTING-STRATEGY.md)

---

## 📚 **Documentation Requirements**

### **Code Documentation**
- **JSDoc:** Alle exportierten Funktionen
- **TypeScript:** Strikte Typisierung beibehalten
- **Comments:** Refactor-Marker während Entwicklung

### **Architecture Documentation**
- **README.md:** Neue Modulstruktur
- **Architecture Docs:** Updated structure in `docs/02-architecture/`
- **Migration Notes:** Breaking changes documentation

**Details:** [DOCUMENTATION-REQUIREMENTS.md](./refactor-steps/DOCUMENTATION-REQUIREMENTS.md)

---

## 🔄 **Workflow Protocol**

### **Step-by-Step Approval**
```
[STEP N DONE]
Was getan: <1-2 Sätze>
Risiko: <low/medium/high>
Tests: <typecheck/lint/test/guards/dev-run kurz>
Diff-Vorschau: <stichpunkte zu betroffenen Dateien>
Commit: <commit message>
Bereit für Step N+1? (Ja/Nein)
```

### **Emergency Procedures**
- **Rollback:** `git reset --hard HEAD~1` bei Problemen
- **Alternative:** Neue Vorgehensidee vorschlagen
- **Escalation:** Stop bei kritischen Issues

**Details:** [WORKFLOW-PROTOCOL.md](./refactor-steps/WORKFLOW-PROTOCOL.md)

---

## 📊 **Success Criteria** ✅ ALLE ERFÜLLT

### **File Size Compliance** ✅
- [x] `main.ts` < 500 Zeilen (erreicht: 92 Zeilen - 97% Reduzierung!)
- [x] Alle Module < 300 Zeilen (durchschnittlich ~100 Zeilen)
- [x] Window Module < 200 Zeilen (alle unter 150 Zeilen)

### **Functionality Preservation** ✅
- [x] Alle IPC-Handler funktionsfähig
- [x] Critical Fixes erhalten (FIX-007, FIX-012, etc.)
- [x] PDF-Export funktionsfähig mit Theme-Integration
- [x] Update Manager funktionsfähig

### **Code Quality** ✅
- [x] TypeScript strict compliance
- [x] Build erfolgreich (pnpm build ✓)
- [x] Critical Fixes Validation ✓
- [x] JSDoc documentation für alle Module

---

## 🔗 **Related Documentation**

- **[Refactor Completion Report](./REFACTOR-COMPLETION-REPORT.md)** - ✅ Erfolgreiche Abschluss-Dokumentation
- **[Critical Fixes Registry](../00-meta/critical-fixes/CRITICAL-FIXES-REGISTRY.md)** - Zu erhaltende Fixes
- **[Coding Standards](../01-standards/CODING-STANDARDS.md)** - Code Quality Requirements
- **[Testing Standards](../01-standards/TESTING-STANDARDS.md)** - Testing Protocols
- **[Architecture Overview](./ARCHITEKTUR.md)** - Current Architecture
- **[Status Overview](./STATUS-OVERVIEW.md)** - Development Status

---

## 📅 **Timeline & Milestones** ✅ ABGESCHLOSSEN

| Phase | Steps | Estimated Time | Actual Time | Status |
|-------|-------|----------------|-------------|---------|
| **Preparation** | 0 | 30 min | ~15 min | ✅ Complete |
| **Windows** | 1-2 | 1-2 hours | ~45 min | ✅ Complete |
| **IPC Core** | 3-7 | 3-4 hours | ~2 hours | ✅ Complete |
| **IPC Critical** | 8-9 | 2-3 hours | ~1.5 hours | ✅ Complete |
| **Integration** | 10-13 | 2-3 hours | ~1 hour | ✅ Complete |
| **Documentation** | - | - | ~30 min | ✅ Complete |
| **Total** | **0-13** | **8-12 hours** | **~5.5 hours** | **✅ ERFOLG** |

**Effizienz:** ~45% schneller als geplant durch systematische Herangehensweise!

---

## ⚡ **Quick Start**

1. **Read this document completely**
2. **Review:** [STEP-00-PREPARATION.md](./refactor-steps/STEP-00-PREPARATION.md)
3. **Validate:** Current critical fixes status
4. **Begin:** Step 0 mit Freigabe-Protokoll

---

*Letzte Aktualisierung: 13. Oktober 2025 | Nächste Review: Nach Refactor-Completion*