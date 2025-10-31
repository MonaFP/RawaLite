# Nummernkreise - Migration & Production Issues
+CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
## Übersicht

Die Nummernkreise sind ein zentraler Bestandteil von RawaLite und verwalten die automatische Nummerierung für verschiedene Dokumenttypen.

## Standard-Konfiguration

RawaLite verwendet standardmäßig 4 Nummernkreise:

| ID | Name | Präfix | Stellen | Reset-Modus |
|----|----|-------|---------|-------------|
| `customers` | Kunden | K- | 4 | never |
| `offers` | Angebote | AN- | 4 | yearly |
| `invoices` | Rechnungen | RE- | 4 | yearly |
| `packages` | Pakete | PAK- | 3 | never |

## Migration History

### Problem: Unvollständige Standard-Nummernkreise

**Symptom:** In Production-Builds fehlten teilweise Nummernkreise (nur 1-2 statt 4 sichtbar).

**Ursache:** Migration 003 war unvollständig und erstellte nicht alle Standard-Nummernkreise.

**Lösung:** Zusätzliche Migrations erstellt:
- **Migration 005:** Fügt `packages` Nummernkreis hinzu
- **Migration 006:** Fügt fehlende `offers` und `invoices` Nummernkreise hinzu

### Migrations-Dateien

```
src/main/db/migrations/
├── 003_fix_settings_schema.ts    (korrigiert - alle 4 Kreise)
├── 005_add_packages_numbering.ts (packages Backup-Migration)  
└── 006_fix_missing_circles.ts    (offers/invoices Backup-Migration)
```

## Database Schema

### Tabelle: `numbering_circles`

```sql
CREATE TABLE numbering_circles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  digits INTEGER NOT NULL DEFAULT 4,
  current INTEGER NOT NULL DEFAULT 0,
  resetMode TEXT NOT NULL DEFAULT 'never',
  lastResetYear INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## IPC Integration

### Main Process Handler

```typescript
// electron/main.ts
ipcMain.handle('nummernkreis:getAll', async () => {
  const db = getDb()
  const query = `
    SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
    FROM numbering_circles 
    ORDER BY name
  `
  const circles = db.prepare(query).all()
  return { success: true, data: circles }
})
```

### Frontend Context

```typescript
// src/contexts/NumberingContext.tsx
const result = await window.rawalite.nummernkreis.getAll();
if (result.success && result.data) {
  setCircles(result.data);
}
```

## Troubleshooting

### Problem: Fehlende Nummernkreise in Production

1. **Prüfe Datenbankinhalt:**
   ```sql
   SELECT id, name FROM numbering_circles ORDER BY name;
   ```

2. **Erwartetes Ergebnis:** 4 Einträge (customers, offers, invoices, packages)

3. **Bei fehlenden Einträgen:** Migration 006 sollte automatisch ausgeführt werden

### Problem: Verschiedene Dev/Prod Zustände

**Ursache:** Verschiedene AppData-Pfade:
- **Development:** `%APPDATA%\Electron\database\rawalite.db`
- **Production:** `%APPDATA%\rawalite\database\rawalite.db`

**Lösung:** Beide Datenbanken separat prüfen und validieren.

## Validation

### Automatische Prüfung nach Migration

```typescript
// Migration sollte validieren:
const finalCount = db.prepare('SELECT COUNT(*) as count FROM numbering_circles').get();
if (finalCount.count < 4) {
  throw new Error(`Expected 4 numbering circles, found ${finalCount.count}`);
}
```

## Referenzen

- **[Vollständige Analyse:](../11-lessons/NUMMERNKREISE-PRODUCTION-BUG.md)** Detaillierte Problemanalyse und Lösungsweg
- **[Schema Consistency:](../11-lessons/solved/SCHEMA-CONSISTENCY-LESSONS.md)** Verwandte Schema-Probleme und Lösungen
- **[Field Mapper:](../04-database/FIELD-MAPPER.md)** Zentrale Mapping-Logik für camelCase ↔ snake_case

---
**Status:** ✅ Alle Probleme gelöst - 4 Nummernkreise in allen Umgebungen funktional