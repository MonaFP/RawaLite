import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { ThemeColor, NavigationMode, DesignSettings, CustomColorSettings } from '../lib/settings';
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

  const updateTheme = async (theme: ThemeColor, customColors?: CustomColorSettings): Promise<void> => {
    try {
      setApplying(true);
      console.log('🎨 Updating theme to:', theme, customColors ? 'with custom colors' : '');
      
      // Apply theme immediately for instant visual feedback
      applyThemeToDocument(theme, customColors);
      
      // Update settings in database with current navigation mode preserved
      const updatedSettings = {
        ...settings,
        designSettings: {
          theme,
          navigationMode: settings.designSettings?.navigationMode || 'sidebar',
          customColors: customColors
        }
      };
      
      console.log('💾 Saving theme to database:', updatedSettings.designSettings);
      
      // Store design settings as JSON string in company data
      const companyDataWithDesign = {
        ...settings.companyData,
        designSettings: JSON.stringify(updatedSettings.designSettings)
      };
      
      await updateCompanyData(companyDataWithDesign);
      console.log('✅ Theme successfully updated and saved');
    } catch (err) {
      console.error('❌ Error updating theme:', err);
      // Rollback on error
      if (settings.designSettings) {
        console.log('🔄 Rolling back theme due to error');
        applyThemeToDocument(settings.designSettings.theme, settings.designSettings.customColors);
      }
      throw err;
    } finally {
      setApplying(false);
    }
  };

  const updateNavigationMode = async (navigationMode: NavigationMode): Promise<void> => {
    try {
      setApplying(true);
      console.log('🧭 Updating navigation mode to:', navigationMode);
      
      // Apply navigation mode immediately
      applyNavigationMode(navigationMode);
      
      // Update settings in database with current theme preserved
      const updatedSettings = {
        ...settings,
        designSettings: {
          theme: settings.designSettings?.theme || 'salbeigrün',
          navigationMode,
          customColors: settings.designSettings?.customColors
        }
      };
      
      console.log('💾 Saving navigation mode to database:', updatedSettings.designSettings);
      
      const companyDataWithDesign = {
        ...settings.companyData,
        designSettings: JSON.stringify(updatedSettings.designSettings)
      };
      
      await updateCompanyData(companyDataWithDesign);
      console.log('✅ Navigation mode successfully updated and saved');
    } catch (err) {
      console.error('❌ Error updating navigation mode:', err);
      // Rollback on error
      if (settings.designSettings) {
        console.log('🔄 Rolling back navigation mode due to error');
        applyNavigationMode(settings.designSettings.navigationMode);
      }
      throw err;
    } finally {
      setApplying(false);
    }
  };

  const currentTheme = settings.designSettings?.theme || 'salbeigrün';
  const currentNavigationMode = settings.designSettings?.navigationMode || 'sidebar';
  const currentCustomColors = settings.designSettings?.customColors;
  const currentThemeDefinition = getTheme(currentTheme, currentCustomColors);

  return {
    // Current state
    designSettings: settings.designSettings,
    currentTheme,
    currentNavigationMode,
    currentCustomColors,
    currentThemeDefinition,
    
    // Status
    loading: loading || applying,
    error,
    
    // Actions
    updateTheme,
    updateNavigationMode
  };
}
