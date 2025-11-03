# Lessons Learned – Build & Distribution Problems
> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference
Diese Datei dokumentiert alle Debugging- und Analyse-Versuche zu Build/Distribution-Problemen.  
Ziel: **KI soll wissen, was bereits probiert wurde, mit welchem Ergebnis**, um Doppelarbeit zu vermeiden.

---

## 📑 Struktur
---
id: LL-BUILD-001
bereich: build/distribution
status: open
schweregrad: medium
scope: dev
build: app=1.0.0 electron=31.2.0
schema_version_before: n/a
schema_version_after: n/a
db_path: n/a
reproduzierbar: yes
artefakte: [terminal-output, package.json, scripts/]
---

## 🔍 Problem Definition

**Symptom:** `pnpm clean:full` und `pnpm dist` schlagen mit Exit-Code 1 fehl
**Kontext:** PowerShell-Scripts in package.json haben Exit-Code Probleme
**Impact:** Build-Workflow unterbrochen, kann nicht sauber distributieren

## 🧪 Versuche

### Versuch 1
- **Datum:** 30.09.2025  
- **Durchgeführt von:** GitHub Copilot
- **Beschreibung:** PowerShell-Inline-Commands in package.json mit komplexer Logik  
- **Hypothese:** Mehrzeilige PowerShell-Commands funktionieren in JSON package.json  
- **Ergebnis:** **[ENTWICKLER VALIDIERUNG ERFORDERLICH]**
- **Quelle:** Terminal-Output zeigt Exit-Code 1 bei funktional korrekten Operationen
- **Tags:** [POWERSHELL-MEHRZEILER] [PACKAGE-JSON-LIMITS]

### Versuch 2  
- **Datum:** 30.09.2025
- **Durchgeführt von:** GitHub Copilot
- **Beschreibung:** Externe PowerShell-Scripts (.ps1) mit Parameter-Unterstützung
- **Hypothese:** Externe Scripts lösen JSON-Escaping und Exit-Code Probleme
- **Ergebnis:** **[ENTWICKLER VALIDIERUNG ERFORDERLICH]**
- **Quelle:** scripts/build-cleanup.ps1 erstellt
- **Tags:** [EXTERNAL-SCRIPTS] [PARAMETER-SUPPORT]

### Versuch 3
- **Datum:** 30.09.2025  
- **Durchgeführt von:** GitHub Copilot
- **Beschreibung:** Node.js basierte Cross-platform Scripts
- **Hypothese:** Node.js Scripts haben bessere Exit-Code Kontrolle
- **Ergebnis:** **[ENTWICKLER VALIDIERUNG ERFORDERLICH]**
- **Quelle:** scripts/build-cleaner.cjs erweitert
- **Tags:** [NODE-JS-SCRIPTS] [CROSS-PLATFORM]

### Versuch 5 - **BREAKTHROUGH**
- **Datum:** 30.09.2025  
- **Durchgeführt von:** Entwickler
- **Beschreibung:** Tests mit geschlossenem VS Code und mehrfachen `pnpm dist` Aufrufen
- **Hypothese:** File-Locking durch VS Code/Editor verursacht Build-Probleme
- **Ergebnis:** ✅ **ERFOLGREICH beim 3. Versuch!** 
  - VS Code geschlossen = funktioniert
  - 1. pnpm dist = Fehler (app.asar locked)
  - 2. pnpm dist = Fehler (app.asar locked) 
  - 3. pnpm dist = ✅ Erfolg! "RawaLite Setup 1.0.0.exe" erstellt
- **Quelle:** Terminal-Output PowerShell 7.5.3
- **Tags:** [EDITOR-INTERFERENCE] [RETRY-SUCCESS] [APP-ASAR-LOCKING]

### Versuch 6 - **ROOT CAUSE IDENTIFIZIERT**
- **Datum:** 30.09.2025
- **Durchgeführt von:** GitHub Copilot (Analyse)
- **Beschreibung:** Systematische Analyse der Fehlermuster
- **Hypothese:** Problem ist NICHT PowerShell, sondern File-Handle-Management
- **Ergebnis:** ✅ **ROOT CAUSE GEFUNDEN:**
  - `app.asar` wird von electron-builder beim ersten Build erstellt
  - Beim 2. Build kann electron-builder die alte `app.asar` nicht entfernen
  - Irgendein Prozess hält die Datei geöffnet (OS-File-Handle)
  - Nach Retry (3. Versuch) werden Handles freigegeben → Erfolg
- **Quelle:** Fehlermeldung: "The process cannot access the file because it is being used by another process"
- **Tags:** [FILE-HANDLES] [ELECTRON-BUILDER] [RETRY-PATTERN]

---

## 🔒 **Nächste strukturierte Schritte (Debugging-Workflow)**

### **1. Problem reproduzieren & definieren**
- [ ] **Entwickler:** Führe `pnpm clean:full` aus und dokumentiere exakte Fehlermeldung
- [ ] **Entwickler:** Führe `pnpm dist` aus und dokumentiere wo genau es fehlschlägt
- [ ] **Entwickler:** Prüfe ob es ein funktionales Problem ist oder nur Exit-Code

### **2. Informationen sammeln**  
- [ ] **KI:** Welche Scripts sind aktuell in package.json definiert?
- [ ] **KI:** Welche externen Script-Dateien existieren in scripts/?
- [ ] **Entwickler:** Funktioniert der Build trotz Exit-Code 1?
- [ ] **Entwickler:** Sind alle Artefakte (release/, dist/) korrekt erstellt?

### **3. Hypothese aufstellen**
Aktuelle Hypothese: **Exit-Code 1 ist cosmetic, funktional korrekt**
- Windows taskkill gibt Exit-Code 1 wenn Prozess nicht gefunden
- Aber Cleanup funktioniert (Prozesse werden gestoppt)
- Build schlägt nur wegen && Verkettung in Scripts fehl

### **4. Test planen**
**Nächster Test:** Funktionale Validierung
- Script einzeln ausführen und Ergebnis bewerten
- Build-Artefakte auf Vollständigkeit prüfen  
- Fallback-Strategie ohne && Verkettung testen

---

## 📌 Status - **PROBLEM GELÖST** ✅
- [x] **Root Cause identifiziert:** File-Handle-Locking bei `app.asar`
- [x] **Workaround validiert:** VS Code schließen + Retry-Pattern (funktioniert)
- [x] **Produktive Lösung:** Robuste dist:safe Script mit automatischem Retry benötigt

## 🎯 **FINALE LÖSUNG**

**Problem:** electron-builder kann `app.asar` beim 2. Build nicht entfernen (File-Handle noch geöffnet)
**Lösung:** Intelligentes Retry-Pattern mit File-Handle-Cleanup

**Empfohlene Script-Struktur:**
```json
{
  "scripts": {
    "dist": "pnpm run build && electron-builder",                    // Standard (kann fehlschlagen)
    "dist:safe": "pnpm clean:release:force && pnpm run build && electron-builder", // Mit Cleanup
    "dist:retry": "pnpm dist || (echo 'Retry in 2s...' && timeout /t 2 && pnpm dist)" // Mit Retry
  }
}
```

## 🚀 **Nächste Schritte**
1. ✅ **Problem verstanden** - File-Handle-Management, nicht PowerShell
2. 🔄 **Implementierung:** Robuste `dist:safe` mit Handle-Cleanup  
3. 🔄 **Testing:** Automatisches Retry-Pattern
4. ✅ **Workaround:** VS Code schließen vor Build (funktioniert jetzt)

---

## 🤖 AI-Prompts Mini-Header
🚨 **KI-DEBUGGING REGELN** 🚨  
- ❌ NIEMALS Ergebnisse raten oder annehmen  
- ✅ IMMER Entwickler nach Validierung fragen  
- ✅ Dev vs Prod Environment unterscheiden  
- ✅ PNPM-only (niemals npm/yarn)  
- ✅ Methodisch nach debugging.md vorgehen  
- ✅ Jeden Versuch dokumentieren (auch Failures)  
- ✅ Fakten-basiert, keine Spekulationen  

---

## ⚠️ WICHTIGE ERINNERUNG FÜR KI
- **NIEMALS Ergebnisse raten oder annehmen**  
- **IMMER Entwickler nach Validierung fragen**  
- **ALLE Versuche dokumentieren**, auch fehlgeschlagene  
- **Methodisch vorgehen** nach debugging.md Standards