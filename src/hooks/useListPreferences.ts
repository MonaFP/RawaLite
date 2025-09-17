/**
 * RawaLite - useListPreferences Hook
 * Zentraler Hook für persistierbare Listen-Einstellungen mit optimistic updates
 */
import { useState, useEffect, useCallback } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import { handleError } from '../lib/errors';
import type { 
  EntityKey, 
  ListPreference, 
  ListPreferences
} from '../lib/listPreferences';
import { 
  defaultListPreferences,
  mergeWithDefaults 
} from '../lib/listPreferences';

interface UseListPreferencesReturn {
  preferences: ListPreference;
  loading: boolean;
  error: string | null;
  updatePreference: (patch: Partial<ListPreference>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  saveAsDefault: () => Promise<void>;
}

export function useListPreferences(entity: EntityKey): UseListPreferencesReturn {
  const { adapter } = usePersistence();
  
  const [preferences, setPreferences] = useState<ListPreference>(defaultListPreferences[entity]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from database
  const loadPreferences = useCallback(async () => {
    if (!adapter) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const allPrefs = await adapter.getListPreferences();
      const entityPrefs = allPrefs[entity];
      
      // Merge with defaults für backward compatibility
      const merged = mergeWithDefaults(entity, entityPrefs);
      setPreferences(merged);
      
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error(`Error loading preferences for ${entity}:`, appError);
      
      // Fallback auf Defaults bei Fehler
      setPreferences(defaultListPreferences[entity]);
    } finally {
      setLoading(false);
    }
  }, [adapter, entity]);

  // Initial load
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Update preference (optimistic update + persistence)
  const updatePreference = useCallback(async (patch: Partial<ListPreference>) => {
    if (!adapter) {
      throw new Error('Adapter not available');
    }

    // Optimistic update
    const previousPrefs = preferences;
    const newPrefs = { ...preferences, ...patch };
    setPreferences(newPrefs);
    setError(null);

    try {
      // Persist to database
      await adapter.updateListPreference(entity, patch);
      
    } catch (err) {
      // Rollback bei Fehler
      setPreferences(previousPrefs);
      
      const appError = handleError(err);
      setError(appError.message);
      console.error(`Error updating preferences for ${entity}:`, appError);
      throw appError;
    }
  }, [adapter, entity, preferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    const defaults = defaultListPreferences[entity];
    await updatePreference(defaults);
  }, [entity, updatePreference]);

  // Save current settings as default (alias for better UX)
  const saveAsDefault = useCallback(async () => {
    // Aktuell wird bereits automatisch gespeichert bei updatePreference
    // Diese Methode ist für UI-Feedback da
    if (!adapter) {
      throw new Error('Adapter not available');
    }

    try {
      await adapter.updateListPreference(entity, preferences);
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      throw appError;
    }
  }, [adapter, entity, preferences]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    resetToDefaults,
    saveAsDefault
  };
}

// Hook für mehrere Entitäten gleichzeitig (optional, für Settings-Page)
export function useAllListPreferences() {
  const { adapter } = usePersistence();
  
  const [allPreferences, setAllPreferences] = useState<ListPreferences>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllPreferences = useCallback(async () => {
    if (!adapter) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const prefs = await adapter.getListPreferences();
      setAllPreferences(prefs);
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error loading all preferences:', appError);
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    loadAllPreferences();
  }, [loadAllPreferences]);

  const resetAllToDefaults = useCallback(async () => {
    if (!adapter) {
      throw new Error('Adapter not available');
    }

    try {
      await adapter.setListPreferences({});
      setAllPreferences({});
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      throw appError;
    }
  }, [adapter]);

  return {
    allPreferences,
    loading,
    error,
    resetAllToDefaults,
    refresh: loadAllPreferences
  };
}