import type { Customer } from "../../persistence/adapter";
import { all, run, withTx, getDB } from "./db";

function nowIso() {
  return new Date().toISOString();
}

export async function findAllCustomers(): Promise<Customer[]> {
  await getDB();
  return all<Customer>(`SELECT * FROM customers ORDER BY createdAt DESC`);
}

export async function findCustomer(id: number): Promise<Customer | null> {
  await getDB();
  const rows = all<Customer>(`SELECT * FROM customers WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

export async function insertCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Promise<Customer> {
  return withTx(async () => {
    const ts = nowIso();
    run(
      `INSERT INTO customers (number, name, email, phone, street, zip, city, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.number,
        data.name,
        data.email ?? null,
        data.phone ?? null,
        data.street ?? null,
        data.zip ?? null,
        data.city ?? null,
        data.notes ?? null,
        ts,
        ts,
      ]
    );
    const row = all<Customer>(`SELECT * FROM customers WHERE rowid = last_insert_rowid()`);
    return row[0];
  });
}

export async function updateCustomer(
  id: number,
  patch: Partial<Customer>
): Promise<Customer> {
  return withTx(async () => {
    const curr = await findCustomer(id);
    if (!curr) throw new Error("Customer not found");
    const next: Customer = { ...curr, ...patch, updatedAt: nowIso() };

    run(
      `UPDATE customers SET number=?, name=?, email=?, phone=?, street=?, zip=?, city=?, notes=?, updatedAt=?
       WHERE id=?`,
      [
        next.number,
        next.name,
        next.email ?? null,
        next.phone ?? null,
        next.street ?? null,
        next.zip ?? null,
        next.city ?? null,
        next.notes ?? null,
        next.updatedAt,
        id,
      ]
    );
    const fresh = await findCustomer(id);
    if (!fresh) throw new Error("Update failed");
    return fresh;
  });
}

export async function removeCustomer(id: number): Promise<void> {
  await withTx(async () => run(`DELETE FROM customers WHERE id = ?`, [id]));
}
