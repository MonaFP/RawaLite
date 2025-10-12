import type { PersistenceAdapter, Settings, Customer, Offer, Invoice, Package, Activity, Timesheet, TimesheetActivity, OfferAttachment, InvoiceAttachment } from "../persistence/adapter";
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

  // SETTINGS
  async getSettings(): Promise<Settings> {
    const query = convertSQLQuery("SELECT * FROM settings LIMIT 1");
    const rows = await this.client.query<any>(query);
    
    if (rows.length === 0) {
      const defaultSettings: Settings = {
        id: 1,
        companyName: "",
        street: "",
        zip: "",
        city: "",
        taxId: "",
        kleinunternehmer: false,
        nextCustomerNumber: 1,
        nextOfferNumber: 1,
        nextInvoiceNumber: 1,
        // Auto-Update Preferences (Migration 018)
        autoUpdateEnabled: true,
        autoUpdateCheckFrequency: 'daily',
        autoUpdateNotificationStyle: 'subtle',
        autoUpdateReminderInterval: 7,
        autoUpdateAutoDownload: false,
        autoUpdateInstallPrompt: 'manual',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      
      const mappedSettings = mapToSQL(defaultSettings);
      await this.client.exec(
        `
        INSERT INTO settings (id, company_name, street, zip, city, tax_id, kleinunternehmer, next_customer_number, next_offer_number, next_invoice_number, 
                            auto_update_enabled, auto_update_check_frequency, auto_update_notification_style, auto_update_reminder_interval,
                            auto_update_auto_download, auto_update_install_prompt, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          mappedSettings.id,
          mappedSettings.company_name || "",
          mappedSettings.street || "",
          mappedSettings.zip || "",
          mappedSettings.city || "",
          mappedSettings.tax_id || "",
          mappedSettings.kleinunternehmer ? 1 : 0,
          mappedSettings.next_customer_number || 1,
          mappedSettings.next_offer_number || 1,
          mappedSettings.next_invoice_number || 1,
          mappedSettings.auto_update_enabled ? 1 : 0,
          mappedSettings.auto_update_check_frequency || 'daily',
          mappedSettings.auto_update_notification_style || 'subtle',
          mappedSettings.auto_update_reminder_interval || 7,
          mappedSettings.auto_update_auto_download ? 1 : 0,
          mappedSettings.auto_update_install_prompt || 'manual',
          mappedSettings.created_at,
          mappedSettings.updated_at,
        ]
      );
      return defaultSettings;
    }

    // ✅ RÜCKWÄRTSKOMPATIBILITÄT: Robust handling von Settings aus verschiedenen Versionen
    const rawSettings = rows[0];
    
    // Extract nur bekannte Felder - ignoriere unbekannte (updateChannel, featureFlags etc.)
    const cleanSettings: Settings = {
      id: rawSettings.id || 1,
      companyName: rawSettings.company_name || "",
      street: rawSettings.street || "",
      zip: rawSettings.zip || "",
      city: rawSettings.city || "",
      taxId: rawSettings.tax_id || "",
      kleinunternehmer: Boolean(rawSettings.kleinunternehmer),
      nextCustomerNumber: rawSettings.next_customer_number || 1,
      nextOfferNumber: rawSettings.next_offer_number || 1,
      nextInvoiceNumber: rawSettings.next_invoice_number || 1,
      
      // Auto-Update Preferences (Migration 018) - mit Fallbacks
      autoUpdateEnabled: rawSettings.auto_update_enabled !== undefined ? Boolean(rawSettings.auto_update_enabled) : true,
      autoUpdateCheckFrequency: rawSettings.auto_update_check_frequency || 'daily',
      autoUpdateNotificationStyle: rawSettings.auto_update_notification_style || 'subtle',
      autoUpdateReminderInterval: rawSettings.auto_update_reminder_interval || 7,
      autoUpdateAutoDownload: rawSettings.auto_update_auto_download !== undefined ? Boolean(rawSettings.auto_update_auto_download) : false,
      autoUpdateInstallPrompt: rawSettings.auto_update_install_prompt || 'manual',
      
      createdAt: rawSettings.created_at || nowIso(),
      updatedAt: rawSettings.updated_at || nowIso(),
      
      // BEWUSST IGNORIERT: updateChannel, featureFlags (v1.0.41 legacy)
      // Diese Felder werden durch Migration 020 entfernt
    };

    return cleanSettings;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const next = { ...current, ...patch, updatedAt: nowIso() };
    
    const mappedNext = mapToSQL(next);
    
    await this.client.exec(
      `
      UPDATE settings SET
        company_name = ?, street = ?, zip = ?, city = ?, phone = ?, email = ?, website = ?, 
        tax_id = ?, vat_id = ?, kleinunternehmer = ?, bank_name = ?, bank_account = ?, bank_bic = ?, 
        logo = ?, next_customer_number = ?, next_offer_number = ?, next_invoice_number = ?,
        auto_update_enabled = ?, auto_update_check_frequency = ?, auto_update_notification_style = ?,
        auto_update_reminder_interval = ?, auto_update_auto_download = ?, auto_update_install_prompt = ?,
        update_channel = ?, feature_flags = ?, updated_at = ?
      WHERE id = ?
    `,
      [
        mappedNext.company_name || "",
        mappedNext.street || "",
        mappedNext.zip || "",
        mappedNext.city || "",
        mappedNext.phone || "",
        mappedNext.email || "",
        mappedNext.website || "",
        mappedNext.tax_id || "",
        mappedNext.vat_id || "",
        mappedNext.kleinunternehmer ? 1 : 0,
        mappedNext.bank_name || "",
        mappedNext.bank_account || "",
        mappedNext.bank_bic || "",
        mappedNext.logo || "",
        mappedNext.next_customer_number || 1,
        mappedNext.next_offer_number || 1,
        mappedNext.next_invoice_number || 1,
        mappedNext.auto_update_enabled ? 1 : 0,
        mappedNext.auto_update_check_frequency || 'daily',
        mappedNext.auto_update_notification_style || 'subtle',
        mappedNext.auto_update_reminder_interval || 7,
        mappedNext.auto_update_auto_download ? 1 : 0,
        mappedNext.auto_update_install_prompt || 'manual',
        mappedNext.update_channel || 'stable',
        JSON.stringify(mappedNext.feature_flags || {}),
        mappedNext.updated_at,
        next.id,
      ]
    );
    
    return next;
  }

  // CUSTOMERS
  async listCustomers(): Promise<Customer[]> {
    const query = convertSQLQuery("SELECT * FROM customers ORDER BY createdAt DESC");
    const rows = await this.client.query<any>(query);
    return mapFromSQLArray(rows) as Customer[];
  }

  async getCustomer(id: number): Promise<Customer | null> {
    const query = convertSQLQuery("SELECT * FROM customers WHERE id = ?");
    const rows = await this.client.query<any>(query, [id]);
    if (rows.length === 0) return null;
    return mapFromSQL(rows[0]) as Customer;
  }

  async createCustomer(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    const ts = nowIso();
    
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
      const lineItemQuery = convertSQLQuery(`SELECT id, title, quantity, amount, parentItemId, description FROM packageLineItems WHERE packageId = ? ORDER BY id`);
      const lineItemRows = await this.client.query<any>(lineItemQuery, [pkg.id]);
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
    const lineItemQuery = convertSQLQuery(`SELECT id, title, quantity, amount, parentItemId, description FROM packageLineItems WHERE packageId = ? ORDER BY id`);
    const lineItemRows = await this.client.query<any>(lineItemQuery, [id]);
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

    // 🎯 CRITICAL FIX: ID Mapping System for FOREIGN KEY constraint compliance  
    // Create ID mapping for frontend negative IDs to database positive IDs
    const idMapping: Record<number, number> = {};

    // Sort items - main items first, then sub-items to ensure parent_item_id references exist
    const mainItems = data.lineItems.filter(item => !item.parentItemId);
    const subItems = data.lineItems.filter(item => item.parentItemId);

    console.log(`🔧 CREATE PACKAGE: Starting with ${data.lineItems.length} total items`);
    console.log(`🔧 CREATE PACKAGE: Found ${mainItems.length} main items and ${subItems.length} sub-items`);

    // Insert main items first and build ID mapping for ALL IDs
    for (const item of mainItems) {
      const mappedItem = mapToSQL(item);
      const itemResult = await this.client.exec(
        `INSERT INTO package_line_items (package_id, title, quantity, amount, parent_item_id, description) VALUES (?, ?, ?, ?, ?, ?)`,
        [packageId, mappedItem.title, mappedItem.quantity, mappedItem.amount, null, mappedItem.description || null]
      );

      // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
      idMapping[item.id] = Number(itemResult.lastInsertRowid);
      
      console.log(`🔧 CREATE PACKAGE ID Mapping: Frontend ID ${item.id} → Database ID ${idMapping[item.id]}`);
    }

    // Then insert sub-items with correct parent references
    for (const item of subItems) {
      const mappedItem = mapToSQL(item);

      // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
      let resolvedParentId = null;
      if (item.parentItemId) {
        resolvedParentId = idMapping[item.parentItemId] || null;
        console.log(`🔧 CREATE PACKAGE Sub-Item ID Mapping: Sub-Item ${item.id} → Parent ${item.parentItemId} → Resolved Parent DB ID ${resolvedParentId}`);
      }

      const itemResult = await this.client.exec(
        `INSERT INTO package_line_items (package_id, title, quantity, amount, parent_item_id, description) VALUES (?, ?, ?, ?, ?, ?)`,
        [packageId, mappedItem.title, mappedItem.quantity, mappedItem.amount, resolvedParentId, mappedItem.description || null]
      );

      // Map sub-item ID as well for potential nested sub-items
      idMapping[item.id] = Number(itemResult.lastInsertRowid);
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
      
      console.log(`🔧 UPDATE PACKAGE: Starting with ${patch.lineItems.length} total items`);
      
      // 🎯 CRITICAL FIX: ID Mapping System for FOREIGN KEY constraint compliance
      // Create ID mapping for frontend negative IDs to database positive IDs
      const idMapping: Record<number, number> = {};

      // Sort items - main items first, then sub-items
      const mainItems = patch.lineItems.filter(item => !item.parentItemId);
      const subItems = patch.lineItems.filter(item => item.parentItemId);
      
      console.log(`🔧 UPDATE PACKAGE: Found ${mainItems.length} main items and ${subItems.length} sub-items`);
      console.log(`🔧 UPDATE PACKAGE: Main items:`, mainItems.map(i => `${i.id}:${i.title}`));
      console.log(`🔧 UPDATE PACKAGE: Sub items:`, subItems.map(i => `${i.id}:${i.title} (parent: ${i.parentItemId})`));

      // Insert main items first and build ID mapping for ALL IDs
      for (const item of mainItems) {
        const mappedItem = mapToSQL(item);
        const mainItemResult = await this.client.exec(
          `INSERT INTO package_line_items (package_id, title, quantity, amount, parent_item_id, description) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.quantity, mappedItem.amount, null, mappedItem.description || null]
        );

        // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
        idMapping[item.id] = Number(mainItemResult.lastInsertRowid);
        
        console.log(`🔧 UPDATE PACKAGE ID Mapping: Frontend ID ${item.id} → Database ID ${idMapping[item.id]}`);
      }
      
      console.log(`🔧 UPDATE PACKAGE: Final ID mapping:`, idMapping);

      // Then insert sub-items with correct parent references
      for (const item of subItems) {
        const mappedItem = mapToSQL(item);

        // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
        let resolvedParentId = null;
        if (item.parentItemId) {
          resolvedParentId = idMapping[item.parentItemId] || null;
          console.log(`🔧 UPDATE PACKAGE Sub-Item ID Mapping: Sub-Item ${item.id} → Parent ${item.parentItemId} → Resolved Parent DB ID ${resolvedParentId}`);
        }

        const subItemResult = await this.client.exec(
          `INSERT INTO package_line_items (package_id, title, quantity, amount, parent_item_id, description) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.quantity, mappedItem.amount, resolvedParentId, mappedItem.description || null]
        );

        // Map sub-item ID as well for potential nested sub-items
        idMapping[item.id] = Number(subItemResult.lastInsertRowid);
        
        console.log(`🔧 UPDATE PACKAGE Sub-Item inserted with parent_item_id: ${resolvedParentId}`);
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
    console.log('🔧 [SQLiteAdapter.listOffers] Starting offers query...');
    
    const query = convertSQLQuery(`SELECT * FROM offers ORDER BY createdAt DESC`);
    console.log('🔧 [SQLiteAdapter.listOffers] Main query:', query);
    
    const offers = await this.client.query<Omit<Offer, "lineItems">>(query);
    console.log('🔧 [SQLiteAdapter.listOffers] Raw offers from DB:', offers.length, offers[0]);
    
    const result: Offer[] = [];
    for (const offer of offers) {
      const mappedOffer = mapFromSQL(offer) as Omit<Offer, "lineItems">;
      console.log('🔧 [SQLiteAdapter.listOffers] Mapped offer:', mappedOffer);
      
      // FIX: Use snake_case field names and mapFromSQL for consistency
      const lineItemQuery = convertSQLQuery(`SELECT id, title, description, quantity, unit_price, total, parent_item_id, item_type, source_package_id FROM offer_line_items WHERE offer_id = ? ORDER BY id`);
      console.log('🔧 [SQLiteAdapter.listOffers] LineItem query:', lineItemQuery);
      
      const lineItems = await this.client.query<{
        id: number;
        title: string;
        description: string | null;
        quantity: number;
        unit_price: number;
        total: number;
        parent_item_id: number | null;
        item_type?: string;
        source_package_id?: number;
      }>(lineItemQuery, [offer.id]);

      console.log('🔧 [SQLiteAdapter.listOffers] LineItems for offer', offer.id, ':', lineItems);

      result.push({
        ...mappedOffer,
        lineItems: lineItems.map(item => {
          // Use mapFromSQL for consistent snake_case to camelCase conversion
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
    
    console.log('🔧 [SQLiteAdapter.listOffers] Final result:', result.length, 'offers');
    return result;
  }

  async getOffer(id: number): Promise<Offer | null> {
    const query = convertSQLQuery("SELECT * FROM offers WHERE id = ?");
    const rows = await this.client.query<Omit<Offer, "lineItems">>(query, [id]);
    if (!rows[0]) return null;

    const offer = mapFromSQL(rows[0]) as Omit<Offer, "lineItems">;
    const lineItemQuery = convertSQLQuery(`SELECT id, title, description, quantity, unit_price, total, parent_item_id, item_type, source_package_id FROM offer_line_items WHERE offer_id = ? ORDER BY id`);
    const lineItems = await this.client.query<{
      id: number;
      title: string;
      description: string | null;
      quantity: number;
      unit_price: number;
      total: number;
      parent_item_id: number | null;
      item_type?: string;
      source_package_id?: number;
    }>(lineItemQuery, [id]);

    // Load attachments for each line item
    const lineItemsWithAttachments = await Promise.all(
      lineItems.map(async (item) => {
        console.log(`🔍 [DB] Loading attachments for line item ${item.id} in offer ${id}`);
        const attachments = await this.getOfferAttachments(id, item.id);
        console.log(`🔍 [DB] Found ${attachments.length} attachments for line item ${item.id}`);
        if (attachments.length > 0) {
          attachments.forEach((att, index) => {
            console.log(`🔍 [DB] Attachment ${index + 1}: ${att.originalFilename} (base64 length: ${att.base64Data?.length || 'NULL'})`);
          });
        }
        
        // Use mapFromSQL to properly convert snake_case to camelCase
        const mappedItem = mapFromSQL(item);
        
        return {
          id: mappedItem.id,
          title: mappedItem.title,
          description: mappedItem.description || undefined,
          quantity: mappedItem.quantity,
          unitPrice: mappedItem.unitPrice,
          total: mappedItem.total,
          parentItemId: mappedItem.parentItemId || undefined,
          attachments: attachments
        };
      })
    );

    return {
      ...offer,
      lineItems: lineItemsWithAttachments
    };
  }

  async createOffer(data: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<Offer> {
    const ts = nowIso();

    // Map offer data to SQL format
    const mappedOfferData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
    
    const result = await this.client.exec(
      `
      INSERT INTO offers (offer_number, customer_id, title, status, valid_until, subtotal, vat_rate, vat_amount, total, notes, discount_type, discount_value, discount_amount, subtotal_before_discount, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        mappedOfferData.discount_type || 'none',
        mappedOfferData.discount_value || 0,
        mappedOfferData.discount_amount || 0,
        mappedOfferData.subtotal_before_discount || mappedOfferData.subtotal,
        mappedOfferData.created_at,
        mappedOfferData.updated_at,
      ]
    );

    const offerId = result.lastInsertRowid;

    // Create ID mapping for frontend negative IDs to database positive IDs
    const idMapping: Record<number, number> = {};

    // Sort items - main items first, then sub-items to ensure parent_item_id references exist
    const mainItems = data.lineItems.filter(item => !item.parentItemId);
    const subItems = data.lineItems.filter(item => item.parentItemId);

    // Insert main items first and build ID mapping for ALL IDs
    for (const item of mainItems) {
      const mappedItem = mapToSQL(item);
      const itemResult = await this.client.exec(
        `INSERT INTO offer_line_items (offer_id, title, description, quantity, unit_price, total, parent_item_id, item_type, source_package_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [offerId, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, null, item.itemType || 'standalone', item.sourcePackageId || null]
      );

      // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
      idMapping[item.id] = Number(itemResult.lastInsertRowid);
      
      console.log(`🔧 CREATE ID Mapping: Frontend ID ${item.id} → Database ID ${idMapping[item.id]}`);
    }

    // Then insert sub-items with correct parent references
    for (const item of subItems) {
      const mappedItem = mapToSQL(item);

      // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
      let resolvedParentId = null;
      if (item.parentItemId) {
        resolvedParentId = idMapping[item.parentItemId] || null;
        console.log(`🔧 CREATE Sub-Item ID Mapping: Sub-Item ${item.id} → Parent ${item.parentItemId} → Resolved Parent DB ID ${resolvedParentId}`);
      }

      const itemResult = await this.client.exec(
        `INSERT INTO offer_line_items (offer_id, title, description, quantity, unit_price, total, parent_item_id, item_type, source_package_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [offerId, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, resolvedParentId, item.itemType || 'individual_sub', item.sourcePackageId || null]
      );

      // Map sub-item ID as well for potential nested sub-items
      idMapping[item.id] = Number(itemResult.lastInsertRowid);
    }

    // Process attachments for all line items
    if (data.lineItems) {
      for (const item of data.lineItems) {
        if (item.attachments && item.attachments.length > 0) {
          const dbLineItemId = idMapping[item.id];
          console.log(`📎 Processing ${item.attachments.length} attachments for line item ${item.id} (DB ID: ${dbLineItemId})`);
          
          for (const attachment of item.attachments) {
            // Only create attachments with negative IDs (new attachments)
            if (attachment.id < 0) {
              console.log(`📎 DEBUG: Creating attachment:`, {
                filename: attachment.filename,
                originalFilename: attachment.originalFilename,
                fileType: attachment.fileType,
                fileSize: attachment.fileSize,
                hasBase64: !!attachment.base64Data
              });
              
              await this.createOfferAttachment({
                offerId: Number(offerId),
                lineItemId: dbLineItemId,
                filename: attachment.filename,
                originalFilename: attachment.originalFilename,
                fileType: attachment.fileType,
                fileSize: attachment.fileSize,
                base64Data: attachment.base64Data,
                description: attachment.description
              });
              console.log(`📎 Created attachment: ${attachment.originalFilename}`);
            }
          }
        }
      }
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
        subtotal = ?, vat_rate = ?, vat_amount = ?, total = ?, notes = ?,
        discount_type = ?, discount_value = ?, discount_amount = ?, subtotal_before_discount = ?,
        sent_at = ?, accepted_at = ?, rejected_at = ?, updated_at = ?
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
        mappedNext.discount_type || 'none',
        mappedNext.discount_value || 0,
        mappedNext.discount_amount || 0,
        mappedNext.subtotal_before_discount || mappedNext.subtotal,
        mappedNext.sent_at || null,
        mappedNext.accepted_at || null,
        mappedNext.rejected_at || null,
        mappedNext.updated_at,
        id,
      ]
    );

    if (patch.lineItems) {
      await this.client.exec(`DELETE FROM offer_line_items WHERE offer_id = ?`, [id]);
      
      console.log(`🔧 UPDATE: Starting with ${patch.lineItems.length} total items`);
      
      // Create ID mapping for frontend negative IDs to database positive IDs
      const idMapping: Record<number, number> = {};

      // Sort items - main items first, then sub-items
      const mainItems = patch.lineItems.filter(item => !item.parentItemId);
      const subItems = patch.lineItems.filter(item => item.parentItemId);
      
      console.log(`🔧 UPDATE: Found ${mainItems.length} main items and ${subItems.length} sub-items`);
      console.log(`🔧 UPDATE: Main items:`, mainItems.map(i => `${i.id}:${i.title}`));
      console.log(`🔧 UPDATE: Sub items:`, subItems.map(i => `${i.id}:${i.title} (parent: ${i.parentItemId})`));

      // Insert main items first and build ID mapping for ALL IDs
      for (const item of mainItems) {
        const mappedItem = mapToSQL(item);
        const mainItemResult = await this.client.exec(
          `INSERT INTO offer_line_items (offer_id, title, description, quantity, unit_price, total, parent_item_id, item_type, source_package_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, null, item.itemType || 'standalone', item.sourcePackageId || null]
        );

        // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
        idMapping[item.id] = Number(mainItemResult.lastInsertRowid);
        
        console.log(`🔧 ID Mapping: Frontend ID ${item.id} → Database ID ${idMapping[item.id]}`);
      }
      
      console.log(`🔧 UPDATE: Final ID mapping:`, idMapping);

      // Then insert sub-items with correct parent references
      for (const item of subItems) {
        const mappedItem = mapToSQL(item);

        // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
        let resolvedParentId = null;
        if (item.parentItemId) {
          resolvedParentId = idMapping[item.parentItemId] || null;
          console.log(`🔧 Sub-Item ID Mapping: Sub-Item ${item.id} → Parent ${item.parentItemId} → Resolved Parent DB ID ${resolvedParentId}`);
        }

        const subItemResult = await this.client.exec(
          `INSERT INTO offer_line_items (offer_id, title, description, quantity, unit_price, total, parent_item_id, item_type, source_package_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, resolvedParentId, item.itemType || 'individual_sub', item.sourcePackageId || null]
        );

        // Map sub-item ID as well for potential nested sub-items
        idMapping[item.id] = Number(subItemResult.lastInsertRowid);
        
        console.log(`🔧 Sub-Item inserted with parent_item_id: ${resolvedParentId}`);
      }

      // Process attachments for all line items
      // First, delete all existing attachments for this offer
      await this.client.exec(`DELETE FROM offer_attachments WHERE offer_id = ?`, [id]);
      
      for (const item of patch.lineItems) {
        if (item.attachments && item.attachments.length > 0) {
          const dbLineItemId = idMapping[item.id];
          console.log(`📎 UPDATE: Processing ${item.attachments.length} attachments for line item ${item.id} (DB ID: ${dbLineItemId})`);
          
          for (const attachment of item.attachments) {
            // Create all attachments (both new and existing ones being re-saved)
            await this.createOfferAttachment({
              offerId: id,
              lineItemId: dbLineItemId,
              filename: attachment.filename,
              originalFilename: attachment.originalFilename,
              fileType: attachment.fileType,
              fileSize: attachment.fileSize,
              base64Data: attachment.base64Data,
              description: attachment.description
            });
            console.log(`📎 UPDATE: Created attachment: ${attachment.originalFilename}`);
          }
        }
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
    console.log('🔧 [SQLiteAdapter.listInvoices] Starting invoices query...');
    
    const query = convertSQLQuery(`SELECT * FROM invoices ORDER BY createdAt DESC`);
    console.log('🔧 [SQLiteAdapter.listInvoices] Main query:', query);
    
    const invoices = await this.client.query<Omit<Invoice, "lineItems">>(query);
    console.log('🔧 [SQLiteAdapter.listInvoices] Raw invoices from DB:', invoices.length, invoices[0]);
    
    const result: Invoice[] = [];
    for (const invoice of invoices) {
      const mappedInvoice = mapFromSQL(invoice) as Omit<Invoice, "lineItems">;
      console.log('🔧 [SQLiteAdapter.listInvoices] Mapped invoice:', mappedInvoice);
      
      // FIX: Use consistent field-mapping instead of manual aliases
      const lineItemQuery = convertSQLQuery(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM invoice_line_items WHERE invoiceId = ? ORDER BY id`);
      console.log('🔧 [SQLiteAdapter.listInvoices] LineItem query:', lineItemQuery);
      
      const lineItems = await this.client.query<{
        id: number;
        title: string;
        description: string | null;
        quantity: number;
        unitPrice: number;
        total: number;
        parentItemId: number | null;
      }>(lineItemQuery, [invoice.id]);

      console.log('🔧 [SQLiteAdapter.listInvoices] LineItems for invoice', invoice.id, ':', lineItems);

      result.push({
        ...mappedInvoice,
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
    
    console.log('🔧 [SQLiteAdapter.listInvoices] Final result:', result.length, 'invoices');
    return result;
  }

  async getInvoice(id: number): Promise<Invoice | null> {
    const query = convertSQLQuery("SELECT * FROM invoices WHERE id = ?");
    const rows = await this.client.query<Omit<Invoice, "lineItems">>(query, [id]);
    if (!rows[0]) return null;

    const invoice = mapFromSQL(rows[0]) as Omit<Invoice, "lineItems">;
    const lineItemQuery = convertSQLQuery(`SELECT id, title, description, quantity, unitPrice, total, parentItemId FROM invoice_line_items WHERE invoiceId = ? ORDER BY id`);
    const lineItems = await this.client.query<{
      id: number;
      title: string;
      description: string | null;
      quantity: number;
      unit_price: number;
      total: number;
      parent_item_id: number | null;
    }>(lineItemQuery, [id]);

    // Load attachments for each line item
    const lineItemsWithAttachments = await Promise.all(
      lineItems.map(async (item) => {
        console.log(`🔍 [DB] Loading attachments for invoice line item ${item.id} in invoice ${id}`);
        const attachments = await this.getInvoiceAttachments(id, item.id);
        console.log(`🔍 [DB] Found ${attachments.length} attachments for invoice line item ${item.id}`);
        if (attachments.length > 0) {
          attachments.forEach((att, index) => {
            console.log(`🔍 [DB] Invoice Attachment ${index + 1}: ${att.originalFilename} (base64 length: ${att.base64Data?.length || 'NULL'})`);
          });
        }
        const mappedItem = mapFromSQL(item);
        return {
          id: mappedItem.id,
          title: mappedItem.title,
          description: mappedItem.description || undefined,
          quantity: mappedItem.quantity,
          unitPrice: mappedItem.unitPrice,
          total: mappedItem.total,
          parentItemId: mappedItem.parentItemId || undefined,
          attachments: attachments
        };
      })
    );

    return {
      ...invoice,
      lineItems: lineItemsWithAttachments
    };
  }

  async createInvoice(data: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    const ts = nowIso();

    // Map invoice data to SQL format
    const mappedInvoiceData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
    
    const result = await this.client.exec(
      `
      INSERT INTO invoices (invoice_number, customer_id, offer_id, title, status, due_date, subtotal, vat_rate, vat_amount, total, notes, discount_type, discount_value, discount_amount, subtotal_before_discount, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        mappedInvoiceData.discount_type || 'none',
        mappedInvoiceData.discount_value || 0,
        mappedInvoiceData.discount_amount || 0,
        mappedInvoiceData.subtotal_before_discount || mappedInvoiceData.subtotal,
        mappedInvoiceData.created_at,
        mappedInvoiceData.updated_at,
      ]
    );

    const invoiceId = result.lastInsertRowid;

    // 🎯 CRITICAL FIX: ID Mapping System for FOREIGN KEY constraint compliance
    // Create ID mapping for frontend negative IDs to database positive IDs
    const idMapping: Record<number, number> = {};

    // Sort items - main items first, then sub-items to ensure parent_item_id references exist
    const mainItems = data.lineItems.filter(item => !item.parentItemId);
    const subItems = data.lineItems.filter(item => item.parentItemId);

    console.log(`🔧 CREATE INVOICE: Starting with ${data.lineItems.length} total items`);
    console.log(`🔧 CREATE INVOICE: Found ${mainItems.length} main items and ${subItems.length} sub-items`);

    // Insert main items first and build ID mapping for ALL IDs
    for (const item of mainItems) {
      const mappedItem = mapToSQL(item);
      const itemResult = await this.client.exec(
        `INSERT INTO invoice_line_items (invoice_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, null]
      );

      // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
      idMapping[item.id] = Number(itemResult.lastInsertRowid);
      
      console.log(`🔧 CREATE INVOICE ID Mapping: Frontend ID ${item.id} → Database ID ${idMapping[item.id]}`);
    }

    // Then insert sub-items with correct parent references
    for (const item of subItems) {
      const mappedItem = mapToSQL(item);

      // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
      let resolvedParentId = null;
      if (item.parentItemId) {
        resolvedParentId = idMapping[item.parentItemId] || null;
        console.log(`🔧 CREATE INVOICE Sub-Item ID Mapping: Sub-Item ${item.id} → Parent ${item.parentItemId} → Resolved Parent DB ID ${resolvedParentId}`);
      }

      const itemResult = await this.client.exec(
        `INSERT INTO invoice_line_items (invoice_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, resolvedParentId]
      );

      // Map sub-item ID as well for potential nested sub-items
      idMapping[item.id] = Number(itemResult.lastInsertRowid);
    }

    // Process attachments for all line items (main and sub-items)
    for (const item of data.lineItems) {
      if (item.attachments && item.attachments.length > 0) {
        const dbLineItemId = idMapping[item.id];
        console.log(`📎 Processing ${item.attachments.length} attachments for invoice line item ${item.id} (DB ID: ${dbLineItemId})`);
        
        for (const attachment of item.attachments) {
          // Only create attachments with negative IDs (new attachments)
          if (attachment.id < 0) {
            console.log(`📎 DEBUG: Creating invoice attachment:`, {
              filename: attachment.filename,
              originalFilename: attachment.originalFilename,
              fileType: attachment.fileType,
              fileSize: attachment.fileSize,
              hasBase64: !!attachment.base64Data
            });
            
            await this.createInvoiceAttachment({
              invoiceId: Number(invoiceId),
              lineItemId: dbLineItemId,
              filename: attachment.filename,
              originalFilename: attachment.originalFilename,
              fileType: attachment.fileType,
              fileSize: attachment.fileSize,
              base64Data: attachment.base64Data,
              description: attachment.description
            });
            console.log(`📎 Created invoice attachment: ${attachment.originalFilename}`);
          }
        }
      }
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
        subtotal = ?, vat_rate = ?, vat_amount = ?, total = ?, notes = ?,
        discount_type = ?, discount_value = ?, discount_amount = ?, subtotal_before_discount = ?,
        sent_at = ?, paid_at = ?, overdue_at = ?, cancelled_at = ?, updated_at = ?
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
        mappedNext.discount_type || 'none',
        mappedNext.discount_value || 0,
        mappedNext.discount_amount || 0,
        mappedNext.subtotal_before_discount || mappedNext.subtotal,
        mappedNext.sent_at || null,
        mappedNext.paid_at || null,
        mappedNext.overdue_at || null,
        mappedNext.cancelled_at || null,
        mappedNext.updated_at,
        id,
      ]
    );

    if (patch.lineItems) {
      await this.client.exec(`DELETE FROM invoice_line_items WHERE invoice_id = ?`, [id]);
      
      console.log(`🔧 UPDATE INVOICE: Starting with ${patch.lineItems.length} total items`);
      
      // Create ID mapping for frontend negative IDs to database positive IDs
      const idMapping: Record<number, number> = {};

      // Sort items - main items first, then sub-items
      const mainItems = patch.lineItems.filter(item => !item.parentItemId);
      const subItems = patch.lineItems.filter(item => item.parentItemId);
      
      console.log(`🔧 UPDATE INVOICE: Found ${mainItems.length} main items and ${subItems.length} sub-items`);
      console.log(`🔧 UPDATE INVOICE: Main items:`, mainItems.map(i => `${i.id}:${i.title}`));
      console.log(`🔧 UPDATE INVOICE: Sub items:`, subItems.map(i => `${i.id}:${i.title} (parent: ${i.parentItemId})`));

      // Insert main items first and build ID mapping for ALL IDs
      for (const item of mainItems) {
        const mappedItem = mapToSQL(item);
        const mainItemResult = await this.client.exec(
          `INSERT INTO invoice_line_items (invoice_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, null]
        );

        // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
        idMapping[item.id] = Number(mainItemResult.lastInsertRowid);
        
        console.log(`🔧 UPDATE INVOICE ID Mapping: Frontend ID ${item.id} → Database ID ${idMapping[item.id]}`);
      }
      
      console.log(`🔧 UPDATE INVOICE: Final ID mapping:`, idMapping);

      // Then insert sub-items with correct parent references
      for (const item of subItems) {
        const mappedItem = mapToSQL(item);

        // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
        let resolvedParentId = null;
        if (item.parentItemId) {
          resolvedParentId = idMapping[item.parentItemId] || null;
          console.log(`🔧 UPDATE INVOICE Sub-Item ID Mapping: Sub-Item ${item.id} → Parent ${item.parentItemId} → Resolved Parent DB ID ${resolvedParentId}`);
        }

        const subItemResult = await this.client.exec(
          `INSERT INTO invoice_line_items (invoice_id, title, description, quantity, unit_price, total, parent_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, mappedItem.title, mappedItem.description || null, mappedItem.quantity, mappedItem.unit_price, mappedItem.total, resolvedParentId]
        );

        // Map sub-item ID as well for potential nested sub-items
        idMapping[item.id] = Number(subItemResult.lastInsertRowid);
        
        console.log(`🔧 UPDATE INVOICE Sub-Item inserted with parent_item_id: ${resolvedParentId}`);
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

  // ACTIVITIES
  async listActivities(): Promise<Activity[]> {
    const query = convertSQLQuery("SELECT * FROM activities ORDER BY is_active DESC, title ASC");
    const sqlRows = await this.client.query<any>(query);
    return mapFromSQLArray(sqlRows) as Activity[];
  }

  async getActivity(id: number): Promise<Activity | null> {
    const query = convertSQLQuery("SELECT * FROM activities WHERE id = ?");
    const rows = await this.client.query<any>(query, [id]);
    if (rows.length === 0) return null;
    return mapFromSQL(rows[0]) as Activity;
  }

  async createActivity(data: Omit<Activity, "id" | "createdAt" | "updatedAt">): Promise<Activity> {
    const ts = nowIso();

    // Map activity data to SQL format
    const mappedData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
    
    const result = await this.client.exec(
      `
      INSERT INTO activities (title, description, hourly_rate, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        mappedData.title,
        mappedData.description ?? null,
        mappedData.hourly_rate,
        mappedData.is_active ? 1 : 0,
        mappedData.created_at,
        mappedData.updated_at,
      ]
    );

    const newActivity = await this.getActivity(result.lastInsertRowid);
    if (!newActivity) throw new Error("Activity creation failed");
    return newActivity;
  }

  async updateActivity(id: number, patch: Partial<Activity>): Promise<Activity> {
    const current = await this.getActivity(id);
    if (!current) throw new Error("Activity not found");

    const next: Activity = {
      ...current,
      ...patch,
      updatedAt: nowIso(),
    };

    // Map to SQL format
    const mappedNext = mapToSQL(next);

    await this.client.exec(
      `
      UPDATE activities SET
        title = ?, description = ?, hourly_rate = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `,
      [
        mappedNext.title,
        mappedNext.description ?? null,
        mappedNext.hourly_rate,
        mappedNext.is_active ? 1 : 0,
        mappedNext.updated_at,
        id,
      ]
    );

    const row = await this.getActivity(id);
    if (!row) throw new Error("Activity update failed");
    return row;
  }

  async deleteActivity(id: number): Promise<void> {
    await this.client.exec(`DELETE FROM activities WHERE id = ?`, [id]);
  }

  // TIMESHEETS
  async listTimesheets(): Promise<Timesheet[]> {
    const query = convertSQLQuery(`SELECT * FROM timesheets ORDER BY createdAt DESC`);
    const timesheets = await this.client.query<Omit<Timesheet, "activities">>(query);
    
    const result: Timesheet[] = [];
    for (const timesheet of timesheets) {
      const mappedTimesheet = mapFromSQL(timesheet) as Omit<Timesheet, "activities">;
      const activitiesQuery = convertSQLQuery(`
        SELECT id, timesheetId, activityId, title, description, date, startTime, endTime, hours, hourlyRate, total, isBreak
        FROM timesheet_activities
        WHERE timesheetId = ?
        ORDER BY date ASC, startTime ASC
      `);
      const activities = await this.client.query<any>(activitiesQuery, [timesheet.id]);
      
      result.push({
        ...mappedTimesheet,
        activities: mapFromSQLArray(activities) as TimesheetActivity[]
      });
    }
    return result;
  }

  async getTimesheet(id: number): Promise<Timesheet | null> {
    const query = convertSQLQuery("SELECT * FROM timesheets WHERE id = ?");
    const rows = await this.client.query<Omit<Timesheet, "activities">>(query, [id]);
    if (!rows[0]) return null;

    const timesheet = mapFromSQL(rows[0]) as Omit<Timesheet, "activities">;
    const activitiesQuery = convertSQLQuery(`
      SELECT id, timesheetId, activityId, title, description, date, startTime, endTime, hours, hourlyRate, total, isBreak
      FROM timesheet_activities
      WHERE timesheetId = ?
      ORDER BY date ASC, startTime ASC
    `);
    const activities = await this.client.query<any>(activitiesQuery, [id]);
    
    return {
      ...timesheet,
      activities: mapFromSQLArray(activities) as TimesheetActivity[]
    };
  }

  async createTimesheet(data: Omit<Timesheet, "id" | "createdAt" | "updatedAt">): Promise<Timesheet> {
    const ts = nowIso();
    
    // Map timesheet data to SQL format
    const mappedTimesheetData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
    
    const result = await this.client.exec(
      `
      INSERT INTO timesheets (timesheet_number, customer_id, title, status, start_date, end_date, subtotal, vat_rate, vat_amount, total, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        mappedTimesheetData.timesheet_number,
        mappedTimesheetData.customer_id,
        mappedTimesheetData.title,
        mappedTimesheetData.status,
        mappedTimesheetData.start_date,
        mappedTimesheetData.end_date,
        mappedTimesheetData.subtotal,
        mappedTimesheetData.vat_rate,
        mappedTimesheetData.vat_amount,
        mappedTimesheetData.total,
        mappedTimesheetData.notes || null,
        mappedTimesheetData.created_at,
        mappedTimesheetData.updated_at,
      ]
    );
    
    const timesheetId = result.lastInsertRowid;
    
    for (const activity of data.activities) {
      const mappedActivity = mapToSQL(activity);
      await this.client.exec(
        `INSERT INTO timesheet_activities (timesheet_id, activity_id, title, description, date, start_time, end_time, hours, hourly_rate, total, is_break) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [timesheetId, mappedActivity.activity_id || null, mappedActivity.title, mappedActivity.description || null, mappedActivity.date, mappedActivity.start_time, mappedActivity.end_time, mappedActivity.hours, mappedActivity.hourly_rate, mappedActivity.total, mappedActivity.is_break ? 1 : 0]
      );
    }
    
    const newTimesheet = await this.getTimesheet(timesheetId);
    if (!newTimesheet) throw new Error("Timesheet creation failed");
    return newTimesheet;
  }

  async updateTimesheet(id: number, patch: Partial<Timesheet>): Promise<Timesheet> {
    const current = await this.getTimesheet(id);
    if (!current) throw new Error("Timesheet not found");

    const next = { ...current, ...patch, updatedAt: nowIso() };

    // Map to SQL format
    const mappedNext = mapToSQL(next);

    await this.client.exec(
      `
      UPDATE timesheets SET
        timesheet_number = ?, customer_id = ?, title = ?, status = ?, start_date = ?, end_date = ?, 
        subtotal = ?, vat_rate = ?, vat_amount = ?, total = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
      [
        mappedNext.timesheet_number,
        mappedNext.customer_id,
        mappedNext.title,
        mappedNext.status,
        mappedNext.start_date,
        mappedNext.end_date,
        mappedNext.subtotal,
        mappedNext.vat_rate,
        mappedNext.vat_amount,
        mappedNext.total,
        mappedNext.notes || null,
        mappedNext.updated_at,
        id,
      ]
    );

    if (patch.activities) {
      await this.client.exec(`DELETE FROM timesheet_activities WHERE timesheet_id = ?`, [id]);
      for (const activity of patch.activities) {
        const mappedActivity = mapToSQL(activity);
        await this.client.exec(
          `INSERT INTO timesheet_activities (timesheet_id, activity_id, title, description, date, start_time, end_time, hours, hourly_rate, total, is_break) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, mappedActivity.activity_id || null, mappedActivity.title, mappedActivity.description || null, mappedActivity.date, mappedActivity.start_time, mappedActivity.end_time, mappedActivity.hours, mappedActivity.hourly_rate, mappedActivity.total, mappedActivity.is_break ? 1 : 0]
        );
      }
    }

    const updated = await this.getTimesheet(id);
    if (!updated) throw new Error("Timesheet update failed");
    return updated;
  }

  async deleteTimesheet(id: number): Promise<void> {
    await this.client.transaction([
      { sql: `DELETE FROM timesheet_activities WHERE timesheet_id = ?`, params: [id] },
      { sql: `DELETE FROM timesheets WHERE id = ?`, params: [id] }
    ]);
  }

  // OFFER ATTACHMENTS
  async createOfferAttachment(attachment: Omit<OfferAttachment, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfferAttachment> {
    const now = nowIso();
    const mappedAttachment = mapToSQL({
      ...attachment,
      createdAt: now,
      updatedAt: now
    });

    const result = await this.client.exec(
      convertSQLQuery(`INSERT INTO offer_attachments 
       (offerId, lineItemId, filename, originalFilename, fileType, fileSize, filePath, base64Data, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
      [
        mappedAttachment.offer_id,
        mappedAttachment.line_item_id || null,
        mappedAttachment.filename,
        mappedAttachment.original_filename,
        mappedAttachment.file_type,
        mappedAttachment.file_size,
        mappedAttachment.file_path || null,
        mappedAttachment.base64_data || null,
        mappedAttachment.description || null,
        mappedAttachment.created_at,
        mappedAttachment.updated_at
      ]
    );

    const created = await this.client.query<any>(
      convertSQLQuery(`SELECT * FROM offer_attachments WHERE id = ?`),
      [result.lastInsertRowid]
    );

    return mapFromSQL(created[0]) as OfferAttachment;
  }

  async getOfferAttachments(offerId: number, lineItemId?: number): Promise<OfferAttachment[]> {
    let query = `SELECT * FROM offer_attachments WHERE offerId = ?`;
    const params = [offerId];

    if (lineItemId !== undefined) {
      query += ` AND lineItemId = ?`;
      params.push(lineItemId);
    }

    query += ` ORDER BY createdAt ASC`;

    const convertedQuery = convertSQLQuery(query);
    const rows = await this.client.query<any>(convertedQuery, params);
    return mapFromSQLArray(rows) as OfferAttachment[];
  }

  async deleteOfferAttachment(attachmentId: number): Promise<void> {
    await this.client.exec(
      convertSQLQuery(`DELETE FROM offer_attachments WHERE id = ?`),
      [attachmentId]
    );
  }

  async updateOfferAttachment(id: number, patch: Partial<OfferAttachment>): Promise<OfferAttachment> {
    const current = await this.client.query<any>(
      convertSQLQuery(`SELECT * FROM offer_attachments WHERE id = ?`),
      [id]
    );

    if (current.length === 0) {
      throw new Error(`Attachment with id ${id} not found`);
    }

    const next = { ...mapFromSQL(current[0]), ...patch, updatedAt: nowIso() };
    const mappedNext = mapToSQL(next);

    await this.client.exec(
      convertSQLQuery(`UPDATE offer_attachments SET 
       filename = ?, originalFilename = ?, fileType = ?, fileSize = ?, 
       filePath = ?, base64Data = ?, description = ?, updatedAt = ?
       WHERE id = ?`),
      [
        mappedNext.filename,
        mappedNext.original_filename,
        mappedNext.file_type,
        mappedNext.file_size,
        mappedNext.file_path || null,
        mappedNext.base64_data || null,
        mappedNext.description || null,
        mappedNext.updated_at,
        id
      ]
    );

    return next as OfferAttachment;
  }

  // INVOICE ATTACHMENTS
  async createInvoiceAttachment(attachment: Omit<InvoiceAttachment, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvoiceAttachment> {
    const now = nowIso();
    const mappedAttachment = mapToSQL({
      ...attachment,
      createdAt: now,
      updatedAt: now
    });

    const result = await this.client.exec(
      convertSQLQuery(`INSERT INTO invoice_attachments 
       (invoiceId, lineItemId, filename, originalFilename, fileType, fileSize, filePath, base64Data, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
      [
        mappedAttachment.invoice_id,
        mappedAttachment.line_item_id || null,
        mappedAttachment.filename,
        mappedAttachment.original_filename,
        mappedAttachment.file_type,
        mappedAttachment.file_size,
        mappedAttachment.file_path || null,
        mappedAttachment.base64_data || null,
        mappedAttachment.description || null,
        mappedAttachment.created_at,
        mappedAttachment.updated_at
      ]
    );

    const created = await this.client.query<any>(
      convertSQLQuery(`SELECT * FROM invoice_attachments WHERE id = ?`),
      [result.lastInsertRowid]
    );

    return mapFromSQL(created[0]) as InvoiceAttachment;
  }

  async getInvoiceAttachments(invoiceId: number, lineItemId?: number): Promise<InvoiceAttachment[]> {
    let query = `SELECT * FROM invoice_attachments WHERE invoiceId = ?`;
    const params = [invoiceId];

    if (lineItemId !== undefined) {
      query += ` AND lineItemId = ?`;
      params.push(lineItemId);
    }

    query += ` ORDER BY createdAt ASC`;

    const convertedQuery = convertSQLQuery(query);
    const rows = await this.client.query<any>(convertedQuery, params);
    return mapFromSQLArray(rows) as InvoiceAttachment[];
  }

  async deleteInvoiceAttachment(attachmentId: number): Promise<void> {
    await this.client.exec(
      convertSQLQuery(`DELETE FROM invoice_attachments WHERE id = ?`),
      [attachmentId]
    );
  }

  async updateInvoiceAttachment(id: number, patch: Partial<InvoiceAttachment>): Promise<InvoiceAttachment> {
    const current = await this.client.query<any>(
      convertSQLQuery(`SELECT * FROM invoice_attachments WHERE id = ?`),
      [id]
    );

    if (current.length === 0) {
      throw new Error(`Invoice attachment with id ${id} not found`);
    }

    const next = { ...mapFromSQL(current[0]), ...patch, updatedAt: nowIso() };
    const mappedNext = mapToSQL(next);

    await this.client.exec(
      convertSQLQuery(`UPDATE invoice_attachments SET 
       filename = ?, originalFilename = ?, fileType = ?, fileSize = ?, 
       filePath = ?, base64Data = ?, description = ?, updatedAt = ?
       WHERE id = ?`),
      [
        mappedNext.filename,
        mappedNext.original_filename,
        mappedNext.file_type,
        mappedNext.file_size,
        mappedNext.file_path || null,
        mappedNext.base64_data || null,
        mappedNext.description || null,
        mappedNext.updated_at,
        id
      ]
    );

    return next as InvoiceAttachment;
  }

  // READY STATUS
  async ready(): Promise<void> {
    console.log('🔧 [SQLiteAdapter.ready] Starting readiness check...');
    
    try {
      // Test if DbClient is available
      if (!this.client) {
        throw new Error('DbClient not initialized');
      }
      console.log('🔧 [SQLiteAdapter.ready] DbClient available');
      
      // Test if window.rawalite.db is available
      if (typeof window === 'undefined' || !window.rawalite?.db) {
        throw new Error('window.rawalite.db API not available');
      }
      console.log('🔧 [SQLiteAdapter.ready] window.rawalite.db API available');
      
      // Test actual database connection with a simple query
      const testResult = await this.client.query('SELECT 1 as test');
      if (!testResult || testResult.length === 0) {
        throw new Error('Database connection test failed');
      }
      console.log('🔧 [SQLiteAdapter.ready] Database connection test successful');
      
      // Test table existence
      const tables = await this.client.query("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('🔧 [SQLiteAdapter.ready] Found tables:', tables.map((t: any) => t.name));
      
      if (tables.length === 0) {
        throw new Error('No tables found in database');
      }
      
      console.log('🔧 [SQLiteAdapter.ready] All checks passed - adapter is ready');
    } catch (error) {
      console.error('🔧 [SQLiteAdapter.ready] Readiness check failed:', error);
      throw error;
    }
  }
}