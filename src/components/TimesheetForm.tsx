import React, { useEffect, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { ValidationError, handleError } from "../lib/errors";
import { useCustomers } from "../hooks/useCustomers";
import { useActivities } from "../hooks/useActivities";
import { useUnifiedSettings } from "../hooks/useUnifiedSettings";
import type { Timesheet, TimesheetActivity } from "../persistence/adapter";
import { MoneyInput } from './common/MoneyInput';

export interface TimesheetFormValues {
  customerId: number | '';
  title: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  activities: TimesheetActivity[];
  vatRate: number;
  notes?: string;
}

export interface TimesheetFormProps {
  initial?: TimesheetFormValues;
  onSubmit: (values: TimesheetFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function TimesheetForm({ initial, onSubmit, onCancel, submitLabel = "Speichern" }: TimesheetFormProps) {
  const [values, setValues] = useState<TimesheetFormValues>(initial ?? { 
    customerId: '', 
    title: "", 
    status: 'draft',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    activities: [],
    vatRate: 19
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customers } = useCustomers();
  const { activities, getActiveActivities, getActivityById } = useActivities();
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
      activities: [],
      vatRate: 19
    }); 
    setFieldErrors({});
  }, [initial]);

  function change<K extends keyof TimesheetFormValues>(key: K, v: TimesheetFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: v }));
    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: '' }));
    }
  }

  function addPosition() {
    const activeActivities = getActiveActivities();
    if (activeActivities.length === 0) {
      showError("Bitte erstellen Sie zunächst Tätigkeitsarten in den Einstellungen.");
      return;
    }

    // Limit to 30 positions for daily timesheet completion
    if (values.activities.length >= 30) {
      showError("Maximal 30 Positionen können pro Leistungsnachweis hinzugefügt werden.");
      return;
    }

    const firstActivity = activeActivities[0];
    const newActivity: TimesheetActivity = {
      id: Date.now(), // Temporary ID for client-side tracking
      timesheetId: 0, // Will be set when saving
      activityId: firstActivity.id,
      hours: 0,
      hourlyRate: firstActivity.defaultHourlyRate,
      total: 0,
      description: '',
      position: '' // Neue Eigenschaft für Position-Beschreibung
    };

    setValues(prev => ({
      ...prev,
      activities: [...prev.activities, newActivity]
    }));
  }

  function updatePosition(index: number, field: keyof TimesheetActivity, value: any) {
    setValues(prev => {
      const newActivities = [...prev.activities];
      const activity = { ...newActivities[index] };
      
      if (field === 'activityId') {
        activity.activityId = value;
        // Update hourly rate to default when activity changes
        const activityData = getActivityById(value);
        if (activityData) {
          activity.hourlyRate = activityData.defaultHourlyRate;
        }
      } else {
        (activity as any)[field] = value;
      }

      // Recalculate total
      activity.total = activity.hours * activity.hourlyRate;
      
      newActivities[index] = activity;
      return { ...prev, activities: newActivities };
    });
  }

  function removePosition(index: number) {
    setValues(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('TimesheetForm handleSubmit: Starting submission with values:', values);
      await onSubmit(values);
      console.log('TimesheetForm handleSubmit: Submission successful');
      showSuccess(initial ? "Leistungsnachweis erfolgreich aktualisiert!" : "Leistungsnachweis erfolgreich erstellt!");
    } catch (err) {
      console.error('TimesheetForm handleSubmit: Error occurred:', err);
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

  // Calculate preview values - consider Kleinunternehmer status
  const subtotal = values.activities.reduce((sum, activity) => sum + activity.total, 0);
  const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;
  const effectiveVatRate = isKleinunternehmer ? 0 : values.vatRate;
  const vatAmount = subtotal * (effectiveVatRate / 100);
  const total = subtotal + vatAmount;
  const totalHours = values.activities.reduce((sum, activity) => sum + activity.hours, 0);

  return (
    <div style={{ maxWidth: "100%", padding: "0" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Grunddaten */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", alignItems: "start" }}>
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
                onChange={(e) => change('status', e.target.value as TimesheetFormValues['status'])}
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

        {/* Positionen */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", alignItems: "start" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
            Positionen *
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                {values.activities.length} von max. 30 Position(en) hinzugefügt
              </span>
              <button
                type="button"
                onClick={addPosition}
                className="btn btn-success button-small"
                disabled={values.activities.length >= 30}
                style={{ 
                  opacity: values.activities.length >= 30 ? 0.5 : 1,
                  cursor: values.activities.length >= 30 ? 'not-allowed' : 'pointer'
                }}
              >
                + Position hinzufügen
              </button>
            </div>
            
            {fieldErrors.activities && (
              <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "8px" }}>{fieldErrors.activities}</p>
            )}

            {values.activities.length === 0 ? (
              <div style={{ 
                background: "rgba(107, 114, 128, 0.1)", 
                border: "1px solid rgba(107, 114, 128, 0.3)", 
                borderRadius: "8px", 
                padding: "24px", 
                textAlign: "center", 
                color: "#6b7280" 
              }}>
                Keine Positionen hinzugefügt. Klicken Sie auf "Position hinzufügen".
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {values.activities.map((activity, index) => {
                  const activityData = getActivityById(activity.activityId);
                  return (
                    <div key={activity.id || index} style={{ 
                      background: "rgba(255,255,255,0.05)", 
                      border: "1px solid rgba(255,255,255,.2)", 
                      borderRadius: "8px", 
                      padding: "16px" 
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", alignItems: "end" }}>
                        {/* Tätigkeitsart */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#374151" }}>
                            Tätigkeitsart
                          </label>
                          <select
                            value={activity.activityId}
                            onChange={(e) => updatePosition(index, 'activityId', Number(e.target.value))}
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid rgba(255,255,255,.2)",
                              backgroundColor: "rgba(255,255,255,.05)",
                              color: "var(--foreground)",
                              fontSize: "13px"
                            }}
                          >
                            {getActiveActivities().map(act => (
                              <option key={act.id} value={act.id}>
                                {act.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Position */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#374151" }}>
                            Position
                          </label>
                          <input
                            type="text"
                            value={activity.position || ''}
                            onChange={(e) => updatePosition(index, 'position', e.target.value)}
                            placeholder="z.B. Homepage erstellt, Meeting"
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid rgba(255,255,255,.2)",
                              backgroundColor: "rgba(255,255,255,.05)",
                              color: "var(--foreground)",
                              fontSize: "13px"
                            }}
                          />
                        </div>

                        {/* Stunden */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#374151" }}>
                            Stunden
                          </label>
                          <input
                            type="number"
                            value={activity.hours}
                            onChange={(e) => updatePosition(index, 'hours', parseFloat(e.target.value) || 0)}
                            step="0.25"
                            min="0"
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid rgba(255,255,255,.2)",
                              backgroundColor: "rgba(255,255,255,.05)",
                              color: "var(--foreground)",
                              fontSize: "13px"
                            }}
                          />
                        </div>

                        {/* Stundensatz */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#374151" }}>
                            Stundensatz (€)
                          </label>
                          <MoneyInput
                            value={activity.hourlyRate}
                            onChangeNumber={(value) => updatePosition(index, 'hourlyRate', value)}
                            placeholder="85,00"
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid rgba(255,255,255,.2)",
                              backgroundColor: "rgba(255,255,255,.05)",
                              color: "var(--foreground)",
                              fontSize: "13px"
                            }}
                          />
                        </div>

                        {/* Summe */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#374151" }}>
                            Summe
                          </label>
                          <div style={{ 
                            padding: "8px",
                            borderRadius: "4px",
                            background: "rgba(34, 197, 94, 0.1)",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                            color: "#374151",
                            fontSize: "13px",
                            fontWeight: "600"
                          }}>
                            {activity.total.toFixed(2)} €
                          </div>
                        </div>

                        {/* Löschen Button */}
                        <div>
                          <button
                            type="button"
                            onClick={() => removePosition(index)}
                            className="btn btn-danger button-small"
                            style={{ width: "100%" }}
                          >
                            Entfernen
                          </button>
                        </div>
                      </div>

                      {/* Beschreibung */}
                      <div style={{ marginTop: "12px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#374151" }}>
                          Beschreibung (optional)
                        </label>
                        <textarea
                          value={activity.description || ''}
                          onChange={(e) => updatePosition(index, 'description', e.target.value)}
                          rows={2}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid rgba(255,255,255,.2)",
                            backgroundColor: "rgba(255,255,255,.05)",
                            color: "var(--foreground)",
                            fontSize: "13px",
                            resize: "vertical"
                          }}
                          placeholder="Detailbeschreibung der Position..."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kostenschätzung */}
        {subtotal > 0 && (
          <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "8px", padding: "16px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#374151", fontWeight: "600" }}>Kostenübersicht</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "#374151" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Gesamtstunden:</span>
                <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{totalHours.toFixed(2)}h</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Nettobetrag:</span>
                <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{subtotal.toFixed(2)} €</span>
              </div>
              {!isKleinunternehmer && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>MwSt. ({values.vatRate}%):</span>
                  <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{vatAmount.toFixed(2)} €</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(59, 130, 246, 0.2)", paddingTop: "8px", fontWeight: "700" }}>
                <span>Gesamtbetrag:</span>
                <span style={{ fontFamily: "monospace" }}>{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        )}

        {/* Bemerkungen */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", alignItems: "start" }}>
          <label htmlFor="notes" style={{ display: "flex", alignItems: "flex-start", paddingTop: "12px", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
            Bemerkungen
          </label>
          <div>
            <textarea
              id="notes"
              value={values.notes || ''}
              onChange={(e) => change('notes', e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,.2)",
                backgroundColor: "rgba(255,255,255,.05)",
                color: "var(--foreground)",
                fontSize: "14px",
                resize: "vertical",
                minHeight: "100px"
              }}
              placeholder="Zusätzliche Informationen..."
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,.1)", justifyContent: "flex-start", marginLeft: "220px" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Speichert..." : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
