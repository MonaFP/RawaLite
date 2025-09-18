import { useState, useEffect } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import { DatabaseError, ValidationError, handleError } from "../lib/errors";
import type { Activity } from "../persistence/adapter";

export function useActivities() {
  const { adapter } = usePersistence();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadActivities() {
    if (!adapter) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await adapter.listActivities();
      setActivities(data);
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error loading activities:', appError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
  }, [adapter]);

  async function createActivity(activityData: Omit<Activity, "id" | "createdAt" | "updatedAt">) {
    console.log('🏗️ useActivities.createActivity called with:', activityData);
    
    if (!adapter) {
      console.error('❌ No adapter available');
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation
    if (!activityData.name?.trim()) {
      console.error('❌ Validation failed: no name');
      throw new ValidationError("Tätigkeitsname ist erforderlich", "name");
    }

    if (activityData.defaultHourlyRate < 0) {
      console.error('❌ Validation failed: negative hourly rate');
      throw new ValidationError("Stundensatz darf nicht negativ sein", "defaultHourlyRate");
    }

    setError(null);

    try {
      console.log('📡 Calling adapter.createActivity...');
      const newActivity = await adapter.createActivity(activityData);
      console.log('✅ Activity created in database:', newActivity);
      
      console.log('🔄 Reloading activities...');
      await loadActivities();
      
      console.log('✅ Activities reloaded successfully');
      return newActivity;
    } catch (err) {
      console.error('❌ Error in createActivity:', err);
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error creating activity:', appError);
      throw appError;
    }
  }

  async function updateActivity(id: number, patch: Partial<Activity>) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation for required fields if they're being updated
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new ValidationError("Tätigkeitsname ist erforderlich", "name");
    }

    if (patch.defaultHourlyRate !== undefined && patch.defaultHourlyRate < 0) {
      throw new ValidationError("Stundensatz darf nicht negativ sein", "defaultHourlyRate");
    }

    setError(null);

    try {
      const updatedActivity = await adapter.updateActivity(id, patch);
      await loadActivities();
      return updatedActivity;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error updating activity:', appError);
      throw appError;
    }
  }

  async function deleteActivity(id: number) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    setError(null);

    try {
      await adapter.deleteActivity(id);
      await loadActivities();
      return true;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error deleting activity:', appError);
      throw appError;
    }
  }

  // Helper functions
  const getActiveActivities = () => activities.filter(a => a.isActive);
  const getActivityById = (id: number) => activities.find(a => a.id === id);

  return {
    activities,
    loading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    refresh: loadActivities,
    getActiveActivities,
    getActivityById
  };
}
