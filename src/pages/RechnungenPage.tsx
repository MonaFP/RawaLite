import React from 'react';
import Header from '@components/Header';
import { usePersistence } from '../contexts/PersistenceContext';

const RechnungenPage: React.FC = () => {
  const { counters, settings, getNextId, toggleKleinunternehmer } = usePersistence();

  const nextInvoiceId = `${String((counters.invoices ?? 0) + 1).padStart(3,'0')}`;

  return (
    <div>
      <Header title="Rechnungen" right={<button className="btn" onClick={()=>alert('Erstellen folgt…')}>Neu</button>} />
      <div className="card">
        <p>Nächste Rechnungsnummer (Vorschau): <strong>RE-{nextInvoiceId}</strong></p>
        <label style={{display:'flex', gap:8, alignItems:'center', marginTop:8}}>
          <input type="checkbox" checked={!!settings.kleinunternehmer} onChange={e=>toggleKleinunternehmer(e.target.checked)} />
          §19 UStG (Kleinunternehmerregelung) aktiv
        </label>
        <p style={{color:'#666', marginTop:8}}>
          {settings.kleinunternehmer
            ? 'MwSt wird in Rechnungen ausgeblendet und nicht berechnet.'
            : 'MwSt wird in Rechnungen ausgewiesen und berechnet (später in der Logik).'
          }
        </p>
      </div>
    </div>
  );
};

export default RechnungenPage;