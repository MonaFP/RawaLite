# RawaLite v1.8.31 Release Notes

**Typ:** PATCH Release (Bug Fixes & UI-Verbesserungen)  
**Datum:** 19. September 2025  

## 🛠️ Kritische Fixes

### SQLite Stabilität
- **Transaction-Handling**: Behoben "cannot start a transaction within a transaction" Fehler
- **State-Tracking**: Verschachtelte Transaktionen werden intelligent vermieden
- **Error-Recovery**: Saubere ROLLBACK-Behandlung bei Datenbankfehlern
- **Settings-Adapter**: Null coalescing für SQLite binding errors

### UI/UX Verbesserungen
- **Filter-Dropdown**: Weiße Schrift auf weißem Hintergrund behoben
- **CSS-Variablen**: Korrekte Farbwerte für bessere Lesbarkeit
- **Filter-Button**: Vereinfacht von "Filter: Spalten ⚙️" zu "Filter ⚙️"
- **Theme-Kompatibilität**: Alle 5 Pastel-Themes unterstützt

## 📋 Technische Details

### Database Layer
```typescript
// Transaction-State-Tracking verhindert Verschachtelung
let inTransaction = false;
export async function withTx<T>(fn: () => T | Promise<T>): Promise<T>
```

### UI Components
```typescript
// Korrekte CSS-Werte statt undefinierte Variablen
background: 'white', // statt 'var(--background)'
color: '#374151',    // statt 'var(--foreground)'
```

## 🎯 Zielgruppe

**Anwender-Impact:** Hoch
- Keine Datenbankfehler mehr in der Konsole
- Bessere Lesbarkeit der Filter-Funktionen
- Stabilere Settings-Verwaltung

**Entwickler-Impact:** Mittel
- Robustere Transaction-Patterns
- Konsistente CSS-Variable-Nutzung

## 📦 Installation

**Automatisch:** RawaLite Update-System erkennt neue Version  
**Manuell:** Download von GitHub Releases

## 🔄 Update-Strategie

Gemäß Asset-Strategie: **PATCH Release = Source Code only**
- ✅ Source Code (automatisch von GitHub)
- ⚪ Setup.exe (optional bei Bedarf)
- Update-Mechanismus nutzt Source Code

## ✅ Validierung

- [x] SQLite Transaction-Fehler behoben
- [x] Filter-UI Lesbarkeit wiederhergestellt  
- [x] Version 1.8.31 in package.json
- [x] Build erfolgreich (172.47 MB)
- [x] Installation getestet