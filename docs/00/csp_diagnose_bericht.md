# 🔍 CSP WebAssembly Diagnose-Bericht (Read-Only)

**Datum:** 2025-09-27  
**Status:** Problem besteht weiterhin trotz bisheriger Fixes  
**Methodik:** Systematische Vollanalyse OHNE Änderungen

---

## 📊 Kritikalitäts-Matrix

| **Kritikalität** | **Komponente** | **Status** | **Potentielles Problem** | **Fundstelle** |
|------------------|----------------|------------|-------------------------|----------------|
| 🔴 **KRITISCH** | `vite.config.mts` DEV CSP | ⚠️ KONFLIKT | Dev CSP hat `'unsafe-eval'` statt `'wasm-unsafe-eval'` | Line 18 |
| 🔴 **KRITISCH** | Build/Runtime Diskrepanz | ❌ UNBEKANNT | Unterschied zwischen Dev-Mode und Prod-Build CSP | vite.config.mts vs index.html |
| 🟠 **HOCH** | CSP-Header Priorität | ⚠️ UNKLAR | Welche CSP greift: index.html Meta-Tag vs electron/main.ts Headers? | Mehrere Quellen |
| 🟠 **HOCH** | WebAssembly Asset Loading | ✅ OK | sql-wasm.wasm existiert und wird korrekt referenziert | 659KB, public/ + dist/ |
| 🟡 **MITTEL** | SQL.js Initialisierung | ✅ OK | initSqlJs Code korrekt, locateFile zeigt auf richtige WASM | db.ts Line 370 |
| 🟡 **MITTEL** | SQLiteAdapter Import | ✅ OK | Adapter-System funktioniert, Import-Pfade korrekt | persistence/index.ts |
| 🟢 **NIEDRIG** | CSP electron/main.ts | ✅ OK | Korrekte `'wasm-unsafe-eval'` Konfiguration | Lines 1417, 1866 |
| 🟢 **NIEDRIG** | CSP index.html | ✅ OK | Korrekte `'wasm-unsafe-eval'` Konfiguration | Line 8 |

---

## 🧩 Detailanalyse

### 🔴 **KRITISCHE Befunde:**

#### 1. **vite.config.mts DEV CSP Konflikt**
```typescript
// Line 18: DEV-Modus hat andere CSP als Produktion!
"script-src 'self' 'unsafe-eval'",        // ❌ DEV: 'unsafe-eval' 
vs.
"script-src 'self' 'wasm-unsafe-eval'";   // ✅ PROD: 'wasm-unsafe-eval'
```
**Problem:** Development und Production haben unterschiedliche CSP-Konfigurationen!

#### 2. **CSP-Prioritäts-Chaos**
- **Electron Headers:** `webRequest.onHeadersReceived` (main.ts)
- **HTML Meta-Tag:** `<meta http-equiv="Content-Security-Policy">`  
- **Vite Dev-Server:** `server.headers` (nur Dev)
**Problem:** Unklar welche CSP tatsächlich greift!

### 🟠 **Hochpriorisierte Verdachtsmomente:**

#### 3. **Build vs Runtime Diskrepanz**
- **Build-Zeit:** index.html wird mit korrekter CSP gebaut
- **Runtime:** Electron überschreibt möglicherweise Headers  
- **Dev vs Prod:** Komplett unterschiedliche CSP-Konfigurationen

#### 4. **WebAssembly Loading Context**
- **Asset-Pfad:** `${import.meta.env.BASE_URL}sql-wasm.wasm` ✅
- **File-Existenz:** public/ ✅ dist/ ✅ (659KB)
- **Import-Kontext:** Browser vs Electron WebAssembly-Policies?

### 🟡 **Weitere Untersuchungspunkte:**

#### 5. **SQLite Initialisierung**
- Code korrekt, aber Runtime-Environment könnte unterschiedlich sein
- Dev-Mode vs installierte App unterschiedliche WebAssembly-Politik?

#### 6. **Electron Sandbox-Kontext**  
- `sandbox: true` in main.ts aktiviert
- WebAssembly-Policies in Sandbox-Mode anders?

---

## 🎯 **Nächste Hypothesen (nach Wahrscheinlichkeit)**

### **Hypothese A (90% Wahrscheinlichkeit)**
**Problem:** Vite Dev-CSP überschreibt HTML Meta-Tag im Development  
**Test:** Prüfen welche CSP tatsächlich im Browser-DevTools angezeigt wird

### **Hypothese B (70% Wahrscheinlichkeit)** 
**Problem:** Electron Header-Override funktioniert nicht wie erwartet  
**Test:** CSP-Header in Network-Tab der installierten App prüfen

### **Hypothese C (50% Wahrscheinlichkeit)**
**Problem:** WebAssembly-Sandbox-Policies in Electron unterschiedlich  
**Test:** Electron-spezifische WebAssembly-Konfiguration prüfen

---

## 📋 **Empfohlene nächste Schritte (Read-Only)**

1. 🔍 **Browser DevTools CSP-Analyse:** Welche CSP ist aktiv?
2. 🔍 **Network-Tab Inspection:** HTTP-Headers vs Meta-Tag Priorität  
3. 🔍 **Electron-spezifische WebAssembly-Politik untersuchen**
4. 🔍 **Dev vs Prod CSP-Konsistenz herstellen**

**❌ KEINE Änderungen bis Root Cause 100% identifiziert!**