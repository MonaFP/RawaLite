# ⚡ QUICK REFERENCE: PackageLineItem.amount → unitPrice

**Status:** 📋 GEPLANT  
**Vollständiger Plan:** [`PLAN_UNIFY_PACKAGE_UNITPRICE.md`](./PLAN_UNIFY_PACKAGE_UNITPRICE.md)

---

## 🎯 ZIEL

```typescript
// VORHER (inkonsistent):
PackageLineItem.amount       // ← Verwirrend
OfferLineItem.unitPrice      // ← Klar

// NACHHER (konsistent):
PackageLineItem.unitPrice    // ← Klar
OfferLineItem.unitPrice      // ← Klar
```

---

## 📋 CHECKLISTE

### **Phase 1: Interface** ✅
- [ ] `src/persistence/adapter.ts` (Line 43): `amount` → `unitPrice`

### **Phase 2: PackageForm.tsx** ✅ (14 Stellen)
- [ ] Line 40: Initial `amount: 0` → `unitPrice: 0`
- [ ] Line 92: State `amount:` → `unitPrice:`
- [ ] Line 108: Template `amount: 0` → `unitPrice: 0`
- [ ] Line 465: Validation `item.amount` → `item.unitPrice`
- [ ] Line 492: Calculation `item.amount` → `item.unitPrice`
- [ ] Line 604: Preview `item.amount` → `item.unitPrice`
- [ ] Line 648: Parent calc `parent.amount` + `sub.amount` → `unitPrice`
- [ ] Line 651: Parent key `parent.amount` → `parent.unitPrice`
- [ ] Line 681: Sub calc `sub.amount` → `sub.unitPrice`
- [ ] Line 683: Sub key `sub.amount` → `sub.unitPrice`
- [ ] Line 956: Parent input `parentItem.amount` → `parentItem.unitPrice`
- [ ] Line 1139: Sub input `subItem.amount` → `subItem.unitPrice`
- [ ] Line 1378: Current input `currentItem.amount` → `currentItem.unitPrice`
- [ ] Line 1379: onChange `amount:` → `unitPrice:`

### **Phase 3: OfferForm.tsx** ✅ (2 Stellen)
- [ ] Line 321: `item.amount` → `item.unitPrice`
- [ ] Line 322: `item.amount` → `item.unitPrice`

### **Phase 4: usePackages.ts** ✅ (1 Stelle)
- [ ] Line 48: `item.amount` → `item.unitPrice`

### **Phase 5: PaketePage.tsx** ✅ (1 Stelle)
- [ ] Line 288: `amount: li.amount` → `unitPrice: li.unitPrice`

### **Phase 6: SQLiteAdapter.ts** ✅ (2 Stellen)
- [ ] Line 261: `amount: item.unitPrice` → `unitPrice: item.unitPrice`
- [ ] Line 287: `amount: item.unitPrice` → `unitPrice: item.unitPrice`

---

## ✅ VALIDATION

```bash
# 1. TypeScript
pnpm typecheck

# 2. Critical Fixes
pnpm validate:critical-fixes

# 3. Tests
pnpm test

# 4. Manuelle Tests
- Package erstellen (mit Sub-Items)
- Package in Offer importieren
- Bestehende Packages laden
```

---

## 🚀 SCHNELLSTART

```bash
# Branch erstellen
git checkout -b feature/unify-package-unitprice

# Änderungen machen (siehe Checkliste)

# Validieren
pnpm typecheck && pnpm validate:critical-fixes

# Testen
pnpm test

# Commit
git add .
git commit -m "refactor: unify PackageLineItem.amount to unitPrice"
git push origin feature/unify-package-unitprice
```

---

## 📊 ZUSAMMENFASSUNG

| Metric | Wert |
|--------|------|
| **Dateien** | 6 |
| **Zeilen** | 21 |
| **Aufwand** | ~30-45 min |
| **Risiko** | ⚠️ Mittel |
| **Breaking Change** | Ja (nur intern) |

---

## ⚠️ WICHTIG

**NICHT ändern:**
- ❌ `PositionActivity.amount` (Timesheet - ist berechneter Wert)
- ❌ `TimesheetPosition.totalAmount` (Timesheet - ist Summe)
- ❌ Datenbank-Schema (`unit_price` bleibt)

**Grund:** Bei Timesheets bedeutet `amount` = Gesamtbetrag (hours × hourlyRate), nicht Preis pro Einheit!

---

**Details:** Siehe [`PLAN_UNIFY_PACKAGE_UNITPRICE.md`](./PLAN_UNIFY_PACKAGE_UNITPRICE.md)
