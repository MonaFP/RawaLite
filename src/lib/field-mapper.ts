/**
 * Robust Field Mapping zwischen JavaScript camelCase und SQL snake_case
 * 
 * Mappings basieren auf dem aktuellen SQLite-Schema (validiert gegen Real DB 26.10.2025):
 * - customers: number, name, email, phone, street, zip, city, notes, created_at, updated_at
 * - offers: customer_id, total_amount, tax_rate, valid_until, offer_number, created_at, updated_at  
 * - invoices: customer_id, offer_id, total_amount, tax_rate, due_date, paid_at, invoice_number, created_at, updated_at
 * - packages: internal_title, parent_package_id, total, add_vat, created_at, updated_at
 * - offer_line_items: offer_id, parent_item_id, unit_price, vat_rate, vat_amount, created_at, updated_at
 * - package_line_items: package_id, parent_item_id, unit_price, vat_rate, vat_amount, created_at, updated_at
 * - invoice_line_items: invoice_id, parent_item_id, unit_price, vat_rate, vat_amount, created_at, updated_at
 * - numbering_circles: last_number, created_at, updated_at
 * - settings: updated_at
 * - user_navigation_preferences: user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at
 * - user_navigation_mode_settings: user_id, default_navigation_mode, show_footer, footer_show_*, allow_mode_switching, grid_template_*, created_at, updated_at
 * - user_focus_mode_preferences: user_id, navigation_mode, auto_focus_enabled, transition_duration_ms, footer_*, created_at, updated_at
 */

export class FieldMapper {
  /**
   * Mapping: JavaScript camelCase → SQL snake_case
   */
  private static readonly JS_TO_SQL_MAPPINGS: Record<string, string> = {
    // Zeitstempel (überall verwendet)
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    
    // Customer Felder (REAL DB Schema - validiert 25.10.2025)
    // Real DB: id, number, name, email, phone, street, zip, city, notes, created_at, updated_at
    'customerNumber': 'number',
    'customerName': 'name',
    'customerEmail': 'email',
    'customerPhone': 'phone',
    'customerStreet': 'street',
    'customerZip': 'zip',
    'customerCity': 'city',
    'customerNotes': 'notes',
    
    // DEPRECATED Customer Mappings (kept for backward compatibility)
    // Diese Felder existieren NICHT in Real DB, aber könnten in Legacy Code verwendet werden
    'companyName': 'name',              // FALLBACK zu 'name'
    'contactPerson': 'name',            // FALLBACK zu 'name'
    'addressStreet': 'street',          // FALLBACK zu 'street'
    'addressCity': 'city',              // FALLBACK zu 'city'
    'addressZip': 'zip',                // FALLBACK zu 'zip'
    // 'addressCountry': 'address_country',  // ❌ ENTFERNT - existiert nicht in Real DB
    // 'taxNumber': 'tax_id',                // ❌ ENTFERNT - existiert nicht in Real DB
    // 'taxOffice': 'tax_office',            // ❌ ENTFERNT - existiert nicht in Real DB
    
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
    
    // Theme System Felder (KRITISCH für Database-Theme-System v1.0.42.7)
    'themeKey': 'theme_key',
    'isSystemTheme': 'is_system_theme',
    'isActive': 'is_active',
    'themeId': 'theme_id',
    'colorKey': 'color_key',
    'colorValue': 'color_value',
    'userId': 'user_id',
    'activeThemeId': 'active_theme_id',
    'fallbackThemeKey': 'fallback_theme_key',
    
    // Navigation System Felder (KRITISCH für Database-Navigation-System v1.0.45+)
    'navigationMode': 'navigation_mode',
    'headerHeight': 'header_height',
    'sidebarWidth': 'sidebar_width',
    'autoCollapse': 'auto_collapse',
    'rememberFocusMode': 'remember_focus_mode',
    'previousMode': 'previous_mode',
    'newMode': 'new_mode',
    'changedAt': 'changed_at',
    'sessionId': 'session_id',
    
    // Footer Content System Felder (KRITISCH für Footer+Focus Mode Integration v1.0.59)
    'showStatusInfo': 'show_status_info',
    'showQuickActions': 'show_quick_actions',
    'showApplicationInfo': 'show_application_info',
    'showThemeSelector': 'show_theme_selector',
    'showFocusModeToggle': 'show_focus_mode_toggle',
    'customContentSlots': 'custom_content_slots',
    'showFooterInNormalMode': 'show_footer_in_normal_mode',
    'showFooterInFocusMode': 'show_footer_in_focus_mode',
    'footerHeightPx': 'footer_height_px',
    'footerPosition': 'footer_position',
    'footerAutoHide': 'footer_auto_hide',
    'footerAutoHideDelayMs': 'footer_auto_hide_delay_ms',
    
    // Focus Mode Preferences Felder (REAL DB Schema - Migration 042, validiert 25.10.2025)
    'autoFocusEnabled': 'auto_focus_enabled',
    'autoFocusDelaySeconds': 'auto_focus_delay_seconds',
    'focusOnModeSwitch': 'focus_on_mode_switch',
    'hideSidebarInFocus': 'hide_sidebar_in_focus',
    'hideHeaderStatsInFocus': 'hide_header_stats_in_focus',
    'dimBackgroundOpacity': 'dim_background_opacity',
    'transitionDurationMs': 'transition_duration_ms',
    'transitionEasing': 'transition_easing',
    'blockNotifications': 'block_notifications',
    'blockPopups': 'block_popups',
    'blockContextMenu': 'block_context_menu',
    'minimalUiMode': 'minimal_ui_mode',
    'trackFocusSessions': 'track_focus_sessions',
    'showFocusTimer': 'show_focus_timer',
    'focusBreakReminders': 'focus_break_reminders',
    'focusBreakIntervalMinutes': 'focus_break_interval_minutes',
    
    // Grid System Felder (REAL DB Schema - user_navigation_mode_settings)
    'gridTemplateColumns': 'grid_template_columns',
    'gridTemplateRows': 'grid_template_rows',
    'gridTemplateAreas': 'grid_template_areas',
    'autoCollapseMobile': 'auto_collapse_mobile',
    'autoCollapseTablet': 'auto_collapse_tablet',
    'rememberDimensions': 'remember_dimensions',
    'mobileBreakpoint': 'mobile_breakpoint',
    'tabletBreakpoint': 'tablet_breakpoint',
    
    // Tabellennamen (für SQL-Queries)
    'packageLineItems': 'package_line_items',
    'offerLineItems': 'offer_line_items',
    'invoiceLineItems': 'invoice_line_items',
    'numberingCircles': 'numbering_circles',
    'userNavigationPreferences': 'user_navigation_preferences',
    'navigationModeHistory': 'navigation_mode_history',
    'userFooterContentPreferences': 'user_footer_content_preferences',
    'userFocusModePreferences': 'user_focus_mode_preferences'
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
