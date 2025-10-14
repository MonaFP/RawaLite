import React, { useMemo, useState } from "react";
import { Table } from "../components/Table";
import { SearchAndFilterBar, useTableSearch, FilterConfig } from "../components/SearchAndFilter";
import type { Package } from "../persistence/adapter";
import PackageForm, { PackageFormValues } from "../components/PackageForm";
import { usePackages } from "../hooks/usePackages";
import { useNotifications } from "../contexts/NotificationContext";
import { useLoading } from "../contexts/LoadingContext";
import { handleError } from "../lib/errors";

interface PaketePageProps{
  title?: string;
}

export default function PaketePage({ title = "Pakete" }: PaketePageProps){
  const { packages, loading, error, createPackage, updatePackage, deletePackage } = usePackages();
  const [mode, setMode] = useState<"list"|"create"|"edit">("list");
  const [current, setCurrent] = useState<Package | null>(null);
  const { showError, showSuccess } = useNotifications();
  const { withLoading } = useLoading();

  // Separate main packages and subpackages
  const mainPackages = packages.filter(p => !p.parentPackageId);
  const subPackages = packages.filter(p => p.parentPackageId);

  // Search and Filter Configuration for Packages
  const searchFieldMapping = useMemo(() => ({
    internalTitle: 'internalTitle',
    total: 'total',
    lineItems: (pkg: Package) => pkg.lineItems.length.toString(),
    type: (pkg: Package) => pkg.parentPackageId ? 'subpackage' : 'main'
  }), []);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      field: 'parentPackageId',
      label: 'Typ',
      type: 'select',
      options: [
        { value: 'null', label: 'Hauptpaket' },
        { value: 'not-null', label: 'Subpaket' }
      ]
    },
    {
      field: 'total',
      label: 'Preis',
      type: 'numberRange',
      min: 0,
      step: 0.01
    },
    {
      field: 'lineItems',
      label: 'Anzahl Positionen',
      type: 'numberRange',
      min: 0,
      step: 1
    }
  ], []);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    clearAll,
    filteredData,
    activeFilterCount
  } = useTableSearch(packages, searchFieldMapping);

  const columns = useMemo(()=>([
    { key: "internalTitle", header: "Bezeichnung" },
    { 
      key: "total", 
      header: "Preis", 
      render: (row: Package) => `€${row.total.toFixed(2)}`
    },
    { 
      key: "lineItems", 
      header: "Positionen", 
      render: (row: Package) => `${row.lineItems.length} Position(en)`
    },
    {
      key: "parentPackageId",
      header: "Typ",
      render: (row: Package) => row.parentPackageId ? 
        <em style={{opacity: 0.7}}>Subpaket</em> : 
        <strong>Hauptpaket</strong>
    },
    { key: "id", header: "Aktionen", render: (row: Package) => (
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
            onClick={()=>{ if(confirm("Dieses Paket wirklich löschen?")) handleRemove(row.id); }}
            disabled={loading}
          >
            Löschen
          </button>
        </div>
      ) 
    }
  ]), [loading]);

  async function handleCreate(values: PackageFormValues){
    try {
      // Convert Array-Indices back to DB-IDs for persistence
      const processedLineItems = values.lineItems.map((item, index) => {
        const dbId = index + 1;
        return {
          ...item,
          id: dbId,
          // Convert parentItemId from Array-Index to DB-ID
          parentItemId: item.parentItemId !== undefined 
            ? (item.parentItemId as number) + 1  // Array-Index → DB-ID
            : undefined
        };
      });

      await createPackage({ 
        internalTitle: values.internalTitle,
        lineItems: processedLineItems,
        parentPackageId: values.parentPackageId,
        addVat: values.addVat
      });
      setMode("list");
      // Success notification is handled in PackageForm
    } catch (err) {
      // Error handling is done in usePackages and PackageForm
      console.error('Error creating package:', err);
    }
  }

  async function handleEdit(values: PackageFormValues){
    if(!current) return;
    
    try {
      // Convert Array-Indices back to DB-IDs for persistence
      const processedLineItems = values.lineItems.map((item, index) => {
        const dbId = index + 1;
        return {
          ...item,
          id: dbId,
          // Convert parentItemId from Array-Index to DB-ID
          parentItemId: item.parentItemId !== undefined 
            ? (item.parentItemId as number) + 1  // Array-Index → DB-ID
            : undefined
        };
      });

      await updatePackage(current.id, { 
        internalTitle: values.internalTitle,
        lineItems: processedLineItems,
        parentPackageId: values.parentPackageId,
        addVat: values.addVat
      });
      setMode("list");
      setCurrent(null);
      // Success notification is handled in PackageForm
    } catch (err) {
      // Error handling is done in usePackages and PackageForm
      console.error('Error updating package:', err);
    }
  }

  async function handleRemove(id: number){
    try {
      await withLoading(
        () => deletePackage(id),
        'Paket wird gelöscht...'
      );
      showSuccess('Paket wurde erfolgreich gelöscht.');
    } catch (err) {
      const appError = handleError(err);
      showError(appError);
    }
  }

  // Show loading state
  if (loading && packages.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Pakete werden geladen...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && packages.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'rgba(239, 68, 68, 0.9)', marginBottom: '1rem' }}>
            Fehler beim Laden der Pakete: {error}
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
          <div style={{opacity:.7}}>Definiere Leistungspakete, die du in Angeboten/Rechnungen verwenden kannst.</div>
        </div>
        <button 
          className={`btn ${mode === "create" ? "btn-secondary" : "btn-primary"}`}
          onClick={()=>setMode(mode === "create" ? "list" : "create")}
          disabled={loading}
        >
          {mode === "create" ? "Abbrechen" : "Neues Paket"}
        </button>
      </div>
      
      {/* Search and Filter Bar */}
      <SearchAndFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Pakete durchsuchen..."
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        resultCount={filteredData.length}
        totalCount={packages.length}
      />
      
      <Table<Package>
        columns={columns as any}
        data={filteredData}
        emptyMessage="Keine Pakete gefunden."
      />

      {mode === "create" && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Neues Paket</h3>
            <div style={{opacity:.7}}>Erstelle ein neues Leistungspaket.</div>
          </div>
          <PackageForm
            onSubmit={handleCreate}
            onCancel={()=>setMode("list")}
            submitLabel="Paket erstellen"
            packages={packages}
          />
        </div>
      )}

      {mode === "edit" && current && (
        <div style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{marginBottom:"16px"}}>
            <h3 style={{margin:"0 0 4px 0"}}>Paket bearbeiten</h3>
            <div style={{opacity:.7}}>Bearbeite das Paket "{current.internalTitle}".</div>
          </div>
          <PackageForm
            initial={{ 
              internalTitle: current.internalTitle,
              lineItems: (() => {
                // Convert DB-IDs to Array-Indices for PackageForm compatibility
                const dbToIndexMap: Record<number, number> = {};
                
                // Create mapping: DB-ID → Array-Index
                current.lineItems.forEach((item, index) => {
                  dbToIndexMap[item.id] = index;
                });
                
                return current.lineItems.map(li => ({ 
                  title: li.title, 
                  quantity: li.quantity, 
                  unitPrice: li.unitPrice,
                  parentItemId: li.parentItemId ? dbToIndexMap[li.parentItemId] : undefined,
                  description: li.description
                }));
              })(),
              addVat: current.addVat,
              parentPackageId: current.parentPackageId
            }}
            onSubmit={handleEdit}
            onCancel={()=>{ setMode("list"); setCurrent(null); }}
            submitLabel="Paket aktualisieren"
            packages={packages}
          />
        </div>
      )}
    </div>
  );
}
