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
      // Import DatabaseThemeManager dynamically to avoid circular deps
      const { DatabaseThemeManager } = await import('../contexts/DatabaseThemeManager');
      const themeManager = new DatabaseThemeManager();
      
      await themeManager.initialize();
      const currentTheme = themeManager.getCurrentTheme();
      
      if (currentTheme) {
        this.applyCSSModuleTheme(currentTheme);
      } else {
        console.warn('🎨 [CSS-Module-Theme] No active theme found, applying fallback');
        this.applyFallbackTheme();
      }
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
   * Apply fallback theme for CSS modules
   * Uses ThemeFallbackManager for consistent fallback behavior
   */
  static async applyFallbackTheme() {
    try {
      console.warn('🎨 [CSS-Module-Theme] Applying fallback theme for CSS modules');
      
      // Import ThemeFallbackManager dynamically
      const { ThemeFallbackManager } = await import('../services/ThemeFallbackManager');
      
      // Apply CSS fallback theme
      ThemeFallbackManager.applyFallbackTheme('css');
      
      // Additional CSS module specific fallback mappings
      const cssModuleFallbacks = {
        '--main-bg': 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #cbd5e1 70%, #94a3b8 100%)',
        '--text-primary': '#1e293b',
        '--text-secondary': '#64748b',
        '--border-color': 'rgba(255,255,255,.08)',
        '--background-primary': '#ffffff'
      };
      
      Object.entries(cssModuleFallbacks).forEach(([cssVar, value]) => {
        document.documentElement.style.setProperty(cssVar, value);
      });
      
      console.log('✅ [CSS-Module-Theme] Fallback theme applied to CSS modules');
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