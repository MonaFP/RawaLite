import React, { useState } from 'react';
import Header from '@components/Header';
import { usePersistence } from '../contexts/PersistenceContext';

const EinstellungenPage: React.FC = () => {
  const { settings, toggleKleinunternehmer } = usePersistence();
  const [companyName, setCompanyName] = useState(settings.companyName ?? 'RaWaLite');

  return (
    <div>
      <Header title="Einstellungen" />
      <div className="card">
        <div style={{display:'grid', gap:12, maxWidth:420}}>
          <label>
            <div>Unternehmensname</div>
            <input value={companyName} onChange={e=>setCompanyName(e.target.value)} />
          </label>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!settings.kleinunternehmer} onChange={e=>toggleKleinunternehmer(e.target.checked)} />
            §19 UStG (Kleinunternehmerregelung)
          </label>
          <small className="badge">Weitere Felder (Adresse, Steuernummer, Bank etc.) folgen.</small>
        </div>
      </div>
    </div>
  );
};
export default EinstellungenPage;