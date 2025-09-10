import React from "react";

interface DashboardPageProps{
  title?: string;
}

export default function DashboardPage({ title = "Dashboard" }: DashboardPageProps){
  return (
    <div className="card">
      <h2 style={{marginTop:0}}>{title}</h2>
      <p>Willkommen in RaWaLite. Wähle links einen Bereich aus.</p>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12}}>
        <div className="card"><strong>Kunden</strong><div style={{opacity:.7}}>Übersicht deiner Kunden.</div></div>
        <div className="card"><strong>Angebote</strong><div style={{opacity:.7}}>Letzte 5 Angebote.</div></div>
        <div className="card"><strong>Rechnungen</strong><div style={{opacity:.7}}>Offene & bezahlt.</div></div>
      </div>
    </div>
  );
}
