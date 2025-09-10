import { useState, useEffect } from 'react';
import { SettingsAdapter } from '../adapters/SettingsAdapter';
import type { Settings, CompanyData, NumberingCircle } from '../lib/settings';
import { defaultSettings } from '../lib/settings';

const settingsAdapter = new SettingsAdapter();

export function useUnifiedSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from SQLite
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const loadedSettings = await settingsAdapter.getSettings();
        setSettings(loadedSettings);
        setError(null);
      } catch (err) {
        console.error('Error loading settings from SQLite:', err);
        setError('Fehler beim Laden der Einstellungen');
        // Keep default settings as fallback
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const updateCompanyData = async (companyData: CompanyData) => {
    try {
      setLoading(true);
      await settingsAdapter.updateCompanyData(companyData);
      
      // Force reload from database to ensure we have the latest data
      const freshSettings = await settingsAdapter.getSettings();
      setSettings(freshSettings);
      setError(null);
    } catch (err) {
      console.error('Error saving company data:', err);
      setError('Fehler beim Speichern der Unternehmensdaten');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateNumberingCircles = async (numberingCircles: NumberingCircle[]) => {
    try {
      setLoading(true);
      await settingsAdapter.updateNumberingCircles(numberingCircles);
      setSettings(prev => ({ ...prev, numberingCircles }));
      setError(null);
    } catch (err) {
      console.error('Error saving numbering circles:', err);
      setError('Fehler beim Speichern der Nummernkreise');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getNextNumber = async (circleId: string): Promise<string> => {
    try {
      const nextNumber = await settingsAdapter.getNextNumber(circleId);
      // Reload settings to get updated numbering circles
      const updatedSettings = await settingsAdapter.getSettings();
      setSettings(updatedSettings);
      return nextNumber;
    } catch (err) {
      console.error('Error getting next number:', err);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateCompanyData,
    updateNumberingCircles,
    getNextNumber
  };
}
