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

  // PDF Export für Angebote (simplified HTML to PDF)
  static async exportOfferToPDF(offer: any, customer: Customer, settings: any): Promise<void> {
    const html = this.generateOfferHTML(offer, customer, settings);
    await this.htmlToPDF(html, `angebot_${offer.offerNumber}.pdf`);
  }

  // PDF Export für Rechnungen
  static async exportInvoiceToPDF(invoice: any, customer: Customer, settings: any): Promise<void> {
    const html = this.generateInvoiceHTML(invoice, customer, settings);
    await this.htmlToPDF(html, `rechnung_${invoice.invoiceNumber}.pdf`);
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

  private static async htmlToPDF(html: string, filename: string): Promise<void> {
    // For Electron environment, we'll use the print API
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // If Electron API is available, use it for better PDF generation
      try {
        await (window as any).electronAPI.printToPDF(html, filename);
        return;
      } catch (err) {
        console.warn('Electron PDF failed, falling back to browser print');
      }
    }

    // Fallback: Create a new window with the HTML content for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite und versuchen Sie es erneut.');
      return;
    }

    // Write the HTML content
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then focus and print
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        // Don't automatically close - let user decide
      }, 1000);
    };
    
    // If onload doesn't fire, try after a delay
    setTimeout(() => {
      if (printWindow.document.readyState === 'complete') {
        printWindow.focus();
        printWindow.print();
      }
    }, 2000);
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
