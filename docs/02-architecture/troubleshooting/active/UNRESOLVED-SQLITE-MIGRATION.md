# SQLite Migration - Ungelöste Probleme

> **Stand:** 30. September 2025  
> **Status:** 🔴 UNGELÖST  
> **Kategorie:** Production Build Issues

## Problem-Übersicht

### 🎯 Kern-Issue
Migration von `sql.js` (WASM) zu `better-sqlite3` (Native) führt zu Production-Build-Problemen:

```
Development ✅ → Production ❌
sql.js WASM  → better-sqlite3 Native Modules
```

### Symptome
- **User:** "Bei Installation wird nur der db ordner angelegt"
- **Error:** `Cannot find module 'bindings'`
- **Build:** File-Locking verhindert electron-builder

## Root Cause Analysis

### Git-Historie
- **v1.0.0 (48c2efbb):** Funktionierte mit sql.js
- **Migration:** better-sqlite3@12.4.1 eingeführt
- **Resultat:** Native Module Packaging-Problem

### Problem-Stack
```
User Problem: App startet nicht nach Installation
     ↓
Build Problem: File-Locking blockiert electron-builder  
     ↓
Runtime Problem: better-sqlite3 bindings not found
     ↓
Architecture Problem: Native modules in asar archive
```

## Lösungsoptionen

### 🥇 Option 1: Native Module Fix (Empfohlen)
```yaml
# electron-builder.yml
asarUnpack:
  - "node_modules/better-sqlite3/**/*"
  - "node_modules/bindings/**/*"
```
**Pro:** Behält bessere Performance von better-sqlite3  
**Contra:** Komplexere Build-Konfiguration

### 🥈 Option 2: sql.js Rollback  
```bash
pnpm remove better-sqlite3
pnpm add sql.js
```
**Pro:** Sofortige Lösung, v1.0.0 funktionierte  
**Contra:** Performance-Verlust, WASM statt Native

### 🥉 Option 3: Hybrid Approach
- Development: better-sqlite3
- Production: sql.js

**Pro:** Beste aus beiden Welten  
**Contra:** Doppelte Maintenance

## Immediate Actions Required

### 1. File-Locking Workaround
```bash
# Separate Terminal für electron-builder
pnpm run build:preload && pnpm run build:main
# VS Code schließen für Packaging
npx electron-builder
```

### 2. Architecture Decision
- [ ] Stakeholder-Entscheidung: Native vs. WASM
- [ ] Implementation Timeline
- [ ] Testing Strategy

## Technical Details

### Better-sqlite3 Requirements
- Native compilation
- Electron rebuild
- Correct node_modules packaging
- Binary compatibility

### Current Workarounds
- Development läuft perfekt
- Manual build process außerhalb VS Code
- Database functionality vollständig

## Risk Assessment

| Approach | Risk | Effort | Timeline |
|----------|------|--------|----------|
| Native Fix | Medium | High | 2-3 Tage |
| sql.js Rollback | Low | Low | 1 Tag |
| Hybrid | High | High | 1 Woche |

## Lessons Learned

1. **Native Module Migration:** Electron packaging deutlich komplexer
2. **Build Environment:** VS Code File-Locking kritisches Problem  
3. **Testing:** Production builds häufiger testen
4. **Rollback Strategy:** Immer funktionierenden Zustand bewahren

---
*Nächste Schritte: Stakeholder-Entscheidung für Lösungsweg erforderlich*