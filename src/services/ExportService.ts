import type { Customer } from "../persistence/adapter";

export class ExportService {
  
  // CSV Export für Kunden
  static exportCustomersToCSV(customers: Customer[]): void {
    const headers = ['ID', 'Nummer', 'Name', 'E-Mail', 'Telefon', 'Straße', 'PLZ', 'Stadt', 'Notizen', 'Erstellt', 'Aktualisiert'];
    
    const csvContent = [
      headers.join(';'),
      ...customers.map(customer => [
        customer.id,
        customer.number,
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.street || '',
        customer.zip || '',
        customer.city || '',
        customer.notes || '',
        customer.createdAt,
        customer.updatedAt
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    this.downloadFile(csvContent, `kunden_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  }

  // PDF Export für Angebote (with preview option)
  static async exportOfferToPDF(offer: any, customer: Customer, settings: any, previewOnly: boolean = false): Promise<void> {
    const html = this.generateOfferHTML(offer, customer, settings);
    await this.htmlToPDF(html, `angebot_${offer.offerNumber}.pdf`, previewOnly);
  }

  // PDF Export für Rechnungen (with preview option)
  static async exportInvoiceToPDF(invoice: any, customer: Customer, settings: any, previewOnly: boolean = false): Promise<void> {
    const html = this.generateInvoiceHTML(invoice, customer, settings);
    await this.htmlToPDF(html, `rechnung_${invoice.invoiceNumber}.pdf`, previewOnly);
  }

  private static generateOfferHTML(offer: any, customer: Customer, settings: any): string {
    const date = new Date().toLocaleDateString('de-DE');
    const validUntil = new Date(offer.validUntil).toLocaleDateString('de-DE');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Angebot ${offer.offerNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .company { font-weight: bold; }
          .logo { max-width: 200px; max-height: 80px; }
          .customer { margin-bottom: 30px; }
          .document-title { font-size: 24px; font-weight: bold; margin: 30px 0; }
          .meta-info { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .sub-item { padding-left: 20px; font-style: italic; color: #666; }
          .totals { margin-top: 30px; text-align: right; }
          .total-row { font-weight: bold; font-size: 18px; }
          .notes { margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            ${settings.companyData?.name || 'Ihr Unternehmen'}<br>
            ${settings.companyData?.street || ''}<br>
            ${settings.companyData?.postalCode || ''} ${settings.companyData?.city || ''}
          </div>
          ${settings.companyData?.logo ? `<img src="${settings.companyData.logo}" alt="Logo" class="logo">` : ''}
        </div>

        <div class="customer">
          <strong>${customer.name}</strong><br>
          ${customer.street || ''}<br>
          ${customer.zip || ''} ${customer.city || ''}<br>
        </div>

        <div class="document-title">Angebot ${offer.offerNumber}</div>

        <div class="meta-info">
          <strong>Datum:</strong> ${date}<br>
          <strong>Gültig bis:</strong> ${validUntil}<br>
          <strong>Betreff:</strong> ${offer.title}
        </div>

        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Menge</th>
              <th>Einzelpreis</th>
              <th>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${offer.lineItems.map((item: any) => `
              <tr class="${item.parentItemId ? 'sub-item' : ''}">
                <td>
                  ${item.parentItemId ? '↳ ' : ''}${item.title}
                  ${item.description ? `<br><small>${item.description}</small>` : ''}
                </td>
                <td>${item.quantity}</td>
                <td>€${item.unitPrice.toFixed(2)}</td>
                <td>€${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>Zwischensumme: €${offer.subtotal?.toFixed(2) || offer.total.toFixed(2)}</div>
          ${!settings?.companyData?.kleinunternehmer && offer.vatAmount ? 
            `<div>MwSt. (${offer.vatRate || 19}%): €${offer.vatAmount.toFixed(2)}</div>` : 
            '<div style="font-size: 12px; color: #666;">Umsatzsteuerbefreit nach §19 UStG</div>'
          }
          <div class="total-row">Gesamtbetrag: €${offer.total.toFixed(2)}</div>
        </div>

        ${offer.notes ? `<div class="notes"><strong>Anmerkungen:</strong><br>${offer.notes}</div>` : ''}
      </body>
      </html>
    `;
  }

  private static generateInvoiceHTML(invoice: any, customer: Customer, settings: any): string {
    const date = new Date().toLocaleDateString('de-DE');
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('de-DE');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rechnung ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .company { font-weight: bold; }
          .logo { max-width: 200px; max-height: 80px; }
          .customer { margin-bottom: 30px; }
          .document-title { font-size: 24px; font-weight: bold; margin: 30px 0; }
          .meta-info { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .sub-item { padding-left: 20px; font-style: italic; color: #666; }
          .totals { margin-top: 30px; text-align: right; }
          .total-row { font-weight: bold; font-size: 18px; }
          .notes { margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            ${settings.companyData?.name || 'Ihr Unternehmen'}<br>
            ${settings.companyData?.street || ''}<br>
            ${settings.companyData?.postalCode || ''} ${settings.companyData?.city || ''}
          </div>
          ${settings.companyData?.logo ? `<img src="${settings.companyData.logo}" alt="Logo" class="logo">` : ''}
        </div>

        <div class="customer">
          <strong>${customer.name}</strong><br>
          ${customer.street || ''}<br>
          ${customer.zip || ''} ${customer.city || ''}<br>
        </div>

        <div class="document-title">Rechnung ${invoice.invoiceNumber}</div>

        <div class="meta-info">
          <strong>Rechnungsdatum:</strong> ${date}<br>
          <strong>Fällig am:</strong> ${dueDate}<br>
          <strong>Betreff:</strong> ${invoice.title}
        </div>

        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Menge</th>
              <th>Einzelpreis</th>
              <th>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.lineItems.map((item: any) => `
              <tr class="${item.parentItemId ? 'sub-item' : ''}">
                <td>
                  ${item.parentItemId ? '↳ ' : ''}${item.title}
                  ${item.description ? `<br><small>${item.description}</small>` : ''}
                </td>
                <td>${item.quantity}</td>
                <td>€${item.unitPrice.toFixed(2)}</td>
                <td>€${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>Zwischensumme: €${invoice.subtotal?.toFixed(2) || invoice.total.toFixed(2)}</div>
          ${!settings?.companyData?.kleinunternehmer && invoice.vatAmount ? 
            `<div>MwSt. (${invoice.vatRate || 19}%): €${invoice.vatAmount.toFixed(2)}</div>` : 
            '<div style="font-size: 12px; color: #666;">Umsatzsteuerbefreit nach §19 UStG</div>'
          }
          <div class="total-row">Gesamtbetrag: €${invoice.total.toFixed(2)}</div>
        </div>

        ${invoice.notes ? `<div class="notes"><strong>Anmerkungen:</strong><br>${invoice.notes}</div>` : ''}
      </body>
      </html>
    `;
  }

  private static async htmlToPDF(html: string, filename: string, previewOnly: boolean = false): Promise<void> {
    try {
      // Use jsPDF with html2canvas for modern PDF generation without popups
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // Create a temporary container for the HTML
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.background = 'white';
      container.style.padding = '20px';
      document.body.appendChild(container);
      
      try {
        // Convert HTML to canvas
        const canvas = await html2canvas(container, {
          scale: 2, // Higher quality
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123 // A4 height in pixels at 96 DPI
        });
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        if (previewOnly) {
          // Open PDF in new tab for preview
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          const previewWindow = window.open(pdfUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
          if (!previewWindow) {
            // Fallback: Ask user to allow popup and try again
            const allowPreview = confirm(`🔍 PDF-Vorschau benötigt ein Popup!

Möchten Sie:
- "OK" → Popup erlauben und Vorschau öffnen
- "Abbrechen" → PDF direkt herunterladen`);
            
            if (allowPreview) {
              // User wants preview but popup blocked - show inline
              this.showInlinePDFPreview(pdfBlob, filename);
            } else {
              // User prefers direct download
              pdf.save(filename);
            }
          } else {
            // Preview opened successfully
            console.log(`✅ PDF preview "${filename}" opened in new tab`);
            
            // Add event listener to clean up URL when window closes
            previewWindow.addEventListener('beforeunload', () => {
              URL.revokeObjectURL(pdfUrl);
            });
          }
        } else {
          // Direct download
          pdf.save(filename);
          console.log(`✅ PDF "${filename}" downloaded successfully`);
        }
        
      } finally {
        // Clean up temporary container
        document.body.removeChild(container);
      }
      
    } catch (error) {
      console.warn('Modern PDF generation failed, falling back to print dialog:', error);
      
      // Fallback to print dialog if modern method fails
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        // Last resort: use current window print
        const printDiv = document.createElement('div');
        printDiv.innerHTML = html;
        printDiv.style.position = 'fixed';
        printDiv.style.top = '-1000px';
        printDiv.style.left = '-1000px';
        printDiv.style.width = '210mm';
        printDiv.style.height = '297mm';
        document.body.appendChild(printDiv);
        
        window.focus();
        window.print();
        
        setTimeout(() => {
          document.body.removeChild(printDiv);
        }, 1000);
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      };
    }
  }

  // Helper method for inline PDF preview when popups are blocked
  private static showInlinePDFPreview(pdfBlob: Blob, filename: string): void {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;
    
    // Create preview container
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 90%;
      max-height: 90%;
      display: flex;
      flex-direction: column;
      gap: 15px;
    `;
    
    // Title and controls
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    `;
    
    const title = document.createElement('h3');
    title.textContent = `PDF Vorschau: ${filename}`;
    title.style.margin = '0';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px;';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '💾 Herunterladen';
    downloadBtn.style.cssText = `
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌ Schließen';
    closeBtn.style.cssText = `
      padding: 8px 16px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    
    // PDF iframe
    const iframe = document.createElement('iframe');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    iframe.src = pdfUrl;
    iframe.style.cssText = `
      width: 800px;
      height: 600px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;
    
    // Event handlers
    downloadBtn.onclick = () => {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      link.click();
    };
    
    closeBtn.onclick = () => {
      document.body.removeChild(overlay);
      URL.revokeObjectURL(pdfUrl);
    };
    
    // Escape key to close
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        URL.revokeObjectURL(pdfUrl);
        document.removeEventListener('keydown', escapeHandler);
      }
    });
    
    // Build modal
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(buttonContainer);
    container.appendChild(header);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
