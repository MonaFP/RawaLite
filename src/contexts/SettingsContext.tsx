import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SettingsAdapter } from '../adapters/SettingsAdapter';
import type { Settings, CompanyData, NumberingCircle } from '../lib/settings';
import { defaultSettings } from '../lib/settings';
import { applyThemeToDocument, applyNavigationMode } from '../lib/themes';

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  error: string | null;
  updateCompanyData: (companyData: CompanyData) => Promise<void>;
  updateNumberingCircles: (numberingCircles: NumberingCircle[]) => Promise<void>;
  getNextNumber: (circleId: string) => Promise<string>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const settingsAdapter = new SettingsAdapter();

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading settings from SQLite...');
      const loadedSettings = await settingsAdapter.getSettings();
      setSettings(loadedSettings);
      
      // ✨ SOFORT Design-Einstellungen anwenden beim Laden (KRITISCH für Reload-Persistierung)
      if (loadedSettings.designSettings) {
        console.log('🎨 Applying persisted design settings:', loadedSettings.designSettings);
        applyThemeToDocument(loadedSettings.designSettings.theme, loadedSettings.designSettings.customColors);
        applyNavigationMode(loadedSettings.designSettings.navigationMode);
      } else {
        // ✨ Fallback zu Standard-Einstellungen wenn keine persistierten Settings vorhanden
        console.warn('⚠️ No persisted design settings found - applying defaults');
        applyThemeToDocument('salbeigrün');
        applyNavigationMode('sidebar');
      }
      
      setError(null);
      console.log('✅ Settings loaded and applied successfully');
    } catch (err) {
      console.error('❌ Error loading settings from SQLite:', err);
      setError('Fehler beim Laden der Einstellungen');
      
      // ✨ Selbst bei Fehler Standard-Theme anwenden
      console.log('🎨 Applying fallback design settings due to error');
      applyThemeToDocument('salbeigrün');
      applyNavigationMode('sidebar');
    } finally {
      setLoading(false);
    }
  };

  // Initial load + Design-Settings anwenden
  useEffect(() => {
    refreshSettings();
  }, []);

  const updateCompanyData = async (companyData: CompanyData) => {
    try {
      setLoading(true);
      console.log('💾 Saving company data (including design settings)...');
      await settingsAdapter.updateCompanyData(companyData);
      
      // ✨ KRITISCH: Nach dem Speichern sofort Settings neu laden für Persistierung
      console.log('🔄 Refreshing settings after company data update...');
      await refreshSettings();
      console.log('✅ Company data saved and settings refreshed');
    } catch (err) {
      console.error('❌ Error saving company data:', err);
      setError('Fehler beim Speichern der Unternehmensdaten');
      throw err;
    }
  };

  const updateNumberingCircles = async (numberingCircles: NumberingCircle[]) => {
    try {
      setLoading(true);
      await settingsAdapter.updateNumberingCircles(numberingCircles);
      await refreshSettings();
      setError(null);
    } catch (err) {
      console.error('Error saving numbering circles:', err);
      setError('Fehler beim Speichern der Nummernkreise');
      throw err;
    }
  };

  const getNextNumber = async (circleId: string): Promise<string> => {
    try {
      const nextNumber = await settingsAdapter.getNextNumber(circleId);
      await refreshSettings();
      return nextNumber;
    } catch (err) {
      console.error('Error getting next number:', err);
      throw err;
    }
  };

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    updateCompanyData,
    updateNumberingCircles,
    getNextNumber,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
