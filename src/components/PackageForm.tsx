import React, { useState, useEffect } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { ValidationError, handleError } from "../lib/errors";
import type { Package, PackageLineItem } from "../persistence/adapter";
import { formatNumberInputValue, parseNumberInput, getNumberInputStyles } from '../lib/input-helpers';
import { formatCurrency } from '../lib/discount-calculator';

export interface PackageFormValues {
  internalTitle: string;
  lineItems: Omit<PackageLineItem, "id">[];
  addVat: boolean;
  parentPackageId?: number;
}

export interface PackageFormProps {
  initial?: PackageFormValues;
  onSubmit: (values: PackageFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  packages?: Package[]; // Für Subpaket-Auswahl
}

export default function PackageForm({ 
  initial, 
  onSubmit, 
  onCancel, 
  submitLabel = "Speichern",
  packages = []
}: PackageFormProps) {
  const [values, setValues] = useState<PackageFormValues>(initial ?? {
    internalTitle: "",
    lineItems: [],
    addVat: false
  });

  const [currentItem, setCurrentItem] = useState({ 
    title: "", 
    quantity: 1, 
    unitPrice: 0, 
    parentItemId: undefined as number | undefined,
    description: "",
    priceDisplayMode: 'default' as 'default' | 'included' | 'hidden' | 'optional'
  });

  // 🔧 FIX: Dual-State Pattern für unitPrice Eingabe (verhindert Formatierung während Eingabe)
  const [editingUnitPrice, setEditingUnitPrice] = useState<string>('');
  const [isEditingUnitPrice, setIsEditingUnitPrice] = useState(false);
  
  // 🔧 FIX: Editing-State für bestehende Line-Items (Index → editingValue)
  const [editingLineItems, setEditingLineItems] = useState<Record<number, string>>({});

  // 🔍 DEBUG: State Update Flow Monitoring
  useEffect(() => {
    console.log('🔍 CURRENT ITEM UPDATED:', {
      parentItemId: currentItem.parentItemId,
      title: currentItem.title,
      timestamp: Date.now(),
      availableParentsCount: values.lineItems.filter(li => li.parentItemId === undefined || li.parentItemId === null).length
    });
  }, [currentItem.parentItemId]);

  useEffect(() => {
    console.log('🔍 VALUES LINEITEMS UPDATED:', {
      lineItemsCount: values.lineItems.length,
      parentItemsCount: values.lineItems.filter(li => li.parentItemId === undefined || li.parentItemId === null).length,
      timestamp: Date.now()
    });
  }, [values.lineItems.length]);
  const [inputError, setInputError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🆕 Bulk-Operations State
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [bulkParent, setBulkParent] = useState<string>("");
  
  const { showError, showSuccess } = useNotifications();
  const { withLoading } = useLoading();

  function addLineItem() {
    if (!currentItem.title.trim()) {
      setInputError("Bitte einen Titel für die Position eingeben");
      // Focus auf das Title-Input setzen
      setTimeout(() => {
        const titleInput = document.querySelector('input[placeholder*="Position"]') as HTMLInputElement;
        titleInput?.focus();
      }, 100);
      return;
    }
    
    setInputError(""); // Fehler zurücksetzen
    
    const newItem = { 
      title: currentItem.title.trim(), 
      quantity: currentItem.quantity, 
      unitPrice: currentItem.unitPrice,
      parentItemId: currentItem.parentItemId,
      description: currentItem.description?.trim() || undefined,
      priceDisplayMode: currentItem.priceDisplayMode
    };
    
    setValues(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
    
    // Reset form but keep parentItemId if it was a sub-item
    const keepParentId = currentItem.parentItemId;
    setCurrentItem({ 
      title: "", 
      quantity: 1, 
      unitPrice: 0, 
      parentItemId: keepParentId, // Keep the same parent for easy consecutive sub-items
      description: "",
      priceDisplayMode: 'default'
    });
    
    // Focus back to title input for quick adding
    setTimeout(() => {
      const titleInput = document.querySelector('input[placeholder*="Position"]') as HTMLInputElement;
      titleInput?.focus();
    }, 100);
  }

  function removeLineItem(index: number) {
    setValues(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  }

  function updateLineItem(index: number, field: keyof typeof currentItem, value: any) {
    setValues(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }

  // 🆕 FEATURE: Parent-Child Zuordnung
  function getAvailableParents(currentItemIndex: number): Array<{title: string, index: number}> {
    // 🔧 FIX: Direktes Index-Mapping statt Filter/Map-Kombo um echte Array-Indizes zu behalten
    return values.lineItems
      .map((item, index) => ({ item, index })) // Echte Indizes bewahren
      .filter(({ item, index }) => 
        !item.parentItemId && // Nur Hauptpositionen
        index !== currentItemIndex && // Nicht sich selbst
        !isChildOf(index, currentItemIndex) // Nicht eigene Sub-Items
      )
      .map(({ item, index }) => ({
        title: item.title,
        index: index // Echten Array-Index verwenden, nicht findIndex
      }));
  }

  function updateParentRelation(itemIndex: number, newParentIndex: string) {
    // 🔧 KORREKT: Array-Index-basierte Logik für PackageForm (wie PaketePage es vorbereitet)
    const newParentArrayIndex = newParentIndex ? Number(newParentIndex) : undefined;
    
    // 🔍 DEBUG: State vor Update

    
    // Validation: Keine zirkulären Referenzen (mit Array-Indizes)
    if (wouldCreateCircularReference(itemIndex, newParentArrayIndex)) {
      showError("Zirkuläre Referenz nicht erlaubt - Item kann nicht Sub von sich selbst oder seinen eigenen Sub-Items sein");
      return;
    }
    
    // 🔧 KORREKT: Array-Index als parentItemId setzen mit sofortigem State-Update
    const isBecomingSub = newParentArrayIndex !== undefined;
    const parentTitle = isBecomingSub ? values.lineItems[newParentArrayIndex].title : "";
    
    setValues(prev => {
      const updatedItems = prev.lineItems.map((item, i) => 
        i === itemIndex ? { ...item, parentItemId: newParentArrayIndex } : item
      );
      

      
      return {
        ...prev,
        lineItems: updatedItems
      };
    });
    
    // Message nach State-Update
    const message = isBecomingSub 
      ? `Item zu Sub-Position unter "${parentTitle}" geändert`
      : 'Item zu Hauptposition geändert';
    showSuccess(message);
  }

  function promoteToParent(itemIndex: number) {
    // Finde alle Sub-Items dieses Items
    const childItems = values.lineItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.parentItemId === itemIndex);
    
    // Mache das Item zur Hauptposition
    updateLineItem(itemIndex, "parentItemId", undefined);
    
    // Optional: Frage ob Kinder auch zu Hauptpositionen werden sollen
    if (childItems.length > 0) {
      const shouldPromoteChildren = confirm(
        `Dieses Item hat ${childItems.length} Sub-Items. Sollen diese auch zu Hauptpositionen werden?`
      );
      
      if (shouldPromoteChildren) {
        childItems.forEach(({ index }) => {
          updateLineItem(index, "parentItemId", undefined);
        });
      }
    }
    
    showSuccess("Item zu Hauptposition gemacht");
  }

  // Prüfe ob itemA ein Child von itemB ist
  function isChildOf(itemA: number, itemB: number): boolean {
    const item = values.lineItems[itemA];
    if (!item || item.parentItemId === undefined) return false;
    if (item.parentItemId === itemB) return true;
    return isChildOf(item.parentItemId, itemB);
  }

  // Zirkuläre Referenz Prüfung
  function wouldCreateCircularReference(itemIndex: number, newParentIndex?: number): boolean {
    if (newParentIndex === undefined) return false;
    
    // Prüfe ob newParent ein direktes oder indirektes Sub-Item von itemIndex ist
    const checkCircular = (parentIndex: number, visited = new Set<number>()): boolean => {
      if (visited.has(parentIndex)) return true; // Zyklus erkannt
      visited.add(parentIndex);
      
      const parentItem = values.lineItems[parentIndex];
      if (!parentItem) return false;
      
      if (parentItem.parentItemId === itemIndex) return true; // Direkte Referenz
      if (parentItem.parentItemId !== undefined) {
        return checkCircular(parentItem.parentItemId, visited); // Indirekte Referenz
      }
      return false;
    };
    
    return checkCircular(newParentIndex);
  }

  // 🆕 FEATURE: Reihenfolge-Verwaltung
  function moveItem(currentIndex: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= values.lineItems.length) return;
    
    const newLineItems = [...values.lineItems];
    
    // Swap items
    [newLineItems[currentIndex], newLineItems[newIndex]] = 
      [newLineItems[newIndex], newLineItems[currentIndex]];
    
    // KRITISCH: Parent-Child Referenzen nach Reorder aktualisieren
    const updatedLineItems = updateParentReferencesAfterReorder(newLineItems, currentIndex, newIndex);
    
    setValues(prev => ({ ...prev, lineItems: updatedLineItems }));
    
    // User Feedback
    showSuccess(`Item ${direction === 'up' ? 'nach oben' : 'nach unten'} verschoben`);
  }

  // Parent-Child Referenzen nach Reorder aktualisieren
  function updateParentReferencesAfterReorder(
    reorderedItems: typeof values.lineItems, 
    oldIndex: number, 
    newIndex: number
  ): typeof values.lineItems {
    return reorderedItems.map((item, currentIndex) => {
      if (item.parentItemId === undefined) return item;
      
      let adjustedParentId = item.parentItemId;
      
      // Wenn Parent-Referenz durch Swap betroffen ist
      if (item.parentItemId === oldIndex) {
        adjustedParentId = newIndex;
      } else if (item.parentItemId === newIndex) {
        adjustedParentId = oldIndex;
      }
      
      return {
        ...item,
        parentItemId: adjustedParentId
      };
    });
  }

  // 🆕 FEATURE: Responsive & Touch Optimization
  function getResponsiveStyles() {
    const isMobile = window.innerWidth <= 768;
    const isTouch = 'ontouchstart' in window;
    
    return {
      buttonSize: isMobile ? 'medium' : 'small',
      spacing: isMobile ? '6px' : '4px',
      touchPadding: isTouch ? '6px 10px' : '3px 6px',
      fontSize: isMobile ? '12px' : '10px',
      minTouchTarget: isTouch ? '44px' : 'auto'
    };
  }

  // 🆕 FEATURE: Visual Enhancements
  function getButtonStyle(baseColor: string, disabled: boolean = false, size: 'small' | 'medium' = 'medium') {
    const colors = {
      blue: { normal: "rgba(59,130,246,.8)", hover: "rgba(59,130,246,1)", disabled: "rgba(107,114,128,.4)" },
      green: { normal: "rgba(34,197,94,.8)", hover: "rgba(34,197,94,1)", disabled: "rgba(107,114,128,.4)" },
      red: { normal: "rgba(239,68,68,.8)", hover: "rgba(239,68,68,1)", disabled: "rgba(107,114,128,.4)" },
      gray: { normal: "rgba(107,114,128,.6)", hover: "rgba(107,114,128,.8)", disabled: "rgba(107,114,128,.4)" }
    };
    
    const colorSet = colors[baseColor as keyof typeof colors] || colors.blue;
    const fontSize = size === 'small' ? '9px' : '11px';
    const padding = size === 'small' ? '2px 4px' : '3px 6px';
    
    return {
      fontSize,
      padding,
      borderRadius: "3px",
      border: "none",
      background: disabled ? colorSet.disabled : colorSet.normal,
      color: "white",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.15s ease",
      transform: disabled ? "none" : "scale(1)",
      opacity: disabled ? 0.6 : 1,
      // Hover-Effekt wird durch onMouseEnter/onMouseLeave implementiert
    };
  }

  // 🆕 FEATURE: Keyboard Shortcuts - OPTIMIZED to prevent dependency hell
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Keyboard-Shortcuts nur wenn kein Input-Element fokussiert ist
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl+A: Alle Items auswählen
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedItems(prev => values.lineItems.map((_, i) => i));
        showSuccess("Alle Items ausgewählt");
        return;
      }

      // Escape: Auswahl aufheben
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItems([]);
        setFocusedItemIndex(null);
        showSuccess("Auswahl aufgehoben");
        return;
      }

      // Arrow Keys: Item-Navigation
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        setFocusedItemIndex(prev => {
          const newIndex = prev !== null 
            ? Math.max(0, Math.min(values.lineItems.length - 1, prev + direction))
            : 0;
          
          // Auto-select focused item
          setSelectedItems(prevSelected => 
            !prevSelected.includes(newIndex) ? [...prevSelected, newIndex] : prevSelected
          );
          return newIndex;
        });
        return;
      }

      // Space: Toggle selection of focused item
      if (e.key === ' ' && focusedItemIndex !== null) {
        e.preventDefault();
        toggleItemSelection(focusedItemIndex);
        return;
      }

      // Enter: Move focused item
      if (e.key === 'Enter' && focusedItemIndex !== null) {
        e.preventDefault();
        const direction = e.shiftKey ? 'up' : 'down';
        if (direction === 'up' && focusedItemIndex > 0) {
          moveItem(focusedItemIndex, 'up');
          setFocusedItemIndex(focusedItemIndex - 1);
        } else if (direction === 'down' && focusedItemIndex < values.lineItems.length - 1) {
          moveItem(focusedItemIndex, 'down');
          setFocusedItemIndex(focusedItemIndex + 1);
        }
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // 🔧 ANTI-PATTERN FIX: Empty dependencies to prevent re-render loops

  // 🆕 FEATURE: Bulk-Operations
  function toggleItemSelection(index: number) {
    setSelectedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }

  function bulkSetParent() {
    const parentIndex = bulkParent ? Number(bulkParent) : undefined;
    let successCount = 0;
    
    // 🔧 KORREKT: Direkter State-Update für Bulk-Operations
    setValues(prev => {
      const updatedItems = [...prev.lineItems];
      
      selectedItems.forEach(itemIndex => {
        if (!wouldCreateCircularReference(itemIndex, parentIndex)) {
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], parentItemId: parentIndex };
          successCount++;
        }
      });
      
      return {
        ...prev,
        lineItems: updatedItems
      };
    });
    
    setSelectedItems([]);
    setBulkParent("");
    
    // Async messages to avoid state update during render
    setTimeout(() => {
      if (successCount > 0) {
        showSuccess(`${successCount} Items ${parentIndex !== undefined ? 'zu Sub-Items' : 'zu Hauptpositionen'} geändert`);
      }
      
      if (successCount < selectedItems.length) {
        showError(`${selectedItems.length - successCount} Items konnten nicht geändert werden (Zirkuläre Referenzen)`);
      }
    }, 0);
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!values.internalTitle.trim()) {
      errors.internalTitle = "Bitte einen internen Titel eingeben";
    }
    
    if (values.lineItems.length === 0) {
      errors.lineItems = "Bitte mindestens eine Position hinzufügen";
    }

    values.lineItems.forEach((item, index) => {
      if (!item.title.trim()) {
        errors[`item_${index}_title`] = "Titel ist erforderlich";
      }
      if (item.quantity <= 0) {
        errors[`item_${index}_quantity`] = "Menge muss größer als 0 sein";
      }
      if (item.unitPrice < 0) {
        errors[`item_${index}_unitPrice`] = "Betrag darf nicht negativ sein";
      }
      
      // 🆕 Hierarchie-Validierung
      if (wouldCreateCircularReference(index, item.parentItemId)) {
        errors[`item_${index}_hierarchy`] = "Zirkuläre Referenz erkannt";
      }
      
      // Parent existiert prüfen
      if (item.parentItemId !== undefined && !values.lineItems[item.parentItemId]) {
        errors[`item_${index}_parent`] = "Parent-Item existiert nicht";
      }
      
      // Parent ist keine Sub-Position (tiefe Hierarchien vermeiden)
      if (item.parentItemId !== undefined && values.lineItems[item.parentItemId]?.parentItemId !== undefined) {
        errors[`item_${index}_parent`] = "Parent-Item darf keine Sub-Position sein (max. 2 Ebenen)";
      }
    });
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const total = values.lineItems.reduce((sum, item) => {
    // Nur Hauptpositionen zählen (ohne parentItemId)
    if (!item.parentItemId) {
      return sum + (item.quantity * item.unitPrice);
    }
    return sum;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isSubmitting) {
      return;
    }

    const submitData: PackageFormValues = {
      ...values,
      internalTitle: values.internalTitle.trim()
    };
    
    try {
      setIsSubmitting(true);
      await withLoading(
        () => onSubmit(submitData),
        `${submitLabel}...`
      );
      showSuccess(`Paket wurde erfolgreich ${submitLabel === 'Speichern' ? 'gespeichert' : 'aktualisiert'}.`);
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

  const mainPackages = packages.filter(p => !p.parentPackageId);
  const canCreateSubpackage = values.lineItems.length > 0 || mainPackages.length > 0;

  return (
    <form onSubmit={handleSubmit} className="package-form" style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "grid", gap: 6 }}>
        <label>Paket-Name*</label>
        <input 
          value={values.internalTitle} 
          onChange={e => {
            setValues(prev => ({ ...prev, internalTitle: e.target.value }));
            if (fieldErrors.internalTitle) {
              setFieldErrors(prev => ({ ...prev, internalTitle: "" }));
            }
          }}
          placeholder="Webdesign-Paket"
          disabled={isSubmitting}
          className={fieldErrors.internalTitle ? 'error' : ''}
        />
        {fieldErrors.internalTitle && (
          <span className="field-error">{fieldErrors.internalTitle}</span>
        )}
      </div>

      {/* Subpaket-Auswahl */}
      {canCreateSubpackage && (
        <div style={{ display: "grid", gap: 6 }}>
          <label>Als Subpaket zu (optional)</label>
          <select 
            value={values.parentPackageId ?? ""} 
            onChange={e => setValues(prev => ({ 
              ...prev, 
              parentPackageId: e.target.value ? Number(e.target.value) : undefined 
            }))}
            disabled={isSubmitting}
          >
            <option value="">-- Hauptpaket --</option>
            {mainPackages.length > 0 ? (
              mainPackages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.internalTitle}
                </option>
              ))
            ) : (
              <option disabled style={{fontStyle: "italic", opacity: 0.7}}>
                Speichere zuerst ein Hauptpaket, um Subpakete erstellen zu können
              </option>
            )}
          </select>
        </div>
      )}

      {/* Line Items */}
      <div>
        <h3 style={{ margin: "0 0 12px 0" }}>Leistungspositionen</h3>
        
        {/* 🆕 Enhanced Hierarchie-Übersicht */}
        {values.lineItems.length > 0 && (
          <div style={{ 
            marginBottom: "16px", 
            padding: "12px", 
            background: "rgba(17,24,39,.2)", 
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,.1)"
          }}>
            {/* Stats Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--muted)" }}>
                <span>📊 {values.lineItems.length} Items</span>
                <span>📦 {values.lineItems.filter(item => item.parentItemId === undefined || item.parentItemId === null).length} Haupt</span>
                <span>↳ {values.lineItems.filter(item => item.parentItemId !== undefined).length} Sub</span>
                <span>💰 {formatCurrency(values.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0))}</span>
              </div>
              
              {/* Quick Actions */}
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => {
                    // Alle Items zu Hauptpositionen machen
                    const updatedItems = values.lineItems.map(item => ({ ...item, parentItemId: undefined }));
                    setValues(prev => ({ ...prev, lineItems: updatedItems }));
                    showSuccess("Alle Items zu Hauptpositionen gemacht");
                  }}
                  disabled={isSubmitting || values.lineItems.filter(item => item.parentItemId !== undefined).length === 0}
                  style={{
                    fontSize: "9px",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    border: "1px solid rgba(255,255,255,.2)",
                    background: "rgba(34,197,94,.6)",
                    color: "white",
                    cursor: "pointer"
                  }}
                  title="Alle zu Hauptpositionen"
                >
                  ⬆️ Alle
                </button>
              </div>
            </div>

            {/* Interactive Hierarchy Tree */}
            {values.lineItems.filter(item => item.parentItemId === undefined || item.parentItemId === null).length > 0 && (
              <details style={{ marginTop: "8px" }}>
                <summary style={{ cursor: "pointer", fontSize: "11px", opacity: 0.8, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>🌳 Hierarchie-Baum</span>
                  <span style={{ opacity: 0.6 }}>({values.lineItems.filter(item => item.parentItemId === undefined || item.parentItemId === null).length} Äste)</span>
                </summary>
                
                <div style={{ marginTop: "12px", fontSize: "11px", maxHeight: "200px", overflowY: "auto" }}>
                  {values.lineItems
                    .filter(item => item.parentItemId === undefined || item.parentItemId === null)
                    .map((parent, index) => {
                      const parentIndex = values.lineItems.findIndex(item => item === parent);
                      const subItems = values.lineItems.filter(item => item.parentItemId === parentIndex);
                      const parentTotal = parent.quantity * parent.unitPrice + subItems.reduce((sum, sub) => sum + (sub.quantity * sub.unitPrice), 0);
                      
                      return (
                        <div key={`parent-${parentIndex}-${parent.title}-${parent.quantity}-${parent.unitPrice}`} style={{ 
                          marginBottom: "8px", 
                          padding: "6px", 
                          background: "rgba(255,255,255,.03)",
                          borderRadius: "4px",
                          border: "1px solid rgba(255,255,255,.05)"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>📦</span>
                              <span style={{ fontWeight: "500" }}>#{parentIndex + 1} {parent.title}</span>
                              {subItems.length > 0 && (
                                <span style={{ 
                                  fontSize: "9px", 
                                  background: "rgba(96,165,250,.6)", 
                                  color: "white", 
                                  padding: "1px 4px", 
                                  borderRadius: "2px" 
                                }}>
                                  {subItems.length} Sub{subItems.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "10px", opacity: 0.8 }}>
                              {formatCurrency(parentTotal)}
                            </div>
                          </div>
                          
                          {subItems.map((sub, subIndex) => {
                            const subItemIndex = values.lineItems.findIndex(item => item === sub);
                            const subTotal = sub.quantity * sub.unitPrice;
                            return (
                              <div key={`sub-${subIndex}-${sub.title}-${sub.quantity}-${sub.unitPrice}`} style={{ 
                                marginLeft: "16px", 
                                marginTop: "4px",
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center",
                                opacity: 0.8
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ opacity: 0.6 }}>↳</span>
                                  <span>#{subItemIndex + 1} {sub.title}</span>
                                </div>
                                <div style={{ fontSize: "9px", opacity: 0.7 }}>
                                  {formatCurrency(subTotal)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              </details>
            )}
          </div>
        )}

        {/* 🆕 Bulk-Operations Panel */}
        {values.lineItems.length >= 3 && (
          <div style={{ 
            marginBottom: "16px", 
            padding: getResponsiveStyles().spacing === '6px' ? "16px" : "12px", 
            background: "rgba(59,130,246,.05)", 
            borderRadius: "6px",
            border: "1px solid rgba(59,130,246,.2)"
          }}>
            <details>
              <summary style={{ 
                cursor: "pointer", 
                fontSize: "12px", 
                fontWeight: "500",
                color: "rgba(59,130,246,.9)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>⚡ Bulk-Operations</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>({selectedItems.length} ausgewählt)</span>
                <span style={{ fontSize: "9px", opacity: 0.5, marginLeft: "auto" }}>⌨️ Ctrl+A, Esc, ↑↓, Space, Enter</span>
              </summary>
              
              <div style={{ marginTop: "12px" }}>
                {/* Selection Controls */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedItems([])}
                      disabled={selectedItems.length === 0}
                      onMouseEnter={() => setHoveredButton('clear-selection')}
                      onMouseLeave={() => setHoveredButton(null)}
                      style={{
                        ...getButtonStyle('gray', selectedItems.length === 0, 'small'),
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,.2)",
                        background: hoveredButton === 'clear-selection' && selectedItems.length > 0
                          ? "rgba(107,114,128,.8)"
                          : selectedItems.length === 0 ? "rgba(107,114,128,.4)" : "rgba(107,114,128,.6)",
                        transform: hoveredButton === 'clear-selection' && selectedItems.length > 0 
                          ? "scale(1.02)" : "scale(1)"
                      }}
                    >
                      Auswahl aufheben
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItems(values.lineItems.map((_, i) => i))}
                      disabled={selectedItems.length === values.lineItems.length}
                      onMouseEnter={() => setHoveredButton('select-all')}
                      onMouseLeave={() => setHoveredButton(null)}
                      style={{
                        ...getButtonStyle('blue', selectedItems.length === values.lineItems.length, 'small'),
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,.2)",
                        background: hoveredButton === 'select-all' && selectedItems.length < values.lineItems.length
                          ? "rgba(59,130,246,.8)"
                          : selectedItems.length === values.lineItems.length ? "rgba(107,114,128,.4)" : "rgba(59,130,246,.6)",
                        transform: hoveredButton === 'select-all' && selectedItems.length < values.lineItems.length 
                          ? "scale(1.02)" : "scale(1)"
                      }}
                    >
                      Alle auswählen
                    </button>
                  </div>
                  
                  {/* Item Selection Grid */}
                  <div className="selection-grid" style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", 
                    gap: "4px",
                    maxHeight: "120px",
                    overflowY: "auto",
                    padding: "8px",
                    background: "rgba(255,255,255,.02)",
                    borderRadius: "4px"
                  }}>
                    {values.lineItems.map((item, index) => (
                      <label
                        key={`item-${index}-${item.title}-${item.parentItemId}`}
                        className="item-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "9px",
                          cursor: "pointer",
                          padding: "2px 4px",
                          borderRadius: "2px",
                          background: selectedItems.includes(index) ? "rgba(59,130,246,.3)" : "transparent",
                          border: focusedItemIndex === index ? "2px solid rgba(59,130,246,.6)" : "2px solid transparent"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(index)}
                          onChange={() => toggleItemSelection(index)}
                          style={{ 
                            margin: 0, 
                            scale: getResponsiveStyles().buttonSize === 'medium' ? "1" : "0.8",
                            minWidth: getResponsiveStyles().minTouchTarget,
                            minHeight: getResponsiveStyles().minTouchTarget
                          }}
                        />
                        <span style={{ opacity: item.parentItemId !== undefined ? 0.7 : 1 }}>
                          {item.parentItemId !== undefined ? "↳ " : "📦 "}
                          #{index + 1}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <label style={{ fontSize: "10px", opacity: 0.8 }}>Parent zuordnen:</label>
                      <select
                        value={bulkParent}
                        onChange={(e) => setBulkParent(e.target.value)}
                        style={{
                          fontSize: "9px",
                          padding: "2px 4px",
                          borderRadius: "3px",
                          border: "1px solid rgba(255,255,255,.2)",
                          background: "rgba(17,24,39,.8)",
                          color: "var(--muted)"
                        }}
                      >
                        <option value="">Hauptpositionen</option>
                        {getAvailableParents(-1).map(parent => (
                          <option key={`bulk-parent-${parent.index}-${parent.title}`} value={parent.index}>
                            {parent.title.length > 12 ? parent.title.substring(0, 12) + '...' : parent.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={bulkSetParent}
                        disabled={selectedItems.length === 0}
                        onMouseEnter={() => setHoveredButton('bulk-assign')}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{
                          ...getButtonStyle('green', selectedItems.length === 0, 'small'),
                          fontSize: "9px",
                          padding: "3px 6px",
                          borderRadius: "3px",
                          background: hoveredButton === 'bulk-assign' && selectedItems.length > 0
                            ? "rgba(34,197,94,1)"
                            : selectedItems.length === 0 ? "rgba(107,114,128,.4)" : "rgba(34,197,94,.7)",
                          transform: hoveredButton === 'bulk-assign' && selectedItems.length > 0 
                            ? "scale(1.05)" : "scale(1)"
                        }}
                      >
                        Anwenden
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
        
        {fieldErrors.lineItems && (
          <div className="field-error" style={{ marginBottom: "12px" }}>
            {fieldErrors.lineItems}
          </div>
        )}
        
        {/* React.Fragment-basierte Gruppierung: Parent-Items mit ihren Sub-Items gruppiert */}
        {(() => {
          // 🔧 FIX: Force re-render with current state 
          const currentItems = values.lineItems;
          const parentItems = currentItems.filter(item => item.parentItemId === undefined || item.parentItemId === null);
          

          
          return parentItems.map((parentItem, parentIndex) => {
            const parentItemIndex = values.lineItems.findIndex(item => item === parentItem);
            const subItems = values.lineItems.filter(item => item.parentItemId === parentItemIndex);
            
            return (
              <React.Fragment key={`parent-${parentItemIndex}`}>
                {/* Parent-Item */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr auto 120px auto", 
                  gap: 8, 
                  alignItems: "center",
                  padding: "12px",
                  border: "1px solid rgba(255,255,255,.1)",
                  background: "rgba(17,24,39,.4)",
                  borderRadius: "6px",
                  marginBottom: "8px"
                }}>
                  <div>
                    <input 
                      value={parentItem.title}
                      onChange={e => updateLineItem(parentItemIndex, "title", e.target.value)}
                      placeholder="Hauptposition"
                      disabled={isSubmitting}
                      className={fieldErrors[`item_${parentItemIndex}_title`] ? 'error' : ''}
                    />
                    {fieldErrors[`item_${parentItemIndex}_title`] && (
                      <div className="field-error" style={{ fontSize: "10px" }}>
                        {fieldErrors[`item_${parentItemIndex}_title`]}
                      </div>
                    )}
                    <textarea 
                      value={parentItem.description || ""}
                      onChange={e => updateLineItem(parentItemIndex, "description", e.target.value)}
                      placeholder="Beschreibung (optional) - Markdown unterstützt: **fett**, *kursiv*, Absätze durch Leerzeilen"
                      style={{ 
                        width: "100%", 
                        marginTop: "4px", 
                        fontSize: "12px", 
                        opacity: 0.8,
                        minHeight: "40px",
                        resize: "vertical",
                        padding: "4px",
                        border: "1px solid rgba(255,255,255,.1)",
                        borderRadius: "4px",
                        background: "rgba(17,24,39,.8)",
                        color: "var(--muted)"
                      }}
                      disabled={isSubmitting}
                    />
                  </div>
                  <input 
                    type="number"
                    value={parentItem.quantity}
                    onChange={e => updateLineItem(parentItemIndex, "quantity", Number(e.target.value))}
                    style={{ width: "60px" }}
                    min="1"
                    disabled={isSubmitting}
                    className={fieldErrors[`item_${parentItemIndex}_quantity`] ? 'error' : ''}
                  />
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="1.000,00"
                    value={editingLineItems[parentItemIndex] !== undefined 
                      ? editingLineItems[parentItemIndex] 
                      : formatNumberInputValue(parentItem.unitPrice, true)
                    }
                    onFocus={() => {
                      setEditingLineItems(prev => ({
                        ...prev,
                        [parentItemIndex]: parentItem.unitPrice === 0 ? '' : parentItem.unitPrice.toString().replace('.', ',')
                      }));
                    }}
                    onChange={e => {
                      setEditingLineItems(prev => ({
                        ...prev,
                        [parentItemIndex]: e.target.value
                      }));
                    }}
                    onBlur={() => {
                      const parsed = parseNumberInput(editingLineItems[parentItemIndex] || '0');
                      updateLineItem(parentItemIndex, "unitPrice", parsed);
                      setEditingLineItems(prev => {
                        const newState = { ...prev };
                        delete newState[parentItemIndex];
                        return newState;
                      });
                    }}
                    disabled={isSubmitting}
                    className={fieldErrors[`item_${parentItemIndex}_unitPrice`] ? 'error' : ''}
                  />
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    {/* 🆕 Move-Controls */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                      <button 
                        type="button" 
                        onClick={() => moveItem(parentItemIndex, 'up')}
                        disabled={isSubmitting || parentItemIndex === 0}
                        onMouseEnter={() => setHoveredButton(`parent-up-${parentItemIndex}`)}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{ 
                          ...getButtonStyle('blue', parentItemIndex === 0 || isSubmitting, 'small'),
                          fontSize: "8px",
                          lineHeight: "10px",
                          background: hoveredButton === `parent-up-${parentItemIndex}` && parentItemIndex !== 0 && !isSubmitting
                            ? "rgba(59,130,246,1)" 
                            : parentItemIndex === 0 || isSubmitting ? "rgba(107,114,128,.4)" : "rgba(59,130,246,.8)",
                          transform: hoveredButton === `parent-up-${parentItemIndex}` && parentItemIndex !== 0 && !isSubmitting 
                            ? "scale(1.1)" : "scale(1)"
                        }}
                        title="Nach oben"
                      >
                        ⬆️
                      </button>
                      <button 
                        type="button" 
                        onClick={() => moveItem(parentItemIndex, 'down')}
                        disabled={isSubmitting || parentItemIndex === values.lineItems.length - 1}
                        onMouseEnter={() => setHoveredButton(`parent-down-${parentItemIndex}`)}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{ 
                          ...getButtonStyle('blue', parentItemIndex === values.lineItems.length - 1 || isSubmitting, 'small'),
                          fontSize: "8px",
                          lineHeight: "10px",
                          background: hoveredButton === `parent-down-${parentItemIndex}` && parentItemIndex !== values.lineItems.length - 1 && !isSubmitting
                            ? "rgba(59,130,246,1)" 
                            : parentItemIndex === values.lineItems.length - 1 || isSubmitting ? "rgba(107,114,128,.4)" : "rgba(59,130,246,.8)",
                          transform: hoveredButton === `parent-down-${parentItemIndex}` && parentItemIndex !== values.lineItems.length - 1 && !isSubmitting 
                            ? "scale(1.1)" : "scale(1)"
                        }}
                        title="Nach unten"
                      >
                        ⬇️
                      </button>
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--muted)", opacity: 0.6 }}>
                      #{parentItemIndex + 1}
                    </span>
                    
                    {/* Parent-Selection Dropdown */}
                    <select 
                      value={parentItem.parentItemId ?? ""}
                      onChange={(e) => updateParentRelation(parentItemIndex, e.target.value)}
                      disabled={isSubmitting}
                      style={{ 
                        fontSize: "11px",
                        padding: "2px 4px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,.2)",
                        background: "rgba(17,24,39,.8)",
                        color: "var(--muted)",
                        minWidth: "120px"
                      }}
                      title="Parent-Zuordnung ändern"
                    >
                      <option value="">Hauptposition</option>
                      {getAvailableParents(parentItemIndex).map(parent => (
                        <option key={`parent-select-${parent.index}-${parent.title}`} value={parent.index}>
                          ↳ Sub von: {parent.title.length > 20 ? parent.title.substring(0, 20) + '...' : parent.title}
                        </option>
                      ))}
                    </select>
                    
                    <button 
                      type="button" 
                      onClick={() => {
                        setCurrentItem(prev => ({ ...prev, parentItemId: parentItemIndex, title: "", description: "" }));
                        setTimeout(() => {
                          const titleInput = document.querySelector('input[placeholder*="Position"]') as HTMLInputElement;
                          titleInput?.focus();
                        }, 100);
                      }}
                      disabled={isSubmitting}
                      style={{ 
                        backgroundColor: "rgba(96,165,250,.8)",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                      title="Sub-Item zu dieser Position hinzufügen"
                    >
                      + Sub
                    </button>
                    <button 
                      type="button" 
                      onClick={() => removeLineItem(parentItemIndex)}
                      disabled={isSubmitting}
                      style={{ 
                        backgroundColor: "rgba(239,68,68,.8)",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Sub-Items für dieses Parent */}
                {subItems.map(subItem => {
                  const subItemIndex = values.lineItems.findIndex(item => item === subItem);
                  return (
                    <div key={`sub-${subItemIndex}`} style={{ 
                      display: "grid", 
                      gridTemplateColumns: "1fr auto 120px auto", 
                      gap: 8, 
                      alignItems: "center",
                      padding: "12px",
                      marginLeft: "24px",
                      border: "1px solid rgba(96,165,250,.3)",
                      borderLeft: "4px solid var(--accent)",
                      background: "rgba(96,165,250,.1)",
                      borderRadius: "6px",
                      marginBottom: "8px"
                    }}>
                      <div>
                        <span style={{opacity: 0.7, fontSize: "12px"}}>↳ </span>
                        <input 
                          value={subItem.title}
                          onChange={e => updateLineItem(subItemIndex, "title", e.target.value)}
                          placeholder="Sub-Position"
                          disabled={isSubmitting}
                          className={fieldErrors[`item_${subItemIndex}_title`] ? 'error' : ''}
                        />
                        {fieldErrors[`item_${subItemIndex}_title`] && (
                          <div className="field-error" style={{ fontSize: "10px" }}>
                            {fieldErrors[`item_${subItemIndex}_title`]}
                          </div>
                        )}
                        <textarea 
                          value={subItem.description || ""}
                          onChange={e => updateLineItem(subItemIndex, "description", e.target.value)}
                          placeholder="Beschreibung (optional) - Markdown unterstützt: **fett**, *kursiv*, Absätze durch Leerzeilen"
                          style={{ 
                            width: "100%", 
                            marginTop: "4px", 
                            fontSize: "12px", 
                            opacity: 0.8,
                            minHeight: "40px",
                            resize: "vertical",
                            padding: "4px",
                            border: "1px solid rgba(255,255,255,.1)",
                            borderRadius: "4px",
                            background: "rgba(17,24,39,.8)",
                            color: "var(--muted)"
                          }}
                          disabled={isSubmitting}
                        />
                      </div>
                      <input 
                        type="number"
                        value={subItem.quantity}
                        onChange={e => updateLineItem(subItemIndex, "quantity", Number(e.target.value))}
                        style={{ width: "60px" }}
                        min="1"
                        disabled={isSubmitting}
                        className={fieldErrors[`item_${subItemIndex}_quantity`] ? 'error' : ''}
                      />
                      <input 
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={editingLineItems[subItemIndex] !== undefined 
                          ? editingLineItems[subItemIndex] 
                          : formatNumberInputValue(subItem.unitPrice, true)
                        }
                        onFocus={() => {
                          setEditingLineItems(prev => ({
                            ...prev,
                            [subItemIndex]: subItem.unitPrice === 0 ? '' : subItem.unitPrice.toString().replace('.', ',')
                          }));
                        }}
                        onChange={e => {
                          setEditingLineItems(prev => ({
                            ...prev,
                            [subItemIndex]: e.target.value
                          }));
                        }}
                        onBlur={() => {
                          const parsed = parseNumberInput(editingLineItems[subItemIndex] || '0');
                          updateLineItem(subItemIndex, "unitPrice", parsed);
                          setEditingLineItems(prev => {
                            const newState = { ...prev };
                            delete newState[subItemIndex];
                            return newState;
                          });
                        }}
                        disabled={isSubmitting}
                        className={fieldErrors[`item_${subItemIndex}_unitPrice`] ? 'error' : ''}
                      />
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {/* 🆕 Move-Controls für Sub-Items */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <button 
                            type="button" 
                            onClick={() => moveItem(subItemIndex, 'up')}
                            disabled={isSubmitting || subItemIndex === 0}
                            onMouseEnter={() => setHoveredButton(`sub-up-${subItemIndex}`)}
                            onMouseLeave={() => setHoveredButton(null)}
                            style={{ 
                              ...getButtonStyle('blue', subItemIndex === 0 || isSubmitting, 'small'),
                              fontSize: "7px",
                              lineHeight: "9px",
                              padding: "1px 3px",
                              background: hoveredButton === `sub-up-${subItemIndex}` && subItemIndex !== 0 && !isSubmitting
                                ? "rgba(96,165,250,1)" 
                                : subItemIndex === 0 || isSubmitting ? "rgba(107,114,128,.4)" : "rgba(96,165,250,.8)",
                              transform: hoveredButton === `sub-up-${subItemIndex}` && subItemIndex !== 0 && !isSubmitting 
                                ? "scale(1.1)" : "scale(1)"
                            }}
                            title="Nach oben"
                          >
                            ⬆️
                          </button>
                          <button 
                            type="button" 
                            onClick={() => moveItem(subItemIndex, 'down')}
                            disabled={isSubmitting || subItemIndex === values.lineItems.length - 1}
                            onMouseEnter={() => setHoveredButton(`sub-down-${subItemIndex}`)}
                            onMouseLeave={() => setHoveredButton(null)}
                            style={{ 
                              ...getButtonStyle('blue', subItemIndex === values.lineItems.length - 1 || isSubmitting, 'small'),
                              fontSize: "7px",
                              lineHeight: "9px",
                              padding: "1px 3px",
                              background: hoveredButton === `sub-down-${subItemIndex}` && subItemIndex !== values.lineItems.length - 1 && !isSubmitting
                                ? "rgba(96,165,250,1)" 
                                : subItemIndex === values.lineItems.length - 1 || isSubmitting ? "rgba(107,114,128,.4)" : "rgba(96,165,250,.8)",
                              transform: hoveredButton === `sub-down-${subItemIndex}` && subItemIndex !== values.lineItems.length - 1 && !isSubmitting 
                                ? "scale(1.1)" : "scale(1)"
                            }}
                            title="Nach unten"
                          >
                            ⬇️
                          </button>
                        </div>
                        <span style={{ fontSize: "9px", color: "var(--muted)", opacity: 0.5 }}>
                          #{subItemIndex + 1}
                        </span>
                        
                        {/* Parent-Selection für Sub-Items */}
                        <select 
                          value={subItem.parentItemId ?? ""}
                          onChange={(e) => updateParentRelation(subItemIndex, e.target.value)}
                          disabled={isSubmitting}
                          style={{ 
                            fontSize: "10px",
                            padding: "2px 4px",
                            borderRadius: "4px",
                            border: "1px solid rgba(96,165,250,.4)",
                            background: "rgba(17,24,39,.9)",
                            color: "var(--muted)",
                            minWidth: "100px"
                          }}
                          title="Parent-Zuordnung ändern"
                        >
                          <option value="">Hauptposition</option>
                          {getAvailableParents(subItemIndex).map(parent => (
                            <option key={`sub-parent-${parent.index}-${parent.title}`} value={parent.index}>
                              ↳ {parent.title.length > 15 ? parent.title.substring(0, 15) + '...' : parent.title}
                            </option>
                          ))}
                        </select>
                        
                        {/* Promote to Parent Button */}
                        <button 
                          type="button" 
                          onClick={() => promoteToParent(subItemIndex)}
                          disabled={isSubmitting}
                          onMouseEnter={() => setHoveredButton(`promote-${subItemIndex}`)}
                          onMouseLeave={() => setHoveredButton(null)}
                          style={{ 
                            ...getButtonStyle('green', isSubmitting, 'small'),
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            background: hoveredButton === `promote-${subItemIndex}` && !isSubmitting
                              ? "rgba(34,197,94,1)" 
                              : isSubmitting ? "rgba(107,114,128,.4)" : "rgba(34,197,94,.8)",
                            transform: hoveredButton === `promote-${subItemIndex}` && !isSubmitting 
                              ? "scale(1.05)" : "scale(1)"
                          }}
                          title="Zu Hauptposition machen"
                        >
                          ⬆️
                        </button>
                        
                        <button 
                          type="button" 
                          onClick={() => removeLineItem(subItemIndex)}
                          disabled={isSubmitting}
                          style={{ 
                            backgroundColor: "rgba(239,68,68,.8)",
                            color: "white",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          });
        })()}

        {/* Neues Item hinzufügen */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr auto 120px 140px auto auto", 
          gap: 8, 
          alignItems: "center",
          padding: "12px 0",
          borderTop: "2px solid rgba(96,165,250,.3)",
          marginTop: "8px"
        }}>
          <div>
            {/* Dropdown für Sub-Item Auswahl */}
            {values.lineItems.filter(li => li.parentItemId === undefined || li.parentItemId === null).length > 0 && (
              <select 
                value={currentItem.parentItemId ?? ""}
                onChange={e => {
                  console.log('🔍 DROPDOWN CHANGE:', {
                    selectedValue: e.target.value,
                    selectedValueType: typeof e.target.value,
                    currentParentId: currentItem.parentItemId,
                    currentParentIdType: typeof currentItem.parentItemId,
                    willUpdate: e.target.value ? Number(e.target.value) : undefined,
                    lineItemsCount: values.lineItems.length,
                    timestamp: Date.now()
                  });
                  setCurrentItem(prev => ({ 
                    ...prev, 
                    parentItemId: e.target.value ? Number(e.target.value) : undefined 
                  }));
                }}
                style={{ 
                  marginBottom: "4px", 
                  width: "100%",
                  // 🔍 CSS ISOLATION TEST - based on status-dropdown-css-spezifitaet.md
                  backgroundColor: "#1a1a1a",
                  color: "white",
                  border: "1px solid rgba(96,165,250,.4)",
                  padding: "8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  zIndex: 9999,
                  position: "relative"
                }}
                disabled={isSubmitting}
              >
                <option value="">-- Hauptposition --</option>
                {values.lineItems
                  .filter(li => li.parentItemId === undefined || li.parentItemId === null)
                  .map((item) => {
                    const realIndex = values.lineItems.findIndex(searchItem => searchItem === item);
                    return (
                      <option key={`option-${realIndex}-${item.title}`} value={realIndex}>
                        ↳ Sub-Item zu: {item.title}
                      </option>
                    );
                  })
                }
              </select>
            )}
            
            <input 
              value={currentItem.title}
              onChange={e => {
                setCurrentItem(prev => ({ ...prev, title: e.target.value }));
                if (inputError) setInputError(""); // Fehler beim Tippen zurücksetzen
              }}
              placeholder={currentItem.parentItemId !== undefined ? "Sub-Position..." : "Neue Position..."}
              style={{ 
                width: "100%",
                border: inputError ? "1px solid #ff6b6b" : "1px solid rgba(255,255,255,.15)"
              }}
              disabled={isSubmitting}
            />
            
            <textarea 
              value={currentItem.description}
              onChange={e => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Beschreibung (optional) - Markdown unterstützt: **fett**, *kursiv*, Absätze durch Leerzeilen"
              style={{ 
                width: "100%", 
                marginTop: "4px", 
                fontSize: "12px", 
                opacity: 0.8,
                minHeight: "40px",
                resize: "vertical",
                padding: "4px",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: "4px",
                background: "rgba(17,24,39,.8)",
                color: "var(--muted)"
              }}
              disabled={isSubmitting}
            />
            
            {inputError && (
              <div className="field-error">
                {inputError}
              </div>
            )}
          </div>
          <input 
            type="number"
            value={currentItem.quantity}
            onChange={e => setCurrentItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            style={{ width: "60px" }}
            min="1"
            disabled={isSubmitting}
          />
          <input 
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={isEditingUnitPrice ? editingUnitPrice : formatNumberInputValue(currentItem.unitPrice, true)}
            onFocus={() => {
              setIsEditingUnitPrice(true);
              setEditingUnitPrice(currentItem.unitPrice === 0 ? '' : currentItem.unitPrice.toString().replace('.', ','));
            }}
            onChange={e => {
              setEditingUnitPrice(e.target.value);
            }}
            onBlur={() => {
              const parsed = parseNumberInput(editingUnitPrice);
              setCurrentItem(prev => ({ ...prev, unitPrice: parsed }));
              setIsEditingUnitPrice(false);
            }}
            disabled={isSubmitting}
          />
          <select
            value={currentItem.priceDisplayMode || 'default'}
            onChange={e => setCurrentItem(prev => ({ 
              ...prev, 
              priceDisplayMode: e.target.value as 'default' | 'included' | 'hidden' | 'optional' 
            }))}
            disabled={isSubmitting || currentItem.parentItemId === undefined}
            style={{
              width: "100%",
              backgroundColor: "#1a1a1a",
              color: currentItem.parentItemId === undefined ? "rgba(156,163,175,.5)" : "white",
              border: "1px solid rgba(96,165,250,.4)",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: currentItem.parentItemId === undefined ? "not-allowed" : "pointer"
            }}
            title={currentItem.parentItemId === undefined ? "Nur für Sub-Items verfügbar" : "Preisanzeige-Modus"}
          >
            <option value="default">Preise</option>
            <option value="included">inkl.</option>
            <option value="hidden">ausblenden</option>
            <option value="optional">optional</option>
          </select>
          {currentItem.parentItemId !== undefined && (
            <button 
              type="button" 
              onClick={() => setCurrentItem(prev => ({ ...prev, parentItemId: undefined }))}
              disabled={isSubmitting}
              style={{ 
                backgroundColor: "rgba(156,163,175,.8)",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
              title="Zu Hauptposition wechseln"
            >
              Haupt
            </button>
          )}
          <button 
            type="button" 
            onClick={addLineItem}
            disabled={isSubmitting}
            style={{ 
              backgroundColor: "rgba(34,197,94,.8)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            + Position hinzufügen
          </button>
        </div>
      </div>

      {/* Total */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,.2)",
        paddingTop: "12px"
      }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input 
            type="checkbox"
            checked={values.addVat}
            onChange={e => setValues(prev => ({ ...prev, addVat: e.target.checked }))}
            disabled={isSubmitting}
          />
          MwSt. hinzufügen
        </label>
        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
          Summe: {formatCurrency(total)}
          {values.addVat && (
            <span style={{ fontSize: "12px", opacity: 0.8, display: "block" }}>
              zzgl. MwSt.
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            minWidth: '120px'
          }}
        >
          {isSubmitting ? 'Wird gespeichert...' : submitLabel}
        </button>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '120px'
            }}
          >
            Abbrechen
          </button>
        )}
      </div>

      <style>{`
        .package-form input, 
        .package-form select { 
          background: rgba(255,255,255,.06); 
          color: white; 
          border: 1px solid rgba(255,255,255,.15); 
          padding: 10px 12px; 
          border-radius: 10px; 
          font-family: inherit;
        }
        
        /* 🔧 FIX: Spinner komplett entfernen (Webkit/Chrome) */
        .package-form input[type="number"]::-webkit-inner-spin-button,
        .package-form input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        /* 🔧 FIX: Spinner komplett entfernen (Firefox) */
        .package-form input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
        
        .package-form select option {
          background: #1a1a1a;
          color: white;
          padding: 8px;
        }
        
        .package-form input:focus, 
        .package-form select:focus { 
          outline: 2px solid rgba(96,165,250,.5);
          background: rgba(255,255,255,.08);
        }
        
        .package-form input.error {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.1);
        }
        
        .package-form input:disabled, 
        .package-form select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .package-form label {
          font-weight: 500;
          color: rgba(255,255,255,.9);
        }
        
        .field-error {
          color: rgba(239, 68, 68, 0.9);
          font-size: 0.8rem;
          margin-top: 4px;
        }
        
        .package-form input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
        
        /* 📱 Mobile Responsiveness */
        @media (max-width: 768px) {
          .package-form .bulk-operations-panel {
            padding: 16px 12px;
          }
          
          .package-form .move-controls {
            gap: 6px;
          }
          
          .package-form .hierarchy-overview {
            font-size: 11px;
          }
          
          .package-form .selection-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 8px;
          }
          
          .package-form .item-row {
            padding: 12px 8px;
          }
          
          .package-form .parent-controls {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }
          
          .package-form .parent-dropdown {
            min-width: unset;
            width: 100%;
          }
        }
        
        /* 🔥 Touch Optimizations */
        @media (hover: none) and (pointer: coarse) {
          .package-form button {
            min-height: 44px;
            min-width: 44px;
            padding: 8px 12px;
          }
          
          .package-form input[type="checkbox"] {
            transform: scale(1.2);
          }
          
          .package-form select {
            min-height: 44px;
            padding: 12px;
          }
        }
      `}</style>
    </form>
  );
}
