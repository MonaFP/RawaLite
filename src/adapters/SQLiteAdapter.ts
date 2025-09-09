import initSqlJs from 'sql.js'; // pnpm add sql.js

export class SQLiteAdapter {
  private db: any; // sql.js DB

  async init(): Promise<void> {
    const SQL = await initSqlJs({ locateFile: () => '/path/to/sql-wasm.wasm' }); // WASM Path anpassen
    const bytes = await window.api.db.load();
    this.db = new SQL.Database(bytes);
  }

  async save(): Promise<void> {
    const bytes = this.db.export();
    await window.api.db.save(bytes);
  }

  // CRUD Methods: executeSql, etc.
  async create(table: string, data: object): Promise<string> {
    // Insert Logic
    return 'id';
  }

  // Auto-Snapshot vor Writes: save old bytes before
}