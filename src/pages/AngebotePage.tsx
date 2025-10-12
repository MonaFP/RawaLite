import React, { useState, useMemo } from 'react';
import { Table } from '../components/Table';
import { OfferForm } from '../components/OfferForm';
import { StatusControl } from '../components/StatusControl';
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

  // Hilfsfunktion zum Laden eines Angebots mit Anhängen
  const loadOfferWithAttachments = async (offerId: number) => {
    console.log('🔄 Loading offer with attachments...', offerId);
    
    // 1. Angebot aus DB laden
    const offerRows = await window.rawalite.db.query('SELECT * FROM offers WHERE id = ?', [offerId]);
    if (!offerRows || offerRows.length === 0) {
      throw new Error('Angebot nicht gefunden');
    }
    const offerFromDb = offerRows[0];
    
    // 2. Line Items laden
    const lineItemRows = await window.rawalite.db.query(
      'SELECT id, title, description, quantity, unit_price, total, parent_item_id, item_type, source_package_id FROM offer_line_items WHERE offer_id = ? ORDER BY id', 
      [offerId]
    );
    
    // 3. Anhänge für jedes Line Item laden mit Feldmappings
    for (const lineItem of lineItemRows) {
      // 3a. Feldmappings für Line Items (snake_case -> camelCase)
      lineItem.unitPrice = lineItem.unit_price;
      lineItem.parentItemId = lineItem.parent_item_id;
      lineItem.itemType = lineItem.item_type;
      lineItem.sourcePackageId = lineItem.source_package_id;
      
      console.log(`🔍 [PDF DEBUG] Line Item ${lineItem.id} field mapping:`, {
        originalUnitPrice: lineItem.unit_price,
        mappedUnitPrice: lineItem.unitPrice,
        quantity: lineItem.quantity,
        total: lineItem.total
      });
      
      const attachmentRows = await window.rawalite.db.query(
        'SELECT id, offer_id, line_item_id, original_filename, file_type, file_size, base64_data FROM offer_attachments WHERE line_item_id = ?',
        [lineItem.id]
      );
      
      // Feldmappings für Anhänge (snake_case -> camelCase)
      lineItem.attachments = (attachmentRows || []).map((attachment: any) => ({
        id: attachment.id,
        offerId: attachment.offer_id,
        lineItemId: attachment.line_item_id,
        originalFilename: attachment.original_filename,
        filename: attachment.original_filename, // Alias für Template-Kompatibilität
        fileType: attachment.file_type,
        fileSize: attachment.file_size,
        base64Data: attachment.base64_data
      }));
      
      console.log(`📎 Line Item ${lineItem.id}: Found ${lineItem.attachments.length} attachments`);
      lineItem.attachments.forEach((att: any, index: number) => {
        console.log(`📎   - Attachment ${index + 1}: ${att.originalFilename} (${att.fileType}, ${att.base64Data ? 'has base64' : 'no base64'})`);
      });
    }
    
    // 4. Komplettes Angebot mit Anhängen zusammenbauen
    return {
      ...offerFromDb,
      lineItems: lineItemRows
    };
  };

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
          draft: '#6b7280',     // Harmonisches Grau - konsistent mit Dashboard
          sent: '#f59e0b',      // Warmes Orange statt knalliges Blau
          accepted: '#22c55e',  // Harmonisches Grün - konsistent mit Dashboard
          rejected: '#ef4444'   // Harmonisches Rot - konsistent mit Dashboard
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
    console.log('�🔥🔥 OFFER STATUS CHANGE CALLED!', { offerId, newStatus, timestamp: new Date().toISOString() });
    console.log('�🔍 Status Change:', { offerId, newStatus, offersCount: offers.length });
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
      
      <div className="table-responsive">
        <div className="table-card-view">
          {/* Card Layout für Mobile (wird per CSS aktiviert) */}
          <div className="table-cards">
            {offers.map((offer) => {
              const customer = customers.find(c => c.id === offer.customerId);
              return (
                <div key={`card-${offer.id}`} className="table-card">
                  <div className="table-card-header">
                    <span className="table-card-title">
                      {customer ? customer.name : 'Unbekannt'}
                    </span>
                    <span className="table-card-number">{offer.offerNumber}</span>
                  </div>
                  <div className="table-card-content">
                    <div className="table-card-row">
                      <span className="table-card-label">Status:</span>
                      <div className="table-card-value">
                        <StatusControl
                          kind="offer"
                          row={{ ...offer, version: offer.id }}
                          onUpdated={() => {
                            // Refresh offers data
                            window.location.reload();
                          }}
                          onError={(error) => showError(error.message)}
                        />
                      </div>
                    </div>
                    <div className="table-card-row">
                      <span className="table-card-label">Betrag:</span>
                      <span className="table-card-value">€{offer.total?.toFixed(2) || '0.00'}</span>
                    </div>
                    {offer.validUntil && (
                      <div className="table-card-row">
                        <span className="table-card-label">Gültig bis:</span>
                        <span className="table-card-value">{offer.validUntil}</span>
                      </div>
                    )}
                  </div>
                  <div className="table-card-actions">
                    <button
                      className="responsive-btn"
                      onClick={() => handlePreviewPDF(offer)}
                      title="Vorschau"
                    >
                      <span className="btn-icon">👁</span>
                      <span className="btn-text">Vorschau</span>
                    </button>
                    <button
                      className="responsive-btn"
                      onClick={async () => {
                        const customer = customers.find(c => c.id === offer.customerId);
                        if (!customer) {
                          showError('Kunde nicht gefunden');
                          return;
                        }
                        try {
                          const offerWithAttachments = await loadOfferWithAttachments(offer.id);
                          const logoData = settings?.companyData?.logo || null;
                          const result = await PDFService.exportOfferToPDF(offerWithAttachments, customer, settings, false, currentTheme, undefined, logoData);
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
                        setCurrent(offer);
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
                        if (confirm(`Angebot ${offer.offerNumber} wirklich löschen?`)) {
                          await deleteOffer(offer.id);
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
        
        <Table<Offer>
          columns={columns as any}
          data={offers}
          getRowKey={(offer) => `offer-${offer.id}-${offer.status}-${offer.updatedAt}`}
          emptyMessage="Noch keine Angebote erstellt."
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
