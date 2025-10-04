import React, { useState, useMemo } from 'react';
import { Table } from '../components/Table';
import { TimesheetForm } from '../components/TimesheetForm';
import { useTimesheets } from '../hooks/useTimesheets';
import { useActivities } from '../hooks/useActivities';
import { useCustomers } from '../hooks/useCustomers';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PDFService } from '../services/PDFService';
import type { Timesheet } from '../persistence/adapter';

interface TimesheetsPageProps {
  title?: string;
}

export default function TimesheetsPage({ title = "Leistungsnachweise" }: TimesheetsPageProps) {
  const { timesheets, loading, error, createTimesheet, updateTimesheet, deleteTimesheet, duplicateTimesheet } = useTimesheets();
  const { customers } = useCustomers();
  const { activities } = useActivities();
  const { settings } = useUnifiedSettings();
  const { currentTheme } = useTheme(); // Add current theme access
  const { showSuccess, showError } = useNotifications();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [current, setCurrent] = useState<Timesheet | null>(null);

  const columns = useMemo(() => ([
    { key: "timesheetNumber", header: "Nummer" },
    { 
      key: "customerId", 
      header: "Kunde", 
      render: (row: Timesheet) => {
        const customer = customers.find(c => c.id === row.customerId);
        return customer?.name || `Kunde #${row.customerId}`;
      }
    },
    { key: "title", header: "Titel" },
    { 
      key: "status", 
      header: "Status", 
      render: (row: Timesheet) => {
        const statusColors = {
          draft: '#6b7280',
          sent: '#3b82f6', 
          accepted: '#10b981',
          rejected: '#ef4444'
        };
        const statusTexts = {
          draft: 'Entwurf',
          sent: 'Versendet',
          accepted: 'Akzeptiert',
          rejected: 'Abgelehnt'
        };
        const color = statusColors[row.status as keyof typeof statusColors] || '#6b7280';
        const text = statusTexts[row.status as keyof typeof statusTexts] || row.status;
        return (
          <span style={{
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: color + "20",
            color: color
          }}>
            {text}
          </span>
        );
      }
    },
    { 
      key: "total", 
      header: "Gesamtbetrag", 
      render: (row: Timesheet) => `€${row.total.toFixed(2)}`
    },
    { 
      key: "startDate", 
      header: "Zeitraum", 
      render: (row: Timesheet) => {
        const start = new Date(row.startDate).toLocaleDateString('de-DE');
        const end = new Date(row.endDate).toLocaleDateString('de-DE');
        return `${start} - ${end}`;
      }
    },
    { 
      key: "activities", 
      header: "Stunden", 
      render: (row: Timesheet) => {
        const totalHours = row.activities
          .filter(a => !a.isBreak)
          .reduce((sum, activity) => sum + activity.hours, 0);
        return `${totalHours.toFixed(1)}h`;
      }
    },
    { 
      key: "id", 
      header: "Aktionen", 
      render: (row: Timesheet) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          <button
            className="btn btn-info"
            onClick={() => handlePreviewPDF(row)}
            style={{
              padding: "4px 8px",
              fontSize: "12px"
            }}
            title="PDF Vorschau anzeigen"
          >
            👁️ Vorschau
          </button>
          <button
            className="btn btn-warning"
            onClick={() => handleExportPDF(row)}
            style={{
              padding: "4px 8px",
              fontSize: "12px"
            }}
            title="PDF herunterladen"
          >
            💾 PDF
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ padding: "4px 8px", fontSize: "12px" }} 
            onClick={() => { setCurrent(row); setMode("edit"); }}
          >
            Bearbeiten
          </button>
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value as Timesheet['status'])}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "4px",
              background: "rgba(17,24,39,.8)",
              color: "var(--muted)",
              cursor: "pointer"
            }}
          >
            <option value="draft">Entwurf</option>
            <option value="sent">Versendet</option>
            <option value="accepted">Akzeptiert</option>
            <option value="rejected">Abgelehnt</option>
          </select>
          <button 
            className="btn btn-success" 
            style={{ padding: "4px 8px", fontSize: "12px" }} 
            onClick={() => handleDuplicate(row)}
            title="Kopie erstellen"
          >
            📋 Kopie
          </button>
          <button 
            className="btn btn-danger" 
            style={{ padding: "4px 8px", fontSize: "12px" }} 
            onClick={() => { if (confirm("Diesen Leistungsnachweis wirklich löschen?")) handleRemove(row.id); }}
          >
            Löschen
          </button>
        </div>
      ) 
    }
  ]), [customers]);

  async function handleCreate(timesheetData: Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'>) {
    await createTimesheet(timesheetData);
    setMode("list");
  }

  async function handleEdit(timesheetData: Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!current) return;
    await updateTimesheet(current.id, timesheetData);
    setMode("list");
    setCurrent(null);
  }

  async function handleStatusChange(timesheetId: number, newStatus: Timesheet['status']) {
    try {
      const timesheet = timesheets.find(t => t.id === timesheetId);
      if (!timesheet) return;
      
      // Prepare status date fields
      const now = new Date().toISOString();
      const statusDates: Partial<Timesheet> = {};
      
      switch (newStatus) {
        case 'sent':
          statusDates.sentAt = now;
          break;
        case 'accepted':
          statusDates.acceptedAt = now;
          break;
        case 'rejected':
          statusDates.rejectedAt = now;
          break;
      }
      
      await updateTimesheet(timesheetId, { ...timesheet, status: newStatus, ...statusDates });
      
      // Success notification
      const statusLabels = {
        'draft': 'Entwurf',
        'sent': 'Versendet',
        'accepted': 'Akzeptiert',
        'rejected': 'Abgelehnt'
      };
      showSuccess(`Leistungsnachweis-Status auf "${statusLabels[newStatus]}" geändert`);
    } catch (error) {
      showError('Fehler beim Ändern des Status');
    }
  }

  async function handleRemove(id: number) {
    await deleteTimesheet(id);
  }

  async function handleDuplicate(timesheet: Timesheet) {
    try {
      await duplicateTimesheet(timesheet.id);
      showSuccess('Leistungsnachweis erfolgreich kopiert');
    } catch (error) {
      showError('Fehler beim Kopieren des Leistungsnachweises');
    }
  }

  const handleExportPDF = async (timesheet: Timesheet) => {
    const customer = customers.find(c => c.id === timesheet.customerId);
    if (!customer) {
      showError('Kunde nicht gefunden');
      return;
    }

    try {
      const result = await PDFService.exportTimesheetToPDF(timesheet, customer, settings, false, currentTheme); // false = direct download
      if (result.success) {
        showSuccess(`PDF erfolgreich erstellt: ${result.filePath}`);
      } else {
        showError(`PDF Export fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      console.error('PDF Export failed:', error);
      showError('PDF Export fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const handlePreviewPDF = async (timesheet: Timesheet) => {
    const customer = customers.find(c => c.id === timesheet.customerId);
    if (!customer) {
      showError('Kunde nicht gefunden');
      return;
    }

    try {
      const result = await PDFService.exportTimesheetToPDF(timesheet, customer, settings, true, currentTheme); // true = preview only
      if (result.success) {
        showSuccess('PDF Vorschau geöffnet');
      } else {
        showError(`PDF Vorschau fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      console.error('PDF Preview failed:', error);
      showError('PDF Vorschau fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  if (loading) return <div className="card">Lade Leistungsnachweise...</div>;
  if (error) return <div className="card">Fehler: {error}</div>;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0" }}>{title}</h2>
          <div style={{ opacity: 0.7 }}>Verwalte deine Leistungsnachweise und exportiere sie als PDF.</div>
        </div>
        <button className="btn" onClick={() => setMode(mode === "create" ? "list" : "create")}>
          {mode === "create" ? "Abbrechen" : "Neuer Leistungsnachweis"}
        </button>
      </div>
      
      <Table<Timesheet>
        columns={columns as any}
        data={timesheets}
        emptyMessage="Noch keine Leistungsnachweise erstellt."
      />

      {mode === "create" && (
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <TimesheetForm
            customers={customers}
            onSave={async (timesheetData) => {
              try {
                await createTimesheet(timesheetData);
                showSuccess('Leistungsnachweis erfolgreich erstellt');
                setMode("list");
              } catch (error) {
                showError('Fehler beim Erstellen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
              }
            }}
            onCancel={() => setMode("list")}
          />
        </div>
      )}

      {mode === "edit" && current && (
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <TimesheetForm
            timesheet={current}
            customers={customers}
            onSave={async (timesheetData) => {
              try {
                await updateTimesheet(current.id, timesheetData);
                showSuccess('Leistungsnachweis erfolgreich aktualisiert');
                setMode("list");
                setCurrent(null);
              } catch (error) {
                showError('Fehler beim Aktualisieren: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
              }
            }}
            onCancel={() => {
              setMode("list");
              setCurrent(null);
            }}
          />
        </div>
      )}
    </div>
  );
}