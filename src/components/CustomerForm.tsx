import React, { useEffect, useState } from "react";
import type { Customer } from "../persistence/adapter";

export interface CustomerFormValues{
  name: string;
  email?: string;
  ort?: string;
}

export interface CustomerFormProps{
  initial?: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function CustomerForm({ initial, onSubmit, onCancel, submitLabel = "Speichern" }: CustomerFormProps){
  const [values, setValues] = useState<CustomerFormValues>(initial ?? { name: "" });

  useEffect(()=>{ setValues(initial ?? { name: "" }); }, [initial]);

  function change<K extends keyof CustomerFormValues>(key: K, v: CustomerFormValues[K]){
    setValues(prev => ({ ...prev, [key]: v }));
  }

  function handleSubmit(e: React.FormEvent){
    e.preventDefault();
    if(!values.name || values.name.trim().length < 2){
      alert("Bitte einen gültigen Namen angeben (min. 2 Zeichen).");
      return;
    }
    onSubmit({ name: values.name.trim(), email: values.email?.trim() || undefined, ort: values.ort?.trim() || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{display:"grid", gap:12, maxWidth:680}}>
      <div style={{display:"grid", gap:6}}>
        <label>Name*</label>
        <input value={values.name} onChange={e=>change("name", e.target.value)} placeholder="Max Mustermann" />
      </div>
      <div style={{display:"grid", gap:6}}>
        <label>E-Mail</label>
        <input value={values.email ?? ""} onChange={e=>change("email", e.target.value)} placeholder="max@example.com" />
      </div>
      <div style={{display:"grid", gap:6}}>
        <label>Ort</label>
        <input value={values.ort ?? ""} onChange={e=>change("ort", e.target.value)} placeholder="Berlin" />
      </div>
      <div style={{display:"flex", gap:8}}>
        <button type="submit">{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel}>Abbrechen</button>}
      </div>
      <style>{`
        input, button { 
          background: rgba(255,255,255,.06); 
          color: white; border: 1px solid rgba(255,255,255,.15); 
          padding: 10px 12px; border-radius: 10px; 
        }
        input:focus{ outline: 2px solid rgba(96,165,250,.5) }
        button{ cursor:pointer }
      `}</style>
    </form>
  );
}
