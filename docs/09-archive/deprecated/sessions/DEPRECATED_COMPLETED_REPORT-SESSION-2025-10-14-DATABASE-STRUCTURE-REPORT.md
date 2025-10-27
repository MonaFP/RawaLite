# DATABASE STRUKTUR ANALYSE - 2025-10-14

## 📋 **ZUSAMMENFASSUNG: ID-VERGABE IN RAWALITE**

### **Frage 1: Haben Parent und SubItems eindeutige IDs in der Datenbank?**

✅ **JA - ALLE LineItems haben eindeutige IDs**

**Beweis:**
```sql
-- Alle LineItem-Tabellen:
CREATE TABLE package_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ✅ Eindeutige ID
  parent_item_id INTEGER                 -- ✅ Referenziert andere ID
);

CREATE TABLE offer_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ✅ Eindeutige ID
  parent_item_id INTEGER                 -- ✅ Referenziert andere ID
);

CREATE TABLE invoice_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ✅ Eindeutige ID
  parent_item_id INTEGER                 -- ✅ Referenziert andere ID
);
```

**Parent und SubItems:**
- **Parents:** Haben `id` (eindeutig), `parent_item_id = NULL`
- **SubItems:** Haben `id` (eindeutig), `parent_item_id = <parent.id>`
- **Garantie:** SQLite AUTOINCREMENT + PRIMARY KEY = immer eindeutig

---

## 📊 **Frage 2: Welche Parameter haben eindeutige IDs?**

### **✅ TABELLEN MIT EINDEUTIGEN IDs (AUTOINCREMENT PRIMARY KEY)**

| Tabelle | ID-Spalte | Typ | Eindeutig | Notizen |
|---------|-----------|-----|-----------|---------|
| **customers** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Kundenstammdaten |
| **packages** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Leistungspakete |
| **package_line_items** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Package-Positionen (inkl. SubItems) |
| **offers** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Angebote |
| **offer_line_items** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Angebots-Positionen (inkl. SubItems) |
| **offer_attachments** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Angebots-Anhänge |
| **invoices** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Rechnungen |
| **invoice_line_items** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Rechnungs-Positionen (inkl. SubItems) |
| **invoice_attachments** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Rechnungs-Anhänge |
| **activities** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Tätigkeiten (Vorlagen) |
| **timesheets** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Leistungsnachweise |
| **timesheet_activities** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Leistungsnachweis-Positionen |
| **numbering_circles** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Nummernkreise (Jahr/Typ) |
| **offer_status_history** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Angebots-Statushistorie |
| **invoice_status_history** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Rechnungs-Statushistorie |
| **timesheet_status_history** | `id` | INTEGER PK AUTOINCREMENT | ✅ | Leistungsnachweis-Statushistorie |
| **update_history** | `id` | INTEGER PK AUTOINCREMENT | ✅ | App-Update-Historie |

**TOTAL: 17 Tabellen mit AUTOINCREMENT IDs**

---

### **⚠️ TABELLE MIT FESTGELEGTER ID (SINGLETON)**

| Tabelle | ID-Spalte | Typ | Eindeutig | Notizen |
|---------|-----------|-----|-----------|---------|
| **settings** | `id` | INTEGER PK DEFAULT 1 | ✅ | Nur 1 Zeile erlaubt (id=1) |

**Details:**
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  -- Singleton Pattern: Nur eine Einstellungs-Zeile
);
```

---

### **❌ PARAMETER OHNE DB-ID (Virtuelle/Frontend-only)**

| Parameter | Scope | ID-Typ | Persistiert |
|-----------|-------|--------|-------------|
| **Line Item Draft** | Frontend (vor Save) | Negative Temp-ID (z.B. -1, -2) | ❌ Nein |
| **clientTempId** | Frontend-Helper | String (z.B. "temp-123") | ⚠️ Optional in DB |
| **Array Index** | Runtime | Position im Array | ❌ Nein |
| **Form State** | React State | Keine ID | ❌ Nein |

**Wichtig:**
- Frontend nutzt **negative IDs** für neue Items (z.B. `id: -1`)
- Bei Save werden diese via **ID-Mapping** auf echte DB-IDs gemappt
- `clientTempId` ist Optional-Field für Frontend-Tracking

---

## 🗄️ **Frage 3: Wie ist die Datenbank aktuell aufgebaut?**

### **AKTUELLE SCHEMA-VERSION: 24**

**Migrations Applied:** 000 → 024 (25 Migrationen)

---

## 📊 **VOLLSTÄNDIGES DATENBANKSCHEMA**

### **1. CORE BUSINESS ENTITIES**

#### **1.1 Customers (Kunden)**
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,              -- Kundennummer (KD-0001)
  name TEXT NOT NULL,                       -- Firmenname
  email TEXT,
  phone TEXT,
  street TEXT,
  zip TEXT,
  city TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_customers_number ON customers(number);
CREATE INDEX idx_customers_name ON customers(name);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)
- ✅ `number` (UNIQUE - Kundennummer)

---

#### **1.2 Packages (Leistungspakete)**
```sql
CREATE TABLE packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  internal_title TEXT NOT NULL,             -- Interner Name
  parent_package_id INTEGER,                -- Referenz auf Parent-Package
  total REAL NOT NULL DEFAULT 0,
  add_vat INTEGER DEFAULT 0,                -- Boolean: MwSt. addieren?
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_package_id) REFERENCES packages(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_packages_parent ON packages(parent_package_id);
```

**Hierarchie:**
- ✅ Packages können Sub-Packages haben (via `parent_package_id`)
- ✅ Self-referencing FOREIGN KEY

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

---

#### **1.3 Package Line Items (Package-Positionen)**
```sql
CREATE TABLE package_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,       -- Migration 021: amount → unit_price
  parent_item_id INTEGER,                   -- Referenz auf Parent-Item (SubItems)
  hierarchy_level INTEGER NOT NULL DEFAULT 0, -- Migration 023
  item_origin TEXT DEFAULT 'manual',        -- Migration 024: 'manual'|'package_import'|'template'
  sort_order INTEGER DEFAULT 0,             -- Migration 024
  client_temp_id TEXT,                      -- Migration 024: Frontend-Helper
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_item_id) REFERENCES package_line_items(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_package_line_items_package ON package_line_items(package_id);
CREATE INDEX idx_package_line_items_parent ON package_line_items(parent_item_id);
CREATE INDEX idx_package_line_items_sort_order ON package_line_items(package_id, sort_order);
```

**Hierarchie:**
- ✅ **Parents:** `parent_item_id = NULL`, `hierarchy_level = 0`
- ✅ **SubItems:** `parent_item_id = <parent.id>`, `hierarchy_level = 1`
- ✅ Self-referencing FOREIGN KEY mit CASCADE DELETE

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

**Field Mapping:**
- ✅ DB: `unit_price` ↔ Frontend: `amount` (via field-mapper)

---

#### **1.4 Offers (Angebote)**
```sql
CREATE TABLE offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_number TEXT NOT NULL UNIQUE,        -- AN-2025-0001
  customer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',     -- 'draft'|'sent'|'accepted'|'rejected'
  valid_until TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 19,
  vat_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  sent_at TEXT,
  accepted_at TEXT,
  rejected_at TEXT,
  -- Migration 013: Discount System
  discount_type TEXT,                       -- 'percentage'|'fixed'|NULL
  discount_value REAL,
  discount_amount REAL,
  subtotal_before_discount REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_offers_customer ON offers(customer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_offer_number ON offers(offer_number);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)
- ✅ `offer_number` (UNIQUE - Angebotsnummer)

**Numbering:**
- ✅ `offer_number` generiert via `numbering_circles` (Jahr-basiert)

---

#### **1.5 Offer Line Items (Angebots-Positionen)**
```sql
CREATE TABLE offer_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  parent_item_id INTEGER,                   -- Referenz auf Parent-Item
  hierarchy_level INTEGER NOT NULL DEFAULT 0, -- Migration 023
  -- Migration 011: Item Type System
  item_type TEXT DEFAULT 'standalone',      -- 'standalone'|'individual_sub'|'package_import'
  source_package_id INTEGER,                -- Referenz auf Source-Package (bei import)
  -- Migration 014: Item Origin System
  item_origin TEXT DEFAULT 'manual',        -- 'manual'|'package_import'|'template'
  source_package_item_id INTEGER,           -- Referenz auf Original-Package-Item
  sort_order INTEGER DEFAULT 0,
  client_temp_id TEXT,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_item_id) REFERENCES offer_line_items(id) ON DELETE CASCADE,
  FOREIGN KEY (source_package_id) REFERENCES packages(id) ON DELETE SET NULL,
  FOREIGN KEY (source_package_item_id) REFERENCES package_line_items(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_offer_line_items_offer ON offer_line_items(offer_id);
CREATE INDEX idx_offer_line_items_parent ON offer_line_items(parent_item_id);
CREATE INDEX idx_offer_line_items_type ON offer_line_items(item_type);
CREATE INDEX idx_offer_line_items_source_package ON offer_line_items(source_package_id);
CREATE INDEX idx_offer_line_items_sort_order ON offer_line_items(offer_id, sort_order);
```

**Hierarchie:**
- ✅ **Parents:** `parent_item_id = NULL`, `hierarchy_level = 0`
- ✅ **SubItems:** `parent_item_id = <parent.id>`, `hierarchy_level = 1`

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

**Item Types:**
- `standalone`: Normale Position ohne Parent
- `individual_sub`: Manuell erstelltes SubItem
- `package_import`: Aus Package importierte Position

---

#### **1.6 Offer Attachments (Angebots-Anhänge)**
```sql
CREATE TABLE offer_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER,                         -- NULL = Line-Item Attachment
  line_item_id INTEGER,                     -- Referenz auf offer_line_items
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  base64_data TEXT,                         -- Optional: Embedded Base64
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
  FOREIGN KEY (line_item_id) REFERENCES offer_line_items(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_offer_attachments_offer ON offer_attachments(offer_id);
CREATE INDEX idx_offer_attachments_line_item ON offer_attachments(line_item_id);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

**Attachment Logic:**
- Offer-Level: `offer_id` SET, `line_item_id` NULL
- LineItem-Level: `offer_id` NULL, `line_item_id` SET

---

#### **1.7 Invoices (Rechnungen)**
```sql
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,      -- RE-2025-0001
  customer_id INTEGER NOT NULL,
  offer_id INTEGER,                         -- Optional: Verknüpfte Angebot
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',     -- 'draft'|'sent'|'paid'|'overdue'
  due_date TEXT NOT NULL,
  paid_at TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 19,
  vat_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  -- Migration 013: Discount System
  discount_type TEXT,
  discount_value REAL,
  discount_amount REAL,
  subtotal_before_discount REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)
- ✅ `invoice_number` (UNIQUE - Rechnungsnummer)

---

#### **1.8 Invoice Line Items (Rechnungs-Positionen)**
```sql
CREATE TABLE invoice_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  parent_item_id INTEGER,
  hierarchy_level INTEGER NOT NULL DEFAULT 0,
  item_origin TEXT DEFAULT 'manual',
  source_package_item_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  client_temp_id TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_item_id) REFERENCES invoice_line_items(id) ON DELETE CASCADE,
  FOREIGN KEY (source_package_item_id) REFERENCES package_line_items(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_parent ON invoice_line_items(parent_item_id);
CREATE INDEX idx_invoice_line_items_sort_order ON invoice_line_items(invoice_id, sort_order);
CREATE INDEX idx_invoice_line_items_source_package ON invoice_line_items(source_package_item_id);
```

**Hierarchie:**
- ✅ **Parents:** `parent_item_id = NULL`, `hierarchy_level = 0`
- ✅ **SubItems:** `parent_item_id = <parent.id>`, `hierarchy_level = 1`

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

---

#### **1.9 Invoice Attachments (Rechnungs-Anhänge)**
```sql
CREATE TABLE invoice_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER,
  line_item_id INTEGER,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  base64_data TEXT,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (line_item_id) REFERENCES invoice_line_items(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_invoice_attachments_invoice ON invoice_attachments(invoice_id);
CREATE INDEX idx_invoice_attachments_line_item ON invoice_attachments(line_item_id);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

---

#### **1.10 Activities (Tätigkeiten-Vorlagen)**
```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  hourly_rate REAL NOT NULL DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

---

#### **1.11 Timesheets (Leistungsnachweise)**
```sql
CREATE TABLE timesheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timesheet_number TEXT NOT NULL UNIQUE,    -- LN-2025-0001
  customer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_hours REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 19,
  vat_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_timesheets_customer ON timesheets(customer_id);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_number ON timesheets(timesheet_number);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)
- ✅ `timesheet_number` (UNIQUE)

---

#### **1.12 Timesheet Activities (Leistungsnachweis-Positionen)**
```sql
CREATE TABLE timesheet_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timesheet_id INTEGER NOT NULL,
  activity_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  hours REAL NOT NULL DEFAULT 0,
  hourly_rate REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  work_date TEXT NOT NULL,
  FOREIGN KEY (timesheet_id) REFERENCES timesheets(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_timesheet_activities_timesheet ON timesheet_activities(timesheet_id);
CREATE INDEX idx_timesheet_activities_activity ON timesheet_activities(activity_id);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

**Hinweis:** Keine Parent-Child Hierarchie (anders als LineItems)

---

### **2. SYSTEM TABLES**

#### **2.1 Settings (Einstellungen - Singleton)**
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,         -- IMMER id=1 (Singleton)
  company_name TEXT,
  company_owner TEXT,
  street TEXT,
  zip TEXT,
  city TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  tax_number TEXT,
  vat_id TEXT,
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  logo_path TEXT,
  tax_office TEXT,                          -- Migration 012
  -- Mini-Fix Delivery Settings (Migration 019)
  mini_fix_max_duration INTEGER DEFAULT 30,
  mini_fix_hourly_rate REAL DEFAULT 50.0,
  mini_fix_travel_costs REAL DEFAULT 0.0,
  -- Auto-Update Settings (Migration 018)
  auto_update_enabled INTEGER DEFAULT 1,
  auto_download_updates INTEGER DEFAULT 0,
  check_for_updates_on_startup INTEGER DEFAULT 1,
  notify_about_updates INTEGER DEFAULT 1
);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY DEFAULT 1 - SINGLETON)

**Singleton Pattern:**
- Nur **eine** Zeile erlaubt (`id = 1`)
- Keine AUTOINCREMENT (fixe ID)

---

#### **2.2 Numbering Circles (Nummernkreise)**
```sql
CREATE TABLE numbering_circles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                       -- 'offer'|'invoice'|'package'|'timesheet'
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  prefix TEXT DEFAULT '',
  suffix TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(type, year)
);

-- Indexes
CREATE INDEX idx_numbering_circles_type_year ON numbering_circles(type, year);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)
- ✅ `(type, year)` (UNIQUE COMPOSITE - z.B. ('offer', 2025))

**Jahres-Reset:**
- Jedes Jahr neuer Nummernkreis
- `last_number` wird atomar inkrementiert

---

#### **2.3 Status History Tables**

**Offer Status History:**
```sql
CREATE TABLE offer_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

CREATE INDEX idx_offer_status_history_offer ON offer_status_history(offer_id);
```

**Invoice Status History:**
```sql
CREATE TABLE invoice_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoice_status_history_invoice ON invoice_status_history(invoice_id);
```

**Timesheet Status History:**
```sql
CREATE TABLE timesheet_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timesheet_id INTEGER NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (timesheet_id) REFERENCES timesheets(id) ON DELETE CASCADE
);

CREATE INDEX idx_timesheet_status_history_timesheet ON timesheet_status_history(timesheet_id);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

---

#### **2.4 Update History (App-Updates)**
```sql
CREATE TABLE update_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  release_notes TEXT
);
```

**Unique Constraints:**
- ✅ `id` (PRIMARY KEY AUTOINCREMENT)

---

## 🔗 **FOREIGN KEY BEZIEHUNGEN**

### **Hierarchische Beziehungen (Self-Referencing)**

| Tabelle | Parent-Spalte | Referenziert | CASCADE DELETE |
|---------|---------------|--------------|----------------|
| **packages** | `parent_package_id` | `packages(id)` | ✅ |
| **package_line_items** | `parent_item_id` | `package_line_items(id)` | ✅ |
| **offer_line_items** | `parent_item_id` | `offer_line_items(id)` | ✅ |
| **invoice_line_items** | `parent_item_id` | `invoice_line_items(id)` | ✅ |

**Wichtig:**
- ✅ Bei Deletion des Parents werden **alle** SubItems automatisch gelöscht
- ✅ `parent_item_id = NULL` → Parent-Item
- ✅ `parent_item_id = <id>` → SubItem

---

### **Entity-zu-LineItem Beziehungen**

| LineItem-Tabelle | Parent-Entity | ON DELETE |
|------------------|---------------|-----------|
| **package_line_items** | `packages(id)` | CASCADE |
| **offer_line_items** | `offers(id)` | CASCADE |
| **invoice_line_items** | `invoices(id)` | CASCADE |
| **timesheet_activities** | `timesheets(id)` | CASCADE |

---

### **Cross-Entity Referenzen**

| Von-Tabelle | Von-Spalte | Nach-Tabelle | ON DELETE |
|-------------|------------|--------------|-----------|
| **offers** | `customer_id` | `customers(id)` | CASCADE |
| **invoices** | `customer_id` | `customers(id)` | CASCADE |
| **invoices** | `offer_id` | `offers(id)` | SET NULL |
| **timesheets** | `customer_id` | `customers(id)` | CASCADE |
| **offer_line_items** | `source_package_id` | `packages(id)` | SET NULL |
| **offer_line_items** | `source_package_item_id` | `package_line_items(id)` | SET NULL |
| **invoice_line_items** | `source_package_item_id` | `package_line_items(id)` | SET NULL |

---

## 📈 **MIGRATIONS-HISTORIE**

| Version | Name | Kernänderung |
|---------|------|--------------|
| 000 | init | Initial Schema (customers, offers, invoices, packages) |
| 001 | settings_restructure | Settings von Key-Value auf Spalten |
| 007 | fix_packages_invoice_schema | package_line_items + invoice_line_items erstellt |
| 008 | fix_offers_schema | offer_line_items erstellt + offer_number |
| 009 | add_timesheets | Timesheets + Activities |
| 011 | extend_offer_line_items | item_type + source_package_id |
| 012 | add_tax_office_field | tax_office in settings |
| 013 | add_discount_system | Rabatt-Felder in offers/invoices |
| 014 | add_item_origin_system | item_origin + sort_order + client_temp_id |
| 015 | add_status_versioning | Status-History-Tabellen |
| 016 | add_offer_attachments | offer_attachments Tabelle |
| 017 | add_update_history | update_history Tabelle |
| 018 | add_auto_update_preferences | Auto-Update Settings |
| 019 | mini_fix_delivery | Mini-Fix Settings |
| 021 | unify_package_unit_price | amount → unit_price in package_line_items |
| 022 | add_invoice_attachments | invoice_attachments Tabelle |
| 023 | add_line_item_hierarchy_level | hierarchy_level in allen LineItem-Tabellen |
| 024 | restore_package_line_item_metadata | item_origin/sort_order/client_temp_id in package_line_items |

**Aktuelle Version:** 24 (via `PRAGMA user_version`)

---

## 🎯 **ANTWORTEN AUF FRAGEN (Zusammenfassung)**

### **1. Haben Parent und SubItems eindeutige IDs in der Datenbank?**

✅ **JA - IMMER**

**Beweis-Tabelle:**

| Item-Typ | Beispiel-Daten | `id` | `parent_item_id` | Eindeutig? |
|----------|----------------|------|------------------|------------|
| **Parent** | "Farbanpassung Basis" | 1 | NULL | ✅ |
| **SubItem 1** | "Bad 1 EG" | 2 | 1 | ✅ |
| **SubItem 2** | "Bad 2 OG" | 3 | 1 | ✅ |
| **SubItem 3** | "Bad 3 DG" | 4 | 1 | ✅ |

**Garantie:**
- SQLite `INTEGER PRIMARY KEY AUTOINCREMENT`
- Jedes Item bekommt eindeutige ID
- `parent_item_id` referenziert andere eindeutige ID

---

### **2. Welche Parameter haben eindeutige IDs?**

**✅ ALLE Hauptentitäten:**
- Customers (Kunden)
- Packages (Leistungspakete)
- Package Line Items (inkl. SubItems)
- Offers (Angebote)
- Offer Line Items (inkl. SubItems)
- Offer Attachments
- Invoices (Rechnungen)
- Invoice Line Items (inkl. SubItems)
- Invoice Attachments
- Activities (Tätigkeiten)
- Timesheets (Leistungsnachweise)
- Timesheet Activities
- Numbering Circles
- Status History (alle 3 Typen)
- Update History

**⚠️ SINGLETON (fixe ID=1):**
- Settings

**❌ KEINE DB-ID:**
- Frontend Temp-IDs (negative Zahlen)
- Array-Indizes (Runtime)
- Form-State

---

### **3. Wie ist die Datenbank aufgebaut?**

**Architektur:**
- **17 Tabellen** mit AUTOINCREMENT IDs
- **1 Singleton-Tabelle** (Settings mit id=1)
- **4 Hierarchische Strukturen** (Self-Referencing FKs):
  - Packages → Sub-Packages
  - Package LineItems → SubItems
  - Offer LineItems → SubItems
  - Invoice LineItems → SubItems
- **25 Migrationen** (Version 0-24)
- **Atomic Numbering** via numbering_circles (Jahr-basiert)
- **CASCADE DELETE** für Hierarchien
- **SET NULL** für Cross-Entity Referenzen

**Kernprinzipien:**
1. ✅ Alle Business-Entities haben eindeutige AUTOINCREMENT IDs
2. ✅ Parent-Child via `parent_item_id` (NULL = Parent)
3. ✅ Field-Mapping: DB snake_case ↔ Frontend camelCase
4. ✅ Status-Tracking via History-Tabellen
5. ✅ Attachments per Entity + LineItem

---

## 🔍 **BEWEIS: Array-Index-Matching ist NIEMALS nötig**

**Code-Beweis aus SQLiteAdapter.ts:**
```typescript
// Line 335+: ID Mapping System
const idMapping: Record<number, number> = {};

for (const item of mainItems) {
  const itemResult = await this.client.exec(/*...*/);
  idMapping[item.id] = Number(itemResult.lastInsertRowid);
  // ✅ lastInsertRowid = Garantierte DB-ID
}

for (const item of subItems) {
  const resolvedParentId = idMapping[item.parentItemId];
  // ✅ parentItemId wird auf DB-ID gemappt
}
```

**Folgerung:**
- System arbeitet **AUSSCHLIESSLICH** mit DB-IDs
- Array-Index-Matching war **konzeptionelles Missverständnis**
- PDF SubItems Bug: Strategy 2 war **nie nötig**

---

**💡 Fazit:** RawaLite hat ein vollständig ID-basiertes System. Array-Indizes werden NIEMALS als Parent-Referenzen verwendet.
