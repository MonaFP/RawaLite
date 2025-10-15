import type { Database } from 'better-sqlite3';

interface TableConfig {
  name: string;
  parentColumn: string;
  columnsWithoutHierarchy: string[];
  createStatement: string;
  recreateIndexes?: () => string[];
}

const TABLES: TableConfig[] = [
  {
    name: 'offer_line_items',
    parentColumn: 'parent_item_id',
    columnsWithoutHierarchy: [
      'id',
      'offer_id',
      'title',
      'description',
      'quantity',
      'unit_price',
      'total',
      'parent_item_id',
      'item_type',
      'source_package_id',
      'item_origin',
      'source_package_item_id',
      'sort_order',
      'client_temp_id'
    ],
    createStatement: `
      CREATE TABLE offer_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        parent_item_id INTEGER REFERENCES offer_line_items(id) ON DELETE CASCADE,
        item_type TEXT DEFAULT 'standalone',
        source_package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
        item_origin TEXT DEFAULT 'manual' CHECK (item_origin IN ('manual','package_import','template')),
        source_package_item_id INTEGER REFERENCES package_line_items(id) ON DELETE SET NULL,
        sort_order INTEGER DEFAULT 0,
        client_temp_id TEXT
      );
    `,
    recreateIndexes: () => [
      `CREATE INDEX IF NOT EXISTS idx_offer_line_items_type ON offer_line_items(item_type);`,
      `CREATE INDEX IF NOT EXISTS idx_offer_line_items_source_package ON offer_line_items(source_package_id);`,
      `CREATE INDEX IF NOT EXISTS idx_offer_line_items_sort_order ON offer_line_items(offer_id, sort_order);`
    ]
  },
  {
    name: 'invoice_line_items',
    parentColumn: 'parent_item_id',
    columnsWithoutHierarchy: [
      'id',
      'invoice_id',
      'title',
      'description',
      'quantity',
      'unit_price',
      'total',
      'parent_item_id',
      'item_origin',
      'source_package_item_id',
      'sort_order',
      'client_temp_id'
    ],
    createStatement: `
      CREATE TABLE invoice_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        parent_item_id INTEGER REFERENCES invoice_line_items(id) ON DELETE CASCADE,
        item_origin TEXT DEFAULT 'manual' CHECK (item_origin IN ('manual','package_import','template')),
        source_package_item_id INTEGER REFERENCES package_line_items(id) ON DELETE SET NULL,
        sort_order INTEGER DEFAULT 0,
        client_temp_id TEXT
      );
    `,
    recreateIndexes: () => [
      `CREATE INDEX IF NOT EXISTS idx_invoice_line_items_sort_order ON invoice_line_items(invoice_id, sort_order);`,
      `CREATE INDEX IF NOT EXISTS idx_invoice_line_items_source_package ON invoice_line_items(source_package_item_id);`
    ]
  },
  {
    name: 'package_line_items',
    parentColumn: 'parent_item_id',
    columnsWithoutHierarchy: [
      'id',
      'package_id',
      'title',
      'description',
      'quantity',
      'unit_price',
      'parent_item_id',
      'item_origin',
      'sort_order',
      'client_temp_id'
    ],
    createStatement: `
      CREATE TABLE package_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        parent_item_id INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE,
        item_origin TEXT DEFAULT 'manual' CHECK (item_origin IN ('manual','package_import','template')),
        sort_order INTEGER DEFAULT 0,
        client_temp_id TEXT
      );
    `,
    recreateIndexes: () => [
      `CREATE INDEX IF NOT EXISTS idx_package_line_items_sort_order ON package_line_items(package_id, sort_order);`
    ]
  }
];

export function up(db: Database): void {
  console.log('?? Migration 023: Adding hierarchy_level to line item tables...');

  for (const table of TABLES) {
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as Array<{ name: string }>;
    const hasHierarchy = columns.some(col => col.name === 'hierarchy_level');

    if (!hasHierarchy) {
      console.log(`?? Adding hierarchy_level column to ${table.name}...`);
      db.exec(`
        ALTER TABLE ${table.name}
        ADD COLUMN hierarchy_level INTEGER NOT NULL DEFAULT 0
      `);
    }

    console.log(`?? Initializing hierarchy levels for ${table.name}...`);
    db.exec(`
      UPDATE ${table.name}
      SET hierarchy_level = CASE
        WHEN ${table.parentColumn} IS NULL THEN 0
        ELSE 1
      END
    `);
  }

  console.log('?? Migration 023 completed.');
}

export function down(db: Database): void {
  console.log('?? Migration 023 rollback: removing hierarchy_level columns...');

  for (const table of TABLES) {
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as Array<{ name: string }>;
    const hasHierarchy = columns.some(col => col.name === 'hierarchy_level');

    if (!hasHierarchy) {
      console.log(`?? ${table.name} already without hierarchy_level. Skipping.`);
      continue;
    }

    const backupColumns = table.columnsWithoutHierarchy.join(', ');

    console.log(`?? Creating backup for ${table.name} without hierarchy_level...`);
    db.exec(`
      CREATE TABLE ${table.name}_backup AS
      SELECT ${backupColumns} FROM ${table.name};
    `);

    console.log(`?? Dropping ${table.name}...`);
    db.exec(`DROP TABLE ${table.name};`);

    console.log(`?? Recreating ${table.name} without hierarchy_level...`);
    db.exec(table.createStatement);

    console.log(`?? Restoring data into ${table.name}...`);
    const insertColumns = table.columnsWithoutHierarchy.join(', ');
    db.exec(`
      INSERT INTO ${table.name} (${insertColumns})
      SELECT ${insertColumns} FROM ${table.name}_backup;
    `);

    db.exec(`DROP TABLE ${table.name}_backup;`);

    if (table.recreateIndexes) {
      for (const statement of table.recreateIndexes()) {
        db.exec(statement);
      }
    }
  }

  console.log('?? Migration 023 rollback completed.');
}
