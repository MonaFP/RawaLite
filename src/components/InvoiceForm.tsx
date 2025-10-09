import React, { useState, useEffect } from 'react';
import type { Invoice, InvoiceLineItem, Customer, Offer } from '../persistence/adapter';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { usePersistence } from '../contexts/PersistenceContext';
import { calculateDocumentTotals, validateDiscount, formatCurrency } from '../lib/discount-calculator';

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

  // Discount system state
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>(invoice?.discountType || 'none');
  const [discountValue, setDiscountValue] = useState(invoice?.discountValue || 0);

  // Check if Kleinunternehmer mode is enabled
  const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;

  // Calculate totals using discount calculator
  const totals = calculateDocumentTotals(
    lineItems.map(item => ({ quantity: item.quantity, unitPrice: item.unitPrice })),
    discountType,
    discountValue,
    vatRate,
    isKleinunternehmer
  );

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
      setNotes(offer.notes || ''); // ✅ FIX: Notes aus Angebot übernehmen
      setVatRate(offer.vatRate);
    } catch (error) {
      console.error('Error adding offer:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId || !title.trim()) {
      alert('❌ Pflichtfelder fehlen:\\n\\n' + 
            (!customerId ? '• Bitte wählen Sie einen Kunden aus\\n' : '') +
            (!title.trim() ? '• Bitte geben Sie einen Titel ein\\n' : ''));
      return;
    }

    const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNumber: invoice?.invoiceNumber || '',
      customerId: parseInt(customerId),
      offerId: offerId ? parseInt(offerId) : undefined,
      title,
      notes,
      dueDate,
      lineItems,
      // Use new discount calculator results
      subtotal: totals.subtotalAfterDiscount,
      vatRate,
      vatAmount: totals.vatAmount,
      total: totals.totalAmount,
      // Add discount fields
      discountType,
      discountValue,
      discountAmount: totals.discountAmount,
      subtotalBeforeDiscount: totals.subtotalBeforeDiscount,
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
              <div key={item.id} style={{
                border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(17,24,39,.4)",
                borderRadius: "6px",
                padding: "12px"
              }}>
                {/* Hauptposition */}
                <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:"8px", alignItems:"start", marginBottom:"8px"}}>
                  <div>
                    <input
                      type="text"
                      placeholder="Titel"
                      value={item.title}
                      onChange={(e) => updateLineItem(item.id, 'title', e.target.value)}
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
                {/* Beschreibungsfeld über volle Breite */}
                <textarea
                  placeholder="Beschreibung (optional) - Markdown unterstützt: **fett**, *kursiv*, Absätze durch Leerzeilen"
                  value={item.description || ''}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"12px", minHeight:"60px", resize:"vertical"}}
                />

                {/* Sub-Positionen */}
                {lineItems
                  .filter(subItem => subItem.parentItemId === item.id)
                  .map(subItem => (
                    <div key={subItem.id} style={{
                      marginLeft:"24px", 
                      border:"1px solid rgba(96,165,250,.3)", 
                      borderLeft:"4px solid var(--accent)", 
                      borderRadius:"6px", 
                      background:"rgba(96,165,250,.1)", 
                      marginTop:"4px",
                      padding:"12px"
                    }}>
                      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:"8px", alignItems:"start", marginBottom:"8px"}}>
                        <div>
                          <input
                            type="text"
                            placeholder="Sub-Titel"
                            value={subItem.title}
                            onChange={(e) => updateLineItem(subItem.id, 'title', e.target.value)}
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
                      {/* Beschreibungsfeld über volle Breite */}
                      <textarea
                        placeholder="Sub-Beschreibung (optional) - Markdown unterstützt: **fett**, *kursiv*, Absätze durch Leerzeilen"
                        value={subItem.description || ''}
                        onChange={(e) => updateLineItem(subItem.id, 'description', e.target.value)}
                        style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"12px", minHeight:"40px", resize:"vertical"}}
                      />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Rabatt-Sektion */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"16px"}}>
          <h3 style={{margin:"0 0 16px 0", color:"var(--accent)", fontSize:"16px"}}>📊 Rabatt</h3>
          
          <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"16px", marginBottom:"16px"}}>
            <div>
              <label style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px"}}>
                <input
                  type="radio"
                  name="discountType"
                  value="none"
                  checked={discountType === 'none'}
                  onChange={(e) => setDiscountType(e.target.value as 'none')}
                />
                <span>Kein Rabatt</span>
              </label>
            </div>
            
            <div>
              <label style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px"}}>
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={discountType === 'percentage'}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage')}
                />
                <span>Prozentual</span>
              </label>
              {discountType === 'percentage' && (
                <div style={{display:"flex", alignItems:"center", gap:"4px"}}>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    style={{width:"80px", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                  />
                  <span>%</span>
                </div>
              )}
            </div>
            
            <div>
              <label style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px"}}>
                <input
                  type="radio"
                  name="discountType"
                  value="fixed"
                  checked={discountType === 'fixed'}
                  onChange={(e) => setDiscountType(e.target.value as 'fixed')}
                />
                <span>Fester Betrag</span>
              </label>
              {discountType === 'fixed' && (
                <div style={{display:"flex", alignItems:"center", gap:"4px"}}>
                  <span>€</span>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    style={{width:"100px", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summen */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"16px"}}>
          <div style={{display:"flex", justifyContent:"flex-end"}}>
            <div style={{width:"300px", display:"flex", flexDirection:"column", gap:"8px"}}>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <span>Zwischensumme:</span>
                <span>{formatCurrency(totals.subtotalBeforeDiscount)}</span>
              </div>
              
              {/* Rabatt-Anzeige */}
              {discountType !== 'none' && totals.discountAmount > 0 && (
                <div style={{display:"flex", justifyContent:"space-between", color:"var(--accent)"}}>
                  <span>Rabatt ({discountType === 'percentage' ? `${discountValue}%` : 'fester Betrag'}):</span>
                  <span>-{formatCurrency(totals.discountAmount)}</span>
                </div>
              )}
              
              {/* Zwischensumme nach Rabatt */}
              {discountType !== 'none' && totals.discountAmount > 0 && (
                <div style={{display:"flex", justifyContent:"space-between", borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"4px"}}>
                  <span>Netto nach Rabatt:</span>
                  <span>{formatCurrency(totals.subtotalAfterDiscount)}</span>
                </div>
              )}
              
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
                  <span>{formatCurrency(totals.vatAmount)}</span>
                </div>
              )}
              
              {/* Kleinunternehmer Hinweis */}
              {isKleinunternehmer && (
                <div style={{fontSize:"12px", color:"var(--muted)", fontStyle:"italic"}}>
                  (MwSt-frei nach §19 UStG)
                </div>
              )}
              
              <div style={{display:"flex", justifyContent:"space-between", fontWeight:"600", fontSize:"16px", borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"8px"}}>
                <span>Gesamtbetrag:</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
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
