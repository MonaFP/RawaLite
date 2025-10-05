# Lessons Learned – Nummernkreis-Debugging Session

**Problem:** Angebotsnummern zeigen lange Timestamp-Zahlen (AN-1759581138675) statt 4-stellige Nummern (AN-0001)  
**Datum:** 2025-10-04  
**Session:** Nummernkreis-Service Debugging

---

## 📑 Struktur
---
id: LL-DEV-002
bereich: 03-development/nummernkreis-service
status: open
schweregrad: high
scope: prod
build: app=1.0.13 electron=current node=20.18.0
schema_version_before: 14
schema_version_after: 14
db_path: C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db
reproduzierbar: yes
artefakte: [screenshot mit AN-1759581138675 nummern]
---

## 🔍 Root-Cause-Analysis

### Ursprüngliches Problem
- **Symptom**: Angebotsnummern wie `AN-1759581138675` statt `AN-0001`
- **User-Report**: "überprüfe die nummernkreis funktion für angebote.. das sieht nicht nach der voreinstellten 4-stelligen aus"
- **Screenshot**: Zeigt zwei Angebote mit langen Timestamp-basierten Nummern

### Gefundene Ursachen
1. **Tabellennamen-Inkonsistenz**: 
   - `NummernkreisService.ts` verwendete `numberingCircles` (camelCase)
   - Datenbank hat `numbering_circles` (snake_case)
   - Führt zu fehlgeschlagenen UPDATE-Queries

2. **Fallback-Mechanismus**:
   - `OfferForm.tsx`: `offerNumber: offer?.offerNumber || 'AN-${Date.now()}'`
   - `EinstellungenPage.tsx`: try/catch mit `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`
   - Service-Fehler → Fallback → Timestamp-Nummern

## 🛠️ Durchgeführte Fixes

### Fix 1: Tabellennamen korrigiert
```typescript
// VORHER (falsch):
UPDATE numberingCircles 
SET current = ?, lastResetYear = ?, updatedAt = datetime('now')

// NACHHER (korrekt):
UPDATE numbering_circles 
SET current = ?, lastResetYear = ?, updated_at = datetime('now')
```

### Fix 2: OfferForm Fallback entfernt
```typescript
// VORHER:
offerNumber: offer?.offerNumber || `AN-${Date.now()}`,

// NACHHER:
offerNumber: offer?.offerNumber || '', // Let useOffers handle number generation
```

## ❌ CRITICAL ERROR: Neue Probleme eingeführt

### Problem: App startet nicht mehr
- **Node.js Version Conflict**: better-sqlite3 kompiliert für NODE_MODULE_VERSION 125, benötigt 115
- **Berechtigungsfehler**: EPERM beim pnpm install --force
- **Regression**: App lief vorher, jetzt nicht mehr

### Debugging-Fehler
1. **Vergessen: Lessons Learned Template** - systematische Dokumentation nicht befolgt
2. **Scope Creep**: Rebuilds statt fokussierte Fixes
3. **Breaking Changes**: Installation-Level Änderungen während aktiver Session

## 🚨 Immediate Action Items

### ✅ ERFOLGREICHE LÖSUNG
1. **✅ App läuft wieder** - Electron startet erfolgreich nach minimaler Neuinstallation
2. **✅ Minimaler Fix angewendet** - Nur `pnpm install electron --no-optional`
3. **✅ Keine Breaking Changes** - Installation-Level Changes vermieden
4. **✅ User Confirmation** - "ja, jetzt passt es wieder"

### Nächste Validation Steps
1. ✅ App zum Laufen bringen → **ERLEDIGT**
2. 🔄 NummernkreisService testen → **PENDING**: Teste neues Angebot
3. 🔄 4-stellige Nummern validieren → **PENDING**: Sollte AN-0001 statt AN-1759... zeigen
4. 🔄 Lessons Learned vervollständigen → **IN PROGRESS**

## 📋 Lessons Learned

### Was funktionierte
- ✅ Root-Cause gefunden (Tabellennamen + Fallback)
- ✅ Korrekte Service-Fixes identifiziert

### Was schiefging
- ❌ Installation-Level Changes während Debug-Session
- ❌ Keine systematische Dokumentation von Anfang an
- ❌ Scope Creep: Node.js/pnpm Issues statt Nummernkreis-Focus

### Process Improvements
- ✅ **IMMER Lessons Learned Template starten** → **UMGESETZT**
- ✅ **Minimale, isolierte Fixes** → **ERFOLGREICH**
- ✅ **Installation-Changes nur bei absoluter Notwendigkeit** → **BEFOLGT**
- ✅ **Funktionsfähigkeit vor Feature-Fixes** → **ERREICHT**

## 🎯 Current Status: APP FUNKTIONAL

**User Confirmation:** "ja, jetzt passt es wieder"  
**Electron Status:** ✅ Läuft erfolgreich  
**Debug Session:** ✅ Systematisch dokumentiert  
**Next:** Nummernkreis-Service Testing

---

## 📍 Platzierung & Dateiname

**Diese Datei:** `docs/03-development/LESSONS-LEARNED-nummernkreis-debugging.md`  
**Verlinkt von:**  
- `docs/03-development/INDEX.md`  
- `docs/00-meta/DOCUMENTATION-STRUCTURE-GUIDE.md`