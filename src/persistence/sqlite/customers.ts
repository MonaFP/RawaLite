import type { Database } from "sql.js";
import type { Kunde } from "../../entities/Kunde";
import { getDB, persist } from "./db";

function mapRow(row: any[]): Kunde{
  return {
    id: row[0],
    name: row[1],
    email: row[2] ?? undefined,
    ort: row[3] ?? undefined,
    createdAt: row[4],
    updatedAt: row[5],
  };
}

export async function listCustomers(): Promise<Kunde[]>{
  const db = await getDB();
  const res = db.exec("SELECT id,name,email,ort,createdAt,updatedAt FROM customers ORDER BY name ASC");
  if(res.length === 0) return [];
  const rows = res[0].values;
  return rows.map(mapRow);
}

export async function getCustomer(id: string): Promise<Kunde | undefined>{
  const db = await getDB();
  const stmt = db.prepare("SELECT id,name,email,ort,createdAt,updatedAt FROM customers WHERE id = ? LIMIT 1");
  stmt.bind([id]);
  if(stmt.step()){
    const row = stmt.get();
    stmt.free();
    return mapRow(row);
  }
  stmt.free();
  return undefined;
}

export async function createCustomer(input: Omit<Kunde,"id"|"createdAt"|"updatedAt">): Promise<Kunde>{
  const db = await getDB();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const stmt = db.prepare("INSERT INTO customers (id,name,email,ort,createdAt,updatedAt) VALUES (?,?,?,?,?,?)");
  stmt.run([id, input.name, input.email ?? null, input.ort ?? null, now, now]);
  stmt.free();
  persist();
  return { ...input, id, createdAt: now, updatedAt: now };
}

export async function updateCustomer(id: string, patch: Partial<Omit<Kunde,"id"|"createdAt">>): Promise<Kunde | undefined>{
  const db = await getDB();
  const existing = await getCustomer(id);
  if(!existing) return undefined;
  const now = new Date().toISOString();
  const name = patch.name ?? existing.name;
  const email = patch.email ?? existing.email ?? null;
  const ort = patch.ort ?? existing.ort ?? null;
  const stmt = db.prepare("UPDATE customers SET name=?, email=?, ort=?, updatedAt=? WHERE id=?");
  stmt.run([name, email, ort, now, id]);
  stmt.free();
  persist();
  return { ...existing, name, email: email ?? undefined, ort: ort ?? undefined, updatedAt: now };
}

export async function deleteCustomer(id: string): Promise<boolean>{
  const db = await getDB();
  const stmt = db.prepare("DELETE FROM customers WHERE id=?");
  stmt.run([id]);
  stmt.free();
  persist();
  return true;
}
