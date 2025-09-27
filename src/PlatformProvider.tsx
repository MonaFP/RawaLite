import { createContext , ReactNode } from 'react';

export const PlatformContext = createContext<{ os?: string }>({});

export const PlatformProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <PlatformContext.Provider value={{ os: 'windows' }}>{children}</PlatformContext.Provider>;
};


