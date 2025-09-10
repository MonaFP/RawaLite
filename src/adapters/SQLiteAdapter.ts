import { PersistenceAdapter, Settings, Customer } from "../persistence/adapter";
import { getDB, all, run, withTx } from "../persistence/sqlite/db";

function nowIso() {
  return new Date().toISOString();
}

export class SQLiteAdapter implements PersistenceAdapter {
  async ready(): Promise<void> {
    await getDB();
  }

  // SETTINGS
  async getSettings(): Promise<Settings> {
    await getDB();
    const rows = all<Settings>("SELECT * FROM settings WHERE id = 1");
    return rows[0] as Settings;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    return withTx(async () => {
      const current = await this.getSettings();
      const next = { ...current, ...patch, updatedAt: nowIso() };

      run(
        `
        UPDATE settings SET
          companyName = ?, street = ?, zip = ?, city = ?, taxId = ?,
          kleinunternehmer = ?, nextCustomerNumber = ?, nextOfferNumber = ?, nextInvoiceNumber = ?,
          updatedAt = ?
        WHERE id = 1
      `,
        [
          next.companyName ?? null,
          next.street ?? null,
          next.zip ?? null,
          next.city ?? null,
          next.taxId ?? null,
          next.kleinunternehmer ? 1 : 0,
          next.nextCustomerNumber ?? 1,
          next.nextOfferNumber ?? 1,
          next.nextInvoiceNumber ?? 1,
          next.updatedAt,
        ]
      );
      return next;
    });
  }

  // CUSTOMERS
  async listCustomers(): Promise<Customer[]> {
    await getDB();
    return all<Customer>(`SELECT * FROM customers ORDER BY createdAt DESC`);
  }

  async getCustomer(id: number): Promise<Customer | null> {
    await getDB();
    const rows = all<Customer>(`SELECT * FROM customers WHERE id = ?`, [id]);
    return rows[0] ?? null;
  }

  async createCustomer(
    data: Omit<Customer, "id" | "createdAt" | "updatedAt">
  ): Promise<Customer> {
    return withTx(async () => {
      const ts = nowIso();
      run(
        `
        INSERT INTO customers (number, name, email, phone, street, zip, city, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
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

  async updateCustomer(id: number, patch: Partial<Customer>): Promise<Customer> {
    return withTx(async () => {
      const current = await this.getCustomer(id);
      if (!current) throw new Error("Customer not found");

      const next: Customer = {
        ...current,
        ...patch,
        updatedAt: nowIso(),
      };

      run(
        `
        UPDATE customers SET
          number = ?, name = ?, email = ?, phone = ?, street = ?, zip = ?, city = ?, notes = ?, updatedAt = ?
        WHERE id = ?
      `,
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

      const row = await this.getCustomer(id);
      if (!row) throw new Error("Customer update failed");
      return row;
    });
  }

  async deleteCustomer(id: number): Promise<void> {
    await withTx(async () => {
      run(`DELETE FROM customers WHERE id = ?`, [id]);
    });
  }
}
