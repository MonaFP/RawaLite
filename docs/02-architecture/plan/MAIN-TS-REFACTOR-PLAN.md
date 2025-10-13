# 🔧 Main.ts Refactor Plan - Modulare Struktur

> **Comprehensive refactoring plan** für `electron/main.ts` → modulare Architektur
> 
> **Erstellt:** 13. Oktober 2025 | **Status:** PLANNING | **Version:** 1.0

---

## 🎯 **Refactor-Überblick**

### **Ziel**
Aufteilen der monolithischen `electron/main.ts` (2560+ Zeilen) in wohldefinierte Module ohne Verhaltensänderungen.

### **Prinzipien**
- ✅ **Strukturänderungen nur** - keine Business-Logik-Änderungen
- ✅ **PNPM-only** - keine externen Dependencies
- ✅ **Security maintained** - `contextIsolation: true`, `sandbox: true`
- ✅ **Critical Fixes preserved** - alle 13 aktiven Fixes erhalten

### **Zielstruktur**
```
electron/
├── main.ts                      # < 500 Zeilen (Bootstrap only)
├── windows/
│   ├── mainWindow.ts            # < 200 Zeilen
│   └── updateManagerWindow.ts   # < 150 Zeilen
└── ipc/
    ├── paths.ts                 # < 300 Zeilen
    ├── fs.ts                    # < 300 Zeilen
    ├── files.ts                 # < 300 Zeilen
    ├── db.ts                    # < 300 Zeilen
    ├── backup.ts                # < 300 Zeilen
    ├── numbering.ts             # < 300 Zeilen
    ├── pdf.ts                   # < 300 Zeilen
    └── updates.ts               # existiert bereits
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

## 📊 **Success Criteria**

### **File Size Compliance**
- [ ] `main.ts` < 500 Zeilen (aktuell: 2560+ Zeilen)
- [ ] Alle Module < 300 Zeilen
- [ ] Window Module < 200 Zeilen

### **Functionality Preservation**
- [ ] Alle IPC-Handler funktionsfähig
- [ ] Critical Fixes erhalten
- [ ] PDF-Export funktionsfähig
- [ ] Update Manager funktionsfähig

### **Code Quality**
- [ ] TypeScript strict compliance
- [ ] ESLint clean
- [ ] All tests passing
- [ ] JSDoc documentation complete

---

## 🔗 **Related Documentation**

- **[Critical Fixes Registry](../00-meta/critical-fixes/CRITICAL-FIXES-REGISTRY.md)** - Zu erhaltende Fixes
- **[Coding Standards](../01-standards/CODING-STANDARDS.md)** - Code Quality Requirements
- **[Testing Standards](../01-standards/TESTING-STANDARDS.md)** - Testing Protocols
- **[Architecture Overview](./ARCHITEKTUR.md)** - Current Architecture
- **[Status Overview](./STATUS-OVERVIEW.md)** - Development Status

---

## 📅 **Timeline & Milestones**

| Phase | Steps | Estimated Time | Risk Level |
|-------|-------|----------------|------------|
| **Preparation** | 0 | 30 min | Low |
| **Windows** | 1-2 | 1-2 hours | Low-Medium |
| **IPC Core** | 3-7 | 3-4 hours | Medium |
| **IPC Critical** | 8-9 | 2-3 hours | High |
| **Integration** | 10-13 | 2-3 hours | Low-Medium |
| **Total** | **0-13** | **8-12 hours** | **Medium** |

---

## ⚡ **Quick Start**

1. **Read this document completely**
2. **Review:** [STEP-00-PREPARATION.md](./refactor-steps/STEP-00-PREPARATION.md)
3. **Validate:** Current critical fixes status
4. **Begin:** Step 0 mit Freigabe-Protokoll

---

*Letzte Aktualisierung: 13. Oktober 2025 | Nächste Review: Nach Refactor-Completion*