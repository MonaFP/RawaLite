// Simplified Field-Mapper Test ohne Import
// Da TypeScript Module im Node Context nicht einfach importierbar

console.log('🔍 FIELD-MAPPER LOGIC TEST (vereinfacht)');
console.log('=========================================\n');

// Basis Field-Mapping Logic nachbauen
const FIELD_MAPPING = {
  'unitPrice': 'unit_price',
  'parentItemId': 'parent_item_id',
  'priceDisplayMode': 'price_display_mode',
  'packageId': 'package_id'
};

function convertCamelToSnake(key) {
  const mapping = FIELD_MAPPING[key];
  if (mapping) return mapping;
  
  // Fallback: camelCase -> snake_case
  return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertSnakeToCamel(key) {
  // Reverse mapping suchen
  const reverseMapping = Object.entries(FIELD_MAPPING).find(([camel, snake]) => snake === key);
  if (reverseMapping) return reverseMapping[0];
  
  // Fallback: snake_case -> camelCase
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function simpleMapFromSQL(dbRow) {
  const result = {};
  for (const [key, value] of Object.entries(dbRow)) {
    const camelKey = convertSnakeToCamel(key);
    result[camelKey] = value;
  }
  return result;
}

function simpleMapToSQL(jsRow) {
  const result = {};
  for (const [key, value] of Object.entries(jsRow)) {
    const snakeKey = convertCamelToSnake(key);
    result[snakeKey] = value;
  }
  return result;
}

// Test mit Package Line Item
console.log('1. TEST: DB -> JS Conversion');
const dbRow = {
  id: 1,
  title: 'Test Item',
  quantity: 2,
  unit_price: 270,  // Das ist der Wert der "270,00 €0" verursachen könnte
  parent_item_id: null,
  price_display_mode: 'default'
};

const jsObject = simpleMapFromSQL(dbRow);
console.log('DB Row:');
console.log(JSON.stringify(dbRow, null, 2));
console.log('\nJS Object:');
console.log(JSON.stringify(jsObject, null, 2));
console.log(`\nunitPrice Value: ${jsObject.unitPrice} (Type: ${typeof jsObject.unitPrice})`);

// Test wie SQLiteAdapter es verarbeiten würde
console.log('\n2. TEST: SQLiteAdapter Pattern');
const sqliteResult = {
  id: jsObject.id,
  title: jsObject.title,
  quantity: jsObject.quantity,
  unitPrice: jsObject.unitPrice ?? 0,  // Wie in SQLiteAdapter
  parentItemId: jsObject.parentItemId || undefined,
  priceDisplayMode: jsObject.priceDisplayMode || undefined
};
console.log('SQLite Adapter Result:');
console.log(JSON.stringify(sqliteResult, null, 2));

// Test Currency Formatting
console.log('\n3. TEST: Currency Formatting');
function formatCurrency(amount, showCurrency = true) {
  const n = Number(amount);
  const safeAmount = Number.isFinite(n) ? n : 0;
  
  const options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...(showCurrency
      ? { style: 'currency', currency: 'EUR' }
      : { style: 'decimal' }),
  };
  
  const formatter = new Intl.NumberFormat('de-DE', options);
  return formatter.format(safeAmount);
}

const formatted = formatCurrency(sqliteResult.unitPrice);
console.log(`formatCurrency(${sqliteResult.unitPrice}) = "${formatted}"`);
console.log(`Length: ${formatted.length}`);
console.log(`Chars: [${[...formatted].map(c => `"${c}"`).join(', ')}]`);

// Prüfe mögliche Duplikation
console.log('\n4. TEST: Mögliche Duplikation');
const possibleDuplicate = jsObject.unitPrice + '0';
console.log(`Possible duplicate issue: "${jsObject.unitPrice}" + "0" = "${possibleDuplicate}"`);
console.log(`formatCurrency(possibleDuplicate): "${formatCurrency(possibleDuplicate)}"`);

console.log('\n✅ Test abgeschlossen');