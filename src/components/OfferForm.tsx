import React, { useState, useEffect } from 'react';
import type { Offer, OfferLineItem, Customer, Package } from '../persistence/adapter';
import { usePersistence } from '../contexts/PersistenceContext';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useNotifications } from '../contexts/NotificationContext';
import { useLoading } from '../contexts/LoadingContext';
import { ValidationError, handleError } from '../lib/errors';

interface OfferFormProps {
  offer?: Offer;
  customers: Customer[];
  packages: Package[];
  onSave: (offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export const OfferForm: React.FC<OfferFormProps> = ({
  offer,
  customers,
  packages,
  onSave,
  onCancel,
  submitLabel = "Erstellen"
}) => {
  const { adapter } = usePersistence();
  const { settings } = useUnifiedSettings();
  const { showError, showSuccess } = useNotifications();
  const { withLoading } = useLoading();
  
  const [customerId, setCustomerId] = useState(offer?.customerId?.toString() || '');
  const [title, setTitle] = useState(offer?.title || '');
  const [notes, setNotes] = useState(offer?.notes || '');
  const [validUntil, setValidUntil] = useState(
    offer?.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : ''
  );
  const [lineItems, setLineItems] = useState<OfferLineItem[]>(offer?.lineItems || []);
  const [vatRate, setVatRate] = useState(offer?.vatRate || 19);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if Kleinunternehmer mode is enabled
  const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;

  // Automatische Berechnung der Summen
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = isKleinunternehmer ? 0 : (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  const addLineItem = () => {
    const newItem: OfferLineItem = {
      id: Date.now(),
      title: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      parentItemId: undefined
    };
    setLineItems([...lineItems, newItem]);
  };

  const addSubItem = (parentId: number) => {
    const newItem: OfferLineItem = {
      id: Date.now(),
      title: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      parentItemId: parentId
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: number, field: keyof OfferLineItem, value: any) => {
    setLineItems(items => 
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const removeLineItem = (id: number) => {
    setLineItems(items => items.filter(item => item.id !== id && item.parentItemId !== id));
  };

  const addFromPackage = async (packageId: number) => {
    if (!adapter) return;
    
    try {
      const pkg = await adapter.getPackage(packageId);
      if (!pkg) return;

      const newItems: OfferLineItem[] = pkg.lineItems.map(item => ({
        id: Date.now() + Math.random(),
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.amount, // PackageLineItem uses 'amount' instead of 'unitPrice'
        total: item.quantity * item.amount,
        parentItemId: item.parentItemId
      }));

      setLineItems([...lineItems, ...newItems]);
    } catch (error) {
      console.error('Error adding package:', error);
    }
  };

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!customerId) {
      errors.customerId = "Kunde ist erforderlich";
    }

    if (!title?.trim()) {
      errors.title = "Angebots-Titel ist erforderlich";
    }

    if (lineItems.length === 0) {
      errors.lineItems = "Mindestens eine Position ist erforderlich";
    }

    // Validate line items
    lineItems.forEach((item, index) => {
      if (!item.title?.trim()) {
        errors[`lineItem_${index}_title`] = `Titel für Position ${index + 1} ist erforderlich`;
      }
      if (item.quantity <= 0) {
        errors[`lineItem_${index}_quantity`] = `Menge für Position ${index + 1} muss größer als 0 sein`;
      }
      if (item.unitPrice < 0) {
        errors[`lineItem_${index}_unitPrice`] = `Preis für Position ${index + 1} darf nicht negativ sein`;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    // Validate required fields
    if (!customerId || !title.trim()) {
      alert('❌ Pflichtfelder fehlen:\\n\\n' + 
            (!customerId ? '• Bitte wählen Sie einen Kunden aus\\n' : '') +
            (!title.trim() ? '• Bitte geben Sie einen Titel ein\\n' : ''));
      return;
    }

    if (!validateForm()) {
      return;
    }

    const offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
      offerNumber: offer?.offerNumber || `AN-${Date.now()}`,
      customerId: parseInt(customerId),
      title: title.trim(),
      notes: notes.trim(),
      validUntil,
      lineItems,
      subtotal,
      vatRate,
      vatAmount,
      total,
      status: offer?.status || 'draft'
    };

    try {
      setIsSubmitting(true);
      await withLoading(
        () => onSave(offerData),
        `${submitLabel}...`
      );
      showSuccess(`Angebot wurde erfolgreich ${submitLabel === 'Erstellen' ? 'erstellt' : 'aktualisiert'}.`);
    } catch (err) {
      const appError = handleError(err);
      if (appError instanceof ValidationError && appError.field) {
        setFieldErrors(prev => ({ ...prev, [appError.field!]: appError.message }));
      } else {
        showError(appError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const parentItems = lineItems.filter(item => !item.parentItemId);

  return (
    <div className="card" style={{maxWidth:"800px", margin:"0 auto"}}>
      <h2 style={{margin:"0 0 16px 0"}}>
        {offer ? 'Angebot bearbeiten' : 'Neues Angebot'}
      </h2>

      <form onSubmit={handleSubmit} style={{display:"flex", flexDirection:"column", gap:"16px"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px"}}>
          <div>
            <label style={{display:"block", marginBottom:"4px", fontSize:"14px", fontWeight:"500"}}>
              Kunde *
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (fieldErrors.customerId) {
                  setFieldErrors(prev => ({ ...prev, customerId: "" }));
                }
              }}
              style={{width:"100%", padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"6px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
              required
              disabled={isSubmitting}
              className={fieldErrors.customerId ? 'error' : ''}
            >
              <option value="">Kunde auswählen</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {fieldErrors.customerId && (
              <div className="field-error">{fieldErrors.customerId}</div>
            )}
          </div>

          <div>
            <label style={{display:"block", marginBottom:"4px", fontSize:"14px", fontWeight:"500"}}>
              Gültig bis
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              style={{width:"100%", padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"6px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
            />
          </div>
        </div>

        <div>
          <label style={{display:"block", marginBottom:"4px", fontSize:"14px", fontWeight:"500"}}>
            Titel *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (fieldErrors.title) {
                setFieldErrors(prev => ({ ...prev, title: "" }));
              }
            }}
            style={{width:"100%", padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"6px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
            required
            disabled={isSubmitting}
            className={fieldErrors.title ? 'error' : ''}
          />
          {fieldErrors.title && (
            <div className="field-error">{fieldErrors.title}</div>
          )}
        </div>

        <div>
          <label style={{display:"block", marginBottom:"4px", fontSize:"14px", fontWeight:"500"}}>
            Anmerkungen
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{width:"100%", padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"6px", background:"rgba(17,24,39,.8)", color:"var(--muted)", resize:"vertical"}}
          />
        </div>

        {/* Positionen */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"16px"}}>
          <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px"}}>
            <h3 style={{margin:"0", fontSize:"16px", fontWeight:"600"}}>Positionen</h3>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addFromPackage(parseInt(e.target.value));
                  e.target.value = '';
                }
              }}
              style={{padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
              disabled={isSubmitting}
            >
              <option value="">Paket hinzufügen</option>
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.internalTitle}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addLineItem}
              disabled={isSubmitting}
              className="btn btn-success"
              style={{fontSize:"14px", padding:"6px 12px"}}
            >
              Position hinzufügen
            </button>
          </div>

          {fieldErrors.lineItems && (
            <div className="field-error" style={{ marginBottom: "12px" }}>
              {fieldErrors.lineItems}
            </div>
          )}

          <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
            {parentItems.map(item => (
              <div key={item.id}>
                {/* Hauptposition */}
                <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:"8px", alignItems:"start", padding:"12px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"6px", background:"rgba(17,24,39,.4)"}}>
                  <div>
                    <input
                      type="text"
                      placeholder="Titel"
                      value={item.title}
                      onChange={(e) => updateLineItem(item.id, 'title', e.target.value)}
                      style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px", marginBottom:"4px"}}
                    />
                    <input
                      type="text"
                      placeholder="Beschreibung"
                      value={item.description || ''}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Menge"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Einzelpreis"
                      value={item.unitPrice.toString()}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
                          const numericValue = parseFloat(value.replace(',', '.')) || 0;
                          updateLineItem(item.id, 'unitPrice', numericValue);
                        }
                      }}
                      style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                    />
                  </div>
                  <div style={{padding:"6px", fontSize:"14px", fontWeight:"500"}}>
                    {item.total.toFixed(2)} €
                  </div>
                  <div style={{display:"flex", gap:"4px"}}>
                    <button
                      type="button"
                      onClick={() => addSubItem(item.id)}
                      style={{backgroundColor:"var(--ok)", color:"white", border:"none", padding:"4px 8px", borderRadius:"4px", cursor:"pointer", fontSize:"12px"}}
                    >
                      Sub
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      style={{backgroundColor:"var(--danger)", color:"white", border:"none", padding:"4px 8px", borderRadius:"4px", cursor:"pointer", fontSize:"12px"}}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Sub-Positionen */}
                {lineItems
                  .filter(subItem => subItem.parentItemId === item.id)
                  .map(subItem => (
                    <div key={subItem.id} style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:"8px", alignItems:"start", padding:"12px", marginLeft:"24px", border:"1px solid rgba(96,165,250,.3)", borderLeft:"4px solid var(--accent)", borderRadius:"6px", background:"rgba(96,165,250,.1)", marginTop:"4px"}}>
                      <div>
                        <input
                          type="text"
                          placeholder="Sub-Titel"
                          value={subItem.title}
                          onChange={(e) => updateLineItem(subItem.id, 'title', e.target.value)}
                          style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px", marginBottom:"4px"}}
                        />
                        <input
                          type="text"
                          placeholder="Sub-Beschreibung"
                          value={subItem.description || ''}
                          onChange={(e) => updateLineItem(subItem.id, 'description', e.target.value)}
                          style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Menge"
                          value={subItem.quantity}
                          onChange={(e) => updateLineItem(subItem.id, 'quantity', parseFloat(e.target.value) || 0)}
                          style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Einzelpreis"
                          value={subItem.unitPrice.toString()}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
                              const numericValue = parseFloat(value.replace(',', '.')) || 0;
                              updateLineItem(subItem.id, 'unitPrice', numericValue);
                            }
                          }}
                          style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                        />
                      </div>
                      <div style={{padding:"6px", fontSize:"14px", fontWeight:"500"}}>
                        {subItem.total.toFixed(2)} €
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => removeLineItem(subItem.id)}
                          style={{backgroundColor:"var(--danger)", color:"white", border:"none", padding:"4px 8px", borderRadius:"4px", cursor:"pointer", fontSize:"12px"}}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Summen */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"16px"}}>
          <div style={{display:"flex", justifyContent:"flex-end"}}>
            <div style={{width:"300px", display:"flex", flexDirection:"column", gap:"8px"}}>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <span>Zwischensumme:</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              {!isKleinunternehmer && (
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                    <span>MwSt.:</span>
                    <input
                      type="number"
                      value={vatRate}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      style={{width:"60px", padding:"4px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span>%</span>
                  </div>
                  <span>{vatAmount.toFixed(2)} €</span>
                </div>
              )}
              <div style={{display:"flex", justifyContent:"space-between", fontWeight:"600", fontSize:"16px", borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"8px"}}>
                <span>Gesamtbetrag:</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"flex", justifyContent:"flex-end", gap:"12px", marginTop:"16px"}}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{padding:"12px 24px", fontSize:"14px", fontWeight:"500", minWidth:"120px"}}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{padding:"12px 24px", fontSize:"14px", fontWeight:"500", minWidth:"120px"}}
          >
            {isSubmitting ? 'Wird gespeichert...' : submitLabel}
          </button>
        </div>

        <style>{`
          .field-error {
            color: rgba(239, 68, 68, 0.9);
            font-size: 0.8rem;
            margin-top: 4px;
          }
          .error {
            border-color: rgba(239, 68, 68, 0.5) !important;
            background: rgba(239, 68, 68, 0.1) !important;
          }
        `}</style>
      </form>
    </div>
  );
};
