import React, { useState } from 'react';
import Header from '@components/Header';
import Table from '@components/Table';
import { usePersistence } from '../contexts/PersistenceContext';

const KundenPage: React.FC = () => {
  const { listCustomers, addCustomer, deleteCustomer } = usePersistence();
  const [form, setForm] = useState({ Name: '', Adresse: '' });

  const data = listCustomers();

  return (
    <div>
      <Header title="Kunden" right={<button className="btn" onClick={() => {
        if (!form.Name.trim()) { alert('Name eingeben'); return; }
        addCustomer({ Name: form.Name, Adresse: form.Adresse });
        setForm({ Name: '', Adresse: '' });
      }}>Anlegen</button>} />
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'flex', gap:8}}>
          <input placeholder="Name" value={form.Name} onChange={e=>setForm(f=>({...f, Name:e.target.value}))} />
          <input placeholder="Adresse" value={form.Adresse} onChange={e=>setForm(f=>({...f, Adresse:e.target.value}))} />
        </div>
      </div>
      <div className="card">
        <Table data={data} columns={['id','Name','Adresse']} />
        <div style={{marginTop:8}}>
          <small className="badge">Total: {data.length}</small>
        </div>
        <div style={{marginTop:8}}>
          <button className="btn" onClick={()=>{
            if(data.length===0){alert('Keine Kunden'); return;}
            const last = data[data.length-1];
            deleteCustomer(last.id);
          }}>Letzten löschen</button>
        </div>
      </div>
    </div>
  );
};

export default KundenPage;