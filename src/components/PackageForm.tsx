import React, { useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { ValidationError, handleError } from "../lib/errors";
import type { Package, PackageLineItem } from "../persistence/adapter";
import { formatNumberInputValue, parseNumberInput, getNumberInputStyles } from '../lib/input-helpers';

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
    amount: 0, 
    parentItemId: undefined as number | undefined,
    description: ""
  });
  const [inputError, setInputError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      amount: currentItem.amount,
      parentItemId: currentItem.parentItemId,
      description: currentItem.description?.trim() || undefined
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
      amount: 0, 
      parentItemId: keepParentId, // Keep the same parent for easy consecutive sub-items
      description: "" 
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
      if (item.amount < 0) {
        errors[`item_${index}_amount`] = "Betrag darf nicht negativ sein";
      }
    });
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const total = values.lineItems.reduce((sum, item) => {
    // Nur Hauptpositionen zählen (ohne parentItemId)
    if (!item.parentItemId) {
      return sum + (item.quantity * item.amount);
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
            value={values.parentPackageId || ""} 
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
        
        {fieldErrors.lineItems && (
          <div className="field-error" style={{ marginBottom: "12px" }}>
            {fieldErrors.lineItems}
          </div>
        )}
        
        {/* Bestehende Items */}
        {values.lineItems.map((item, index) => {
          const isSubItem = !!item.parentItemId;
          
          return (
            <div key={index} style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr auto 120px auto", 
              gap: 8, 
              alignItems: "center",
              padding: "8px 0",
              paddingLeft: isSubItem ? "20px" : "0",
              borderBottom: "1px solid rgba(255,255,255,.1)",
              borderLeft: isSubItem ? "2px solid rgba(96,165,250,.5)" : "none"
            }}>
              <div>
                {isSubItem && <span style={{opacity: 0.7, fontSize: "12px"}}>↳ </span>}
                <input 
                  value={item.title}
                  onChange={e => updateLineItem(index, "title", e.target.value)}
                  placeholder={isSubItem ? "Sub-Position" : "Hauptposition"}
                  disabled={isSubmitting}
                  className={fieldErrors[`item_${index}_title`] ? 'error' : ''}
                />
                {fieldErrors[`item_${index}_title`] && (
                  <div className="field-error" style={{ fontSize: "10px" }}>
                    {fieldErrors[`item_${index}_title`]}
                  </div>
                )}
                <textarea 
                  value={item.description || ""}
                  onChange={e => updateLineItem(index, "description", e.target.value)}
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
                value={item.quantity}
                onChange={e => updateLineItem(index, "quantity", Number(e.target.value))}
                style={{ width: "60px" }}
                min="1"
                disabled={isSubmitting}
                className={fieldErrors[`item_${index}_quantity`] ? 'error' : ''}
              />
              <input 
                type="number"
                placeholder={isSubItem ? "0" : "1000"}
                value={formatNumberInputValue(item.amount)}
                onChange={e => updateLineItem(index, "amount", parseNumberInput(e.target.value))}
                style={getNumberInputStyles()}
                disabled={isSubmitting}
                className={fieldErrors[`item_${index}_amount`] ? 'error' : ''}
              />
              <div style={{ display: "flex", gap: "4px" }}>
                {!isSubItem && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setCurrentItem(prev => ({ ...prev, parentItemId: index, title: "", description: "" }));
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
                )}
                <button 
                  type="button" 
                  onClick={() => removeLineItem(index)}
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

        {/* Neues Item hinzufügen */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr auto 120px auto auto", 
          gap: 8, 
          alignItems: "center",
          padding: "12px 0",
          borderTop: "2px solid rgba(96,165,250,.3)",
          marginTop: "8px"
        }}>
          <div>
            {/* Dropdown für Sub-Item Auswahl */}
            {values.lineItems.filter(li => !li.parentItemId).length > 0 && (
              <select 
                value={currentItem.parentItemId || ""}
                onChange={e => setCurrentItem(prev => ({ 
                  ...prev, 
                  parentItemId: e.target.value ? Number(e.target.value) : undefined 
                }))}
                style={{ marginBottom: "4px", width: "100%" }}
                disabled={isSubmitting}
              >
                <option value="">-- Hauptposition --</option>
                {values.lineItems
                  .filter(li => !li.parentItemId)
                  .map((item, index) => (
                    <option key={index} value={index}>
                      ↳ Sub-Item zu: {item.title}
                    </option>
                  ))
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
            type="number"
            placeholder="0"
            value={formatNumberInputValue(currentItem.amount)}
            onChange={e => setCurrentItem(prev => ({ ...prev, amount: parseNumberInput(e.target.value) }))}
            style={getNumberInputStyles()}
            disabled={isSubmitting}
          />
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
          Total: €{total.toFixed(2)}
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
      `}</style>
    </form>
  );
}
