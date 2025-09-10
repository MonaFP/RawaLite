import React, { useState, useEffect } from 'react';
import type { Invoice, InvoiceLineItem, Customer, Offer } from '../persistence/adapter';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { usePersistence } from '../contexts/PersistenceContext';

interface InvoiceFormProps {
  invoice?: Invoice;
  customers: Customer[];
  offers: Offer[];
  onSave: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  customers,
  offers,
  onSave,
  onCancel
}) => {
  const { adapter } = usePersistence();
  const { settings } = useUnifiedSettings();
  const [customerId, setCustomerId] = useState(invoice?.customerId?.toString() || '');
  const [offerId, setOfferId] = useState(invoice?.offerId?.toString() || '');
  const [title, setTitle] = useState(invoice?.title || '');
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''
  );
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(invoice?.lineItems || []);
  const [vatRate, setVatRate] = useState(invoice?.vatRate || 19);

  // Check if Kleinunternehmer mode is enabled
  const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;

  // Automatische Berechnung der Summen
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = isKleinunternehmer ? 0 : subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
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
    const newItem: InvoiceLineItem = {
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

  const updateLineItem = (id: number, field: keyof InvoiceLineItem, value: any) => {
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

  const addFromOffer = async (offerId: number) => {
    if (!adapter) return;
    
    try {
      const offer = await adapter.getOffer(offerId);
      if (!offer) return;

      const newItems: InvoiceLineItem[] = offer.lineItems.map(item => ({
        id: Date.now() + Math.random(),
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        parentItemId: item.parentItemId
      }));

      setLineItems(newItems);
      setCustomerId(offer.customerId.toString());
      setTitle(offer.title);
      setVatRate(offer.vatRate);
    } catch (error) {
      console.error('Error adding offer:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId || !title) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNumber: invoice?.invoiceNumber || `RE-${Date.now()}`,
      customerId: parseInt(customerId),
      offerId: offerId ? parseInt(offerId) : undefined,
      title,
      notes,
      dueDate,
      lineItems,
      subtotal,
      vatRate,
      vatAmount,
      total,
      status: invoice?.status || 'draft'
    };

    onSave(invoiceData);
  };

  const parentItems = lineItems.filter(item => !item.parentItemId);

  return (
    <div className="card" style={{maxWidth:"800px", margin:"0 auto"}}>
      <h2 style={{margin:"0 0 16px 0"}}>
        {invoice ? 'Rechnung bearbeiten' : 'Neue Rechnung'}
      </h2>

      <form onSubmit={handleSubmit} style={{display:"flex", flexDirection:"column", gap:"16px"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px"}}>
          <div>
            <label style={{display:"block", marginBottom:"4px", fontSize:"14px", fontWeight:"500"}}>
              Kunde *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{width:"100%", padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"6px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
              required
            >
              <option value="">Kunde auswählen</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{display:"block", marginBottom:"4px", fontSize:"14px", fontWeight:"500"}}>
              Fällig am
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
            onChange={(e) => setTitle(e.target.value)}
            style={{width:"100%", padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"6px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
            required
          />
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

        {/* Angebot hinzufügen */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"16px"}}>
          <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px"}}>
            <h3 style={{margin:"0", fontSize:"16px", fontWeight:"600"}}>Positionen</h3>
            <select
              value={offerId}
              onChange={(e) => {
                setOfferId(e.target.value);
                if (e.target.value) {
                  addFromOffer(parseInt(e.target.value));
                }
              }}
              style={{padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
            >
              <option value="">Aus Angebot übernehmen</option>
              {offers
                .filter(offer => !customerId || offer.customerId === parseInt(customerId))
                .map(offer => (
                  <option key={offer.id} value={offer.id}>
                    {offer.offerNumber} - {offer.title}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={addLineItem}
              style={{backgroundColor:"var(--accent)", color:"white", border:"none", padding:"6px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"14px"}}
            >
              Position hinzufügen
            </button>
          </div>

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
                      type="number"
                      placeholder="Einzelpreis"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div style={{padding:"6px", fontSize:"14px", fontWeight:"500"}}>
                    €{item.total.toFixed(2)}
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
                          type="number"
                          placeholder="Einzelpreis"
                          value={subItem.unitPrice}
                          onChange={(e) => updateLineItem(subItem.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div style={{padding:"6px", fontSize:"14px", fontWeight:"500"}}>
                        €{subItem.total.toFixed(2)}
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
                <span>€{subtotal.toFixed(2)}</span>
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
                  <span>€{vatAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{display:"flex", justifyContent:"space-between", fontWeight:"600", fontSize:"16px", borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"8px"}}>
                <span>Gesamtbetrag:</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"flex", justifyContent:"flex-end", gap:"12px", marginTop:"16px"}}>
          <button
            type="button"
            onClick={onCancel}
            style={{padding:"8px 16px", border:"1px solid rgba(255,255,255,.2)", background:"transparent", color:"var(--muted)", borderRadius:"6px", cursor:"pointer"}}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            style={{backgroundColor:"var(--accent)", color:"white", border:"none", padding:"8px 16px", borderRadius:"6px", cursor:"pointer", fontWeight:"500"}}
          >
            {invoice ? 'Aktualisieren' : 'Erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
};
