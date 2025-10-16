# PLAN: PackageLineItem.amount → unitPrice Vereinheitlichung

**Erstellt:** 2025-10-14  
**Status:** 📋 BEREIT ZUR UMSETZUNG  
**Aufwand:** 45-60 Minuten (inkl. Testing)  
**Risiko:** 🟡 Mittel

---

## 🎯 ZIEL

Vereinheitlichung der Interface-Property-Namen für Einzelpreise:
- **Von:** `PackageLineItem.amount` (inkonsistent)
- **Zu:** `PackageLineItem.unitPrice` (wie OfferLineItem/InvoiceLineItem)

**Warum?**
- ✅ Konsistenz über alle Line Item Interfaces
- ✅ Klarheit: "unitPrice" ist selbsterklärend
- ✅ Weniger Verwirrung beim Package→Offer Import
- ✅ Einfacher für neue Entwickler

---

## 📊 ANALYSE

### **Datenbank (✅ Bereits konsistent):**
```sql
-- Migration 021 - Kein DB-Change nötig!
CREATE TABLE package_line_items (
  unit_price REAL NOT NULL  -- ← Bereits korrekt
);
```

### **Field-Mapper (✅ Funktioniert korrekt):**
```typescript
// field-mapper.ts Line 87
'amount': 'unit_price',  // ← Auto-Konvertierung vorhanden
```
**Nach Refactoring:**
```typescript
'unitPrice': 'unit_price',  // ← Semantisch korrekt
```

### **Problem:**
- Interface definiert `amount`, Code nutzt `amount`
- Field-Mapper übersetzt automatisch, aber Namen ist irreführend
- Beim Package→Offer Import Verwirrung (amount vs unitPrice)

---

## 📋 ÄNDERUNGEN (21 Stellen in 6 Dateien)

### **1. Interface Definition (1 Stelle)**

#### `src/persistence/adapter.ts` (Line 47)
```typescript
// ❌ VORHER:
export interface PackageLineItem {
  id: number;
  title: string;
  quantity: number;
  amount: number;  // ← ÄNDERN
  parentItemId?: number;
  // ...
}

// ✅ NACHHER:
export interface PackageLineItem {
  id: number;
  title: string;
  quantity: number;
  unitPrice: number;  // ← GEÄNDERT
  parentItemId?: number;
  // ...
}
```

---

### **2. PackageForm.tsx (14 Stellen)**

#### **Initial State (Line 40)**
```typescript
// ❌ VORHER:
const [currentItem, setCurrentItem] = useState({ 
  title: "", 
  quantity: 1, 
  amount: 0,  // ← ÄNDERN
  parentItemId: undefined as number | undefined,
  description: "",
  priceDisplayMode: 'default' as 'default' | 'included' | 'hidden' | 'optional'
});

// ✅ NACHHER:
const [currentItem, setCurrentItem] = useState({ 
  title: "", 
  quantity: 1, 
  unitPrice: 0,  // ← GEÄNDERT
  parentItemId: undefined as number | undefined,
  description: "",
  priceDisplayMode: 'default' as 'default' | 'included' | 'hidden' | 'optional'
});
```

#### **addLineItem() - Item Creation (Line 92)**
```typescript
// ❌ VORHER:
const newItem = { 
  title: currentItem.title.trim(), 
  quantity: currentItem.quantity, 
  amount: currentItem.amount,  // ← ÄNDERN
  parentItemId: currentItem.parentItemId,
  description: currentItem.description?.trim() || undefined,
  priceDisplayMode: currentItem.priceDisplayMode
};

// ✅ NACHHER:
const newItem = { 
  title: currentItem.title.trim(), 
  quantity: currentItem.quantity, 
  unitPrice: currentItem.unitPrice,  // ← GEÄNDERT
  parentItemId: currentItem.parentItemId,
  description: currentItem.description?.trim() || undefined,
  priceDisplayMode: currentItem.priceDisplayMode
};
```

#### **Reset nach Add (Line 108)**
```typescript
// ❌ VORHER:
setCurrentItem({ 
  title: "", 
  quantity: 1, 
  amount: 0,  // ← ÄNDERN
  parentItemId: undefined,
  description: "",
  priceDisplayMode: 'default'
});

// ✅ NACHHER:
setCurrentItem({ 
  title: "", 
  quantity: 1, 
  unitPrice: 0,  // ← GEÄNDERT
  parentItemId: undefined,
  description: "",
  priceDisplayMode: 'default'
});
```

#### **Validation (Line 465-466)**
```typescript
// ❌ VORHER:
if (item.amount < 0) {
  errors[`item_${index}_amount`] = "Betrag darf nicht negativ sein";
}

// ✅ NACHHER:
if (item.unitPrice < 0) {
  errors[`item_${index}_unitPrice`] = "Betrag darf nicht negativ sein";
}
```

#### **Total Calculation 1 (Line 492)**
```typescript
// ❌ VORHER:
return sum + (item.quantity * item.amount);

// ✅ NACHHER:
return sum + (item.quantity * item.unitPrice);
```

#### **Total Display (Line 604)**
```typescript
// ❌ VORHER:
<span>💰 €{values.lineItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0).toFixed(2)}</span>

// ✅ NACHHER:
<span>💰 €{values.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</span>
```

#### **Parent Total Calculation (Line 648)**
```typescript
// ❌ VORHER:
const parentTotal = parent.quantity * parent.amount + subItems.reduce((sum, sub) => sum + (sub.quantity * sub.amount), 0);

// ✅ NACHHER:
const parentTotal = parent.quantity * parent.unitPrice + subItems.reduce((sum, sub) => sum + (sub.quantity * sub.unitPrice), 0);
```

#### **Parent Key (Line 651)**
```typescript
// ❌ VORHER:
<div key={`parent-${parentIndex}-${parent.title}-${parent.quantity}-${parent.amount}`} style={{

// ✅ NACHHER:
<div key={`parent-${parentIndex}-${parent.title}-${parent.quantity}-${parent.unitPrice}`} style={{
```

#### **Sub Item Total (Line 681)**
```typescript
// ❌ VORHER:
const subTotal = sub.quantity * sub.amount;

// ✅ NACHHER:
const subTotal = sub.quantity * sub.unitPrice;
```

#### **Sub Item Key (Line 683)**
```typescript
// ❌ VORHER:
<div key={`sub-${subIndex}-${sub.title}-${sub.quantity}-${sub.amount}`} style={{

// ✅ NACHHER:
<div key={`sub-${subIndex}-${sub.title}-${sub.quantity}-${sub.unitPrice}`} style={{
```

#### **Parent Input Field (Lines 956-960)**
```typescript
// ❌ VORHER:
value={formatNumberInputValue(parentItem.amount)}
onChange={e => updateLineItem(parentItemIndex, "amount", parseNumberInput(e.target.value))}
// ... weitere Props
className={fieldErrors[`item_${parentItemIndex}_amount`] ? 'error' : ''}

// ✅ NACHHER:
value={formatNumberInputValue(parentItem.unitPrice)}
onChange={e => updateLineItem(parentItemIndex, "unitPrice", parseNumberInput(e.target.value))}
// ... weitere Props
className={fieldErrors[`item_${parentItemIndex}_unitPrice`] ? 'error' : ''}
```

#### **Sub Item Input Field (Lines 1139-1143)**
```typescript
// ❌ VORHER:
value={formatNumberInputValue(subItem.amount)}
onChange={e => updateLineItem(subItemIndex, "amount", parseNumberInput(e.target.value))}
// ... weitere Props
className={fieldErrors[`item_${subItemIndex}_amount`] ? 'error' : ''}

// ✅ NACHHER:
value={formatNumberInputValue(subItem.unitPrice)}
onChange={e => updateLineItem(subItemIndex, "unitPrice", parseNumberInput(e.target.value))}
// ... weitere Props
className={fieldErrors[`item_${subItemIndex}_unitPrice`] ? 'error' : ''}
```

#### **Modal Input Field (Lines 1378-1379)**
```typescript
// ❌ VORHER:
value={formatNumberInputValue(currentItem.amount)}
onChange={e => setCurrentItem(prev => ({ ...prev, amount: parseNumberInput(e.target.value) }))}

// ✅ NACHHER:
value={formatNumberInputValue(currentItem.unitPrice)}
onChange={e => setCurrentItem(prev => ({ ...prev, unitPrice: parseNumberInput(e.target.value) }))}
```

---

### **3. OfferForm.tsx (2 Stellen)**

#### **Package Import Mapping (Lines 321-322)**
```typescript
// ❌ VORHER:
return {
  id: newId,
  title: item.title,
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.amount, // PackageLineItem still uses 'amount' in frontend interface
  total: item.quantity * item.amount,
  parentItemId: undefined,
  itemType: 'package_import',
  sourcePackageId: pkg.id
};

// ✅ NACHHER:
return {
  id: newId,
  title: item.title,
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.unitPrice, // ← GEÄNDERT (konsistent!)
  total: item.quantity * item.unitPrice, // ← GEÄNDERT
  parentItemId: undefined,
  itemType: 'package_import',
  sourcePackageId: pkg.id
};
```
**Kontext:** Package Import in Offer - Kommentar kann gelöscht werden nach Refactoring

---

### **4. usePackages.ts (1 Stelle)**

#### **Total Calculation (Line 48)**
```typescript
// ❌ VORHER:
const calculatedTotal = data.total || data.lineItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);

// ✅ NACHHER:
const calculatedTotal = data.total || data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
```

---

### **5. PaketePage.tsx (1 Stelle)**

#### **Edit Mode LineItem Mapping (Line 288)**
```typescript
// ❌ VORHER:
return current.lineItems.map(li => ({ 
  title: li.title, 
  quantity: li.quantity, 
  amount: li.amount,  // ← ÄNDERN
  parentItemId: li.parentItemId ? dbToIndexMap[li.parentItemId] : undefined,
  description: li.description
}));

// ✅ NACHHER:
return current.lineItems.map(li => ({ 
  title: li.title, 
  quantity: li.quantity, 
  unitPrice: li.unitPrice,  // ← GEÄNDERT
  parentItemId: li.parentItemId ? dbToIndexMap[li.parentItemId] : undefined,
  description: li.description
}));
```
**Kontext:** Package Edit - DB-IDs werden zu Array-Indices für PackageForm konvertiert

---

### **6. SQLiteAdapter.ts (2 Stellen)**

#### **Package LineItem Mapping (Lines 261, 287)**
```typescript
// ❌ VORHER (Line 261 - in getPackage):
amount: item.unitPrice ?? 0,

// ✅ NACHHER:
unitPrice: item.unitPrice ?? 0,

// ❌ VORHER (Line 287 - in listPackages):
amount: item.unitPrice ?? 0,

// ✅ NACHHER:
unitPrice: item.unitPrice ?? 0,
```

---

## 🧪 TESTING-PLAN

### **Automatisierte Tests:**
```powershell
# 1. TypeScript Compilation
pnpm typecheck

# 2. Critical Fixes Validation
pnpm validate:critical-fixes

# 3. Unit Tests (falls vorhanden)
pnpm test
```

### **Manuelle Funktions-Tests:**

#### **Test 1: Package Erstellen**
1. Öffne Pakete-Seite
2. Erstelle neues Package mit:
   - 1 Parent Item (Preis: 100€)
   - 2 Sub Items (Preise: 20€, 30€)
3. ✅ **Erwartung:** Total = 150€ korrekt berechnet
4. ✅ **Erwartung:** Speichern erfolgreich

#### **Test 2: Package Bearbeiten**
1. Öffne bestehendes Package
2. Ändere Preise der Items
3. ✅ **Erwartung:** Total aktualisiert sich korrekt
4. ✅ **Erwartung:** Speichern behält Änderungen

#### **Test 3: Package in Offer Importieren**
1. Erstelle neues Offer
2. Importiere Package aus Test 1
3. ✅ **Erwartung:** Alle Items mit korrekten Preisen importiert
4. ✅ **Erwartung:** Offer Total stimmt mit Package Total überein

#### **Test 4: Bestehende Packages Laden**
1. Starte App neu
2. Öffne Pakete-Seite
3. ✅ **Erwartung:** Alle Packages laden korrekt
4. ✅ **Erwartung:** Preise werden korrekt angezeigt

#### **Test 5: Validation**
1. Versuche Package mit negativem Preis zu speichern
2. ✅ **Erwartung:** Validation Error wird angezeigt

---

## ⚠️ RISIKO-ANALYSE

### **Risiko 1: Bestehende Packages nicht ladbar**
- **Wahrscheinlichkeit:** 🟢 Niedrig
- **Impact:** 🔴 Hoch
- **Mitigation:** Field-Mapper konvertiert automatisch `unit_price` ↔ `unitPrice`
- **Rollback:** Git branch verwerfen

### **Risiko 2: Vergessene Stellen**
- **Wahrscheinlichkeit:** 🟡 Mittel
- **Impact:** 🟡 Mittel
- **Mitigation:** 
  - TypeScript findet alle Property-Zugriffe
  - Grep-Search vor Abschluss: `grep -r "\.amount" src/`
  - Manuelle Tests decken Hauptfunktionalität ab

### **Risiko 3: Tests schlagen fehl**
- **Wahrscheinlichkeit:** 🟢 Niedrig
- **Impact:** 🟢 Niedrig
- **Mitigation:** Tests nach Code-Änderungen anpassen

### **Risiko 4: PDF-Generation betroffen**
- **Wahrscheinlichkeit:** 🟢 Sehr niedrig
- **Impact:** 🟡 Mittel
- **Mitigation:** PDF nutzt OfferLineItems (bereits unitPrice)
- **Validation:** Test 3 prüft Package→Offer Import

---

## 📝 FIELD-MAPPER UPDATE

### **Vor Refactoring:**
```typescript
// field-mapper.ts
'amount': 'unit_price',  // ← Inkonsistente Semantik
```

### **Nach Refactoring:**
```typescript
// field-mapper.ts
'unitPrice': 'unit_price',  // ← Konsistente Semantik
```

**WICHTIG:** Mapping muss auch aktualisiert werden!

---

## ✅ COMPLETION CHECKLIST

- [ ] Branch erstellt: `git checkout -b feature/unify-package-unitprice`
- [ ] **Datei 1/6:** `src/persistence/adapter.ts` (1 Stelle)
- [ ] **Datei 2/6:** `src/components/PackageForm.tsx` (14 Stellen)
- [ ] **Datei 3/6:** `src/components/OfferForm.tsx` (2 Stellen - finden!)
- [ ] **Datei 4/6:** `src/hooks/usePackages.ts` (1 Stelle)
- [ ] **Datei 5/6:** `src/pages/PaketePage.tsx` (prüfen)
- [ ] **Datei 6/6:** `src/adapters/SQLiteAdapter.ts` (2 Stellen)
- [ ] **Field-Mapper:** `src/lib/field-mapper.ts` aktualisiert
- [ ] TypeScript: `pnpm typecheck` ✅
- [ ] Critical Fixes: `pnpm validate:critical-fixes` ✅
- [ ] Unit Tests: `pnpm test` ✅
- [ ] **Manuell Test 1:** Package erstellen ✅
- [ ] **Manuell Test 2:** Package bearbeiten ✅
- [ ] **Manuell Test 3:** Package in Offer importieren ✅
- [ ] **Manuell Test 4:** Bestehende Packages laden ✅
- [ ] **Manuell Test 5:** Validation testen ✅
- [ ] Final Grep: `grep -r "\.amount" src/` (nur Timesheet-Matches?)
- [ ] Commit: `git commit -m "refactor: unify PackageLineItem.amount to unitPrice"`
- [ ] Push: `git push origin feature/unify-package-unitprice`

---

## 🔄 ROLLBACK-PLAN

### **Bei Problemen während Umsetzung:**
```powershell
# 1. Änderungen verwerfen
git reset --hard HEAD

# 2. Branch verwerfen (falls schon committed)
git checkout main
git branch -D feature/unify-package-unitprice
```

### **Nach erfolgreichem Merge bei Problemen in Production:**
```powershell
# 1. Revert Commit finden
git log --oneline | grep "unify PackageLineItem"

# 2. Revert erstellen
git revert <commit-hash>

# 3. Hotfix Release
pnpm release:patch
```

---

## 📊 IMPACT ASSESSMENT

### **Betroffene Bereiche:**
- ✅ **Frontend:** Package CRUD (hoch)
- ✅ **Frontend:** Package→Offer Import (mittel)
- ❌ **Backend:** SQLiteAdapter (niedrig - nur Mapping)
- ❌ **Database:** Keine Schema-Änderungen
- ❌ **PDF:** Indirekt über Offer (niedrig)

### **Breaking Changes:**
- ❌ **Keine Breaking Changes** (Field-Mapper konvertiert)
- ✅ **Backwards Compatible** durch automatisches Mapping

---

## 🎯 ERFOLGS-KRITERIEN

- ✅ Alle 21 Änderungen durchgeführt
- ✅ TypeScript kompiliert ohne Fehler
- ✅ Alle automatisierten Tests grün
- ✅ Alle 5 manuellen Tests erfolgreich
- ✅ Bestehende Packages funktionieren weiterhin
- ✅ Package→Offer Import funktioniert
- ✅ Code-Konsistenz hergestellt

---

**Plan ist bereit zur Umsetzung!** 🚀

*Erstellt: 2025-10-14 | Geschätzter Aufwand: 45-60 Minuten*
