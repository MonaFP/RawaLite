import React, { createContext } from 'react';

export type customer = { id: string; Name: string; Adresse: string };

export const DomainContext = createContext<{ customernService: { list: () => customer[] } }>({
  customernService: { list: () => [] }
});
