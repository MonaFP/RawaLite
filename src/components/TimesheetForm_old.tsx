import React, { useEffect, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { ValidationError, handleError } from "../lib/errors";
import { useCustomers } from "../hooks/useCustomers";
import { useActivities } from "../hooks/useActivities";
import type { Timesheet, TimesheetActivity } from "../persistence/adapter";

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

  function addActivity() {
    const activeActivities = getActiveActivities();
    if (activeActivities.length === 0) {
      showError("Bitte erstellen Sie zunächst Tätigkeiten in den Einstellungen.");
      return;
    }

    const firstActivity = activeActivities[0];
    const newActivity: TimesheetActivity = {
      id: Date.now(), // Temporary ID for new activities
      timesheetId: 0, // Will be set when timesheet is saved
      activityId: firstActivity.id,
      hours: 0,
      hourlyRate: firstActivity.defaultHourlyRate,
      total: 0,
      description: ''
    };

    setValues(prev => ({
      ...prev,
      activities: [...prev.activities, newActivity]
    }));
  }

  function updateActivity(index: number, field: keyof TimesheetActivity, value: any) {
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

  function removeActivity(index: number) {
    setValues(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!values.title || values.title.trim().length < 2) {
      errors.title = "Bitte einen gültigen Titel angeben (min. 2 Zeichen).";
    }
    
    if (!values.customerId) {
      errors.customerId = "Bitte einen Kunden auswählen.";
    }
    
    if (!values.startDate) {
      errors.startDate = "Bitte ein Startdatum angeben.";
    }
    
    if (!values.endDate) {
      errors.endDate = "Bitte ein Enddatum angeben.";
    }
    
    if (values.startDate && values.endDate && new Date(values.endDate) < new Date(values.startDate)) {
      errors.endDate = "Enddatum muss nach dem Startdatum liegen.";
    }
    
    if (values.activities.length === 0) {
      errors.activities = "Bitte mindestens eine Tätigkeit hinzufügen.";
    }
    
    values.activities.forEach((activity, index) => {
      if (activity.hours <= 0) {
        errors[`activity_${index}_hours`] = `Stunden für Tätigkeit ${index + 1} müssen größer als 0 sein.`;
      }
      if (activity.hourlyRate < 0) {
        errors[`activity_${index}_rate`] = `Stundensatz für Tätigkeit ${index + 1} darf nicht negativ sein.`;
      }
    });
    
    if (values.vatRate < 0 || values.vatRate > 100) {
      errors.vatRate = "Mehrwertsteuersatz muss zwischen 0 und 100% liegen.";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('TimesheetForm handleSubmit called');
    
    if (!validateForm()) {
      showError("Bitte korrigieren Sie die Eingabefehler.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await withLoading(async () => {
        await onSubmit(values);
      }, "Leistungsnachweis wird gespeichert...");
      
      showSuccess(initial ? "Leistungsnachweis erfolgreich aktualisiert!" : "Leistungsnachweis erfolgreich erstellt!");
    } catch (err) {
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

  // Calculate preview values
  const subtotal = values.activities.reduce((sum, activity) => sum + activity.total, 0);
  const vatAmount = subtotal * (values.vatRate / 100);
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

          {/* MwSt. */}
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
        </div>

        {/* Titel */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Titel *
          </label>
          <input
            type="text"
            id="title"
            value={values.title}
            onChange={(e) => change('title', e.target.value)}
            className={`w-full p-2 border rounded ${fieldErrors.title ? 'border-red-500' : 'border-gray-600'} bg-gray-800 text-white`}
            placeholder="z.B. Entwicklungsarbeiten KW 36"
            required
          />
          {fieldErrors.title && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Startdatum */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1">
              Startdatum *
            </label>
            <input
              type="date"
              id="startDate"
              value={values.startDate}
              onChange={(e) => change('startDate', e.target.value)}
              className={`w-full p-2 border rounded ${fieldErrors.startDate ? 'border-red-500' : 'border-gray-600'} bg-gray-800 text-white`}
              required
            />
            {fieldErrors.startDate && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.startDate}</p>
            )}
          </div>

          {/* Enddatum */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">
              Enddatum *
            </label>
            <input
              type="date"
              id="endDate"
              value={values.endDate}
              onChange={(e) => change('endDate', e.target.value)}
              className={`w-full p-2 border rounded ${fieldErrors.endDate ? 'border-red-500' : 'border-gray-600'} bg-gray-800 text-white`}
              required
            />
            {fieldErrors.endDate && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.endDate}</p>
            )}
          </div>
        </div>

        {/* MwSt. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="vatRate" className="block text-sm font-medium mb-1">
              MwSt. (%)
            </label>
            <input
              type="number"
              id="vatRate"
              value={values.vatRate}
              onChange={(e) => change('vatRate', parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0"
              max="100"
              className={`w-full p-2 border rounded ${fieldErrors.vatRate ? 'border-red-500' : 'border-gray-600'} bg-gray-800 text-white`}
            />
            {fieldErrors.vatRate && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.vatRate}</p>
            )}
          </div>
        </div>

        {/* Tätigkeiten */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", alignItems: "start" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
            Tätigkeiten *
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                {values.activities.length} Tätigkeit(en) hinzugefügt
              </span>
              <button
                type="button"
                onClick={addActivity}
                className="btn btn-success button-small"
              >
                + Tätigkeit hinzufügen
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
                Keine Tätigkeiten hinzugefügt. Klicken Sie auf "Tätigkeit hinzufügen".
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {values.activities.map((activity, index) => {
                const activityData = getActivityById(activity.activityId);
                return (
                  <div key={activity.id || index} className="bg-gray-800 border border-gray-600 rounded p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      {/* Tätigkeit */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Tätigkeit
                        </label>
                        <select
                          value={activity.activityId}
                          onChange={(e) => updateActivity(index, 'activityId', Number(e.target.value))}
                          className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm"
                        >
                          {getActiveActivities().map(act => (
                            <option key={act.id} value={act.id}>
                              {act.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Stunden */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Stunden
                        </label>
                        <input
                          type="number"
                          value={activity.hours}
                          onChange={(e) => updateActivity(index, 'hours', parseFloat(e.target.value) || 0)}
                          step="0.25"
                          min="0"
                          className={`w-full p-2 border rounded text-sm ${fieldErrors[`activity_${index}_hours`] ? 'border-red-500' : 'border-gray-600'} bg-gray-700 text-white`}
                          placeholder="0,00"
                        />
                        {fieldErrors[`activity_${index}_hours`] && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors[`activity_${index}_hours`]}</p>
                        )}
                      </div>

                      {/* Stundensatz */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Stundensatz (€)
                        </label>
                        <input
                          type="number"
                          value={activity.hourlyRate}
                          onChange={(e) => updateActivity(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          className={`w-full p-2 border rounded text-sm ${fieldErrors[`activity_${index}_rate`] ? 'border-red-500' : 'border-gray-600'} bg-gray-700 text-white`}
                          placeholder="0,00"
                        />
                        {fieldErrors[`activity_${index}_rate`] && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors[`activity_${index}_rate`]}</p>
                        )}
                      </div>

                      {/* Summe & Entfernen */}
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-mono text-green-400">
                          €{activity.total.toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeActivity(index)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Beschreibung */}
                    <div className="mt-3">
                      <input
                        type="text"
                        value={activity.description || ''}
                        onChange={(e) => updateActivity(index, 'description', e.target.value)}
                        className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm"
                        placeholder="Optionale Beschreibung für diese Tätigkeit..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>

        {/* Kalkulations-Vorschau */}
        {subtotal > 0 && (
          <div className="bg-gray-800 border border-gray-600 rounded p-4">
            <h4 className="text-sm font-medium mb-2 text-gray-300">Kostenvorschau</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Gesamtstunden:</span>
                <span className="font-mono">{totalHours.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between">
                <span>Nettobetrag:</span>
                <span className="font-mono">€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>MwSt. ({values.vatRate}%):</span>
                <span className="font-mono">€{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2 font-medium">
                <span>Gesamtbetrag:</span>
                <span className="font-mono">€{total.toFixed(2)}</span>
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
