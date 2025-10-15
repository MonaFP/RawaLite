/**
 * PDF Template Generators
 * 
 * Contains HTML template generation and Markdown conversion functions for PDF export.
 * 
 * ⚠️ CRITICAL FIX-007: PDF Theme System Phase 2
 * This module contains theme-integrated HTML generation that MUST preserve:
 * - Theme color integration in template styling
 * - primaryColor/accentColor usage in HTML generation
 * - Template-specific theme color application
 * 
 * @since v1.0.42.5
 * @critical FIX-007 Phase 2
 */

// Import marked for Markdown conversion
import { marked } from 'marked';

/**
 * Generate HTML content for PDF templates
 * 
 * ⚠️ CRITICAL FIX-007 Phase 2: Theme integration in HTML generation
 * 
 * @param options - Template generation options including theme
 * @returns Complete HTML string for PDF generation
 */
export function generateTemplateHTML(options: any): string {
  const { templateType, data, theme } = options;
  const entity = data[templateType] || data.offer || data.invoice || data.timesheet;
  const { customer, settings } = data;
  
  // 🔍 DEBUGGING: Critical field mapping validation
  console.log('🔍 [PDF DEBUG] Template Type:', templateType);
  console.log('🔍 [PDF DEBUG] Entity received:', entity);
  console.log('🔍 [PDF DEBUG] Entity keys:', Object.keys(entity || {}));
  
  if (templateType === 'offer') {
    console.log('🔍 [PDF DEBUG] Offer specific fields:');
    console.log('  - offerNumber:', entity?.offerNumber, '(type:', typeof entity?.offerNumber, ')');
    console.log('  - offer_number:', entity?.offer_number, '(type:', typeof entity?.offer_number, ')');
    console.log('  - title:', entity?.title, '(type:', typeof entity?.title, ')');
    console.log('  - validUntil:', entity?.validUntil, '(type:', typeof entity?.validUntil, ')');
    console.log('  - valid_until:', entity?.valid_until, '(type:', typeof entity?.valid_until, ')');
  }
  
  // 🔍 DEBUG: Log line items, pricing data and attachments
  if (templateType === 'offer' && entity.lineItems) {
    console.log('🔍 [PDF DEBUG] Offer line items received:', entity.lineItems.length);
    entity.lineItems.forEach((item: any, index: number) => {
      console.log(`🔍 [PDF DEBUG] Item ${index + 1}: ${item.title}`);
      console.log(`🔍 [PDF DEBUG] - Pricing: quantity=${item.quantity}, unitPrice=${item.unitPrice}, total=${item.total}`);
      console.log(`🔍 [PDF DEBUG] - All item properties:`, Object.keys(item));
      if (item.attachments && item.attachments.length > 0) {
        console.log(`🔍 [PDF DEBUG] - Has ${item.attachments.length} attachments:`);
        item.attachments.forEach((att: any, attIndex: number) => {
          console.log(`🔍 [PDF DEBUG]   - Attachment ${attIndex + 1}: ${att.originalFilename} (base64: ${!!att.base64Data})`);
          if (att.base64Data) {
            console.log(`🔍 [PDF DEBUG]     - Base64 length: ${att.base64Data.length} chars`);
            console.log(`🔍 [PDF DEBUG]     - Base64 prefix: ${att.base64Data.substring(0, 50)}...`);
            
            // Test if base64 is valid
            try {
              const base64Data = att.base64Data.replace(/^data:[^;]+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              console.log(`🔍 [PDF DEBUG]     - Decoded buffer size: ${buffer.length} bytes`);
            } catch (error) {
              console.log(`🔍 [PDF DEBUG]     - ERROR decoding base64:`, (error as Error).message);
            }
          }
        });
      } else {
        console.log(`🔍 [PDF DEBUG] - No attachments`);
      }
    });
  }
  
  // 🔍 DEBUG: Log invoice line items for comparison with offers
  if (templateType === 'invoice' && entity.lineItems) {
    console.log('🔍 [PDF DEBUG] Invoice line items received:', entity.lineItems.length);
    entity.lineItems.forEach((item: any, index: number) => {
      console.log(`🔍 [PDF DEBUG] Invoice Item ${index + 1}: ${item.title}`);
      console.log(`🔍 [PDF DEBUG] - Invoice Pricing: quantity=${item.quantity}, unitPrice=${item.unitPrice}, total=${item.total}`);
      console.log(`🔍 [PDF DEBUG] - Invoice item properties:`, Object.keys(item));
    });
  }
  
  // Base HTML template with proper styling
  const currentDate = data.currentDate || new Date().toLocaleDateString('de-DE');
  
  let title = '';
  let metaInfo = '';
  
  if (templateType === 'offer') {
    title = `Angebot ${entity.offerNumber}`;
    const validUntil = new Date(entity.validUntil).toLocaleDateString('de-DE');
    metaInfo = `
      <strong>Datum:</strong> ${currentDate}<br>
      <strong>Gültig bis:</strong> ${validUntil}<br>
      <strong>Betreff:</strong> ${entity.title}
    `;
  } else if (templateType === 'invoice') {
    title = `Rechnung ${entity.invoiceNumber}`;
    const dueDate = new Date(entity.dueDate).toLocaleDateString('de-DE');
    metaInfo = `
      <strong>Rechnungsdatum:</strong> ${currentDate}<br>
      <strong>Fällig am:</strong> ${dueDate}<br>
      <strong>Betreff:</strong> ${entity.title}
    `;
  } else if (templateType === 'timesheet') {
    title = `Leistungsnachweis ${entity.timesheetNumber}`;
    metaInfo = `
      <strong>Datum:</strong> ${currentDate}<br>
      <strong>Betreff:</strong> ${entity.title || 'Leistungsnachweis'}
    `;
    console.log('📊 PDF Timesheet Activities Debug:', {
      hasActivities: !!entity.activities,
      activitiesCount: entity.activities?.length || 0,
      activities: entity.activities
    });
  }

  // ⚠️ CRITICAL FIX-007 Phase 2: Extract theme colors with fallback to default
  // This theme integration MUST be preserved for PDF theme consistency
  const primaryColor = options.theme?.theme?.primary || options.theme?.primary || '#7ba87b';     // Default to salbeigruen
  const secondaryColor = options.theme?.theme?.secondary || options.theme?.secondary || '#5a735a';
  const accentColor = options.theme?.theme?.accent || options.theme?.accent || '#6b976b';
  const backgroundColor = '#ffffff';  // Force white background for PDF
  const textColor = options.theme?.theme?.text || options.theme?.text || '#2d4a2d';
  
  console.log(`🎨 PDF Template using theme colors:`, {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    background: backgroundColor,
    text: textColor,
    theme: options.theme
  });
  
  console.log(`📊 PDF Entity data for discount calculation:`, {
    discountType: entity.discountType,
    discountValue: entity.discountValue,
    discountAmount: entity.discountAmount,
    subtotalBeforeDiscount: entity.subtotalBeforeDiscount,
    subtotal: entity.subtotal,
    total: entity.total
  });
  
  console.log(`🔍 PDF Entity notes debug:`, {
    templateType,
    hasNotes: !!entity.notes,
    notesLength: entity.notes?.length || 0,
    notesContent: entity.notes || 'undefined'
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        * {
          box-sizing: border-box;
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 15px;  /* Optimized for maximum content width (545px @ A4) */
          color: ${textColor};     /* Use theme text color */
          background-color: ${backgroundColor};  /* Use theme background */
          line-height: 1.3;  /* Reduced from 1.4 to 1.3 for more compact */
          font-size: 12px;   /* Slightly smaller base font */
        }
        /* Header wird durch headerTemplate/footerTemplate ersetzt */
        .customer { 
          margin-bottom: 20px;  /* Reduced from 30px */
          padding: 10px 15px;   /* Reduced padding */
          border-left: 3px solid ${primaryColor};
          background-color: ${backgroundColor};  /* Use theme background */
          border: 1px solid ${accentColor};      /* Add subtle border */
          font-size: 11px;     /* Smaller customer info */
          color: ${textColor};  /* Use theme text color */
        }
        .document-title { 
          font-size: 20px;  /* Reduced from 24px */
          font-weight: bold; 
          margin: 20px 0;   /* Reduced from 30px */
          color: ${primaryColor};
          border-bottom: 2px solid ${primaryColor};
          padding-bottom: 8px;  /* Reduced padding */
        }
        .meta-info { 
          margin-bottom: 20px;  /* Reduced from 30px */
          background-color: ${backgroundColor};  /* Use theme background */
          border: 1px solid ${accentColor};      /* Add subtle border */
          padding: 12px 15px;   /* Reduced padding */
          border-radius: 5px;
          font-size: 11px;     /* Smaller meta info */
          color: ${textColor};  /* Use theme text color */
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;  /* Reduced from 20px */
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);  /* Lighter shadow */
          font-size: 11px; /* Smaller table font */
        }
        th, td { 
          padding: 8px 10px;  /* Reduced from 12px */
          text-align: left; 
          border-bottom: 1px solid ${accentColor};  /* Use theme accent color */
          vertical-align: top;
          color: ${textColor};  /* Use theme text color */
        }
        th { 
          background-color: ${primaryColor}; 
          color: white; 
          font-weight: bold; 
          font-size: 11px;  /* Consistent with table font */
        }
        .sub-item { 
          padding-left: 20px; 
          font-style: italic; 
          color: ${secondaryColor};  /* Use theme secondary color */
          background-color: ${backgroundColor};  /* Use theme background */
        }
        .totals { 
          margin-top: 20px;  /* Reduced from 30px */
          text-align: right; 
          background-color: ${backgroundColor};  /* Use theme background */
          border: 1px solid ${accentColor};      /* Add subtle border */
          padding: 15px;     /* Reduced from 20px */
          border-radius: 5px;
          font-size: 12px;   /* Slightly larger for totals */
          color: ${textColor};  /* Use theme text color */
        }
        .total-row { 
          font-weight: bold; 
          font-size: 14px;   /* Reduced from 18px */
          color: ${primaryColor};
        }
        .notes { 
          margin-top: 25px;
          margin-bottom: 25px;
          padding: 15px;
          background-color: ${backgroundColor};
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          font-size: 11px;
          color: ${textColor};
          page-break-inside: avoid;
          position: relative;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          isolation: isolate;
        }

        .notes-long {
          page-break-inside: auto;
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 15;
          margin-bottom: 25px;
          position: relative;
        }

        /* Print-specific rules for proper page break visualization */
        @media print {
          .notes {
            position: relative !important;
            z-index: 10 !important;
            margin-top: 25px !important;
            margin-bottom: 25px !important;
            overflow: visible !important;
            border: 2px solid ${primaryColor} !important;
            border-radius: 8px !important;
          }
          
          .notes-long {
            z-index: 15 !important;
            margin-bottom: 25px !important;
            border: 2px solid ${primaryColor} !important;
            border-radius: 8px !important;
            padding: 15px !important;
            background: white !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            
            /* Prevent page breaks inside individual containers */
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
            position: relative !important;
          }

          /* 🔧 Versuch 5: Tabellen-basierte Container mit thead/tfoot Wiederholung */
          .pdf-box-table {
            width: 100% !important;
            border-collapse: separate !important;
            border-spacing: 0 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            margin-bottom: 25px !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          /* Kopfzeile (wiederholt automatisch auf jeder Seite) */
          .pdf-box-table thead {
            display: table-header-group !important;
          }

          .pdf-box-header-line {
            height: 4px !important;
            padding: 0 !important;
            background: ${primaryColor} !important;
            border-top-left-radius: 8px !important;
            border-top-right-radius: 8px !important;
            border: none !important;
          }

          /* Mini-Header mit Seitenanzeige */
          .pdf-box-mini-header {
            height: 16px !important;
            background: ${primaryColor} !important;
            color: white !important;
            font-size: 9px !important;
            font-weight: bold !important;
            text-align: center !important;
            vertical-align: middle !important;
            padding: 2px 0 !important;
            border: none !important;
          }

          /* Fußzeile (wiederholt automatisch auf jeder Seite) */
          .pdf-box-table tfoot {
            display: table-footer-group !important;
          }

          .pdf-box-footer-line {
            height: 4px !important;
            padding: 0 !important;
            background: ${primaryColor} !important;
            border-bottom-left-radius: 8px !important;
            border-bottom-right-radius: 8px !important;
            border: none !important;
          }

          /* Inhaltszelle mit seitlichen Rahmen */
          .pdf-box-content {
            border-left: 2px solid ${primaryColor} !important;
            border-right: 2px solid ${primaryColor} !important;
            padding: 15px !important;
            background: white !important;
            vertical-align: top !important;
          }

          /* Anmerkungen-Titel */
          .pdf-box-content strong:first-child {
            display: block !important;
            margin-bottom: 8px !important;
            font-weight: 600 !important;
          }
        }

        /* Markdown formatting in notes */
        .notes h1, .notes h2, .notes h3, .notes h4, .notes h5, .notes h6 {
          margin: 8px 0 4px 0;
          font-weight: bold;
          page-break-after: avoid;
          color: ${primaryColor};
        }
        
        .notes p {
          margin: 4px 0;
          orphans: 2;
          widows: 2;
          line-height: 1.4;
        }
        
        .notes ul, .notes ol {
          margin: 6px 0;
          padding-left: 18px;
          page-break-inside: avoid;
        }
        
        .notes li {
          margin: 3px 0;
          line-height: 1.3;
        }
        
        .notes strong {
          font-weight: bold;
          color: ${primaryColor};
        }
        
        .notes em {
          font-style: italic;
          color: ${textColor};
        }
        
        .notes code {
          background-color: ${primaryColor}20;
          color: ${primaryColor};
          padding: 2px 5px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          border: 1px solid ${primaryColor}40;
        }
      </style>
    </head>
    <body>
      <!-- Header wird durch headerTemplate ersetzt - kein duplicate header hier -->

      <div class="customer">
        <strong>${customer.name}</strong><br>
        ${customer.street || ''}<br>
        ${customer.zip || ''} ${customer.city || ''}<br>
      </div>

      <div class="document-title">${title}</div>

      <div class="meta-info">
        ${metaInfo}
      </div>

      <table>
        <thead>
          <tr>
            ${templateType === 'timesheet' ? `
              <th>Datum</th>
              <th>Tätigkeiten</th>
              <th>Stunden</th>
              <th>Stundensatz</th>
              <th>Gesamt</th>
            ` : `
              <th>Position</th>
              <th>Menge</th>
              <th>Einzelpreis</th>
              <th>Gesamt</th>
            `}
          </tr>
        </thead>
        <tbody>
          ${templateType === 'timesheet' && entity.activities?.length > 0 ? (() => {
            // Import timesheet grouping logic inline (simplified version)
            const groupActivitiesByDate = (activities: any[]) => {
              const groups = new Map();
              activities.forEach(activity => {
                const date = activity.date;
                if (!groups.has(date)) {
                  groups.set(date, { date, activities: [], totalHours: 0, totalAmount: 0 });
                }
                const group = groups.get(date);
                group.activities.push(activity);
                group.totalHours += activity.hours || 0;
                group.totalAmount += activity.total || 0;
              });
              return Array.from(groups.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            };

            const dayGroups = groupActivitiesByDate(entity.activities);
            
            return dayGroups.map((group: any) => {
              const formattedDate = new Date(group.date).toLocaleDateString('de-DE');
              const activitiesList = group.activities.map((a: any) => a.title).join(', ');
              const avgHourlyRate = group.activities.length > 0 ? group.activities[0].hourlyRate : 0;
              
              return `
                <tr style="background-color: #f8f9fa; border-top: 2px solid ${primaryColor};">
                  <td style="font-weight: bold; color: ${primaryColor};">
                    📅 ${formattedDate}
                  </td>
                  <td style="font-weight: bold;">
                    ${activitiesList}
                  </td>
                  <td style="font-weight: bold; color: ${primaryColor};">
                    ${group.totalHours.toFixed(1)}h
                  </td>
                  <td style="font-weight: bold;">
                    €${avgHourlyRate.toFixed(2)}
                  </td>
                  <td style="font-weight: bold; color: ${primaryColor};">
                    €${group.totalAmount.toFixed(2)}
                  </td>
                </tr>
              `;
            }).join('');
          })() : entity.lineItems?.length > 0 ? (() => {
            const lineItems = entity.lineItems;
            // Parent-First + Grouped Sub-Items Logic (consistent with frontend & DB schema)
            const parentItems = lineItems.filter((item: any) => item.parentItemId === undefined || item.parentItemId === null);
            return parentItems.map((parentItem: any, parentIndex: number) => {
              // Get all sub-items for this parent via DB-ID matching
              const subItems = lineItems.filter((item: any) => 
                item.parentItemId === parentItem.id
              );
              
              // Parent item row
              let html = `
                <tr>
                  <td>
                    ${parentItem.title}
                    ${parentItem.description ? `<br><small>${convertMarkdownToHtml(parentItem.description)}</small>` : ''}
                    ${parentItem.attachments && parentItem.attachments.length > 0 ? `
                      <div style="margin-top: 8px;">
                        <strong style="font-size: 11px; color: #666;">📎 Anhänge (${parentItem.attachments.length}):</strong>
                        <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                          ${parentItem.attachments.map((attachment: any) => {
                            console.log('🖼️ [PDF TEMPLATE] Processing attachment:', attachment.filename, 'has base64:', !!attachment.base64Data);
                            
                            if (attachment.base64Data) {
                              try {
                                // Direkte Verwendung der Base64-Daten als Data-URL (OHNE temporäre Dateien)
                                let dataUrl = attachment.base64Data;
                                
                                // Stelle sicher, dass die Data-URL korrekt formatiert ist
                                if (!dataUrl.startsWith('data:')) {
                                  const mimeType = attachment.fileType || 'image/png';
                                  dataUrl = `data:${mimeType};base64,${dataUrl}`;
                                }
                                
                                console.log('🖼️ [PDF TEMPLATE] Using data URL directly for:', attachment.originalFilename);
                                console.log('🖼️ [PDF TEMPLATE] Data URL length:', dataUrl.length);
                                
                                // Verkürze die Base64-Daten für kleinere Bilder (falls zu groß)
                                const maxDataUrlLength = 2000000; // 2MB limit
                                if (dataUrl.length > maxDataUrlLength) {
                                  console.log('🖼️ [PDF TEMPLATE] Image too large, showing placeholder');
                                  return `
                                    <div style="display: inline-block; text-align: center; margin: 4px; padding: 8px; border: 1px dashed #ccc; border-radius: 3px;">
                                      <div style="font-size: 24px; margin-bottom: 4px;">📷</div>
                                      <div style="font-size: 9px; color: #888; max-width: 80px; word-wrap: break-word;">
                                        ${attachment.originalFilename}
                                      </div>
                                      <div style="font-size: 8px; color: #999;">
                                        (${Math.round(dataUrl.length/1024)}KB)
                                      </div>
                                    </div>
                                  `;
                                }
                                
                                return `
                                  <div style="display: inline-block; text-align: center; margin: 4px;">
                                    <img src="${dataUrl}" 
                                         alt="${attachment.originalFilename}" 
                                         style="width: 60px; height: 45px; object-fit: cover; border: 1px solid #ddd; border-radius: 3px; display: block;" 
                                         onerror="this.style.display='none'; this.nextElementSibling.innerHTML='❌ Fehler';" />
                                    <div style="font-size: 9px; color: #888; margin-top: 2px; max-width: 60px; word-wrap: break-word;">
                                      ${attachment.originalFilename}
                                    </div>
                                  </div>
                                `;
                              } catch (error) {
                                console.error('🖼️ [PDF TEMPLATE] Error creating temp image:', error);
                                return `
                                  <div style="font-size: 10px; color: #999; border: 1px dashed #ccc; padding: 4px; border-radius: 3px;">
                                    📎 ${attachment.originalFilename} (Fehler beim Laden)
                                  </div>
                                `;
                              }
                            } else {
                              console.log('🖼️ [PDF TEMPLATE] No base64 data for:', attachment.originalFilename);
                              return `
                                <div style="font-size: 10px; color: #999; border: 1px dashed #ccc; padding: 4px; border-radius: 3px;">
                                  📎 ${attachment.originalFilename} (nicht verfügbar)
                                </div>
                              `;
                            }
                          }).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </td>
                  <td>${parentItem.quantity || 0}</td>
                  <td>€${(typeof parentItem.unitPrice === 'number' && !isNaN(parentItem.unitPrice)) ? parentItem.unitPrice.toFixed(2) : '0.00'}</td>
                  <td>€${(typeof parentItem.total === 'number' && !isNaN(parentItem.total)) ? parentItem.total.toFixed(2) : '0.00'}</td>
                </tr>
              `;
              
              // Sub-items for this parent (grouped underneath)
              subItems.forEach((subItem: any) => {
                // ✅ Price Display Mode Support (v1.0.42.6)
                let quantityDisplay = '';
                let priceDisplay = '';
                let totalDisplay = '';
                
                switch (subItem.priceDisplayMode) {
                  case 'included':
                    quantityDisplay = '—';
                    priceDisplay = '<em style="color: #666;">inkl.</em>';
                    totalDisplay = '<em style="color: #666;">inkl.</em>';
                    break;
                  case 'hidden':
                    quantityDisplay = '—';
                    priceDisplay = '—';
                    totalDisplay = '—';
                    break;
                  case 'optional':
                    quantityDisplay = subItem.quantity || 0;
                    priceDisplay = '<em style="color: #666; font-size: 10px;">optional</em>';
                    totalDisplay = '<em style="color: #666; font-size: 10px;">optional</em>';
                    break;
                  default: // 'default' or undefined
                    quantityDisplay = subItem.quantity || 0;
                    priceDisplay = `€${(typeof subItem.unitPrice === 'number' && !isNaN(subItem.unitPrice)) ? subItem.unitPrice.toFixed(2) : '0.00'}`;
                    totalDisplay = `€${(typeof subItem.total === 'number' && !isNaN(subItem.total)) ? subItem.total.toFixed(2) : '0.00'}`;
                }
                
                html += `
                  <tr class="sub-item">
                    <td>
                      ↳ ${subItem.title}
                      ${subItem.description ? `<br><small>${convertMarkdownToHtml(subItem.description)}</small>` : ''}
                      ${subItem.attachments && subItem.attachments.length > 0 ? `
                        <div style="margin-top: 6px; margin-left: 16px;">
                          <strong style="font-size: 10px; color: #666;">📎 Anhänge:</strong>
                          <div style="display: flex; gap: 4px; margin-top: 3px; flex-wrap: wrap;">
                            ${subItem.attachments.map((attachment: any) => {
                              if (attachment.base64Data) {
                                try {
                                  // ✅ KONSISTENZ-FIX: Gleiche Data-URL Logik wie Parent-Items für Dev-Prod Kompatibilität
                                  // Direkte Verwendung der Base64-Daten als Data-URL (OHNE temporäre Dateien)
                                  let dataUrl = attachment.base64Data;
                                  
                                  // Stelle sicher, dass die Data-URL korrekt formatiert ist
                                  if (!dataUrl.startsWith('data:')) {
                                    const mimeType = attachment.fileType || 'image/png';
                                    dataUrl = `data:${mimeType};base64,${dataUrl}`;
                                  }
                                  
                                  console.log('🖼️ [PDF TEMPLATE] Sub-Item: Using data URL directly for:', attachment.originalFilename);
                                  console.log('🖼️ [PDF TEMPLATE] Sub-Item: Data URL length:', dataUrl.length);
                                  
                                  // Verkürze die Base64-Daten für kleinere Bilder (falls zu groß)
                                  const maxDataUrlLength = 2000000; // 2MB limit
                                  if (dataUrl.length > maxDataUrlLength) {
                                    console.log('🖼️ [PDF TEMPLATE] Sub-Item: Image too large, showing placeholder');
                                    return `
                                      <div style="display: inline-block; text-align: center; margin: 2px; padding: 4px; border: 1px dashed #ccc; border-radius: 2px;">
                                        <div style="font-size: 16px; margin-bottom: 2px;">📷</div>
                                        <div style="font-size: 8px; color: #888; max-width: 50px; word-wrap: break-word;">
                                          ${attachment.originalFilename}
                                        </div>
                                        <div style="font-size: 7px; color: #999;">
                                          (${Math.round(dataUrl.length/1024)}KB)
                                        </div>
                                      </div>
                                    `;
                                  }
                                  
                                  return `
                                    <div style="display: inline-block; text-align: center; margin: 2px;">
                                      <img src="${dataUrl}" 
                                           alt="${attachment.originalFilename}" 
                                           style="width: 50px; height: 38px; object-fit: cover; border: 1px solid #ddd; border-radius: 2px; display: block;" 
                                           onerror="this.style.display='none'; this.nextElementSibling.innerHTML='❌ Fehler';" />
                                      <div style="font-size: 8px; color: #888; margin-top: 1px; max-width: 50px; word-wrap: break-word;">
                                        ${attachment.originalFilename}
                                      </div>
                                    </div>
                                  `;
                                } catch (error) {
                                  console.error('🖼️ [PDF TEMPLATE] Sub-Item: Error creating data URL:', error);
                                  return `
                                    <div style="font-size: 9px; color: #999; border: 1px dashed #ccc; padding: 2px; border-radius: 2px;">
                                      📎 ${attachment.originalFilename} (Fehler beim Laden)
                                    </div>
                                  `;
                                }
                              } else {
                                console.log('🖼️ [PDF TEMPLATE] Sub-Item: No base64 data for:', attachment.originalFilename);
                                return `
                                  <div style="font-size: 9px; color: #999; border: 1px dashed #ccc; padding: 2px; border-radius: 2px;">
                                    📎 ${attachment.originalFilename} (nicht verfügbar)
                                  </div>
                                `;
                              }
                            }).join('')}
                          </div>
                        </div>
                      ` : ''}
                    </td>
                    <td>${quantityDisplay}</td>
                    <td>${priceDisplay}</td>
                    <td>${totalDisplay}</td>
                  </tr>
                `;
              });
              
              return html;
            }).join('');
          })() : templateType === 'timesheet' ? '<tr><td colspan="5">Keine Aktivitäten</td></tr>' : '<tr><td colspan="4">Keine Positionen</td></tr>'}
        </tbody>
      </table>

      <div class="totals">
        <div>Zwischensumme: €${entity.subtotalBeforeDiscount?.toFixed(2) || entity.subtotal?.toFixed(2) || entity.total?.toFixed(2) || '0.00'}</div>
        ${entity.discountType && entity.discountValue > 0 ? 
          `<div style="color: ${secondaryColor};">Rabatt (${entity.discountType === 'percentage' ? entity.discountValue + '%' : '€' + entity.discountValue.toFixed(2)}): -€${entity.discountAmount?.toFixed(2) || '0.00'}</div>` : 
          ''
        }
        ${entity.discountType && entity.discountValue > 0 ? 
          `<div>Netto nach Rabatt: €${entity.subtotal?.toFixed(2) || '0.00'}</div>` : 
          ''
        }
        ${!settings?.companyData?.kleinunternehmer && entity.vatAmount && entity.vatAmount > 0 ? 
          `<div>MwSt. (${entity.vatRate || 19}%): €${entity.vatAmount.toFixed(2)}</div>` : 
          ''
        }
        ${settings?.companyData?.kleinunternehmer ? 
          '<div style="font-size: 12px; color: #666;">Umsatzsteuerbefreit nach §19 UStG</div>' : 
          ''
        }
        <div class="total-row">Total: €${entity.total?.toFixed(2) || '0.00'}</div>
      </div>

      ${entity.notes ? (
        entity.notes.length > 200 ? 
          `<div class="notes"><strong>Anmerkungen:</strong><br>Siehe separate Anmerkungsseite für detaillierte Notizen.</div>` :
          `<div class="notes"><strong>Anmerkungen:</strong><br>${convertMarkdownToHtml(entity.notes)}</div>`
      ) : ''}

      <!-- ✅ SEPARATE ANMERKUNGEN-SEITE (vor Attachments) - FIX: Issues #1 & #2 - Konsistent mit body margin -->
      ${entity.notes && entity.notes.length > 200 ? `
        <div style="page-break-before: always; padding: 15px;">
          <div style="border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: ${primaryColor}; font-size: 24px; margin: 0; font-weight: 600;">
              Anmerkungen
            </h2>
            <div style="color: ${textColor}; font-size: 14px; margin-top: 8px;">
              ${templateType === 'offer' ? 'Angebot' : templateType === 'invoice' ? 'Rechnung' : 'Leistungsnachweis'} - Detaillierte Anmerkungen
            </div>
          </div>

          <div style="
            background-color: ${primaryColor}10; 
            border-left: 4px solid ${primaryColor}; 
            padding: 10px; 
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.6;
            color: ${textColor};
            margin-bottom: 20px;
          ">
            ${convertMarkdownToHtml(entity.notes)}
          </div>

          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid ${primaryColor}40; color: ${textColor}; font-size: 12px; text-align: center;">
            Anmerkungen - Seite ${templateType === 'offer' ? 'Angebot' : templateType === 'invoice' ? 'Rechnung' : 'Leistungsnachweis'}
          </div>
        </div>
      ` : ''}

      <!-- ✅ STANDARDS-KONFORME ANHANG-SEITE -->
      ${(() => {
        console.log('🔍 [PDF DEBUG] About to generate attachments page for templateType:', templateType);
        console.log('🔍 [PDF DEBUG] Entity has lineItems:', !!entity.lineItems);
        if (entity.lineItems) {
          console.log('🔍 [PDF DEBUG] Number of lineItems:', entity.lineItems.length);
          entity.lineItems.forEach((item: any, index: number) => {
            console.log(`🔍 [PDF DEBUG] LineItem ${index}: has attachments:`, !!item.attachments, 'count:', item.attachments?.length || 0);
          });
        }
        // Note: generateAttachmentsPage will be imported from pdf-attachments module in Phase 3
        const attachmentPageHTML = '<!-- Attachments page will be implemented in Phase 3 -->';
        console.log('🔍 [PDF DEBUG] Attachments page placeholder for Phase 3');
        return attachmentPageHTML;
      })()}
      
    </body>
    </html>
  `;
}

/**
 * Convert Markdown to HTML with safe configuration for PDF generation
 * 
 * @param markdown - Markdown string to convert (can be undefined)
 * @returns Safe HTML string for PDF inclusion
 */
export function convertMarkdownToHtml(markdown: string | undefined): string {
  if (!markdown?.trim()) return '';
  
  // Konfiguriere marked für PDF-sichere HTML-Ausgabe
  marked.setOptions({
    gfm: true,
    breaks: true // Zeilenumbrüche beibehalten
  });
  
  try {
    // Konvertiere zu HTML (marked ist in der neuesten Version synchron für strings)
    const htmlResult = marked.parse(markdown);
    const html = typeof htmlResult === 'string' ? htmlResult : '';
    
    // Entferne potentiell problematische Elemente für PDF
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Scripts entfernen
      .replace(/href="http[^"]*"/gi, '') // Externe Links entfernen für PDF
      .replace(/<a[^>]*>/gi, '<span>') // Links zu spans für PDF
      .replace(/<\/a>/gi, '</span>')
      .replace(/<h[1-6][^>]*>/gi, '<strong>') // Überschriften zu bold für PDF
      .replace(/<\/h[1-6]>/gi, '</strong>');
    
  } catch (error) {
    console.error('Markdown conversion error:', error);
    // Fallback: Text mit manuellen <br> für Zeilenumbrüche
    return markdown.split('\n').join('<br>');
  }
}