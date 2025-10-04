// useActivities Hook - Database-Hook für Activity-Management
import { useState, useEffect } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import type { Activity } from '../persistence/adapter';

export const useActivities = () => {
  const { adapter, ready } = usePersistence();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Load activities from database
  useEffect(() => {
    if (!ready || !adapter) return;
    
    let active = true;
    const loadActivities = async () => {
      try {
        setLoading(true);
        const data = await adapter.listActivities();
        if (active) {
          setActivities(data);
          setError(undefined);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load activities');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadActivities();
    return () => { active = false; };
  }, [ready, adapter]);

  const createActivity = async (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      const newActivity = await adapter.createActivity(data);
      setActivities(prev => [...prev, newActivity]);
      setError(undefined);
      return newActivity;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create activity';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = async (id: number, data: Partial<Activity>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      const updatedActivity = await adapter.updateActivity(id, data);
      setActivities(prev => prev.map(activity => 
        activity.id === id ? updatedActivity : activity
      ));
      setError(undefined);
      return updatedActivity;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update activity';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (id: number) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      await adapter.deleteActivity(id);
      setActivities(prev => prev.filter(activity => activity.id !== id));
      setError(undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete activity';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getActiveActivities = () => {
    return activities.filter(activity => activity.isActive);
  };

  return { 
    activities, 
    loading, 
    error, 
    createActivity, 
    updateActivity, 
    deleteActivity,
    getActiveActivities
  };
};