import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { NumberingCircle } from '../lib/settings';

interface NumberingContextType {
  circles: NumberingCircle[];
  loading: boolean;
  error: string | null;
  refreshCircles: () => Promise<void>;
  updateCircle: (id: string, updates: Partial<NumberingCircle>) => Promise<void>;
  getNextNumber: (circleId: string) => Promise<string>;
}

const NumberingContext = createContext<NumberingContextType | undefined>(undefined);

interface NumberingProviderProps {
  children: ReactNode;
}

export function NumberingProvider({ children }: NumberingProviderProps) {
  const [circles, setCircles] = useState<NumberingCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCircles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the NummernkreisService via Electron IPC
      const result = await window.rawalite.nummernkreis.getAll();
      
      console.log('🔍 [DEBUG] NumberingContext - IPC Result:', result);
      
      if (result.success && result.data) {
        console.log('🔍 [DEBUG] NumberingContext - Setting circles:', result.data.length, 'circles');
        console.log('🔍 [DEBUG] NumberingContext - Circle IDs:', result.data.map(c => c.id));
        setCircles(result.data);
      } else {
        throw new Error(result.error || 'Failed to load numbering circles');
      }
    } catch (err) {
      console.error('Error loading numbering circles:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateCircle = async (id: string, updates: Partial<NumberingCircle>) => {
    try {
      setError(null);
      
      // Find the current circle
      const currentCircle = circles.find(c => c.id === id);
      if (!currentCircle) {
        throw new Error(`Numbering circle with id '${id}' not found`);
      }

      // Merge updates
      const updatedCircle = { ...currentCircle, ...updates };
      
      // Call the NummernkreisService via Electron IPC
      const result = await window.rawalite.nummernkreis.update(id, updatedCircle);
      
      if (result.success) {
        // Update local state
        setCircles(prev => prev.map(c => c.id === id ? updatedCircle : c));
      } else {
        throw new Error(result.error || 'Failed to update numbering circle');
      }
    } catch (err) {
      console.error('Error updating numbering circle:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const getNextNumber = async (circleId: string): Promise<string> => {
    try {
      setError(null);
      
      // Call the NummernkreisService via Electron IPC
      const result = await window.rawalite.nummernkreis.getNext(circleId);
      
      if (result.success && result.data !== undefined) {
        // Refresh circles to get updated current number
        await refreshCircles();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get next number');
      }
    } catch (err) {
      console.error('Error getting next number:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  // Load circles on mount
  useEffect(() => {
    refreshCircles();
  }, []);

  const value: NumberingContextType = {
    circles,
    loading,
    error,
    refreshCircles,
    updateCircle,
    getNextNumber
  };

  return (
    <NumberingContext.Provider value={value}>
      {children}
    </NumberingContext.Provider>
  );
}

export function useNumbering() {
  const context = useContext(NumberingContext);
  if (context === undefined) {
    throw new Error('useNumbering must be used within a NumberingProvider');
  }
  return context;
}