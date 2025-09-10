import React from "react";

interface EinstellungenPageProps{
  title?: string;
}

export default function EinstellungenPage({ title = "Einstellungen" }: EinstellungenPageProps){
  return (
    <div className="card">
      <h2 style={{marginTop:0}}>{title}</h2>
      <p>Unternehmensdaten, Nummernkreise, DSGVO – Inhalt folgt.</p>
    </div>
  );
}
