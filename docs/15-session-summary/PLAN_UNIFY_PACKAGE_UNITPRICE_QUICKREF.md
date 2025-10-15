# QUICK REFERENCE: PackageLineItem.amount → unitPrice

**⚡ Schnelle Checkliste für Umsetzung** | **Geschätzt: 45-60 Min**

---

## 🎯 ZIEL
`PackageLineItem.amount` → `PackageLineItem.unitPrice` (Konsistenz mit OfferLineItem)

---

## 📋 ÄNDERUNGS-CHECKLISTE (21 Stellen)

### ✅ **1. adapter.ts** (1 Stelle)
```typescript
// Line ~47
export interface PackageLineItem {
  amount: number;  // → unitPrice: number;
}
```

### ✅ **2. PackageForm.tsx** (14 Stellen)

| **Line** | **Kontext** | **Änderung** |
|----------|-------------|--------------|
| ~40 | Initial State | `amount: 0` → `unitPrice: 0` |
| ~92 | addLineItem() | `amount: currentItem.amount` → `unitPrice: currentItem.unitPrice` |
| ~108 | Reset State | `amount: 0` → `unitPrice: 0` |
| ~465 | Validation | `item.amount < 0` → `item.unitPrice < 0` |
| ~466 | Error Key | `item_${index}_amount` → `item_${index}_unitPrice` |
| ~492 | Total Calc | `item.quantity * item.amount` → `item.quantity * item.unitPrice` |
| ~604 | Display Total | `item.quantity * item.amount` → `item.quantity * item.unitPrice` |
| ~648 | Parent Total (2x) | `parent.amount` + `sub.amount` → `parent.unitPrice` + `sub.unitPrice` |
| ~651 | Parent Key | `parent.amount` → `parent.unitPrice` |
| ~681 | Sub Total | `sub.amount` → `sub.unitPrice` |
| ~683 | Sub Key | `sub.amount` → `sub.unitPrice` |
| ~956-960 | Parent Input (3x) | `parentItem.amount` → `parentItem.unitPrice` |
| ~1139-1143 | Sub Input (3x) | `subItem.amount` → `subItem.unitPrice` |
| ~1378-1379 | Modal Input (2x) | `currentItem.amount` → `currentItem.unitPrice` |

### ✅ **3. OfferForm.tsx** (2 Stellen)
```typescript
// Lines 321-322 (Package Import Mapping)
unitPrice: item.amount,                // → unitPrice: item.unitPrice,
total: item.quantity * item.amount,    // → total: item.quantity * item.unitPrice,
```

### ✅ **4. usePackages.ts** (1 Stelle)
```typescript
// Line ~48
const calculatedTotal = data.total || data.lineItems.reduce((sum, item) => 
  sum + (item.quantity * item.amount), 0  // → item.unitPrice
);
```

### ✅ **5. PaketePage.tsx** (1 Stelle)
```typescript
// Line 288 (Edit Mode LineItem Mapping)
amount: li.amount,  // → unitPrice: li.unitPrice,
```

### ✅ **6. SQLiteAdapter.ts** (2 Stellen)
```typescript
// Line ~261 (getPackage)
amount: item.unitPrice ?? 0,  // → unitPrice: item.unitPrice ?? 0,

// Line ~287 (listPackages)
amount: item.unitPrice ?? 0,  // → unitPrice: item.unitPrice ?? 0,
```

### ✅ **7. field-mapper.ts** (1 Stelle)
```typescript
// Line ~87
'amount': 'unit_price',  // → 'unitPrice': 'unit_price',
```

---

## 🧪 VALIDATION COMMANDS

### **Pre-Refactoring:**
```powershell
# Alle Vorkommen finden
grep -rn "\.amount" src/ | grep -v "vat_amount\|discount_amount\|total_amount"

# Expected: ~25 Zeilen (Package + Timesheet)
```

### **Post-Refactoring:**
```powershell
# 1. TypeScript Check
pnpm typecheck

# 2. Critical Fixes
pnpm validate:critical-fixes

# 3. Tests (falls vorhanden)
pnpm test

# 4. Nur Timesheet sollte übrig bleiben
grep -rn "\.amount" src/ | grep -v "vat_amount\|discount_amount\|total_amount"
# Expected: Nur Timesheet-Referenzen!
```

---

## 🧪 MANUELLE TESTS (5 Min)

1. **✅ Package erstellen** (Parent + 2 Subs, Preis: 100+20+30)
2. **✅ Package bearbeiten** (Preise ändern, speichern)
3. **✅ Package→Offer Import** (Preise müssen stimmen)
4. **✅ Bestehende Packages laden** (alle korrekt)
5. **✅ Validation** (Negativer Preis → Error)

---

## ⚡ SCHNELL-WORKFLOW

```powershell
# 1. Branch
git checkout -b feature/unify-package-unitprice

# 2. Alle Änderungen durchführen (siehe Checkliste oben)

# 3. Validation
pnpm typecheck && pnpm validate:critical-fixes

# 4. Manuell testen (5 Tests)

# 5. Final Grep
grep -rn "\.amount" src/ | grep -v "vat_amount\|discount_amount\|total_amount"

# 6. Commit & Push
git add .
git commit -m "refactor: unify PackageLineItem.amount to unitPrice"
git push origin feature/unify-package-unitprice
```

---

## ⚠️ WICHTIG

### **NICHT ändern:**
```typescript
// ❌ Diese NICHT ändern (semantisch anders):
TimesheetActivity.amount        // = hours × hourlyRate (Gesamtbetrag!)
PositionActivity.amount         // = hours × hourlyRate (Gesamtbetrag!)
Document.vatAmount              // MwSt-Betrag
Document.discountAmount         // Rabatt-Betrag
Document.totalAmount            // Gesamtsumme
```

### **Semantik-Regel:**
- ✅ **unitPrice** = Preis pro Einheit (Stückpreis)
- ❌ **amount** bei Timesheets = Berechneter Gesamtbetrag

---

## 🔄 ROLLBACK (falls Probleme)
```powershell
git reset --hard HEAD
git checkout main
git branch -D feature/unify-package-unitprice
```

---

**⏱️ Geschätzter Aufwand: 45-60 Minuten**  
*Erstellt: 2025-10-14*
