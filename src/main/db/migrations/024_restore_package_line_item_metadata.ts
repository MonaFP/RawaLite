import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('?? Migration 024: Restoring package line item metadata columns...');

  const info = db.prepare('PRAGMA table_info(package_line_items)').all() as Array<{ name: string }>;
  const hasItemOrigin = info.some(col => col.name === 'item_origin');
  const hasSortOrder = info.some(col => col.name === 'sort_order');
  const hasClientTempId = info.some(col => col.name === 'client_temp_id');

  if (!hasItemOrigin) {
    console.log('?? Adding item_origin column to package_line_items...');
    db.exec(`
      ALTER TABLE package_line_items
      ADD COLUMN item_origin TEXT DEFAULT 'manual'
      CHECK (item_origin IN ('manual','package_import','template'))
    `);
  }

  if (!hasSortOrder) {
    console.log('?? Adding sort_order column to package_line_items...');
    db.exec(`
      ALTER TABLE package_line_items
      ADD COLUMN sort_order INTEGER DEFAULT 0
    `);
  }

  if (!hasClientTempId) {
    console.log('?? Adding client_temp_id column to package_line_items...');
    db.exec(`
      ALTER TABLE package_line_items
      ADD COLUMN client_temp_id TEXT
    `);
  }

  console.log('?? Updating sort_order defaults...');
  db.exec(`
    UPDATE package_line_items
    SET sort_order = (
      SELECT COUNT(*)
      FROM package_line_items pli2
      WHERE pli2.package_id = package_line_items.package_id
        AND pli2.id <= package_line_items.id
    ) * 10
    WHERE sort_order IS NULL OR sort_order = 0;
  `);

  console.log('?? Recreating index for package line items sort order...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_package_line_items_sort_order
    ON package_line_items(package_id, sort_order);
  `);

  console.log('?? Migration 024 completed.');
}

export function down(db: Database): void {
  console.log('?? Migration 024 rollback: removing restored metadata columns...');

  db.exec('DROP INDEX IF EXISTS idx_package_line_items_sort_order;');

  const info = db.prepare('PRAGMA table_info(package_line_items)').all() as Array<{ name: string }>;
  const columnsToKeep = info
    .map(col => col.name)
    .filter(name => !['item_origin', 'sort_order', 'client_temp_id'].includes(name));

  if (columnsToKeep.length === info.length) {
    console.log('?? package_line_items has no metadata columns. Skipping.');
    return;
  }

  const columnList = columnsToKeep.join(', ');

  console.log('?? Creating backup table without metadata columns...');
  db.exec(`
    CREATE TABLE package_line_items_backup AS
    SELECT ${columnList} FROM package_line_items;
  `);

  console.log('?? Dropping package_line_items table...');
  db.exec('DROP TABLE package_line_items;');

  console.log('?? Recreating package_line_items without metadata columns...');
  db.exec(`
    CREATE TABLE package_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      parent_item_id INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE,
      hierarchy_level INTEGER NOT NULL DEFAULT 0
    );
  `);

  console.log('?? Restoring backup data...');
  db.exec(`
    INSERT INTO package_line_items (${columnList})
    SELECT ${columnList} FROM package_line_items_backup;
  `);

  db.exec('DROP TABLE package_line_items_backup;');

  console.log('?? Migration 024 rollback completed.');
}
