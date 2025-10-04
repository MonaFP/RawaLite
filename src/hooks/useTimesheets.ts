// useTimesheets Hook - Database-Hook für Timesheet-Management
import { useState, useEffect } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import type { Timesheet } from '../persistence/adapter';

export const useTimesheets = () => {
  const { adapter, ready } = usePersistence();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Load timesheets from database
  useEffect(() => {
    if (!ready || !adapter) return;
    
    let active = true;
    const loadTimesheets = async () => {
      try {
        setLoading(true);
        const data = await adapter.listTimesheets();
        if (active) {
          setTimesheets(data);
          setError(undefined);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load timesheets');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTimesheets();
    return () => { active = false; };
  }, [ready, adapter]);

  const createTimesheet = async (data: Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      // Generate timesheet number if not provided
      const timesheetNumber = data.timesheetNumber || await generateTimesheetNumber();
      
      const newTimesheet = await adapter.createTimesheet({
        ...data,
        timesheetNumber
      });
      
      setTimesheets(prev => [...prev, newTimesheet]);
      setError(undefined);
      return newTimesheet;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateTimesheet = async (id: number, data: Partial<Timesheet>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      const updatedTimesheet = await adapter.updateTimesheet(id, data);
      
      setTimesheets(prev => prev.map(timesheet => 
        timesheet.id === id ? updatedTimesheet : timesheet
      ));
      
      setError(undefined);
      return updatedTimesheet;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteTimesheet = async (id: number) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      await adapter.deleteTimesheet(id);
      setTimesheets(prev => prev.filter(timesheet => timesheet.id !== id));
      setError(undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const duplicateTimesheet = async (id: number, newTitle?: string) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      const original = await adapter.getTimesheet(id);
      if (!original) throw new Error('Timesheet not found');

      const timesheetNumber = await generateTimesheetNumber();
      
      // Reset activity IDs since they'll be new records
      const activities = original.activities.map(activity => ({
        ...activity,
        id: 0, // Will be set by database
        timesheetId: 0 // Will be set by database
      }));

      const duplicatedTimesheet = await adapter.createTimesheet({
        ...original,
        timesheetNumber,
        title: newTitle || `${original.title} (Kopie)`,
        status: 'draft',
        activities,
        sentAt: undefined,
        acceptedAt: undefined,
        rejectedAt: undefined
      });
      
      setTimesheets(prev => [...prev, duplicatedTimesheet]);
      setError(undefined);
      return duplicatedTimesheet;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to duplicate timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Generate next timesheet number using numbering circle system
  const generateTimesheetNumber = async (): Promise<string> => {
    try {
      // Use the official numbering circle system via electronAPI
      // @ts-ignore - nummernkreis API exists but not in type definitions yet
      const result = await window.electronAPI?.nummernkreis?.getNext('timesheets');
      
      if (result?.success && result.data) {
        return result.data;
      } else {
        // Fallback to manual generation if numbering circle fails
        console.warn('Numbering circle failed, using fallback:', result?.error);
        return generateFallbackNumber();
      }
    } catch (error) {
      console.warn('Error accessing numbering circle, using fallback:', error);
      return generateFallbackNumber();
    }
  };

  // Fallback number generation (only if numbering circle fails)
  const generateFallbackNumber = (): string => {
    const year = new Date().getFullYear();
    
    // Find highest number for current year
    const currentYearTimesheets = timesheets.filter(t => 
      t.timesheetNumber.startsWith(`LN-`)
    );
    
    let maxNumber = 0;
    currentYearTimesheets.forEach(timesheet => {
      // Handle both old format (LN-YYYY-NNNN) and new format (LN-NNNN)
      const match = timesheet.timesheetNumber.match(/LN-(?:\d{4}-)?(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `LN-${nextNumber.toString().padStart(4, '0')}`;
  };

  return { 
    timesheets, 
    loading, 
    error, 
    createTimesheet, 
    updateTimesheet, 
    deleteTimesheet,
    duplicateTimesheet
  };
};