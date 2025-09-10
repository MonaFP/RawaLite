import { PersistenceAdapter, Settings, Customer, Package, Offer, Invoice } from "../persistence/adapter";
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

  // PACKAGES
  async listPackages(): Promise<Package[]> {
    await getDB();
    const packages = all<Omit<Package, "lineItems">>(`SELECT * FROM packages ORDER BY createdAt DESC`);
    
    // Load line items for each package
    const result: Package[] = [];
    for (const pkg of packages) {
      const lineItems = all<any>(`SELECT id, title, quantity, amount, parentItemId, description FROM package_line_items WHERE packageId = ? ORDER BY id`, [pkg.id]);
      result.push({
        ...pkg,
        lineItems: lineItems.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          amount: item.amount,
          parentItemId: item.parentItemId || undefined,
          description: item.description || undefined
        }))
      });
    }
    return result;
  }

  async getPackage(id: number): Promise<Package | null> {
    await getDB();
    const rows = all<Omit<Package, "lineItems">>(`SELECT * FROM packages WHERE id = ?`, [id]);
    if (!rows[0]) return null;
    
    const pkg = rows[0];
    const lineItems = all<any>(`SELECT id, title, quantity, amount, parentItemId, description FROM package_line_items WHERE packageId = ? ORDER BY id`, [id]);
    
    return {
      ...pkg,
      lineItems: lineItems.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        amount: item.amount,
        parentItemId: item.parentItemId || undefined,
        description: item.description || undefined
      }))
    };
  }

  async createPackage(data: Omit<Package, "id" | "createdAt" | "updatedAt">): Promise<Package> {
    return withTx(async () => {
      const ts = nowIso();
      
      // Insert package
      run(
        `
        INSERT INTO packages (internalTitle, parentPackageId, total, addVat, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          data.internalTitle,
          data.parentPackageId ?? null,
          data.total,
          data.addVat ? 1 : 0,
          ts,
          ts,
        ]
      );
      
      const packageRows = all<{ id: number }>(`SELECT id FROM packages WHERE rowid = last_insert_rowid()`);
      const packageId = packageRows[0].id;
      
      // Insert line items
      for (const item of data.lineItems) {
        run(
          `INSERT INTO package_line_items (packageId, title, quantity, amount, parentItemId, description) VALUES (?, ?, ?, ?, ?, ?)`,
          [packageId, item.title, item.quantity, item.amount, item.parentItemId || null, item.description || null]
        );
      }
      
      const newPackage = await this.getPackage(packageId);
      if (!newPackage) throw new Error("Package creation failed");
      return newPackage;
    });
  }

  async updatePackage(id: number, patch: Partial<Package>): Promise<Package> {
    return withTx(async () => {
      const current = await this.getPackage(id);
      if (!current) throw new Error("Package not found");

      const next = {
        ...current,
        ...patch,
        updatedAt: nowIso(),
      };

      // Update package
      run(
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
        run(`DELETE FROM package_line_items WHERE packageId = ?`, [id]);
        
        // Insert new line items
        for (const item of patch.lineItems) {
          run(
            `INSERT INTO package_line_items (packageId, title, quantity, amount, parentItemId, description) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, item.title, item.quantity, item.amount, item.parentItemId || null, item.description || null]
          );
        }
      }

      const updated = await this.getPackage(id);
      if (!updated) throw new Error("Package update failed");
      return updated;
    });
  }

  async deletePackage(id: number): Promise<void> {
    await withTx(async () => {
      // Delete line items first
      run(`DELETE FROM package_line_items WHERE packageId = ?`, [id]);
      // Delete package
      run(`DELETE FROM packages WHERE id = ?`, [id]);
    });
  }

  // OFFERS
  async listOffers(): Promise<Offer[]> {
    await getDB();
    const offers = all<Omit<Offer, "lineItems">>(`SELECT * FROM offers ORDER BY createdAt DESC`);
    
    const result: Offer[] = [];
    for (const offer of offers) {
      const lineItems = all<any>(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM offer_line_items WHERE offerId = ? ORDER BY id`, [offer.id]);
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
    await getDB();
    const rows = all<Omit<Offer, "lineItems">>(`SELECT * FROM offers WHERE id = ?`, [id]);
    if (!rows[0]) return null;
    
    const offer = rows[0];
    const lineItems = all<any>(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM offer_line_items WHERE offerId = ? ORDER BY id`, [id]);
    
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
    return withTx(async () => {
      const ts = nowIso();
      
      run(
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
      
      const offerRows = all<{ id: number }>(`SELECT id FROM offers WHERE rowid = last_insert_rowid()`);
      const offerId = offerRows[0].id;
      
      for (const item of data.lineItems) {
        run(
          `INSERT INTO offer_line_items (offerId, title, description, quantity, unitPrice, total, parentItemId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [offerId, item.title, item.description || null, item.quantity, item.unitPrice, item.total, item.parentItemId || null]
        );
      }
      
      const newOffer = await this.getOffer(offerId);
      if (!newOffer) throw new Error("Offer creation failed");
      return newOffer;
    });
  }

  async updateOffer(id: number, patch: Partial<Offer>): Promise<Offer> {
    return withTx(async () => {
      const current = await this.getOffer(id);
      if (!current) throw new Error("Offer not found");

      const next = { ...current, ...patch, updatedAt: nowIso() };

      run(
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
        run(`DELETE FROM offer_line_items WHERE offerId = ?`, [id]);
        for (const item of patch.lineItems) {
          run(
            `INSERT INTO offer_line_items (offerId, title, description, quantity, unitPrice, total, parentItemId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, item.title, item.description || null, item.quantity, item.unitPrice, item.total, item.parentItemId || null]
          );
        }
      }

      const updated = await this.getOffer(id);
      if (!updated) throw new Error("Offer update failed");
      return updated;
    });
  }

  async deleteOffer(id: number): Promise<void> {
    await withTx(async () => {
      run(`DELETE FROM offer_line_items WHERE offerId = ?`, [id]);
      run(`DELETE FROM offers WHERE id = ?`, [id]);
    });
  }

  // INVOICES
  async listInvoices(): Promise<Invoice[]> {
    await getDB();
    const invoices = all<Omit<Invoice, "lineItems">>(`SELECT * FROM invoices ORDER BY createdAt DESC`);
    
    const result: Invoice[] = [];
    for (const invoice of invoices) {
      const lineItems = all<any>(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM invoice_line_items WHERE invoiceId = ? ORDER BY id`, [invoice.id]);
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
    await getDB();
    const rows = all<Omit<Invoice, "lineItems">>(`SELECT * FROM invoices WHERE id = ?`, [id]);
    if (!rows[0]) return null;
    
    const invoice = rows[0];
    const lineItems = all<any>(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM invoice_line_items WHERE invoiceId = ? ORDER BY id`, [id]);
    
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
    return withTx(async () => {
      const ts = nowIso();
      
      run(
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
      
      const invoiceRows = all<{ id: number }>(`SELECT id FROM invoices WHERE rowid = last_insert_rowid()`);
      const invoiceId = invoiceRows[0].id;
      
      for (const item of data.lineItems) {
        run(
          `INSERT INTO invoice_line_items (invoiceId, title, description, quantity, unitPrice, total, parentItemId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [invoiceId, item.title, item.description || null, item.quantity, item.unitPrice, item.total, item.parentItemId || null]
        );
      }
      
      const newInvoice = await this.getInvoice(invoiceId);
      if (!newInvoice) throw new Error("Invoice creation failed");
      return newInvoice;
    });
  }

  async updateInvoice(id: number, patch: Partial<Invoice>): Promise<Invoice> {
    return withTx(async () => {
      const current = await this.getInvoice(id);
      if (!current) throw new Error("Invoice not found");

      const next = { ...current, ...patch, updatedAt: nowIso() };

      run(
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
        run(`DELETE FROM invoice_line_items WHERE invoiceId = ?`, [id]);
        for (const item of patch.lineItems) {
          run(
            `INSERT INTO invoice_line_items (invoiceId, title, description, quantity, unitPrice, total, parentItemId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, item.title, item.description || null, item.quantity, item.unitPrice, item.total, item.parentItemId || null]
          );
        }
      }

      const updated = await this.getInvoice(id);
      if (!updated) throw new Error("Invoice update failed");
      return updated;
    });
  }

  async deleteInvoice(id: number): Promise<void> {
    await withTx(async () => {
      run(`DELETE FROM invoice_line_items WHERE invoiceId = ?`, [id]);
      run(`DELETE FROM invoices WHERE id = ?`, [id]);
    });
  }
}
