export interface Kunde {
  id: string;
  name: string;
  adresse: string;
  // ... 
}

export class KundeEntity {
  static create(data: Omit<Kunde, 'id'>): Kunde {
    return { id: crypto.randomUUID(), ...data };
  }
}