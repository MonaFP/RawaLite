import React, { createContext } from 'react';

export type Kunde = { id: string; Name: string; Adresse: string };

export const DomainContext = createContext<{ kundenService: { list: () => Kunde[] } }>({
  kundenService: { list: () => [] }
});
