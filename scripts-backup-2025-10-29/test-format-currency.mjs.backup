// Test formatCurrency mit echten DB Werten
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

// Test mit echten DB Werten
const dbValues = [75, 120, 200, 2000, 30];
console.log('🧪 formatCurrency Test mit echten DB Werten:');
dbValues.forEach(val => {
  const formatted = formatCurrency(val);
  console.log(`  ${val} -> "${formatted}" (Length: ${formatted.length})`);
});

// Test mit problematischen Werten  
const problemValues = [270, 0, null, undefined, '270', '270.00'];
console.log('\n🔍 Test mit möglicherweise problematischen Werten:');
problemValues.forEach(val => {
  const formatted = formatCurrency(val);
  console.log(`  ${val} (${typeof val}) -> "${formatted}" (Length: ${formatted.length})`);
});

// Überprüfe Byte-Analyse  
console.log('\n🔬 Byte-Analyse für 270€:');
const result270 = formatCurrency(270);
console.log(`  Ergebnis: "${result270}"`);
console.log(`  Länge: ${result270.length}`);
console.log(`  Char Codes: [${[...result270].map(c => c.charCodeAt(0)).join(', ')}]`);
console.log(`  Characters: [${[...result270].map(c => `"${c}"`).join(', ')}]`);