import React, { useState, useMemo } from 'react';
import { Table } from '../components/Table';
import { InvoiceForm } from '../components/InvoiceForm';
import { useInvoices } from '../hooks/useInvoices';
import { useCustomers } from '../hooks/useCustomers';
import { useOffers } from '../hooks/useOffers';
import { useSettings } from '../contexts/SettingsContext';
import { useDesignSettings } from '../hooks/useDesignSettings';
import { useNotifications } from '../contexts/NotificationContext';
import { ExportService } from '../services/ExportService';
import { PDFService } from '../services/PDFService';
import type { Invoice } from '../persistence/adapter';

interface RechnungenPageProps {
  title?: string;
}

export default function RechnungenPage({ title = "Rechnungen" }: RechnungenPageProps) {
  const { invoices, loading, error, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { customers } = useCustomers();
  const { offers } = useOffers();
  const { settings } = useSettings();
  const { currentTheme, currentCustomColors } = useDesignSettings();
  const { showSuccess, showError } = useNotifications();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [current, setCurrent] = useState<Invoice | null>(null);

  const columns = useMemo(() => ([
    { key: "invoiceNumber", header: "Nummer" },
    { 
      key: "customerId", 
      header: "Kunde", 
      render: (row: Invoice) => {
        const customer = customers.find(c => c.id === row.customerId);
        return customer?.name || `Kunde #${row.customerId}`;
      }
    },
    { key: "title", header: "Titel" },
    { 
      key: "status", 
      header: "Status", 
      render: (row: Invoice) => {
        const statusColors = {
          draft: '#6b7280',
          sent: '#3b82f6',
          paid: '#10b981',
          overdue: '#ef4444',
          cancelled: '#ef4444'
        };
        const statusTexts = {
          draft: 'Entwurf',
          sent: 'Versendet',
          paid: 'Bezahlt',
          overdue: 'Überfällig',
          cancelled: 'Storniert'
        };
        const color = statusColors[row.status as keyof typeof statusColors] || '#6b7280';
        const text = statusTexts[row.status as keyof typeof statusTexts] || row.status;
        return (
          <span style={{
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: color + "20",
            color: color
          }}>
            {text}
          </span>
        );
      }
    },
    { 
      key: "total", 
      header: "Gesamtbetrag", 
      render: (row: Invoice) => `€${row.total.toFixed(2)}`
    },
    { 
      key: "dueDate", 
      header: "Fällig am", 
      render: (row: Invoice) => row.dueDate ? new Date(row.dueDate).toLocaleDateString('de-DE') : '-'
    },
    { 
      key: "id", 
      header: "Aktionen", 
      render: (row: Invoice) => (
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            className="btn btn-info"
            onClick={() => handlePreviewPDF(row)}
            style={{
              padding: "4px 8px",
              fontSize: "12px"
            }}
            title="PDF Vorschau anzeigen"
          >
            👁️ Vorschau
          </button>
          <button
            className="btn btn-warning"
            onClick={() => handleExportPDF(row)}
            style={{
              padding: "4px 8px",
              fontSize: "12px"
            }}
            title="PDF herunterladen"
          >
            💾 PDF
          </button>
          <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => { setCurrent(row); setMode("edit"); }}>Bearbeiten</button>
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value as Invoice['status'])}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "4px",
              background: "rgba(17,24,39,.8)",
              color: "var(--muted)",
              cursor: "pointer"
            }}
          >
            <option value="draft">Entwurf</option>
            <option value="sent">Gesendet</option>
            <option value="paid">Bezahlt</option>
            <option value="overdue">Überfällig</option>
            <option value="cancelled">Storniert</option>
          </select>
          <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => { if (confirm("Diese Rechnung wirklich löschen?")) handleRemove(row.id); }}>Löschen</button>
        </div>
      ) 
    }
  ]), [customers]);

  async function handleCreate(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) {
    await createInvoice(invoiceData);
    setMode("list");
  }

  async function handleEdit(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!current) return;
    await updateInvoice(current.id, invoiceData);
    setMode("list");
    setCurrent(null);
  }

  async function handleStatusChange(invoiceId: number, newStatus: Invoice['status']) {
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) return;
      
      // Prepare status date fields
      const now = new Date().toISOString();
      const statusDates: Partial<Invoice> = {};
      
      switch (newStatus) {
        case 'sent':
          statusDates.sentAt = now;
          break;
        case 'paid':
          statusDates.paidAt = now;
          break;
        case 'overdue':
          statusDates.overdueAt = now;
          break;
        case 'cancelled':
          statusDates.cancelledAt = now;
          break;
      }
      
      await updateInvoice(invoiceId, { ...invoice, status: newStatus, ...statusDates });
      
      // Success notification
      const statusLabels = {
        'draft': 'Entwurf',
        'sent': 'Gesendet', 
        'paid': 'Bezahlt',
        'overdue': 'Überfällig',
        'cancelled': 'Storniert'
      };
      showSuccess(`Rechnungs-Status auf "${statusLabels[newStatus]}" geändert`);
    } catch (error) {
      showError('Fehler beim Ändern des Status');
    }
  }

  async function handleRemove(id: number) {
    await deleteInvoice(id);
  }

  const handleExportPDF = async (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    if (!customer) {
      alert('Kunde nicht gefunden');
      return;
    }

    try {
      console.log('🎯 Starting PDF export for invoice:', invoice.invoiceNumber);
      
      // Use new PDFService implementation
      // Use new PDFService implementation with theme integration
      const result = await PDFService.exportInvoiceToPDF(
        invoice, 
        customer, 
        settings, 
        false, // isPreview
        currentTheme,
        currentCustomColors
      );
      
      if (result.success) {
        console.log('✅ PDF export successful:', result.filePath);
        alert(`� PDF erfolgreich erstellt!\n\nDatei: ${result.filePath}\nGröße: ${Math.round((result.fileSize || 0) / 1024)} KB`);
      } else {
        console.error('❌ PDF export failed:', result.error);
        alert(`❌ PDF-Export fehlgeschlagen:\n\n${result.error}`);
      }
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('PDF Export fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const handlePreviewPDF = async (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    if (!customer) {
      alert('Kunde nicht gefunden');
      return;
    }

    try {
      console.log('🔍 Starting PDF preview for invoice:', invoice.invoiceNumber);
      
      // Use new PDFService implementation
      // Use new PDFService implementation with theme integration
      const result = await PDFService.exportInvoiceToPDF(
        invoice, 
        customer, 
        settings, 
        true, // isPreview
        currentTheme,
        currentCustomColors
      );
      
      if (result.success) {
        console.log('✅ PDF preview successful');
        // PDFService automatically shows the preview modal
      } else {
        console.error('❌ PDF preview failed:', result.error);
        alert(`❌ PDF-Vorschau fehlgeschlagen:\n\n${result.error}`);
      }
    } catch (error) {
      console.error('PDF Preview failed:', error);
      alert('PDF Vorschau fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  if (loading) return <div className="card">Lade Rechnungen...</div>;
  if (error) return <div className="card">Fehler: {error}</div>;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0" }}>{title}</h2>
          <div style={{ opacity: 0.7 }}>Verwalte deine Rechnungen und exportiere sie als PDF.</div>
        </div>
        <button className="btn" onClick={() => setMode(mode === "create" ? "list" : "create")}>
          {mode === "create" ? "Abbrechen" : "Neue Rechnung"}
        </button>
      </div>
      
      <Table<Invoice>
        columns={columns as any}
        data={invoices}
        emptyMessage="Noch keine Rechnungen erstellt."
      />

      {mode === "create" && (
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 4px 0" }}>Neue Rechnung</h3>
            <div style={{ opacity: 0.7 }}>Erstelle eine neue Rechnung.</div>
          </div>
          <InvoiceForm
            customers={customers}
            offers={offers}
            onSave={handleCreate}
            onCancel={() => setMode("list")}
          />
        </div>
      )}

      {mode === "edit" && current && (
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 4px 0" }}>Rechnung bearbeiten</h3>
            <div style={{ opacity: 0.7 }}>Bearbeite die Rechnung "{current.title}".</div>
          </div>
          <InvoiceForm
            invoice={current}
            customers={customers}
            offers={offers}
            onSave={handleEdit}
            onCancel={() => { setMode("list"); setCurrent(null); }}
          />
        </div>
      )}
    </div>
  );
}
