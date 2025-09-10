import React from "react";
import { Table } from "../components/Table";

interface PaketePageProps{
  title?: string;
}

type PaketRow = {
  bezeichnung: string;
  preis: string;
  einheit: string;
};

export default function PaketePage({ title = "Pakete" }: PaketePageProps){
  const rows: PaketRow[] = [];
  return (
    <>
      <div className="card">
        <h2 style={{marginTop:0}}>{title}</h2>
        <p>Definiere Leistungspakete, die du in Angeboten/Rechnungen verwenden kannst.</p>
      </div>
      <Table<PaketRow>
        columns={[
          { key: "bezeichnung", header: "Bezeichnung" },
          { key: "preis", header: "Preis" },
          { key: "einheit", header: "Einheit" },
        ]}
        data={rows}
        emptyMessage="Noch keine Pakete definiert."
      />
    </>
  );
}
