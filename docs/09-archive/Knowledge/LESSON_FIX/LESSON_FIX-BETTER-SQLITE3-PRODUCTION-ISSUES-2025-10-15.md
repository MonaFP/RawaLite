# better-sqlite3 Production Issues - Ungelöst
> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference
> **Status:** 🔴 UNGELÖST  
> **Typ:** Native Module Packaging  
> **Betroffen:** Production Builds, Installation  
> **Stand:** 30. September 2025

---

## 🎯 Problem-Beschreibung

**Symptom:** App startet in Development, aber scheitert nach Installation  
**Fehlermeldung:** `Cannot find module 'bindings'`  
**Root Cause:** better-sqlite3 native Binaries werden nicht korrekt gepackt

---

## 🔍 Technical Details

### Fehler-Stack
```
❌ Failed to initialize application: Error: Cannot find module 'bindings'
Require stack:
- C:\...\app.asar\node_modules\better-sqlite3\lib\database.js
- C:\...\app.asar\node_modules\better-sqlite3\lib\index.js
- C:\...\app.asar\dist-electron\main.cjs
```

### Betroffene Module
- `better-sqlite3@12.4.1`
- `bindings` (Dependency von better-sqlite3)
- `file-uri-to-path` (Dependency von bindings)

### Funktionierende vs. Fehlende Umgebung

| Umgebung | Status | Grund |
|----------|--------|-------|
| `pnpm dev` | ✅ Funktioniert | Native Module direkt verfügbar |
| Production Build | ❌ Fehler | Native Module im asar gepackt |
| v1.0.0 Release | ✅ Funktionierte | Verwendete sql.js (WASM) |

---

## 🔧 Lösungsstrategien

### 1. asarUnpack (Empfohlen)
```yaml
# electron-builder.yml
asarUnpack:
  - "node_modules/better-sqlite3/**/*"
  - "node_modules/bindings/**/*"
  - "node_modules/file-uri-to-path/**/*"
```

**Pro:** Standard-Lösung, dokumentiert  
**Kontra:** Größere App-Bundle

### 2. extraFiles als externe Resource
```yaml
# electron-builder.yml
extraFiles:
  - from: node_modules/better-sqlite3/build/Release/better_sqlite3.node
    to: resources/better_sqlite3.node
```

**Pro:** Saubere Trennung  
**Kontra:** Pfad-Management komplex

### 3. Rückkehr zu sql.js
```yaml
# Wie v1.0.0 (48c2efbb)
# package.json
"dependencies": {
  "sql.js": "^1.13.0"
  // "better-sqlite3": "^12.4.1" ← entfernen
}
```

**Pro:** Bewährt, funktioniert garantiert  
**Kontra:** Performance-Einbußen, Migration rückgängig

---

## 📊 Performance-Vergleich

| Library | Typ | Performance | Bundle Size | Native Deps |
|---------|-----|-------------|-------------|-------------|
| sql.js | WASM | Mittel | ~1.8MB | Keine |
| better-sqlite3 | Native | Hoch | ~2.5MB | C++ Binary |

---

## 🧪 Getestete Konfigurationen

### ❌ Fehlgeschlagen
```yaml
# Aktuelle Konfiguration
files:
  - dist-electron
  - package.json
  - node_modules/better-sqlite3/**/*
```

### 🟡 Ungetestet (Empfohlen)
```yaml
# Vorgeschlagene Konfiguration
files:
  - dist-electron
  - package.json
asarUnpack:
  - "node_modules/better-sqlite3/**/*"
  - "node_modules/bindings/**/*"
  - "node_modules/file-uri-to-path/**/*"
```

---

## 🔄 Migration-Impact

### Von sql.js zu better-sqlite3 (aktuell)
- **Database.ts:** ✅ Implementiert
- **IPC Handlers:** ✅ Parameter-Fix applied
- **Tests:** ⚠️ Teilweise failing
- **Production:** ❌ Bindings-Problem

### Potentielle Rollback zu sql.js
- **Effort:** Hoch (Code-Änderungen nötig)
- **Risk:** Niedrig (bewährte Lösung)
- **Performance:** Verschlechterung um ~30%

---

## 📚 Lessons Learned

1. **Native Module sind komplex** in Electron-Packaging
2. **v1.0.0 funktionierte mit sql.js** ohne diese Probleme
3. **Development ≠ Production** bei nativen Dependencies
4. **asarUnpack ist Standard** für native Module

---

## 🚀 Nächste Schritte

### Priorität 1: asarUnpack testen
1. Konfiguration anpassen
2. Build erstellen
3. Installation testen
4. Funktionalität validieren

### Priorität 2: Fallback-Plan
1. sql.js Migration dokumentieren
2. Performance-Impact bewerten
3. Entscheidung treffen

### Priorität 3: CI/CD
1. Automatisierte Tests für Production Builds
2. Installation-Tests in Pipeline
3. Regression-Prävention

---

## 🔗 Related Issues

- **File-Locking:** [ELECTRON-BUILDER-FILE-LOCKING.md](./ELECTRON-BUILDER-FILE-LOCKING.md)
- **IPC Parameter Fix:** [../../LESSONS-LEARNED-ipc-filesystem-api.md](../../LESSONS-LEARNED-ipc-filesystem-api.md)
- **Migration Architecture:** [../../SQLITE-MIGRATION-ARCHITECTURE.md](../../SQLITE-MIGRATION-ARCHITECTURE.md)