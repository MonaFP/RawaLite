import { useState, useEffect, useCallback } from 'react';

// Import DatabaseThemeService for direct integration
// FIX-018 Compliant: All theme operations through DatabaseThemeService
import { DatabaseThemeService, HeaderThemeConfig as DBHeaderThemeConfig } from '../services/DatabaseThemeService';

/**
 * Theme Configuration Interface
 * FIX-018 Compliant: All theme operations through DatabaseThemeService
 */
export interface HeaderThemeConfig {
  // Header Base Theme
  headerBgColor: string;
  headerTextColor: string;
  headerBorderColor: string;
  
  // Company Branding Theme
  companyNameColor: string;
  companyNameWeight: string;
  
  // Navigation Items Theme
  navItemBgColor: string;
  navItemTextColor: string;
  navItemBorderColor: string;
  navItemActiveBgColor: string;
  navItemActiveTextColor: string;
  
  // Statistics Cards Theme
  statCardBgColor: string;
  statCardBorderColor: string;
  statCardTextColor: string;
  statCardValueColor: string;
  statCardSuccessColor: string;
  statCardWarningColor: string;
  statCardDangerColor: string;
  
  // Custom Page Titles
  customTitles?: {
    dashboard?: string;
    customers?: string;
    offers?: string;
    packages?: string;
    invoices?: string;
    timesheets?: string;
    settings?: string;
  };
}

/**
 * Default Theme Configuration
 * Fallback values matching current CSS custom properties
 */
const DEFAULT_THEME_CONFIG: HeaderThemeConfig = {
  // Header Base Theme
  headerBgColor: 'var(--sidebar-bg)',
  headerTextColor: 'var(--foreground)',
  headerBorderColor: 'rgba(255,255,255,.08)',
  
  // Company Branding Theme
  companyNameColor: 'white',
  companyNameWeight: '600',
  
  // Navigation Items Theme
  navItemBgColor: 'transparent',
  navItemTextColor: 'rgba(255,255,255,0.8)',
  navItemBorderColor: 'transparent',
  navItemActiveBgColor: 'rgba(255,255,255,0.2)',
  navItemActiveTextColor: 'white',
  
  // Statistics Cards Theme
  statCardBgColor: 'rgba(255,255,255,0.1)',
  statCardBorderColor: 'rgba(255,255,255,0.2)',
  statCardTextColor: 'white',
  statCardValueColor: 'white',
  statCardSuccessColor: '#22c55e',
  statCardWarningColor: '#f59e0b',
  statCardDangerColor: '#ef4444',
};

/**
 * useTheme Hook - Database-Theme-System Integration
 * 
 * FIX-016: Database-Theme-System Schema Protection
 * FIX-017: Migration 027 Theme System Integrity
 * FIX-018: DatabaseThemeService Pattern Preservation
 * 
 * @returns Theme configuration and methods for Header components
 */
export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<HeaderThemeConfig>(DEFAULT_THEME_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load theme configuration from DatabaseThemeService
   * FIX-018 Compliant: Only DatabaseThemeService for theme operations
   */
  const loadTheme = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // FIX-018: Use DatabaseThemeService for all theme operations
      if (typeof window !== 'undefined' && window.rawalite?.themes) {
        try {
          // Use IPC to call DatabaseThemeService.getHeaderThemeConfig()
          const headerTheme = await window.rawalite.themes.getHeaderConfig('default');
          
          if (headerTheme) {
            console.log('🎨 Loaded header theme from DatabaseThemeService:', headerTheme);
            setCurrentTheme(headerTheme);
            applyThemeCSSVariables(headerTheme);
          } else {
            console.warn('⚠️ No header theme found, using default');
            setCurrentTheme(DEFAULT_THEME_CONFIG);
            applyThemeCSSVariables(DEFAULT_THEME_CONFIG);
          }
        } catch (ipcError) {
          console.warn('⚠️ IPC theme loading failed, using default:', ipcError);
          setCurrentTheme(DEFAULT_THEME_CONFIG);
          applyThemeCSSVariables(DEFAULT_THEME_CONFIG);
        }
      } else {
        console.warn('⚠️ RawaLite Theme API not available, using default theme');
        setCurrentTheme(DEFAULT_THEME_CONFIG);
        applyThemeCSSVariables(DEFAULT_THEME_CONFIG);
      }
      
    } catch (err) {
      console.error('🚨 Theme loading failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown theme error');
      
      // Fallback to default theme
      setCurrentTheme(DEFAULT_THEME_CONFIG);
      applyThemeCSSVariables(DEFAULT_THEME_CONFIG);
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set theme configuration via DatabaseThemeService
   * FIX-016/017 Compliant with Schema Protection
   */
  const setTheme = useCallback(async (newTheme: Partial<HeaderThemeConfig>) => {
    try {
      setError(null);
      
      const updatedTheme = { ...currentTheme, ...newTheme };
      
      // FIX-018: Use DatabaseThemeService for all theme operations
      if (typeof window !== 'undefined' && window.rawalite?.themes) {
        try {
          // Use IPC to call DatabaseThemeService.setHeaderThemeConfig()
          const success = await window.rawalite.themes.setHeaderConfig('default', updatedTheme);
          
          if (success) {
            console.log('🎨 Saved header theme via DatabaseThemeService');
            setCurrentTheme(updatedTheme);
            applyThemeCSSVariables(updatedTheme);
          } else {
            throw new Error('Failed to save theme via DatabaseThemeService');
          }
        } catch (ipcError) {
          console.warn('⚠️ IPC theme saving failed, applying locally only:', ipcError);
          // Apply locally even if IPC fails
          setCurrentTheme(updatedTheme);
          applyThemeCSSVariables(updatedTheme);
        }
      } else {
        console.warn('⚠️ RawaLite Theme API not available, applying locally only');
        setCurrentTheme(updatedTheme);
        applyThemeCSSVariables(updatedTheme);
      }
      
    } catch (err) {
      console.error('🚨 Theme saving failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save theme');
    }
  }, [currentTheme]);

  /**
   * Apply theme configuration to CSS Variables
   * Real-time theme updates without page reload
   */
  const applyThemeCSSVariables = useCallback((theme: HeaderThemeConfig) => {
    const root = document.documentElement;

    // Header Base Variables
    root.style.setProperty('--theme-header-bg', theme.headerBgColor);
    root.style.setProperty('--theme-header-text', theme.headerTextColor);
    root.style.setProperty('--theme-header-border', theme.headerBorderColor);

    // Company Branding Variables
    root.style.setProperty('--theme-company-color', theme.companyNameColor);
    root.style.setProperty('--theme-company-weight', theme.companyNameWeight);

    // Navigation Items Variables
    root.style.setProperty('--theme-nav-bg', theme.navItemBgColor);
    root.style.setProperty('--theme-nav-text', theme.navItemTextColor);
    root.style.setProperty('--theme-nav-border', theme.navItemBorderColor);
    root.style.setProperty('--theme-nav-active-bg', theme.navItemActiveBgColor);
    root.style.setProperty('--theme-nav-active-text', theme.navItemActiveTextColor);

    // Statistics Cards Variables
    root.style.setProperty('--theme-stat-bg', theme.statCardBgColor);
    root.style.setProperty('--theme-stat-border', theme.statCardBorderColor);
    root.style.setProperty('--theme-stat-text', theme.statCardTextColor);
    root.style.setProperty('--theme-stat-value', theme.statCardValueColor);
    root.style.setProperty('--theme-stat-success', theme.statCardSuccessColor);
    root.style.setProperty('--theme-stat-warning', theme.statCardWarningColor);
    root.style.setProperty('--theme-stat-danger', theme.statCardDangerColor);

    console.log('🎨 Theme CSS Variables applied:', Object.keys(theme).length, 'properties');
  }, []);

  /**
   * Reset to default theme
   */
  const resetTheme = useCallback(async () => {
    try {
      // FIX-018: Use DatabaseThemeService for reset operation
      if (typeof window !== 'undefined' && window.rawalite?.themes) {
        try {
          const success = await window.rawalite.themes.resetHeader('default');
          if (success) {
            console.log('🎨 Header theme reset via DatabaseThemeService');
            // Reload theme from database
            await loadTheme();
          } else {
            throw new Error('Failed to reset theme via DatabaseThemeService');
          }
        } catch (ipcError) {
          console.warn('⚠️ IPC theme reset failed, using local fallback:', ipcError);
          await setTheme(DEFAULT_THEME_CONFIG);
        }
      } else {
        await setTheme(DEFAULT_THEME_CONFIG);
      }
    } catch (err) {
      console.error('🚨 Theme reset failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset theme');
    }
  }, [setTheme, loadTheme]);

  /**
   * Get page title with theme customization
   * @param pathname Current route pathname
   * @returns Themed or default page title
   */
  const getThemedPageTitle = useCallback((pathname: string, defaultTitle?: string): string => {
    if (defaultTitle) return defaultTitle;
    
    const customTitles = currentTheme.customTitles;
    if (!customTitles) return getDefaultPageTitle(pathname);
    
    switch (pathname) {
      case '/': return customTitles.dashboard || 'Dashboard';
      case '/kunden': return customTitles.customers || 'Kunden';
      case '/angebote': return customTitles.offers || 'Angebote';
      case '/pakete': return customTitles.packages || 'Pakete';
      case '/rechnungen': return customTitles.invoices || 'Rechnungen';
      case '/leistungsnachweise': return customTitles.timesheets || 'Leistungsnachweise';
      case '/einstellungen': return customTitles.settings || 'Einstellungen';
      default:
        if (pathname.startsWith('/angebote/')) return customTitles.offers || 'Angebot Details';
        return 'RawaLite';
    }
  }, [currentTheme]);

  /**
   * Load theme on mount
   */
  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  return {
    // Theme State
    currentTheme,
    isLoading,
    error,
    
    // Theme Methods
    setTheme,
    resetTheme,
    loadTheme,
    
    // Helper Methods
    getThemedPageTitle,
    applyThemeCSSVariables,
    
    // Theme Configuration Access
    headerConfig: {
      bgColor: currentTheme.headerBgColor,
      textColor: currentTheme.headerTextColor,
      borderColor: currentTheme.headerBorderColor,
    },
    companyConfig: {
      nameColor: currentTheme.companyNameColor,
      nameWeight: currentTheme.companyNameWeight,
    },
    navigationConfig: {
      itemBg: currentTheme.navItemBgColor,
      itemText: currentTheme.navItemTextColor,
      itemBorder: currentTheme.navItemBorderColor,
      activeBg: currentTheme.navItemActiveBgColor,
      activeText: currentTheme.navItemActiveTextColor,
    },
    statisticsConfig: {
      cardBg: currentTheme.statCardBgColor,
      cardBorder: currentTheme.statCardBorderColor,
      cardText: currentTheme.statCardTextColor,
      cardValue: currentTheme.statCardValueColor,
      successColor: currentTheme.statCardSuccessColor,
      warningColor: currentTheme.statCardWarningColor,
      dangerColor: currentTheme.statCardDangerColor,
    },
  };
};

/**
 * Get default page title based on pathname
 * Fallback for non-themed titles
 */
function getDefaultPageTitle(pathname: string): string {
  switch (pathname) {
    case '/': return 'Dashboard';
    case '/kunden': return 'Kunden';
    case '/angebote': return 'Angebote';
    case '/pakete': return 'Pakete';
    case '/rechnungen': return 'Rechnungen';
    case '/leistungsnachweise': return 'Leistungsnachweise';
    case '/einstellungen': return 'Einstellungen';
    default:
      if (pathname.startsWith('/angebote/')) return 'Angebot Details';
      return 'RawaLite';
  }
}

export default useTheme;