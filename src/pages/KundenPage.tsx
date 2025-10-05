import React, { useMemo, useState } from "react";
import { Table } from "../components/Table";
import { SearchAndFilterBar, useTableSearch, FilterConfig } from "../components/SearchAndFilter";
import type { Customer } from "../persistence/adapter";
import CustomerForm, { CustomerFormValues } from "../components/CustomerForm";
import { useCustomers } from "../hooks/useCustomers";
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { ExportService } from "../services/ExportService";
import { handleError } from "../lib/errors";

interface KundenPageProps{
  title?: string;
}

export default function KundenPage({ title = "Kunden" }: KundenPageProps){
  const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [mode, setMode] = useState<"list"|"create"|"edit">("list");
  const [current, setCurrent] = useState<Customer | null>(null);
  const { showError, showSuccess } = useNotifications();
  const { withLoading } = useLoading();

  // Search and Filter Configuration for Customers
  const searchFieldMapping = useMemo(() => ({
    number: 'number',
    name: 'name',
    email: 'email',
    phone: 'phone',
    street: 'street',
    postalCode: 'postalCode',
    city: 'city',
    notes: 'notes'
  }), []);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      field: 'city',
      label: 'Ort',
      type: 'select',
      options: Array.from(new Set(customers.map(c => c.city).filter(Boolean)))
        .map(city => ({ value: city as string, label: city as string }))
    },
    {
      field: 'createdAt',
      label: 'Erstellt',
      type: 'dateRange'
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
  } = useTableSearch(customers, searchFieldMapping);

  const columns = useMemo(()=>([
    { key: "number", header: "Nummer" },
    { key: "name", header: "Name" },
    { 
      key: "email", 
      header: "E-Mail", 
      render: (row: Customer) => row.email || <em style={{opacity: 0.6}}>kein Eintrag</em>
    },
    { 
      key: "city", 
      header: "Ort", 
      render: (row: Customer) => row.city || <em style={{opacity: 0.6}}>kein Eintrag</em>
    },
    { 
      key: "phone", 
      header: "Telefon", 
      render: (row: Customer) => row.phone || <em style={{opacity: 0.6}}>kein Eintrag</em>
    },
    { key: "id", header: "Aktionen", render: (row: Customer) => (
        <div style={{display:"flex", gap:8}}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: "4px 8px", fontSize: "12px" }} 
            onClick={()=>{ setCurrent(row); setMode("edit"); }}
            disabled={loading}
          >
            Bearbeiten
          </button>
          <button 
            className="btn btn-danger" 
            style={{ padding: "4px 8px", fontSize: "12px" }} 
            onClick={()=>{ if(confirm("Diesen Kunden wirklich löschen?")) handleRemove(row.id); }}
            disabled={loading}
          >
            Löschen
          </button>
        </div>
      ) 
    }
  ]), [loading]);

  async function handleCreate(values: CustomerFormValues){
    try {
      await createCustomer({ 
        name: values.name, 
        email: values.email, 
        phone: values.phone,
        street: values.street,
        zip: values.zip,
        city: values.city,
        notes: values.notes
      });
      setMode("list");
      // Success notification is handled in CustomerForm
    } catch (err) {
      // Error handling is done in useCustomers and CustomerForm
      console.error('Error creating customer:', err);
    }
  }

  async function handleEdit(values: CustomerFormValues){
    if(!current) return;
    
    try {
      await updateCustomer(current.id, { 
        name: values.name, 
        email: values.email, 
        phone: values.phone,
        street: values.street,
        zip: values.zip,
        city: values.city,
        notes: values.notes
      });
      setMode("list");
      setCurrent(null);
      // Success notification is handled in CustomerForm
    } catch (err) {
      // Error handling is done in useCustomers and CustomerForm
      console.error('Error updating customer:', err);
    }
  }

  async function handleRemove(id: number){
    try {
      await withLoading(
        () => deleteCustomer(id),
        'Kunde wird gelöscht...'
      );
      showSuccess('Kunde wurde erfolgreich gelöscht.');
    } catch (err) {
      const appError = handleError(err);
      showError(appError);
    }
  }

  async function handleExportCSV() {
    try {
      await withLoading(
        () => Promise.resolve(ExportService.exportCustomersToCSV(customers)),
        'CSV wird erstellt...'
      );
      showSuccess('CSV-Export wurde erfolgreich erstellt.');
    } catch (err) {
      const appError = handleError(err);
      showError('Fehler beim CSV-Export: ' + appError.message);
    }
  }

  // Show loading state
  if (loading && customers.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Kundendaten werden geladen...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && customers.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'rgba(239, 68, 68, 0.9)', marginBottom: '1rem' }}>
            Fehler beim Laden der Kundendaten: {error}
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px"}}>
        <div>
          <h2 style={{margin:"0 0 4px 0"}}>{title}</h2>
          <div style={{opacity:.7}}>Verwalte deine Kunden. Daten werden lokal gespeichert.</div>
        </div>
        <div style={{display:"flex", gap:"8px"}}>
          <button 
            className="btn btn-success" 
            onClick={handleExportCSV}
            disabled={loading || customers.length === 0}
          >
            CSV Export
          </button>
          <button 
            className={`btn ${mode === "create" ? "btn-secondary" : "btn-primary"}`}
            onClick={()=>setMode(mode === "create" ? "list" : "create")}
            disabled={loading}
          >
            {mode === "create" ? "Abbrechen" : "Neuer Kunde"}
          </button>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <SearchAndFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Kunden durchsuchen..."
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        resultCount={filteredData.length}
        totalCount={customers.length}
      />
      
      <Table<Customer>
        columns={columns as any}
        data={filteredData}
        emptyMessage="Keine Kunden gefunden."
      />

      {mode === "create" && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(0,0,0,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Neuer Kunde</h3>
            <div style={{opacity:.7}}>Erstelle einen neuen Kunden.</div>
          </div>
          <CustomerForm
            onSubmit={handleCreate}
            onCancel={()=>setMode("list")}
            submitLabel="Erstellen"
          />
        </div>
      )}

      {mode === "edit" && current && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(0,0,0,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Kunde bearbeiten</h3>
            <div style={{opacity:.7}}>Bearbeite die Kundendaten von {current.name}.</div>
          </div>
          <CustomerForm
            initial={{ 
              name: current.name, 
              email: current.email || "", 
              phone: current.phone || "",
              street: current.street || "",
              zip: current.zip || "",
              city: current.city || "",
              notes: current.notes || ""
            }}
            onSubmit={handleEdit}
            onCancel={()=>{ setMode("list"); setCurrent(null); }}
            submitLabel="Aktualisieren"
          />
        </div>
      )}
    </div>
  );
}
