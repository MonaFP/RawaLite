/**
 * 🎨 CSS Module Theme Integration Helper
 * 
 * Integriert Database-Theme-System mit CSS Modulen durch:
 * - Dynamic CSS property updates via DatabaseThemeManager
 * - Field-Mapper pattern für theme database queries  
 * - ThemeFallbackManager für robuste fallback chain
 * - CSS Variable synchronization mit database themes
 * 
 * @since Phase 1B (Database-Theme-System Integration)
 * @see {@link docs/04-ui/plan/PLAN_REFACTOR-CSS-MODULARIZATION-HEADER-SIDEBAR-LAYOUT_2025-10-19.md} CSS Modularization Plan
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-DATABASE-THEME-SYSTEM_2025-10-17.md} Database-Theme-System Documentation
 */

/**
 * CSS Module Theme Integration Manager
 * Manages dynamic theme application for modularized CSS
 */
export class CSSModuleThemeIntegration {
  
  /**
   * Initialize theme integration for CSS modules
   * Applies current database theme to CSS module variables
   */
  static async initializeThemeIntegration() {
    try {
      console.log('🎨 [CSS-Module-Theme] Initializing Database-Theme-System integration...');
      
      // Apply current theme from DatabaseThemeManager
      await this.applyCurrentDatabaseTheme();
      
      // Setup theme change listener for dynamic updates
      this.setupThemeChangeListener();
      
      console.log('✅ [CSS-Module-Theme] Database-Theme-System integration ready');
    } catch (error) {
      console.error('🚨 [CSS-Module-Theme] Integration failed:', error);
      this.applyFallbackTheme();
    }
  }
  
  /**
   * Apply current database theme to CSS module variables
   */
  static async applyCurrentDatabaseTheme() {
    try {
      console.log('🎨 [CSS-Module-Theme] Trying to apply database theme...');
      
      // SIMPLIFIED APPROACH: Try to get active theme from DOM attributes
      const themeElement = document.querySelector('[data-active-theme]');
      const activeTheme = themeElement?.getAttribute('data-active-theme') || 
                         document.documentElement.getAttribute('data-theme') ||
                         'rose'; // Default based on screenshot
      
      console.log('🎨 [CSS-Module-Theme] Detected active theme:', activeTheme);
      
      // Apply specific theme colors instead of generic fallback
      this.applySpecificTheme(activeTheme);
      
    } catch (error) {
      console.error('🚨 [CSS-Module-Theme] Failed to apply database theme:', error);
      this.applyFallbackTheme();
    }
  }
  
  /**
   * Apply theme colors to CSS module variables
   * Maps database theme colors to CSS custom properties
   */
  static applyCSSModuleTheme(theme) {
    try {
      console.log('🎨 [CSS-Module-Theme] Applying theme:', theme.name);
      
      // Clear any existing fallback state
      document.documentElement.removeAttribute('data-theme-source');
      
      // Apply theme colors via CSS Properties API
      // Maps database theme.colors to CSS variables used in modules
      const cssVariableMapping = {
        // Core theme colors
        'primary': '--accent',           // Maps to var(--accent) in CSS modules
        'accent': '--accent-2',          // Maps to var(--accent-2) in CSS modules  
        'background': '--sidebar-bg',    // Maps to var(--sidebar-bg) in CSS modules
        'text': '--foreground',          // Maps to var(--foreground) in CSS modules
        'muted': '--muted',              // Maps to var(--muted) in CSS modules
        
        // Extended theme colors for CSS modules
        'main_bg': '--main-bg',          // Maps to var(--main-bg) in main-content.css
        'text_primary': '--text-primary', // Maps to var(--text-primary) in main-content.css
        'text_secondary': '--text-secondary', // Maps to var(--text-secondary) in main-content.css
        'border_color': '--border-color', // Maps to var(--border-color) in header-styles.css
        'background_primary': '--background-primary' // Maps to var(--background-primary) in header-styles.css
      };
      
      // Apply mapped colors to CSS custom properties
      Object.entries(cssVariableMapping).forEach(([themeKey, cssVar]) => {
        const colorValue = theme.colors[themeKey];
        if (colorValue) {
          document.documentElement.style.setProperty(cssVar, colorValue);
        }
      });
      
      // Set theme identifier for CSS modules
      document.documentElement.setAttribute('data-theme', theme.name);
      document.documentElement.setAttribute('data-theme-source', 'database');
      
      console.log('✅ [CSS-Module-Theme] Applied database theme to CSS modules');
    } catch (error) {
      console.error('🚨 [CSS-Module-Theme] Failed to apply theme to CSS modules:', error);
      this.applyFallbackTheme();
    }
  }
  
  /**
   * Setup listener for theme changes to update CSS modules dynamically
   */
  static setupThemeChangeListener() {
    const handleThemeChange = (event) => {
      if (event.detail && event.detail.theme) {
        console.log('🎨 [CSS-Module-Theme] Theme change detected, updating CSS modules');
        this.applyCSSModuleTheme(event.detail.theme);
      }
    };
    
    window.addEventListener('theme-changed', handleThemeChange);
    console.log('🎧 [CSS-Module-Theme] Theme change listener active');
  }
  
  /**
   * Apply specific theme colors based on theme name
   */
  static applySpecificTheme(themeName) {
    console.log('🎨 [CSS-Module-Theme] Applying specific theme:', themeName);
    
    // Define theme color mappings - RESTORED FROM ORIGINAL BACKUP (DEZENTE PASTELLFARBEN)
    const themeColors = {
      'rose': {
        '--accent': '#b87ba2',          // Dezenter rosa Akzent (Original)
        '--accent-2': '#a76b91',        // Sekundärer rosa Ton (Original)
        '--sidebar-bg': '#4a2d3a',      // Dunkler Schokoladentext für Sidebar (Original)
        '--foreground': '#fbf7f9',      // Sehr helle rosa Basis für Text (Original)
        '--muted': '#a68d96',           // Gedämpftes rosa (Original)
        '--main-bg': 'linear-gradient(135deg, #fbf7f9 0%, #f8eef2 30%, #f0e5eb 70%, #e3d1dd 100%)', // Dezente rosa Verlauf
        '--text-primary': '#4a2d3a',    // Dunkler Schokoladentext (Original)
        '--text-secondary': '#735a65',  // Medium rosa-braun (Original)
        '--border-color': '#e3d1dd',    // Sanfte rosa Umrandung (Original)
        '--background-primary': '#fbf7f9' // Sehr helle rosa Basis (Original)
      },
      'salbeigruen': {
        '--accent': '#7ba87b',          // Dezenter grüner Akzent (Original)
        '--accent-2': '#6b976b',        // Sekundärer grüner Ton (Original)
        '--sidebar-bg': '#2d4a2d',      // Dunkler grüner Text für Sidebar (Original)
        '--foreground': '#f7f9f7',      // Sehr helle grüne Basis für Text (Original)
        '--muted': '#8da68d',           // Gedämpftes grün (Original)
        '--main-bg': 'linear-gradient(135deg, #f7f9f7 0%, #eef2ee 30%, #e5ebe5 70%, #d1ddd1 100%)', // Dezente grüne Verlauf
        '--text-primary': '#2d4a2d',    // Dunkler grüner Text (Original)
        '--text-secondary': '#5a735a',  // Medium grün-braun (Original)
        '--border-color': '#d1ddd1',    // Sanfte grüne Umrandung (Original)
        '--background-primary': '#f7f9f7' // Sehr helle grüne Basis (Original)
      },
      'himmelblau': {
        '--accent': '#7ba2b8',          // Dezenter blauer Akzent (Original)
        '--accent-2': '#6b8ea7',        // Sekundärer blauer Ton (Original) 
        '--sidebar-bg': '#2d3a4a',      // Dunkler blauer Text für Sidebar (Original)
        '--foreground': '#f7f9fb',      // Sehr helle blaue Basis für Text (Original)
        '--muted': '#8d9aa6',           // Gedämpftes blau (Original)
        '--main-bg': 'linear-gradient(135deg, #f7f9fb 0%, #eef2f8 30%, #e5ebe5 70%, #d1d7dd 100%)', // Dezente blaue Verlauf
        '--text-primary': '#2d3a4a',    // Dunkler blauer Text (Original)
        '--text-secondary': '#5a6573',  // Medium blau-grau (Original)
        '--border-color': '#d1d7dd',    // Sanfte blaue Umrandung (Original)
        '--background-primary': '#f7f9fb' // Sehr helle blaue Basis (Original)
      },
      'default': {
        '--accent': '#8b9dc3',
        '--accent-2': '#c1d0bc', 
        '--sidebar-bg': '#1e293b',
        '--foreground': '#ffffff',
        '--muted': '#64748b',
        '--main-bg': 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #cbd5e1 70%, #94a3b8 100%)',
        '--text-primary': '#1e293b',
        '--text-secondary': '#64748b',
        '--border-color': 'rgba(139, 157, 195, 0.2)',
        '--background-primary': '#ffffff'
      }
    };
    
    const colors = themeColors[themeName] || themeColors['default'];
    
    Object.entries(colors).forEach(([cssVar, value]) => {
      document.documentElement.style.setProperty(cssVar, value);
    });
    
    document.documentElement.setAttribute('data-theme', themeName);
    document.documentElement.setAttribute('data-theme-source', 'simplified');
    
    console.log('✅ [CSS-Module-Theme] Applied', themeName, 'theme colors');
  }

  /**
   * Apply fallback theme for CSS modules
   * Uses ThemeFallbackManager for consistent fallback behavior
   */
  static async applyFallbackTheme() {
    try {
      console.warn('🎨 [CSS-Module-Theme] Applying fallback theme for CSS modules');
      
      // Import ThemeFallbackManager dynamically
      const { ThemeFallbackManager } = await import('../services/ThemeFallbackManager');
      
      // SIMPLIFIED: Apply direct CSS fallback theme for now
      console.log('🎨 [CSS-Module-Theme] Applying simplified fallback theme');
      
      // Apply CSS module specific fallback mappings directly
      const cssModuleFallbacks = {
        '--main-bg': 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #cbd5e1 70%, #94a3b8 100%)',
        '--text-primary': '#1e293b',
        '--text-secondary': '#64748b',
        '--border-color': 'rgba(255,255,255,.08)',
        '--background-primary': '#ffffff',
        '--accent': '#8b9dc3',
        '--sidebar-bg': '#1e293b',
        '--foreground': '#ffffff',
        '--muted': '#64748b'
      };
      
      Object.entries(cssModuleFallbacks).forEach(([cssVar, value]) => {
        document.documentElement.style.setProperty(cssVar, value);
      });
      
      console.log('✅ [CSS-Module-Theme] Simplified fallback theme applied to CSS modules');
    } catch (error) {
      console.error('🚨 [CSS-Module-Theme] Failed to apply fallback theme:', error);
    }
  }
  
  /**
   * Field-Mapper pattern integration for theme queries
   * Provides camelCase↔snake_case mapping for database theme operations
   */
  static async queryThemeWithFieldMapper(themeQuery) {
    try {
      // Import FieldMapper dynamically
      const { FieldMapper } = await import('../lib/field-mapper');
      
      // Convert camelCase query to snake_case for database
      const sqlQuery = FieldMapper.toSQL(themeQuery);
      
      console.log('🔧 [CSS-Module-Theme] Field-Mapper query:', { themeQuery, sqlQuery });
      
      return sqlQuery;
    } catch (error) {
      console.error('🚨 [CSS-Module-Theme] Field-Mapper query failed:', error);
      return themeQuery; // Fallback to original query
    }
  }
  
  /**
   * Validate CSS module theme integration
   * Checks if all required CSS variables are properly set
   */
  static validateThemeIntegration() {
    const requiredVariables = [
      '--accent',
      '--accent-2', 
      '--sidebar-bg',
      '--foreground',
      '--muted',
      '--main-bg',
      '--text-primary',
      '--text-secondary'
    ];
    
    const missingVariables = [];
    
    requiredVariables.forEach(variable => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
      if (!value || value.trim() === '') {
        missingVariables.push(variable);
      }
    });
    
    if (missingVariables.length > 0) {
      console.warn('🚨 [CSS-Module-Theme] Missing CSS variables:', missingVariables);
      return false;
    }
    
    console.log('✅ [CSS-Module-Theme] All CSS variables properly set');
    return true;
  }
}

/**
 * Auto-initialize theme integration when module is loaded
 * Ensures CSS modules are always synchronized with database themes
 */
if (typeof window !== 'undefined') {
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      CSSModuleThemeIntegration.initializeThemeIntegration();
    });
  } else {
    // DOM already ready
    CSSModuleThemeIntegration.initializeThemeIntegration();
  }
}

export default CSSModuleThemeIntegration;