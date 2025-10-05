// Status-Dropdown Debug Tool
// Testet systematisch alle kritischen Punkte der Datenladung
// Ausführung in Electron Browser Console

console.log('🔧 STATUS-DROPDOWN DEBUG TOOL');
console.log('===============================');

// Phase 1: PersistenceContext Status prüfen
console.log('\n📋 PHASE 1: PERSISTENCE CONTEXT');
console.log('==================================');

// Check if window.rawalite is available
if (typeof window !== 'undefined' && window.rawalite) {
  console.log('✅ window.rawalite API available');
  
  if (window.rawalite.db) {
    console.log('✅ window.rawalite.db API available');
    console.log('Available methods:', Object.keys(window.rawalite.db));
  } else {
    console.log('❌ window.rawalite.db NOT available');
  }
} else {
  console.log('❌ window.rawalite NOT available - check preload script');
}

// Phase 2: Direct IPC Test
console.log('\n📡 PHASE 2: DIRECT IPC TEST');
console.log('============================');

async function testDirectIPC() {
  try {
    // Test basic offers query
    console.log('Testing direct offers query...');
    const offersResult = await window.rawalite.db.query('SELECT * FROM offers ORDER BY created_at DESC');
    console.log('✅ Direct offers query successful:', offersResult);
    console.log('Offers count:', offersResult.length);
    
    if (offersResult.length > 0) {
      console.log('Sample offer:', offersResult[0]);
    }
    
    // Test basic invoices query
    console.log('\nTesting direct invoices query...');
    const invoicesResult = await window.rawalite.db.query('SELECT * FROM invoices ORDER BY created_at DESC');
    console.log('✅ Direct invoices query successful:', invoicesResult);
    console.log('Invoices count:', invoicesResult.length);
    
    if (invoicesResult.length > 0) {
      console.log('Sample invoice:', invoicesResult[0]);
    }
    
    return { offers: offersResult, invoices: invoicesResult };
    
  } catch (error) {
    console.error('❌ Direct IPC test failed:', error);
    return null;
  }
}

// Phase 3: React Context Access
console.log('\n⚛️ PHASE 3: REACT CONTEXT ACCESS');
console.log('==================================');

function testReactContext() {
  // Try to access React DevTools or context directly
  if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools available');
    
    // Try to find persistence context
    const reactFiber = document.querySelector('[data-reactroot]');
    if (reactFiber && reactFiber._reactInternalFiber) {
      console.log('✅ React root found');
    } else {
      console.log('ℹ️ React root not accessible via _reactInternalFiber');
    }
  } else {
    console.log('⚠️ React DevTools not available');
  }
}

// Phase 4: Component State Access (if possible)
console.log('\n🎯 PHASE 4: COMPONENT DEBUGGING');
console.log('=================================');

function findOfferComponents() {
  // Look for offer/invoice components in DOM
  const offerElements = document.querySelectorAll('[data-testid*="offer"], [class*="offer"], [id*="offer"]');
  const invoiceElements = document.querySelectorAll('[data-testid*="invoice"], [class*="invoice"], [id*="invoice"]');
  
  console.log('Offer-related DOM elements found:', offerElements.length);
  console.log('Invoice-related DOM elements found:', invoiceElements.length);
  
  // Look for status dropdowns
  const statusDropdowns = document.querySelectorAll('select[value*="draft"], select option[value="draft"]');
  console.log('Status dropdown elements found:', statusDropdowns.length);
  
  return { offerElements, invoiceElements, statusDropdowns };
}

// Execute all tests
async function runFullDebug() {
  console.log('\n🚀 RUNNING FULL DEBUG SEQUENCE');
  console.log('================================');
  
  // Test React Context
  testReactContext();
  
  // Test Component Access
  const components = findOfferComponents();
  
  // Test Direct IPC
  const ipcResults = await testDirectIPC();
  
  // Summary
  console.log('\n📊 DEBUG SUMMARY');
  console.log('=================');
  console.log('IPC Available:', !!window.rawalite?.db);
  console.log('Direct Offers Query:', ipcResults ? `✅ ${ipcResults.offers.length} offers` : '❌ Failed');
  console.log('Direct Invoices Query:', ipcResults ? `✅ ${ipcResults.invoices.length} invoices` : '❌ Failed');
  console.log('Status Dropdowns in DOM:', components.statusDropdowns.length);
  
  return {
    ipc: ipcResults,
    components,
    summary: {
      ipcAvailable: !!window.rawalite?.db,
      offersCount: ipcResults?.offers?.length || 0,
      invoicesCount: ipcResults?.invoices?.length || 0,
      dropdownsFound: components.statusDropdowns.length
    }
  };
}

// Auto-run if in browser context
if (typeof window !== 'undefined') {
  console.log('\n⏱️ Auto-running debug in 2 seconds...');
  setTimeout(runFullDebug, 2000);
}

// Export for manual execution
window.debugStatusDropdown = runFullDebug;