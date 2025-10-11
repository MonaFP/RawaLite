# RawaLite Status-Dropdown Problem - Umfassender Statusbericht

**Datum:** 05. Oktober 2025  
**Problem:** Status-Dropdown bei Angeboten und Rechnungen hat keine Funktion  
**Analyse-Status:** ✅ Komplett - Keine Reparaturen durchgeführt

## 🎯 PROBLEM-ÜBERBLICK

### Berichtetes Problem
- **Original Meldung:** "die Statusänderung bei rechnung und Angebot ist broken, der Dropwdown hat keine Funktion"
- **Symptome:** Status-Dropdown reagiert nicht auf Auswahl
- **Betroffene Bereiche:** AngebotePage.tsx und RechnungenPage.tsx

## 📊 DATENBANK-ANALYSE

### Database Status: ✅ FUNKTIONAL
- **Pfad:** `%APPDATA%\RawaLite\database\rawalite.db`
- **Größe:** 292 KB (enthält echte Daten)
- **better-sqlite3:** ✅ Korrekt für Electron ABI 125 kompiliert
- **Datenbankverbindung:** ✅ Funktional in Electron-Umgebung

### Tabellen-Struktur

#### `offers` Tabelle (3 Einträge)
```sql
- id: INTEGER (PRIMARY KEY)
- offer_number: TEXT NOT NULL  
- customer_id: INTEGER NOT NULL
- title: TEXT NOT NULL
- status: TEXT NOT NULL           ← STATUS-FELD VORHANDEN
- valid_until: TEXT NOT NULL
- subtotal, vat_rate, vat_amount, total: REAL
- notes: TEXT
- sent_at: TEXT                   ← STATUS-DATUM FELDER
- accepted_at: TEXT               ← STATUS-DATUM FELDER  
- rejected_at: TEXT               ← STATUS-DATUM FELDER
- created_at, updated_at: TEXT NOT NULL
- discount_type, discount_value, discount_amount: REAL
- subtotal_before_discount: REAL
```

**Aktuelle Daten:**
- AN-0001: Status 'draft', Customer 15, Total 295.62€
- AN-0002: Status 'draft', Customer 15, Total 1305€  
- AN-0003: Status 'draft', Customer 2, Total 200€

#### `invoices` Tabelle (1 Eintrag)
```sql
- id: INTEGER (PRIMARY KEY)
- invoice_number: TEXT NOT NULL
- customer_id: INTEGER NOT NULL  
- offer_id: INTEGER
- title: TEXT NOT NULL
- status: TEXT NOT NULL           ← STATUS-FELD VORHANDEN
- due_date: TEXT NOT NULL
- subtotal, vat_rate, vat_amount, total: REAL
- notes: TEXT
- sent_at: TEXT                   ← STATUS-DATUM FELDER
- paid_at: TEXT                   ← STATUS-DATUM FELDER
- overdue_at: TEXT                ← STATUS-DATUM FELDER  
- cancelled_at: TEXT              ← STATUS-DATUM FELDER
- created_at, updated_at: TEXT NOT NULL
- discount_type, discount_value, discount_amount: REAL
- subtotal_before_discount: REAL
```

**Aktuelle Daten:**
- RE-0001: Status 'draft', Customer 2, Total 200.01€

### Status-Feld-Kompatibilität: ✅ VOLLSTÄNDIG
- ✅ Beide Tabellen haben `status` Spalte
- ✅ Beide haben entsprechende Datums-Spalten für Status-Übergänge
- ✅ Schema ist konsistent und vollständig

## 🔧 FRONTEND-ANALYSE

### React-Komponenten: ⚠️ PROBLEMATISCH

#### AngebotePage.tsx - Status-Dropdown Implementation
```tsx
// Status-Dropdown in Tabelle (Zeile 189)
<select
  value={row.status}
  onChange={(e) => handleStatusChange(row.id, e.target.value as Offer['status'])}
  className="px-2 py-1 text-sm border rounded"
>
  <option value="draft">Entwurf</option>
  <option value="sent">Versendet</option>
  <option value="accepted">Angenommen</option>
  <option value="rejected">Abgelehnt</option>
</select>
```

#### RechnungenPage.tsx - Status-Dropdown Implementation  
```tsx
// Status-Dropdown in Tabelle (Zeile 177)
<select
  value={row.status}
  onChange={(e) => handleStatusChange(row.id, e.target.value as Invoice['status'])}
  className="px-2 py-1 text-sm border rounded"
>
  <option value="draft">Entwurf</option>
  <option value="sent">Versendet</option> 
  <option value="paid">Bezahlt</option>
  <option value="overdue">Überfällig</option>
  <option value="cancelled">Storniert</option>
</select>
```

### handleStatusChange-Funktionen: ✅ IMPLEMENTIERT

#### AngebotePage handleStatusChange (Zeile 223)
```typescript
async function handleStatusChange(offerId: number, newStatus: Offer['status']) {
  console.log('🔧 [ANGEBOTE] Status change requested:', { offerId, newStatus });
  
  // Umfangreiche Debug-Ausgaben vorhanden
  // Fallback-Logik für filteredData implementiert
  // Status-Datums-Logik korrekt implementiert
  // updateOffer() Aufruf vorhanden
}
```

#### RechnungenPage handleStatusChange (Zeile 212)
```typescript  
async function handleStatusChange(invoiceId: number, newStatus: Invoice['status']) {
  console.log('🔧 [RECHNUNGEN] Status change requested:', { invoiceId, newStatus });
  
  // Ähnliche Struktur wie AngebotePage
  // updateInvoice() Aufruf vorhanden
}
```

## 🔄 PERSISTENCE-SYSTEM-ANALYSE

### Architecture Overview: ✅ KORREKT STRUKTURIERT

```
React Components (AngebotePage/RechnungenPage)
       ↓
React Hooks (useOffers/useInvoices) 
       ↓
PersistenceContext + SQLiteAdapter
       ↓  
DbClient (field-mapping + IPC)
       ↓
Electron Main Process (Database IPC handlers)
       ↓
better-sqlite3 + rawalite.db
```

### Potenzielle Problemquellen

#### 1. PersistenceContext Initialization
```typescript
// PersistenceProvider.tsx
useEffect(() => {
  let active = true;
  (async () => {
    try {
      await instance.ready();        // ← Könnte fehlschlagen
      if (!active) return;
      setAdapter(instance);
      setReady(true);               // ← ready=false → hooks laden nicht
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  })();
}, [instance]);
```

#### 2. React Hooks Dependency Chain
```typescript
// useOffers.ts
useEffect(() => {
  if (!ready || !adapter) return;  // ← Wenn ready=false, lädt nichts
  
  const loadOffers = async () => {
    const data = await adapter.listOffers();  // ← Könnte leeres Array zurückgeben
    setOffers(data);
  };
}, [ready, adapter]);
```

#### 3. SQLiteAdapter Data Loading
```typescript
// SQLiteAdapter.ts - listOffers()
async listOffers(): Promise<Offer[]> {
  const query = convertSQLQuery(`SELECT * FROM offers ORDER BY createdAt DESC`);
  const offers = await this.client.query<Omit<Offer, "lineItems">>(query);
  
  // Field-mapping könnte Probleme verursachen
  const result: Offer[] = [];
  for (const offer of offers) {
    const mappedOffer = mapFromSQL(offer);  // ← Field-mapping
    // ... lineItems loading
  }
}
```

#### 4. DbClient Field Mapping  
```typescript
// DbClient.ts - query()
async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const mappedSQL = convertSQLQuery(sql);     // camelCase → snake_case
  const result = await this.getDatabaseAPI().query(mappedSQL, mappedParams);
  const mappedResult = mapFromSQLArray(result) as T[];  // snake_case → camelCase
  return mappedResult;
}
```

## 🔍 WAHRSCHEINLICHE PROBLEM-URSACHEN

### Primäre Verdächtige (in Prioritätsreihenfolge):

#### 1. **PersistenceContext nicht ready** ⭐⭐⭐
- `ready=false` verhindert das Laden der Daten
- Hooks geben leere Arrays zurück  
- Status-Dropdown funktioniert nicht, da keine Daten vorhanden

#### 2. **Field-Mapping Fehler** ⭐⭐
- `convertSQLQuery()` oder `mapFromSQL()` konvertiert falsch
- Daten werden geladen, aber falsch transformiert
- Resultat: leere oder defekte Arrays

#### 3. **IPC Communication Problem** ⭐⭐  
- Electron IPC zwischen Renderer und Main Process gestört
- `window.rawalite.db.query()` funktioniert nicht korrekt
- DbClient erhält keine Daten

#### 4. **React State Management** ⭐
- Race Conditions in useEffect
- State Updates kommen nicht an
- Komponenten rendern mit veralteten Daten

## 🎯 DEBUG-INFORMATIONEN

### Console Logs bereits vorhanden:
```typescript
// AngebotePage.tsx
console.log('🔍 [ANGEBOTE PAGE] offers from useOffers:', offers);
console.log('🔍 [ANGEBOTE PAGE] offersLoading:', offersLoading);  
console.log('🔍 [ANGEBOTE PAGE] offersError:', offersError);

// RechnungenPage.tsx  
console.log('🔍 [RECHNUNGEN PAGE] invoices from useInvoices:', invoices);
console.log('🔍 [RECHNUNGEN PAGE] invoicesLoading:', invoicesLoading);
console.log('🔍 [RECHNUNGEN PAGE] invoicesError:', invoicesError);

// DbClient.ts
console.log('DbClient.query', { originalSQL: sql, mappedSQL, params });
console.log('DbClient.query result', { rawCount: result.length, mappedCount: mappedResult.length });
```

## 🚀 EMPFOHLENES DEBUGGING-VORGEHEN

### Phase 1: Grundsätzliche Datenladung verifizieren
1. **PersistenceContext Status prüfen**
   - `ready` State in Browser DevTools überprüfen
   - `error` State auf Fehlermeldungen checken

2. **IPC Communication testen**
   - `window.rawalite.db.query("SELECT * FROM offers")` in Browser Console
   - Direct Database Access validieren

3. **Field-Mapping verifizieren**  
   - Raw Database Results vs. gemappte Results vergleichen
   - `convertSQLQuery()` Input/Output loggen

### Phase 2: React State Management debuggen
1. **Hook States überwachen**
   - `offers` Array Inhalt in Browser DevTools
   - `loading` und `error` States verfolgen

2. **Component Re-rendering**
   - Wann komponenten neu rendern
   - State Propagation durch Component Tree

### Phase 3: Status-Update-Mechanismus
1. **handleStatusChange Execution**
   - Console Logs auf Status-Change-Versuche prüfen
   - updateOffer/updateInvoice Database Calls verfolgen

2. **Database Updates**
   - Änderungen in rawalite.db verifizieren
   - Optimistic UI Updates vs. Database Reality

## ⚙️ SYSTEM-STATUS

### Funktional ✅
- better-sqlite3 Kompilierung für Electron
- Datenbank-Schema und Daten-Integrität  
- Frontend-Komponenten und Event-Handler
- Debug-Logging-Infrastructure

### Zu untersuchen ⚠️
- PersistenceContext Initialization
- Data Loading Pipeline
- Field-Mapping Korrektheit
- React State Synchronization

### Verdächtig 🔍
- Leere Arrays von useOffers/useInvoices trotz vorhandener Daten
- Mögliche IPC oder Field-Mapping Probleme
- Timing-Issues bei Component Initialization

---

**🎯 NÄCHSTE SCHRITTE:** Systematisches Debugging beginnend mit PersistenceContext ready-State und IPC Communication-Test, gefolgt von Field-Mapping-Verifikation.

**📝 HINWEIS:** Alle Komponenten sind grundsätzlich korrekt implementiert. Das Problem liegt wahrscheinlich in der Datenladung oder -transformation, nicht in der UI-Logik.