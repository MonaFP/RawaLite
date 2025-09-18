import type { Customer } from "./adapter";

const LS_KEY = "rawalite.customers";

function read(): Customer[]{
  try{
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Customer[]) : [];
  }catch{
    return [];
  }
}

function write(list: Customer[]): void{
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function listCustomers(): Customer[]{
  return read().sort((a,b)=>a.name.localeCompare(b.name));
}

export function getCustomer(id: number): Customer | undefined{
  return read().find(c=>c.id===id);
}

export function createCustomer(input: Omit<Customer,"id"|"createdAt"|"updatedAt">): Customer{
  const now = new Date().toISOString();
  const item: Customer = { 
    ...input, 
    id: Date.now(), // Simple ID generation 
    number: `K-${Date.now()}`,
    createdAt: now, 
    updatedAt: now 
  };
  const list = read();
  list.push(item);
  write(list);
  return item;
}

export function updateCustomer(id: number, patch: Partial<Omit<Customer,"id"|"createdAt">>): Customer | undefined{
  const list = read();
  const idx = list.findIndex(c=>c.id===id);
  if(idx === -1) return undefined;
  const updated: Customer = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  write(list);
  return updated;
}

export function deleteCustomer(id: number): boolean{
  const list = read();
  const next = list.filter(c=>c.id!==id);
  const changed = next.length !== list.length;
  if(changed) write(next);
  return changed;
}
