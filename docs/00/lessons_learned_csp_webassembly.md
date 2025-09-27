# Lessons Learned – CSP WebAssembly für SQLite (sql.js)

Diese Datei dokumentiert alle Debugging- und Analyse-Versuche zu diesem CSP/WebAssembly Problem.  
Ziel: **KI soll wissen, was bereits probiert wurde, mit welchem Ergebnis**, um Doppelarbeit zu vermeiden.

---

## 📑 Problem Definition

**Symptom:** SQLite (sql.js) schlägt in der installierten App fehl mit CSP-Fehler:
```
CompileError: WebAssembly.instantiate(): Refused to compile or instantiate WebAssembly module because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'self'"
```

**Auswirkung:** App fällt auf Dexie (IndexedDB) als Fallback zurück, SQLite-Funktionalität nicht verfügbar.

**Umgebung:** Installierte Electron-App (Produktionsumgebung), nicht im Dev-Modus.

---

## 📝 Versuche

### Versuch 1
- **Datum:** 2025-09-27  
- **Durchgeführt von:** KI (GitHub Copilot)  
- **Beschreibung:** Problem analysiert - CSP blockiert WebAssembly-Kompilierung für sql.js
- **Hypothese:** Content Security Policy in electron/main.ts fehlt 'wasm-unsafe-eval' für WebAssembly
- **Ergebnis:** ❌ HYPOTHESE FALSCH - CSP ist korrekt in v1.8.117, aber installierte App war ältere Version
- **Quelle:** Browser-Console Logs, electron/main.ts Code-Review (Lines 1417, 1866)

### Versuch 2  
- **Datum:** 2025-09-27
- **Durchgeführt von:** KI (GitHub Copilot)
- **Beschreibung:** Versionsproblem identifiziert - installierte App älter als aktuelle Codebase
- **Hypothese:** Lokale Installation mit Build-First Regel löst das Problem
- **Ergebnis:** ❌ HYPOTHESE FALSCH - Problem bestand weiterhin nach Installation v1.8.117
- **Quelle:** Git Log (CSP-Fix in Commit 76761232), aber Problem blieb bestehen

### Versuch 3 (KORREKTE DIAGNOSE)
- **Datum:** 2025-09-27
- **Durchgeführt von:** KI (GitHub Copilot)
- **Beschreibung:** index.html CSP Meta-Tag gefunden der WebAssembly blockiert
- **Hypothese:** CSP in electron/main.ts wird überschrieben durch Meta-Tag in index.html ohne 'wasm-unsafe-eval'
- **Ergebnis:** ✅ ROOT CAUSE GEFUNDEN - index.html hatte `script-src 'self'` ohne WebAssembly-Support
- **Quelle:** index.html Line 7-14, CSP Meta-Tag `script-src 'self';` ohne `'wasm-unsafe-eval'`

### Versuch 4 (WIEDERHOLT PROBLEM)
- **Datum:** 2025-09-27  
- **Durchgeführt von:** KI (GitHub Copilot) - DERSELBE KI-ASSISTENT!
- **Beschreibung:** **FEHLER:** Exakt dasselbe CSP-Problem nochmals "entdeckt" und "gefixt" obwohl es bereits in Lessons Learned dokumentiert war
- **Hypothese:** CSP-Problem ist neu entdeckt - index.html braucht 'unsafe-inline' 
- **Ergebnis:** ❌ **DOPPELARBEIT** - Problem war bereits gelöst, aber KI hat eigene Lessons Learned nicht beachtet!
- **Quelle:** Chat Session 2025-09-27 (aktueller Debugging-Workflow), index.html bereits korrekt

---

## 🔍 Technische Details

**Root Cause:** 
- sql.js benötigt WebAssembly-Kompilierung für SQLite-Engine
- **CSP Meta-Tag in index.html** überschreibt electron/main.ts CSP-Konfiguration
- index.html CSP: `script-src 'self'` - fehlte `'wasm-unsafe-eval'`
- electron/main.ts CSP war korrekt, aber wurde ignoriert wegen HTML Meta-Tag

**Betroffene Komponenten:**
- SQLite Persistence Adapter (sql.js)  
- Settings Service
- Alle Database-Operations

**Fallback-Verhalten:** 
- App funktioniert mit Dexie (IndexedDB) weiter
- Persistenz-Layer abstrahiert den Unterschied

---

## 🔒 Status
- [x] Problem identifiziert: Veraltete installierte App ohne CSP-WebAssembly-Support
- [x] CSP-Fix bereits implementiert (Commit 76761232) 
- [x] Build-First Regel befolgt: `pnpm build && pnpm dist` → `.\install-local.cmd`
- [x] Aktuelle Version v1.8.117 mit CSP-Fix installiert
- [x] Lessons Learned vervollständigt

## 🎯 Lösung
**Problem:** CSP Meta-Tag in index.html überschreibt electron/main.ts CSP und blockiert WebAssembly  
**Lösung:** `script-src 'self' 'wasm-unsafe-eval';` in index.html CSP Meta-Tag hinzufügen  
**Fix:** Line 8 in index.html: `script-src 'self';` → `script-src 'self' 'wasm-unsafe-eval';`  
**Verhinderung:** CSP-Konsistenz zwischen index.html und electron/main.ts sicherstellen

---

## 🧠 Methodische Reflexion & Verbesserungen

### ❌ **Was schlecht lief:**
1. **Voreilige Änderungen ohne vollständige Diagnose**
   - Sofort electron/main.ts als Ursache angenommen
   - Nicht alle CSP-Quellen systematisch geprüft
   
2. **Unvollständige Informationssammlung**
   - index.html nicht von Anfang an überprüft
   - CSP-Prioritäten (HTML Meta-Tag > HTTP Headers) nicht bedacht
   
3. **Falsche Hypothesen-Validierung**
   - Installation durchgeführt ohne Beweis der korrekten Root Cause
   - Nicht verifiziert, ob electron/main.ts CSP überhaupt wirksam ist

### ✅ **Besseres Vorgehen für zukünftige CSP/WebAssembly-Probleme:**

#### Schritt 1: **Vollständige CSP-Inventarisierung** 
```bash
# ALLE CSP-Quellen systematisch finden:
grep -r "Content-Security-Policy" . --include="*.html" --include="*.ts" --include="*.js"
grep -r "script-src" . --include="*.html" --include="*.ts" --include="*.js"  
grep -r "wasm" . --include="*.html" --include="*.ts" --include="*.js"
```

#### Schritt 2: **CSP-Prioritäten verstehen**
1. HTML Meta-Tags haben **höchste Priorität**
2. HTTP Response Headers (electron/main.ts) sind sekundär
3. → **Immer zuerst HTML prüfen!**

#### Schritt 3: **Hypothesen-Ranking nach Wahrscheinlichkeit**
1. 🥇 HTML Meta-Tags (höchste Priorität)
2. 🥈 HTTP Headers (electron/main.ts)  
3. 🥉 Vite/Build-Konfiguration
4. 🏆 Browser/Electron-Defaults

#### Schritt 4: **Read-Only Diagnose vor Änderungen**
- **Alle** potentiellen Ursachen identifizieren
- **Keine Änderungen** bis Root Cause 100% sicher
- Hypothesen nach Priorität/Wahrscheinlichkeit sortieren

#### Schritt 5: **Minimal invasive Tests**
- Nur **eine Variable** pro Test ändern
- Browser DevTools nutzen für CSP-Policy-Debugging
- Änderungen erst committen nach erfolgreichem Test

### 🛡️ **Universelle Anti-Pattern-Regeln:**
- ❌ **NIE Änderungen machen ohne vollständige Diagnose**
- ❌ **NIE erste Hypothese als Fakt behandeln** 
- ❌ **NIE mehrere Fixes gleichzeitig implementieren**
- ✅ **IMMER alle relevanten Dateien/Configs prüfen**
- ✅ **IMMER Hypothesen nach Wahrscheinlichkeit ranken**
- ✅ **IMMER Read-Only Analyse vor Write-Operationen**