# 🎯 PLAN: Vereinheitlichung PackageLineItem.amount → unitPrice

**Status:** 📋 GEPLANT (NICHT AUSGEFÜHRT)  
**Erstellt:** 2025-10-14  
**Ziel:** Konsistente Benennung aller Line Item Interfaces

---

## 📌 ÜBERSICHT

### **Problem:**
- `PackageLineItem` verwendet `amount` für "Preis pro Einheit"
- `OfferLineItem` / `InvoiceLineItem` verwenden `unitPrice` für "Preis pro Einheit"
- → Inkonsistenz führt zu Verwirrung und mentaler Übersetzung

### **Lösung:**
- Vereinheitliche `PackageLineItem.amount` → `PackageLineItem.unitPrice`
- Datenbank bleibt bei `unit_price` (bereits durch Migration 021 einheitlich)
- Field-Mapper mappt weiterhin `unitPrice` ↔ `unit_price`

### **Vorteile:**
- ✅ Konsistente Benennung über alle Line Items
- ✅ Klarheit: "unitPrice" ist selbsterklärend
- ✅ Weniger Fehleranfälligkeit bei Copy-Paste
- ✅ Einfacher für neue Entwickler

### **Aufwand:**
- 📁 **5 Dateien** zu ändern
- 📝 **~30 Zeilen Code** anzupassen
- ⏱️ **Geschätzt:** 30-45 Minuten

---

## 🎯 SCOPE: WAS WIRD GEÄNDERT?

### ✅ **WIRD GEÄNDERT: Package Line Items**
```typescript
// VORHER:
interface PackageLineItem {
  amount: number;  // Preis pro Einheit
}

// NACHHER:
interface PackageLineItem {
  unitPrice: number;  // Preis pro Einheit
}
```

### ❌ **WIRD NICHT GEÄNDERT: Timesheets**
```typescript
// BLEIBT GLEICH (semantisch anders):
interface PositionActivity {
  amount: number;  // Gesamt: hours * hourlyRate
}

interface TimesheetPosition {
  totalAmount: number;  // Summe aller activities
}
```

**Grund:** Bei Timesheets ist `amount` ein **berechneter Gesamtbetrag**, kein Preis pro Einheit.

---

## 📋 DETAILLIERTER UMSETZUNGSPLAN

### **Phase 1: Interface-Definition ändern** 🔧

#### 1.1 **src/persistence/adapter.ts**
```typescript
export interface PackageLineItem {
  id: number;
  title: string;
  quantity: number;
  unitPrice: number;  // ← ÄNDERUNG: amount → unitPrice
  parentItemId?: number;
  description?: string;
  itemOrigin?: 'manual' | 'package_import' | 'template';
  sortOrder?: number;
  clientTempId?: string;
  priceDisplayMode?: PriceDisplayMode;
  hierarchyLevel?: number;
}
```

**Änderungen:**
- Line 43: `amount: number;` → `unitPrice: number;`
- Kommentar hinzufügen: `// Price per unit (stored as unit_price in DB via field-mapper)`

---

### **Phase 2: PackageForm.tsx anpassen** 🎨

**Datei:** `src/components/PackageForm.tsx`

#### 2.1 **Initial Values (Line 40)**
```typescript
// VORHER:
const emptyItem = {
  id: -Date.now(),
  title: "",
  quantity: 1,
  amount: 0,  // ← ÄNDERN
  description: "",
};

// NACHHER:
const emptyItem = {
  id: -Date.now(),
  title: "",
  quantity: 1,
  unitPrice: 0,  // ← GEÄNDERT
  description: "",
};
```

#### 2.2 **Item State (Line 92)**
```typescript
// VORHER:
amount: currentItem.amount,

// NACHHER:
unitPrice: currentItem.unitPrice,
```

#### 2.3 **Main Item Template (Line 108)**
```typescript
// VORHER:
amount: 0,

// NACHHER:
unitPrice: 0,
```

#### 2.4 **Validation (Line 465)**
```typescript
// VORHER:
if (item.amount < 0) {
  errors[`item_${index}_amount`] = "Betrag darf nicht negativ sein";
}

// NACHHER:
if (item.unitPrice < 0) {
  errors[`item_${index}_unitPrice`] = "Preis pro Einheit darf nicht negativ sein";
}
```

#### 2.5 **Total Calculation (Line 492)**
```typescript
// VORHER:
return sum + (item.quantity * item.amount);

// NACHHER:
return sum + (item.quantity * item.unitPrice);
```

#### 2.6 **Preview Calculation (Line 604)**
```typescript
// VORHER:
<span>💰 €{values.lineItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0).toFixed(2)}</span>

// NACHHER:
<span>💰 €{values.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</span>
```

#### 2.7 **Parent Total Calculation (Line 648)**
```typescript
// VORHER:
const parentTotal = parent.quantity * parent.amount + subItems.reduce((sum, sub) => sum + (sub.quantity * sub.amount), 0);

// NACHHER:
const parentTotal = parent.quantity * parent.unitPrice + subItems.reduce((sum, sub) => sum + (sub.quantity * sub.unitPrice), 0);
```

#### 2.8 **Parent Key (Line 651)**
```typescript
// VORHER:
<div key={`parent-${parentIndex}-${parent.title}-${parent.quantity}-${parent.amount}`} style={{ ... }}>

// NACHHER:
<div key={`parent-${parentIndex}-${parent.title}-${parent.quantity}-${parent.unitPrice}`} style={{ ... }}>
```

#### 2.9 **Sub-Item Total Calculation (Line 681)**
```typescript
// VORHER:
const subTotal = sub.quantity * sub.amount;

// NACHHER:
const subTotal = sub.quantity * sub.unitPrice;
```

#### 2.10 **Sub-Item Key (Line 683)**
```typescript
// VORHER:
<div key={`sub-${subIndex}-${sub.title}-${sub.quantity}-${sub.amount}`} style={{ ... }}>

// NACHHER:
<div key={`sub-${subIndex}-${sub.title}-${sub.quantity}-${sub.unitPrice}`} style={{ ... }}>
```

#### 2.11 **Parent Input Field (Line 956)**
```typescript
// VORHER:
value={formatNumberInputValue(parentItem.amount)}

// NACHHER:
value={formatNumberInputValue(parentItem.unitPrice)}
```

#### 2.12 **Sub-Item Input Field (Line 1139)**
```typescript
// VORHER:
value={formatNumberInputValue(subItem.amount)}

// NACHHER:
value={formatNumberInputValue(subItem.unitPrice)}
```

#### 2.13 **Current Item Input Field (Line 1378)**
```typescript
// VORHER:
value={formatNumberInputValue(currentItem.amount)}

// NACHHER:
value={formatNumberInputValue(currentItem.unitPrice)}
```

#### 2.14 **Current Item onChange (Line 1379)**
```typescript
// VORHER:
onChange={e => setCurrentItem(prev => ({ ...prev, amount: parseNumberInput(e.target.value) }))}

// NACHHER:
onChange={e => setCurrentItem(prev => ({ ...prev, unitPrice: parseNumberInput(e.target.value) }))}
```

**Anzahl Änderungen in PackageForm.tsx:** **14 Stellen**

---

### **Phase 3: OfferForm.tsx anpassen** 📝

**Datei:** `src/components/OfferForm.tsx`

#### 3.1 **Package Import Mapping (Line 321-322)**
```typescript
// VORHER:
unitPrice: item.amount, // PackageLineItem still uses 'amount' in frontend interface
total: item.quantity * item.amount,

// NACHHER:
unitPrice: item.unitPrice, // PackageLineItem now uses 'unitPrice' consistently
total: item.quantity * item.unitPrice,
```

**Änderungen:**
- Line 321: `item.amount` → `item.unitPrice`
- Line 322: `item.amount` → `item.unitPrice`
- Kommentar aktualisieren

**Anzahl Änderungen in OfferForm.tsx:** **2 Stellen + 1 Kommentar**

---

### **Phase 4: usePackages.ts Hook anpassen** 🪝

**Datei:** `src/hooks/usePackages.ts`

#### 4.1 **Total Calculation (Line 48)**
```typescript
// VORHER:
const calculatedTotal = data.total || data.lineItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);

// NACHHER:
const calculatedTotal = data.total || data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
```

**Anzahl Änderungen in usePackages.ts:** **1 Stelle**

---

### **Phase 5: PaketePage.tsx anpassen** 📄

**Datei:** `src/pages/PaketePage.tsx`

#### 5.1 **Line Item Mapping (Line 288)**
```typescript
// VORHER:
amount: li.amount,

// NACHHER:
unitPrice: li.unitPrice,
```

**Anzahl Änderungen in PaketePage.tsx:** **1 Stelle**

---

### **Phase 6: SQLiteAdapter.ts (bereits korrekt!)** ✅

**Datei:** `src/adapters/SQLiteAdapter.ts`

**Status:** ✅ **BEREITS KORREKT** durch vorherige Fixes

```typescript
// Lines 256-261: listPackages()
const lineItemQuery = convertSQLQuery(`SELECT id, title, quantity, unitPrice, parentItemId, description, priceDisplayMode FROM packageLineItems WHERE packageId = ? ORDER BY id`);
const lineItems = mapFromSQLArray(lineItemRows).map(item => ({
  id: item.id,
  title: item.title,
  quantity: item.quantity,
  amount: item.unitPrice ?? 0,  // ← WIRD ZU: unitPrice: item.unitPrice ?? 0
  ...
}));

// Lines 282-287: getPackage()
const lineItemQuery = convertSQLQuery(`SELECT id, title, quantity, unitPrice, parentItemId, description, priceDisplayMode FROM packageLineItems WHERE packageId = ? ORDER BY id`);
const lineItems = mapFromSQLArray(lineItemRows).map(item => ({
  id: item.id,
  title: item.title,
  quantity: item.quantity,
  amount: item.unitPrice ?? 0,  // ← WIRD ZU: unitPrice: item.unitPrice ?? 0
  ...
}));
```

**Änderungen:**
- Line 261: `amount: item.unitPrice ?? 0` → `unitPrice: item.unitPrice ?? 0`
- Line 287: `amount: item.unitPrice ?? 0` → `unitPrice: item.unitPrice ?? 0`

**Anzahl Änderungen in SQLiteAdapter.ts:** **2 Stellen**

---

## 📊 ZUSAMMENFASSUNG

### **Gesamtübersicht der Änderungen:**

| Datei | Zeilen | Änderungen |
|-------|--------|------------|
| `src/persistence/adapter.ts` | 43 | 1 Property-Definition + Kommentar |
| `src/components/PackageForm.tsx` | 40, 92, 108, 465, 492, 604, 648, 651, 681, 683, 956, 1139, 1378, 1379 | 14 Stellen |
| `src/components/OfferForm.tsx` | 321, 322 | 2 Stellen + Kommentar |
| `src/hooks/usePackages.ts` | 48 | 1 Stelle |
| `src/pages/PaketePage.tsx` | 288 | 1 Stelle |
| `src/adapters/SQLiteAdapter.ts` | 261, 287 | 2 Stellen |
| **GESAMT** | | **21 Stellen in 6 Dateien** |

---

## 🧪 TESTING PLAN

### **1. TypeScript Validation**
```bash
pnpm typecheck
```
**Erwartung:** ✅ Keine Fehler

### **2. Unit Tests**
```bash
pnpm test
```
**Erwartung:** ✅ Alle Tests grün

### **3. Manuelle Tests**

#### Test 1: Package erstellen
1. Öffne "Pakete" → "Neues Paket"
2. Erstelle Paket mit Hauptposition:
   - Titel: "Test Position"
   - Menge: 2
   - Preis pro Einheit: 100,00€
3. **Erwartung:** Total = 200,00€

#### Test 2: Package mit Sub-Items
1. Erstelle Hauptposition (wie oben)
2. Füge Sub-Item hinzu:
   - Titel: "Sub-Position"
   - Menge: 1
   - Preis pro Einheit: 50,00€
3. **Erwartung:** Parent Total = 250,00€ (200 + 50)

#### Test 3: Package in Offer importieren
1. Erstelle neues Angebot
2. Importiere Package aus Test 2
3. **Erwartung:** 
   - Hauptposition: 2 × 100€ = 200€
   - Sub-Position: 1 × 50€ = 50€
   - Angebot Subtotal: 250€

#### Test 4: Bestehende Packages laden
1. Öffne existierendes Package
2. Prüfe, ob Preise korrekt angezeigt werden
3. **Erwartung:** Alle Werte korrekt (Field-Mapper konvertiert)

#### Test 5: Package bearbeiten & speichern
1. Öffne Package
2. Ändere Preis einer Position
3. Speichern
4. Neu laden
5. **Erwartung:** Änderung persistiert

### **4. Critical Fixes Validation**
```bash
pnpm validate:critical-fixes
```
**Erwartung:** ✅ Alle Critical Fixes erhalten

---

## 🚨 RISIKEN & MITIGATION

### **Risiko 1: Bestehende Packages nicht ladbar**
**Wahrscheinlichkeit:** ⚠️ MITTEL  
**Impact:** 🔴 HOCH  
**Mitigation:**
- Field-Mapper konvertiert automatisch `unit_price` → `unitPrice`
- Datenbank-Schema unverändert (Migration 021 bereits durchgeführt)
- Falls Problem: Rollback via Git

### **Risiko 2: Vergessene Stellen im Code**
**Wahrscheinlichkeit:** ⚠️ MITTEL  
**Impact:** 🟡 MITTEL  
**Mitigation:**
- TypeScript wirft Fehler bei falscher Property
- Grep-Suche vor Abschluss: `grep -r "\.amount" src/` (nur Package-relevante prüfen)
- Manuelle Tests decken Hauptszenarien ab

### **Risiko 3: Tests schlagen fehl**
**Wahrscheinlichkeit:** ⚠️ NIEDRIG  
**Impact:** 🟢 NIEDRIG  
**Mitigation:**
- Tests erst nach Code-Änderungen laufen lassen
- Bei Failures: Tests entsprechend anpassen

---

## 📝 REIHENFOLGE DER UMSETZUNG

**Wichtig:** Schritte in dieser Reihenfolge ausführen!

1. ✅ **Branch erstellen**
   ```bash
   git checkout -b feature/unify-package-unitprice
   ```

2. ✅ **Phase 1:** Interface-Definition (`adapter.ts`)
   - TypeScript-Fehler werden erscheinen (erwartet!)

3. ✅ **Phase 2:** PackageForm.tsx (14 Stellen)
   - Viele TypeScript-Fehler verschwinden

4. ✅ **Phase 3:** OfferForm.tsx (2 Stellen)
   - Package-Import wird konsistent

5. ✅ **Phase 4:** usePackages.ts (1 Stelle)
   - Hook-Berechnung korrigiert

6. ✅ **Phase 5:** PaketePage.tsx (1 Stelle)
   - Seiten-Mapping korrigiert

7. ✅ **Phase 6:** SQLiteAdapter.ts (2 Stellen)
   - Datenbank-Mapping konsistent

8. ✅ **Validation:**
   ```bash
   pnpm typecheck
   pnpm validate:critical-fixes
   ```

9. ✅ **Testing:** Manuelle Tests durchführen (siehe Testing Plan)

10. ✅ **Commit & Push:**
    ```bash
    git add .
    git commit -m "refactor: unify PackageLineItem.amount to unitPrice for consistency"
    git push origin feature/unify-package-unitprice
    ```

---

## 📚 DOKUMENTATION UPDATE

Nach erfolgreicher Umsetzung folgende Docs aktualisieren:

### **1. CRITICAL_KI-FAILURE-MODES.md**
```markdown
## ✅ RESOLVED: PackageLineItem.amount Inkonsistenz

**Was war das Problem?**
- PackageLineItem nutzte `amount`, während Offer/Invoice `unitPrice` nutzten
- Führte zu Verwirrung und mentaler Übersetzung

**Lösung:**
- Vereinheitlicht zu `unitPrice` in allen Line Item Interfaces
- Datenbank bleibt bei `unit_price` (Migration 021)
- Field-Mapper macht automatische Konvertierung

**Datum:** 2025-10-14
```

### **2. CODING-STANDARDS.md**
```markdown
## Line Item Interface Naming

**KONSISTENT: Preis pro Einheit heißt immer `unitPrice`**

```typescript
✅ KORREKT:
interface PackageLineItem {
  unitPrice: number;  // Preis pro Einheit
}

interface OfferLineItem {
  unitPrice: number;  // Preis pro Einheit
  total: number;      // Gesamt: quantity * unitPrice
}

❌ FALSCH:
interface PackageLineItem {
  amount: number;  // Verwirrend - ist das unitPrice oder total?
}
```

**Ausnahme: Timesheet `amount`**
Bei Timesheets ist `amount` ein **berechneter Gesamtbetrag** (hours × hourlyRate), nicht unitPrice.
```

---

## ✅ ERFOLGS-KRITERIEN

Projekt ist erfolgreich, wenn:

- [ ] TypeScript kompiliert ohne Fehler (`pnpm typecheck`)
- [ ] Alle Critical Fixes erhalten (`pnpm validate:critical-fixes`)
- [ ] Alle manuellen Tests bestanden
- [ ] Bestehende Packages laden korrekt
- [ ] Neue Packages erstellen funktioniert
- [ ] Package-Import in Offers funktioniert
- [ ] Dokumentation aktualisiert

---

## 🔄 ROLLBACK PLAN

Falls kritische Probleme auftreten:

```bash
# Branch verwerfen
git checkout main
git branch -D feature/unify-package-unitprice

# Oder: Commits rückgängig machen
git revert <commit-hash>
```

**Datenbank:** Keine Änderungen nötig (Schema unverändert)

---

## 📞 SUPPORT

Bei Problemen während der Umsetzung:
1. TypeScript-Fehler genau lesen
2. Grep-Suche nutzen: `grep -rn "\.amount" src/components/ src/hooks/ src/pages/`
3. Dieser Plan als Referenz nutzen

---

**ENDE DES PLANS** ✅
