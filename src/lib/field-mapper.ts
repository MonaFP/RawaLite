/**
 * Robust Field Mapping zwischen JavaScript camelCase und SQL snake_case
 * 
 * Mappings basieren auf dem aktuellen SQLite-Schema:
 * - customers: company_name, contact_person, address_street, address_city, address_zip, address_country, tax_number, created_at, updated_at
 * - offers: customer_id, total_amount, tax_rate, valid_until, offer_number, created_at, updated_at  
 * - invoices: customer_id, offer_id, total_amount, tax_rate, due_date, paid_at, invoice_number, created_at, updated_at
 * - packages: created_at, updated_at
 * - offer_line_items: offer_id, parent_item_id, unit_price, vat_rate, vat_amount, created_at, updated_at
 * - package_line_items: package_id, parent_item_id, unit_price, vat_rate, vat_amount, created_at, updated_at
 * - invoice_line_items: invoice_id, parent_item_id, unit_price, vat_rate, vat_amount, created_at, updated_at
 * - numbering_circles: last_number, created_at, updated_at
 * - settings: updated_at
 */

export class FieldMapper {
  /**
   * Mapping: JavaScript camelCase → SQL snake_case
   */
  private static readonly JS_TO_SQL_MAPPINGS: Record<string, string> = {
    // Zeitstempel (überall verwendet)
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    
    // Customer Felder
    'companyName': 'company_name',
    'contactPerson': 'contact_person',
    'addressStreet': 'address_street',
    'addressCity': 'address_city',
    'addressZip': 'address_zip',
    'addressCountry': 'address_country',
    'taxNumber': 'tax_id',
    'taxOffice': 'tax_office',
    
    // Bankdaten Felder (KRITISCH für Settings)
    'bankName': 'bank_name',
    'bankAccount': 'bank_account',
    'bankBic': 'bank_bic',
    
    // Company/Settings Felder
    'logo': 'logo',
    
    // Auto-Update Preferences Felder (Migration 018)
    'autoUpdateEnabled': 'auto_update_enabled',
    'autoUpdateCheckFrequency': 'auto_update_check_frequency',
    'autoUpdateNotificationStyle': 'auto_update_notification_style',
    'autoUpdateReminderInterval': 'auto_update_reminder_interval',
    'autoUpdateAutoDownload': 'auto_update_auto_download',
    'autoUpdateInstallPrompt': 'auto_update_install_prompt',
    
    // Package Felder (KRITISCH - waren vorher nicht definiert!)
    'internalTitle': 'internal_title',
    'parentPackageId': 'parent_package_id',
    'addVat': 'add_vat',
    
    // LineItem Felder (KRITISCH für Package/Offer/Invoice)
    'unitPrice': 'unit_price',
    'hierarchyLevel': 'hierarchy_level',
    'itemOrigin': 'item_origin',
    'sourcePackageItemId': 'source_package_item_id',
    'sortOrder': 'sort_order',
    'clientTempId': 'client_temp_id',
    
    // Offer/Invoice Felder
    'customerId': 'customer_id',
    'offerId': 'offer_id',
    'totalAmount': 'total_amount',
    'taxRate': 'tax_rate',
    'validUntil': 'valid_until',
    'dueDate': 'due_date',
    'paidAt': 'paid_at',
    'overdueAt': 'overdue_at',
    'cancelledAt': 'cancelled_at',
    
    // Offer/Invoice Status Date Felder (KRITISCH für Status-Updates)
    'sentAt': 'sent_at',
    'acceptedAt': 'accepted_at',
    'rejectedAt': 'rejected_at',
    
    // LineItem Felder (KRITISCH für Packages/Offers/Invoices)
    'parentItemId': 'parent_item_id',
    'packageId': 'package_id',
    'invoiceId': 'invoice_id',
    'vatRate': 'vat_rate',
    'vatAmount': 'vat_amount',
    
    // OfferAttachment Felder (KRITISCH für Image-Upload)
    'lineItemId': 'line_item_id',
    'originalFilename': 'original_filename',
    'fileType': 'file_type',
    'fileSize': 'file_size',
    'filePath': 'file_path',
    'base64Data': 'base64_data',
    'itemType': 'item_type',
    'sourcePackageId': 'source_package_id',
    
    // Timesheet & Activity Felder (KRITISCH für Zeiterfassung)
    'timesheetId': 'timesheet_id',
    'timesheetNumber': 'timesheet_number',
    'activityId': 'activity_id',
    'startDate': 'start_date',
    'endDate': 'end_date',
    'startTime': 'start_time',
    'endTime': 'end_time',
    'hourlyRate': 'hourly_rate',
    'isBreak': 'is_break',
    
    // Status Versioning (KRITISCH für StatusControl - Migration 015)
    'version': 'version',  // Optimistic locking version field
    
    // Numbering Circles & Numbers
    'lastNumber': 'last_number',
    'offerNumber': 'offer_number',
    'invoiceNumber': 'invoice_number',
    
    // Discount System Felder (KRITISCH für Rabatt-Funktionalität)
    'discountType': 'discount_type',
    'discountValue': 'discount_value',
    'discountAmount': 'discount_amount',
    'subtotalBeforeDiscount': 'subtotal_before_discount',
    
    // Price Display Mode Felder (KRITISCH für SubItem Preisanzeige v1.0.42.6)
    'priceDisplayMode': 'price_display_mode',
    
    // Tabellennamen (für SQL-Queries)
    'packageLineItems': 'package_line_items',
    'offerLineItems': 'offer_line_items',
    'invoiceLineItems': 'invoice_line_items',
    'numberingCircles': 'numbering_circles'
  };

  /**
   * Reverse Mapping: SQL snake_case → JavaScript camelCase
   */
  private static readonly SQL_TO_JS_MAPPINGS: Record<string, string> = Object.fromEntries(
    Object.entries(FieldMapper.JS_TO_SQL_MAPPINGS).map(([js, sql]) => [sql, js])
  );

  /**
   * Konvertiert JavaScript-Objekt (camelCase) zu SQL-kompatiblem Objekt (snake_case)
   * 
   * @param jsObj - JavaScript-Objekt mit camelCase-Feldern
   * @returns SQL-kompatibles Objekt mit snake_case-Feldern
   * 
   * @example
   * ```typescript
   * const input = { companyName: "Test GmbH", createdAt: "2025-09-30" };
   * const output = FieldMapper.toSQL(input);
   * // → { company_name: "Test GmbH", created_at: "2025-09-30" }
   * ```
   */
  static toSQL<T extends Record<string, any>>(jsObj: T): Record<string, any> {
    if (!jsObj || typeof jsObj !== 'object') {
      return jsObj;
    }

    const sqlObj: Record<string, any> = {};
    
    for (const [jsKey, value] of Object.entries(jsObj)) {
      // Mapping verwenden falls vorhanden, sonst Original-Key
      const sqlKey = FieldMapper.JS_TO_SQL_MAPPINGS[jsKey] || jsKey;
      sqlObj[sqlKey] = value;
    }

    return sqlObj;
  }

  /**
   * Konvertiert SQL-Objekt (snake_case) zu JavaScript-kompatiblem Objekt (camelCase)
   * 
   * @param sqlObj - SQL-Objekt mit snake_case-Feldern
   * @returns JavaScript-kompatibles Objekt mit camelCase-Feldern
   * 
   * @example
   * ```typescript
   * const input = { company_name: "Test GmbH", created_at: "2025-09-30" };
   * const output = FieldMapper.fromSQL(input);
   * // → { companyName: "Test GmbH", createdAt: "2025-09-30" }
   * ```
   */
  static fromSQL<T extends Record<string, any>>(sqlObj: T): Record<string, any> {
    if (!sqlObj || typeof sqlObj !== 'object') {
      return sqlObj;
    }

    const jsObj: Record<string, any> = {};
    
    for (const [sqlKey, value] of Object.entries(sqlObj)) {
      // Reverse Mapping verwenden falls vorhanden, sonst Original-Key
      const jsKey = FieldMapper.SQL_TO_JS_MAPPINGS[sqlKey] || sqlKey;
      jsObj[jsKey] = value;
    }

    return jsObj;
  }

  /**
   * Konvertiert SQL-Query mit camelCase-Feldnamen zu snake_case
   * 
   * @param query - SQL-Query mit camelCase-Feldnamen
   * @returns SQL-Query mit snake_case-Feldnamen
   * 
   * @example
   * ```typescript
   * const input = "SELECT id, companyName FROM customers WHERE createdAt > ?";
   * const output = FieldMapper.convertQuery(input);
   * // → "SELECT id, company_name FROM customers WHERE created_at > ?"
   * ```
   */
  static convertQuery(query: string): string {
    let convertedQuery = query;
    
    // Alle JS-Feldnamen durch SQL-Äquivalente ersetzen
    for (const [jsField, sqlField] of Object.entries(FieldMapper.JS_TO_SQL_MAPPINGS)) {
      // Word boundaries verwenden für exakte Matches
      const regex = new RegExp(`\\b${jsField}\\b`, 'g');
      convertedQuery = convertedQuery.replace(regex, sqlField);
    }
    
    return convertedQuery;
  }

  /**
   * Array von Objekten konvertieren (SQL → JS)
   */
  static fromSQLArray<T extends Record<string, any>>(sqlArray: T[]): Record<string, any>[] {
    if (!Array.isArray(sqlArray)) {
      return sqlArray;
    }
    
    return sqlArray.map(item => FieldMapper.fromSQL(item));
  }

  /**
   * Debugging: Alle verfügbaren Mappings anzeigen
   */
  static getMappings(): { jsToSql: Record<string, string>; sqlToJs: Record<string, string> } {
    return {
      jsToSql: { ...FieldMapper.JS_TO_SQL_MAPPINGS },
      sqlToJs: { ...FieldMapper.SQL_TO_JS_MAPPINGS }
    };
  }

  /**
   * Validierung: Prüft ob ein Feld-Mapping existiert
   */
  static hasMapping(field: string, direction: 'js-to-sql' | 'sql-to-js'): boolean {
    if (direction === 'js-to-sql') {
      return field in FieldMapper.JS_TO_SQL_MAPPINGS;
    } else {
      return field in FieldMapper.SQL_TO_JS_MAPPINGS;
    }
  }
}

/**
 * Convenience-Export für häufig verwendete Operationen
 */
export const mapToSQL = FieldMapper.toSQL;
export const mapFromSQL = FieldMapper.fromSQL;
export const mapFromSQLArray = FieldMapper.fromSQLArray;
export const convertSQLQuery = FieldMapper.convertQuery;
