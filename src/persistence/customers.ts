import { Kunde } from "../entities/Kunde";

const LS_KEY = "rawalite.customers";

function read(): Kunde[]{
  try{
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Kunde[]) : [];
  }catch{
    return [];
  }
}

function write(list: Kunde[]): void{
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function listCustomers(): Kunde[]{
  return read().sort((a,b)=>a.name.localeCompare(b.name));
}

export function getCustomer(id: string): Kunde | undefined{
  return read().find(c=>c.id===id);
}

export function createCustomer(input: Omit<Kunde,"id"|"createdAt"|"updatedAt">): Kunde{
  const now = new Date().toISOString();
  const item: Kunde = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  const list = read();
  list.push(item);
  write(list);
  return item;
}

export function updateCustomer(id: string, patch: Partial<Omit<Kunde,"id"|"createdAt">>): Kunde | undefined{
  const list = read();
  const idx = list.findIndex(c=>c.id===id);
  if(idx === -1) return undefined;
  const updated: Kunde = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  write(list);
  return updated;
}

export function deleteCustomer(id: string): boolean{
  const list = read();
  const next = list.filter(c=>c.id!==id);
  const changed = next.length !== list.length;
  if(changed) write(next);
  return changed;
}
