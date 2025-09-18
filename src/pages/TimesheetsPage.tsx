import React, { useState, useMemo } from "react";
import { Table } from "../components/Table";
import { useTimesheets } from "../hooks/useTimesheets";
import { useCustomers } from "../hooks/useCustomers";
import { useActivities } from "../hooks/useActivities";
import { useSettings } from "../contexts/SettingsContext";
import BasicTimesheetForm, { type BasicTimesheetFormValues } from "../components/BasicTimesheetForm";
import TimesheetActivitiesEditor from "../components/TimesheetActivitiesEditor";
import type { Timesheet, TimesheetActivity } from "../persistence/adapter";

export default function TimesheetsPage() {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'editActivities'>('list');
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [inlineEdit, setInlineEdit] = useState<{id: number, field: string} | null>(null);
  const { timesheets, createTimesheet, updateTimesheet, deleteTimesheet } = useTimesheets();
  const { customers } = useCustomers();
  const { activities } = useActivities();
  const { settings } = useSettings();

  // Create columns for Table component
  const columns = useMemo(() => [
    { 
      key: "title", 
      header: "Titel",
      render: (row: Timesheet) => (
        <div>
          {inlineEdit?.id === row.id && inlineEdit?.field === 'title' ? (
            <input
              type="text"
              defaultValue={row.title}
              autoFocus
              onBlur={(e) => handleInlineUpdate(row.id, 'title', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleInlineUpdate(row.id, 'title', e.currentTarget.value)}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '4px',
                padding: '4px 8px',
                color: 'var(--foreground)',
                width: '200px'
              }}
            />
          ) : (
            <div
              style={{ cursor: 'pointer', fontWeight: "500" }}
              onClick={() => setInlineEdit({id: row.id, field: 'title'})}
            >
              {row.title}
            </div>
          )}
          {row.notes && (
            <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "2px" }}>
              {row.notes.length > 50 ? `${row.notes.substring(0, 50)}...` : row.notes}
            </div>
          )}
        </div>
      )
    },
    { 
      key: "customerId", 
      header: "Kunde", 
      render: (row: Timesheet) => {
        const customer = customers.find(c => c.id === row.customerId);
        
        if (inlineEdit?.id === row.id && inlineEdit?.field === 'customerId') {
          return (
            <select
              defaultValue={row.customerId}
              autoFocus
              onBlur={(e) => handleInlineUpdate(row.id, 'customerId', Number(e.target.value))}
              onChange={(e) => handleInlineUpdate(row.id, 'customerId', Number(e.target.value))}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '4px',
                padding: '4px 8px',
                color: 'var(--foreground)'
              }}
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          );
        }
        
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => setInlineEdit({id: row.id, field: 'customerId'})}
          >
            {customer?.name || `Kunde #${row.customerId}`}
          </div>
        );
      }
    },
    { 
      key: "period", 
      header: "Zeitraum",
      render: (row: Timesheet) => (
        <div style={{ fontSize: "12px" }}>
          {inlineEdit?.id === row.id && inlineEdit?.field === 'dates' ? (
            <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
              <input
                type="date"
                defaultValue={row.startDate}
                onBlur={(e) => handleDateUpdate(row.id, 'startDate', e.target.value)}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '4px',
                  padding: '2px 4px',
                  color: 'var(--foreground)',
                  fontSize: '11px'
                }}
              />
              <input
                type="date"
                defaultValue={row.endDate}
                onBlur={(e) => handleDateUpdate(row.id, 'endDate', e.target.value)}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '4px',
                  padding: '2px 4px',
                  color: 'var(--foreground)',
                  fontSize: '11px'
                }}
              />
            </div>
          ) : (
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => setInlineEdit({id: row.id, field: 'dates'})}
            >
              {formatDate(row.startDate)} - {formatDate(row.endDate)}
            </div>
          )}
        </div>
      )
    },
    { 
      key: "hours", 
      header: "Stunden / PT",
      render: (row: Timesheet) => {
        const { totalHours } = calculateTimesheetTotal(row);
        const personDays = totalHours / 8; // 8 Stunden = 1 Personentag
        return (
          <div style={{ fontFamily: "monospace", fontSize: "13px" }}>
            <div>{totalHours.toFixed(1)}h</div>
            <div style={{ opacity: 0.7, fontSize: "11px" }}>
              {personDays.toFixed(1)} PT
            </div>
          </div>
        );
      }
    },
    { 
      key: "amount", 
      header: "Betrag",
      render: (row: Timesheet) => {
        const { total } = calculateTimesheetTotal(row);
        return <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{formatCurrency(total)}</span>;
      }
    },
    { 
      key: "status", 
      header: "Status", 
      render: (row: Timesheet) => {
        if (inlineEdit?.id === row.id && inlineEdit?.field === 'status') {
          return (
            <select
              defaultValue={row.status}
              autoFocus
              onBlur={(e) => handleInlineUpdate(row.id, 'status', e.target.value)}
              onChange={(e) => handleInlineUpdate(row.id, 'status', e.target.value)}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '4px',
                padding: '2px 4px',
                color: 'var(--foreground)',
                fontSize: '12px'
              }}
            >
              <option value="draft">Entwurf</option>
              <option value="sent">Versendet</option>
              <option value="approved">Genehmigt</option>
              <option value="rejected">Abgelehnt</option>
            </select>
          );
        }
        
        return (
          <span 
            style={{ 
              color: getStatusColor(row.status), 
              fontSize: "12px", 
              cursor: 'pointer' 
            }}
            onClick={() => setInlineEdit({id: row.id, field: 'status'})}
          >
            {getStatusDisplayName(row.status)}
          </span>
        );
      }
    },
    { 
      key: "id", 
      header: "Aktionen", 
      render: (row: Timesheet) => (
        <div style={{display:"flex", gap: 8}}>
          <button 
            className="btn btn-primary" 
            style={{ padding: "4px 8px", fontSize: "12px" }} 
            onClick={() => startEditActivities(row)}
          >
            Positionen
          </button>
          <button 
            className="btn btn-danger" 
            style={{ padding: "4px 8px", fontSize: "12px" }} 
            onClick={() => handleDeleteTimesheet(row.id)}
          >
            Löschen
          </button>
        </div>
      )
    }
  ], [customers, timesheets, inlineEdit]);

  function getStatusDisplayName(status: string): string {
    const statusMap = {
      'draft': 'Entwurf',
      'sent': 'Versendet', 
      'approved': 'Genehmigt',
      'rejected': 'Abgelehnt'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  function getStatusColor(status: string): string {
    const colorMap = {
      'draft': '#f59e0b',
      'sent': '#3b82f6',
      'approved': '#10b981',
      'rejected': '#ef4444'
    };
    return colorMap[status as keyof typeof colorMap] || '#6b7280';
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE');
  }

  function calculateTimesheetTotal(timesheet: Timesheet): { subtotal: number; vatAmount: number; total: number; totalHours: number } {
    const totalHours = timesheet.activities.reduce((sum, activity) => sum + activity.hours, 0);
    const subtotal = timesheet.activities.reduce((sum, activity) => sum + activity.total, 0);
    // ✅ RECHTLICH KORREKT: Kleinunternehmer dürfen keine MwSt ausweisen (§ 19 UStG)
    const isKleinunternehmer = settings?.companyData?.kleinunternehmer || false;
    const vatAmount = isKleinunternehmer ? 0 : subtotal * (timesheet.vatRate / 100);
    const total = subtotal + vatAmount;
    
    return { subtotal, vatAmount, total, totalHours };
  }



  async function handleUpdateActivities(timesheetId: number, activities: TimesheetActivity[]) {
    const timesheet = timesheets.find(t => t.id === timesheetId);
    if (!timesheet) return;

    // Recalculate totals
    const subtotal = activities.reduce((sum, activity) => sum + activity.total, 0);
    const vatAmount = subtotal * (timesheet.vatRate / 100);
    const total = subtotal + vatAmount;

    await updateTimesheet(timesheetId, {
      activities,
      subtotal,
      vatAmount,
      total
    });
    
    setCurrentView('list');
    setEditingTimesheet(null);
  }

  async function handleCreateTimesheet(values: BasicTimesheetFormValues) {
    console.log('handleCreateTimesheet called with:', values);
    // Create basic timesheet without activities
    const timesheetData = {
      timesheetNumber: '', // Will be generated by the service
      customerId: values.customerId as number,
      title: values.title,
      status: values.status,
      startDate: values.startDate,
      endDate: values.endDate,
      activities: [], // Empty activities initially
      vatRate: values.vatRate,
      subtotal: 0,
      vatAmount: 0,
      total: 0,
      notes: values.notes
    };
    await createTimesheet(timesheetData);
    setCurrentView('list');
  }

  async function handleDeleteTimesheet(id: number) {
    if (confirm('Leistungsnachweis wirklich löschen?')) {
      await deleteTimesheet(id);
    }
  }

  async function handleInlineUpdate(id: number, field: string, value: any) {
    setInlineEdit(null);
    try {
      await updateTimesheet(id, { [field]: value });
    } catch (error) {
      console.error('Inline update error:', error);
    }
  }

  async function handleDateUpdate(id: number, field: 'startDate' | 'endDate', value: string) {
    setInlineEdit(null);
    try {
      await updateTimesheet(id, { [field]: value });
    } catch (error) {
      console.error('Date update error:', error);
    }
  }

  function startEditActivities(timesheet: Timesheet) {
    setEditingTimesheet(timesheet);
    setCurrentView('editActivities');
  }

  function cancelEdit() {
    setCurrentView('list');
    setEditingTimesheet(null);
    setInlineEdit(null);
  }

  // Keine separaten Returns - alles in einem Return rendern
  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0" }}>Leistungsnachweise</h2>
          <div style={{ opacity: 0.7 }}>Verwalten Sie Ihre Arbeitszeiterfassung und Stundenabrechnung.</div>
        </div>
        <button 
          className="btn"
          onClick={() => setCurrentView(currentView === 'create' ? 'list' : 'create')}
        >
          {currentView === 'create' ? 'Abbrechen' : '+ Neuer Leistungsnachweis'}
        </button>
      </div>

      {/* Stats Cards - only show if timesheets exist */}
      {timesheets.length > 0 && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "16px", 
          marginBottom: "24px" 
        }}>
          {(() => {
            const stats = timesheets.reduce(
              (acc, timesheet) => {
                const { total, totalHours } = calculateTimesheetTotal(timesheet);
                acc.totalCount++;
                acc.totalValue += total;
                acc.totalHours += totalHours;
                acc.totalPersonDays += totalHours / 8; // 8 Stunden = 1 Personentag
                if (timesheet.status === 'approved') acc.approvedCount++;
                return acc;
              },
              { totalCount: 0, totalValue: 0, totalHours: 0, totalPersonDays: 0, approvedCount: 0 }
            );

            return (
              <>
                <div style={{ 
                  background: "rgba(59, 130, 246, 0.1)", 
                  border: "1px solid rgba(59, 130, 246, 0.2)", 
                  borderRadius: "8px", 
                  padding: "16px" 
                }}>
                  <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>Gesamt</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>{stats.totalCount}</div>
                </div>
                <div style={{ 
                  background: "rgba(16, 185, 129, 0.1)", 
                  border: "1px solid rgba(16, 185, 129, 0.2)", 
                  borderRadius: "8px", 
                  padding: "16px" 
                }}>
                  <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>Gesamtumsatz</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>{formatCurrency(stats.totalValue)}</div>
                </div>
                <div style={{ 
                  background: "rgba(245, 158, 11, 0.1)", 
                  border: "1px solid rgba(245, 158, 11, 0.2)", 
                  borderRadius: "8px", 
                  padding: "16px" 
                }}>
                  <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>Gesamtstunden</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>{stats.totalHours.toFixed(1)}h</div>
                </div>
                <div style={{ 
                  background: "rgba(139, 92, 246, 0.1)", 
                  border: "1px solid rgba(139, 92, 246, 0.2)", 
                  borderRadius: "8px", 
                  padding: "16px" 
                }}>
                  <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>Personentage (PT)</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#8b5cf6" }}>{stats.totalPersonDays.toFixed(1)}</div>
                </div>
                <div style={{ 
                  background: "rgba(34, 197, 94, 0.1)", 
                  border: "1px solid rgba(34, 197, 94, 0.2)", 
                  borderRadius: "8px", 
                  padding: "16px" 
                }}>
                  <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>Genehmigt</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#22c55e" }}>{stats.approvedCount}</div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <Table<Timesheet>
        columns={columns as any}
        data={timesheets}
        emptyMessage="Noch keine Leistungsnachweise erstellt."
        expandableRows={(timesheet: Timesheet) => (
          <div style={{ 
            padding: "16px",
            background: "rgba(255,255,255,0.02)",
            borderTop: "1px solid rgba(255,255,255,.1)"
          }}>
            {timesheet.activities && timesheet.activities.length > 0 ? (
              <div>
                <h4 style={{ 
                  margin: "0 0 12px 0", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#374151" 
                }}>
                  Positionen ({timesheet.activities.length})
                </h4>
                
                {/* Positions Table Header */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "180px 140px 80px 90px 90px 1fr", 
                  gap: "8px", 
                  padding: "8px 12px", 
                  borderBottom: "1px solid rgba(255,255,255,.1)",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "4px"
                }}>
                  <div>Tätigkeitsart</div>
                  <div>Position</div>
                  <div style={{ textAlign: "right" }}>Stunden</div>
                  <div style={{ textAlign: "right" }}>Stundensatz</div>
                  <div style={{ textAlign: "right" }}>Summe</div>
                  <div>Beschreibung</div>
                </div>

                {/* Positions Rows */}
                {timesheet.activities.map((activity, index) => {
                  const activityType = activities.find(a => a.id === activity.activityId);
                  return (
                    <div 
                      key={activity.id || index} 
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: "180px 140px 80px 90px 90px 1fr", 
                        gap: "8px", 
                        padding: "8px 12px", 
                        borderBottom: index < timesheet.activities.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                        fontSize: "13px",
                        color: "#374151"
                      }}
                    >
                      <div style={{ 
                        fontWeight: "500",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {activityType?.name || `Tätigkeit #${activity.activityId}`}
                      </div>
                      <div style={{ 
                        color: activity.position ? "#374151" : "#9ca3af",
                        fontStyle: activity.position ? "normal" : "italic",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {activity.position || "Keine Position"}
                      </div>
                      <div style={{ 
                        fontFamily: "monospace", 
                        textAlign: "right",
                        fontWeight: "600"
                      }}>
                        {activity.hours.toFixed(2)} h
                      </div>
                      <div style={{ 
                        fontFamily: "monospace", 
                        textAlign: "right" 
                      }}>
                        {activity.hourlyRate.toFixed(2)} €
                      </div>
                      <div style={{ 
                        fontFamily: "monospace", 
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#059669"
                      }}>
                        {activity.total.toFixed(2)} €
                      </div>
                      <div style={{ 
                        color: activity.description ? "#374151" : "#9ca3af",
                        fontStyle: activity.description ? "normal" : "italic",
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {activity.description || "Keine Beschreibung"}
                      </div>
                    </div>
                  );
                })}

                {/* Summary Row */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "180px 140px 80px 90px 90px 1fr", 
                  gap: "8px", 
                  padding: "12px 12px 8px 12px", 
                  borderTop: "2px solid rgba(59, 130, 246, 0.3)",
                  marginTop: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151"
                }}>
                  <div></div>
                  <div style={{ color: "#059669" }}>Gesamt:</div>
                  <div style={{ 
                    fontFamily: "monospace", 
                    textAlign: "right",
                    color: "#059669" 
                  }}>
                    {timesheet.activities.reduce((sum, a) => sum + a.hours, 0).toFixed(2)} h
                  </div>
                  <div></div>
                  <div style={{ 
                    fontFamily: "monospace", 
                    textAlign: "right",
                    color: "#059669",
                    fontSize: "16px"
                  }}>
                    {timesheet.activities.reduce((sum, a) => sum + a.total, 0).toFixed(2)} €
                  </div>
                  <div style={{ 
                    fontSize: "12px",
                    color: "#6b7280"
                  }}>
                    {(timesheet.activities.reduce((sum, a) => sum + a.hours, 0) / 8).toFixed(1)} PT
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: "center", 
                padding: "20px",
                color: "#6b7280",
                fontSize: "14px",
                fontStyle: "italic"
              }}>
                <div style={{ marginBottom: "8px" }}>📝 Keine Positionen vorhanden</div>
                <div style={{ fontSize: "12px" }}>
                  Klicken Sie auf "Positionen" um Arbeitsstunden hinzuzufügen
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Create Form - nur für neue Leistungsnachweise */}
      {currentView === 'create' && (
        <div className="card" style={{ marginTop: "24px" }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>
              Neuer Leistungsnachweis
            </h3>
            <div style={{ opacity: 0.7, fontSize: "14px" }}>
              Erstellen Sie einen neuen Leistungsnachweis. Positionen können danach hinzugefügt werden.
            </div>
          </div>
          
          <BasicTimesheetForm
            onSubmit={handleCreateTimesheet}
            onCancel={cancelEdit}
            submitLabel="Erstellen"
          />
        </div>
      )}

      {/* Activities Editor - Tabelle für Positionen */}
      {currentView === 'editActivities' && editingTimesheet && (
        <div className="card" style={{ marginTop: "24px" }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>
              Positionen bearbeiten: {editingTimesheet.title}
            </h3>
            <div style={{ opacity: 0.7, fontSize: "14px" }}>
              Verwalten Sie die Arbeitspositionen für diesen Leistungsnachweis.
            </div>
          </div>
          
          <TimesheetActivitiesEditor
            timesheet={editingTimesheet}
            onUpdate={(activities) => handleUpdateActivities(editingTimesheet.id, activities)}
            onCancel={cancelEdit}
          />
        </div>
      )}
    </div>
  );
}
