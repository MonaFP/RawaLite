import React from "react";
import { Table } from "../components/Table";

interface AngebotePageProps{
  title?: string;
}

type AngebotRow = {
  nummer: string;
  kunde: string;
  datum: string;
  betrag: string;
};

export default function AngebotePage({ title = "Angebote" }: AngebotePageProps){
  const rows: AngebotRow[] = [];
  return (
    <>
      <div className="card">
        <h2 style={{marginTop:0}}>{title}</h2>
        <p>Liste deiner Angebote. (Nummernkreis folgt per Service)</p>
      </div>
      <Table<AngebotRow>
        columns={[
          { key: "nummer", header: "Angebots-Nr." },
          { key: "kunde", header: "Kunde" },
          { key: "datum", header: "Datum" },
          { key: "betrag", header: "Betrag" },
        ]}
        data={rows}
        emptyMessage="Keine Angebote vorhanden."
      />
    </>
  );
}
