# Issue Report: PDF & SubItem Pricing

> **Drei Issues aus User-Testing** nach OfferForm SubItems Bug Fix (v1.0.42.5)
> 
> **Datum:** 14. Oktober 2025 | **Version:** 1.0.0
> **Reporter:** User (Ramona Wachten)
> **Kontext:** PDF-Angebot Generierung & SubItem Preisanzeige

---

## 📋 **Issue-Übersicht**

| # | Issue | Priorität | Typ | Geschätzter Aufwand |
|---|-------|-----------|-----|---------------------|
| **1** | Anmerkungen-Box zu schmal | 🟡 MEDIUM | Layout | 30min |
| **2** | Anmerkungen-Box nutzt nicht Theme-Farben | 🟡 MEDIUM | Styling | 30min |
| **3** | SubItem Preise: "inkl." Option fehlt | 🔴 HIGH | Feature | 4-6h |

**Gesamt-Aufwand:** ~5-7 Stunden

---

## 🔴 **ISSUE #1: Anmerkungen-Box zu schmal**

### **Problem:**

Die "Anmerkungen"-Box in der PDF-Ausgabe hat zu viel ungenutzten Rand/Whitespace.

**Screenshot-Evidenz:** User zeigte PDF mit schmaler Anmerkungen-Box trotz verfügbarem Platz.

### **Analyse:**

**Betroffene Datei:** `electron/ipc/pdf-templates.ts` (Lines 700-726)

**Aktueller Code:**
```typescript
${entity.notes && entity.notes.length > 200 ? `
  <div style="page-break-before: always; padding: 40px;">
    <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 24px; margin: 0; font-weight: 600;">
        Anmerkungen
      </h2>
    </div>

    <div style="
      background-color: #f9f9f9; 
      border-left: 4px solid #007acc; 
      padding: 25px; 
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 30px;
    ">
      ${convertMarkdownToHtml(entity.notes)}
    </div>
  </div>
` : ''}
```

**Problem-Identifikation:**
- `padding: 40px` auf dem Container reduziert verfügbare Breite erheblich
- Keine max-width Einschränkung, sollte volle Seitenbreite nutzen
- Markdown-Content-Box hat zusätzlich `padding: 25px`

**Root Cause:** Zu großzügiges Padding auf Seiten-Container (40px) + Content-Box (25px) = **130px horizontaler Platzverlust** (40+40+25+25).

---

### **Lösung:**

#### **Option 1: Padding reduzieren (Einfach, empfohlen)**

```typescript
// VORHER:
<div style="page-break-before: always; padding: 40px;">

// NACHHER:
<div style="page-break-before: always; padding: 20px 30px;">
//                                     ^^^^  ^^^^
//                                     vertical | horizontal
```

**Effekt:** 
- Vertikales Padding: 40px → 20px (ausreichend für Seitenabstand)
- Horizontales Padding: 40px → 30px (mehr Platz für Content)
- **Platzverlust:** 130px → 110px (20px mehr Breite)

---

#### **Option 2: Responsive Padding (Fortgeschritten)**

```typescript
<div style="
  page-break-before: always; 
  padding: 20px; 
  max-width: 100%; 
  box-sizing: border-box;
">
  <div style="
    max-width: 800px; 
    margin: 0 auto; 
    width: 100%;
  ">
    <!-- Content hier -->
  </div>
</div>
```

**Effekt:**
- Content zentriert mit max. 800px Breite
- Nutzt volle Breite auf kleineren Seiten
- Professional print layout

---

#### **Empfohlene Änderung (Quick Fix):**

```typescript
// Lines 700-726 in pdf-templates.ts
${entity.notes && entity.notes.length > 200 ? `
  <div style="page-break-before: always; padding: 20px 30px;">
    <div style="border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; margin-bottom: 20px;">
      <h2 style="color: ${primaryColor}; font-size: 24px; margin: 0; font-weight: 600;">
        Anmerkungen
      </h2>
      <div style="color: #666; font-size: 14px; margin-top: 8px;">
        ${templateType === 'offer' ? 'Angebot' : templateType === 'invoice' ? 'Rechnung' : 'Leistungsnachweis'} - Detaillierte Anmerkungen
      </div>
    </div>

    <div style="
      background-color: ${primaryColor}10; 
      border-left: 4px solid ${primaryColor}; 
      padding: 20px; 
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 20px;
    ">
      ${convertMarkdownToHtml(entity.notes)}
    </div>

    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center;">
      Anmerkungen - Seite ${templateType === 'offer' ? 'Angebot' : templateType === 'invoice' ? 'Rechnung' : 'Leistungsnachweis'}
    </div>
  </div>
` : ''}
```

**Änderungen:**
- ✅ `padding: 40px` → `padding: 20px 30px` (mehr horizontaler Platz)
- ✅ Content-Box `padding: 25px` → `padding: 20px` (konsistenter)
- ✅ Abstände optimiert: `margin-bottom: 30px` → `20px`
- ⚠️ **Theme-Farben integriert** (löst auch Issue #2!)

**Zeitaufwand:** 15 Minuten

---

## 🟡 **ISSUE #2: Anmerkungen nutzt nicht Theme-Farben**

### **Problem:**

Die Anmerkungen-Box hat einen **blauen Rand** (`#007acc`) statt der Theme-Farbe (`primaryColor`).

**Screenshot-Evidenz:** PDF zeigt blauen Rand unabhängig vom gewählten Theme.

### **Analyse:**

**Betroffene Zeilen:** `electron/ipc/pdf-templates.ts` Lines 712, 701

**Aktueller Code:**
```typescript
border-left: 4px solid #007acc;  // ❌ Hardcoded blue
border-bottom: 2px solid #333;   // ❌ Hardcoded gray
```

**Root Cause:** 
- Template verwendet **hardcoded Hex-Farben** statt Theme-Variablen
- `primaryColor` wird in `generateTemplateHTML()` übergeben, aber nicht verwendet
- Andere Template-Teile nutzen korrekt `${primaryColor}` und `${accentColor}`

---

### **Lösung:**

#### **Theme-Farben Integration**

**Änderungen in Lines 700-726:**

```typescript
// VORHER:
border-left: 4px solid #007acc;        // ❌ Hardcoded
border-bottom: 2px solid #333;         // ❌ Hardcoded
background-color: #f9f9f9;             // ❌ Hardcoded

// NACHHER:
border-left: 4px solid ${primaryColor};           // ✅ Theme-aware
border-bottom: 2px solid ${primaryColor};         // ✅ Theme-aware
background-color: ${primaryColor}10;              // ✅ Theme-aware (10% opacity)
```

**Vollständiger Fix (kombiniert mit Issue #1):**

```typescript
${entity.notes && entity.notes.length > 200 ? `
  <div style="page-break-before: always; padding: 20px 30px;">
    <div style="
      border-bottom: 2px solid ${primaryColor}; 
      padding-bottom: 15px; 
      margin-bottom: 20px;
    ">
      <h2 style="
        color: ${primaryColor}; 
        font-size: 24px; 
        margin: 0; 
        font-weight: 600;
      ">
        Anmerkungen
      </h2>
      <div style="
        color: ${textColor}; 
        font-size: 14px; 
        margin-top: 8px;
      ">
        ${templateType === 'offer' ? 'Angebot' : templateType === 'invoice' ? 'Rechnung' : 'Leistungsnachweis'} - Detaillierte Anmerkungen
      </div>
    </div>

    <div style="
      background-color: ${primaryColor}10; 
      border-left: 4px solid ${primaryColor}; 
      padding: 20px; 
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
      color: ${textColor};
      margin-bottom: 20px;
    ">
      ${convertMarkdownToHtml(entity.notes)}
    </div>

    <div style="
      margin-top: 30px; 
      padding-top: 15px; 
      border-top: 1px solid ${primaryColor}40; 
      color: ${textColor}; 
      font-size: 12px; 
      text-align: center;
    ">
      Anmerkungen - Seite ${templateType === 'offer' ? 'Angebot' : templateType === 'invoice' ? 'Rechnung' : 'Leistungsnachweis'}
    </div>
  </div>
` : ''}
```

**Theme-Farben verwendet:**
- ✅ `${primaryColor}` - Hauptfarbe (Border, Titel)
- ✅ `${primaryColor}10` - 10% Opacity (Background)
- ✅ `${primaryColor}40` - 40% Opacity (Subtle borders)
- ✅ `${textColor}` - Text-Farbe (konsistent)

**Zeitaufwand:** 15 Minuten (kombiniert mit Issue #1: 30min total)

---

## 🔴 **ISSUE #3: SubItem Preise - "inkl." Option fehlt**

### **Problem:**

**Aktuelle Situation:**
- ✅ SubItems können Einzelpreise + Gesamtpreise eingeben (funktioniert)
- ❌ **FEHLT:** Option SubItems als "inkl." (inklusive) zu markieren
- ❌ **FEHLT:** Option SubItem-Preise NICHT anzuzeigen

**User Use-Case:**
```
📦 Website-Paket (€1500)
  ↳ Design (inkl.)           // Kein Preis, nur "inkl."
  ↳ Development (inkl.)      // Kein Preis, nur "inkl."
  ↳ Hosting (€0.00)          // Optional: Preis 0 anzeigen
```

**Aktuelle Limitierung:**
```
📦 Website-Paket (€1500)
  ↳ Design (€500)            // MUSS Preis eingeben
  ↳ Development (€800)       // MUSS Preis eingeben
  ↳ Hosting (€200)           // MUSS Preis eingeben
```

---

### **Analyse:**

#### **Betroffene Komponenten:**

1. **Data Model:** `src/persistence/adapter.ts`
2. **Frontend Forms:** `src/components/OfferForm.tsx`, `InvoiceForm.tsx`
3. **Database Schema:** Benötigt Migration
4. **PDF Templates:** `electron/ipc/pdf-templates.ts`
5. **Adapter:** `src/adapters/SQLiteAdapter.ts`

---

#### **Aktuelle Schema-Struktur:**

```typescript
// src/persistence/adapter.ts Lines 64-82
export interface OfferLineItem {
  id: number;
  title: string;
  description?: string;
  quantity: number;           // REQUIRED
  unitPrice: number;          // REQUIRED
  total: number;              // REQUIRED
  parentItemId?: number;
  itemType?: 'standalone' | 'individual_sub' | 'package_import';
  sourcePackageId?: number;
  attachments?: OfferAttachment[];
  hierarchyLevel?: number;
}
```

**Problem:** Keine Möglichkeit "inkl." Status zu speichern.

---

### **Lösungsansätze:**

#### **Option 1: Boolean Flag `priceIncluded` (Einfach)**

**Schema-Änderung:**
```typescript
export interface OfferLineItem {
  id: number;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  parentItemId?: number;
  itemType?: 'standalone' | 'individual_sub' | 'package_import';
  sourcePackageId?: number;
  
  // ✅ NEU: Preis-Anzeige-Optionen
  priceIncluded?: boolean;    // true = "inkl." anzeigen, false = Preis anzeigen
  
  attachments?: OfferAttachment[];
  hierarchyLevel?: number;
}
```

**Vorteile:**
- ✅ Einfach zu implementieren
- ✅ Klare Boolean-Logik
- ✅ Backwards-compatible (default: false)

**Nachteile:**
- ⚠️ Nur 2 Zustände: "inkl." oder "Preis"
- ⚠️ Keine Flexibilität für "Optional" o.ä.

---

#### **Option 2: Enum `priceDisplayMode` (Flexibel, empfohlen)**

**Schema-Änderung:**
```typescript
export type PriceDisplayMode = 
  | 'default'     // Normale Preisanzeige (standard)
  | 'included'    // "inkl." anzeigen (im Paketpreis enthalten)
  | 'hidden'      // Preis verstecken (nur Position anzeigen)
  | 'optional';   // "optional" anzeigen (zukünftig)

export interface OfferLineItem {
  id: number;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  parentItemId?: number;
  itemType?: 'standalone' | 'individual_sub' | 'package_import';
  sourcePackageId?: number;
  
  // ✅ NEU: Flexible Preis-Anzeige
  priceDisplayMode?: PriceDisplayMode; // default: 'default'
  
  attachments?: OfferAttachment[];
  hierarchyLevel?: number;
}
```

**Vorteile:**
- ✅ Sehr flexibel (4 Modi)
- ✅ Erweiterbar (z.B. 'optional', 'auf Anfrage')
- ✅ Selbstdokumentierend
- ✅ Zukunftssicher

**Nachteile:**
- ⚠️ Etwas komplexer
- ⚠️ Benötigt Enum-Handling in DB

---

#### **Empfehlung: Option 2 (Enum)**

**Begründung:**
- Mehr Flexibilität für zukünftige Anforderungen
- Klare Semantik ("included" ist verständlicher als boolean)
- Ermöglicht "hidden", "optional", etc.

---

### **Implementation Plan:**

#### **Phase 1: Database Schema (Migration)**

**Neue Datei:** `src/main/db/migrations/025_add_price_display_mode.ts`

```typescript
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 025] Adding price_display_mode to line items...');
  
  // Check if column already exists
  const offerLineItemsInfo = db.prepare(`PRAGMA table_info(offer_line_items)`).all() as Array<{
    name: string;
  }>;
  
  const hasPriceDisplayMode = offerLineItemsInfo.some(col => col.name === 'price_display_mode');
  
  if (!hasPriceDisplayMode) {
    console.log('🔧 Adding price_display_mode to offer_line_items...');
    db.exec(`
      ALTER TABLE offer_line_items 
      ADD COLUMN price_display_mode TEXT DEFAULT 'default'
      CHECK (price_display_mode IN ('default', 'included', 'hidden', 'optional'))
    `);
  }
  
  // Same for invoice_line_items
  const invoiceLineItemsInfo = db.prepare(`PRAGMA table_info(invoice_line_items)`).all() as Array<{
    name: string;
  }>;
  
  const hasInvoicePriceDisplayMode = invoiceLineItemsInfo.some(col => col.name === 'price_display_mode');
  
  if (!hasInvoicePriceDisplayMode) {
    console.log('🔧 Adding price_display_mode to invoice_line_items...');
    db.exec(`
      ALTER TABLE invoice_line_items 
      ADD COLUMN price_display_mode TEXT DEFAULT 'default'
      CHECK (price_display_mode IN ('default', 'included', 'hidden', 'optional'))
    `);
  }
  
  console.log('✅ [Migration 025] price_display_mode columns added');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 025] Reverting price_display_mode...');
  
  // SQLite doesn't support DROP COLUMN directly, need to recreate table
  // For safety, we'll leave the column (backwards compatible)
  console.log('⚠️ [Migration 025] Down migration not implemented (safe to leave column)');
};
```

**Zeitaufwand:** 1 Stunde (inkl. Testing)

---

#### **Phase 2: Type Definitions**

**Datei:** `src/persistence/adapter.ts`

```typescript
// Lines 64 - Add new type and update interface
export type PriceDisplayMode = 
  | 'default'     // Normale Preisanzeige
  | 'included'    // "inkl." anzeigen
  | 'hidden'      // Preis verstecken
  | 'optional';   // "optional" anzeigen

export interface OfferLineItem {
  id: number;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  parentItemId?: number;
  itemType?: 'standalone' | 'individual_sub' | 'package_import';
  sourcePackageId?: number;
  itemOrigin?: 'manual' | 'package_import' | 'template';
  sourcePackageItemId?: number;
  sortOrder?: number;
  clientTempId?: string;
  
  // ✅ NEU: Preis-Anzeige-Modus
  priceDisplayMode?: PriceDisplayMode;
  
  attachments?: OfferAttachment[];
  hierarchyLevel?: number;
}

export interface InvoiceLineItem {
  id: number;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  parentItemId?: number;
  itemOrigin?: 'manual' | 'package_import' | 'template';
  sourcePackageItemId?: number;
  sortOrder?: number;
  clientTempId?: string;
  
  // ✅ NEU: Preis-Anzeige-Modus
  priceDisplayMode?: PriceDisplayMode;
  
  attachments?: InvoiceAttachment[];
  hierarchyLevel?: number;
}
```

**Zeitaufwand:** 15 Minuten

---

#### **Phase 3: Field Mapper**

**Datei:** `src/lib/field-mapper.ts`

```typescript
// Add to existing mapping
const fieldMapping: Record<string, string> = {
  // ... existing mappings ...
  
  // ✅ NEU: Price display mode
  priceDisplayMode: 'price_display_mode',
  price_display_mode: 'priceDisplayMode',
};
```

**Zeitaufwand:** 5 Minuten

---

#### **Phase 4: OfferForm UI**

**Datei:** `src/components/OfferForm.tsx`

**Änderung 1: SubItem Grid anpassen (Lines 704-738)**

```typescript
// VORHER: 5 Spalten (Titel, Menge, Einzelpreis, Gesamt, Actions)
gridTemplateColumns:"2fr 1fr 1fr 1fr auto"

// NACHHER: 6 Spalten (Titel, Menge, Einzelpreis, Gesamt, Anzeige-Modus, Actions)
gridTemplateColumns:"2fr 1fr 1fr 1fr 120px auto"
```

**Änderung 2: Preis-Anzeige-Modus Dropdown hinzufügen**

```tsx
{/* Sub-Item Rendering (Lines 697-752) */}
{subItems.map(subItem => (
  <div key={subItem.id} style={{
    marginLeft:"24px", 
    border:"1px solid rgba(96,165,250,.3)", 
    borderLeft:"4px solid var(--accent)", 
    borderRadius:"6px", 
    background:"rgba(96,165,250,.1)", 
    marginTop:"4px",
    padding:"12px"
  }}>
    <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 120px auto", gap:"8px", alignItems:"start", marginBottom:"8px"}}>
      <div>
        <input
          type="text"
          value={subItem.title}
          onChange={(e) => updateLineItem(subItem.id, 'title', e.target.value)}
          placeholder="Sub-Position Titel"
          style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
          disabled={isSubmitting}
        />
      </div>
      
      {/* Menge - Conditional auf priceDisplayMode */}
      <input
        type="number"
        value={subItem.quantity}
        onChange={(e) => updateLineItem(subItem.id, 'quantity', parseInt(e.target.value) || 1)}
        min="1"
        style={{
          padding:"8px", 
          border:"1px solid rgba(255,255,255,.1)", 
          borderRadius:"4px", 
          background:"rgba(17,24,39,.8)", 
          color:"var(--muted)",
          opacity: subItem.priceDisplayMode === 'included' || subItem.priceDisplayMode === 'hidden' ? 0.5 : 1
        }}
        disabled={isSubmitting || subItem.priceDisplayMode === 'included' || subItem.priceDisplayMode === 'hidden'}
      />
      
      {/* Einzelpreis - Conditional auf priceDisplayMode */}
      <input
        type="number"
        placeholder="Einzelpreis"
        value={formatNumberInputValue(subItem.unitPrice)}
        onChange={(e) => updateLineItem(subItem.id, 'unitPrice', parseNumberInput(e.target.value))}
        min="0"
        style={{
          ...getNumberInputStyles(), 
          padding:"8px", 
          border:"1px solid rgba(255,255,255,.1)", 
          borderRadius:"4px", 
          background:"rgba(17,24,39,.8)", 
          color:"var(--muted)",
          opacity: subItem.priceDisplayMode === 'included' || subItem.priceDisplayMode === 'hidden' ? 0.5 : 1
        }}
        disabled={isSubmitting || subItem.priceDisplayMode === 'included' || subItem.priceDisplayMode === 'hidden'}
      />
      
      {/* Gesamtpreis - Conditional Anzeige */}
      <div style={{padding:"8px", textAlign:"right", fontWeight:"500"}}>
        {subItem.priceDisplayMode === 'included' ? (
          <span style={{color:"var(--accent)", fontStyle:"italic"}}>inkl.</span>
        ) : subItem.priceDisplayMode === 'hidden' ? (
          <span style={{color:"var(--muted)", fontSize:"12px"}}>—</span>
        ) : subItem.priceDisplayMode === 'optional' ? (
          <span style={{color:"var(--muted)", fontStyle:"italic", fontSize:"12px"}}>optional</span>
        ) : (
          <span>€{subItem.total.toFixed(2)}</span>
        )}
      </div>
      
      {/* ✅ NEU: Preis-Anzeige-Modus Dropdown */}
      <select
        value={subItem.priceDisplayMode || 'default'}
        onChange={(e) => {
          const mode = e.target.value as PriceDisplayMode;
          updateLineItem(subItem.id, 'priceDisplayMode', mode);
          
          // Bei 'included' oder 'hidden': Preise auf 0 setzen
          if (mode === 'included' || mode === 'hidden') {
            updateLineItem(subItem.id, 'unitPrice', 0);
            updateLineItem(subItem.id, 'quantity', 1);
          }
        }}
        style={{
          padding:"6px", 
          border:"1px solid rgba(255,255,255,.1)", 
          borderRadius:"4px", 
          background:"rgba(17,24,39,.8)", 
          color:"var(--muted)",
          fontSize:"12px"
        }}
        disabled={isSubmitting}
      >
        <option value="default">Preis</option>
        <option value="included">inkl.</option>
        <option value="hidden">versteckt</option>
        <option value="optional">optional</option>
      </select>
      
      <div style={{display:"flex", gap:"4px"}}>
        <button
          type="button"
          onClick={() => removeLineItem(subItem.id)}
          disabled={isSubmitting}
          className="btn btn-danger"
          style={{fontSize:"12px", padding:"4px 8px"}}
        >
          ×
        </button>
      </div>
    </div>
    
    {/* Beschreibung... */}
  </div>
))}
```

**Zeitaufwand:** 2 Stunden (inkl. Testing)

---

#### **Phase 5: InvoiceForm UI**

**Analog zu OfferForm** - gleiche Änderungen in `src/components/InvoiceForm.tsx`

**Zeitaufwand:** 1 Stunde

---

#### **Phase 6: PDF Template Anpassung**

**Datei:** `electron/ipc/pdf-templates.ts`

**Änderung: SubItem Rendering (Lines ~490-550)**

```typescript
// Sub-Items darstellen
const subItems = lineItems.filter(sub => sub.parentItemId === item.id);
if (subItems.length > 0) {
  subItemsHTML = subItems.map(sub => {
    // ✅ NEU: Conditional Preis-Anzeige basierend auf priceDisplayMode
    let priceDisplay = '';
    let totalDisplay = '';
    
    switch (sub.priceDisplayMode) {
      case 'included':
        priceDisplay = '<em style="color: #666;">inkl.</em>';
        totalDisplay = '<em style="color: #666;">inkl.</em>';
        break;
      case 'hidden':
        priceDisplay = '—';
        totalDisplay = '—';
        break;
      case 'optional':
        priceDisplay = '<em style="color: #666; font-size: 10px;">optional</em>';
        totalDisplay = '<em style="color: #666; font-size: 10px;">optional</em>';
        break;
      default: // 'default'
        priceDisplay = `€${sub.unitPrice.toFixed(2)}`;
        totalDisplay = `€${sub.total.toFixed(2)}`;
    }
    
    return `
      <tr style="background-color: rgba(96, 165, 250, 0.05);">
        <td style="padding-left: 30px; color: #666; font-style: italic;">
          ↳ ${sub.title}
          ${sub.description ? `<br><span style="font-size: 10px; color: #999;">${convertMarkdownToHtml(sub.description)}</span>` : ''}
        </td>
        <td style="text-align: center; color: #666;">
          ${sub.priceDisplayMode === 'included' || sub.priceDisplayMode === 'hidden' ? '—' : sub.quantity}
        </td>
        <td style="text-align: right; color: #666;">
          ${priceDisplay}
        </td>
        <td style="text-align: right; color: #666; font-weight: 500;">
          ${totalDisplay}
        </td>
      </tr>
    `;
  }).join('');
}
```

**Zeitaufwand:** 1 Stunde

---

#### **Phase 7: SQLiteAdapter Field Mapping**

**Datei:** `src/adapters/SQLiteAdapter.ts`

**Sicherstellen dass Field-Mapper korrekt mappt:**

```typescript
// In createOffer/updateOffer/createInvoice/updateInvoice
const mappedItem = {
  ...convertToSnakeCase(item),
  price_display_mode: item.priceDisplayMode || 'default'
};

// In getOffer/getInvoice
const camelItem = convertToCamelCase(row);
camelItem.priceDisplayMode = row.price_display_mode || 'default';
```

**Zeitaufwand:** 30 Minuten

---

### **Gesamt-Aufwand Issue #3:**

| Phase | Aufgabe | Zeit |
|-------|---------|------|
| 1 | Database Migration | 1h |
| 2 | Type Definitions | 15min |
| 3 | Field Mapper | 5min |
| 4 | OfferForm UI | 2h |
| 5 | InvoiceForm UI | 1h |
| 6 | PDF Template | 1h |
| 7 | Adapter Mapping | 30min |
| **TOTAL** | **6 Stunden 20min** |

---

## 📊 **Zusammenfassung aller Issues**

| Issue | Priorität | Aufwand | Komplexität |
|-------|-----------|---------|-------------|
| #1: Anmerkungen-Box Breite | 🟡 MEDIUM | 15min | Low |
| #2: Theme-Farben Integration | 🟡 MEDIUM | 15min | Low |
| #3: SubItem "inkl." Feature | 🔴 HIGH | 6h 20min | High |
| **GESAMT** | | **~7 Stunden** | |

---

## 🎯 **Empfohlene Umsetzungs-Reihenfolge**

### **Sprint 1: Quick Wins (30min)**

1. ✅ Issue #1 & #2 zusammen beheben (kombinierter Fix)
   - `electron/ipc/pdf-templates.ts` Lines 700-726
   - Testing: PDF generieren, visuell prüfen

### **Sprint 2: SubItem Feature (2 Tage)**

**Tag 1 - Backend (3h):**
1. Migration 025 erstellen & testen (1h)
2. Type Definitions + Field Mapper (20min)
3. SQLiteAdapter anpassen (30min)
4. Integration Testing (1h)

**Tag 2 - Frontend (3h):**
1. OfferForm UI erweitern (2h)
2. InvoiceForm UI erweitern (1h)
3. PDF Template anpassen (1h)
4. E2E Testing (1h)

---

## ✅ **Testing Checklist**

### **Issue #1 & #2 (PDF Layout & Theme):**

- [ ] PDF mit kurzen Anmerkungen (<200 Zeichen) generieren
- [ ] PDF mit langen Anmerkungen (>200 Zeichen) generieren
- [ ] Anmerkungen-Box nutzt volle Seitenbreite
- [ ] Theme-Farben werden korrekt angewendet
- [ ] Verschiedene Themes testen (alle 5 Pastel Themes)

### **Issue #3 (SubItem Preise):**

**Backend:**
- [ ] Migration 025 läuft erfolgreich
- [ ] Feld `price_display_mode` in DB vorhanden
- [ ] Field Mapper konvertiert korrekt (camelCase ↔ snake_case)
- [ ] Adapter speichert/lädt `priceDisplayMode` korrekt

**Frontend:**
- [ ] Dropdown "Preis-Anzeige-Modus" erscheint bei SubItems
- [ ] Mode "default": Normale Preiseingabe möglich
- [ ] Mode "inkl.": Preisfelder disabled, "inkl." angezeigt
- [ ] Mode "hidden": Preis versteckt ("—")
- [ ] Mode "optional": "optional" angezeigt
- [ ] Dropdown-Änderung setzt Preise auf 0 (bei "inkl." / "hidden")

**PDF:**
- [ ] SubItem mit "default": Preis €XX.XX
- [ ] SubItem mit "inkl.": Text "inkl." statt Preis
- [ ] SubItem mit "hidden": "—" statt Preis
- [ ] SubItem mit "optional": "optional" statt Preis
- [ ] Formatierung korrekt (italic, Farben)

---

## 📝 **Dokumentation Updates**

Nach Implementierung aktualisieren:

1. **Coding Standards:** `docs/01-standards/CODING-STANDARDS.md`
   - Neue `PriceDisplayMode` Enum dokumentieren

2. **Component Audit:** `docs/08-ui/COMPONENT-AUDIT-REPORT-2025-10-14.md`
   - OfferForm/InvoiceForm neue Features hinzufügen

3. **Database Docs:** `docs/05-database/`
   - Migration 025 dokumentieren
   - Schema-Änderungen erklären

4. **PDF Docs:** `docs/09-pdf/`
   - Neue SubItem Rendering-Logik dokumentieren
   - Theme-Farben Integration dokumentieren

---

## 🔗 **Related Documentation**

- [Component Audit Report](../08-ui/COMPONENT-AUDIT-REPORT-2025-10-14.md)
- [PDF Theme System (FIX-007)](./CRITICAL-FIX-007-PDF-THEME-SYSTEM.md)
- [Offer Foreign Key Fix](../05-database/final/LESSONS-LEARNED-offer-foreign-key-constraint-fix.md)
- [Field Mapper Documentation](../06-paths/FIELD-MAPPING-SYSTEM.md)

---

**Report erstellt:** 14. Oktober 2025
**Nächster Review:** Nach Implementation (geschätzt ~1 Woche)
**Priorität:** HIGH (User-Impact hoch, besonders Issue #3)
