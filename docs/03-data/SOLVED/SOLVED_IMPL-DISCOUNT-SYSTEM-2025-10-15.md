CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**

# Rabattsystem Implementierung - Vollständige Dokumentation

**Datum:** 03. Oktober 2025  
**Version:** 1.0.13  
**Status:** ✅ Produktiv implementiert und getestet

## 📋 Übersicht

Das Rabattsystem ermöglicht es, sowohl bei Angeboten als auch bei Rechnungen individuelle Rabatte hinzuzufügen. Das System unterstützt:

- **Gesamtrabatte** (nicht per Einzelposition)
- **Prozentuale Rabatte** (z.B. 10%)
- **Feste Beträge** (z.B. 50,00 €)
- **Automatische Berechnung** mit 2-Dezimalstellen-Präzision
- **Kleinunternehmerregelung** (§19 UStG) Unterstützung
- **PDF-Integration** mit Theme-bewusster Darstellung
- **Änderungsverfolgung** in der Datenbank

## 🗄️ Datenbankschema (Migration 013)

### Neue Felder in `offers` und `invoices` Tabellen:

```sql
-- Rabatt-Typ: 'percentage' oder 'fixed'
discount_type TEXT DEFAULT NULL

-- Rabatt-Wert: Prozentsatz (z.B. 10.5) oder fester Betrag (z.B. 25.00)
discount_value REAL DEFAULT NULL

-- Berechneter Rabatt-Betrag in Euro
discount_amount REAL DEFAULT NULL

-- Zwischensumme vor Rabatt
subtotal_before_discount REAL DEFAULT NULL
```

### Migration Details:
- **Datei:** `src/main/db/migrations/013_add_discount_system.ts`
- **Schema Version:** 13
- **Backup:** Automatisch vor Migration erstellt
- **Rollback:** Möglich über Backup-Wiederherstellung

## 🏗️ Architektur

### 1. Field Mapping System
**Datei:** `src/lib/field-mapper.ts`

```typescript
// Neue Mappings hinzugefügt:
discountType: 'discount_type',
discountValue: 'discount_value', 
discountAmount: 'discount_amount',
subtotalBeforeDiscount: 'subtotal_before_discount'
```

### 2. TypeScript Interfaces
**Datei:** `src/domain.ts`

```typescript
interface DocumentDiscount {
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number | null;
  discountAmount: number | null;
  subtotalBeforeDiscount: number | null;
}
```

### 3. Berechnungslogik
**Datei:** `src/lib/discount-calculator.ts`

- **Rundung:** 2 Dezimalstellen für alle Geldbeträge
- **Validierung:** Prozentsätze 0-100%, feste Beträge ≥ 0
- **Kleinunternehmer:** Automatische Steuerbefreiung berücksichtigt
- **Edge Cases:** Division durch Null, negative Werte abgefangen

## 💾 Datenpersistierung

### SQLite Adapter Updates
**Datei:** `src/adapters/SQLiteAdapter.ts`

#### CREATE Operations:
```sql
INSERT INTO offers (
  ..., discount_type, discount_value, discount_amount, subtotal_before_discount
) VALUES (
  ..., ?, ?, ?, ?
)
```

#### UPDATE Operations:
```sql
UPDATE offers SET 
  ...,
  discount_type = ?,
  discount_value = ?,
  discount_amount = ?,
  subtotal_before_discount = ?
WHERE id = ?
```

## 🎨 UI-Komponenten

### Angebots-Formular
**Datei:** `src/components/forms/OfferForm.tsx`

- **Rabatt-Sektion:** Nach Positionsliste, vor Gesamtsumme
- **Toggle-Schalter:** Ein/Ausblenden der Rabatt-Eingabe
- **Live-Berechnung:** Echtzeit-Update bei Wertänderungen
- **Validierung:** Client-seitige Eingabeprüfung

### Rechnungs-Formular
**Datei:** `src/components/forms/InvoiceForm.tsx`

- **Identische Struktur** wie Angebots-Formular
- **Gemeinsame Logik** für Konsistenz
- **Responsive Design** für alle Bildschirmgrößen

## 📄 PDF-Integration

### PDF Service Updates
**Datei:** `src/services/PDFService.ts`

#### Theme-System Korrekturen:
- **Problem:** Theme-Erkennung funktionierte nur für Lavendel
- **Lösung:** Parameter-basierte statt DOM-basierte Theme-Erkennung
- **Alle 6 Themes:** Standard, Salbeigrün, Himmelblau, Lavendel, Pfirsich, Rosé

#### Theme Mapping:
```typescript
const themeColors = {
  'default': '#2D5016',     // Standard - Tannengrün
  'sage': '#9CAF88',        // Salbeigrün
  'sky': '#87CEEB',         // Himmelblau
  'lavender': '#DDA0DD',    // Lavendel
  'peach': '#FFCBA4',       // Pfirsich
  'rose': '#FFB6C1'         // Rosé
};
```

### PDF Template Updates
**Datei:** `electron/main.ts`

#### Rabatt-Darstellung:
```html
${discount && discount.discountType ? `
  <tr class="discount-row">
    <td colspan="3" style="text-align: right; padding-right: 20px;">
      <strong>Rabatt (${discount.discountType === 'percentage' ? 
        discount.discountValue + '%' : 
        discount.discountValue?.toFixed(2) + ' €'}):</strong>
    </td>
    <td style="text-align: right; padding-right: 20px;">
      <strong>-${discount.discountAmount?.toFixed(2)} €</strong>
    </td>
  </tr>
` : ''}
```

#### Footer-Bereinigung:
- **Entfernt:** Datum/Uhrzeit aus PDF-Footer
- **Behalten:** Nur Seitennummerierung
- **Grund:** Cleaner Look, weniger Information

## 🧪 Validierung & Tests

### Manuelle Tests durchgeführt:
1. **Rabatt-Berechnung:** Prozentual und feste Beträge
2. **Theme-Switching:** Alle 6 Themes in PDF getestet
3. **Kleinunternehmer:** Steuerfreie Berechnung validiert
4. **Edge Cases:** Negative Werte, Null-Division geprüft
5. **Persistence:** Speichern/Laden aus Datenbank

### Automatische Validierung:
```bash
# Kritische Fixes validieren
pnpm validate:critical-fixes

# Dokumentationsstruktur prüfen
pnpm validate:docs-structure
```

## 🚨 Kritische Erkenntnisse

### Theme-System Lessons:
1. **DOM-Inspection unreliable:** Cross-process theme data needs explicit parameters
2. **Fallback Essential:** Always provide default colors for unknown themes
3. **Naming Consistency:** Frontend and PDF theme names must match exactly

### PDF Generation Lessons:
1. **Template Compilation:** Main process changes require `pnpm build:main`
2. **CSS Scoping:** PDF styles don't inherit from main application
3. **Print Media Queries:** Different behavior than screen rendering

### Database Lessons:
1. **Migration Testing:** Always backup before schema changes
2. **Field Mapping:** Update both directions (camelCase ↔ snake_case)
3. **NULL Handling:** Graceful degradation for missing discount data

## 🔧 Wartung & Support

### Zukünftige Erweiterungen:
- **Position-spezifische Rabatte:** Technisch möglich durch Erweiterung
- **Mehrfach-Rabatte:** Gestaffelte Rabattsysteme implementierbar
- **Rabatt-Kategorien:** Vordefinierte Rabatt-Templates

### Monitoring:
- **Database Schema:** Version 13 in `schema_version` Tabelle
- **Error Logging:** Console-Ausgaben bei Berechnungsfehlern
- **Performance:** Rabatt-Berechnung ist O(1) Operation

## 📚 Verwandte Dokumentation

- `docs/03-data/MIGRATION-013-DISCOUNT-SYSTEM.md` - Migration Details
- `docs/04-ui/DISCOUNT-UI-COMPONENTS.md` - UI Implementierung
- `docs/04-ui/THEME-SYSTEM-FIXES.md` - PDF Theme Korrekturen
- `docs/06-lessons/LESSONS-LEARNED-DISCOUNT-PROJECT.md` - Projekt Erkenntnisse

## ✅ Bestätigung

**User Feedback:** "Perfekt, klappt!" (03.10.2025)  
**Status:** Vollständig implementiert und produktiv einsatzbereit  
**Next Steps:** System ist bereit für Produktivnutzung

---

*Erstellt am 03.10.2025 | RawaLite v1.0.13 | Migration 013*