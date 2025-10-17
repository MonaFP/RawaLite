// Direct IPC Test for Status Dropdown Problem
// Tests if the core IPC communication works
// Can be executed in parallel to running Electron app

const path = require('path');
const { spawn } = require('child_process');

console.log('🔧 DIRECT IPC TEST FOR STATUS DROPDOWN');
console.log('=======================================');

// Test script that will be injected into running Electron app
const testScript = `
console.log('🔧 IPC TEST: Starting direct database tests...');

async function testDirectIPC() {
  const results = {
    timestamp: new Date().toISOString(),
    windowAPI: !!window.rawalite,
    dbAPI: !!window.rawalite?.db,
    tests: {}
  };
  
  console.log('🔧 IPC TEST: window.rawalite available:', results.windowAPI);
  console.log('🔧 IPC TEST: window.rawalite.db available:', results.dbAPI);
  
  if (!results.dbAPI) {
    console.error('🔧 IPC TEST: Database API not available!');
    return results;
  }
  
  try {
    // Test 1: Basic connectivity
    console.log('🔧 IPC TEST: Testing basic connectivity...');
    const connectTest = await window.rawalite.db.query('SELECT 1 as test');
    results.tests.connectivity = { success: true, result: connectTest };
    console.log('🔧 IPC TEST: Connectivity test passed:', connectTest);
    
    // Test 2: Table existence
    console.log('🔧 IPC TEST: Testing table existence...');
    const tablesTest = await window.rawalite.db.query("SELECT name FROM sqlite_master WHERE type='table'");
    results.tests.tables = { success: true, result: tablesTest };
    console.log('🔧 IPC TEST: Tables found:', tablesTest.map(t => t.name));
    
    // Test 3: Offers data
    console.log('🔧 IPC TEST: Testing offers data...');
    const offersTest = await window.rawalite.db.query('SELECT * FROM offers');
    results.tests.offers = { success: true, count: offersTest.length, sample: offersTest[0] };
    console.log('🔧 IPC TEST: Offers data:', { count: offersTest.length, sample: offersTest[0] });
    
    // Test 4: Invoices data
    console.log('🔧 IPC TEST: Testing invoices data...');
    const invoicesTest = await window.rawalite.db.query('SELECT * FROM invoices');
    results.tests.invoices = { success: true, count: invoicesTest.length, sample: invoicesTest[0] };
    console.log('🔧 IPC TEST: Invoices data:', { count: invoicesTest.length, sample: invoicesTest[0] });
    
    // Test 5: Field mapping test
    console.log('🔧 IPC TEST: Testing camelCase vs snake_case...');
    if (offersTest.length > 0) {
      const firstOffer = offersTest[0];
      const hasSnakeCase = Object.keys(firstOffer).some(key => key.includes('_'));
      const hasCamelCase = Object.keys(firstOffer).some(key => /[a-z][A-Z]/.test(key));
      results.tests.fieldMapping = { 
        success: true, 
        hasSnakeCase, 
        hasCamelCase, 
        keys: Object.keys(firstOffer)
      };
      console.log('🔧 IPC TEST: Field mapping:', { hasSnakeCase, hasCamelCase, keys: Object.keys(firstOffer) });
    }
    
  } catch (error) {
    console.error('🔧 IPC TEST: Test failed:', error);
    results.tests.error = { success: false, error: error.message };
  }
  
  console.log('🔧 IPC TEST: Complete results:', results);
  return results;
}

// Execute test
testDirectIPC();
`;

console.log('📝 Test script prepared. To run this test:');
console.log('1. Open Electron app DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Paste and execute the following script:');
console.log('\n' + '='.repeat(50));
console.log(testScript);
console.log('='.repeat(50));

// Also save to file for easy copying
require('fs').writeFileSync(
  path.join(__dirname, 'ipc-test-script.js'), 
  testScript
);

console.log('\n✅ Test script also saved to: ipc-test-script.js');
console.log('💡 You can copy-paste this script into Electron DevTools Console');