import {createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import type { Settings, CompanyData, NumberingCircle } from '../lib/settings';
import { mapSQLiteToOldSettings, mapCompanyDataToSQLiteSettings } from '../lib/settings-mapper';
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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    companyData: {
      name: 'RawaLite',
      street: '',
      postalCode: '',
      city: '',
      phone: '',
      email: '',
      website: '',
      taxNumber: '',
      vatId: '',
      kleinunternehmer: false,
      bankName: '',
      bankAccount: '',
      bankBic: '',
      logo: ''
    },
    numberingCircles: [],
    designSettings: {
      theme: 'salbeigrün',
      navigationMode: 'sidebar',
      customColors: undefined,
      logoSettings: {}
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { adapter, ready } = usePersistence();

  const refreshSettings = async () => {
    if (!adapter || !ready) {
      console.warn('⚠️ [SettingsContext] Adapter not ready yet');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Loading settings from new SQLiteAdapter...');
      const sqliteSettings = await adapter.getSettings();
      const mappedSettings = mapSQLiteToOldSettings(sqliteSettings);
      setSettings(mappedSettings);
      
      // ✨ SOFORT Standard Design-Einstellungen anwenden (ohne designSettings)
      // TODO: Design-Persistenz später implementieren als separates System
      console.warn('⚠️ No persisted design settings found - applying defaults');
      applyThemeToDocument('salbeigrün');
      applyNavigationMode('sidebar');
      
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
    if (adapter && ready) {
      refreshSettings();
    }
  }, [adapter, ready]);

  const updateCompanyData = async (companyData: CompanyData) => {
    if (!adapter) {
      console.error('❌ Adapter not ready');
      return;
    }
    
    try {
      setLoading(true);
      console.log('💾 Saving company data...');
      const sqlitePatch = mapCompanyDataToSQLiteSettings(companyData);
      await adapter.updateSettings(sqlitePatch);
      
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
    console.warn('🚧 updateNumberingCircles not implemented in new adapter yet');
    console.log('Received numbering circles:', numberingCircles.length); // Use parameter to avoid lint error
    // TODO: Implement numbering circles in SQLite schema
    setError(null);
  };

  const getNextNumber = async (circleId: string): Promise<string> => {
    console.warn('🚧 getNextNumber not implemented in new adapter yet');
    console.log('Requested number for circle:', circleId); // Use parameter to avoid lint error
    // TODO: Implement numbering system in SQLite schema
    return '0001'; // Fallback number
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

