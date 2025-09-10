// Note: sql.js is not installed yet - install with: npm install sql.js @types/sql.js
// For now, using mock types
type Database = any;
const initSqlJs = async (config: any) => ({ Database: class { 
  constructor(data?: any) {} 
  run(sql: string, params?: any[]) { console.warn('Mock db.run:', sql, params); }
  exec(sql: string) { console.warn('Mock db.exec:', sql); return []; }
  export() { return new Uint8Array(); }
}});

// The wasm file is in /public
const wasmUrl = "/sql-wasm.wasm";

// Simple debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 500) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

// Initialize sql.js
const SQL = await initSqlJs({ locateFile: () => wasmUrl });

// Load DB from localStorage or create new
const LS_KEY = "rawalite.db";
const stored = localStorage.getItem(LS_KEY);
export const db: Database = stored
  ? new SQL.Database(base64ToBytes(stored))
  : new SQL.Database();

// Save to localStorage
function saveNow() {
  const data = db.export();
  localStorage.setItem(LS_KEY, bytesToBase64(data));
}

export const saveDbDebounced = debounce(saveNow, 500);

// Helper function for numbers
export function toNumber(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

// Ensure database schema exists
export function ensureSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT ''
    );
    
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      customer_id TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    
    CREATE TABLE IF NOT EXISTS offer_items (
      offer_id INTEGER NOT NULL,
      pos INTEGER NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      qty REAL NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (offer_id, pos),
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  saveDbDebounced();
}

// Settings API
export function getSettings(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const res = db.exec('SELECT key, value FROM settings');
    if (res[0]) {
      const { columns, values } = res[0];
      const keyIdx = columns.indexOf('key');
      const valueIdx = columns.indexOf('value');
      
      for (const row of values) {
        result[String(row[keyIdx])] = String(row[valueIdx]);
      }
    }
  } catch (e) {
    console.warn('getSettings error:', e);
  }
  return result;
}

export function setSettings(key: string, value: string) {
  try {
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    saveDbDebounced();
  } catch (e) {
    console.error('setSettings error:', e);
  }
}

// Customers API
export function listCustomers() {
  const customers: Array<{id: string; name: string; address: string}> = [];
  try {
    const res = db.exec('SELECT id, name, address FROM customers ORDER BY id');
    if (res[0]) {
      const { columns, values } = res[0];
      const idIdx = columns.indexOf('id');
      const nameIdx = columns.indexOf('name');
      const addressIdx = columns.indexOf('address');
      
      for (const row of values) {
        customers.push({
          id: String(row[idIdx]),
          name: String(row[nameIdx]),
          address: String(row[addressIdx])
        });
      }
    }
  } catch (e) {
    console.warn('listCustomers error:', e);
  }
  return customers;
}

export function upsertCustomer(customer: {id?: string; name: string; address: string}) {
  try {
    if (customer.id) {
      db.run('UPDATE customers SET name = ?, address = ? WHERE id = ?', 
        [customer.name, customer.address, customer.id]);
    } else {
      // Generate new customer ID
      const res = db.exec('SELECT COUNT(*) as c FROM customers');
      const count = res[0] ? toNumber(res[0].values[0][0]) : 0;
      const id = `K-${String(count + 1).padStart(3, '0')}`;
      
      db.run('INSERT INTO customers (id, name, address) VALUES (?, ?, ?)', 
        [id, customer.name, customer.address]);
    }
    saveDbDebounced();
  } catch (e) {
    console.error('upsertCustomer error:', e);
  }
}

export function deleteLastCustomer() {
  try {
    db.run('DELETE FROM customers WHERE id = (SELECT id FROM customers ORDER BY id DESC LIMIT 1)');
    saveDbDebounced();
  } catch (e) {
    console.error('deleteLastCustomer error:', e);
  }
}

// Offers API
export function listOffers() {
  const offers: Array<any> = [];
  try {
    const res = db.exec(`
      SELECT o.id, o.title, o.customer_id, o.created_at, c.name as customer_name
      FROM offers o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.id DESC
    `);
    
    if (res[0]) {
      const { columns, values } = res[0];
      for (const row of values) {
        const offer: any = {};
        columns.forEach((col: any, idx: number) => {
          offer[col] = row[idx];
        });
        offers.push(offer);
      }
    }
  } catch (e) {
    console.warn('listOffers error:', e);
  }
  return offers;
}

export function getOffer(id: number) {
  try {
    // Get offer basics
    const offerRes = db.exec(`SELECT * FROM offers WHERE id = ${id}`);
    if (!offerRes[0] || offerRes[0].values.length === 0) return null;
    
    const { columns, values } = offerRes[0];
    const offer: any = {};
    columns.forEach((col: any, idx: number) => {
      offer[col] = values[0][idx];
    });
    
    // Load items
    const itemsRes = db.exec(`SELECT pos, text, qty, price FROM offer_items WHERE offer_id = ${id} ORDER BY pos`);
    const items: Array<any> = [];
    
    if (itemsRes[0]) {
      const { columns: itemCols, values: itemVals } = itemsRes[0];
      for (const row of itemVals) {
        const item: any = {};
        itemCols.forEach((col: any, idx: number) => {
          item[col] = row[idx];
        });
        items.push(item);
      }
    }
    
    return { ...offer, items };
  } catch (e) {
    console.error('getOffer error:', e);
    return null;
  }
}

export function createOffer(title: string) {
  try {
    db.run('INSERT INTO offers (title) VALUES (?)', [title]);
    const res = db.exec('SELECT last_insert_rowid()');
    const id = res[0] ? toNumber(res[0].values[0][0]) : 0;
    saveDbDebounced();
    return id;
  } catch (e) {
    console.error('createOffer error:', e);
    return 0;
  }
}

export function updateOfferBasics(id: number, data: {title?: string; customer_id?: string | null}) {
  try {
    if (data.title !== undefined) {
      db.run('UPDATE offers SET title = ? WHERE id = ?', [data.title, id]);
    }
    if (data.customer_id !== undefined) {
      db.run('UPDATE offers SET customer_id = ? WHERE id = ?', [data.customer_id, id]);
    }
    saveDbDebounced();
  } catch (e) {
    console.error('updateOfferBasics error:', e);
  }
}

export function replaceOfferItems(offerId: number, items: Array<{pos: number; text: string; qty: number; price: number}>) {
  try {
    // Delete all existing items first
    db.run('DELETE FROM offer_items WHERE offer_id = ?', [offerId]);
    
    // Insert new items
    for (const item of items) {
      db.run('INSERT INTO offer_items (offer_id, pos, text, qty, price) VALUES (?, ?, ?, ?, ?)', 
        [offerId, item.pos, item.text, item.qty, item.price]);
    }
    saveDbDebounced();
  } catch (e) {
    console.error('replaceOfferItems error:', e);
  }
}

export function deleteOffer(id: number) {
  try {
    db.run('DELETE FROM offers WHERE id = ?', [id]);
    saveDbDebounced();
  } catch (e) {
    console.error('deleteOffer error:', e);
  }
}
