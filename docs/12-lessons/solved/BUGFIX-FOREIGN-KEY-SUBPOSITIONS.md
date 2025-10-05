# Bugfix: FOREIGN KEY Fehler und Sub-Positionen in PDF

## Problemanalyse

### Problem 1: FOREIGN KEY constraint failed bei Angebot-Updates
**Symptom**: SqliteError beim Klick auf "Aktualisieren" in Angeboten (Änderungen werden übernommen)
**Root Cause**: parent_item_id Foreign Key Constraint Verletzung bei Line Items

### Problem 2: Sub-Positionen fehlen in PDF-Ausgabe
**Symptom**: Sub-Positionen werden nicht in der PDF angezeigt
**Root Cause**: Falsche SQL-Tabellennamen in Datenbankabfragen

## Implementierte Lösungen

### Fix 1: Foreign Key Constraint Fehler (SQLiteAdapter.ts)

#### Problem-Identifikation:
- parent_item_id verwies auf noch nicht existierende IDs
- Gleichzeitige Insertion von Parent- und Child-Items ohne Sortierung
- Foreign Key Constraint für self-referencing Tabelle nicht korrekt behandelt

#### Lösung:
```typescript
// VORHER: Unsortierte Insertion
for (const item of data.lineItems) {
  await this.client.exec(
    `INSERT INTO offer_line_items (...) VALUES (...)`,
    [..., mappedItem.parent_item_id || null]
  );
}

// NACHHER: Sortierte Insertion - Main Items first, dann Sub-Items
const mainItems = data.lineItems.filter(item => !item.parentItemId);
const subItems = data.lineItems.filter(item => item.parentItemId);

// Main Items first
for (const item of mainItems) {
  await this.client.exec(`INSERT INTO offer_line_items (...) VALUES (...)`, [..., null]);
}

// Then Sub-Items
for (const item of subItems) {
  await this.client.exec(`INSERT INTO offer_line_items (...) VALUES (...)`, [..., parentItemId || null]);
}
```

### Fix 2: SQL-Tabellenname-Korrektur

#### Problem-Identifikation:
- SQL Query verwendete camelCase `offerLineItems` statt snake_case `offer_line_items`
- SQL Query verwendete camelCase `offerId` statt snake_case `offer_id`
- Field Mapping zwischen camelCase und snake_case war inkonsistent

#### Lösung:
```typescript
// VORHER: Falsche Tabellen-/Spaltennamen
const lineItemQuery = convertSQLQuery(
  `SELECT id, title, description, quantity, unitPrice, total, parentItemId 
   FROM offerLineItems 
   WHERE offerId = ? ORDER BY id`
);

// NACHHER: Korrekte snake_case Namen mit AS-Aliasing
const lineItemQuery = convertSQLQuery(
  `SELECT id, title, description, quantity, unit_price as unitPrice, total, parent_item_id as parentItemId 
   FROM offer_line_items 
   WHERE offer_id = ? ORDER BY id`
);
```

## Betroffene Dateien

### src/adapters/SQLiteAdapter.ts
- **createOffer()**: Sortierte Line-Item Insertion hinzugefügt
- **updateOffer()**: Sortierte Line-Item Insertion hinzugefügt  
- **getOffer()**: SQL-Tabellennamen korrigiert
- **listOffers()**: SQL-Tabellennamen korrigiert

## Technische Details

### Foreign Key Self-Reference Schema
```sql
CREATE TABLE offer_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  parent_item_id INTEGER REFERENCES offer_line_items(id) ON DELETE CASCADE
);
```

### PDF-Template Sub-Item Support
Das PDF-Template unterstützte bereits Sub-Items korrekt:
```html
<tr class="${item.parentItemId ? 'sub-item' : ''}">
  <td>
    ${item.parentItemId ? '↳ ' : ''}${item.title}
    ${item.description ? `<br><small>${item.description}</small>` : ''}
  </td>
</tr>
```

## Validierung

### Build-Status: ✅ Erfolgreich
```bash
pnpm build
# ✓ vite build completed
# ✓ preload compiled  
# ✓ main compiled
```

### Erwartete Ergebnisse:
1. **Keine FOREIGN KEY Fehler** mehr beim Aktualisieren von Angeboten
2. **Sub-Positionen werden in PDF angezeigt** mit Einrückung (↳)
3. **Korrekte Hierarchie** zwischen Parent- und Child-Items

## Zusammenhang zu CRITICAL-FIXES-REGISTRY

Dieser Fix berührt keine kritischen Patterns aus dem Registry:
- ✅ WriteStream Patterns unverändert
- ✅ File System Flush Delays unverändert  
- ✅ Event Handler Patterns unverändert
- ✅ Port-Konfigurationen unverändert

## Lessons Learned

1. **Schema-Naming-Konsistenz**: camelCase (Code) vs snake_case (SQL) erfordert bewusste Übersetzung
2. **Foreign Key Self-Reference**: Sortierte Insertion notwendig für parent_item_id Constraints
3. **SQL AS-Aliasing**: Ermöglicht saubere Feldnamen-Übersetzung ohne mapFromSQL() Overhead
4. **PDF-Template Robustheit**: Template war bereits korrekt, Problem lag in Datenabfrage

## Nächste Schritte
- User-Testing der Angebot-Updates (kein FOREIGN KEY Fehler mehr)
- User-Testing der PDF-Ausgabe (Sub-Positionen sichtbar)
- Monitoring für weitere Schema-Inkonsistenzen