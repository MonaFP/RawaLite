import React, { useState, useMemo, useCallback } from 'react';
import { Table } from '../components/Table';
import { OfferForm } from '../components/OfferForm';
import { StatusControl } from '../components/StatusControl';
import { SearchAndFilterBar, useTableSearch, FilterConfig } from '../components/SearchAndFilter';
import { useOffers } from '../hooks/useOffers';
import { useCustomers } from '../hooks/useCustomers';
import { usePackages } from '../hooks/usePackages';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PDFService } from '../services/PDFService';
import { usePersistence } from '../contexts/PersistenceContext';
import type { Offer } from '../persistence/adapter';

interface AngebotePageProps {
  title?: string;
}

export default function AngebotePage({ title = "Angebote" }: AngebotePageProps) {
  const { settings, loading, error } = useUnifiedSettings();
  const { offers, loading: offersLoading, error: offersError, createOffer, updateOffer, deleteOffer } = useOffers();
  const { customers } = useCustomers();
  const { packages } = usePackages();
  const { currentTheme } = useTheme(); // Add current theme access
  const { showSuccess, showError } = useNotifications();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [current, setCurrent] = useState<Offer | null>(null);
  const { adapter } = usePersistence();

  // Search and Filter Configuration for Offers
  const searchFieldMapping = useMemo(() => ({
    offerNumber: 'offerNumber',
    title: 'title',
    customerName: (offer: Offer) => {
      const customer = customers.find(c => c.id === offer.customerId);
      return customer?.name || '';
    },
    total: (offer: Offer) => offer.total.toString(),
    status: 'status'
  }), [customers]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      field: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Entwurf' },
        { value: 'sent', label: 'Versendet' },
        { value: 'accepted', label: 'Angenommen' },
        { value: 'rejected', label: 'Abgelehnt' }
      ]
    },
    {
      field: 'total',
      label: 'Gesamtbetrag',
      type: 'numberRange'
    },
    {
      field: 'validUntil',
      label: 'Gültigkeitsdatum',
      type: 'dateRange'
    }
  ], []);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    clearAll,
    filteredData,
    activeFilterCount
  } = useTableSearch(offers, searchFieldMapping);

  // Hilfsfunktion zum Laden eines Angebots mit Anhängen
  const loadOfferWithAttachments = useCallback(async (offerId: number) => {
    if (!adapter) {
      throw new Error('Datenbankadapter nicht bereit');
    }

    console.log('🔄 Loading offer with attachments via adapter...', offerId);
    const offerWithAttachments = await adapter.getOffer(offerId);

    if (!offerWithAttachments) {
      throw new Error('Angebot nicht gefunden');
    }

    return offerWithAttachments;
  }, [adapter]);

  const columns = useMemo(() => ([
    { key: "offerNumber", header: "Nummer" },
    { 
      key: "customerId", 
      header: "Kunde", 
      render: (row: Offer) => {
        const customer = customers.find(c => c.id === row.customerId);
        return customer?.name || `Kunde #${row.customerId}`;
      }
    },
    { key: "title", header: "Titel" },
    { 
      key: "status", 
      header: "Status", 
      render: (row: Offer) => {
        const statusColors = {
          draft: '#b2c2c0',     // Sanftes Grau (aus Webby Palette)
          sent: '#f5d4a9',      // Sanftes Beige (aus Pastel Oranges)
          accepted: '#9be69f',  // Sanftes Grün (aus Cool Pastel)
          rejected: '#cf9ad6'   // Sanftes Rosa/Lila (aus Webby Palette)
        };
        const statusTexts = {
          draft: 'Entwurf',
          sent: 'Versendet',
          accepted: 'Angenommen',
          rejected: 'Abgelehnt'
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
      render: (row: Offer) => `€${row.total.toFixed(2)}`
    },
    { 
      key: "validUntil", 
      header: "Gültig bis", 
      render: (row: Offer) => row.validUntil ? new Date(row.validUntil).toLocaleDateString('de-DE') : '-'
    },
    { 
      key: "id", 
      header: "Aktionen", 
      render: (row: Offer) => (
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
            onClick={() => handleRemove(row.id)}
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
      render: (row: Offer) => (
        <StatusControl
          row={{
            id: row.id,
            status: row.status as any,
            version: (row as any).version || 0
          }}
          kind="offer"
          onUpdated={(updatedEntity) => {
            // Update the offer in the list with new status and version
            const updatedOffer = {
              ...row,
              status: updatedEntity.status,
              version: updatedEntity.version,
              updatedAt: updatedEntity.updated_at,
              sentAt: updatedEntity.sent_at,
              acceptedAt: updatedEntity.accepted_at,
              rejectedAt: updatedEntity.rejected_at
            };
            
            // Update the offer via the hook (this will trigger a re-render)
            updateOffer(row.id, updatedOffer);
            
            showSuccess(`Status erfolgreich geändert zu: ${updatedEntity.status}`);
          }}
          onError={(error) => {
            showError(`Status-Änderung fehlgeschlagen: ${error.message}`);
          }}
        />
      )
    }
  ]), [customers]);

  async function handleCreate(offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) {
    await createOffer(offerData);
    setMode("list");
  }

  async function handleEdit(offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!current) return;
    await updateOffer(current.id, offerData);
    setMode("list");
    setCurrent(null);
  }

  async function handleRemove(id: number) {
    await deleteOffer(id);
  }

  const handleExportPDF = async (offer: Offer) => {
    const customer = customers.find(c => c.id === offer.customerId);
    if (!customer) {
      showError('Kunde nicht gefunden');
      return;
    }

    try {
      const offerWithAttachments = await loadOfferWithAttachments(offer.id);
      console.log('📋 Loaded offer for PDF export:', offerWithAttachments);
      
      const logoData = settings?.companyData?.logo || null;
      const result = await PDFService.exportOfferToPDF(offerWithAttachments, customer, settings, false, currentTheme, undefined, logoData);
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

  const handlePreviewPDF = async (offer: Offer) => {
    const customer = customers.find(c => c.id === offer.customerId);
    if (!customer) {
      showError('Kunde nicht gefunden');
      return;
    }

    try {
      const offerWithAttachments = await loadOfferWithAttachments(offer.id);
      console.log('📋 Loaded offer for PDF preview:', offerWithAttachments);
      
      const logoData = settings?.companyData?.logo || null;
      const result = await PDFService.exportOfferToPDF(offerWithAttachments, customer, settings, true, currentTheme, undefined, logoData);
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

  if (loading) return <div className="card">Lade Angebote...</div>;
  if (error) return <div className="card">Fehler: {error}</div>;

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px"}}>
        <div>
          <h2 style={{margin:"0 0 4px 0"}}>{title}</h2>
          <div style={{opacity:.7}}>Verwalte deine Angebote und exportiere sie als PDF.</div>
        </div>
        <button 
          className={`btn ${mode === "create" ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setMode(mode === "create" ? "list" : "create")}
        >
          {mode === "create" ? "Abbrechen" : "Neues Angebot"}
        </button>
      </div>
      
      {/* Search and Filter Bar */}
      <SearchAndFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Angebote durchsuchen..."
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        resultCount={filteredData.length}
        totalCount={offers.length}
      />
      
      <div className="table-responsive">      
        <Table<Offer>
          columns={columns as any}
          data={filteredData}
          getRowKey={(offer) => `offer-${offer.id}-${offer.status}-${offer.updatedAt}`}
          emptyMessage="Keine Angebote gefunden."
        />
      </div>

      {mode === "create" && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(0,0,0,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Neues Angebot</h3>
            <div style={{opacity:.7}}>Erstelle ein neues Angebot.</div>
          </div>
          <OfferForm
            customers={customers}
            packages={packages}
            onSave={handleCreate}
            onCancel={() => setMode("list")}
            submitLabel="Erstellen"
          />
        </div>
      )}

      {mode === "edit" && current && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(0,0,0,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Angebot bearbeiten</h3>
            <div style={{opacity:.7}}>Bearbeite das Angebot "{current.title}".</div>
          </div>
          <OfferForm
            offer={current}
            customers={customers}
            packages={packages}
            onSave={handleEdit}
            onCancel={() => { setMode("list"); setCurrent(null); }}
            submitLabel="Aktualisieren"
          />
        </div>
      )}
    </div>
  );
}
