import { useState, useEffect } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import type { Settings, CompanyData, NumberingCircle } from '../lib/settings';
import { mapSQLiteToOldSettings, mapCompanyDataToSQLiteSettings } from '../lib/settings-mapper';

export function useUnifiedSettings() {
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

  // Load settings from new SQLiteAdapter
  useEffect(() => {
    // 🎯 RACE CONDITION FIX: Only load when BOTH adapter AND ready are true
    if (!adapter || !ready) {
      return; // Early exit without warning - this is expected during initialization
    }

    async function loadSettings() {
      try {
        setLoading(true);
        // Safe to use ! assertion because we already checked adapter && ready above
        const sqliteSettings = await adapter!.getSettings();
        const mappedSettings = mapSQLiteToOldSettings(sqliteSettings);
        setSettings(mappedSettings);
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
  }, [adapter, ready]);

  const updateCompanyData = async (companyData: CompanyData) => {
    if (!adapter) {
      console.error('❌ Adapter not ready');
      return;
    }
    
    try {
      setLoading(true);
      const sqlitePatch = mapCompanyDataToSQLiteSettings(companyData);
      await adapter.updateSettings(sqlitePatch);
      
      // Force reload from database to ensure we have the latest data
      const sqliteSettings = await adapter.getSettings();
      const mappedSettings = mapSQLiteToOldSettings(sqliteSettings);
      setSettings(mappedSettings);
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
    console.warn('🚧 updateNumberingCircles not implemented in new adapter yet');
    console.log('Received numbering circles:', numberingCircles.length); // Use parameter to avoid lint error
    // TODO: Implement numbering circles in SQLite schema
    setError(null);
    setLoading(false);
  };

  const getNextNumber = async (circleId: string): Promise<string> => {
    console.warn('🚧 getNextNumber not implemented in new adapter yet');
    // TODO: Implement numbering system in SQLite schema
    
    // Fallback numbering for now
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    const prefix = circleId === 'timesheets' ? 'LN-' : 'DOC-';
    const fallbackNumber = `${prefix}${year}-${timestamp}`;
    console.warn(`Using fallback number for ${circleId}: ${fallbackNumber}`);
    return fallbackNumber;
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
