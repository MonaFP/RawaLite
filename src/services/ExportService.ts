import type { Customer } from "../persistence/adapter";
import PATHS from "../lib/paths";

export class ExportService {
  
  // CSV Export für Kunden
  static exportCustomersToCSV(customers: Customer[]): void {
    const headers = ['ID', 'Nummer', 'Name', 'E-Mail', 'Telefon', 'Straße', 'PLZ', 'Ort', 'Notizen', 'Erstellt', 'Aktualisiert'];
    
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

  private static async downloadFile(content: string, filename: string, mimeType: string): Promise<void> {
    try {
      // 🗂️ Verwende zentrale Pfadabstraktion (Phase 2)
      const exportsDir = await PATHS.EXPORTS_DIR();
      await PATHS.ensureDir(exportsDir);
      
      // TODO: Implement file writing when Electron file API is available
      // For now, use browser download as fallback
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ File exported: ${filename} (fallback browser download)`);
    } catch (error) {
      console.error('Failed to export file:', error);
      throw error;
    }
  }
}
