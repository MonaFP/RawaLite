import React, { useState, useEffect } from 'react';
import type { Invoice, InvoiceLineItem, InvoiceAttachment, Customer, Offer } from '../persistence/adapter';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { usePersistence } from '../contexts/PersistenceContext';
import { useNotifications } from '../contexts/NotificationContext';
import { calculateDocumentTotals, validateDiscount, formatCurrency } from '../lib/discount-calculator';
import { formatNumberInputValue, parseNumberInput, getNumberInputStyles } from '../lib/input-helpers';

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
  const { showError, showSuccess } = useNotifications();
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
  
  // 🎯 Stable ID generation system consistent with OfferForm
  const generateStableId = (itemType: 'parent' | 'sub', formType: 'invoice' = 'invoice') => {
    const baseRanges = {
      offer: { parent: -1000, sub: -2000 },
      invoice: { parent: -3000, sub: -4000 },
      package: { parent: -5000, sub: -6000 }
    };
    
    const base = baseRanges[formType][itemType];
    const uniqueId = base - lineItems.length - 1;
    
    console.log(`🎯 Generated stable ID: ${uniqueId} (${formType}/${itemType}, base: ${base}, items: ${lineItems.length})`);
    return uniqueId;
  };

  // Check if Kleinunternehmer mode is enabled
  const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;

  // Calculate totals using discount calculator
  const totals = calculateDocumentTotals(
    lineItems
      .filter(item => item.priceDisplayMode !== 'included' && item.priceDisplayMode !== 'hidden')
      .map(item => ({ quantity: item.quantity, unitPrice: item.unitPrice })),
    discountType,
    discountValue,
    vatRate,
    isKleinunternehmer
  );

  const addLineItem = () => {
    // Use generateStableId for collision-free IDs consistent with OfferForm
    const newId = generateStableId('parent', 'invoice');
    const newItem: InvoiceLineItem = {
      id: newId,
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
    // Use generateStableId for collision-free sub-item IDs consistent with OfferForm
    const newId = generateStableId('sub', 'invoice');
    const newItem: InvoiceLineItem = {
      id: newId,
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

  const handleImageUpload = async (lineItemId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showError(`❌ ${file.name}: Nur Bilddateien sind erlaubt (PNG, JPG, GIF, etc.)`);
          return null;
        }

        // Convert to base64
        return new Promise<{ base64Data: string; file: File } | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ 
            base64Data: reader.result as string,
            file: file
          });
          reader.onerror = () => {
            showError(`❌ Fehler beim Lesen von ${file.name}`);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(uploadPromises);
      const validImages = results.filter(result => result !== null) as { base64Data: string; file: File }[];

      if (validImages.length === 0) return;

      // Store directly in line items state (will be saved to DB when invoice is saved)
      setLineItems(items => items.map(item => {
        if (item.id === lineItemId) {
          const existingAttachments = item.attachments || [];
          const newAttachments: InvoiceAttachment[] = validImages.map((imageData, index) => ({
            id: -(Date.now() + index), // Negative ID for new attachments (will get positive ID from DB)
            invoiceId: invoice?.id || 0,
            lineItemId: lineItemId,
            filename: `${imageData.file.name.replace(/\.[^/.]+$/, "")}_${Date.now()}_${index}${imageData.file.name.match(/\.[^/.]+$/)?.[0] || '.png'}`,
            originalFilename: imageData.file.name,
            fileType: imageData.file.type,
            fileSize: imageData.file.size,
            base64Data: imageData.base64Data, // Store base64 directly
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));

          return {
            ...item,
            attachments: [...existingAttachments, ...newAttachments]
          };
        }
        return item;
      }));

      showSuccess(`✅ ${validImages.length} Bild(er) hinzugefügt (werden beim Speichern in DB gesichert)`);

    } catch (error) {
      console.error('Image upload error:', error);
      showError('❌ Fehler beim Hochladen der Bilder');
    }

    // Reset file input
    event.target.value = '';
  };

  const removeAttachment = (lineItemId: number, attachmentId: number) => {
    setLineItems(items => items.map(item => {
      if (item.id === lineItemId) {
        return {
          ...item,
          attachments: (item.attachments || []).filter(att => att.id !== attachmentId)
        };
      }
      return item;
    }));
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
        parentItemId: item.parentItemId,
        // Transfer attachments from offer to invoice
        attachments: item.attachments ? item.attachments.map(attachment => ({
          id: Date.now() + Math.random(), // Generate new IDs for invoice attachments
          invoiceId: 0, // Will be set when invoice is created
          lineItemId: 0, // Will be mapped during save
          filename: attachment.filename,
          originalFilename: attachment.originalFilename,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          filePath: attachment.filePath,
          base64Data: attachment.base64Data,
          description: attachment.description,
          createdAt: attachment.createdAt,
          updatedAt: attachment.updatedAt
        })) : []
      }));

      setLineItems(newItems);
      setCustomerId(offer.customerId.toString());
      setTitle(offer.title);
      setNotes(offer.notes || ''); // ✅ FIX: Notes aus Angebot übernehmen
      setVatRate(offer.vatRate);
      
      // Show user feedback about attachments transfer
      const totalAttachments = offer.lineItems.reduce((sum, item) => sum + (item.attachments?.length || 0), 0);
      if (totalAttachments > 0) {
        showSuccess(`✅ Angebot übernommen mit ${totalAttachments} Dateianhang/en`);
      }
    } catch (error) {
      console.error('Error adding offer:', error);
      showError('❌ Fehler beim Übernehmen des Angebots');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId || !title.trim()) {
      alert('❌ Pflichtfelder fehlen:\\n\\n' + 
            (!customerId ? '• Bitte wählen Sie einen Kunden aus\\n' : '') +
            (!title.trim() ? '• Bitte geben Sie einen Titel ein\\n' : ''));
      return;
    }

    // 🎯 CRITICAL FIX: ID Mapping System for FOREIGN KEY constraint compliance
    // This prevents "FOREIGN KEY constraint failed" errors by mapping negative IDs
    const idMapping: Record<number, number> = {};
    const processedLineItems = lineItems.map(item => {
      if (item.id < 0) {
        // Generate new positive ID for database insertion
        const newId = Date.now() + Math.random();
        idMapping[item.id] = newId;
        return { ...item, id: newId };
      }
      return item;
    });

    // Fix parent-child references using ID mapping
    processedLineItems.forEach(item => {
      if (item.parentItemId && item.parentItemId < 0) {
        item.parentItemId = idMapping[item.parentItemId] || item.parentItemId;
      }
    });

    const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNumber: invoice?.invoiceNumber || '',
      customerId: parseInt(customerId),
      offerId: offerId ? parseInt(offerId) : undefined,
      title,
      notes,
      dueDate,
      lineItems: processedLineItems, // Use processed items with mapped IDs
      // FIXED: subtotal should be sum of line items BEFORE discount, not after
      subtotal: totals.subtotalBeforeDiscount,
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

    try {
      await onSave(invoiceData);
      
      // 🎯 SUCCESS FEEDBACK: Show positive confirmation like other forms
      showSuccess(`Rechnung wurde erfolgreich ${invoice ? 'aktualisiert' : 'erstellt'}.`);
      
    } catch (error) {
      // 🎯 ERROR FEEDBACK: Show error message
      showError(`Fehler beim ${invoice ? 'Aktualisieren' : 'Erstellen'} der Rechnung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
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
            {/* React.Fragment-basierte Gruppierung: Parent-Items mit ihren Sub-Items gruppiert */}
            {parentItems.map(item => (
              <React.Fragment key={`parent-${item.id}`}>
                <div style={{
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
                      value={formatNumberInputValue(item.unitPrice)}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', parseNumberInput(e.target.value))}
                      style={{...getNumberInputStyles(), width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                      min="0"
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

                {/* Anhänge-Sektion für Parent Items */}
                <div style={{marginTop: "8px", padding: "8px", backgroundColor: "rgba(0,0,0,.1)", borderRadius: "4px"}}>
                  <label style={{fontSize: "12px", fontWeight: "500", marginBottom: "4px", display: "block"}}>
                    📎 Anhänge (Screenshots, Bilder)
                  </label>
                  <div style={{display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap"}}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(item.id, e)}
                      style={{fontSize: "12px"}}
                    />
                    <span style={{fontSize: "11px", color: "var(--muted)"}}>
                      PNG, JPG (DB-Speicherung)
                    </span>
                  </div>
                  
                  {/* Vorschau der hochgeladenen Bilder */}
                  {item.attachments && item.attachments.length > 0 && (
                    <div style={{marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap"}}>
                      {item.attachments.map(attachment => (
                        <div key={attachment.id} style={{position: "relative"}}>
                          <img 
                            src={attachment.base64Data || attachment.filePath} 
                            alt={attachment.originalFilename}
                            style={{width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "1px solid rgba(255,255,255,.2)"}}
                            title={`${attachment.originalFilename} (${Math.round(attachment.fileSize/1024)}KB)`}
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(item.id, attachment.id)}
                            style={{position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", cursor: "pointer"}}
                            title="Bild entfernen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 120px auto", gap:"8px", alignItems:"start", marginBottom:"8px"}}>
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
                            style={{
                              width:"100%", 
                              padding:"6px", 
                              border:"1px solid rgba(255,255,255,.1)", 
                              borderRadius:"4px", 
                              background:"rgba(17,24,39,.8)", 
                              color:"var(--muted)", 
                              fontSize:"14px",
                              opacity: subItem.priceDisplayMode === 'included' || subItem.priceDisplayMode === 'hidden' ? 0.5 : 1
                            }}
                            min="0"
                            step="0.01"
                            disabled={subItem.priceDisplayMode === 'included' || subItem.priceDisplayMode === 'hidden'}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Einzelpreis"
                            value={formatNumberInputValue(subItem.unitPrice)}
                            onChange={(e) => updateLineItem(subItem.id, 'unitPrice', parseNumberInput(e.target.value))}
                            style={{
                              ...getNumberInputStyles(), 
                              width:"100%", 
                              padding:"6px", 
                              border:"1px solid rgba(255,255,255,.1)", 
                              borderRadius:"4px", 
                              background:"rgba(17,24,39,.8)", 
                              color:"var(--muted)", 
                              fontSize:"14px",
                              opacity: subItem.priceDisplayMode === 'included' || subItem.priceDisplayMode === 'hidden' ? 0.5 : 1
                            }}
                            min="0"
                            disabled={subItem.priceDisplayMode === 'included' || subItem.priceDisplayMode === 'hidden'}
                          />
                        </div>
                        <div style={{padding:"6px", fontSize:"14px", fontWeight:"500"}}>
                          {subItem.priceDisplayMode === 'included' ? (
                            <span style={{color:"var(--accent)", fontStyle:"italic", fontSize:"13px"}}>inkl.</span>
                          ) : subItem.priceDisplayMode === 'hidden' ? (
                            <span style={{color:"var(--muted)", fontSize:"14px"}}>—</span>
                          ) : subItem.priceDisplayMode === 'optional' ? (
                            <span style={{color:"var(--muted)", fontStyle:"italic", fontSize:"11px"}}>optional</span>
                          ) : (
                            <span>€{subItem.total.toFixed(2)}</span>
                          )}
                        </div>
                        <select
                          value={subItem.priceDisplayMode || 'default'}
                          onChange={(e) => {
                            const mode = e.target.value as 'default' | 'included' | 'hidden' | 'optional';
                            updateLineItem(subItem.id, 'priceDisplayMode', mode);
                            
                            // Bei 'included' oder 'hidden': Preise auf 0 setzen
                            if (mode === 'included' || mode === 'hidden') {
                              updateLineItem(subItem.id, 'unitPrice', 0);
                              updateLineItem(subItem.id, 'quantity', 1);
                            }
                          }}
                          style={{
                            padding:"6px", 
                            border:"1px solid rgba(255,255,255,.1)", 
                            borderRadius:"4px", 
                            background:"rgba(17,24,39,.8)", 
                            color:"var(--muted)",
                            fontSize:"12px"
                          }}
                        >
                          <option value="default">Preis</option>
                          <option value="included">inkl.</option>
                          <option value="hidden">versteckt</option>
                          <option value="optional">optional</option>
                        </select>
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

                      {/* Anhänge-Sektion für Sub Items */}
                      <div style={{marginTop: "8px", padding: "8px", backgroundColor: "rgba(0,0,0,.1)", borderRadius: "4px"}}>
                        <label style={{fontSize: "12px", fontWeight: "500", marginBottom: "4px", display: "block"}}>
                          📎 Anhänge (Screenshots, Bilder)
                        </label>
                        <div style={{display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap"}}>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(subItem.id, e)}
                            style={{fontSize: "12px"}}
                          />
                          <span style={{fontSize: "11px", color: "var(--muted)"}}>
                            PNG, JPG (DB-Speicherung)
                          </span>
                        </div>
                        
                        {/* Vorschau der hochgeladenen Bilder */}
                        {subItem.attachments && subItem.attachments.length > 0 && (
                          <div style={{marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap"}}>
                            {subItem.attachments.map(attachment => (
                              <div key={attachment.id} style={{position: "relative"}}>
                                <img 
                                  src={attachment.base64Data || attachment.filePath} 
                                  alt={attachment.originalFilename}
                                  style={{width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "1px solid rgba(255,255,255,.2)"}}
                                  title={`${attachment.originalFilename} (${Math.round(attachment.fileSize/1024)}KB)`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(subItem.id, attachment.id)}
                                  style={{position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", cursor: "pointer"}}
                                  title="Bild entfernen"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </React.Fragment>
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
                    placeholder="0"
                    value={formatNumberInputValue(discountValue)}
                    onChange={(e) => setDiscountValue(parseNumberInput(e.target.value))}
                    style={{...getNumberInputStyles(), width:"80px", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                    min="0"
                    max="100"
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
                    placeholder="0,00"
                    value={formatNumberInputValue(discountValue)}
                    onChange={(e) => setDiscountValue(parseNumberInput(e.target.value))}
                    style={{...getNumberInputStyles(), width:"100px", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                    min="0"
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
                      placeholder="19"
                      value={formatNumberInputValue(vatRate)}
                      onChange={(e) => setVatRate(parseNumberInput(e.target.value, 19))}
                      style={{...getNumberInputStyles(), width:"60px", padding:"4px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                      min="0"
                      max="100"
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
