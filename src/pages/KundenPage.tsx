import {useMemo, useState } from 'react';
import { Table, type SortConfig } from "../components/Table";
import { SearchInput } from "../components/SearchInput";
import { FilterChips, MultiSelect, type FilterChip, type MultiSelectOption } from "../components/FilterComponents";
import type { Customer } from "../persistence/adapter";
import CustomerForm, { CustomerFormValues } from "../components/CustomerForm";
import { useCustomers } from "../hooks/useCustomers";
import { useListPreferences } from "../hooks/useListPreferences";
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { ExportService } from "../services/ExportService";
import { handleError } from "../lib/errors";

interface KundenPageProps{
  title?: string;
}

export default function KundenPage({ title = "Kunden" }: KundenPageProps){
  const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { preferences } = useListPreferences('offers');
  const [mode, setMode] = useState<"list"|"create"|"edit">("list");
  const [current, setCurrent] = useState<Customer | null>(null);
  const { showError, showSuccess } = useNotifications();
  const { withLoading } = useLoading();

  // Local state for search and filters
  const [searchQuery, setSearchQuery] = useState(preferences.lastSearch || '');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [hasEmailFilter, setHasEmailFilter] = useState<boolean | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    preferences.sortBy ? { key: preferences.sortBy, direction: preferences.sortDir || 'asc' } : null
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and search logic
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query) ||
        customer.city?.toLowerCase().includes(query) ||
        customer.number.toLowerCase().includes(query)
      );
    }

    // City filter
    if (selectedCities.length > 0) {
      filtered = filtered.filter(customer => 
        customer.city && selectedCities.includes(customer.city)
      );
    }

    // Email filter
    if (hasEmailFilter !== null) {
      filtered = filtered.filter(customer => 
        hasEmailFilter ? !!customer.email : !customer.email
      );
    }

    return filtered;
  }, [customers, searchQuery, selectedCities, hasEmailFilter]);

  // City options for filter
  const cityOptions = useMemo((): MultiSelectOption[] => {
    const cityCount = customers.reduce((acc, customer) => {
      if (customer.city) {
        acc[customer.city] = (acc[customer.city] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cityCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([city, count]) => ({
        value: city,
        label: city,
        count
      }));
  }, [customers]);

  // Active filters for display
  const activeFilters = useMemo((): FilterChip[] => {
    const filters: FilterChip[] = [];

    if (searchQuery.trim()) {
      filters.push({
        key: 'search',
        label: `Suche: "${searchQuery}"`,
        value: searchQuery
      });
    }

    selectedCities.forEach(city => {
      filters.push({
        key: `city-${city}`,
        label: `Ort: ${city}`,
        value: city
      });
    });

    if (hasEmailFilter !== null) {
      filters.push({
        key: 'hasEmail',
        label: hasEmailFilter ? 'Mit E-Mail' : 'Ohne E-Mail',
        value: hasEmailFilter
      });
    }

    return filters;
  }, [searchQuery, selectedCities, hasEmailFilter]);

  const columns = useMemo(() => {
    const baseColumns = [
      { key: "number", header: "Nummer", sortable: true, visible: preferences.visibleColumns?.includes('number') !== false },
      { key: "name", header: "Name", sortable: true, visible: preferences.visibleColumns?.includes('name') !== false },
      { 
        key: "email", 
        header: "E-Mail", 
        sortable: true,
        visible: preferences.visibleColumns?.includes('email') !== false,
        render: (row: Customer) => row.email || <em style={{opacity: 0.6}}>kein Eintrag</em>
      },
      { 
        key: "city", 
        header: "Ort", 
        sortable: true,
        visible: preferences.visibleColumns?.includes('city') !== false,
        render: (row: Customer) => row.city || <em style={{opacity: 0.6}}>kein Eintrag</em>
      },
      { 
        key: "phone", 
        header: "Telefon", 
        sortable: true,
        visible: preferences.visibleColumns?.includes('phone') !== false,
        render: (row: Customer) => row.phone || <em style={{opacity: 0.6}}>kein Eintrag</em>
      },
      { 
        key: "createdAt", 
        header: "Erstellt", 
        sortable: true,
        visible: preferences.visibleColumns?.includes('createdAt') !== false,
        render: (row: Customer) => new Date(row.createdAt).toLocaleDateString('de-DE')
      },
      { 
        key: "id", 
        header: "Aktionen", 
        sortable: false,
        visible: true, // Aktionen immer sichtbar
        render: (row: Customer) => (
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
    ];

    return baseColumns.filter(col => col.visible);
  }, [loading, preferences.visibleColumns]);

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
        () => Promise.resolve(ExportService.exportCustomersToCSV(filteredCustomers)),
        'CSV wird erstellt...'
      );
      showSuccess('CSV-Export wurde erfolgreich erstellt.');
    } catch (err) {
      const appError = handleError(err);
      showError('Fehler beim CSV-Export: ' + appError.message);
    }
  }

  // Filter event handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    // updatePreference removed
  };

  const handleRemoveFilter = (filterKey: string) => {
    if (filterKey === 'search') {
      setSearchQuery('');
      // updatePreference removed
    } else if (filterKey.startsWith('city-')) {
      const city = filterKey.replace('city-', '');
      setSelectedCities(prev => prev.filter(c => c !== city));
    } else if (filterKey === 'hasEmail') {
      setHasEmailFilter(null);
    }
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCities([]);
    setHasEmailFilter(null);
    setCurrentPage(1);
    // updatePreference removed
  };

  const handleSortChange = (newSortConfig: SortConfig | null) => {
    setSortConfig(newSortConfig);
    if (newSortConfig) {
      // updatePreference removed
    } else {
      // updatePreference removed
    }
  };

  const handleVisibleColumnsChange = (_columns: string[]) => {
    // updatePreference removed
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px"}}>
        <div>
          <h2 style={{margin:"0 0 4px 0"}}>{title}</h2>
          <div style={{opacity:.7}}>
            {filteredCustomers.length} von {customers.length} Kunden
            {filteredCustomers.length !== customers.length && ' (gefiltert)'}
          </div>
        </div>
        <div style={{display:"flex", gap:"8px"}}>
          <button 
            className="btn btn-success" 
            onClick={handleExportCSV}
            disabled={loading || filteredCustomers.length === 0}
          >
            CSV Export ({filteredCustomers.length})
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

      {/* Search and Filters */}
      <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <SearchInput
          value={searchQuery}
          onSearch={handleSearch}
          placeholder="Suche nach Name, E-Mail, Telefon, Ort oder Nummer..."
          disabled={loading}
        />

        <MultiSelect
          options={cityOptions}
          selected={selectedCities}
          onSelectionChange={setSelectedCities}
          label="Orte filtern"
          disabled={loading}
        />

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setHasEmailFilter(hasEmailFilter === true ? null : true)}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              background: hasEmailFilter === true ? "#3b82f6" : "#f9fafb",
              color: hasEmailFilter === true ? "white" : "#374151",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: hasEmailFilter === true ? "600" : "400",
              transition: "all 0.2s ease"
            }}
          >
            Mit E-Mail
          </button>
          <button
            onClick={() => setHasEmailFilter(hasEmailFilter === false ? null : false)}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              background: hasEmailFilter === false ? "#3b82f6" : "#f9fafb",
              color: hasEmailFilter === false ? "white" : "#374151",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: hasEmailFilter === false ? "600" : "400",
              transition: "all 0.2s ease"
            }}
          >
            Ohne E-Mail
          </button>
        </div>
      </div>

      {/* Active Filters */}
      <FilterChips
        filters={activeFilters}
        onRemove={handleRemoveFilter}
        onClearAll={activeFilters.length > 1 ? handleClearAllFilters : undefined}
      />
      
      <Table<Customer>
        columns={columns as any}
        data={filteredCustomers}
        emptyMessage={
          searchQuery || selectedCities.length > 0 || hasEmailFilter !== null
            ? "Keine Kunden entsprechen den Filterkriterien."
            : "Noch keine Kunden angelegt."
        }
        sortable={true}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        visibleColumns={preferences.visibleColumns}
        onVisibleColumnsChange={handleVisibleColumnsChange}
        showColumnToggle={true}
        showPagination={filteredCustomers.length > (preferences.pageSize || 25)}
        pageSize={preferences.pageSize || 25}
        currentPage={currentPage}
        onPageChange={handlePageChange}
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



