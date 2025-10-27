# Line Item Hierarchy Fields – Documentation

$12025-10-17**Version:** Schema v24

## 🎯 Ziel
- Einheitliche Hierarchie-Information für alle Belegarten (Pakete, Angebote, Rechnungen).
- Technische Grundlage für PDF-Einrückungen und strukturierte Auswertungen.

## 🗂️ Neue/reaktivierte Spalten
| Tabelle | Spalte | Typ | Default | Beschreibung |
|---------|--------|-----|---------|--------------|
| offer_line_items | hierarchy_level | INTEGER NOT NULL | 0 | 0 = Hauptposition, >0 für verschachtelte Ebenen |
| invoice_line_items | hierarchy_level | INTEGER NOT NULL | 0 | Spiegelt Offer-Logik |
| package_line_items | hierarchy_level | INTEGER NOT NULL | 0 | Für Paket-Hierarchien (Sub-Items, spätere Verschachtelung) |
| package_line_items | item_origin | TEXT CHECK (…) | 'manual' | Reaktiviert (Migration 024) |
| package_line_items | sort_order | INTEGER | 0 | Explizite Sortierung |
| package_line_items | client_temp_id | TEXT | NULL | Frontend-Helfer |

> Hinweis: item_origin, sort_order, client_temp_id existierten bereits durch Migration 014, wurden durch den Unify-Fix (021) entfernt und jetzt in Migration 024 wiederhergestellt.

## 🧩 Migrationen
1. **023_add_line_item_hierarchy_level**
   - Fügt hierarchy_level mit Default 0 hinzu.
   - Initialisiert bestehende Daten (parent_item_id → Level 1, sonst 0).

2. **024_restore_package_line_item_metadata**
   - Reaktiviert Meta-Spalten in package_line_items.
   - Rekonstruiert idx_package_line_items_sort_order.

## 🔄 Field-Mapping / Adapter
- src/lib/field-mapper.ts: neue Zuordnungen für hierarchyLevel, itemOrigin, sourcePackageItemId, sortOrder, clientTempId.
- src/persistence/adapter.ts: Interfaces um hierarchyLevel? ergänzt (Packages/Offers/Invoices).
- Keine Codeänderungen an SQLiteAdapter notwendig – Datenbank setzt Defaults.

## 🧪 Tests / QA
- **Schema-Check:** inspect-schema.js (SQLITE PRAGMA) → hierarchie-Spalten vorhanden.
- **Regression:** Angebote/Rechnungen/ Pakete erstellen + exportieren (manuelle Kontrolle, PDF-Sub-Item Check).
- **Migration Rollback:** siehe Down-Implementierung 023/024 (recreate tables + Indizes).

## 📌 Folgeaufgaben
- PDF-Views (Phase 3) nutzen hierarchy_level und sort_order für sortierte Ausgabe.
- Frontend kann später hierarchyLevel aktiv pflegen (nicht blocker für diese Phase).


