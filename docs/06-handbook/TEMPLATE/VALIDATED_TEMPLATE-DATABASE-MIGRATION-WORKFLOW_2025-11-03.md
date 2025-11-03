# TEMPLATE: DATABASE-MIGRATION-WORKFLOW

> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Template Creation - Initial Auto-Detection Setup)  
> **Status:** VALIDATED | **Typ:** TEMPLATE - Database Migration Workflow Pattern  
> **Schema:** `VALIDATED_TEMPLATE-DATABASE-MIGRATION-WORKFLOW_2025-11-03.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** VALIDATED (automatisch durch "Database Migration Workflow", "Migration Pattern" erkannt)
> - **TEMPLATE-QUELLE:** 06-handbook TEMPLATE Collection
> - **AUTO-UPDATE:** Bei Migration-System-Änderung automatisch Template aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "Migration Workflow", "Schema Version", "Database Pattern"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = VALIDATED:**
> - ✅ **Migration-Pattern** - Verlässliche Quelle für Database-Migration-Workflows
> - ✅ **Schema-Architecture** - Authoritative Standards für Schema-Versionierung
> - 🎯 **AUTO-REFERENCE:** Bei Migration-Dokumentation IMMER dieses Template verwenden
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "NEW MIGRATION" → Template kopieren und ausfüllen

> **⚠️ TEMPLATE-PURPOSE:** Strukturierte Dokumentation von neuen Database-Migrationen mit Best-Practices (03.11.2025)  
> **Template Integration:** KI-SESSION-BRIEFING compatible mit Database-Development-Workflows  
> **Critical Function:** Copy&Paste-Ready Migration-Documentation Template für konsistente Patterns

> **🎯 USE THIS TEMPLATE WHEN:**
> - ✅ Neue Database Migration hinzufügen (000-046 aktuell)
> - ✅ Schema-Änderungen dokumentieren (Version Tracking)
> - ✅ Migration-Testing durchführen (Pre/Post-State)
> - ✅ Rollback-Strategie planen
> - ✅ Lessons Learned dokumentieren

---

## 📋 TEMPLATE START - Copy & Paste Ready

```markdown
# [MIGRATION-TYPE]: [BRIEF TITLE]

> **Erstellt:** [DD.MM.YYYY] | **Letzte Aktualisierung:** [DD.MM.YYYY] ([GRUND])  
> **Status:** [STATUS] | **Typ:** MIGRATION - [Spezifisch]  
> **Schema Version:** [PRE] → [POST] | **Migration File:** [NUMBER]_[name].ts  
> **Related Migrations:** [vorherige/nachfolgende]

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** [STATUS] (automatisch durch "[MIGRATION-KEYWORDS]" erkannt)
> - **MIGRATION-PURPOSE:** [Spezifischer Zweck]
> - **AUTO-UPDATE:** Bei Schema-Änderung automatisch Documentation aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "[KEY1]", "[KEY2]", "[TYPE]"

## 🎯 MIGRATION PURPOSE

[Kurze Beschreibung der Migration und warum sie nötig ist]

### PRE-MIGRATION State:
```sql
-- Alter Schema (vor Migration)
CREATE TABLE [table_name] (
  [columns_old]
);
```

### POST-MIGRATION State:
```sql
-- Neuer Schema (nach Migration)
CREATE TABLE [table_name] (
  [columns_new]
);
```

---

## 🏗️ MIGRATION ARCHITECTURE

### 1. **Schema Analysis (Analyse-Phase)**
- [ ] Vorherige Migration prüfen ([NUMBER-1]_[name].ts)
- [ ] Aktuelle Schema-Version dokumentieren ([CURRENT-VERSION])
- [ ] Abhängigkeiten analysieren (verknüpfte Tabellen)
- [ ] Datenkonvertierungslogik planen

### 2. **Migration Design (Design-Phase)**
- [ ] SQL-Statements definieren (Tabellen, Indizes, Constraints)
- [ ] Datenkonvertierung implementieren (TypeScript)
- [ ] Error-Handling planen
- [ ] Rollback-Strategie vorbereiten

### 3. **Implementation (Implementierungs-Phase)**

**File:** `src/main/db/migrations/[NUMBER]_[name].ts`

```typescript
import { Database } from 'better-sqlite3';

export const migration = {
  up(db: Database): void {
    // 1. Schema Changes
    db.exec(`
      ALTER TABLE [table_name] ADD COLUMN [new_column] [type] [constraints];
    `);
    
    // 2. Data Migration (falls nötig)
    const rows = db.prepare('SELECT * FROM [table_name]').all();
    const updateStmt = db.prepare('UPDATE [table_name] SET [column] = ? WHERE id = ?');
    for (const row of rows) {
      // Konvertierungslogik
      updateStmt.run([newValue, row.id]);
    }
    
    // 3. Validation
    const result = db.prepare('PRAGMA table_info([table_name])').all();
    if (!result.find(col => col.name === '[new_column]')) {
      throw new Error('Migration failed: Column not added');
    }
  },

  down(db: Database): void {
    // Rollback
    db.exec(`
      ALTER TABLE [table_name] DROP COLUMN [new_column];
    `);
  },

  version: [VERSION_NUMBER]
};
```

### 4. **Testing (Test-Phase)**

```typescript
// Test: Schema Validation
const schema = db.pragma('table_info([table_name])');
expect(schema).toContainEqual(
  expect.objectContaining({ name: '[new_column]', type: '[type]' })
);

// Test: Data Integrity
const migratedRows = db.prepare('SELECT COUNT(*) as count FROM [table_name]').get() as any;
expect(migratedRows.count).toEqual(originalRowCount);

// Test: Rollback
migration.down(db);
const afterRollback = db.pragma('table_info([table_name])');
expect(afterRollback).not.toContainEqual(
  expect.objectContaining({ name: '[new_column]' })
);
```

### 5. **Deployment (Deployment-Phase)**

- [ ] Datenbank-Backup erstellen
- [ ] Migration testen auf Staging-DB
- [ ] Migration Index aktualisieren (`src/main/db/migrations/index.ts`)
- [ ] Version-Nummer erhöhen
- [ ] Rollout planen + dokumentieren

---

## 🛡️ CRITICAL PATTERNS (Read-Only - NEVER MODIFY)

### **Pattern 1: Field-Mapper für SQL Queries**
```typescript
// ✅ CORRECT: Verwende always field-mapper
import { convertSQLQuery } from '@/lib/field-mapper';
const query = convertSQLQuery('SELECT * FROM users WHERE user_id = ?', [userId]);

// ❌ FORBIDDEN: Nie direct SQL
const directQuery = "SELECT * FROM users WHERE user_id = '" + userId + "'";
```

### **Pattern 2: Schema Validation Before/After**
```typescript
// ✅ CORRECT: Validate schema
const beforeSchema = db.pragma('table_info(users)');
migration.up(db);
const afterSchema = db.pragma('table_info(users)');

// ❌ FORBIDDEN: Keine Migration ohne Validation
```

### **Pattern 3: Migration Rollback Strategy**
```typescript
// ✅ CORRECT: Always implement down()
migration.down(db);  // muss funktionieren

// ❌ FORBIDDEN: down() ohne Full Rollback
```

### **Pattern 4: Error Handling in Migrations**
```typescript
// ✅ CORRECT: Robust error handling
try {
  db.exec(`ALTER TABLE ...`);
} catch (error) {
  console.error('Migration failed:', error);
  throw new Error(`Migration [NUMBER] failed: ${error.message}`);
}

// ❌ FORBIDDEN: Silent failures
```

---

## 📊 MIGRATION CHECKLIST

### Pre-Migration Checks:
- [ ] Vorherige Migration(en) verstanden
- [ ] Schema-Abhängigkeiten analysiert
- [ ] Datenkonvertierungslogik geplant
- [ ] Rollback-Plan erstellt
- [ ] Tests geschrieben

### Migration Execution:
- [ ] Up-Migration implementiert
- [ ] Down-Migration (Rollback) implementiert
- [ ] Field-mapper für alle SQL queries verwendet
- [ ] Error-handling implementiert
- [ ] Validation logic hinzugefügt

### Post-Migration Validation:
- [ ] Up-Migration getestet ✅
- [ ] Down-Migration (Rollback) getestet ✅
- [ ] Schema korrekt (PRAGMA table_info)
- [ ] Daten erhalten (Row-Count validiert)
- [ ] Index aktualisiert

### Documentation:
- [ ] Zweck der Migration dokumentiert
- [ ] Before/After-Schema dokumentiert
- [ ] Konvertierungslogik erklärt
- [ ] Lessons Learned erfasst
- [ ] Related Migrations verlinkt

---

## 🚨 COMMON MIGRATION ISSUES & SOLUTIONS

### **Issue 1: Migration Fails - "Column already exists"**
```
Error: UNIQUE constraint failed
Reason: Column wurde in vorheriger Migration bereits hinzugefügt
Solution: Check Migration History - Migration doppelt?
```

### **Issue 2: Data Loss During Migration**
```
Error: Expected 1000 rows, got 500
Reason: Konvertierungslogik fehler oder unvollständig
Solution: 
1. Datenbank-Backup restore
2. Konvertierungslogik debuggen
3. Alle Rows migrieren
```

### **Issue 3: Rollback Fails**
```
Error: down() nicht implementiert oder fehlerhaft
Reason: Migration ohne Rollback-Support
Solution: down() vollständig implementieren
```

### **Issue 4: Schema Version Mismatch**
```
Error: Migration version X !== Database version Y
Reason: Index.ts nicht aktualisiert
Solution: 
1. Migration Index aktualisieren
2. Version-Nummer setzen
3. App neustarten
```

---

## 📚 RELATED DOCUMENTATION

### **Database Migration Architecture:**
- 📖 [VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-DATABASE-SCHEMA-CURRENT_2025-10-26.md)
- 📖 [VALIDATED_REFERENCE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-26.md)
- 📖 [VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md)

### **Field-Mapper System:**
- 📖 `src/lib/field-mapper.ts` - SQL injection prevention + camelCase ↔ snake_case

### **Live Migrations:**
- 📂 `src/main/db/migrations/` - All 046 active migrations

### **Previous Migration Examples:**
- 📖 Migration 037: Centralized Configuration Architecture
- 📖 Migration 046: Navigation Mode History System
- 📖 Migration 027: Theme System Foundation

---

## 🎯 NEXT STEPS

1. **Copy this template** → paste in relevant doc section
2. **Fill in placeholders** → [LIKE THIS]
3. **Implement migration** → TypeScript code
4. **Test thoroughly** → up() + down()
5. **Document lessons** → Was learned?
6. **Update index** → Add to Migration History

---

## 🎨 CUSTOMIZATION GUIDE

### **For Simple Schema Changes (Column Add/Remove):**
- Vereinfachte Migration verwenden
- Nur Schema-Manipulation nötig

### **For Complex Data Migrations:**
- Detailliertes Up-Migration Script
- Umfangreiches Testing erforderlich
- Rollback-Szenarien durchdenken

### **For Multi-Table Migrations:**
- Abhängigkeiten dokumentieren
- Transaction-Safety bedenken
- Foreign Key Constraints prüfen

---

**🎯 REMEMBER:** Jede Migration ist permanent - Test thoroughly before deployment!

*Template v1.0 - Complete Database Migration Documentation Pattern*
```

---

Erstelle jetzt Template 15 - SERVICE-LAYER-DEVELOPMENT-PATTERN:
