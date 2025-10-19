/**
 * ThemeFallbackManager - 3-Level Fallback System for Theme Recovery
 * 
 * Provides robust theme fallback with graceful degradation:
 * Level 1: Database Theme (normal operation)
 * Level 2: CSS Fallback Theme (degraded mode)
 * Level 3: Emergency Hardcoded Theme (minimal operation)
 * 
 * Ensures application always has a working theme even if:
 * - Database is corrupted or unavailable
 * - CSS files are missing or malformed
 * - Network connectivity issues
 * 
 * @since v1.0.42.7 (Database-Theme-System)
 * @see docs/04-ui/plan/VISUALIZATION_DATABASE-THEME-ARCHITECTURE_2025-10-17.md
 */

import type { ThemeWithColors } from './DatabaseThemeService';

export type FallbackLevel = 'database' | 'css' | 'emergency';

export interface FallbackThemeInfo {
  level: FallbackLevel;
  theme: ThemeWithColors;
  source: string;
  isSuccess: boolean;
  error?: string;
}

export interface EmergencyTheme {
  themeKey: string;
  name: string;
  description: string;
  icon: string;
  colors: Record<string, string>;
}

export class ThemeFallbackManager {
  private static instance: ThemeFallbackManager;
  
  // Emergency hardcoded themes (minimal operation)
  private readonly EMERGENCY_THEMES: Record<string, EmergencyTheme> = {
    default: {
      themeKey: 'default',
      name: 'Emergency Default',
      description: 'Emergency fallback theme - minimal operation',
      icon: '🚨',
      colors: {
        'primary': '#1e3a2e',
        'accent': '#8b9dc3',
        'accent-hover': '#c1d0bc',
        'background': '#f1f5f9',
        'text-primary': '#1e293b',
        'text-secondary': '#374151'
      }
    },
    safe: {
      themeKey: 'safe',
      name: 'Emergency Safe Mode',
      description: 'High contrast emergency theme for accessibility',
      icon: '⚡',
      colors: {
        'primary': '#000000',
        'accent': '#0066cc',
        'accent-hover': '#004499',
        'background': '#ffffff',
        'text-primary': '#000000',
        'text-secondary': '#333333'
      }
    }
  };

  // CSS-based theme keys (Level 2 fallback)
  private readonly CSS_THEME_KEYS = ['default', 'sage', 'sky', 'lavender', 'peach', 'rose'];

  private constructor() {}

  public static getInstance(): ThemeFallbackManager {
    if (!ThemeFallbackManager.instance) {
      ThemeFallbackManager.instance = new ThemeFallbackManager();
    }
    return ThemeFallbackManager.instance;
  }

  /**
   * Apply theme with 3-level fallback system
   * Returns info about which fallback level was used
   */
  async applyThemeWithFallback(
    requestedThemeKey: string,
    databaseThemeLoader?: () => Promise<ThemeWithColors | null>
  ): Promise<FallbackThemeInfo> {
    // Level 1: Try database theme
    if (databaseThemeLoader) {
      try {
        const databaseTheme = await databaseThemeLoader();
        if (databaseTheme && this.isThemeValid(databaseTheme)) {
          this.applyThemeToDOM(databaseTheme, 'database');
          return {
            level: 'database',
            theme: databaseTheme,
            source: 'Database',
            isSuccess: true
          };
        }
      } catch (error) {
        console.warn('[ThemeFallbackManager] Database theme failed:', error);
      }
    }

    // Level 2: Try CSS fallback theme
    const cssTheme = this.tryCSS(requestedThemeKey);
    if (cssTheme.isSuccess) {
      return cssTheme;
    }

    // Level 3: Emergency hardcoded theme
    console.error('[ThemeFallbackManager] All theme sources failed, using emergency theme');
    return this.applyEmergencyTheme(requestedThemeKey);
  }

  /**
   * Level 2: Try CSS-based theme fallback
   */
  private tryCSS(requestedThemeKey: string): FallbackThemeInfo {
    try {
      const cssThemeKey = this.CSS_THEME_KEYS.includes(requestedThemeKey) 
        ? requestedThemeKey 
        : 'default';

      // Apply CSS theme by setting data-theme attribute
      if (cssThemeKey === 'default') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', cssThemeKey);
      }

      // Create mock theme object for consistency
      const cssTheme: ThemeWithColors = {
        themeKey: cssThemeKey,
        name: this.getCSSThemeName(cssThemeKey),
        description: `CSS fallback theme: ${cssThemeKey}`,
        icon: this.getCSSIcon(cssThemeKey),
        isSystemTheme: true,
        isActive: true,
        colors: {} // Colors are handled by CSS variables
      };

      return {
        level: 'css',
        theme: cssTheme,
        source: 'CSS Variables',
        isSuccess: true
      };
    } catch (error) {
      return {
        level: 'css',
        theme: this.EMERGENCY_THEMES.default as ThemeWithColors,
        source: 'CSS Variables',
        isSuccess: false,
        error: `CSS theme failed: ${error}`
      };
    }
  }

  /**
   * Level 3: Apply emergency hardcoded theme
   */
  private applyEmergencyTheme(preferredKey: string = 'default'): FallbackThemeInfo {
    const emergencyKey = this.EMERGENCY_THEMES[preferredKey] ? preferredKey : 'default';
    const emergencyTheme = this.EMERGENCY_THEMES[emergencyKey];

    // Remove any CSS theme attributes
    document.documentElement.removeAttribute('data-theme');

    // Apply emergency theme with inline styles
    this.applyEmergencyStyles(emergencyTheme);

    const themeWithColors: ThemeWithColors = {
      id: -1,
      themeKey: emergencyTheme.themeKey,
      name: emergencyTheme.name,
      description: emergencyTheme.description,
      icon: emergencyTheme.icon,
      isSystemTheme: true,
      isActive: true,
      colors: emergencyTheme.colors
    };

    return {
      level: 'emergency',
      theme: themeWithColors,
      source: 'Hardcoded Emergency',
      isSuccess: true
    };
  }

  /**
   * Apply database theme to DOM using CSS custom properties
   */
  private applyThemeToDOM(theme: ThemeWithColors, level: FallbackLevel): void {
    try {
      // Clear any existing CSS theme
      document.documentElement.removeAttribute('data-theme');

      // Apply colors as CSS custom properties
      const root = document.documentElement;
      for (const [colorKey, colorValue] of Object.entries(theme.colors)) {
        root.style.setProperty(`--${colorKey}`, colorValue);
      }

      // Set a data attribute to indicate database theme is active
      root.setAttribute('data-database-theme', theme.themeKey);
      root.setAttribute('data-theme-level', level);

    } catch (error) {
      console.error('[ThemeFallbackManager] Error applying database theme to DOM:', error);
    }
  }

  /**
   * Apply emergency styles directly to document head
   */
  private applyEmergencyStyles(emergencyTheme: EmergencyTheme): void {
    try {
      // Remove existing emergency styles
      const existingStyle = document.getElementById('emergency-theme-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Create emergency style element
      const styleElement = document.createElement('style');
      styleElement.id = 'emergency-theme-styles';
      styleElement.textContent = this.generateEmergencyCSS(emergencyTheme);

      // Append to head
      document.head.appendChild(styleElement);

      // Set data attributes for debugging
      document.documentElement.setAttribute('data-emergency-theme', emergencyTheme.themeKey);
      document.documentElement.setAttribute('data-theme-level', 'emergency');

    } catch (error) {
      console.error('[ThemeFallbackManager] Error applying emergency styles:', error);
    }
  }

  /**
   * Generate emergency CSS from theme colors
   */
  private generateEmergencyCSS(theme: EmergencyTheme): string {
    const { colors } = theme;
    
    return `
      /* Emergency Theme: ${theme.name} */
      :root {
        --primary: ${colors.primary} !important;
        --accent: ${colors.accent} !important;
        --accent-hover: ${colors['accent-hover']} !important;
        --background: ${colors.background} !important;
        --text-primary: ${colors['text-primary']} !important;
        --text-secondary: ${colors['text-secondary']} !important;
      }
      
      body {
        background: ${colors.background} !important;
        color: ${colors['text-primary']} !important;
      }
      
      .app {
        background: ${colors.background} !important;
      }
      
      /* High contrast for accessibility in emergency mode */
      button, .button {
        background: ${colors.accent} !important;
        color: ${colors.background} !important;
        border: 1px solid ${colors['text-primary']} !important;
      }
      
      button:hover, .button:hover {
        background: ${colors['accent-hover']} !important;
      }
    `;
  }

  /**
   * Validate theme has required properties
   */
  private isThemeValid(theme: ThemeWithColors): boolean {
    if (!theme || !theme.themeKey) return false;
    if (!theme.colors || typeof theme.colors !== 'object') return false;
    
    // Check for essential color keys
    const requiredColors = ['primary', 'accent', 'background', 'text-primary'];
    for (const colorKey of requiredColors) {
      if (!theme.colors[colorKey]) {
        console.warn(`[ThemeFallbackManager] Theme ${theme.themeKey} missing required color: ${colorKey}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get CSS theme display name
   */
  private getCSSThemeName(cssThemeKey: string): string {
    const names: Record<string, string> = {
      default: 'Standard',
      sage: 'Salbeigrün',
      sky: 'Himmelblau',
      lavender: 'Lavendel',
      peach: 'Pfirsich',
      rose: 'Rosé'
    };
    return names[cssThemeKey] || cssThemeKey;
  }

  /**
   * Get CSS theme icon
   */
  private getCSSIcon(cssThemeKey: string): string {
    const icons: Record<string, string> = {
      default: '🌲',
      sage: '🟢',
      sky: '🔵',
      lavender: '🟣',
      peach: '🟠',
      rose: '🌸'
    };
    return icons[cssThemeKey] || '🎨';
  }

  /**
   * Check current fallback level
   */
  getCurrentFallbackLevel(): FallbackLevel {
    const root = document.documentElement;
    const level = root.getAttribute('data-theme-level') as FallbackLevel;
    return level || 'css'; // Default assumption
  }

  /**
   * Get emergency theme keys
   */
  getEmergencyThemeKeys(): string[] {
    return Object.keys(this.EMERGENCY_THEMES);
  }

  /**
   * Get CSS-compatible theme keys
   */
  getCSSThemeKeys(): string[] {
    return [...this.CSS_THEME_KEYS];
  }

  /**
   * Force emergency mode (for testing/debugging)
   */
  forceEmergencyMode(themeKey: string = 'default'): void {
    console.warn('[ThemeFallbackManager] Forcing emergency mode');
    this.applyEmergencyTheme(themeKey);
  }

  /**
   * Clear all theme styles and attributes
   */
  clearAllThemes(): void {
    const root = document.documentElement;
    
    // Remove CSS theme
    root.removeAttribute('data-theme');
    
    // Remove database theme
    root.removeAttribute('data-database-theme');
    root.removeAttribute('data-theme-level');
    
    // Remove emergency theme
    root.removeAttribute('data-emergency-theme');
    const emergencyStyles = document.getElementById('emergency-theme-styles');
    if (emergencyStyles) {
      emergencyStyles.remove();
    }
    
    // Clear custom CSS properties
    const style = root.style;
    const cssProperties = [
      '--primary', '--accent', '--accent-hover', '--background',
      '--text-primary', '--text-secondary', '--sidebar-bg', '--sidebar-green'
    ];
    
    for (const prop of cssProperties) {
      style.removeProperty(prop);
    }
  }
}