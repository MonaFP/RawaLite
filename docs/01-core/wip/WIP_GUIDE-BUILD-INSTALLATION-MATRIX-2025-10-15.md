# Build & Installation Probleme - Lösungsmatrix

> **Stand:** 30. September 2025  
> **Status:** 🔴 UNGELÖST  
> **Kategorie:** Production Build Pipeline

## Problemkategorien

### 1. File-Locking Problem
**Symptom:** `EBUSY: resource busy or locked, open 'dist-electron\app.asar'`

**Root Cause:** VS Code hält File-Handles offen
```
VS Code → TypeScript Service → node_modules locks
        → File Handles → electron-builder blocked
```

**Lösungsansätze:**
| Methode | Aufwand | Erfolgsrate | Empfehlung |
|---------|---------|-------------|------------|
| VS Code schließen | Niedrig | 90% | ✅ Sofort |
| Separates Terminal | Niedrig | 85% | ✅ Workaround |
| Output-Directory ändern | Mittel | 95% | ⚠️ Test needed |
| Prozess-Restart | Hoch | 100% | ❌ Ineffizient |

### 2. Native Module Packaging
**Symptom:** `Cannot find module 'bindings'`

**Root Cause:** better-sqlite3 Native Modules in asar komprimiert
```
better-sqlite3 → bindings → node-gyp → Native .node files
             → asar archive → Runtime resolution fails
```

**Konfigurationsversuche:**
```yaml
# Versucht aber fehlgeschlagen:
asarUnpack: ["**/*.node", "node_modules/better-sqlite3/**/*"]
buildDependenciesFromSource: true
nodeGypRebuild: true
```

### 3. Installation Silent Failure
**Symptom:** NSIS bricht ohne Fehlermeldung ab

**Root Cause Chain:**
```
App Bundle → Missing bindings → Runtime Error → Silent Exit
```

## Lösungsmatrix

### Sofortige Workarounds (< 1 Tag)

#### File-Locking Fix
```bash
# Terminal außerhalb VS Code
cmd
cd "C:\Users\Ramona\Desktop\RawaLite"
pnpm run build:preload && pnpm run build:main
npx electron-builder
```

#### Output Directory Isolation
```json
// vite.config.mts
build: {
  outDir: '../dist-isolated'
}
```

### Mittelfristige Lösungen (2-3 Tage)

#### asarUnpack Konfiguration
```yaml
# electron-builder.yml
asarUnpack:
  - "node_modules/better-sqlite3/**/*"
  - "node_modules/bindings/**/*" 
  - "node_modules/file-uri-to-path/**/*"
extraFiles:
  - "node_modules/better-sqlite3/build/**/*"
```

#### Electron Rebuild Integration
```json
// package.json
"scripts": {
  "postinstall": "electron-rebuild",
  "build:electron": "electron-rebuild && electron-builder"
}
```

### Langfristige Strategien (1 Woche)

#### sql.js Rollback
```bash
# Zurück zu v1.0.0 Lösung
pnpm remove better-sqlite3
pnpm add sql.js
# src/services/Database.ts anpassen
```

#### Hybrid Architecture  
```typescript
// Development: better-sqlite3
// Production: sql.js
const Database = process.env.NODE_ENV === 'development' 
  ? require('./BetterSqliteAdapter')
  : require('./SqlJsAdapter');
```

## Implementation Roadmap

### Phase 1: Stabilisierung (Woche 1)
- [ ] File-Locking Workaround etablieren
- [ ] Manual Build Process dokumentieren  
- [ ] asarUnpack Konfiguration testen
- [ ] Minimaler funktionsfähiger Build

### Phase 2: Native Module Fix (Woche 2)
- [ ] Electron-rebuild Integration
- [ ] Binary Pfad-Resolution
- [ ] Production Test auf Clean Machine
- [ ] Automated Build Pipeline

### Phase 3: Fallback Strategy (Woche 3)
- [ ] sql.js Integration als Backup
- [ ] Performance Benchmarks
- [ ] Migration Path Definition
- [ ] Documentation Update

## Risk Mitigation

### High Priority
1. **Rollback Plan:** sql.js Konfiguration bereithalten
2. **Manual Process:** Build außerhalb IDE etablieren
3. **Clean Testing:** Separate Test-Maschine

### Medium Priority  
1. **Monitoring:** Build-Success-Rate tracking
2. **Documentation:** Step-by-step Troubleshooting
3. **Automation:** CI/CD Pipeline Vorbereitung

## Success Metrics

### Minimale Erfolgs-Kriterien
- [ ] Production Build ohne File-Locking Errors
- [ ] App startet nach Installation
- [ ] Database Operations funktional
- [ ] Reproduzierbarer Build Process

### Optimale Ziele
- [ ] Native Module Performance beibehalten
- [ ] Automatisierte Build Pipeline
- [ ] Zero-Touch Deployment
- [ ] Comprehensive Error Handling

---
*Status: Awaiting Stakeholder Decision on Solution Priority*