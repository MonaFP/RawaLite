# Nummernkreise Problem & Lösung
+CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
**Datum:** 2025-10-02  
**Status:** ✅ Gelöst  
**Kategorie:** Production Bug - Datenbank Migration

## Problem-Beschreibung

### Symptome
- **Development:** Alle 4 Nummernkreise sichtbar ✅
- **Production:** Nur 1 Nummernkreis (Kunden) sichtbar ❌
- **UI-Problem vermutet:** Zunächst angenommen, dass React-Rendering fehlerhaft

### Betroffene Bereiche
- Einstellungen > Nummernkreise Tab
- Alle 4 Standard-Nummernkreise: Kunden, Angebote, Rechnungen, Pakete

## Root-Cause-Analyse

### Debug-Prozess
1. **IPC-Communication geprüft:** Main Process lieferte korrekte Daten ✅
2. **React State untersucht:** UI-Code war korrekt ✅  
3. **Datenbank-Unterschiede entdeckt:** Verschiedene AppData-Pfade!

### Ursache gefunden
```
Development DB: C:\Users\...\AppData\Roaming\Electron\database\rawalite.db    → 4 Kreise ✅
Production DB:  C:\Users\...\AppData\Roaming\rawalite\database\rawalite.db    → 2 Kreise ❌
```

**Problem:** Migration 003 war in Production-DB unvollständig ausgeführt worden.

### Beweise
```bash
# Development (electron:dev)
🔍 [DEBUG] Main Process - Found circles: 4
- offers (Angebote, AN-)
- customers (Kunden, K-)  
- packages (Pakete, PAK-)
- invoices (Rechnungen, RE-)

# Production (dist release)
🔍 [DEBUG] Main Process - Found circles: 2  # Vor Fix
- customers (Kunden, K-)
- packages (Pakete, PAK-)  
# Fehlten: offers, invoices
```

## Technische Lösung

### 1. Migration 005 erstellt
```typescript
// src/main/db/migrations/005_add_packages_numbering.ts
export const up = (db: Database): void => {
  // Fügt packages-Nummernkreis hinzu
  if (packagesExists.count === 0) {
    db.prepare(`INSERT INTO numbering_circles ...`).run([
      'packages', 'Pakete', 'PAK-', 3, 0, 'never', null
    ]);
  }
};
```

### 2. Migration 006 erstellt  
```typescript
// src/main/db/migrations/006_fix_missing_circles.ts
export const up = (db: Database): void => {
  // Fügt offers + invoices Nummernkreise hinzu
  // Separate Migration für robuste Behandlung
};
```

### 3. Migration 003 korrigiert
```typescript
// Ursprünglich nur 3 Kreise:
const defaultCircles = [
  { id: 'customers', ... },
  { id: 'offers', ... },
  { id: 'invoices', ... }
  // ❌ FEHLTE: packages
];

// Korrigiert auf 4 Kreise:
const defaultCircles = [
  { id: 'customers', ... },
  { id: 'offers', ... }, 
  { id: 'invoices', ... },
  { id: 'packages', ... }  // ✅ HINZUGEFÜGT
];
```

## Validierung

### Nach Fix - Production Test
```bash
🔍 [DEBUG] Main Process - Found circles: 4  # ✅ Behoben!
🔍 [DEBUG] Main Process - Circle data: [
  { id: 'offers', name: 'Angebote', prefix: 'AN-' },
  { id: 'customers', name: 'Kunden', prefix: 'K-' },  
  { id: 'packages', name: 'Pakete', prefix: 'PAK-' },
  { id: 'invoices', name: 'Rechnungen', prefix: 'RE-' }
]
```

### Endstatus
- ✅ **Development:** 4 Nummernkreise  
- ✅ **Production:** 4 Nummernkreise
- ✅ **UI:** Alle 4 Kreise sichtbar und funktional

## Lessons Learned

### 1. Database Path Confusion
- **Problem:** Dev und Prod verwenden verschiedene AppData-Pfade
- **Lösung:** Bewusstsein für verschiedene Umgebungen bei Debug

### 2. Migration Robustness
- **Problem:** Unvollständige Migration schwer zu detektieren
- **Lösung:** Separate Migrations für jede Änderung + Validierung

### 3. Debug-Strategien
- **Falsch:** UI-Problem zuerst vermutet  
- **Richtig:** Systematisch von Backend nach Frontend debuggen

### 4. Production Testing
- **Wichtig:** Production Builds regelmäßig testen
- **Tool:** Debug-Logs auch in Production-Main-Process

## Präventive Maßnahmen

### 1. Migration Testing
- Alle Migrations in Dev + Prod testen
- Backup vor jeder Migration (bereits implementiert ✅)

### 2. Data Validation
- Schema-Validierung nach Migration
- Anzahl Standard-Datensätze prüfen

### 3. Debug Instrumentation
- Debug-Logs in kritischen Bereichen behalten
- Production-Monitoring für Datenintegrität

## Betroffene Dateien

### Migrations
- `src/main/db/migrations/003_fix_settings_schema.ts` (korrigiert)
- `src/main/db/migrations/005_add_packages_numbering.ts` (neu)
- `src/main/db/migrations/006_fix_missing_circles.ts` (neu)
- `src/main/db/migrations/index.ts` (aktualisiert)

### Debug Code (temporär)
- `electron/main.ts` (Debug-Logs hinzugefügt)
- `src/contexts/NumberingContext.tsx` (Debug-Logs hinzugefügt)

## Timeline

- **Problem entdeckt:** UI zeigt nur 1 Nummernkreis in Production
- **Debug-Phase:** IPC + React State untersucht
- **Root Cause gefunden:** Production DB unvollständig
- **Migrations erstellt:** 005 + 006 für fehlende Kreise
- **Problem gelöst:** Alle 4 Nummernkreise in Dev + Prod sichtbar
- **Dokumentiert:** Vollständige Analyse und Lösung festgehalten

---
**Status:** ✅ **GELÖST** - Alle 4 Nummernkreise funktional in allen Modi