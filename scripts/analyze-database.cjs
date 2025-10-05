// Database Structure and Data Analysis Tool
// Uses better-sqlite3 directly to analyze RawaLite database
// Run with: node scripts/analyze-database.cjs

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔍 RawaLite Database Analysis Tool');
console.log('==================================\n');

// Get database path from Electron userData
const os = require('os');
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database', 'rawalite.db');

console.log(`📁 Database Path: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found. Make sure the Electron app has been started.');
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

try {
  console.log('✅ Database opened successfully\n');

  // 1. Database Info
  console.log('📊 DATABASE INFORMATION');
  console.log('========================');
  const dbStat = fs.statSync(dbPath);
  console.log(`Size: ${(dbStat.size / 1024).toFixed(2)} KB`);
  console.log(`Last Modified: ${dbStat.mtime.toISOString()}`);
  console.log();

  // 2. Tables Overview
  console.log('📋 TABLES OVERVIEW');
  console.log('===================');
  const tables = db.prepare(`
    SELECT name, sql 
    FROM sqlite_master 
    WHERE type = 'table' 
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log(`Found ${tables.length} tables:`);
  tables.forEach(table => {
    const rowCount = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get();
    console.log(`  - ${table.name}: ${rowCount.count} rows`);
  });
  console.log();

  // 3. Offers Table Analysis
  console.log('🎯 OFFERS TABLE ANALYSIS');
  console.log('=========================');
  
  try {
    // Schema
    const offerSchema = db.prepare(`PRAGMA table_info(offers)`).all();
    console.log('Schema:');
    offerSchema.forEach(col => {
      const pk = col.pk ? ' (PRIMARY KEY)' : '';
      const notNull = col.notnull ? ' NOT NULL' : '';
      const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
      console.log(`  ${col.name}: ${col.type}${pk}${notNull}${defaultVal}`);
    });
    
    // Row count and status distribution
    const offerCount = db.prepare(`SELECT COUNT(*) as count FROM offers`).get();
    console.log(`\nTotal offers: ${offerCount.count}`);
    
    if (offerCount.count > 0) {
      const statusDist = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM offers 
        GROUP BY status 
        ORDER BY count DESC
      `).all();
      
      console.log('Status distribution:');
      statusDist.forEach(row => {
        console.log(`  ${row.status || 'NULL'}: ${row.count}`);
      });
      
      // Sample data
      console.log('\nSample offers (first 3):');
      const sampleOffers = db.prepare(`
        SELECT id, offer_number, customer_id, status, total_amount, created_at 
        FROM offers 
        ORDER BY created_at DESC 
        LIMIT 3
      `).all();
      
      sampleOffers.forEach(offer => {
        console.log(`  ID ${offer.id}: ${offer.offer_number} | Status: ${offer.status} | Amount: ${offer.total_amount} | Customer: ${offer.customer_id}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error analyzing offers: ${error.message}`);
  }
  console.log();

  // 4. Invoices Table Analysis  
  console.log('💰 INVOICES TABLE ANALYSIS');
  console.log('===========================');
  
  try {
    // Schema
    const invoiceSchema = db.prepare(`PRAGMA table_info(invoices)`).all();
    console.log('Schema:');
    invoiceSchema.forEach(col => {
      const pk = col.pk ? ' (PRIMARY KEY)' : '';
      const notNull = col.notnull ? ' NOT NULL' : '';
      const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
      console.log(`  ${col.name}: ${col.type}${pk}${notNull}${defaultVal}`);
    });
    
    // Row count and status distribution
    const invoiceCount = db.prepare(`SELECT COUNT(*) as count FROM invoices`).get();
    console.log(`\nTotal invoices: ${invoiceCount.count}`);
    
    if (invoiceCount.count > 0) {
      const statusDist = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM invoices 
        GROUP BY status 
        ORDER BY count DESC
      `).all();
      
      console.log('Status distribution:');
      statusDist.forEach(row => {
        console.log(`  ${row.status || 'NULL'}: ${row.count}`);
      });
      
      // Sample data
      console.log('\nSample invoices (first 3):');
      const sampleInvoices = db.prepare(`
        SELECT id, invoice_number, customer_id, status, total_amount, created_at 
        FROM invoices 
        ORDER BY created_at DESC 
        LIMIT 3
      `).all();
      
      sampleInvoices.forEach(invoice => {
        console.log(`  ID ${invoice.id}: ${invoice.invoice_number} | Status: ${invoice.status} | Amount: ${invoice.total_amount} | Customer: ${invoice.customer_id}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error analyzing invoices: ${error.message}`);
  }
  console.log();

  // 5. Status Field Comparison
  console.log('🔄 STATUS FIELDS COMPARISON');
  console.log('============================');
  
  try {
    // Check if both tables have the same status columns
    const offerCols = db.prepare(`PRAGMA table_info(offers)`).all().map(c => c.name);
    const invoiceCols = db.prepare(`PRAGMA table_info(invoices)`).all().map(c => c.name);
    
    const statusColumns = ['status', 'sent_at', 'paid_at', 'overdue_at', 'cancelled_at'];
    
    console.log('Status-related columns:');
    statusColumns.forEach(col => {
      const inOffers = offerCols.includes(col);
      const inInvoices = invoiceCols.includes(col);
      const status = (inOffers && inInvoices) ? '✅' : 
                    (inOffers || inInvoices) ? '⚠️' : '❌';
      console.log(`  ${col}: Offers ${inOffers ? '✅' : '❌'} | Invoices ${inInvoices ? '✅' : '❌'} ${status}`);
    });
  } catch (error) {
    console.log(`❌ Error comparing status fields: ${error.message}`);
  }
  console.log();

  // 6. Customers Table (for context)
  console.log('👥 CUSTOMERS TABLE CONTEXT');
  console.log('===========================');
  
  try {
    const customerCount = db.prepare(`SELECT COUNT(*) as count FROM customers`).get();
    console.log(`Total customers: ${customerCount.count}`);
    
    if (customerCount.count > 0) {
      const sampleCustomers = db.prepare(`
        SELECT id, name, company 
        FROM customers 
        ORDER BY created_at DESC 
        LIMIT 3
      `).all();
      
      console.log('Sample customers:');
      sampleCustomers.forEach(customer => {
        console.log(`  ID ${customer.id}: ${customer.name} (${customer.company || 'No company'})`);
      });
    }
  } catch (error) {
    console.log(`❌ Error analyzing customers: ${error.message}`);
  }
  console.log();

  // 7. Settings Table (for logo context)
  console.log('⚙️ SETTINGS TABLE CONTEXT');
  console.log('==========================');
  
  try {
    const settingsCount = db.prepare(`SELECT COUNT(*) as count FROM settings`).get();
    console.log(`Settings rows: ${settingsCount.count}`);
    
    if (settingsCount.count > 0) {
      const logoSetting = db.prepare(`
        SELECT id, 
               CASE WHEN logo IS NULL THEN 'NULL' 
                    WHEN LENGTH(logo) = 0 THEN 'EMPTY' 
                    WHEN logo LIKE 'data:image/%' THEN CONCAT('DATA_URL (', LENGTH(logo), ' chars)')
                    ELSE CONCAT('OTHER (', LENGTH(logo), ' chars)')
               END as logo_status
        FROM settings 
        WHERE id = 1
      `).get();
      
      if (logoSetting) {
        console.log(`Logo setting (ID 1): ${logoSetting.logo_status}`);
      } else {
        console.log('No settings found with ID 1');
      }
    }
  } catch (error) {
    console.log(`❌ Error analyzing settings: ${error.message}`);
  }

  console.log('\n🎯 ANALYSIS COMPLETE');
  console.log('====================');
  console.log('Database structure and data analyzed successfully.');
  console.log('Ready for status dropdown debugging.');

} catch (error) {
  console.error('❌ Database analysis failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}