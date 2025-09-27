import {useState, useMemo } from 'react';
import { Table, type SortConfig } from '../components/Table';
// SearchInput removed
// FilterComponents removed
import { OfferForm } from '../components/OfferForm';
import { useOffers } from '../hooks/useOffers';
import { useCustomers } from '../hooks/useCustomers';
import { usePackages } from '../hooks/usePackages';
import { useListPreferences } from '../hooks/useListPreferences';
import { useSettings } from '../contexts/SettingsContext';
import { useDesignSettings } from '../hooks/useDesignSettings';
import { useNotifications } from '../contexts/NotificationContext';
import { useLogoSettings } from '../hooks/useLogoSettings';
// ExportService removed
import { PDFService } from '../services/PDFService';
import type { Offer } from '../persistence/adapter';

interface AngebotePageProps {
  title?: string;
}

export default function AngebotePage({ title = "Angebote" }: AngebotePageProps) {
  const { offers, loading, error, createOffer, updateOffer, deleteOffer } = useOffers();
  const { customers } = useCustomers();
  const { packages } = usePackages();
  const { preferences } = useListPreferences('offers');
  const { settings } = useSettings();
  const { currentTheme, currentCustomColors } = useDesignSettings();
  const { showSuccess, showError } = useNotifications();
  const { getLogoForPdf } = useLogoSettings();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [current, setCurrent] = useState<Offer | null>(null);

  // Search and filter state
  const [_searchQuery, _setSearchQuery] = useState(preferences.lastSearch || '');
  const [_selectedStatus, _setSelectedStatus] = useState<string[]>([]);
  const [_sortConfig, _setSortConfig] = useState<SortConfig | null>(
    preferences.sortBy ? { key: preferences.sortBy, direction: preferences.sortDir || 'asc' } : null
  );
  const [_currentPage, _setCurrentPage] = useState(1);

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
          draft: '#6b7280',
          sent: '#3b82f6',
          accepted: '#10b981',
          rejected: '#ef4444'
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
            onChange={(e) => handleStatusChange(row.id, e.target.value as Offer['status'])}
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
            <option value="accepted">Angenommen</option>
            <option value="rejected">Abgelehnt</option>
          </select>
          <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => { if (confirm("Dieses Angebot wirklich löschen?")) handleRemove(row.id); }}>Löschen</button>
        </div>
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

  async function handleStatusChange(offerId: number, newStatus: Offer['status']) {
    try {
      const offer = offers.find(o => o.id === offerId);
      if (!offer) return;
      
      // Prepare status date fields
      const now = new Date().toISOString();
      const statusDates: Partial<Offer> = {};
      
      switch (newStatus) {
        case 'sent':
          statusDates.sentAt = now;
          break;
        case 'accepted':
          statusDates.acceptedAt = now;
          break;
        case 'rejected':
          statusDates.rejectedAt = now;
          break;
      }
      
      await updateOffer(offerId, { ...offer, status: newStatus, ...statusDates });
      
      // Success notification
      const statusLabels = {
        'draft': 'Entwurf',
        'sent': 'Gesendet', 
        'accepted': 'Angenommen',
        'rejected': 'Abgelehnt'
      };
      showSuccess(`Angebot-Status auf "${statusLabels[newStatus]}" geändert`);
    } catch (error) {
      showError('Fehler beim Ändern des Status');
    }
  }

  async function handleRemove(id: number) {
    await deleteOffer(id);
  }

  const handleExportPDF = async (offer: Offer) => {
    const customer = customers.find(c => c.id === offer.customerId);
    if (!customer) {
      alert('Kunde nicht gefunden');
      return;
    }

    try {
      console.log('🎯 Starting PDF export for offer:', offer.offerNumber);
      console.log('🎨 Using theme:', currentTheme, currentCustomColors ? 'with custom colors' : '');
      
      // Logo für PDF laden
      const logoData = await getLogoForPdf();
      console.log('🖼️ [DEBUG] Logo data for PDF:', logoData ? 'Present' : 'None');
      
      // Use new PDFService implementation with theme integration
      const result = await PDFService.exportOfferToPDF(
        offer, 
        customer, 
        settings, 
        false, // isPreview
        currentTheme,
        currentCustomColors,
        logoData // Logo-Daten für PDF
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

  const handlePreviewPDF = async (offer: Offer) => {
    const customer = customers.find(c => c.id === offer.customerId);
    if (!customer) {
      alert('Kunde nicht gefunden');
      return;
    }

    try {
      console.log('🔍 Starting PDF preview for offer:', offer.offerNumber);
      console.log('🎨 Using theme:', currentTheme, currentCustomColors ? 'with custom colors' : '');
      
      // Logo für PDF laden
      const logoData = await getLogoForPdf();
      console.log('🖼️ [DEBUG PREVIEW] Logo data for PDF:', logoData ? 'Present' : 'None');
      
      // Use new PDFService implementation with theme integration
      const result = await PDFService.exportOfferToPDF(
        offer, 
        customer, 
        settings, 
        true, // isPreview
        currentTheme,
        currentCustomColors,
        logoData // Logo-Daten für PDF
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

  if (loading) return <div className="card">Lade Angebote...</div>;
  if (error) return <div className="card">Fehler: {error}</div>;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0" }}>{title}</h2>
          <div style={{ opacity: 0.7 }}>Verwalte deine Angebote und exportiere sie als PDF.</div>
        </div>
        <button 
          className={`btn ${mode === "create" ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setMode(mode === "create" ? "list" : "create")}
        >
          {mode === "create" ? "Abbrechen" : "Neues Angebot"}
        </button>
      </div>
      
      <Table<Offer>
        columns={columns as any}
        data={offers}
        emptyMessage="Noch keine Angebote erstellt."
      />

      {mode === "create" && (
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 4px 0" }}>Neues Angebot</h3>
            <div style={{ opacity: 0.7 }}>Erstelle ein neues Angebot.</div>
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
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 4px 0" }}>Angebot bearbeiten</h3>
            <div style={{ opacity: 0.7 }}>Bearbeite das Angebot "{current.title}".</div>
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



