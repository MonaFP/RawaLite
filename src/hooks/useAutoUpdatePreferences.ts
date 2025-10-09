import { useState, useEffect, useCallback } from 'react';
import type { AutoUpdatePreferences } from '../types/auto-update.types';
import { useUnifiedSettings } from './useUnifiedSettings';

/**
 * Hook zur Verwaltung der Auto-Update-Einstellungen
 * Phase 2: Preferences & Settings Integration
 * 
 * Verwendet das bestehende Settings-System mit field-mapper Compliance
 */
export function useAutoUpdatePreferences() {
  const { settings, updateCompanyData } = useUnifiedSettings();
  
  const [preferences, setPreferences] = useState<AutoUpdatePreferences>({
    enabled: false,
    checkFrequency: 'startup',
    notificationStyle: 'subtle',
    reminderInterval: 4,
    autoDownload: false,
    installPrompt: 'manual'
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronisiere mit Settings bei Änderungen
  useEffect(() => {
    if (settings.companyData) {
      setPreferences({
        enabled: settings.companyData.autoUpdateEnabled ?? false,
        checkFrequency: settings.companyData.autoUpdateCheckFrequency ?? 'startup',
        notificationStyle: settings.companyData.autoUpdateNotificationStyle ?? 'subtle',
        reminderInterval: settings.companyData.autoUpdateReminderInterval ?? 4,
        autoDownload: settings.companyData.autoUpdateAutoDownload ?? false,
        installPrompt: settings.companyData.autoUpdateInstallPrompt ?? 'manual'
      });
      setLoading(false);
    }
  }, [settings.companyData]);

  const updatePreference = useCallback(async <K extends keyof AutoUpdatePreferences>(
    key: K, 
    value: AutoUpdatePreferences[K]
  ) => {
    try {
      setError(null);
      
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);

      // Speichere über das bestehende Settings-System (field-mapper compliant)
      const settingsUpdate = {
        ...settings.companyData,
        autoUpdateEnabled: updatedPrefs.enabled,
        autoUpdateCheckFrequency: updatedPrefs.checkFrequency as 'startup' | 'daily' | 'weekly',
        autoUpdateNotificationStyle: updatedPrefs.notificationStyle as 'subtle' | 'prominent',
        autoUpdateReminderInterval: updatedPrefs.reminderInterval,
        autoUpdateAutoDownload: updatedPrefs.autoDownload,
        autoUpdateInstallPrompt: updatedPrefs.installPrompt as 'immediate' | 'scheduled' | 'manual'
      };

      await updateCompanyData(settingsUpdate);
    } catch (err) {
      console.error('[AutoUpdatePreferences] Update error:', err);
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
      
      // Revert bei Fehler
      setPreferences(prev => ({ ...prev, [key]: preferences[key] }));
    }
  }, [preferences, settings.companyData, updateCompanyData]);

  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      
      const defaultPrefs: AutoUpdatePreferences = {
        enabled: false,
        checkFrequency: 'startup',
        notificationStyle: 'subtle',
        reminderInterval: 4,
        autoDownload: false,
        installPrompt: 'manual'
      };

      setPreferences(defaultPrefs);

      const settingsUpdate = {
        ...settings.companyData,
        autoUpdateEnabled: false,
        autoUpdateCheckFrequency: 'startup' as 'startup' | 'daily' | 'weekly',
        autoUpdateNotificationStyle: 'subtle' as 'subtle' | 'prominent',
        autoUpdateReminderInterval: 4,
        autoUpdateAutoDownload: false,
        autoUpdateInstallPrompt: 'manual' as 'immediate' | 'scheduled' | 'manual'
      };

      await updateCompanyData(settingsUpdate);
    } catch (err) {
      console.error('[AutoUpdatePreferences] Reset error:', err);
      setError(err instanceof Error ? err.message : 'Reset fehlgeschlagen');
    }
  }, [settings.companyData, updateCompanyData]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    resetToDefaults,
    reload: () => {} // Settings werden automatisch über useUnifiedSettings aktualisiert
  };
}