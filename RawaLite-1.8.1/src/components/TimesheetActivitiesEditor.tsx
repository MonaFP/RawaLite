import React, { useState, useEffect } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { useActivities } from "../hooks/useActivities";
import { useUnifiedSettings } from "../hooks/useUnifiedSettings";
import type { Timesheet, TimesheetActivity } from "../persistence/adapter";

export interface TimesheetActivitiesEditorProps {
  timesheet: Timesheet;
  onUpdate: (activities: TimesheetActivity[]) => Promise<void>;
  onCancel: () => void;
}

export default function TimesheetActivitiesEditor({ timesheet, onUpdate, onCancel }: TimesheetActivitiesEditorProps) {
  const [activities, setActivities] = useState<TimesheetActivity[]>(timesheet.activities);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activities: activityTypes, getActiveActivities, getActivityById } = useActivities();
  const { showError, showSuccess } = useNotifications();
  const { settings } = useUnifiedSettings();

  useEffect(() => {
    setActivities(timesheet.activities);
  }, [timesheet]);

  function addActivity() {
    const activeActivityTypes = getActiveActivities();
    if (activeActivityTypes.length === 0) {
      showError("Bitte erstellen Sie zunächst Tätigkeitsarten in den Einstellungen.");
      return;
    }

    if (activities.length >= 30) {
      showError("Maximal 30 Positionen können pro Leistungsnachweis hinzugefügt werden.");
      return;
    }

    const firstActivity = activeActivityTypes[0];
    const newActivity: TimesheetActivity = {
      id: Date.now(),
      timesheetId: timesheet.id,
      activityId: firstActivity.id,
      hours: 0,
      hourlyRate: firstActivity.defaultHourlyRate,
      total: 0,
      description: '',
      position: ''
    };

    setActivities(prev => [...prev, newActivity]);
  }

  function updateActivity(index: number, field: keyof TimesheetActivity, value: any) {
    setActivities(prev => {
      const newActivities = [...prev];
      const activity = { ...newActivities[index] };
      
      if (field === 'activityId') {
        activity.activityId = value;
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
      return newActivities;
    });
  }

  function removeActivity(index: number) {
    setActivities(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setIsSubmitting(true);
    try {
      await onUpdate(activities);
      showSuccess("Positionen erfolgreich aktualisiert!");
    } catch (error) {
      showError("Fehler beim Speichern der Positionen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate totals
  const subtotal = activities.reduce((sum, activity) => sum + activity.total, 0);
  const totalHours = activities.reduce((sum, activity) => sum + activity.hours, 0);
  const personDays = totalHours / 8;
  const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;
  const effectiveVatRate = isKleinunternehmer ? 0 : timesheet.vatRate;
  const vatAmount = subtotal * (effectiveVatRate / 100);
  const total = subtotal + vatAmount;

  return (
    <div>
      {/* Header mit Add Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            {activities.length} von max. 30 Position(en)
          </span>
        </div>
        <button
          type="button"
          onClick={addActivity}
          className="btn btn-success"
          disabled={activities.length >= 30}
          style={{ 
            opacity: activities.length >= 30 ? 0.5 : 1,
            cursor: activities.length >= 30 ? 'not-allowed' : 'pointer'
          }}
        >
          + Position hinzufügen
        </button>
      </div>

      {/* Activities Table */}
      {activities.length === 0 ? (
        <div style={{ 
          background: "rgba(107, 114, 128, 0.1)", 
          border: "1px solid rgba(107, 114, 128, 0.3)", 
          borderRadius: "8px", 
          padding: "40px", 
          textAlign: "center", 
          color: "#6b7280" 
        }}>
          <div style={{ fontSize: "16px", marginBottom: "8px" }}>Keine Positionen vorhanden</div>
          <div style={{ fontSize: "14px" }}>Klicken Sie auf "Position hinzufügen" um zu beginnen</div>
        </div>
      ) : (
        <div style={{ 
          border: "1px solid rgba(255,255,255,.2)", 
          borderRadius: "8px", 
          overflow: "hidden" 
        }}>
          {/* Table Header */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "150px 150px 80px 100px 80px 100px 60px", 
            gap: "12px", 
            padding: "12px", 
            background: "rgba(255,255,255,.05)", 
            borderBottom: "1px solid rgba(255,255,255,.1)",
            fontSize: "12px",
            fontWeight: "600",
            color: "#6b7280"
          }}>
            <div>Tätigkeitsart</div>
            <div>Position</div>
            <div>Stunden</div>
            <div>Stundensatz</div>
            <div>Summe</div>
            <div>Beschreibung</div>
            <div></div>
          </div>

          {/* Table Rows */}
          {activities.map((activity, index) => {
            const activityData = getActivityById(activity.activityId);
            return (
              <div 
                key={activity.id || index} 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "150px 150px 80px 100px 80px 100px 60px", 
                  gap: "12px", 
                  padding: "12px", 
                  borderBottom: index < activities.length - 1 ? "1px solid rgba(255,255,255,.1)" : "none",
                  background: index % 2 === 0 ? "rgba(255,255,255,.02)" : "transparent"
                }}
              >
                {/* Tätigkeitsart */}
                <select
                  value={activity.activityId}
                  onChange={(e) => updateActivity(index, 'activityId', Number(e.target.value))}
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,.2)",
                    backgroundColor: "rgba(255,255,255,.05)",
                    color: "var(--foreground)",
                    fontSize: "12px"
                  }}
                >
                  {getActiveActivities().map(act => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))}
                </select>

                {/* Position */}
                <input
                  type="text"
                  value={activity.position || ''}
                  onChange={(e) => updateActivity(index, 'position', e.target.value)}
                  placeholder="z.B. Homepage, Meeting"
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,.2)",
                    backgroundColor: "rgba(255,255,255,.05)",
                    color: "var(--foreground)",
                    fontSize: "12px"
                  }}
                />

                {/* Stunden */}
                <input
                  type="number"
                  value={activity.hours}
                  onChange={(e) => updateActivity(index, 'hours', parseFloat(e.target.value) || 0)}
                  step="0.25"
                  min="0"
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,.2)",
                    backgroundColor: "rgba(255,255,255,.05)",
                    color: "var(--foreground)",
                    fontSize: "12px",
                    textAlign: "right"
                  }}
                />

                {/* Stundensatz */}
                <input
                  type="number"
                  value={activity.hourlyRate}
                  onChange={(e) => updateActivity(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,.2)",
                    backgroundColor: "rgba(255,255,255,.05)",
                    color: "var(--foreground)",
                    fontSize: "12px",
                    textAlign: "right"
                  }}
                />

                {/* Summe */}
                <div style={{ 
                  padding: "6px",
                  borderRadius: "4px",
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#374151",
                  fontSize: "12px",
                  fontWeight: "600",
                  textAlign: "right",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end"
                }}>
                  {activity.total.toFixed(2)} €
                </div>

                {/* Beschreibung */}
                <input
                  type="text"
                  value={activity.description || ''}
                  onChange={(e) => updateActivity(index, 'description', e.target.value)}
                  placeholder="Details..."
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,.2)",
                    backgroundColor: "rgba(255,255,255,.05)",
                    color: "var(--foreground)",
                    fontSize: "12px"
                  }}
                />

                {/* Löschen Button */}
                <button
                  type="button"
                  onClick={() => removeActivity(index)}
                  className="btn btn-danger"
                  style={{ 
                    padding: "4px", 
                    fontSize: "10px",
                    minWidth: "auto",
                    width: "100%"
                  }}
                  title="Position löschen"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Kostenschätzung */}
      {subtotal > 0 && (
        <div style={{ 
          background: "rgba(59, 130, 246, 0.1)", 
          border: "1px solid rgba(59, 130, 246, 0.2)", 
          borderRadius: "8px", 
          padding: "20px", 
          marginTop: "24px" 
        }}>
          <h4 style={{ margin: "0 0 16px 0", color: "#374151", fontWeight: "600" }}>Kostenübersicht</h4>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr 1fr 1fr", 
            gap: "20px", 
            fontSize: "14px", 
            color: "#374151" 
          }}>
            <div>
              <div style={{ opacity: 0.7, fontSize: "12px", marginBottom: "4px" }}>Gesamtstunden</div>
              <div style={{ fontFamily: "monospace", fontWeight: "600", fontSize: "16px" }}>
                {totalHours.toFixed(1)}h
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: "12px", marginBottom: "4px" }}>Personentage (PT)</div>
              <div style={{ fontFamily: "monospace", fontWeight: "600", fontSize: "16px" }}>
                {personDays.toFixed(1)} PT
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: "12px", marginBottom: "4px" }}>Nettobetrag</div>
              <div style={{ fontFamily: "monospace", fontWeight: "600", fontSize: "16px" }}>
                {subtotal.toFixed(2)} €
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: "12px", marginBottom: "4px" }}>
                Gesamtbetrag {!isKleinunternehmer && `(+ ${effectiveVatRate}% MwSt.)`}
              </div>
              <div style={{ 
                fontFamily: "monospace", 
                fontWeight: "700", 
                fontSize: "18px",
                color: "#059669"
              }}>
                {total.toFixed(2)} €
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", paddingTop: "24px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? "Speichert..." : "Positionen speichern"}
        </button>
      </div>
    </div>
  );
}
