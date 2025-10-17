#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseDbPath() {
  let dbPath = process.env.RAWALITE_DB_PATH || resolve(process.cwd(), 'db', 'app.db');
  const idx = process.argv.findIndex(arg => arg === '--db' || arg.startsWith('--db='));
  if (idx >= 0) {
    const arg = process.argv[idx];
    if (arg.includes('=')) {
      dbPath = resolve(process.cwd(), arg.split('=')[1]);
    } else if (process.argv[idx + 1]) {
      dbPath = resolve(process.cwd(), process.argv[idx + 1]);
    }
  }
  return dbPath;
}

const dbPath = parseDbPath();

console.log('🔍 Line Item Hierarchy Validation');
console.log('================================');
console.log(`📂 Database: ${dbPath}`);

if (!existsSync(dbPath)) {
  console.error('❌ Database file not found. Set RAWALITE_DB_PATH or pass --db <path>.');
  process.exit(1);
}

const wasmPath = join(__dirname, '..', 'node_modules', 'sql.js', 'dist');
const SQL = await initSqlJs({ locateFile: file => join(wasmPath, file) });

const fileBuffer = readFileSync(dbPath);
const db = new SQL.Database(fileBuffer);

function queryAll(sql) {
  const result = db.exec(sql);
  if (!result[0]) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(row.map((value, idx) => [columns[idx], value])));
}

function tableExists(table) {
  const res = queryAll(`PRAGMA table_info(${table});`);
  return res.length > 0;
}

let exitCode = 0;

function checkMissingParents(table, documentColumn) {
  if (!tableExists(table)) {
    console.log(`ℹ️ ${table}: table not found (skipping checks)`);
    return;
  }
  const rows = queryAll(`
    SELECT child.id, child.${documentColumn} AS document_id, child.parent_item_id
    FROM ${table} child
    LEFT JOIN ${table} parent
      ON parent.id = child.parent_item_id
     AND parent.${documentColumn} = child.${documentColumn}
    WHERE child.parent_item_id IS NOT NULL
      AND parent.id IS NULL;
  `);
  if (rows.length > 0) {
    exitCode = 1;
    console.error(`❌ ${table}: ${rows.length} items with missing parent references:`);
    rows.forEach(row => console.error(`   - id=${row.id} document=${row.document_id} parent_item_id=${row.parent_item_id}`));
  } else {
    console.log(`✅ ${table}: no missing parent references`);
  }
}

function checkHierarchyLevels(table) {
  if (!tableExists(table)) return;
  const rows = queryAll(`
    SELECT id, parent_item_id, hierarchy_level
    FROM ${table}
    WHERE (parent_item_id IS NULL AND hierarchy_level > 0)
       OR (parent_item_id IS NOT NULL AND hierarchy_level = 0);
  `);
  if (rows.length > 0) {
    exitCode = 1;
    console.error(`⚠️ ${table}: hierarchy_level mismatches:`);
    rows.forEach(row => console.error(`   - id=${row.id} parent_item_id=${row.parent_item_id} hierarchy_level=${row.hierarchy_level}`));
  } else {
    console.log(`✅ ${table}: hierarchy_level values consistent`);
  }
}

function checkSelfReferences(table) {
  if (!tableExists(table)) return;
  const rows = queryAll(`
    SELECT id, parent_item_id
    FROM ${table}
    WHERE parent_item_id = id;
  `);
  if (rows.length > 0) {
    exitCode = 1;
    console.error(`❌ ${table}: self references detected:`);
    rows.forEach(row => console.error(`   - id=${row.id}`));
  } else {
    console.log(`✅ ${table}: no self references`);
  }
}

console.log('');
checkMissingParents('offer_line_items', 'offer_id');
checkHierarchyLevels('offer_line_items');
checkSelfReferences('offer_line_items');

console.log('');
checkMissingParents('invoice_line_items', 'invoice_id');
checkHierarchyLevels('invoice_line_items');
checkSelfReferences('invoice_line_items');

console.log('');
checkMissingParents('package_line_items', 'package_id');
checkHierarchyLevels('package_line_items');
checkSelfReferences('package_line_items');

if (exitCode === 0) {
  console.log('\n🎉 All line item hierarchies look good.');
} else {
  console.error('\n🚫 Line item hierarchy issues detected.');
}

process.exit(exitCode);
