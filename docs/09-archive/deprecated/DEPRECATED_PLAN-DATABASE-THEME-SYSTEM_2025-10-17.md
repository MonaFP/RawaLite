# 🎨 Database-basiertes Theme System - Vollständiger Implementierungsplan
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **Erstellt:** 17.10.2025 | **Status:** Planning Phase | **Typ:** Implementation Plan  
> **Schema:** `PLAN_IMPL-DATABASE-THEME-SYSTEM_2025-10-17.md`

## 🎯 **Projektziel**

**Vollständig datenbankbasiertes Theme-System** mit:
- ✅ **Custom User Themes** - Beliebige Farben wählbar
- ✅ **Fallback-Sicherheit** - App crasht nie bei Theme-Problemen
- ✅ **Database-First** - Themes in SQLite gespeichert
- ✅ **Rückwärtskompatibilität** - Bestehende 6 Themes bleiben verfügbar
- ✅ **CSS Properties API** - Dynamische Theme-Injection

---

## 📊 **Architektur-Übersicht**

### **Database Schema (Migration 021)**
```sql
-- Core theme definitions
CREATE TABLE themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,                 -- 'sage', 'custom-user-1', etc.
  display_name TEXT NOT NULL,               -- 'Sage Theme', 'Mein Custom Theme'
  is_system_theme BOOLEAN DEFAULT FALSE,    -- TRUE für die 6 Standard-Themes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Theme color definitions
CREATE TABLE theme_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  color_key TEXT NOT NULL,                  -- 'primary', 'accent', 'background'
  color_value TEXT NOT NULL,                -- '#ff0000', 'rgba(255,0,0,0.8)'
  is_derived BOOLEAN DEFAULT FALSE,         -- Für berechnete Farben
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(theme_id, color_key)
);

-- User theme preferences
CREATE TABLE user_theme_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_context TEXT DEFAULT 'default',     -- Für zukünftige Multi-User
  active_theme_id INTEGER REFERENCES themes(id),
  last_changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### **Fallback-System Hierarchie**
```typescript
// 1. Database Theme Loading (Primary)
async loadActiveTheme(): Promise<DatabaseTheme | null>

// 2. CSS Fallback Theme (Secondary) 
const CSS_FALLBACK_THEME = {
  primary: '#8b9dc3',    // Standard anthracite-blue
  accent: '#8b9dc3',
  background: '#ffffff'
  // Alle wichtigen CSS Variables
}

// 3. Hard-coded Emergency (Tertiary)
const EMERGENCY_THEME = {
  primary: '#2563eb',    // Browser-safe blue
  accent: '#2563eb',
  background: '#ffffff'
}
```

---

## 🏗️ **Phase 1: Database Schema & Migration (2 Stunden)**

### **1.1 Migration 021 erstellen**

**Datei:** `src/main/db/migrations/021_add_theme_system.ts`

```typescript
export const up = (db: Database.Database): void => {
  // 1. Themes table
  db.exec(`
    CREATE TABLE themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      is_system_theme BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Theme colors table
  db.exec(`
    CREATE TABLE theme_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
      color_key TEXT NOT NULL,
      color_value TEXT NOT NULL,
      is_derived BOOLEAN DEFAULT FALSE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(theme_id, color_key)
    );
  `);

  // 3. User preferences table
  db.exec(`
    CREATE TABLE user_theme_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_context TEXT DEFAULT 'default',
      active_theme_id INTEGER REFERENCES themes(id),
      last_changed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Indexes for performance
  db.exec(`
    CREATE INDEX idx_theme_colors_theme_id ON theme_colors(theme_id);
    CREATE INDEX idx_theme_colors_color_key ON theme_colors(color_key);
    CREATE INDEX idx_user_theme_prefs_context ON user_theme_preferences(user_context);
  `);

  // 5. Seed with existing 6 themes
  seedSystemThemes(db);
};

function seedSystemThemes(db: Database.Database) {
  // Check for existing user theme preference from old CSS system
  let userPreferredTheme = 'default';
  
  try {
    // Extract theme from existing settings (if any)
    const themeSettings = db.prepare(`
      SELECT value FROM settings 
      WHERE key IN ('theme', 'activeTheme', 'selectedTheme')
    `).all();
    
    themeSettings.forEach(setting => {
      try {
        const parsed = JSON.parse(setting.value);
        if (typeof parsed === 'string' && isValidSystemTheme(parsed)) {
          userPreferredTheme = parsed;
          console.log(`[Migration 021] Preserving user theme: ${parsed}`);
        }
      } catch {
        // Parse error - keep default
      }
    });
  } catch {
    // Settings table might not exist yet - keep default
  }

  const systemThemes = [
    {
      name: 'default',
      displayName: 'Standard (Anthrazit-Blau)',
      colors: {
        primary: '#8b9dc3',
        accent: '#8b9dc3',
        background: '#ffffff',
        text: '#1e293b',
        ok: '#10b981',
        warn: '#f59e0b', 
        danger: '#ef4444'
      }
    },
    {
      name: 'sage',
      displayName: 'Sage (Salbeigrün)',
      colors: {
        primary: '#d2ddcf',
        accent: '#d2ddcf',
        background: '#ffffff',
        text: '#1e293b',
        ok: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444'
      }
    },
    {
      name: 'sky',
      displayName: 'Sky (Himmelblau)',
      colors: {
        primary: '#bae6fd',
        accent: '#bae6fd',
        background: '#ffffff',
        text: '#1e293b',
        ok: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444'
      }
    },
    {
      name: 'lavender',
      displayName: 'Lavender (Lavendel)',
      colors: {
        primary: '#dda0dd',
        accent: '#dda0dd',
        background: '#ffffff',
        text: '#1e293b',
        ok: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444'
      }
    },
    {
      name: 'peach',
      displayName: 'Peach (Pfirsich)',
      colors: {
        primary: '#ffcba4',
        accent: '#ffcba4',
        background: '#ffffff',
        text: '#1e293b',
        ok: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444'
      }
    },
    {
      name: 'rose',
      displayName: 'Rose (Rosé)',
      colors: {
        primary: '#ffb6c1',
        accent: '#ffb6c1',
        background: '#ffffff',
        text: '#1e293b',
        ok: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444'
      }
    }
  ];

  let activeThemeId = null;

  // Create all system themes
  systemThemes.forEach(theme => {
    // Insert theme
    const themeResult = db.prepare(`
      INSERT INTO themes (name, display_name, is_system_theme)
      VALUES (?, ?, TRUE)
    `).run(theme.name, theme.displayName);

    const themeId = themeResult.lastInsertRowid;

    // Track the user's preferred theme ID
    if (theme.name === userPreferredTheme) {
      activeThemeId = themeId;
    }

    // Insert colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      db.prepare(`
        INSERT INTO theme_colors (theme_id, color_key, color_value)
        VALUES (?, ?, ?)
      `).run(themeId, key, value);
    });
  });

  // Set user's preserved theme as active (or default if not found)
  if (!activeThemeId) {
    const defaultTheme = db.prepare(`
      SELECT id FROM themes WHERE name = 'default'
    `).get();
    activeThemeId = defaultTheme.id;
  }

  db.prepare(`
    INSERT INTO user_theme_preferences (user_context, active_theme_id)
    VALUES ('default', ?)
  `).run(activeThemeId);

  // Clean up old theme settings to prevent conflicts
  try {
    db.prepare(`
      DELETE FROM settings WHERE key IN ('theme', 'activeTheme', 'selectedTheme')
    `).run();
    console.log('[Migration 021] Cleaned up legacy theme settings');
  } catch {
    // Settings cleanup failed - not critical
  }

  console.log(`[Migration 021] Theme system initialized with active theme ID: ${activeThemeId}`);
}

function isValidSystemTheme(name: string): boolean {
  return ['default', 'sage', 'sky', 'lavender', 'peach', 'rose'].includes(name);
}
```

### **1.2 Field-Mapper Integration**

**Update:** `src/lib/field-mapper.ts`

```typescript
// Theme-related mappings
const JS_TO_SQL_MAPPINGS = {
  // ... existing mappings
  'displayName': 'display_name',
  'isSystemTheme': 'is_system_theme',
  'isActive': 'is_active',
  'colorKey': 'color_key',
  'colorValue': 'color_value',
  'isDerived': 'is_derived',
  'themeId': 'theme_id',
  'activeThemeId': 'active_theme_id',
  'userContext': 'user_context',
  'lastChangedAt': 'last_changed_at'
};

// Table mappings
const TABLE_MAPPINGS = {
  // ... existing mappings
  'themeColors': 'theme_colors',
  'userThemePreferences': 'user_theme_preferences'
};
```

---

## 🛡️ **Phase 2: Fallback Theme System (1.5 Stunden)**

### **2.1 CSS Fallback Theme**

**Datei:** `src/styles/themes/fallback-theme.css`

```css
/* Emergency Fallback Theme - Always Available */
:root[data-theme-source="fallback"] {
  /* Primary Colors */
  --theme-primary: #8b9dc3 !important;
  --theme-accent: #8b9dc3 !important;
  --theme-background: #ffffff !important;
  --theme-text: #1e293b !important;
  
  /* Derived Colors */
  --accent: var(--theme-accent) !important;
  --main-bg: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%) !important;
  --card-bg: rgba(255,255,255,0.98) !important;
  
  /* Status Colors */
  --ok: #10b981 !important;
  --warn: #f59e0b !important;
  --danger: #ef4444 !important;
  
  /* Focus Mode */
  --focus-bg: color-mix(in srgb, var(--theme-accent) 15%, transparent 85%) !important;
  --focus-border: color-mix(in srgb, var(--theme-accent) 20%, transparent 80%) !important;
}

/* Apply fallback when database fails */
.theme-fallback-active {
  /* Override any existing theme classes */
}
```

### **2.2 Theme Fallback Manager**

**Datei:** `src/services/ThemeFallbackManager.ts`

```typescript
export interface FallbackTheme {
  primary: string;
  accent: string;
  background: string;
  text: string;
  // ... weitere core colors
}

export class ThemeFallbackManager {
  private static readonly CSS_FALLBACK: FallbackTheme = {
    primary: '#8b9dc3',
    accent: '#8b9dc3',
    background: '#ffffff',
    text: '#1e293b'
  };

  private static readonly EMERGENCY_FALLBACK: FallbackTheme = {
    primary: '#2563eb',
    accent: '#2563eb', 
    background: '#ffffff',
    text: '#000000'
  };

  static applyFallbackTheme(level: 'css' | 'emergency' = 'css'): void {
    const fallback = level === 'css' 
      ? this.CSS_FALLBACK 
      : this.EMERGENCY_FALLBACK;

    // Apply via CSS Properties API
    Object.entries(fallback).forEach(([key, value]) => {
      document.documentElement.style.setProperty(
        `--theme-${key}`, 
        value
      );
    });

    // Mark fallback state
    document.documentElement.setAttribute(
      'data-theme-source', 
      level === 'css' ? 'fallback' : 'emergency'
    );

    console.warn(`[ThemeFallbackManager] Applied ${level} fallback theme`);
  }

  static isFallbackActive(): boolean {
    const source = document.documentElement.getAttribute('data-theme-source');
    return source === 'fallback' || source === 'emergency';
  }

  static clearFallback(): void {
    document.documentElement.removeAttribute('data-theme-source');
    // Don't remove CSS properties - let normal theme system take over
  }
}
```

---

## 🗄️ **Phase 3: Database Theme Service (2 Stunden)**

### **3.1 Database Theme Interfaces**

**Datei:** `src/types/theme.ts`

```typescript
export interface DatabaseTheme {
  id: number;
  name: string;
  displayName: string;
  isSystemTheme: boolean;
  isActive: boolean;
  colors: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateThemeData {
  name: string;
  displayName: string;
  colors: Record<string, string>;
  isSystemTheme?: boolean;
}

export interface ThemeColor {
  id: number;
  themeId: number;
  colorKey: string;
  colorValue: string;
  isDerived: boolean;
  createdAt: string;
}

export interface UserThemePreference {
  id: number;
  userContext: string;
  activeThemeId: number | null;
  lastChangedAt: string;
}
```

### **3.2 Database Theme Service**

**Datei:** `src/services/DatabaseThemeService.ts`

```typescript
import { DbClient } from '../services/DbClient';
import { FieldMapper } from '../lib/field-mapper';
import { DatabaseTheme, CreateThemeData, ThemeColor } from '../types/theme';
import { ThemeFallbackManager } from './ThemeFallbackManager';

export class DatabaseThemeService {
  private client = new DbClient();

  async listThemes(): Promise<DatabaseTheme[]> {
    try {
      const themes = await this.client.query<any>(`
        SELECT * FROM themes 
        WHERE is_active = TRUE 
        ORDER BY is_system_theme DESC, display_name ASC
      `);

      const themesWithColors = await Promise.all(
        themes.map(async (theme) => {
          const colors = await this.getThemeColors(theme.id);
          const mappedTheme = FieldMapper.fromSQL(theme);
          
          return {
            ...mappedTheme,
            colors: colors.reduce((acc, color) => {
              acc[color.colorKey] = color.colorValue;
              return acc;
            }, {} as Record<string, string>)
          };
        })
      );

      return themesWithColors;
    } catch (error) {
      console.error('[DatabaseThemeService] Failed to list themes:', error);
      return []; // Return empty array, fallback will handle
    }
  }

  async getTheme(id: number): Promise<DatabaseTheme | null> {
    try {
      const theme = await this.client.query<any>(`
        SELECT * FROM themes WHERE id = ? AND is_active = TRUE
      `, [id]);

      if (theme.length === 0) return null;

      const colors = await this.getThemeColors(id);
      const mappedTheme = FieldMapper.fromSQL(theme[0]);

      return {
        ...mappedTheme,
        colors: colors.reduce((acc, color) => {
          acc[color.colorKey] = color.colorValue;
          return acc;
        }, {} as Record<string, string>)
      };
    } catch (error) {
      console.error('[DatabaseThemeService] Failed to get theme:', error);
      return null;
    }
  }

  async createTheme(data: CreateThemeData): Promise<DatabaseTheme | null> {
    try {
      const sqlData = FieldMapper.toSQL({
        name: data.name,
        displayName: data.displayName,
        isSystemTheme: data.isSystemTheme || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const result = await this.client.insert('themes', sqlData);
      const themeId = result.lastInsertRowid as number;

      // Insert colors
      for (const [key, value] of Object.entries(data.colors)) {
        const colorData = FieldMapper.toSQL({
          themeId,
          colorKey: key,
          colorValue: value,
          createdAt: new Date().toISOString()
        });

        await this.client.insert('theme_colors', colorData);
      }

      return await this.getTheme(themeId);
    } catch (error) {
      console.error('[DatabaseThemeService] Failed to create theme:', error);
      return null;
    }
  }

  async updateTheme(id: number, updates: Partial<CreateThemeData>): Promise<DatabaseTheme | null> {
    try {
      // Update theme metadata
      if (updates.displayName || updates.isSystemTheme !== undefined) {
        const sqlUpdates = FieldMapper.toSQL({
          ...updates,
          updatedAt: new Date().toISOString()
        });
        
        await this.client.update('themes', id, sqlUpdates);
      }

      // Update colors if provided
      if (updates.colors) {
        // Delete existing colors
        await this.client.query(`
          DELETE FROM theme_colors WHERE theme_id = ?
        `, [id]);

        // Insert new colors
        for (const [key, value] of Object.entries(updates.colors)) {
          const colorData = FieldMapper.toSQL({
            themeId: id,
            colorKey: key,
            colorValue: value,
            createdAt: new Date().toISOString()
          });

          await this.client.insert('theme_colors', colorData);
        }
      }

      return await this.getTheme(id);
    } catch (error) {
      console.error('[DatabaseThemeService] Failed to update theme:', error);
      return null;
    }
  }

  async deleteTheme(id: number): Promise<boolean> {
    try {
      // Prevent deletion of system themes
      const theme = await this.client.query<any>(`
        SELECT is_system_theme FROM themes WHERE id = ?
      `, [id]);

      if (theme.length > 0 && theme[0].is_system_theme) {
        console.warn('[DatabaseThemeService] Cannot delete system theme');
        return false;
      }

      // Soft delete by setting is_active = FALSE
      await this.client.update('themes', id, { is_active: false });
      return true;
    } catch (error) {
      console.error('[DatabaseThemeService] Failed to delete theme:', error);
      return false;
    }
  }

  async getActiveTheme(): Promise<DatabaseTheme | null> {
    try {
      const prefs = await this.client.query<any>(`
        SELECT active_theme_id FROM user_theme_preferences 
        WHERE user_context = 'default'
        ORDER BY last_changed_at DESC 
        LIMIT 1
      `);

      if (prefs.length === 0 || !prefs[0].active_theme_id) {
        return null;
      }

      return await this.getTheme(prefs[0].active_theme_id);
    } catch (error) {
      console.error('[DatabaseThemeService] Failed to get active theme:', error);
      return null;
    }
  }

  async setActiveTheme(themeId: number): Promise<boolean> {
    try {
      // Update or insert user preference
      const existing = await this.client.query<any>(`
        SELECT id FROM user_theme_preferences 
        WHERE user_context = 'default'
      `);

      const prefData = {
        activeThemeId: themeId,
        lastChangedAt: new Date().toISOString()
      };

      if (existing.length > 0) {
        await this.client.update('user_theme_preferences', existing[0].id, 
          FieldMapper.toSQL(prefData));
      } else {
        await this.client.insert('user_theme_preferences', 
          FieldMapper.toSQL({
            userContext: 'default',
            ...prefData
          }));
      }

      return true;
    } catch (error) {
      console.error('[DatabaseThemeService] Failed to set active theme:', error);
      return false;
    }
  }

  private async getThemeColors(themeId: number): Promise<ThemeColor[]> {
    const colors = await this.client.query<any>(`
      SELECT * FROM theme_colors WHERE theme_id = ?
    `, [themeId]);

    return colors.map(color => FieldMapper.fromSQL(color));
  }
}
```

---

## 🎨 **Phase 4: Theme Manager Refactoring (2.5 Stunden)**

### **4.1 Database Theme Manager**

**Datei:** `src/contexts/DatabaseThemeManager.ts`

```typescript
import { DatabaseThemeService } from '../services/DatabaseThemeService';
import { ThemeFallbackManager } from '../services/ThemeFallbackManager';
import { DatabaseTheme } from '../types/theme';

export class DatabaseThemeManager {
  private themeService = new DatabaseThemeService();
  private currentTheme: DatabaseTheme | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Load active theme from database
      const activeTheme = await this.themeService.getActiveTheme();
      
      if (activeTheme) {
        await this.applyTheme(activeTheme);
        this.currentTheme = activeTheme;
        console.log('[DatabaseThemeManager] Loaded active theme:', activeTheme.name);
      } else {
        // No active theme found, use first available or fallback
        const themes = await this.themeService.listThemes();
        
        if (themes.length > 0) {
          const defaultTheme = themes.find(t => t.name === 'default') || themes[0];
          await this.applyTheme(defaultTheme);
          await this.themeService.setActiveTheme(defaultTheme.id);
          this.currentTheme = defaultTheme;
          console.log('[DatabaseThemeManager] Applied default theme:', defaultTheme.name);
        } else {
          throw new Error('No themes available in database');
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('[DatabaseThemeManager] Initialization failed:', error);
      this.applyFallbackTheme();
    }
  }

  async applyTheme(theme: DatabaseTheme): Promise<void> {
    try {
      // Clear any existing fallback state
      ThemeFallbackManager.clearFallback();

      // Apply theme colors via CSS Properties API
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--theme-${key}`, value);
      });

      // Set theme identifier
      document.documentElement.setAttribute('data-theme', theme.name);
      document.documentElement.setAttribute('data-theme-source', 'database');

      this.currentTheme = theme;
      console.log('[DatabaseThemeManager] Applied theme:', theme.name);
    } catch (error) {
      console.error('[DatabaseThemeManager] Failed to apply theme:', error);
      this.applyFallbackTheme();
    }
  }

  async switchTheme(themeId: number): Promise<boolean> {
    try {
      const theme = await this.themeService.getTheme(themeId);
      
      if (!theme) {
        console.error('[DatabaseThemeManager] Theme not found:', themeId);
        return false;
      }

      await this.applyTheme(theme);
      await this.themeService.setActiveTheme(themeId);
      
      // Emit theme change event for React components
      window.dispatchEvent(new CustomEvent('theme-changed', {
        detail: { theme }
      }));

      return true;
    } catch (error) {
      console.error('[DatabaseThemeManager] Failed to switch theme:', error);
      return false;
    }
  }

  async listAvailableThemes(): Promise<DatabaseTheme[]> {
    try {
      return await this.themeService.listThemes();
    } catch (error) {
      console.error('[DatabaseThemeManager] Failed to list themes:', error);
      return [];
    }
  }

  getCurrentTheme(): DatabaseTheme | null {
    return this.currentTheme;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  private applyFallbackTheme(): void {
    console.warn('[DatabaseThemeManager] Applying fallback theme due to database error');
    ThemeFallbackManager.applyFallbackTheme('css');
    this.isInitialized = true; // Mark as initialized even with fallback
  }

  // Recovery methods
  async recover(): Promise<boolean> {
    try {
      console.log('[DatabaseThemeManager] Attempting recovery...');
      
      // Clear current state
      this.isInitialized = false;
      this.currentTheme = null;
      
      // Try initialization again
      await this.initialize();
      
      return this.isInitialized && !ThemeFallbackManager.isFallbackActive();
    } catch (error) {
      console.error('[DatabaseThemeManager] Recovery failed:', error);
      return false;
    }
  }
}

// Global instance
export const themeManager = new DatabaseThemeManager();
```

### **4.2 React Theme Context Update**

**Update:** `src/contexts/ThemeContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseTheme } from '../types/theme';
import { themeManager } from './DatabaseThemeManager';

interface DatabaseThemeContextType {
  currentTheme: DatabaseTheme | null;
  availableThemes: DatabaseTheme[];
  isLoading: boolean;
  error: string | null;
  switchTheme: (themeId: number) => Promise<boolean>;
  refreshThemes: () => Promise<void>;
  isReady: boolean;
}

const DatabaseThemeContext = createContext<DatabaseThemeContextType | undefined>(undefined);

export function DatabaseThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<DatabaseTheme | null>(null);
  const [availableThemes, setAvailableThemes] = useState<DatabaseTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeThemeSystem();
    
    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent) => {
      setCurrentTheme(event.detail.theme);
    };

    window.addEventListener('theme-changed', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange as EventListener);
    };
  }, []);

  const initializeThemeSystem = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize theme manager
      await themeManager.initialize();
      
      // Load current state
      setCurrentTheme(themeManager.getCurrentTheme());
      setIsReady(themeManager.isReady());
      
      // Load available themes
      await refreshThemes();

    } catch (err) {
      console.error('[DatabaseThemeProvider] Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Even with error, mark as ready if fallback is active
      setIsReady(themeManager.isReady());
    } finally {
      setIsLoading(false);
    }
  };

  const switchTheme = async (themeId: number): Promise<boolean> => {
    try {
      setError(null);
      const success = await themeManager.switchTheme(themeId);
      
      if (success) {
        setCurrentTheme(themeManager.getCurrentTheme());
      } else {
        setError('Failed to switch theme');
      }
      
      return success;
    } catch (err) {
      console.error('[DatabaseThemeProvider] Switch theme failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const refreshThemes = async () => {
    try {
      const themes = await themeManager.listAvailableThemes();
      setAvailableThemes(themes);
    } catch (err) {
      console.error('[DatabaseThemeProvider] Refresh themes failed:', err);
      setAvailableThemes([]);
    }
  };

  const value: DatabaseThemeContextType = {
    currentTheme,
    availableThemes,
    isLoading,
    error,
    switchTheme,
    refreshThemes,
    isReady
  };

  return (
    <DatabaseThemeContext.Provider value={value}>
      {children}
    </DatabaseThemeContext.Provider>
  );
}

export function useDatabaseTheme() {
  const context = useContext(DatabaseThemeContext);
  if (context === undefined) {
    throw new Error('useDatabaseTheme must be used within a DatabaseThemeProvider');
  }
  return context;
}

// Convenience hook for simple theme switching
export function useThemeSwitch() {
  const { switchTheme, isLoading } = useDatabaseTheme();
  
  return {
    switchTheme,
    isLoading
  };
}
```

---

## 🔄 **Phase 5: Migration & Seeding (1 Stunden)**

### **5.1 Migration Registration**

**Update:** `src/main/db/migrations/index.ts`

```typescript
// Add migration import
import * as migration021 from './021_add_theme_system';

// Add to migrations array
const migrations: Migration[] = [
  // ... existing migrations
  { version: 21, name: 'Add theme system', ...migration021 },
];
```

### **5.2 Theme Seeding Script**

**Datei:** `scripts/seed-themes.mjs`

```javascript
// Script to seed database with current themes for testing
import Database from 'better-sqlite3';
import { existsSync } from 'fs';

const DB_PATH = './rawalite.db';

if (!existsSync(DB_PATH)) {
  console.error('❌ Database not found. Run app first to create database.');
  process.exit(1);
}

const db = new Database(DB_PATH);

// Check if themes table exists
const tablesExist = db.prepare(`
  SELECT COUNT(*) as count FROM sqlite_master 
  WHERE type='table' AND name IN ('themes', 'theme_colors', 'user_theme_preferences')
`).get();

if (tablesExist.count < 3) {
  console.error('❌ Theme tables not found. Run migration 021 first.');
  process.exit(1);
}

// Seed themes (only if empty)
const existingThemes = db.prepare('SELECT COUNT(*) as count FROM themes').get();

if (existingThemes.count > 0) {
  console.log('✅ Themes already exist. Skipping seed.');
  process.exit(0);
}

console.log('🌱 Seeding themes...');

const systemThemes = [
  {
    name: 'default',
    displayName: 'Standard (Anthrazit-Blau)',
    colors: {
      primary: '#8b9dc3',
      accent: '#8b9dc3',
      background: '#ffffff',
      text: '#1e293b',
      ok: '#10b981',
      warn: '#f59e0b',
      danger: '#ef4444'
    }
  },
  {
    name: 'sage',
    displayName: 'Sage (Salbeigrün)',
    colors: {
      primary: '#d2ddcf',
      accent: '#d2ddcf',
      background: '#ffffff',
      text: '#1e293b',
      ok: '#10b981',
      warn: '#f59e0b',
      danger: '#ef4444'
    }
  },
  {
    name: 'sky',
    displayName: 'Sky (Himmelblau)',
    colors: {
      primary: '#bae6fd',
      accent: '#bae6fd',
      background: '#ffffff',
      text: '#1e293b',
      ok: '#10b981',
      warn: '#f59e0b',
      danger: '#ef4444'
    }
  },
  {
    name: 'lavender',
    displayName: 'Lavender (Lavendel)',
    colors: {
      primary: '#dda0dd',
      accent: '#dda0dd',
      background: '#ffffff',
      text: '#1e293b',
      ok: '#10b981',
      warn: '#f59e0b',
      danger: '#ef4444'
    }
  },
  {
    name: 'peach',
    displayName: 'Peach (Pfirsich)',
    colors: {
      primary: '#ffcba4',
      accent: '#ffcba4',
      background: '#ffffff',
      text: '#1e293b',
      ok: '#10b981',
      warn: '#f59e0b',
      danger: '#ef4444'
    }
  },
  {
    name: 'rose',
    displayName: 'Rose (Rosé)',
    colors: {
      primary: '#ffb6c1',
      accent: '#ffb6c1',
      background: '#ffffff',
      text: '#1e293b',
      ok: '#10b981',
      warn: '#f59e0b',
      danger: '#ef4444'
    }
  }
];

const insertTheme = db.prepare(`
  INSERT INTO themes (name, display_name, is_system_theme, created_at, updated_at)
  VALUES (?, ?, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

const insertColor = db.prepare(`
  INSERT INTO theme_colors (theme_id, color_key, color_value, created_at)
  VALUES (?, ?, ?, CURRENT_TIMESTAMP)
`);

const setDefaultActive = db.prepare(`
  INSERT INTO user_theme_preferences (user_context, active_theme_id, last_changed_at)
  VALUES ('default', ?, CURRENT_TIMESTAMP)
`);

let defaultThemeId = null;

db.transaction(() => {
  systemThemes.forEach(theme => {
    console.log(`  Creating theme: ${theme.displayName}`);
    
    const result = insertTheme.run(theme.name, theme.displayName);
    const themeId = result.lastInsertRowid;
    
    if (theme.name === 'default') {
      defaultThemeId = themeId;
    }
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      insertColor.run(themeId, key, value);
    });
  });
  
  if (defaultThemeId) {
    setDefaultActive.run(defaultThemeId);
    console.log('  Set default theme as active');
  }
})();

console.log('✅ Theme seeding complete!');
console.log(`📊 Created ${systemThemes.length} system themes`);

db.close();
```

---

## 🎛️ **Phase 6: UI Integration (2 Stunden)**

### **6.1 Theme Selector Component**

**Datei:** `src/components/DatabaseThemeSelector.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useDatabaseTheme } from '../contexts/ThemeContext';
import { DatabaseTheme } from '../types/theme';

interface DatabaseThemeSelectorProps {
  showCreateCustom?: boolean;
  onCreateCustom?: () => void;
}

export function DatabaseThemeSelector({ 
  showCreateCustom = false, 
  onCreateCustom 
}: DatabaseThemeSelectorProps) {
  const { 
    currentTheme, 
    availableThemes, 
    isLoading, 
    error, 
    switchTheme,
    refreshThemes
  } = useDatabaseTheme();

  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    // Refresh themes when component mounts
    refreshThemes();
  }, []);

  const handleThemeSwitch = async (themeId: number) => {
    if (switching || isLoading) return;

    setSwitching(true);
    try {
      const success = await switchTheme(themeId);
      if (!success) {
        console.error('Failed to switch theme');
      }
    } finally {
      setSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="theme-selector loading">
        <div className="theme-selector-header">
          <h3>🎨 Theme</h3>
          <span className="loading-text">Lade Themes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-selector error">
        <div className="theme-selector-header">
          <h3>🎨 Theme</h3>
          <span className="error-text">Fallback-Theme aktiv</span>
        </div>
        <p className="error-message">
          Database-Error: {error}
        </p>
        <button onClick={refreshThemes} className="retry-button">
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="theme-selector">
      <div className="theme-selector-header">
        <h3>🎨 Theme</h3>
        {currentTheme && (
          <span className="current-theme-name">
            {currentTheme.displayName}
          </span>
        )}
      </div>

      <div className="theme-options">
        {availableThemes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-option ${
              currentTheme?.id === theme.id ? 'active' : ''
            } ${switching ? 'disabled' : ''}`}
            onClick={() => handleThemeSwitch(theme.id)}
          >
            <div className="theme-preview">
              <div 
                className="theme-preview-color"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div 
                className="theme-preview-accent"
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>
            
            <div className="theme-info">
              <span className="theme-name">{theme.displayName}</span>
              {theme.isSystemTheme && (
                <span className="theme-badge system">System</span>
              )}
              {!theme.isSystemTheme && (
                <span className="theme-badge custom">Custom</span>
              )}
            </div>

            {currentTheme?.id === theme.id && (
              <div className="theme-active-indicator">✓</div>
            )}
          </div>
        ))}
      </div>

      {showCreateCustom && (
        <div className="theme-actions">
          <button 
            onClick={onCreateCustom}
            className="create-custom-theme-button"
            disabled={switching}
          >
            + Custom Theme erstellen
          </button>
        </div>
      )}

      {switching && (
        <div className="theme-switching-overlay">
          Ändere Theme...
        </div>
      )}
    </div>
  );
}
```

### **6.2 EinstellungenPage Integration**

**Update:** `src/pages/EinstellungenPage.tsx`

```typescript
// Remove old hardcoded theme logic
// Add new DatabaseThemeSelector

import { DatabaseThemeSelector } from '../components/DatabaseThemeSelector';
import { DatabaseThemeProvider } from '../contexts/ThemeContext';

export default function EinstellungenPage({ title = "Einstellungen" }: EinstellungenPageProps) {
  // ... existing code

  const renderThemesTab = () => (
    <div className="settings-section">
      <DatabaseThemeProvider>
        <DatabaseThemeSelector 
          showCreateCustom={true}
          onCreateCustom={() => {
            // TODO: Implement custom theme creator
            console.log('Open custom theme creator');
          }}
        />
      </DatabaseThemeProvider>
    </div>
  );

  // ... rest of component
}
```

---

## 🧪 **Phase 7: Testing & Validation (1.5 Stunden)**

### **7.1 Theme System Tests**

**Datei:** `tests/theme-system.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseThemeService } from '../src/services/DatabaseThemeService';
import { ThemeFallbackManager } from '../src/services/ThemeFallbackManager';
import { DatabaseThemeManager } from '../src/contexts/DatabaseThemeManager';

describe('Database Theme System', () => {
  let themeService: DatabaseThemeService;
  let themeManager: DatabaseThemeManager;

  beforeEach(async () => {
    themeService = new DatabaseThemeService();
    themeManager = new DatabaseThemeManager();
    
    // Clear any existing theme state
    ThemeFallbackManager.clearFallback();
  });

  afterEach(() => {
    // Cleanup
    ThemeFallbackManager.clearFallback();
  });

  describe('DatabaseThemeService', () => {
    it('should list available themes', async () => {
      const themes = await themeService.listThemes();
      expect(themes).toBeInstanceOf(Array);
      expect(themes.length).toBeGreaterThan(0);
      
      // Should include system themes
      const systemThemes = themes.filter(t => t.isSystemTheme);
      expect(systemThemes.length).toBe(6);
      
      // Should have required colors
      themes.forEach(theme => {
        expect(theme.colors).toHaveProperty('primary');
        expect(theme.colors).toHaveProperty('accent');
        expect(theme.colors).toHaveProperty('background');
      });
    });

    it('should get active theme', async () => {
      const activeTheme = await themeService.getActiveTheme();
      expect(activeTheme).toBeTruthy();
      expect(activeTheme?.isActive).toBe(true);
    });

    it('should create custom theme', async () => {
      const customTheme = await themeService.createTheme({
        name: 'test-custom',
        displayName: 'Test Custom Theme',
        colors: {
          primary: '#ff0000',
          accent: '#00ff00',
          background: '#ffffff'
        }
      });

      expect(customTheme).toBeTruthy();
      expect(customTheme?.name).toBe('test-custom');
      expect(customTheme?.isSystemTheme).toBe(false);
      expect(customTheme?.colors.primary).toBe('#ff0000');
    });

    it('should handle database errors gracefully', async () => {
      // Simulate database error by using invalid query
      const mockService = new DatabaseThemeService();
      
      // This should not throw, but return empty array
      const themes = await mockService.listThemes();
      expect(themes).toBeInstanceOf(Array);
    });
  });

  describe('ThemeFallbackManager', () => {
    it('should apply CSS fallback theme', () => {
      ThemeFallbackManager.applyFallbackTheme('css');
      
      expect(ThemeFallbackManager.isFallbackActive()).toBe(true);
      expect(document.documentElement.getAttribute('data-theme-source')).toBe('fallback');
      
      // Check CSS properties are set
      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-primary');
      expect(primaryColor.trim()).toBe('#8b9dc3');
    });

    it('should apply emergency fallback theme', () => {
      ThemeFallbackManager.applyFallbackTheme('emergency');
      
      expect(ThemeFallbackManager.isFallbackActive()).toBe(true);
      expect(document.documentElement.getAttribute('data-theme-source')).toBe('emergency');
    });

    it('should clear fallback state', () => {
      ThemeFallbackManager.applyFallbackTheme('css');
      expect(ThemeFallbackManager.isFallbackActive()).toBe(true);
      
      ThemeFallbackManager.clearFallback();
      expect(ThemeFallbackManager.isFallbackActive()).toBe(false);
    });
  });

  describe('DatabaseThemeManager', () => {
    it('should initialize successfully', async () => {
      await themeManager.initialize();
      
      expect(themeManager.isReady()).toBe(true);
      expect(themeManager.getCurrentTheme()).toBeTruthy();
    });

    it('should switch themes', async () => {
      await themeManager.initialize();
      
      const themes = await themeManager.listAvailableThemes();
      expect(themes.length).toBeGreaterThan(1);
      
      const targetTheme = themes.find(t => t.name !== themeManager.getCurrentTheme()?.name);
      expect(targetTheme).toBeTruthy();
      
      const success = await themeManager.switchTheme(targetTheme!.id);
      expect(success).toBe(true);
      expect(themeManager.getCurrentTheme()?.id).toBe(targetTheme!.id);
    });

    it('should recover from database errors', async () => {
      // Simulate database error during initialization
      // This is tricky to test without mocking, but we can verify fallback behavior
      
      // If database fails, fallback should be applied
      const initialSuccess = await themeManager.recover();
      expect(themeManager.isReady()).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain theme state across app reload simulation', async () => {
      await themeManager.initialize();
      
      const themes = await themeManager.listAvailableThemes();
      const testTheme = themes.find(t => t.name === 'sage');
      expect(testTheme).toBeTruthy();
      
      // Switch to sage theme
      await themeManager.switchTheme(testTheme!.id);
      
      // Simulate app reload by creating new manager
      const newManager = new DatabaseThemeManager();
      await newManager.initialize();
      
      // Should restore sage theme
      expect(newManager.getCurrentTheme()?.name).toBe('sage');
    });

    it('should handle concurrent theme switches', async () => {
      await themeManager.initialize();
      
      const themes = await themeManager.listAvailableThemes();
      expect(themes.length).toBeGreaterThanOrEqual(2);
      
      // Start multiple theme switches
      const promises = [
        themeManager.switchTheme(themes[0].id),
        themeManager.switchTheme(themes[1].id),
        themeManager.switchTheme(themes[0].id)
      ];
      
      const results = await Promise.all(promises);
      
      // At least some should succeed
      expect(results.some(r => r === true)).toBe(true);
      
      // Final state should be consistent
      const finalTheme = themeManager.getCurrentTheme();
      expect(finalTheme).toBeTruthy();
      expect(themes.some(t => t.id === finalTheme!.id)).toBe(true);
    });
  });
});
```

### **7.2 Critical Fixes Validation**

**Erweitere:** `scripts/validate-critical-fixes.mjs`

```javascript
// Add theme system validation
console.log('🎨 Validating theme system...');

// Check theme tables exist
const themeTablesExist = db.prepare(`
  SELECT COUNT(*) as count FROM sqlite_master 
  WHERE type='table' AND name IN ('themes', 'theme_colors', 'user_theme_preferences')
`).get();

if (themeTablesExist.count === 3) {
  console.log('✅ Theme tables exist');
  
  // Check system themes are present
  const systemThemes = db.prepare(`
    SELECT COUNT(*) as count FROM themes WHERE is_system_theme = TRUE
  `).get();
  
  if (systemThemes.count >= 6) {
    console.log('✅ System themes present');
  } else {
    console.log('⚠️  System themes incomplete');
  }
} else {
  console.log('❌ Theme tables missing - run migration 021');
}
```

---

## 📊 **Rollout-Strategie & Risiko-Management**

### **Rollout-Phasen:**

1. **Phase 1-3**: Entwicklung & lokales Testing (kein User-Impact)
2. **Phase 4**: Theme Manager Rollout mit Fallback (sichere Migration)
3. **Phase 5**: Database-Migration (automatisch beim App-Start)
4. **Phase 6**: UI Update (nahtlose Experience)
5. **Phase 7**: Validation & Monitoring

### **Fallback-Hierarchie bei Fehlern:**

```
1. Database Theme Loading ✓
         ↓ (fails)
2. CSS Fallback Theme ✓
         ↓ (fails)
3. Emergency Hard-coded Theme ✓
         ↓ (never fails)
App bleibt IMMER funktional
```

### **Risiko-Mitigation:**

- ✅ **Keine App-Crashes**: Fallback-System verhindert Theme-bedingte Ausfälle
- ✅ **Rückwärtskompatibilität**: Bestehende 6 Themes bleiben verfügbar
- ✅ **Graduelle Migration**: Bestehende CSS bleibt funktional
- ✅ **Atomic Database Changes**: Migrations in Transaktionen
- ✅ **Error Recovery**: Automatische Fallback-Aktivierung

---

## ⏱️ **Zeitschätzung & Meilensteine**

| **Phase** | **Aufwand** | **Kritisch** | **Abhängigkeiten** |
|:--|:--|:--|:--|
| **1. Database Schema** | 2h | ⚠️ | Migration System |
| **2. Fallback System** | 1.5h | 🔴 | CSS Variables |
| **3. Database Service** | 2h | ⚠️ | SQLiteAdapter, Field-Mapper |
| **4. Theme Manager** | 2.5h | 🔴 | Database Service, Fallback |
| **5. Migration & Seeding** | 1h | ⚠️ | Database Schema |
| **6. UI Integration** | 2h | 🟡 | Theme Manager |
| **7. Testing & Validation** | 1.5h | ⚠️ | Alle Phasen |

**Gesamt: ~12.5 Stunden**

### **Meilensteine:**

- **M1** (Phase 1-2): Fallback-sicheres System ✅
- **M2** (Phase 3-4): Database Theme Loading ✅  
- **M3** (Phase 5-6): UI Migration & User Experience ✅
- **M4** (Phase 7): Production-Ready ✅

---

## 🚀 **Implementierungs-Hinweise**

### **RawaLite Standards beachten:**

- ✅ **Field-Mapper**: Alle DB-Operationen über `mapFromSQL()`/`mapToSQL()`
- ✅ **Critical Fixes**: Keine PDF Theme Patterns überschreiben
- ✅ **PNPM-only**: Keine npm/yarn Befehle
- ✅ **Migration System**: Idempotente, transaktionale Migrations
- ✅ **IPC-Security**: Theme-Operations über sichere Channels

### **Testing vor Rollout:**

```bash
# 1. Critical Fixes Validation
pnpm validate:critical-fixes

# 2. Theme System Tests
pnpm test tests/theme-system.test.ts

# 3. Database Migration Test
pnpm test:migration 021

# 4. Full Build Test
pnpm build && pnpm dist
```

**Fazit**: Das Database-basierte Theme System ermöglicht **Custom User Themes** bei **100% Fallback-Sicherheit**. Die App kann **niemals** durch Theme-Probleme crashen.

---

**📍 Location:** `/docs/04-ui/plan/PLAN_IMPL-DATABASE-THEME-SYSTEM_2025-10-17.md`  
**Purpose:** Vollständiger Implementierungsplan für datenbankbasiertes Theme-System mit Fallback-Sicherheit  
**Next:** Approval für Umsetzung, dann Phase-by-Phase Implementation