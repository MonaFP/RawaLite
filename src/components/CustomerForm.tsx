import {useEffect, useState } from 'react';
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { ValidationError, handleError } from "../lib/errors";
// Customer import removed

export interface CustomerFormValues {
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  notes?: string;
}

export interface CustomerFormProps {
  initial?: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function CustomerForm({ initial, onSubmit, onCancel, submitLabel = "Speichern" }: CustomerFormProps) {
  const [values, setValues] = useState<CustomerFormValues>(initial ?? { name: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showError, showSuccess } = useNotifications();
  const { withLoading } = useLoading();

  useEffect(() => { 
    setValues(initial ?? { name: "" }); 
    setFieldErrors({});
  }, [initial]);

  function change<K extends keyof CustomerFormValues>(key: K, v: CustomerFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: v }));
    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: '' }));
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!values.name || values.name.trim().length < 2) {
      errors.name = "Bitte einen gültigen Namen angeben (min. 2 Zeichen).";
    }
    
    if (values.email && values.email.trim() && !/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = "Bitte eine gültige E-Mail-Adresse eingeben.";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('CustomerForm handleSubmit called');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    if (isSubmitting) {
      console.log('Already submitting, preventing double submission');
      return; // Prevent double submission
    }
    
    const submitData: CustomerFormValues = { 
      name: values.name.trim(), 
      email: values.email?.trim() || undefined, 
      phone: values.phone?.trim() || undefined,
      street: values.street?.trim() || undefined,
      zip: values.zip?.trim() || undefined,
      city: values.city?.trim() || undefined,
      notes: values.notes?.trim() || undefined
    };
    
    console.log('CustomerForm submitting data:', submitData);
    
    try {
      setIsSubmitting(true);
      console.log('Calling onSubmit with withLoading wrapper');
      await withLoading(
        async () => {
          console.log('Inside withLoading, calling onSubmit');
          await onSubmit(submitData);
          console.log('onSubmit completed successfully');
        },
        `${submitLabel}...`
      );
      showSuccess(`Kunde wurde erfolgreich ${submitLabel === 'Speichern' ? 'gespeichert' : 'aktualisiert'}.`);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
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
    <form onSubmit={handleSubmit} className="customer-form" style={{ display: "grid", gap: 12, maxWidth: 680 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label>Name*</label>
        <input 
          type="text"
          value={values.name} 
          onChange={e => change("name", e.target.value)} 
          placeholder="Max Mustermann"
          required
          disabled={isSubmitting}
          className={fieldErrors.name ? 'error' : ''}
        />
        {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label>E-Mail</label>
        <input 
          type="email"
          value={values.email ?? ""} 
          onChange={e => change("email", e.target.value)} 
          placeholder="max@example.com"
          disabled={isSubmitting}
          className={fieldErrors.email ? 'error' : ''}
        />
        {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label>Telefon</label>
        <input 
          type="tel"
          value={values.phone ?? ""} 
          onChange={e => change("phone", e.target.value)} 
          placeholder="+49 30 12345678"
          disabled={isSubmitting}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label>Straße</label>
        <input 
          type="text"
          value={values.street ?? ""} 
          onChange={e => change("street", e.target.value)} 
          placeholder="Musterstraße 123"
          disabled={isSubmitting}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>PLZ</label>
          <input 
            type="text"
            value={values.zip ?? ""} 
            onChange={e => change("zip", e.target.value)} 
            placeholder="12345"
            disabled={isSubmitting}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Ort</label>
          <input 
            type="text"
            value={values.city ?? ""} 
            onChange={e => change("city", e.target.value)} 
            placeholder="Berlin"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label>Notizen</label>
        <textarea 
          value={values.notes ?? ""} 
          onChange={e => change("notes", e.target.value)} 
          placeholder="Weitere Informationen zum Kunden..."
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: "16px" }}>
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
        .customer-form input, .customer-form textarea { 
          background: rgba(255,255,255,.06); 
          color: white; 
          border: 1px solid rgba(255,255,255,.15); 
          padding: 10px 12px; 
          border-radius: 8px; 
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        .customer-form input:focus, .customer-form textarea:focus { 
          outline: 2px solid rgba(96,165,250,.5);
          background: rgba(255,255,255,.08);
        }
        .customer-form input.error, .customer-form textarea.error {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.1);
        }
        .customer-form input:disabled, .customer-form textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .customer-form label {
          font-weight: 500;
          margin-bottom: 4px;
          color: rgba(255,255,255,.9);
        }
        .field-error {
          color: rgba(239, 68, 68, 0.9);
          font-size: 0.8rem;
          margin-top: 4px;
        }
        .customer-form textarea {
          resize: vertical;
          min-height: 60px;
        }
      `}</style>
    </form>
  );
}



