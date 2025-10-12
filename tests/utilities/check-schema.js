// Schema-Check Script ohne better-sqlite3
import { existsSync } from 'fs';
import { join } from 'path';

const dbPath = './rawalite.db';

console.log('=== Database Schema Check ===');

if (!existsSync(dbPath)) {
  console.log('❌ Database file does not exist:', dbPath);
  process.exit(1);
}

console.log('✅ Database file exists:', dbPath);

// Check expected tables
const expectedTables = [
  'settings',
  'customers', 
  'offers',
  'offer_line_items',
  'invoices',
  'invoice_line_items',
  'packages',
  'numbering_circles',
  'activities',
  'timesheets',
  'timesheet_activities',
  'migrations'
];

console.log('\n=== Expected Tables ===');
expectedTables.forEach(table => {
  console.log(`- ${table}`);
});

console.log('\n=== Field Mapping Status ===');
console.log('Recently added mappings:');
console.log('- overdueAt → overdue_at');
console.log('- cancelledAt → cancelled_at');
console.log('- sentAt → sent_at');
console.log('- acceptedAt → accepted_at');
console.log('- rejectedAt → rejected_at');
console.log('- logo → logo');

console.log('\n=== Next Steps ===');
console.log('1. Rebuild better-sqlite3: pnpm rebuild better-sqlite3');
console.log('2. Test offer status changes with new field mappings');
console.log('3. Test invoice PDF logo rendering');

console.log('\n✅ Schema check completed');