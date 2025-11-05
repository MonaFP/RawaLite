// Test Field-Mapper für Package unitPrice
import { mapFromSQL, mapToSQL, convertSQLQuery } from './src/lib/field-mapper.js';

console.log('🔍 FIELD-MAPPER TEST für Package unitPrice');
console.log('==========================================\n');

// 1. Test convertSQLQuery für packageLineItems
console.log('1. convertSQLQuery Test:');
const originalQuery = `SELECT id, title, quantity, unitPrice, parentItemId, description, priceDisplayMode FROM packageLineItems WHERE packageId = ? ORDER BY id`;
const convertedQuery = convertSQLQuery(originalQuery);
console.log(`Original:  ${originalQuery}`);
console.log(`Converted: ${convertedQuery}`);
console.log();

// 2. Test mapFromSQL mit simulierten DB Daten
console.log('2. mapFromSQL Test (DB -> JS):');
const dbRow = {
  id: 1,
  title: 'Test Item',
  quantity: 2,
  unit_price: 75,  // DB Format (snake_case)
  parent_item_id: null,
  description: 'Test Description',
  price_display_mode: 'default'
};
const jsObject = mapFromSQL(dbRow);
console.log(`DB Row:    ${JSON.stringify(dbRow, null, 2)}`);
console.log(`JS Object: ${JSON.stringify(jsObject, null, 2)}`);
console.log();

// 3. Test mapToSQL mit JS Objekt
console.log('3. mapToSQL Test (JS -> DB):');
const jsRow = {
  id: 1,
  title: 'Test Item',
  quantity: 2,
  unitPrice: 75,  // JS Format (camelCase)
  parentItemId: null,
  description: 'Test Description',
  priceDisplayMode: 'default'
};
const dbObject = mapToSQL(jsRow);
console.log(`JS Row:    ${JSON.stringify(jsRow, null, 2)}`);
console.log(`DB Object: ${JSON.stringify(dbObject, null, 2)}`);
console.log();

// 4. Prüfe ob Mapping korrekt ist
console.log('4. Mapping Validierung:');
console.log(`✅ unitPrice -> unit_price: ${jsObject.unitPrice === dbRow.unit_price ? 'KORREKT' : 'FEHLER'}`);
console.log(`✅ unit_price -> unitPrice: ${dbObject.unit_price === jsRow.unitPrice ? 'KORREKT' : 'FEHLER'}`);

// 5. Test mit SQLiteAdapter Verhalten
console.log('\n5. SQLiteAdapter Pattern Test:');
const mockDbResult = { id: 1, title: 'Test', quantity: 1, unit_price: 270 };
const mappedResult = mapFromSQL(mockDbResult);
const finalObject = {
  id: mappedResult.id,
  title: mappedResult.title,
  quantity: mappedResult.quantity,
  unitPrice: mappedResult.unitPrice ?? 0,  // SQLiteAdapter Pattern
};
console.log(`Mock DB Result: ${JSON.stringify(mockDbResult)}`);
console.log(`Final Object:   ${JSON.stringify(finalObject)}`);
console.log(`unitPrice Value: ${finalObject.unitPrice} (Type: ${typeof finalObject.unitPrice})`);