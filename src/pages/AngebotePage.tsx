import React, { useState, useMemo } from 'react';
import { Table } from '../components/Table';
import { OfferForm } from '../components/OfferForm';
import { useOffers } from '../hooks/useOffers';
import { useCustomers } from '../hooks/useCustomers';
import { usePackages } from '../hooks/usePackages';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PDFService } from '../services/PDFService';
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
          <span 
            className="offer-status-badge"
            style={{
              backgroundColor: color + "20",
              color: color
            }}
          >
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
        <div className="offer-actions-container">
          <button
            className="btn btn-info"
            onClick={() => handlePreviewPDF(row)}
            title="PDF Vorschau anzeigen"
          >
            👁️ Vorschau
          </button>
          <button
            className="btn btn-warning"
            onClick={() => handleExportPDF(row)}
            title="PDF herunterladen"
          >
            💾 PDF
          </button>
          <button className="btn btn-secondary" onClick={() => { setCurrent(row); setMode("edit"); }}>Bearbeiten</button>
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value as Offer['status'])}
            className="offer-status-select"
          >
            <option value="draft">Entwurf</option>
            <option value="sent">Gesendet</option>
            <option value="accepted">Angenommen</option>
            <option value="rejected">Abgelehnt</option>
          </select>
          <button className="btn btn-danger" onClick={() => { if (confirm("Dieses Angebot wirklich löschen?")) handleRemove(row.id); }}>Löschen</button>
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
    console.log('🔍 Status Change:', { offerId, newStatus, offersCount: offers.length });
    try {
      const offer = offers.find(o => o.id === offerId);
      console.log('🔍 Found offer:', !!offer, offer ? { id: offer.id, currentStatus: offer.status } : 'not found');
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
      
      console.log('🔍 Calling updateOffer with:', { offerId, statusData: { status: newStatus, ...statusDates } });
      await updateOffer(offerId, { ...offer, status: newStatus, ...statusDates });
      console.log('🔍 updateOffer completed successfully');
      
      // Success notification
      const statusLabels = {
        'draft': 'Entwurf',
        'sent': 'Gesendet', 
        'accepted': 'Angenommen',
        'rejected': 'Abgelehnt'
      };
      showSuccess(`Angebot-Status auf "${statusLabels[newStatus]}" geändert`);
      console.log('🔍 Success notification sent');
    } catch (error) {
      console.error('🚨 Error in handleStatusChange:', error);
      showError('Fehler beim Ändern des Status');
    }
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
      const logoData = settings?.companyData?.logo || null;
      const result = await PDFService.exportOfferToPDF(offer, customer, settings, false, currentTheme, undefined, logoData); // false = direct download
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
      const logoData = settings?.companyData?.logo || null;
      const result = await PDFService.exportOfferToPDF(offer, customer, settings, true, currentTheme, undefined, logoData); // true = preview only
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
      <div className="offer-page-header">
        <div>
          <h2 className="offer-page-title">{title}</h2>
          <div className="offer-page-subtitle">Verwalte deine Angebote und exportiere sie als PDF.</div>
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
        getRowKey={(offer) => `offer-${offer.id}-${offer.status}-${offer.updatedAt}`}
        emptyMessage="Noch keine Angebote erstellt."
      />

      {mode === "create" && (
        <div className="offer-form-section">
          <div className="offer-form-header">
            <h3 className="offer-form-title">Neues Angebot</h3>
            <div className="offer-form-subtitle">Erstelle ein neues Angebot.</div>
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
        <div className="offer-form-section">
          <div className="offer-form-header">
            <h3 className="offer-form-title">Angebot bearbeiten</h3>
            <div className="offer-form-subtitle">Bearbeite das Angebot "{current.title}".</div>
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
