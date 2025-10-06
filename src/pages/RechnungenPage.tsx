import React, { useState, useMemo } from 'react';
import { Table } from '../components/Table';
import { InvoiceForm } from '../components/InvoiceForm';
import { StatusControl } from '../components/StatusControl';
import { SearchAndFilterBar, useTableSearch, FilterConfig } from '../components/SearchAndFilter';
import { useInvoices } from '../hooks/useInvoices';
import { useCustomers } from '../hooks/useCustomers';
import { useOffers } from '../hooks/useOffers';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PDFService } from '../services/PDFService';
import type { Invoice } from '../persistence/adapter';

interface RechnungenPageProps {
  title?: string;
}

export default function RechnungenPage({ title = "Rechnungen" }: RechnungenPageProps) {
  const { settings, loading, error } = useUnifiedSettings();
  const { invoices, loading: invoicesLoading, error: invoicesError, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { customers } = useCustomers();
  const { offers } = useOffers();
  const { currentTheme } = useTheme(); // Add current theme access
  const { showSuccess, showError } = useNotifications();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [current, setCurrent] = useState<Invoice | null>(null);

  // DEBUG: Log the invoices data
  console.log('🔍 [RECHNUNGEN PAGE] invoices from useInvoices:', invoices);
  console.log('🔍 [RECHNUNGEN PAGE] invoicesLoading:', invoicesLoading);
  console.log('🔍 [RECHNUNGEN PAGE] invoicesError:', invoicesError);

  // Search and Filter Configuration for Invoices
  const searchFieldMapping = useMemo(() => ({
    invoiceNumber: 'invoiceNumber',
    customer: (invoice: Invoice) => {
      const customer = customers.find(c => c.id === invoice.customerId);
      return customer?.name || '';
    },
    title: 'title',
    status: 'status',
    dueDate: 'dueDate',
    total: 'total'
  }), [customers]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      field: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Entwurf' },
        { value: 'sent', label: 'Versendet' },
        { value: 'paid', label: 'Bezahlt' },
        { value: 'overdue', label: 'Überfällig' }
      ]
    },
    {
      field: 'dueDate',
      label: 'Fälligkeitsdatum',
      type: 'dateRange'
    },
    {
      field: 'total',
      label: 'Rechnungsbetrag',
      type: 'numberRange',
      min: 0,
      step: 0.01
    },
    {
      field: 'customerId',
      label: 'Kunde',
      type: 'select',
      options: customers.map(customer => ({
        value: customer.id,
        label: customer.name
      }))
    }
  ], [customers]);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    clearAll,
    filteredData,
    activeFilterCount
  } = useTableSearch(invoices, searchFieldMapping);

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
          draft: '#6b7280',     // Harmonisches Grau - konsistent mit Dashboard
          sent: '#f59e0b',      // Warmes Orange statt knalliges Blau  
          paid: '#22c55e',      // Harmonisches Grün - konsistent mit Dashboard
          overdue: '#ef4444',   // Harmonisches Rot - konsistent mit Dashboard
          cancelled: '#6b7280'  // Harmonisches Grau - konsistent mit Dashboard
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
          <div 
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: color,
              margin: '0 auto',
              flexShrink: 0
            }}
            title={text} // Tooltip zeigt den Status-Text
          />
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
        <div style={{display:"flex", gap:"4px", flexWrap:"wrap", minWidth:"0"}}>
          <button
            className="btn btn-info responsive-btn"
            onClick={() => handlePreviewPDF(row)}
            title="PDF Vorschau anzeigen"
          >
            <span className="btn-icon">👁️</span>
            <span className="btn-text">Vorschau</span>
          </button>
          <button
            className="btn btn-warning responsive-btn"
            onClick={() => handleExportPDF(row)}
            title="PDF herunterladen"
          >
            <span className="btn-icon">💾</span>
            <span className="btn-text">PDF</span>
          </button>
          <button 
            className="btn btn-secondary responsive-btn"
            onClick={() => { setCurrent(row); setMode("edit"); }}
          >
            <span className="btn-icon">✏️</span>
            <span className="btn-text">Bearbeiten</span>
          </button>
          <button 
            className="btn btn-danger responsive-btn"
            onClick={() => { if (confirm("Diese Rechnung wirklich löschen?")) handleRemove(row.id); }}
          >
            <span className="btn-icon">🗑️</span>
            <span className="btn-text">Löschen</span>
          </button>
        </div>
      ) 
    },
    {
      key: "statusControl",
      header: "Status ändern",
      render: (row: Invoice) => (
        <StatusControl
          row={{
            id: row.id,
            status: row.status as any,
            version: (row as any).version || 0
          }}
          kind="invoice"
          onUpdated={(updatedEntity) => {
            // Update the invoice in the list with new status and version
            const updatedInvoice = {
              ...row,
              status: updatedEntity.status,
              version: updatedEntity.version,
              updatedAt: updatedEntity.updated_at,
              sentAt: updatedEntity.sent_at,
              paidAt: updatedEntity.paid_at,
              overdueAt: updatedEntity.overdue_at,
              cancelledAt: updatedEntity.cancelled_at
            };
            
            // Update the invoice via the hook (this will trigger a re-render)
            updateInvoice(row.id, updatedInvoice);
            
            showSuccess(`Status erfolgreich geändert zu: ${updatedEntity.status}`);
          }}
          onError={(error) => {
            showError(`Status-Änderung fehlgeschlagen: ${error.message}`);
          }}
          className="status-dropdown-override"
          buttonStyle={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)', 
            padding: '8px 12px',
            border: '1px solid var(--accent)',
            borderRadius: '4px',
            fontSize: '12px',
            minWidth: '120px',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          dropdownStyle={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--accent)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(8px)'
          } as React.CSSProperties}
        />
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

  // handleStatusChange function removed - replaced by StatusControl component

  async function handleRemove(id: number) {
    await deleteInvoice(id);
  }

  const handleExportPDF = async (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    if (!customer) {
      showError('Kunde nicht gefunden');
      return;
    }

    try {
      const logoData = settings?.companyData?.logo || null;
      const result = await PDFService.exportInvoiceToPDF(invoice, customer, settings, false, currentTheme, undefined, logoData); // false = direct download
      if (result.success) {
        showSuccess(`PDF erfolgreich erstellt: ${result.filePath}`);
      } else {
        showError(`PDF Export fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      console.error('PDF Export failed:', error);
      showError('PDF Export fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const handlePreviewPDF = async (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    if (!customer) {
      showError('Kunde nicht gefunden');
      return;
    }

    try {
      const logoData = settings?.companyData?.logo || null;
      const result = await PDFService.exportInvoiceToPDF(invoice, customer, settings, true, currentTheme, undefined, logoData); // true = preview only
      if (result.success) {
        showSuccess('PDF Vorschau geöffnet');
      } else {
        showError(`PDF Vorschau fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      console.error('PDF Preview failed:', error);
      showError('PDF Vorschau fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  if (loading) return <div className="card">Lade Rechnungen...</div>;
  if (error) return <div className="card">Fehler: {error}</div>;

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px"}}>
        <div>
          <h2 style={{margin:"0 0 4px 0"}}>{title}</h2>
          <div style={{opacity:.7}}>Verwalte deine Rechnungen und exportiere sie als PDF.</div>
        </div>
        <button 
          className={`btn ${mode === "create" ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setMode(mode === "create" ? "list" : "create")}
        >
          {mode === "create" ? "Abbrechen" : "Neue Rechnung"}
        </button>
      </div>
      
      {/* Search and Filter Bar */}
      <SearchAndFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Rechnungen durchsuchen..."
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        resultCount={filteredData.length}
        totalCount={invoices.length}
      />
      
      <div className="table-responsive">
        <div className="table-card-view">
          {/* Card Layout für Mobile (wird per CSS aktiviert) */}
          <div className="table-cards">
            {filteredData.map((invoice) => {
              const customer = customers.find(c => c.id === invoice.customerId);
              return (
                <div key={`card-${invoice.id}`} className="table-card">
                  <div className="table-card-header">
                    <span className="table-card-title">
                      {customer ? customer.name : 'Unbekannt'}
                    </span>
                    <span className="table-card-number">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="table-card-content">
                    <div className="table-card-row">
                      <span className="table-card-label">Titel:</span>
                      <span className="table-card-value">{invoice.title}</span>
                    </div>
                    <div className="table-card-row">
                      <span className="table-card-label">Status:</span>
                      <div className="table-card-value">
                        <StatusControl
                          kind="invoice"
                          row={{ ...invoice, version: invoice.id }}
                          onUpdated={() => {
                            // Refresh invoices data
                            window.location.reload();
                          }}
                          onError={(error) => showError(error.message)}
                        />
                      </div>
                    </div>
                    <div className="table-card-row">
                      <span className="table-card-label">Betrag:</span>
                      <span className="table-card-value">€{invoice.total?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="table-card-row">
                      <span className="table-card-label">Fällig am:</span>
                      <span className="table-card-value">{invoice.dueDate || '-'}</span>
                    </div>
                  </div>
                  <div className="table-card-actions">
                    <button
                      className="responsive-btn"
                      onClick={() => handlePreviewPDF(invoice)}
                      title="Vorschau"
                    >
                      <span className="btn-icon">👁</span>
                      <span className="btn-text">Vorschau</span>
                    </button>
                    <button
                      className="responsive-btn"
                      onClick={async () => {
                        const customer = customers.find(c => c.id === invoice.customerId);
                        if (!customer) {
                          showError('Kunde nicht gefunden');
                          return;
                        }
                        try {
                          const logoData = settings?.companyData?.logo || null;
                          const result = await PDFService.exportInvoiceToPDF(invoice, customer, settings, false, currentTheme, undefined, logoData);
                          if (result.success) {
                            showSuccess('PDF erfolgreich generiert');
                          } else {
                            showError(`PDF Export fehlgeschlagen: ${result.error}`);
                          }
                        } catch (error) {
                          console.error('PDF Export failed:', error);
                          showError('PDF Export fehlgeschlagen');
                        }
                      }}
                      title="PDF"
                    >
                      <span className="btn-icon">📄</span>
                      <span className="btn-text">PDF</span>
                    </button>
                    <button
                      className="responsive-btn"
                      onClick={() => {
                        setCurrent(invoice);
                        setMode("edit");
                      }}
                      title="Bearbeiten"
                    >
                      <span className="btn-icon">✏️</span>
                      <span className="btn-text">Bearbeiten</span>
                    </button>
                    <button
                      className="responsive-btn"
                      onClick={async () => {
                        if (confirm(`Rechnung ${invoice.invoiceNumber} wirklich löschen?`)) {
                          await deleteInvoice(invoice.id);
                        }
                      }}
                      title="Löschen"
                      style={{ color: '#dc3545' }}
                    >
                      <span className="btn-icon">🗑️</span>
                      <span className="btn-text">Löschen</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <Table<Invoice>
          columns={columns as any}
          data={filteredData}
          emptyMessage="Keine Rechnungen gefunden."
          getRowKey={(invoice) => `invoice-${invoice.id}-${invoice.status}-${invoice.updatedAt}`}
        />
      </div>

      {mode === "create" && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(0,0,0,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Neue Rechnung</h3>
            <div style={{opacity:.7}}>Erstelle eine neue Rechnung.</div>
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
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(0,0,0,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Rechnung bearbeiten</h3>
            <div style={{opacity:.7}}>Bearbeite die Rechnung "{current.title}".</div>
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
