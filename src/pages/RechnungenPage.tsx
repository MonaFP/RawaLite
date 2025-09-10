import React from "react";
import { Table } from "../components/Table";

interface RechnungenPageProps{
  title?: string;
}

type RechnungRow = {
  nummer: string;
  kunde: string;
  datum: string;
  status: string;
  betrag: string;
};

export default function RechnungenPage({ title = "Rechnungen" }: RechnungenPageProps){
  const rows: RechnungRow[] = [];
  return (
    <>
      <div className="card">
        <h2 style={{marginTop:0}}>{title}</h2>
        <p>Verwalte deine Rechnungen und Status.</p>
      </div>
      <Table<RechnungRow>
        columns={[
          { key: "nummer", header: "Rechnungs-Nr." },
          { key: "kunde", header: "Kunde" },
          { key: "datum", header: "Datum" },
          { key: "status", header: "Status" },
          { key: "betrag", header: "Betrag" },
        ]}
        data={rows}
        emptyMessage="Keine Rechnungen vorhanden."
      />
    </>
  );
}
