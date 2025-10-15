// Direct SQL Schema Inspection via IPC
// This will be executed in the Electron main process

export async function inspectDatabaseSchema() {
  console.log('🔍 Database Schema Inspection');
  
  // Check schema version
  const versionResult = await window.electronAPI.dbClient.query('PRAGMA user_version');
  console.log(`📊 Schema version: ${versionResult[0].user_version}`);
  
  // List all tables
  const tables = await window.electronAPI.dbClient.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('\n📋 Tables in database:');
  tables.forEach(table => console.log(`   - ${table.name}`));
  
  // Check package_line_items schema specifically
  console.log('\n🎯 package_line_items table schema:');
  const packageSchema = await window.electronAPI.dbClient.query("PRAGMA table_info(package_line_items)");
  packageSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check offer_line_items schema for comparison  
  console.log('\n🎯 offer_line_items table schema:');
  const offerSchema = await window.electronAPI.dbClient.query("PRAGMA table_info(offer_line_items)");
  offerSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check invoice_line_items schema for comparison
  console.log('\n🎯 invoice_line_items table schema:');
  const invoiceSchema = await window.electronAPI.dbClient.query("PRAGMA table_info(invoice_line_items)");
  invoiceSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check if there's any data in package_line_items
  const packageCount = await window.electronAPI.dbClient.query("SELECT COUNT(*) as count FROM package_line_items");
  console.log(`\n📊 Package line items count: ${packageCount[0].count}`);
  
  // Sample some data
  if (packageCount[0].count > 0) {
    console.log('\n📄 Sample package_line_items data:');
    const sampleData = await window.electronAPI.dbClient.query("SELECT id, title, quantity, unit_price, parent_item_id FROM package_line_items LIMIT 5");
    sampleData.forEach(row => {
      console.log(`   ID ${row.id}: ${row.title} - Qty: ${row.quantity}, Price: ${row.unit_price}, Parent: ${row.parent_item_id || 'none'}`);
    });
  }
  
  console.log('\n✅ Database inspection complete');
}

// Auto-run when script is loaded in Electron renderer
if (typeof window !== 'undefined' && window.electronAPI) {
  inspectDatabaseSchema().catch(console.error);
}