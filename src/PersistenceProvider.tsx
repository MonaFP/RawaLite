import React, { createContext } from 'react';

export const PersistenceContext = createContext<{ adapter?: 'sqlite' | 'indexeddb' }>({});

export const PersistenceProvider: React.FC<{ adapter?: 'sqlite' | 'indexeddb'; children: React.ReactNode }> = ({ adapter = 'indexeddb', children }) => {
  return <PersistenceContext.Provider value={{ adapter }}>{children}</PersistenceContext.Provider>;
};
