import React, { useMemo, useState } from "react";
import { Table } from "../components/Table";
import type { Kunde } from "../entities/Kunde";
import CustomerForm, { CustomerFormValues } from "../components/CustomerForm";
import { useCustomers } from "../hooks/useCustomers";

interface KundenPageProps{
  title?: string;
}

export default function KundenPage({ title = "Kunden" }: KundenPageProps){
  const { items, add, edit, remove } = useCustomers();
  const [mode, setMode] = useState<"list"|"create"|"edit">("list");
  const [current, setCurrent] = useState<Kunde | null>(null);

  const columns = useMemo(()=>([
    { key: "name", header: "Name" },
    { key: "email", header: "E-Mail" },
    { key: "ort", header: "Ort" },
    { key: "id", header: "Aktionen", render: (row: Kunde) => (
        <div style={{display:"flex", gap:8}}>
          <button onClick={()=>{ setCurrent(row); setMode("edit"); }}>Bearbeiten</button>
          <button onClick={()=>{ if(confirm("Diesen Kunden wirklich löschen?")) remove(row.id); }}>Löschen</button>
        </div>
      ) 
    }
  ]), [remove]);

  function handleCreate(values: CustomerFormValues){
    add({ name: values.name, email: values.email, ort: values.ort });
    setMode("list");
  }

  function handleEdit(values: CustomerFormValues){
    if(!current) return;
    edit(current.id, { name: values.name, email: values.email, ort: values.ort });
    setMode("list");
    setCurrent(null);
  }

  return (
    <>
      {mode === "list" && (
        <>
          <div className="card" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <h2 style={{margin:"0 0 4px 0"}}>{title}</h2>
              <div style={{opacity:.7}}>Verwalte deine Kunden. Daten werden lokal gespeichert.</div>
            </div>
            <button onClick={()=>setMode("create")}>Neuer Kunde</button>
          </div>
          <Table<Kunde>
            columns={columns as any}
            data={items}
            emptyMessage="Noch keine Kunden angelegt."
          />
        </>
      )}

      {mode === "create" && (
        <CustomerForm
          onSubmit={handleCreate}
          onCancel={()=>setMode("list")}
          submitLabel="Anlegen"
        />
      )}

      {mode === "edit" && current && (
        <CustomerForm
          initial={{ name: current.name, email: current.email, ort: current.ort }}
          onSubmit={handleEdit}
          onCancel={()=>{ setMode("list"); setCurrent(null); }}
          submitLabel="Aktualisieren"
        />
      )}
    </>
  );
}
