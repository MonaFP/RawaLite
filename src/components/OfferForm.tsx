import React, { useState, useEffect } from 'react';
import type { Offer, OfferLineItem, Customer, Package } from '../persistence/adapter';
import { usePersistence } from '../contexts/PersistenceContext';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useNotifications } from '../contexts/NotificationContext';
import { useLoading } from '../contexts/LoadingContext';
import { ValidationError, handleError } from '../lib/errors';
import { calculateDocumentTotals, validateDiscount, formatCurrency } from '../lib/discount-calculator';

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

  // Discount system state
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>(offer?.discountType || 'none');
  const [discountValue, setDiscountValue] = useState(offer?.discountValue || 0);

  // Check if Kleinunternehmer mode is enabled
  const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;

  // 🎯 Phase 1: ID-Range Segregation for Collision Prevention
  // Unterschiedliche ID-Bereiche für verschiedene Formulare und Item-Typen
  const generateStableId = (itemType: 'parent' | 'sub', formType: 'offer' | 'invoice' | 'package' = 'offer') => {
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

  // 🎯 Spezielle ID-Generierung für Package Imports
  const generatePackageImportIds = (itemCount: number) => {
    const baseId = -(lineItems.length + 3000); // Package imports start at -3000
    const ids: number[] = [];
    for (let i = 0; i < itemCount; i++) {
      ids.push(baseId - i);
    }
    console.log(`📦 Generated ${itemCount} package import IDs starting from ${baseId}`);
    return ids;
  };

  // Calculate totals using discount calculator
  const totals = calculateDocumentTotals(
    lineItems.map(item => ({ quantity: item.quantity, unitPrice: item.unitPrice })),
    discountType,
    discountValue,
    vatRate,
    isKleinunternehmer
  );

  const addLineItem = () => {
    // Use generateStableId for collision-free IDs
    const newId = generateStableId('parent', 'offer');
    console.log('🆕 Creating new line item with stable ID:', newId);
    const newItem: OfferLineItem = {
      id: newId,
      title: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      parentItemId: undefined,
      itemType: 'standalone',
      sourcePackageId: undefined
    };
    setLineItems([...lineItems, newItem]);
  };

  const addSubItem = (parentId?: number) => {
    console.log('🟢 GREEN SUB BUTTON - Individual Sub-Item! ParentId:', parentId);
    
    // Create new individual sub-item with stable negative ID using generateStableId
    const newId = generateStableId('sub', 'offer');
    console.log('🆕 Creating new sub-item with stable ID:', newId, 'for parent:', parentId);
    const newItem: OfferLineItem = {
      id: newId,
      title: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      parentItemId: parentId, // Will be undefined if no parent specified
      itemType: 'individual_sub', // Individual sub-item type
      sourcePackageId: undefined
    };

    console.log('📝 Created new individual sub-item:', newItem);

    if (parentId) {
      // Insert sub-item directly after parent and its existing sub-items
      const parentIndex = lineItems.findIndex(item => item.id === parentId);
      if (parentIndex !== -1) {
        // Find insertion point after all existing sub-items of this parent
        let insertIndex = parentIndex + 1;
        while (insertIndex < lineItems.length && lineItems[insertIndex].parentItemId === parentId) {
          insertIndex++;
        }
        
        console.log('🎯 Inserting at position:', insertIndex, 'with parentItemId:', parentId);
        
        // Insert at correct position to maintain parent-child grouping
        const newItems = [...lineItems];
        newItems.splice(insertIndex, 0, newItem);
        setLineItems(newItems);
        return;
      }
    }

    // Add as orphaned sub-item at the end (will show parent selector)
    console.log('📋 Adding as orphaned sub-item for parent selection');
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: number, field: keyof OfferLineItem, value: any) => {
    setLineItems(items => {
      // First update the item
      const updatedItems = items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      });

      // If parentItemId was changed, reposition the item
      if (field === 'parentItemId' && value) {
        const updatedItem = updatedItems.find(item => item.id === id);
        if (updatedItem) {
          console.log('🔄 Repositioning item', id, 'to parent', value);
          
          // Remove item from current position
          const itemsWithoutUpdated = updatedItems.filter(item => item.id !== id);
          
          // Find parent position
          const parentIndex = itemsWithoutUpdated.findIndex(item => item.id === value);
          if (parentIndex !== -1) {
            // Find insertion point after all existing sub-items of this parent
            let insertIndex = parentIndex + 1;
            while (insertIndex < itemsWithoutUpdated.length && 
                   itemsWithoutUpdated[insertIndex].parentItemId === value) {
              insertIndex++;
            }
            
            console.log('📍 Inserting at position', insertIndex, 'after parent at', parentIndex);
            
            // Insert at correct position
            const finalItems = [...itemsWithoutUpdated];
            finalItems.splice(insertIndex, 0, updatedItem);
            return finalItems;
          }
        }
      }

      return updatedItems;
    });
  };

  const removeLineItem = (id: number) => {
    setLineItems(items => items.filter(item => item.id !== id && item.parentItemId !== id));
  };

  const addFromPackage = async (packageId: number) => {
    if (!adapter) return;
    
    try {
      const pkg = await adapter.getPackage(packageId);
      if (!pkg) return;

      // Create a mapping from original package item IDs to new stable negative IDs
      const idMapping: Record<number, number> = {};
      const newIds = generatePackageImportIds(pkg.lineItems.length);
      
      // First pass: create all items and build ID mapping
      const newItems: OfferLineItem[] = pkg.lineItems.map((item, index) => {
        const newId = newIds[index];
        idMapping[item.id] = newId;
        console.log('📦 Package import - mapping original ID', item.id, 'to new ID', newId);
        
        return {
          id: newId,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.amount, // PackageLineItem uses 'amount' instead of 'unitPrice'
          total: item.quantity * item.amount,
          parentItemId: undefined, // Will be set in second pass
          itemType: 'package_import', // Package import type
          sourcePackageId: pkg.id // Reference to source package
        };
      });

      // Second pass: set correct parentItemId references using the mapping
      newItems.forEach((item, index) => {
        const originalItem = pkg.lineItems[index];
        if (originalItem.parentItemId && idMapping[originalItem.parentItemId]) {
          item.parentItemId = idMapping[originalItem.parentItemId];
        }
      });

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
          <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px", flexWrap:"wrap"}}>
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
            <button
              type="button"
              onClick={() => addSubItem()}
              disabled={isSubmitting}
              className="btn btn-success"
              style={{fontSize:"14px", padding:"6px 12px", backgroundColor:"#16a34a"}}
            >
              Sub-Position hinzufügen
            </button>
          </div>

          {fieldErrors.lineItems && (
            <div className="field-error" style={{ marginBottom: "12px" }}>
              {fieldErrors.lineItems}
            </div>
          )}

          <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
            {/* React.Fragment-basierte Gruppierung: Parent-Items mit ihren Sub-Items gruppiert */}
            {lineItems
              .filter(item => !item.parentItemId) // Nur Parent-Items
              .map(parentItem => {
                const subItems = lineItems.filter(item => item.parentItemId === parentItem.id);
                
                return (
                <React.Fragment key={`parent-${parentItem.id}`}>
                  {/* Parent-Item */}
                  <div style={{
                    border: "1px solid rgba(255,255,255,.1)",
                    background: "rgba(17,24,39,.4)",
                    borderRadius: "6px",
                    padding: "12px"
                  }}>
                    <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:"8px", alignItems:"start", marginBottom:"8px"}}>
                      <div>
                        <input
                          type="text"
                          value={parentItem.title}
                          onChange={(e) => updateLineItem(parentItem.id, 'title', e.target.value)}
                          placeholder="Titel"
                          style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                          disabled={isSubmitting}
                        />
                      </div>
                      <input
                        type="number"
                        value={parentItem.quantity}
                        onChange={(e) => updateLineItem(parentItem.id, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        style={{padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                        disabled={isSubmitting}
                      />
                      <input
                        type="number"
                        value={parentItem.unitPrice}
                        onChange={(e) => updateLineItem(parentItem.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        style={{padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                        disabled={isSubmitting}
                      />
                      <div style={{padding:"8px", textAlign:"right", fontWeight:"500"}}>
                        €{parentItem.total.toFixed(2)}
                      </div>
                      <div style={{display:"flex", gap:"4px"}}>
                        <button
                          type="button"
                          onClick={() => addSubItem(parentItem.id)}
                          disabled={isSubmitting}
                          className="btn btn-success"
                          style={{fontSize:"12px", padding:"4px 8px", backgroundColor:"#16a34a"}}
                          title="Sub-Position hinzufügen"
                        >
                          Sub
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLineItem(parentItem.id)}
                          disabled={isSubmitting}
                          className="btn btn-danger"
                          style={{fontSize:"12px", padding:"4px 8px"}}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {/* Beschreibungsfeld über volle Breite */}
                    <textarea
                      value={parentItem.description || ''}
                      onChange={(e) => updateLineItem(parentItem.id, 'description', e.target.value)}
                      placeholder="Beschreibung (optional) - Markdown unterstützt: **fett**, *kursiv*, Absätze durch Leerzeilen"
                      style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"12px", minHeight:"60px", resize:"vertical"}}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {/* Sub-Items für dieses Parent gruppiert */}
                  {lineItems
                    .filter(item => item.parentItemId === parentItem.id)
                    .map(subItem => (
                      <div key={subItem.id} style={{
                        marginLeft: "24px",
                        border: "1px solid rgba(96,165,250,.3)",
                        borderLeft: "4px solid var(--accent)",
                        background: "rgba(96,165,250,.1)",
                        borderRadius: "6px",
                        padding: "12px"
                      }}>
                        <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:"8px", alignItems:"start", marginBottom:"8px"}}>
                          <div>
                            <input
                              type="text"
                              value={subItem.title}
                              onChange={(e) => updateLineItem(subItem.id, 'title', e.target.value)}
                              placeholder="Sub-Position Titel"
                              style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px"}}
                              disabled={isSubmitting}
                            />
                          </div>
                          <input
                            type="number"
                            value={subItem.quantity}
                            onChange={(e) => updateLineItem(subItem.id, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            style={{padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                            disabled={isSubmitting}
                          />
                          <input
                            type="number"
                            value={subItem.unitPrice}
                            onChange={(e) => updateLineItem(subItem.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            style={{padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                            disabled={isSubmitting}
                          />
                          <div style={{padding:"8px", textAlign:"right", fontWeight:"500"}}>
                            €{subItem.total.toFixed(2)}
                          </div>
                          <div style={{display:"flex", gap:"4px"}}>
                            <button
                              type="button"
                              onClick={() => removeLineItem(subItem.id)}
                              disabled={isSubmitting}
                              className="btn btn-danger"
                              style={{fontSize:"12px", padding:"4px 8px"}}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        {/* Beschreibungsfeld über volle Breite */}
                        <textarea
                          value={subItem.description || ''}
                          onChange={(e) => updateLineItem(subItem.id, 'description', e.target.value)}
                          placeholder="Beschreibung (optional) - Markdown unterstützt: **fett**, *kursiv*, Absätze durch Leerzeilen"
                          style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"12px", minHeight:"40px", resize:"vertical"}}
                          disabled={isSubmitting}
                        />
                      </div>
                    ))}
                </React.Fragment>
                );
              })}
            
            {/* Orphaned sub-items (itemType === 'individual_sub' but no parentItemId) */}
            {lineItems
              .filter(item => item.itemType === 'individual_sub' && !item.parentItemId)
              .map(item => (
                <div key={`orphan-${item.id}`} style={{
                  padding: "12px",
                  border: "2px dashed #ffa500",
                  background: "rgba(255,165,0,.1)",
                  borderRadius: "6px"
                }}>
                  <div style={{marginBottom: "8px", color: "var(--accent)", fontSize: "14px", fontWeight: "500"}}>
                    🔗 Sub-Position ohne Parent - Parent auswählen:
                  </div>
                  <div style={{marginBottom: "12px"}}>
                    <select
                      value={item.parentItemId || ''}
                      onChange={(e) => {
                        const newParentId = e.target.value ? parseInt(e.target.value) : undefined;
                        updateLineItem(item.id, 'parentItemId', newParentId);
                      }}
                      style={{width:"100%", padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                      disabled={isSubmitting}
                    >
                      <option value="">-- Parent-Position auswählen --</option>
                      {lineItems
                        .filter(pItem => !pItem.parentItemId && pItem.id !== item.id)
                        .map(parentItem => (
                          <option key={parentItem.id} value={parentItem.id}>
                            {parentItem.title || `Position ${parentItem.id}`}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:"8px", alignItems:"start"}}>
                    <div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateLineItem(item.id, 'title', e.target.value)}
                        placeholder="Sub-Position Titel"
                        style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"14px", marginBottom:"4px"}}
                        disabled={isSubmitting}
                      />
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Beschreibung (optional)"
                        style={{width:"100%", padding:"6px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)", fontSize:"12px", minHeight:"40px", resize:"vertical"}}
                        disabled={isSubmitting}
                      />
                    </div>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      style={{padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                      disabled={isSubmitting}
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      style={{padding:"8px", border:"1px solid rgba(255,255,255,.1)", borderRadius:"4px", background:"rgba(17,24,39,.8)", color:"var(--muted)"}}
                      disabled={isSubmitting}
                    />
                    <div style={{padding:"8px", textAlign:"right", fontWeight:"500"}}>
                      €{item.total.toFixed(2)}
                    </div>
                    <div style={{display:"flex", gap:"4px"}}>
                      <button
                        type="button"
                        onClick={() => {
                          updateLineItem(item.id, 'itemType', 'standalone');
                          updateLineItem(item.id, 'parentItemId', undefined);
                        }}
                        disabled={isSubmitting}
                        className="btn btn-secondary"
                        style={{fontSize:"12px", padding:"4px 8px"}}
                        title="Als eigenständige Position verwenden"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        disabled={isSubmitting}
                        className="btn btn-danger"
                        style={{fontSize:"12px", padding:"4px 8px"}}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            
            {/* Fallback wenn keine Items vorhanden */}
            {lineItems.length === 0 && (
              <div style={{textAlign:"center", padding:"20px", color:"var(--muted)", fontStyle:"italic"}}>
                Keine Positionen hinzugefügt. Klicken Sie auf "Position hinzufügen" um zu beginnen.
              </div>
            )}
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
