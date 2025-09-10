import { useState, useEffect } from 'react';
import type { Settings, CompanyData, NumberingCircle } from '../lib/settings';
import { defaultSettings } from '../lib/settings';

const SETTINGS_STORAGE_KEY = 'rawalite-settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        setSettings({
          ...defaultSettings,
          ...parsedSettings,
          companyData: {
            ...defaultSettings.companyData,
            ...parsedSettings.companyData
          },
          numberingCircles: parsedSettings.numberingCircles || defaultSettings.numberingCircles
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = async (newSettings: Settings) => {
    try {
      setLoading(true);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      setError(null);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Fehler beim Speichern der Einstellungen');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyData = async (companyData: CompanyData) => {
    const newSettings = { ...settings, companyData };
    await saveSettings(newSettings);
  };

  const updateNumberingCircles = async (numberingCircles: NumberingCircle[]) => {
    const newSettings = { ...settings, numberingCircles };
    await saveSettings(newSettings);
  };

  const getNextNumber = (circleId: string): string => {
    const circle = settings.numberingCircles.find(c => c.id === circleId);
    if (!circle) {
      throw new Error(`Nummernkreis '${circleId}' nicht gefunden`);
    }

    const currentYear = new Date().getFullYear();
    let newCurrent = circle.current + 1;

    // Check if we need to reset for yearly numbering
    if (circle.resetMode === 'yearly' && circle.lastResetYear !== currentYear) {
      newCurrent = 1;
    }

    // Update the circle
    const updatedCircles = settings.numberingCircles.map(c => 
      c.id === circleId 
        ? { ...c, current: newCurrent, lastResetYear: currentYear }
        : c
    );

    // Save immediately
    saveSettings({ ...settings, numberingCircles: updatedCircles });

    return `${circle.prefix}${newCurrent.toString().padStart(circle.digits, '0')}`;
  };

  return {
    settings,
    loading,
    error,
    updateCompanyData,
    updateNumberingCircles,
    getNextNumber,
    saveSettings
  };
}
