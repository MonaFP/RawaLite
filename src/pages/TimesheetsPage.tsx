import React, { useState, useMemo } from 'react';
import { Table } from '../components/Table';
import { TimesheetForm } from '../components/TimesheetForm';
import { TimesheetDayGroupComponent } from '../components/TimesheetDayGroupComponent';
import { StatusControl } from '../components/StatusControl';
import { SearchAndFilterBar, useTableSearch, FilterConfig } from '../components/SearchAndFilter';
import { useTimesheets } from '../hooks/useTimesheets';
import { useActivities } from '../hooks/useActivities';
import { useCustomers } from '../hooks/useCustomers';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PDFService } from '../services/PDFService';
import { 
  groupActivitiesByDate, 
  toggleDayGroupExpansion,
  updateActivityInDayGroups,
  removeActivityFromDayGroups,
  addActivityToDayGroups,
  flattenDayGroups,
  createNewActivityForDate,
  type TimesheetDayGroup 
} from '../utils/timesheetGrouping';
import type { Timesheet, TimesheetActivity } from '../persistence/adapter';

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

  // Form state for create mode
  const [createFormData, setCreateFormData] = useState({
    customerId: '',
    title: '',
    startDate: '',
    endDate: ''
  });

  // Form state for new position
  const [newPosition, setNewPosition] = useState({
    date: new Date().toISOString().split('T')[0],
    activityId: '',
    startTime: '09:00',
    endTime: '17:00',
    hours: 8,
    hourlyRate: 50
  });

  // State for day grouping view
  const [dayGroups, setDayGroups] = useState<TimesheetDayGroup[]>([]);
  const [groupingEnabled, setGroupingEnabled] = useState(false);

  // Update day groups when current timesheet changes or grouping is enabled
  React.useEffect(() => {
    if (current?.activities) {
      if (groupingEnabled) {
        setDayGroups(groupActivitiesByDate(current.activities));
      } else {
        setDayGroups([]);
      }
    }
  }, [current?.activities, groupingEnabled]);

  // Search and Filter Configuration for Timesheets
  const searchFieldMapping = useMemo(() => ({
    timesheetNumber: 'timesheetNumber',
    customer: (timesheet: Timesheet) => {
      const customer = customers.find(c => c.id === timesheet.customerId);
      return customer?.name || '';
    },
    title: 'title',
    status: 'status',
    startDate: 'startDate',
    endDate: 'endDate',
    total: 'total'
  }), [customers]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      field: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Entwurf' },
        { value: 'sent', label: 'Versendet' },
        { value: 'accepted', label: 'Akzeptiert' },
        { value: 'rejected', label: 'Abgelehnt' }
      ]
    },
    {
      field: 'startDate',
      label: 'Startdatum',
      type: 'dateRange'
    },
    {
      field: 'endDate',
      label: 'Enddatum',
      type: 'dateRange'
    },
    {
      field: 'total',
      label: 'Gesamtbetrag',
      type: 'numberRange'
    },
    {
      field: 'customerId',
      label: 'Kunde',
      type: 'select',
      options: customers.map(customer => ({
        value: customer.id,
        label: customer.name
      }))
    }
  ], [customers]);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    clearAll,
    filteredData,
    activeFilterCount
  } = useTableSearch(timesheets, searchFieldMapping);

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
          'draft': '#b2c2c0',   // Sanftes Grau (aus Webby Palette)
          'sent': '#f5d4a9',    // Sanftes Beige (aus Pastel Oranges)
          'accepted': '#9be69f', // Sanftes Grün (aus Cool Pastel)  
          'rejected': '#cf9ad6' // Sanftes Rosa/Lila (aus Webby Palette)
        };
        const statusLabels = {
          'draft': 'Entwurf',
          'sent': 'Versendet',
          'accepted': 'Akzeptiert', 
          'rejected': 'Abgelehnt'
        };
        return (
          <div 
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: statusColors[row.status],
              margin: '0 auto',
              flexShrink: 0
            }}
            title={statusLabels[row.status]} // Tooltip zeigt den Status-Text
          />
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
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            className="responsive-btn btn btn-info"
            onClick={() => handlePreviewPDF(row)}
            title="PDF Vorschau anzeigen"
          >
            <span className="btn-icon">👁️</span>
            <span className="btn-text">Vorschau</span>
          </button>
          <button
            className="responsive-btn btn btn-warning"
            onClick={() => handleExportPDF(row)}
            title="PDF herunterladen"
          >
            <span className="btn-icon">💾</span>
            <span className="btn-text">PDF</span>
          </button>
          <button 
            className="responsive-btn btn btn-secondary" 
            onClick={() => { setCurrent(row); setMode("edit"); }}
          >
            <span className="btn-icon">✏️</span>
            <span className="btn-text">Bearbeiten</span>
          </button>
          <button 
            className="responsive-btn btn btn-success" 
            onClick={() => handleDuplicate(row)}
            title="Kopie erstellen"
          >
            <span className="btn-icon">📋</span>
            <span className="btn-text">Kopie</span>
          </button>
          <button 
            className="responsive-btn btn btn-danger" 
            onClick={() => { if (confirm("Diesen Leistungsnachweis wirklich löschen?")) handleRemove(row.id); }}
          >
            <span className="btn-icon">🗑️</span>
            <span className="btn-text">Löschen</span>
          </button>
        </div>
      ) 
    },
    {
      key: "statusControl",
      header: "Status ändern",
      render: (row: Timesheet) => (
        <StatusControl
          row={{
            id: row.id,
            status: row.status as any,
            version: (row as any).version || 0
          }}
          kind="timesheet"
          onUpdated={(updatedEntity) => {
            // Update the timesheet in the list with new status and version
            const updatedTimesheet = {
              ...row,
              status: updatedEntity.status,
              version: updatedEntity.version,
              updatedAt: updatedEntity.updated_at,
              sentAt: updatedEntity.sent_at,
              acceptedAt: updatedEntity.accepted_at,
              rejectedAt: updatedEntity.rejected_at
            };
            
            // Update the timesheet via the hook (this will trigger a re-render)
            updateTimesheet(row.id, updatedTimesheet);
            
            showSuccess(`Status erfolgreich geändert zu: ${updatedEntity.status}`);
          }}
          onError={(error) => {
            showError(`Status-Änderung fehlgeschlagen: ${error.message}`);
          }}
        />
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

  async function handleCreateTimesheet() {
    if (!createFormData.customerId || !createFormData.title || !createFormData.startDate || !createFormData.endDate) {
      showError('Bitte alle Felder ausfüllen');
      return;
    }

    try {
      const timesheetData = {
        customerId: parseInt(createFormData.customerId),
        title: createFormData.title,
        startDate: createFormData.startDate,
        endDate: createFormData.endDate,
        notes: '',
        status: 'draft' as const,
        vatRate: 19,
        subtotal: 0,
        vatAmount: 0,
        total: 0,
        activities: [],
        timesheetNumber: `LN-${new Date().getFullYear()}-${String(timesheets.length + 1).padStart(3, '0')}`
      };
      
      await createTimesheet(timesheetData);
      showSuccess('Leistungsnachweis erfolgreich erstellt');
      setCreateFormData({ customerId: '', title: '', startDate: '', endDate: '' });
      setMode("list");
    } catch (error) {
      showError('Fehler beim Erstellen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  }

  async function handleAddPosition() {
    if (!current) return;
    
    if (!newPosition.activityId || !newPosition.date) {
      showError('Bitte Tätigkeit und Datum auswählen');
      return;
    }

    try {
      const selectedActivity = activities?.find(a => a.id === parseInt(newPosition.activityId));
      const hours = parseFloat(newPosition.hours.toString()) || 0;
      const hourlyRate = parseFloat(newPosition.hourlyRate.toString()) || 0;
      const total = hours * hourlyRate;

      const newTimesheetActivity = {
        id: Date.now(), // Temporary ID
        timesheetId: current.id,
        activityId: parseInt(newPosition.activityId),
        title: selectedActivity?.title || 'Unbekannte Tätigkeit',
        description: selectedActivity?.description || '',
        date: newPosition.date,
        startTime: newPosition.startTime,
        endTime: newPosition.endTime,
        hours: hours,
        hourlyRate: hourlyRate,
        total: total,
        isBreak: false
      };

      const updatedActivities = [...(current.activities || []), newTimesheetActivity];
      const newSubtotal = updatedActivities.reduce((sum, act) => sum + act.total, 0);
      const newVatAmount = newSubtotal * (current.vatRate / 100);
      const newTotal = newSubtotal + newVatAmount;

      const updatedTimesheet = {
        ...current,
        activities: updatedActivities,
        subtotal: newSubtotal,
        vatAmount: newVatAmount,
        total: newTotal
      };

      await updateTimesheet(current.id, updatedTimesheet);
      setCurrent(updatedTimesheet);
      setNewPosition({
        date: new Date().toISOString().split('T')[0],
        activityId: '',
        startTime: '09:00',
        endTime: '17:00',
        hours: 8,
        hourlyRate: 50
      });
      showSuccess('Position erfolgreich hinzugefügt');
    } catch (error) {
      showError('Fehler beim Hinzufügen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  }

  async function handleRemovePosition(activityId: number) {
    if (!current) return;

    try {
      const updatedActivities = current.activities.filter(act => act.id !== activityId);
      const newSubtotal = updatedActivities.reduce((sum, act) => sum + act.total, 0);
      const newVatAmount = newSubtotal * (current.vatRate / 100);
      const newTotal = newSubtotal + newVatAmount;

      const updatedTimesheet = {
        ...current,
        activities: updatedActivities,
        subtotal: newSubtotal,
        vatAmount: newVatAmount,
        total: newTotal
      };

      await updateTimesheet(current.id, updatedTimesheet);
      setCurrent(updatedTimesheet);
      showSuccess('Position erfolgreich entfernt');
    } catch (error) {
      showError('Fehler beim Entfernen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  }

  // Day group handlers
  const handleToggleGroupExpansion = (date: string) => {
    setDayGroups(prev => toggleDayGroupExpansion(prev, date));
  };

  const handleDayGroupActivityUpdate = async (activityId: number, updates: Partial<TimesheetActivity>) => {
    if (!current) return;

    try {
      const updatedActivities = current.activities.map(act => 
        act.id === activityId ? { ...act, ...updates } : act
      );

      // Recalculate totals
      const newSubtotal = updatedActivities.reduce((sum, act) => sum + act.total, 0);
      const newVatAmount = newSubtotal * (current.vatRate / 100);
      const newTotal = newSubtotal + newVatAmount;

      const updatedTimesheet = {
        ...current,
        activities: updatedActivities,
        subtotal: newSubtotal,
        vatAmount: newVatAmount,
        total: newTotal
      };

      await updateTimesheet(current.id, updatedTimesheet);
      setCurrent(updatedTimesheet);
      
      // Update day groups
      setDayGroups(prev => updateActivityInDayGroups(prev, activityId, updates));
      
      showSuccess('Aktivität erfolgreich aktualisiert');
    } catch (error) {
      showError('Fehler beim Aktualisieren: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const handleDayGroupActivityRemove = async (activityId: number) => {
    if (!current) return;

    try {
      const updatedActivities = current.activities.filter(act => act.id !== activityId);
      const newSubtotal = updatedActivities.reduce((sum, act) => sum + act.total, 0);
      const newVatAmount = newSubtotal * (current.vatRate / 100);
      const newTotal = newSubtotal + newVatAmount;

      const updatedTimesheet = {
        ...current,
        activities: updatedActivities,
        subtotal: newSubtotal,
        vatAmount: newVatAmount,
        total: newTotal
      };

      await updateTimesheet(current.id, updatedTimesheet);
      setCurrent(updatedTimesheet);
      
      // Update day groups
      setDayGroups(prev => removeActivityFromDayGroups(prev, activityId));
      
      showSuccess('Aktivität erfolgreich entfernt');
    } catch (error) {
      showError('Fehler beim Entfernen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const handleDayGroupActivityAdd = async (date: string, activityData: Partial<TimesheetActivity>) => {
    if (!current) return;

    try {
      const baseActivity = createNewActivityForDate(date, current.id);
      const newActivity = {
        ...baseActivity,
        ...activityData,
        id: Date.now() // Generate temporary ID
      };
      const updatedActivities = [...current.activities, newActivity];

      // Recalculate totals
      const newSubtotal = updatedActivities.reduce((sum, act) => sum + act.total, 0);
      const newVatAmount = newSubtotal * (current.vatRate / 100);
      const newTotal = newSubtotal + newVatAmount;

      const updatedTimesheet = {
        ...current,
        activities: updatedActivities,
        subtotal: newSubtotal,
        vatAmount: newVatAmount,
        total: newTotal
      };

      await updateTimesheet(current.id, updatedTimesheet);
      setCurrent(updatedTimesheet);
      
      // Update day groups
      setDayGroups(prev => addActivityToDayGroups(prev, newActivity));
      
      showSuccess('Aktivität erfolgreich hinzugefügt');
    } catch (error) {
      showError('Fehler beim Hinzufügen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  async function handleSaveTimesheet() {
    if (!current) return;

    try {
      await updateTimesheet(current.id, current);
      showSuccess('Leistungsnachweis erfolgreich gespeichert');
      setMode("list");
      setCurrent(null);
    } catch (error) {
      showError('Fehler beim Speichern: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  }

  const handleExportPDF = async (timesheet: Timesheet) => {
    const customer = customers.find(c => c.id === timesheet.customerId);
    if (!customer) {
      showError('Kunde nicht gefunden');
      return;
    }

    try {
      const logoData = settings?.companyData?.logo || null;
      const result = await PDFService.exportTimesheetToPDF(timesheet, customer, settings, false, currentTheme, undefined, logoData); // false = direct download
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
      const logoData = settings?.companyData?.logo || null;
      const result = await PDFService.exportTimesheetToPDF(timesheet, customer, settings, true, currentTheme, undefined, logoData); // true = preview only
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
    <div className="card page-timesheets">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px"}}>
        <div>
          <h2 style={{margin:"0 0 4px 0"}}>{title}</h2>
          <div style={{opacity:.7}}>Verwalte deine Leistungsnachweise und exportiere sie als PDF.</div>
        </div>
        <button className="btn" onClick={() => setMode(mode === "create" ? "list" : "create")}>
          {mode === "create" ? "Abbrechen" : "Neuer Leistungsnachweis"}
        </button>
      </div>
      
      {/* Search and Filter Bar */}
      <SearchAndFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Leistungsnachweise durchsuchen..."
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        resultCount={filteredData.length}
        totalCount={timesheets.length}
      />
      
      <div className="table-responsive">
           
        <Table<Timesheet>
          columns={columns as any}
          data={filteredData}
          getRowKey={(timesheet) => `timesheet-${timesheet.id}-${timesheet.status}-${timesheet.updatedAt}`}
          emptyMessage="Keine Leistungsnachweise gefunden."
        />
      </div>

      {mode === "create" && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(0,0,0,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Neuer Leistungsnachweis</h3>
            <div style={{opacity:.7}}>Erstelle einen neuen Leistungsnachweis (Grunddaten).</div>
          </div>
          
          {/* Grunddaten als Tabelle - Desktop */}
          <div style={{border:"1px solid var(--color-border)", borderRadius:"8px", overflow:"hidden", marginBottom:"24px"}}>
            <div className="timesheet-create-header">
              <div>Kunde</div>
              <div>Titel</div>
              <div>Von</div>
              <div>Bis</div>
              <div className="timesheet-actions">Aktionen</div>
            </div>
            
            <div className="timesheet-create-grid">
              <select 
                className="form-control" 
                style={{fontSize:"14px"}}
                value={createFormData.customerId}
                onChange={(e) => setCreateFormData(prev => ({...prev, customerId: e.target.value}))}
              >
                <option value="">Wählen...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
              
              <input 
                type="text" 
                placeholder="Titel eingeben..." 
                className="form-control" 
                style={{fontSize:"14px"}}
                value={createFormData.title}
                onChange={(e) => setCreateFormData(prev => ({...prev, title: e.target.value}))}
              />
              
              <input 
                type="date" 
                className="form-control" 
                style={{fontSize:"14px"}}
                value={createFormData.startDate}
                onChange={(e) => setCreateFormData(prev => ({...prev, startDate: e.target.value}))}
              />
              
              <input 
                type="date" 
                className="form-control" 
                style={{fontSize:"14px"}}
                value={createFormData.endDate}
                onChange={(e) => setCreateFormData(prev => ({...prev, endDate: e.target.value}))}
              />
              
              <div className="timesheet-actions" style={{display:"flex", gap:"4px"}}>
                <button 
                  className="btn btn-success" 
                  style={{padding:"4px 8px", fontSize:"12px"}}
                  onClick={handleCreateTimesheet}
                >
                  Erstellen
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{padding:"4px 8px", fontSize:"12px"}}
                  onClick={() => setMode("list")}
                >
                  Abbrechen
                </button>
              </div>
            </div>
            
            {/* Mobile Version */}
            <div className="timesheet-create-mobile">
              <div className="form-group">
                <label>Kunde</label>
                <select 
                  className="form-control"
                  value={createFormData.customerId}
                  onChange={(e) => setCreateFormData(prev => ({...prev, customerId: e.target.value}))}
                >
                  <option value="">Kunde wählen...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Titel</label>
                <input 
                  type="text" 
                  placeholder="Titel eingeben..." 
                  className="form-control"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData(prev => ({...prev, title: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>Von</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={createFormData.startDate}
                  onChange={(e) => setCreateFormData(prev => ({...prev, startDate: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>Bis</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={createFormData.endDate}
                  onChange={(e) => setCreateFormData(prev => ({...prev, endDate: e.target.value}))}
                />
              </div>
              
              <div className="timesheet-actions" style={{display:"flex", gap:"8px"}}>
                <button 
                  className="btn btn-success" 
                  style={{flex:1, padding:"12px", fontSize:"16px"}}
                  onClick={handleCreateTimesheet}
                >
                  Erstellen
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{flex:1, padding:"12px", fontSize:"16px"}}
                  onClick={() => setMode("list")}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "edit" && current && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(0,0,0,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Leistungsnachweis bearbeiten: {current.title}</h3>
            <div style={{opacity:.7}}>Positionen hinzufügen und verwalten (bis zu 31 Einträge möglich).</div>
          </div>
          
          {/* Grunddaten (read-only) */}
          <div style={{border:"1px solid var(--color-border)", borderRadius:"8px", overflow:"hidden", marginBottom:"16px"}}>
            <div style={{
              display:"grid", 
              gridTemplateColumns:"120px 1fr 120px 120px 120px", 
              backgroundColor:"var(--color-table-header)", 
              padding:"12px 16px", 
              fontWeight:"600",
              borderBottom:"1px solid var(--color-border)"
            }}>
              <div>Kunde</div>
              <div>Titel</div>
              <div>Von</div>
              <div>Bis</div>
              <div>Summe</div>
            </div>
            
            <div style={{
              display:"grid", 
              gridTemplateColumns:"120px 1fr 120px 120px 120px", 
              padding:"12px 16px",
              alignItems:"center",
              gap:"8px",
              backgroundColor:"var(--color-bg-secondary)"
            }}>
              <div style={{fontSize:"14px"}}>
                {customers.find(c => c.id === current.customerId)?.name}
              </div>
              <div style={{fontSize:"14px"}}>
                {current.title}
              </div>
              <div style={{fontSize:"14px"}}>
                {new Date(current.startDate).toLocaleDateString('de-DE')}
              </div>
              <div style={{fontSize:"14px"}}>
                {new Date(current.endDate).toLocaleDateString('de-DE')}
              </div>
              <div style={{fontSize:"14px", fontWeight:"600"}}>
                €{current.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Positionen/Activities */}
          <div style={{marginBottom:"16px"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px"}}>
              <h4 style={{margin:"0", fontSize:"16px"}}>Positionen ({current.activities?.length || 0}/31)</h4>
              <button
                className="btn btn-secondary"
                style={{padding:"6px 12px", fontSize:"12px"}}
                onClick={() => {
                  const newGroupingEnabled = !groupingEnabled;
                  setGroupingEnabled(newGroupingEnabled);
                  if (newGroupingEnabled && current?.activities) {
                    setDayGroups(groupActivitiesByDate(current.activities));
                  }
                }}
              >
                {groupingEnabled ? '📋 Listansicht' : '📅 Tagesgruppenansicht'}
              </button>
            </div>
            <div style={{opacity:.7, fontSize:"14px"}}>
              {groupingEnabled 
                ? 'Aktivitäten nach Datum gruppiert mit erweiterbaren Tagesgruppen.'
                : 'Einzelne Arbeitspositionen mit Datum, Zeiten und Tätigkeiten.'
              }
            </div>
          </div>

          {groupingEnabled ? (
            /* Day Grouped View */
            <div style={{marginBottom:"16px"}}>
              {dayGroups.map(group => (
                <TimesheetDayGroupComponent
                  key={group.date}
                  dayGroup={group}
                  onToggleExpansion={() => handleToggleGroupExpansion(group.date)}
                  onActivityUpdate={handleDayGroupActivityUpdate}
                  onActivityRemove={handleDayGroupActivityRemove}
                  onActivityAdd={() => handleDayGroupActivityAdd(group.date, {})}
                  availableActivities={activities?.map(a => ({ id: a.id, title: a.title, hourlyRate: a.hourlyRate || 50 })) || []}
                />
              ))}
            </div>
          ) : (
            /* Traditional List View */

          <div style={{border:"1px solid var(--color-border)", borderRadius:"8px", overflow:"hidden"}}>
            {/* Desktop Positionen-Header */}
            <div className="timesheet-positionen-header">
              <div>Datum</div>
              <div>Tätigkeit</div>
              <div>Von</div>
              <div>Bis</div>
              <div>Stunden</div>
              <div>Stundensatz</div>
              <div>Summe</div>
              <div>Aktionen</div>
            </div>
            
            {/* Desktop Existing activities */}
            {current.activities?.map((activity, index) => (
              <div key={activity.id} className="timesheet-positionen-grid" style={{
                borderBottom: index < current.activities.length - 1 ? "1px solid var(--color-border)" : "none"
              }}>
                <div style={{fontSize:"14px"}}>
                  {new Date(activity.date).toLocaleDateString('de-DE')}
                </div>
                <div style={{fontSize:"14px"}}>
                  {activity.title}
                </div>
                <div style={{fontSize:"14px"}}>
                  {activity.startTime}
                </div>
                <div style={{fontSize:"14px"}}>
                  {activity.endTime}
                </div>
                <div style={{fontSize:"14px"}}>
                  {activity.hours}h
                </div>
                <div style={{fontSize:"14px"}}>
                  €{activity.hourlyRate}
                </div>
                <div style={{fontSize:"14px", fontWeight:"600"}}>
                  €{activity.total.toFixed(2)}
                </div>
                <div style={{display:"flex", gap:"4px"}}>
                  <button 
                    className="btn btn-danger" 
                    style={{padding:"2px 6px", fontSize:"11px"}}
                    onClick={() => handleRemovePosition(activity.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            
            {/* Mobile Positionen */}
            <div className="timesheet-positionen-mobile">
              {current.activities?.map((activity, index) => (
                <div key={activity.id} className="timesheet-position-card">
                  <div className="position-header">
                    <span>{activity.title}</span>
                    <button 
                      className="btn btn-danger" 
                      style={{padding:"4px 8px", fontSize:"12px"}}
                      onClick={() => handleRemovePosition(activity.id)}
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                  <div className="position-details">
                    <div><strong>Datum:</strong><br/>{new Date(activity.date).toLocaleDateString('de-DE')}</div>
                    <div><strong>Zeit:</strong><br/>{activity.startTime} - {activity.endTime}</div>
                    <div><strong>Stunden:</strong><br/>{activity.hours}h</div>
                    <div><strong>Stundensatz:</strong><br/>€{activity.hourlyRate}</div>
                  </div>
                  <div className="position-meta">
                    <strong>Summe: €{activity.total.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Add new position row */}
            <div className="timesheet-positionen-grid" style={{
              borderTop:"1px solid var(--color-border)",
              backgroundColor:"var(--color-bg-light)"
            }}>
              <input 
                type="date" 
                className="form-control" 
                style={{fontSize:"12px", padding:"4px"}}
                value={newPosition.date}
                onChange={(e) => setNewPosition(prev => ({...prev, date: e.target.value}))}
              />
              
              <select 
                className="form-control" 
                style={{fontSize:"12px", padding:"4px"}}
                value={newPosition.activityId}
                onChange={(e) => setNewPosition(prev => ({...prev, activityId: e.target.value}))}
              >
                <option value="">Tätigkeit wählen...</option>
                {activities?.map(activity => (
                  <option key={activity.id} value={activity.id}>{activity.title}</option>
                ))}
              </select>
              
              <input 
                type="time" 
                className="form-control" 
                style={{fontSize:"12px", padding:"4px"}}
                value={newPosition.startTime}
                onChange={(e) => setNewPosition(prev => ({...prev, startTime: e.target.value}))}
              />
              
              <input 
                type="time" 
                className="form-control" 
                style={{fontSize:"12px", padding:"4px"}}
                value={newPosition.endTime}
                onChange={(e) => setNewPosition(prev => ({...prev, endTime: e.target.value}))}
              />
              
              <input 
                type="number" 
                step="0.1"
                className="form-control" 
                style={{fontSize:"12px", padding:"4px"}}
                placeholder="8.0"
                value={newPosition.hours}
                onChange={(e) => setNewPosition(prev => ({...prev, hours: parseFloat(e.target.value) || 0}))}
              />
              
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                style={{fontSize:"12px", padding:"4px"}}
                placeholder="50.00"
                value={newPosition.hourlyRate}
                onChange={(e) => setNewPosition(prev => ({...prev, hourlyRate: parseFloat(e.target.value) || 0}))}
              />
              
              <div style={{fontSize:"12px", color:"var(--color-text-secondary)"}}>
                €{(newPosition.hours * newPosition.hourlyRate).toFixed(2)}
              </div>
              
              <button 
                className="btn btn-success" 
                style={{padding:"4px 8px", fontSize:"11px"}}
                onClick={handleAddPosition}
              >
                + Hinzufügen
              </button>
            </div>
            
            {/* Mobile Add Position Form */}
            <div className="timesheet-add-position-mobile">
              <div className="form-group">
                <label>Datum</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={newPosition.date}
                  onChange={(e) => setNewPosition(prev => ({...prev, date: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>Tätigkeit</label>
                <select 
                  className="form-control"
                  value={newPosition.activityId}
                  onChange={(e) => setNewPosition(prev => ({...prev, activityId: e.target.value}))}
                >
                  <option value="">Tätigkeit wählen...</option>
                  {activities?.map(activity => (
                    <option key={activity.id} value={activity.id}>{activity.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="time-inputs">
                <div>
                  <label>Von</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={newPosition.startTime}
                    onChange={(e) => setNewPosition(prev => ({...prev, startTime: e.target.value}))}
                  />
                </div>
                <div>
                  <label>Bis</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={newPosition.endTime}
                    onChange={(e) => setNewPosition(prev => ({...prev, endTime: e.target.value}))}
                  />
                </div>
                <div>
                  <label>Stunden</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-control"
                    placeholder="8.0"
                    value={newPosition.hours}
                    onChange={(e) => setNewPosition(prev => ({...prev, hours: parseFloat(e.target.value) || 0}))}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Stundensatz (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control"
                  placeholder="50.00"
                  value={newPosition.hourlyRate}
                  onChange={(e) => setNewPosition(prev => ({...prev, hourlyRate: parseFloat(e.target.value) || 0}))}
                />
              </div>
              
              <div style={{textAlign:"center", marginBottom:"12px", fontSize:"16px", fontWeight:"600"}}>
                Summe: €{(newPosition.hours * newPosition.hourlyRate).toFixed(2)}
              </div>
              
              <button 
                className="btn btn-success add-button"
                onClick={handleAddPosition}
              >
                + Position hinzufügen
              </button>
            </div>
          </div>
          )}

          <div style={{marginTop:"16px", display:"flex", justifyContent:"space-between"}}>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setMode("list");
                setCurrent(null);
              }}
            >
              Zurück zur Übersicht
            </button>
            <button 
              className="btn btn-success"
              onClick={handleSaveTimesheet}
            >
              Leistungsnachweis speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}