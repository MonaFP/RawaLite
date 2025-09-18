import React, { useEffect, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { ValidationError, handleError } from "../lib/errors";
import { useCustomers } from "../hooks/useCustomers";
import { useUnifiedSettings } from "../hooks/useUnifiedSettings";
import type { TimesheetActivity } from "../persistence/adapter";

export interface BasicTimesheetFormValues {
  customerId: number | '';
  title: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  vatRate: number;
  notes?: string;
}

export interface BasicTimesheetFormProps {
  initial?: BasicTimesheetFormValues;
  onSubmit: (values: BasicTimesheetFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function BasicTimesheetForm({ initial, onSubmit, onCancel, submitLabel = "Speichern" }: BasicTimesheetFormProps) {
  const [values, setValues] = useState<BasicTimesheetFormValues>(initial ?? { 
    customerId: '', 
    title: "", 
    status: 'draft',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    vatRate: 19
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customers } = useCustomers();
  const { showError, showSuccess } = useNotifications();
  const { withLoading } = useLoading();
  const { settings } = useUnifiedSettings();

  useEffect(() => { 
    setValues(initial ?? { 
      customerId: '', 
      title: "", 
      status: 'draft',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      vatRate: 19
    }); 
    setFieldErrors({});
  }, [initial]);

  function change<K extends keyof BasicTimesheetFormValues>(key: K, v: BasicTimesheetFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: v }));
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: '' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('BasicTimesheetForm handleSubmit: Starting submission with values:', values);
      await onSubmit(values);
      console.log('BasicTimesheetForm handleSubmit: Submission successful');
      showSuccess(initial ? "Leistungsnachweis erfolgreich aktualisiert!" : "Leistungsnachweis erfolgreich erstellt!");
    } catch (err) {
      console.error('BasicTimesheetForm handleSubmit: Error occurred:', err);
      const error = handleError(err);
      
      if (error instanceof ValidationError && error.field) {
        setFieldErrors(prev => ({ ...prev, [error.field!]: error.message }));
      } else {
        showError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;

  return (
    <div style={{ maxWidth: "800px", padding: "0" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Grunddaten */}
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "16px", alignItems: "start" }}>
          {/* Kunde */}
          <div style={{ display: "contents" }}>
            <label htmlFor="customerId" style={{ display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
              Kunde *
            </label>
            <div>
              <select
                id="customerId"
                value={values.customerId}
                onChange={(e) => change('customerId', e.target.value ? Number(e.target.value) : '')}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: fieldErrors.customerId ? "2px solid #ef4444" : "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)",
                  fontSize: "14px"
                }}
                required
              >
                <option value="">Kunde auswählen...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {fieldErrors.customerId && (
                <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.customerId}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: "contents" }}>
            <label htmlFor="status" style={{ display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
              Status
            </label>
            <div>
              <select
                id="status"
                value={values.status}
                onChange={(e) => change('status', e.target.value as BasicTimesheetFormValues['status'])}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)",
                  fontSize: "14px"
                }}
              >
                <option value="draft">Entwurf</option>
                <option value="sent">Gesendet</option>
                <option value="approved">Genehmigt</option>
                <option value="rejected">Abgelehnt</option>
              </select>
            </div>
          </div>

          {/* Titel */}
          <div style={{ display: "contents" }}>
            <label htmlFor="title" style={{ display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
              Titel *
            </label>
            <div>
              <input
                type="text"
                id="title"
                value={values.title}
                onChange={(e) => change('title', e.target.value)}
                placeholder="z.B. Entwicklungsarbeiten KW 37"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: fieldErrors.title ? "2px solid #ef4444" : "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)",
                  fontSize: "14px"
                }}
                required
              />
              {fieldErrors.title && (
                <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.title}</p>
              )}
            </div>
          </div>

          {/* Startdatum */}
          <div style={{ display: "contents" }}>
            <label htmlFor="startDate" style={{ display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
              Startdatum *
            </label>
            <div>
              <input
                type="date"
                id="startDate"
                value={values.startDate}
                onChange={(e) => change('startDate', e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: fieldErrors.startDate ? "2px solid #ef4444" : "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)",
                  fontSize: "14px"
                }}
                required
              />
              {fieldErrors.startDate && (
                <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.startDate}</p>
              )}
            </div>
          </div>

          {/* Enddatum */}
          <div style={{ display: "contents" }}>
            <label htmlFor="endDate" style={{ display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
              Enddatum *
            </label>
            <div>
              <input
                type="date"
                id="endDate"
                value={values.endDate}
                onChange={(e) => change('endDate', e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: fieldErrors.endDate ? "2px solid #ef4444" : "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)",
                  fontSize: "14px"
                }}
                required
              />
              {fieldErrors.endDate && (
                <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* MwSt. - nur anzeigen wenn nicht Kleinunternehmer */}
          {!isKleinunternehmer && (
            <div style={{ display: "contents" }}>
              <label htmlFor="vatRate" style={{ display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                MwSt. (%)
              </label>
              <div>
                <input
                  type="number"
                  id="vatRate"
                  value={values.vatRate}
                  onChange={(e) => change('vatRate', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                  max="100"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: fieldErrors.vatRate ? "2px solid #ef4444" : "1px solid rgba(255,255,255,.2)",
                    backgroundColor: "rgba(255,255,255,.05)",
                    color: "var(--foreground)",
                    fontSize: "14px"
                  }}
                />
                {fieldErrors.vatRate && (
                  <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.vatRate}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bemerkungen */}
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "16px", alignItems: "start" }}>
          <label htmlFor="notes" style={{ display: "flex", alignItems: "flex-start", paddingTop: "12px", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
            Bemerkungen
          </label>
          <div>
            <textarea
              id="notes"
              value={values.notes || ''}
              onChange={(e) => change('notes', e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,.2)",
                backgroundColor: "rgba(255,255,255,.05)",
                color: "var(--foreground)",
                fontSize: "14px",
                resize: "vertical"
              }}
              placeholder="Zusätzliche Informationen..."
            />
          </div>
        </div>

        {/* Info Box */}
        <div style={{ 
          background: "rgba(59, 130, 246, 0.1)", 
          border: "1px solid rgba(59, 130, 246, 0.2)", 
          borderRadius: "8px", 
          padding: "16px",
          fontSize: "14px",
          color: "#374151"
        }}>
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>💡 Hinweis</div>
          <div>
            Nach dem Erstellen können Sie über "Positionen" die Arbeitsstunden und Tätigkeiten hinzufügen.
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Abbrechen
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Speichert..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
