import type { PersistenceAdapter, Settings, Customer, Offer, Invoice, Package } from "../persistence/adapter";
import { DbClient } from "../services/DbClient";
import { FieldMapper, mapFromSQL, mapFromSQLArray, mapToSQL, convertSQLQuery } from "../lib/field-mapper";

function nowIso() {
  return new Date().toISOString();
}

export class SQLiteAdapter implements PersistenceAdapter {
  private client: DbClient;

  constructor() {
    this.client = DbClient.getInstance();
  }

  async ready(): Promise<void> {
    // DbClient validates availability automatically
  }

  // SETTINGS
  async getSettings(): Promise<Settings> {
    const rows = await this.client.query<Settings>("SELECT * FROM settings WHERE id = 1");
    return rows[0] as Settings;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    // Get current settings
    const current = await this.getSettings();
    const next = { ...current, ...patch, updatedAt: nowIso() };

    // Map settings to SQL format
    const mappedNext = mapToSQL(next);

    // Update via transaction
    await this.client.transaction([
      {
        sql: `
          UPDATE settings SET
            company_name = ?, street = ?, zip = ?, city = ?, tax_id = ?,
            kleinunternehmer = ?, next_customer_number = ?, next_offer_number = ?, next_invoice_number = ?,
            updated_at = ?
          WHERE id = 1
        `,
        params: [
          mappedNext.company_name ?? null,
          mappedNext.street ?? null,
          mappedNext.zip ?? null,
          mappedNext.city ?? null,
          mappedNext.tax_id ?? null,
          mappedNext.kleinunternehmer ? 1 : 0,
          mappedNext.next_customer_number ?? 1,
          mappedNext.next_offer_number ?? 1,
          mappedNext.next_invoice_number ?? 1,
          mappedNext.updated_at,
        ]
      }
    ]);
    
    return next;
  }

  // CUSTOMERS
  async listCustomers(): Promise<Customer[]> {
    const query = convertSQLQuery(`SELECT * FROM customers ORDER BY createdAt DESC`);
    const sqlRows = await this.client.query<any>(query);
    return mapFromSQLArray(sqlRows) as Customer[];
  }

  async getCustomer(id: number): Promise<Customer | null> {
    const rows = await this.client.query<any>(`SELECT * FROM customers WHERE id = ?`, [id]);
    if (rows.length === 0) return null;
    return mapFromSQL(rows[0]) as Customer;
  }

  async createCustomer(
    data: Omit<Customer, "id" | "createdAt" | "updatedAt">
  ): Promise<Customer> {
    const ts = nowIso();
    
    // Map input data to SQL format
    const mappedData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
    
    const result = await this.client.exec(
      `
      INSERT INTO customers (number, name, email, phone, street, zip, city, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        mappedData.number,
        mappedData.name,
        mappedData.email ?? null,
        mappedData.phone ?? null,
        mappedData.street ?? null,
        mappedData.zip ?? null,
        mappedData.city ?? null,
        mappedData.notes ?? null,
        mappedData.created_at,
        mappedData.updated_at,
      ]
    );
    
    const newCustomer = await this.getCustomer(result.lastInsertRowid);
    if (!newCustomer) throw new Error("Customer creation failed");
    return newCustomer;
  }

  async updateCustomer(id: number, patch: Partial<Customer>): Promise<Customer> {
    const current = await this.getCustomer(id);
    if (!current) throw new Error("Customer not found");

    const next: Customer = {
      ...current,
      ...patch,
      updatedAt: nowIso(),
    };

    // Map to SQL format
    const mappedNext = mapToSQL(next);

    await this.client.exec(
      `
      UPDATE customers SET
        number = ?, name = ?, email = ?, phone = ?, street = ?, zip = ?, city = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
      [
        mappedNext.number,
        mappedNext.name,
        mappedNext.email ?? null,
        mappedNext.phone ?? null,
        mappedNext.street ?? null,
        mappedNext.zip ?? null,
        mappedNext.city ?? null,
        mappedNext.notes ?? null,
        mappedNext.updated_at,
        id,
      ]
    );

    const row = await this.getCustomer(id);
    if (!row) throw new Error("Customer update failed");
    return row;
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.client.exec(`DELETE FROM customers WHERE id = ?`, [id]);
  }

  // PACKAGES
  async listPackages(): Promise<Package[]> {
    const sqlRows = await this.client.query<any>(`SELECT * FROM packages ORDER BY created_at DESC`);
    const packages = mapFromSQLArray(sqlRows) as Omit<Package, "lineItems">[];
    
    // Load line items for each package
    const result: Package[] = [];
    for (const pkg of packages) {
      const lineItemRows = await this.client.query<any>(`SELECT id, title, quantity, amount, parent_item_id, description FROM package_line_items WHERE package_id = ? ORDER BY id`, [pkg.id]);
      const lineItems = mapFromSQLArray(lineItemRows).map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        amount: item.amount,
        parentItemId: item.parentItemId || undefined,
        description: item.description || undefined
      }));
      
      result.push({
        ...pkg,
        lineItems
      });
    }
    return result;
  }

  async getPackage(id: number): Promise<Package | null> {
    const sqlRows = await this.client.query<any>(`SELECT * FROM packages WHERE id = ?`, [id]);
    if (sqlRows.length === 0) return null;
    
    const pkg = mapFromSQL(sqlRows[0]) as Omit<Package, "lineItems">;
    const lineItemRows = await this.client.query<any>(`SELECT id, title, quantity, amount, parent_item_id, description FROM package_line_items WHERE package_id = ? ORDER BY id`, [id]);
    const lineItems = mapFromSQLArray(lineItemRows).map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      amount: item.amount,
      parentItemId: item.parentItemId || undefined,
      description: item.description || undefined
    }));
    
    return {
      ...pkg,
      lineItems
    };
  }

  async createPackage(data: Omit<Package, "id" | "createdAt" | "updatedAt">): Promise<Package> {
    const ts = nowIso();
    
    // Map package data to SQL format
    const mappedPackageData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
    
    // Use transaction for package + line items
    const queries: Array<{ sql: string; params?: any[] }> = [
      {
        sql: `
          INSERT INTO packages (internal_title, parent_package_id, total, add_vat, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        params: [
          mappedPackageData.internal_title,
          mappedPackageData.parent_package_id ?? null,
          mappedPackageData.total,
          mappedPackageData.add_vat ? 1 : 0,
          mappedPackageData.created_at,
          mappedPackageData.updated_at,
        ]
      }
    ];
    
    await this.client.transaction(queries);
    
    // Get the inserted package ID using a separate query
    const packageRows = await this.client.query<{ id: number }>(`SELECT id FROM packages WHERE internal_title = ? AND created_at = ? ORDER BY id DESC LIMIT 1`, [mappedPackageData.internal_title, mappedPackageData.created_at]);
    const packageId = packageRows[0].id;
    
    // Insert line items
    for (const item of data.lineItems) {
      const mappedItem = mapToSQL(item);
      await this.client.exec(
        `INSERT INTO package_line_items (package_id, title, quantity, amount, parent_item_id, description) VALUES (?, ?, ?, ?, ?, ?)`,
        [packageId, mappedItem.title, mappedItem.quantity, mappedItem.amount, mappedItem.parent_item_id || null, mappedItem.description || null]
      );
    }
    
    const newPackage = await this.getPackage(packageId);
    if (!newPackage) throw new Error("Package creation failed");
    return newPackage;
  }

  async updatePackage(id: number, patch: Partial<Package>): Promise<Package> {
    const current = await this.getPackage(id);
    if (!current) throw new Error("Package not found");

    const next = {
      ...current,
      ...patch,
      updatedAt: nowIso(),
    };

    // Update package
    await this.client.exec(
      `
      UPDATE packages SET
        internalTitle = ?, parentPackageId = ?, total = ?, addVat = ?, updatedAt = ?
      WHERE id = ?
    `,
      [
        next.internalTitle,
        next.parentPackageId ?? null,
        next.total,
        next.addVat ? 1 : 0,
        next.updatedAt,
        id,
      ]
    );

    // Update line items if provided
    if (patch.lineItems) {
      // Delete old line items
      await this.client.exec(`DELETE FROM package_line_items WHERE packageId = ?`, [id]);
      
      // Insert new line items
      for (const item of patch.lineItems) {
        await this.client.exec(
          `INSERT INTO package_line_items (packageId, title, quantity, amount, parentItemId, description) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, item.title, item.quantity, item.amount, item.parentItemId || null, item.description || null]
        );
      }
    }

    const updated = await this.getPackage(id);
    if (!updated) throw new Error("Package update failed");
    return updated;
  }

  async deletePackage(id: number): Promise<void> {
    // Delete line items first, then package
    await this.client.transaction([
      { sql: `DELETE FROM package_line_items WHERE packageId = ?`, params: [id] },
      { sql: `DELETE FROM packages WHERE id = ?`, params: [id] }
    ]);
  }

  // OFFERS
  async listOffers(): Promise<Offer[]> {
    const offers = await this.client.query<Omit<Offer, "lineItems">>(`SELECT * FROM offers ORDER BY createdAt DESC`);
    
    const result: Offer[] = [];
    for (const offer of offers) {
      const lineItems = await this.client.query<{
        id: number;
        title: string;
        description: string | null;
        quantity: number;
        unitPrice: number;
        total: number;
        parentItemId: number | null;
      }>(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM offer_line_items WHERE offerId = ? ORDER BY id`, [offer.id]);
      
      result.push({
        ...offer,
        lineItems: lineItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          parentItemId: item.parentItemId || undefined
        }))
      });
    }
    return result;
  }

  async getOffer(id: number): Promise<Offer | null> {
    const rows = await this.client.query<Omit<Offer, "lineItems">>(`SELECT * FROM offers WHERE id = ?`, [id]);
    if (!rows[0]) return null;
    
    const offer = rows[0];
    const lineItems = await this.client.query<{
      id: number;
      title: string;
      description: string | null;
      quantity: number;
      unitPrice: number;
      total: number;
      parentItemId: number | null;
    }>(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM offer_line_items WHERE offerId = ? ORDER BY id`, [id]);
    
    return {
      ...offer,
      lineItems: lineItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        parentItemId: item.parentItemId || undefined
      }))
    };
  }

  async createOffer(data: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<Offer> {
    const ts = nowIso();
    
    const result = await this.client.exec(
      `
      INSERT INTO offers (offerNumber, customerId, title, status, validUntil, subtotal, vatRate, vatAmount, total, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        data.offerNumber,
        data.customerId,
        data.title,
        data.status,
        data.validUntil,
        data.subtotal,
        data.vatRate,
        data.vatAmount,
        data.total,
        data.notes || null,
        ts,
        ts,
      ]
    );
    
    const offerId = result.lastInsertRowid;
    
    for (const item of data.lineItems) {
      await this.client.exec(
        `INSERT INTO offer_line_items (offerId, title, description, quantity, unitPrice, total, parentItemId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [offerId, item.title, item.description || null, item.quantity, item.unitPrice, item.total, item.parentItemId || null]
      );
    }
    
    const newOffer = await this.getOffer(offerId);
    if (!newOffer) throw new Error("Offer creation failed");
    return newOffer;
  }

  async updateOffer(id: number, patch: Partial<Offer>): Promise<Offer> {
    const current = await this.getOffer(id);
    if (!current) throw new Error("Offer not found");

    const next = { ...current, ...patch, updatedAt: nowIso() };

    await this.client.exec(
      `
      UPDATE offers SET
        offerNumber = ?, customerId = ?, title = ?, status = ?, validUntil = ?, 
        subtotal = ?, vatRate = ?, vatAmount = ?, total = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `,
      [
        next.offerNumber,
        next.customerId,
        next.title,
        next.status,
        next.validUntil,
        next.subtotal,
        next.vatRate,
        next.vatAmount,
        next.total,
        next.notes || null,
        next.updatedAt,
        id,
      ]
    );

    if (patch.lineItems) {
      await this.client.exec(`DELETE FROM offer_line_items WHERE offerId = ?`, [id]);
      for (const item of patch.lineItems) {
        await this.client.exec(
          `INSERT INTO offer_line_items (offerId, title, description, quantity, unitPrice, total, parentItemId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, item.title, item.description || null, item.quantity, item.unitPrice, item.total, item.parentItemId || null]
        );
      }
    }

    const updated = await this.getOffer(id);
    if (!updated) throw new Error("Offer update failed");
    return updated;
  }

  async deleteOffer(id: number): Promise<void> {
    await this.client.transaction([
      { sql: `DELETE FROM offer_line_items WHERE offerId = ?`, params: [id] },
      { sql: `DELETE FROM offers WHERE id = ?`, params: [id] }
    ]);
  }

  // INVOICES
  async listInvoices(): Promise<Invoice[]> {
    const invoices = await this.client.query<Omit<Invoice, "lineItems">>(`SELECT * FROM invoices ORDER BY createdAt DESC`);
    
    const result: Invoice[] = [];
    for (const invoice of invoices) {
      const lineItems = await this.client.query<{
        id: number;
        title: string;
        description: string | null;
        quantity: number;
        unitPrice: number;
        total: number;
        parentItemId: number | null;
      }>(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM invoice_line_items WHERE invoiceId = ? ORDER BY id`, [invoice.id]);
      
      result.push({
        ...invoice,
        lineItems: lineItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          parentItemId: item.parentItemId || undefined
        }))
      });
    }
    return result;
  }

  async getInvoice(id: number): Promise<Invoice | null> {
    const rows = await this.client.query<Omit<Invoice, "lineItems">>(`SELECT * FROM invoices WHERE id = ?`, [id]);
    if (!rows[0]) return null;
    
    const invoice = rows[0];
    const lineItems = await this.client.query<{
      id: number;
      title: string;
      description: string | null;
      quantity: number;
      unitPrice: number;
      total: number;
      parentItemId: number | null;
    }>(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM invoice_line_items WHERE invoiceId = ? ORDER BY id`, [id]);
    
    return {
      ...invoice,
      lineItems: lineItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        parentItemId: item.parentItemId || undefined
      }))
    };
  }

  async createInvoice(data: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    const ts = nowIso();
    
    const result = await this.client.exec(
      `
      INSERT INTO invoices (invoiceNumber, customerId, offerId, title, status, dueDate, subtotal, vatRate, vatAmount, total, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        data.invoiceNumber,
        data.customerId,
        data.offerId || null,
        data.title,
        data.status,
        data.dueDate,
        data.subtotal,
        data.vatRate,
        data.vatAmount,
        data.total,
        data.notes || null,
        ts,
        ts,
      ]
    );
    
    const invoiceId = result.lastInsertRowid;
    
    for (const item of data.lineItems) {
      await this.client.exec(
        `INSERT INTO invoice_line_items (invoiceId, title, description, quantity, unitPrice, total, parentItemId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.title, item.description || null, item.quantity, item.unitPrice, item.total, item.parentItemId || null]
      );
    }
    
    const newInvoice = await this.getInvoice(invoiceId);
    if (!newInvoice) throw new Error("Invoice creation failed");
    return newInvoice;
  }

  async updateInvoice(id: number, patch: Partial<Invoice>): Promise<Invoice> {
    const current = await this.getInvoice(id);
    if (!current) throw new Error("Invoice not found");

    const next = { ...current, ...patch, updatedAt: nowIso() };

    await this.client.exec(
      `
      UPDATE invoices SET
        invoiceNumber = ?, customerId = ?, offerId = ?, title = ?, status = ?, dueDate = ?, 
        subtotal = ?, vatRate = ?, vatAmount = ?, total = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `,
      [
        next.invoiceNumber,
        next.customerId,
        next.offerId || null,
        next.title,
        next.status,
        next.dueDate,
        next.subtotal,
        next.vatRate,
        next.vatAmount,
        next.total,
        next.notes || null,
        next.updatedAt,
        id,
      ]
    );

    if (patch.lineItems) {
      await this.client.exec(`DELETE FROM invoice_line_items WHERE invoiceId = ?`, [id]);
      for (const item of patch.lineItems) {
        await this.client.exec(
          `INSERT INTO invoice_line_items (invoiceId, title, description, quantity, unitPrice, total, parentItemId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, item.title, item.description || null, item.quantity, item.unitPrice, item.total, item.parentItemId || null]
        );
      }
    }

    const updated = await this.getInvoice(id);
    if (!updated) throw new Error("Invoice update failed");
    return updated;
  }

  async deleteInvoice(id: number): Promise<void> {
    await this.client.transaction([
      { sql: `DELETE FROM invoice_line_items WHERE invoiceId = ?`, params: [id] },
      { sql: `DELETE FROM invoices WHERE id = ?`, params: [id] }
    ]);
  }
}
