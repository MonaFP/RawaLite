import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { ThemeColor, NavigationMode, DesignSettings } from '../lib/settings';
import { applyThemeToDocument, applyNavigationMode, getTheme } from '../lib/themes';

export function useDesignSettings() {
  const { settings, loading, error, updateCompanyData } = useSettings();
  const [applying, setApplying] = useState(false);

  // Apply theme nur wenn Settings sich AKTIV ändern (nicht beim ersten Laden)
  useEffect(() => {
    if (!loading && settings.designSettings) {
      // Nur anwenden wenn es sich um eine Änderung handelt, nicht beim ersten Laden
      // Der SettingsContext kümmert sich bereits um die initiale Anwendung
      console.log('🔄 Design settings changed in useDesignSettings:', settings.designSettings);
    }
  }, [settings.designSettings, loading]);

  const updateTheme = async (theme: ThemeColor): Promise<void> => {
    try {
      setApplying(true);
      
      // Apply theme immediately for instant visual feedback
      applyThemeToDocument(theme);
      
      // Update settings in database
      const updatedSettings = {
        ...settings,
        designSettings: {
          ...settings.designSettings,
          theme
        }
      };
      
      // For now, we store design settings in SQLite as part of company data
      // This is a pragmatic approach that works with the existing SettingsAdapter
      const companyDataWithDesign = {
        ...settings.companyData,
        // Store design settings as JSON string in a custom field
        designSettings: JSON.stringify(updatedSettings.designSettings)
      };
      
      await updateCompanyData(companyDataWithDesign);
    } catch (err) {
      console.error('Error updating theme:', err);
      // Rollback on error
      if (settings.designSettings) {
        applyThemeToDocument(settings.designSettings.theme);
      }
      throw err;
    } finally {
      setApplying(false);
    }
  };

  const updateNavigationMode = async (navigationMode: NavigationMode): Promise<void> => {
    try {
      setApplying(true);
      
      // Apply navigation mode immediately
      applyNavigationMode(navigationMode);
      
      // Update settings in database
      const updatedSettings = {
        ...settings,
        designSettings: {
          ...settings.designSettings,
          navigationMode
        }
      };
      
      const companyDataWithDesign = {
        ...settings.companyData,
        designSettings: JSON.stringify(updatedSettings.designSettings)
      };
      
      await updateCompanyData(companyDataWithDesign);
    } catch (err) {
      console.error('Error updating navigation mode:', err);
      // Rollback on error
      if (settings.designSettings) {
        applyNavigationMode(settings.designSettings.navigationMode);
      }
      throw err;
    } finally {
      setApplying(false);
    }
  };

  const currentTheme = settings.designSettings?.theme || 'green';
  const currentNavigationMode = settings.designSettings?.navigationMode || 'sidebar';
  const currentThemeDefinition = getTheme(currentTheme);

  return {
    // Current state
    designSettings: settings.designSettings,
    currentTheme,
    currentNavigationMode,
    currentThemeDefinition,
    
    // Status
    loading: loading || applying,
    error,
    
    // Actions
    updateTheme,
    updateNavigationMode
  };
}
