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
    const query = convertSQLQuery("SELECT * FROM settings WHERE id = 1");
    const rows = await this.client.query<Settings>(query);
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
    const query = convertSQLQuery("SELECT * FROM customers WHERE id = ?");
    const rows = await this.client.query<any>(query, [id]);
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
    const query = convertSQLQuery("SELECT * FROM packages ORDER BY createdAt DESC");
    const sqlRows = await this.client.query<any>(query);
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
    const query = convertSQLQuery("SELECT * FROM packages WHERE id = ?");
    const sqlRows = await this.client.query<any>(query, [id]);
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

    // Map to SQL format
    const mappedNext = mapToSQL(next);

    // Update package
    await this.client.exec(
      `
      UPDATE packages SET
        internal_title = ?, parent_package_id = ?, total = ?, add_vat = ?, updated_at = ?
      WHERE id = ?
    `,
      [
        mappedNext.internal_title,
        mappedNext.parent_package_id ?? null,
        mappedNext.total,
        mappedNext.add_vat ? 1 : 0,
        mappedNext.updated_at,
        id,
      ]
    );

    // Update line items if provided
    if (patch.lineItems) {
      // Delete old line items
      await this.client.exec(`DELETE FROM package_line_items WHERE package_id = ?`, [id]);
      
      // Insert new line items
      for (const item of patch.lineItems) {
        const mappedItem = mapToSQL(item);
        await this.client.exec(
          `INSERT INTO package_line_items (package_id, title, quantity, amount, parent_item_id, description) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.quantity, mappedItem.amount, mappedItem.parent_item_id || null, mappedItem.description || null]
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
      { sql: `DELETE FROM package_line_items WHERE package_id = ?`, params: [id] },
      { sql: `DELETE FROM packages WHERE id = ?`, params: [id] }
    ]);
  }

  // OFFERS
  async listOffers(): Promise<Offer[]> {
    const query = convertSQLQuery(`SELECT * FROM offers ORDER BY createdAt DESC`);
    const offers = await this.client.query<Omit<Offer, "lineItems">>(query);
    
    const result: Offer[] = [];
    for (const offer of offers) {
      const mappedOffer = mapFromSQL(offer) as Omit<Offer, "lineItems">;
      const lineItemQuery = `SELECT id, title, description, quantity, unit_price, total, parent_item_id FROM offer_line_items WHERE offer_id = ? ORDER BY id`;
      const lineItems = await this.client.query<{
        id: number;
        title: string;
        description: string | null;
        quantity: number;
        unit_price: number;
        total: number;
        parent_item_id: number | null;
      }>(lineItemQuery, [offer.id]);
      
      result.push({
        ...mappedOffer,
        lineItems: lineItems.map(item => {
          const mappedItem = mapFromSQL(item);
          return {
            id: mappedItem.id,
            title: mappedItem.title,
            description: mappedItem.description || undefined,
            quantity: mappedItem.quantity,
            unitPrice: mappedItem.unitPrice,
            total: mappedItem.total,
            parentItemId: mappedItem.parentItemId || undefined
          };
        })
      });
    }
    return result;
  }

  async getOffer(id: number): Promise<Offer | null> {
    const query = convertSQLQuery("SELECT * FROM offers WHERE id = ?");
    const rows = await this.client.query<Omit<Offer, "lineItems">>(query, [id]);
    if (!rows[0]) return null;
    
    const offer = mapFromSQL(rows[0]) as Omit<Offer, "lineItems">;
    const lineItemQuery = `SELECT id, title, description, quantity, unit_price, total, parent_item_id FROM offer_line_items WHERE offer_id = ? ORDER BY id`;
    const lineItems = await this.client.query<{
      id: number;
      title: string;
      description: string | null;
      quantity: number;
      unit_price: number;
      total: number;
      parent_item_id: number | null;
    }>(lineItemQuery, [id]);
    
    return {
      ...offer,
      lineItems: lineItems.map(item => {
        const mappedItem = mapFromSQL(item);
        return {
          id: mappedItem.id,
          title: mappedItem.title,
          description: mappedItem.description || undefined,
          quantity: mappedItem.quantity,
          unitPrice: mappedItem.unitPrice,
          total: mappedItem.total,
          parentItemId: mappedItem.parentItemId || undefined
        };
      })
    };
  }

  async createOffer(data: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<Offer> {
    const ts = nowIso();
    
    // Map offer data to SQL format
    const mappedOfferData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
    
    const result = await this.client.exec(
      `
      INSERT INTO offers (offer_number, customer_id, title, status, valid_until, subtotal, vat_rate, vat_amount, total, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        mappedOfferData.offer_number,
        mappedOfferData.customer_id,
        mappedOfferData.title,
        mappedOfferData.status,
        mappedOfferData.valid_until,
        mappedOfferData.subtotal,
        mappedOfferData.vat_rate,
        mappedOfferData.vat_amount,
        mappedOfferData.total,
        mappedOfferData.notes || null,
        mappedOfferData.created_at,
        mappedOfferData.updated_at,
      ]
    );
    
    const offerId = result.lastInsertRowid;
    
    for (const item of data.lineItems) {
      const mappedItem = mapToSQL(item);
      await this.client.exec(
        `INSERT INTO offer_line_items (offer_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [offerId, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, mappedItem.parent_item_id || null]
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

    // Map to SQL format
    const mappedNext = mapToSQL(next);

    await this.client.exec(
      `
      UPDATE offers SET
        offer_number = ?, customer_id = ?, title = ?, status = ?, valid_until = ?, 
        subtotal = ?, vat_rate = ?, vat_amount = ?, total = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
      [
        mappedNext.offer_number,
        mappedNext.customer_id,
        mappedNext.title,
        mappedNext.status,
        mappedNext.valid_until,
        mappedNext.subtotal,
        mappedNext.vat_rate,
        mappedNext.vat_amount,
        mappedNext.total,
        mappedNext.notes || null,
        mappedNext.updated_at,
        id,
      ]
    );

    if (patch.lineItems) {
      await this.client.exec(`DELETE FROM offer_line_items WHERE offer_id = ?`, [id]);
      for (const item of patch.lineItems) {
        const mappedItem = mapToSQL(item);
        await this.client.exec(
          `INSERT INTO offer_line_items (offer_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, mappedItem.parent_item_id || null]
        );
      }
    }

    const updated = await this.getOffer(id);
    if (!updated) throw new Error("Offer update failed");
    return updated;
  }

  async deleteOffer(id: number): Promise<void> {
    await this.client.transaction([
      { sql: `DELETE FROM offer_line_items WHERE offer_id = ?`, params: [id] },
      { sql: `DELETE FROM offers WHERE id = ?`, params: [id] }
    ]);
  }

  // INVOICES
  async listInvoices(): Promise<Invoice[]> {
    const query = convertSQLQuery(`SELECT * FROM invoices ORDER BY createdAt DESC`);
    const invoices = await this.client.query<Omit<Invoice, "lineItems">>(query);
    
    const result: Invoice[] = [];
    for (const invoice of invoices) {
      const mappedInvoice = mapFromSQL(invoice) as Omit<Invoice, "lineItems">;
      const lineItemQuery = `SELECT id, title, description, quantity, unit_price, total, parent_item_id FROM invoice_line_items WHERE invoice_id = ? ORDER BY id`;
      const lineItems = await this.client.query<{
        id: number;
        title: string;
        description: string | null;
        quantity: number;
        unit_price: number;
        total: number;
        parent_item_id: number | null;
      }>(lineItemQuery, [invoice.id]);
      
      result.push({
        ...mappedInvoice,
        lineItems: lineItems.map(item => {
          const mappedItem = mapFromSQL(item);
          return {
            id: mappedItem.id,
            title: mappedItem.title,
            description: mappedItem.description || undefined,
            quantity: mappedItem.quantity,
            unitPrice: mappedItem.unitPrice,
            total: mappedItem.total,
            parentItemId: mappedItem.parentItemId || undefined
          };
        })
      });
    }
    return result;
  }

  async getInvoice(id: number): Promise<Invoice | null> {
    const query = convertSQLQuery("SELECT * FROM invoices WHERE id = ?");
    const rows = await this.client.query<Omit<Invoice, "lineItems">>(query, [id]);
    if (!rows[0]) return null;
    
    const invoice = mapFromSQL(rows[0]) as Omit<Invoice, "lineItems">;
    const lineItemQuery = `SELECT id, title, description, quantity, unit_price, total, parent_item_id FROM invoice_line_items WHERE invoice_id = ? ORDER BY id`;
    const lineItems = await this.client.query<{
      id: number;
      title: string;
      description: string | null;
      quantity: number;
      unit_price: number;
      total: number;
      parent_item_id: number | null;
    }>(lineItemQuery, [id]);
    
    return {
      ...invoice,
      lineItems: lineItems.map(item => {
        const mappedItem = mapFromSQL(item);
        return {
          id: mappedItem.id,
          title: mappedItem.title,
          description: mappedItem.description || undefined,
          quantity: mappedItem.quantity,
          unitPrice: mappedItem.unitPrice,
          total: mappedItem.total,
          parentItemId: mappedItem.parentItemId || undefined
        };
      })
    };
  }

  async createInvoice(data: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    const ts = nowIso();
    
    // Map invoice data to SQL format
    const mappedInvoiceData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
    
    const result = await this.client.exec(
      `
      INSERT INTO invoices (invoice_number, customer_id, offer_id, title, status, due_date, subtotal, vat_rate, vat_amount, total, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        mappedInvoiceData.invoice_number,
        mappedInvoiceData.customer_id,
        mappedInvoiceData.offer_id || null,
        mappedInvoiceData.title,
        mappedInvoiceData.status,
        mappedInvoiceData.due_date,
        mappedInvoiceData.subtotal,
        mappedInvoiceData.vat_rate,
        mappedInvoiceData.vat_amount,
        mappedInvoiceData.total,
        mappedInvoiceData.notes || null,
        mappedInvoiceData.created_at,
        mappedInvoiceData.updated_at,
      ]
    );
    
    const invoiceId = result.lastInsertRowid;
    
    for (const item of data.lineItems) {
      const mappedItem = mapToSQL(item);
      await this.client.exec(
        `INSERT INTO invoice_line_items (invoice_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, mappedItem.parent_item_id || null]
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

    // Map to SQL format
    const mappedNext = mapToSQL(next);

    await this.client.exec(
      `
      UPDATE invoices SET
        invoice_number = ?, customer_id = ?, offer_id = ?, title = ?, status = ?, due_date = ?, 
        subtotal = ?, vat_rate = ?, vat_amount = ?, total = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
      [
        mappedNext.invoice_number,
        mappedNext.customer_id,
        mappedNext.offer_id || null,
        mappedNext.title,
        mappedNext.status,
        mappedNext.due_date,
        mappedNext.subtotal,
        mappedNext.vat_rate,
        mappedNext.vat_amount,
        mappedNext.total,
        mappedNext.notes || null,
        mappedNext.updated_at,
        id,
      ]
    );

    if (patch.lineItems) {
      await this.client.exec(`DELETE FROM invoice_line_items WHERE invoice_id = ?`, [id]);
      for (const item of patch.lineItems) {
        const mappedItem = mapToSQL(item);
        await this.client.exec(
          `INSERT INTO invoice_line_items (invoice_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, mappedItem.parent_item_id || null]
        );
      }
    }

    const updated = await this.getInvoice(id);
    if (!updated) throw new Error("Invoice update failed");
    return updated;
  }

  async deleteInvoice(id: number): Promise<void> {
    await this.client.transaction([
      { sql: `DELETE FROM invoice_line_items WHERE invoice_id = ?`, params: [id] },
      { sql: `DELETE FROM invoices WHERE id = ?`, params: [id] }
    ]);
  }
}
