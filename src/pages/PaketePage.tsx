import {useMemo, useState } from 'react';
import { Table } from "../components/Table";
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

  // Separate main packages and _subPackages
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
      await createPackage({ 
        internalTitle: values.internalTitle,
        lineItems: values.lineItems.map((item, index) => ({ ...item, id: index + 1 })),
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
      await updatePackage(current.id, { 
        internalTitle: values.internalTitle,
        lineItems: values.lineItems.map((item, index) => ({ ...item, id: index + 1 })),
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
      
      <Table<Package>
        columns={columns as any}
        data={packages}
        emptyMessage="Noch keine Pakete definiert."
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
              lineItems: current.lineItems.map(li => ({ 
                title: li.title, 
                quantity: li.quantity, 
                amount: li.amount,
                parentItemId: li.parentItemId,
                description: li.description
              })),
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




