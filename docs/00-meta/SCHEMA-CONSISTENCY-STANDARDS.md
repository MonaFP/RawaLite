# Schema Consistency Standards

**Gültig ab:** 2. Oktober 2025  
**Context:** RawaLite v1.0.0 Schema-Konsistenz-Standards nach umfassender Reparatur

## 🎯 Grundprinzipien

### 1. Field-Mapper als Single Source of Truth
Das `src/lib/field-mapper.ts` System ist die **zentrale Wahrheit** für alle Schema-Mappings zwischen Frontend (camelCase) und Database (snake_case).

**Mandatory Rule:** 
```typescript
// ✅ CORRECT: Always use convertSQLQuery
const query = convertSQLQuery(`SELECT * FROM customers WHERE customerId = ?`)

// ❌ WRONG: Never hardcode snake_case  
const query = `SELECT * FROM customers WHERE customer_id = ?`
```

### 2. Systematic Query Conversion Pattern
**Alle Database-Queries MÜSSEN das convertSQLQuery() Pattern verwenden.**

```typescript
// ✅ Before any database operation
import { convertSQLQuery } from '../lib/field-mapper';

// ✅ Apply to all SQL strings
const result = await client.query(convertSQLQuery(`
  SELECT customerId, customerName FROM customers 
  WHERE packageId = ? AND invoiceId IS NOT NULL
`), [packageId]);
```

### 3. No Direct snake_case in Queries
**Hardcoded snake_case ist in allen Queries verboten.**

**Ausnahmen:** Nur direkte Database-Operationen im Main Process (electron/main.ts)

## 🔧 Implementation Standards

### Field-Mapper Extension Process
**Wenn neue Fields hinzugefügt werden:**

1. **Zuerst Field-Mapper erweitern:**
```typescript
// src/lib/field-mapper.ts
const JS_TO_SQL_MAPPINGS = {
  // Existing mappings...
  'newCamelCaseField': 'new_snake_case_field',
  'anotherField': 'another_field'
}
```

2. **Dann alle betroffenen Queries konvertieren:**
```typescript
// Alle Adapter, Services, und andere DB-Zugriffe
const query = convertSQLQuery(`SELECT newCamelCaseField FROM table WHERE anotherField = ?`)
```

3. **Niemals umgekehrt:** Queries zuerst ändern und dann Field-Mapper anpassen

### Service Layer Standards
**Alle Services müssen convertSQLQuery() verwenden:**

```typescript
export class SomeService {
  static async getSomething(id: string) {
    // ✅ CORRECT
    const query = convertSQLQuery(`
      SELECT customerId, packageId, invoiceId 
      FROM someTable 
      WHERE itemId = ?
    `);
    return client.query(query, [id]);
  }
}
```

### Adapter Layer Standards
**SQLiteAdapter und alle anderen Adapter:**

```typescript
async listItems(): Promise<Item[]> {
  // ✅ CORRECT: convertSQLQuery pattern
  const query = convertSQLQuery(`
    SELECT itemId, parentItemId, unitPrice, vatRate, vatAmount
    FROM items
    ORDER BY createdAt DESC
  `);
  
  const sqlRows = await this.client.query(query);
  return mapFromSQLArray(sqlRows);
}
```

## 🧪 Testing Standards

### Schema Consistency Tests
**Alle neuen Schema-Fields müssen getestet werden:**

```typescript
describe('Field Mapping', () => {
  it('should convert new fields correctly', () => {
    const input = `SELECT newCamelCaseField FROM table WHERE anotherField = ?`;
    const expected = `SELECT new_snake_case_field FROM table WHERE another_field = ?`;
    const result = convertSQLQuery(input);
    expect(result).toBe(expected);
  });
});
```

### Integration Testing
**Database-Level Tests für alle kritischen Queries:**

```typescript
describe('Customer Creation', () => {
  it('should create customer with all schema fields', async () => {
    const customerData = {
      customerId: 'test-123',
      packageId: 'pkg-456', 
      invoiceId: 'inv-789'
    };
    
    // Should not throw schema errors
    const result = await adapter.createCustomer(customerData);
    expect(result.success).toBe(true);
  });
});
```

## 🚨 Error Prevention Rules

### Pre-Commit Checks
**Mandatory Checks vor jedem Commit:**

1. **No hardcoded snake_case in queries:**
```bash
# Should return empty
grep -r "_.*=" src/ --include="*.ts" | grep -E "(SELECT|INSERT|UPDATE|DELETE)"
```

2. **All Field-Mapper entries have tests:**
```bash
# Verify test coverage for all mappings
npm test -- --grep "Field Mapping"
```

3. **TypeScript compilation clean:**
```bash
npm run type-check
```

### Architecture Validation
**Main Process vs Renderer Process:**

- **Main Process:** Direct DB access erlaubt, kann hardcoded snake_case verwenden
- **Renderer Process:** MUSS convertSQLQuery() verwenden, niemals direkte snake_case

```typescript
// electron/main.ts - ✅ ALLOWED
const query = `SELECT customer_id FROM customers WHERE id = ?`;

// src/**/*.ts - ❌ FORBIDDEN  
const query = `SELECT customer_id FROM customers WHERE id = ?`;

// src/**/*.ts - ✅ REQUIRED
const query = convertSQLQuery(`SELECT customerId FROM customers WHERE id = ?`);
```

## 📊 Validation Standards

### Build-Time Validation
**CI/CD Pipeline muss prüfen:**

1. **Schema Consistency:**
```bash
pnpm run validate:schema-consistency
```

2. **Field-Mapper Completeness:**
```bash
pnpm run validate:field-mappings
```

3. **Integration Tests:**
```bash
pnpm test -- --grep "Schema|Database|Field"
```

### Runtime Validation
**Produktion muss überwachen:**

1. **Database Query Errors:** Monitoring auf Schema-Mismatch Errors
2. **Field Mapping Failures:** Logging von unmappable fields
3. **Customer Creation Success Rate:** Alert bei Fehlern > 1%

## 🔮 Future Standards

### New Feature Development
**Bei neuen Features mit Database-Feldern:**

1. **Design Phase:** Schema-Design mit camelCase Frontend-Names
2. **Implementation Phase:** 
   - Field-Mapper first
   - convertSQLQuery() for all queries
   - Tests for all new mappings
3. **Review Phase:** Schema Consistency Review mandatory

### Migration Standards
**Database Migrations müssen:**

1. **Default Data:** Alle required defaults erstellen
2. **Schema Validation:** Verify field mappings work
3. **Rollback Safety:** Down-Migration muss funktionieren
4. **Test Coverage:** Migration tests mandatory

### Documentation Standards
**Alle Schema-Änderungen müssen dokumentiert werden in:**

- `docs/50-persistence/SCHEMA-CHANGES.md`
- Field-Mapper Kommentare aktualisieren
- API Documentation Updates

## 🎯 Success Metrics

### Schema Consistency Health
**Monitoring Metrics:**

- **Field Mapping Coverage:** 100% aller Database-Fields gemappt
- **Query Conversion Rate:** 100% aller Queries verwenden convertSQLQuery()
- **Schema Error Rate:** 0% Database-Schema-Mismatches
- **Customer Creation Success:** 100% ohne Schema-Fehler

### Performance Standards
**Acceptable Overhead:**

- **convertSQLQuery() Latency:** < 1ms per query
- **Field Mapping Time:** < 0.1ms per field
- **Total Schema Overhead:** < 5% of total query time

## 📝 Standard Code Snippets

### New Service Template
```typescript
import { convertSQLQuery, mapFromSQLArray } from '../lib/field-mapper';
import DbClient from './DbClient';

export class NewService {
  private static client = DbClient.getInstance();
  
  static async getItems(): Promise<Item[]> {
    const query = convertSQLQuery(`
      SELECT itemId, parentItemId, unitPrice, vatRate, vatAmount
      FROM items
      ORDER BY createdAt DESC
    `);
    
    const sqlRows = await this.client.query(query);
    return mapFromSQLArray(sqlRows);
  }
  
  static async updateItem(id: string, updates: Partial<Item>): Promise<void> {
    const query = convertSQLQuery(`
      UPDATE items 
      SET itemName = ?, unitPrice = ?, updatedAt = datetime('now')
      WHERE itemId = ?
    `);
    
    await this.client.exec(query, [updates.itemName, updates.unitPrice, id]);
  }
}
```

### Field-Mapper Extension Template
```typescript
// Add to JS_TO_SQL_MAPPINGS in src/lib/field-mapper.ts
export const JS_TO_SQL_MAPPINGS: Record<string, string> = {
  // ... existing mappings
  
  // 🆕 New feature mappings - always comment the feature
  'newFeatureId': 'new_feature_id',           // New Feature: Unique identifier
  'newFeaturePrice': 'new_feature_price',     // New Feature: Pricing field
  'newFeatureStatus': 'new_feature_status'    // New Feature: Status tracking
};
```

## ⚠️ Critical Reminders

1. **Field-Mapper First:** Niemals Database-Queries ohne Field-Mapper-Update
2. **convertSQLQuery() Always:** Ausnahme nur Main Process direct DB access
3. **Test All Mappings:** Jede neue Mapping braucht Tests
4. **Document Everything:** Schema-Änderungen müssen dokumentiert werden
5. **Monitor Production:** Schema-Errors in Production sind critical incidents