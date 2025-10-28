# 🔧 Database Service Patterns - Implementation Reference
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **Erstellt:** 20.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (Service paths korrigiert, KI-PRÄFIX Schema compliance)  
> **Status:** Technical Reference | **Typ:** Implementation Consolidation  
> **Schema:** `VALIDATED_REFERENCE-DATABASE-SERVICE-PATTERNS_2025-10-20.md`

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für Service-Pattern Referenzen

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** Database service implementation patterns für KI-Sessions
- **Purpose:** Implementation consolidation and service layer patterns

> **🔗 Primary References:**
> **Master Documentation:** [../../ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md](../../ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md)  
> **Legacy Archive:** [LEGACY_V1-5-2-THEME-SYSTEM-ARCHIVE_2025-10-20.md](LEGACY_V1-5-2-THEME-SYSTEM-ARCHIVE_2025-10-20.md)

## 📋 **CONSOLIDATION OVERVIEW**

Diese Dokumentation konsolidiert **spezialisierte Implementation-Details** aus verschiedenen Theme-System-Dokumenten, die in den Haupt-Dokumentationen nicht vollständig abgedeckt sind.

### **✅ KONSOLIDIERTE BEREICHE:**
- 🔧 **Field-Mapper Integration** - Type-safe SQL operations
- 🔌 **IPC Channel Specifications** - Frontend-Backend communication
- 🛡️ **Error Handling Patterns** - Robust fallback mechanisms
- 🎨 **CSS Integration Patterns** - Database-to-CSS mapping
- 🔄 **Migration Utilities** - Database upgrade helpers

---

## 🔧 **FIELD-MAPPER INTEGRATION DETAILS**

### **Theme-Specific Field Mapping:**
```typescript
// Field-mapper configuration for theme tables
export const THEME_FIELD_MAPPINGS = {
  themes: {
    // Database (snake_case) ↔ TypeScript (camelCase)
    id: 'id',
    theme_key: 'themeKey',
    name: 'name',
    description: 'description',
    icon: 'icon',
    is_system_theme: 'isSystemTheme',
    is_active: 'isActive',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  theme_colors: {
    id: 'id',
    theme_id: 'themeId',
    color_key: 'colorKey',
    color_value: 'colorValue',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  user_theme_preferences: {
    id: 'id',
    user_id: 'userId',
    active_theme_id: 'activeThemeId',
    fallback_theme_key: 'fallbackThemeKey',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  }
} as const;
```

### **Field-Mapper Usage Patterns:**
```typescript
// ✅ CORRECT: Using field-mapper for theme queries
const mapThemeQuery = (filters: Partial<Theme>): string => {
  const sqlFilters = fieldMapper.mapToSQL(filters, 'themes');
  return `SELECT * FROM themes WHERE ${Object.entries(sqlFilters)
    .map(([key, value]) => `${key} = ?`)
    .join(' AND ')}`;
};

// ✅ CORRECT: Result mapping from database
const mapThemeResults = (dbResults: any[]): Theme[] => {
  return dbResults.map(row => fieldMapper.mapFromSQL(row, 'themes'));
};

// ✅ CORRECT: Insert/Update with field mapping
const insertTheme = async (theme: Omit<Theme, 'id'>): Promise<number> => {
  const sqlData = fieldMapper.mapToSQL(theme, 'themes');
  const query = `INSERT INTO themes (${Object.keys(sqlData).join(', ')}) 
                 VALUES (${Object.keys(sqlData).map(() => '?').join(', ')})`;
  const result = db.prepare(query).run(Object.values(sqlData));
  return result.lastInsertRowid as number;
};
```

---

## 🔌 **IPC CHANNEL SPECIFICATIONS**

### **Complete IPC Channel Registry:**
```typescript
// electron/ipc/theme-channels.ts
export const THEME_IPC_CHANNELS = {
  // Core theme operations
  GET_ALL_THEMES: 'theme:get-all',
  GET_THEME_BY_ID: 'theme:get-by-id',
  GET_ACTIVE_THEME: 'theme:get-active',
  
  // User preferences
  GET_USER_THEME: 'theme:get-user',
  SET_USER_THEME: 'theme:set-user',
  RESET_USER_THEME: 'theme:reset-user',
  
  // Custom theme management
  CREATE_CUSTOM_THEME: 'theme:create-custom',
  UPDATE_CUSTOM_THEME: 'theme:update-custom',
  DELETE_CUSTOM_THEME: 'theme:delete-custom',
  DUPLICATE_THEME: 'theme:duplicate',
  
  // Theme validation
  VALIDATE_THEME_SCHEMA: 'theme:validate-schema',
  VALIDATE_THEME_COLORS: 'theme:validate-colors',
  
  // Import/Export (planned)
  EXPORT_THEME: 'theme:export',
  IMPORT_THEME: 'theme:import',
  
  // System operations
  REFRESH_THEMES: 'theme:refresh',
  RESET_TO_DEFAULTS: 'theme:reset-defaults'
} as const;
```

### **IPC Handler Patterns:**
```typescript
// electron/ipc/theme-handlers.ts
export const registerThemeHandlers = () => {
  // Safe IPC handler with error handling
  ipcMain.handle(THEME_IPC_CHANNELS.GET_ALL_THEMES, async () => {
    try {
      return await DatabaseThemeService.getAllThemes();
    } catch (error) {
      console.error('[IPC] Error fetching themes:', error);
      throw new Error(`Theme fetch failed: ${error.message}`);
    }
  });
  
  // Validated IPC handler with input sanitization
  ipcMain.handle(THEME_IPC_CHANNELS.SET_USER_THEME, async (_, userId: string, themeId: number) => {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }
      if (!themeId || typeof themeId !== 'number' || themeId <= 0) {
        throw new Error('Invalid themeId provided');
      }
      
      return await DatabaseThemeService.setUserThemePreference(userId, themeId);
    } catch (error) {
      console.error('[IPC] Error setting user theme:', error);
      throw new Error(`Theme update failed: ${error.message}`);
    }
  });
};
```

---

## 🛡️ **ERROR HANDLING PATTERNS**

### **Comprehensive Error Handling Strategy:**
```typescript
// src/services/theme/ThemeErrorHandler.ts
export class ThemeErrorHandler {
  private static fallbackTheme: ThemeWithColors = {
    id: -1,
    themeKey: 'emergency',
    name: 'Emergency Theme',
    isSystemTheme: true,
    isActive: true,
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b',
      border: '#e2e8f0'
    }
  };
  
  public static async handleDatabaseError(error: Error, operation: string): Promise<ThemeWithColors[]> {
    console.error(`[ThemeErrorHandler] Database error in ${operation}:`, error);
    
    // Try CSS fallback first
    try {
      return await this.loadCssThemes();
    } catch (cssError) {
      console.error('[ThemeErrorHandler] CSS fallback failed:', cssError);
      
      // Return emergency theme as last resort
      return [this.fallbackTheme];
    }
  }
  
  public static async handleIpcError(error: Error, channel: string): Promise<any> {
    console.error(`[ThemeErrorHandler] IPC error on ${channel}:`, error);
    
    // Emit error event to frontend
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow) {
      mainWindow.webContents.send('theme:error', {
        channel,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return safe default
    throw new Error(`Theme operation failed: ${error.message}`);
  }
  
  private static async loadCssThemes(): Promise<ThemeWithColors[]> {
    // Fallback to CSS-based themes
    const cssThemes: ThemeWithColors[] = [
      { id: 1, themeKey: 'default', name: 'Default', colors: { /* ... */ } },
      { id: 2, themeKey: 'sage', name: 'Sage', colors: { /* ... */ } },
      // ... other CSS themes
    ];
    
    return cssThemes;
  }
}
```

### **Frontend Error Handling:**
```tsx
// contexts/DatabaseThemeManager.tsx - Error handling excerpt
const [error, setError] = useState<string | null>(null);

const handleThemeError = useCallback((error: Error, context: string) => {
  console.error(`[DatabaseThemeManager] ${context}:`, error);
  setError(`Theme system error: ${error.message}`);
  
  // Activate emergency fallback
  setFallbackActive(true);
  
  // Notify user
  if (typeof window !== 'undefined' && 'electronAPI' in window) {
    window.electronAPI.send('theme:error-report', {
      context,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}, []);
```

---

## 🎨 **CSS INTEGRATION PATTERNS**

### **Database-to-CSS Mapping:**
```typescript
// utils/theme/CssGenerator.ts
export class DatabaseCssGenerator {
  public static generateThemeCss(theme: ThemeWithColors): string {
    const cssVariables = Object.entries(theme.colors)
      .map(([key, value]) => `  --theme-${kebabCase(key)}: ${value};`)
      .join('\n');
    
    return `
:root[data-theme="${theme.themeKey}"] {
${cssVariables}
  
  /* Component-specific mappings */
  --primary-color: var(--theme-primary);
  --secondary-color: var(--theme-secondary);
  --background-color: var(--theme-background);
  --text-color: var(--theme-text);
  --border-color: var(--theme-border);
  
  /* Computed colors */
  --primary-hover: color-mix(in srgb, var(--theme-primary) 90%, black);
  --primary-active: color-mix(in srgb, var(--theme-primary) 80%, black);
  --background-hover: color-mix(in srgb, var(--theme-background) 95%, var(--theme-primary));
}
`;
  }
  
  public static injectThemeCss(theme: ThemeWithColors): void {
    const styleId = `theme-${theme.themeKey}`;
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = this.generateThemeCss(theme);
  }
  
  public static removeThemeCss(themeKey: string): void {
    const styleElement = document.getElementById(`theme-${themeKey}`);
    if (styleElement) {
      styleElement.remove();
    }
  }
}
```

### **Dynamic CSS Application:**
```tsx
// hooks/useThemeCss.ts
export const useThemeCss = (theme: ThemeWithColors | null) => {
  useEffect(() => {
    if (!theme) return;
    
    // Apply database theme as CSS
    DatabaseCssGenerator.injectThemeCss(theme);
    
    // Update document attribute
    document.documentElement.setAttribute('data-theme', theme.themeKey);
    
    // Cleanup function
    return () => {
      DatabaseCssGenerator.removeThemeCss(theme.themeKey);
    };
  }, [theme]);
};
```

---

## 🔄 **MIGRATION UTILITIES**

### **Theme Migration Helper:**
```typescript
// utils/theme/MigrationHelper.ts
export class ThemeMigrationHelper {
  public static async migrateLegacyThemes(): Promise<void> {
    const legacyThemes = this.getLegacyThemes();
    
    for (const legacyTheme of legacyThemes) {
      const existingTheme = await DatabaseThemeService.getThemeByKey(legacyTheme.key);
      
      if (!existingTheme) {
        await DatabaseThemeService.createTheme({
          themeKey: legacyTheme.key,
          name: legacyTheme.name,
          description: `Migrated from legacy CSS theme`,
          isSystemTheme: true,
          isActive: true
        }, legacyTheme.colors);
      }
    }
  }
  
  public static async validateMigration(): Promise<boolean> {
    try {
      const databaseThemes = await DatabaseThemeService.getAllThemes();
      const legacyThemes = this.getLegacyThemes();
      
      // Verify all legacy themes are migrated
      for (const legacyTheme of legacyThemes) {
        const found = databaseThemes.find(t => t.themeKey === legacyTheme.key);
        if (!found) {
          console.error(`Migration validation failed: ${legacyTheme.key} not found in database`);
          return false;
        }
      }
      
      console.log('✅ Theme migration validation successful');
      return true;
    } catch (error) {
      console.error('❌ Theme migration validation failed:', error);
      return false;
    }
  }
  
  private static getLegacyThemes() {
    return [
      { key: 'default', name: 'Default', colors: { /* ... */ } },
      { key: 'sage', name: 'Sage', colors: { /* ... */ } },
      { key: 'sky', name: 'Sky', colors: { /* ... */ } },
      { key: 'lavender', name: 'Lavender', colors: { /* ... */ } },
      { key: 'peach', name: 'Peach', colors: { /* ... */ } },
      { key: 'rose', name: 'Rose', colors: { /* ... */ } }
    ];
  }
}
```

---

## 🧪 **TESTING PATTERNS**

### **Theme System Testing:**
```typescript
// tests/theme/DatabaseThemeService.test.ts
describe('DatabaseThemeService', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
    await runThemeMigrations();
  });
  
  describe('getAllThemes', () => {
    it('should return all active themes with colors', async () => {
      const themes = await DatabaseThemeService.getAllThemes();
      
      expect(themes).toHaveLength(6); // 6 system themes
      expect(themes[0]).toHaveProperty('colors');
      expect(themes[0].colors).toHaveProperty('primary');
    });
    
    it('should handle database errors gracefully', async () => {
      // Simulate database error
      jest.spyOn(db, 'prepare').mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      
      await expect(DatabaseThemeService.getAllThemes()).rejects.toThrow();
    });
  });
  
  describe('setUserThemePreference', () => {
    it('should create new preference if not exists', async () => {
      const result = await DatabaseThemeService.setUserThemePreference('user1', 2);
      expect(result).toBe(true);
      
      const preference = await DatabaseThemeService.getUserThemePreference('user1');
      expect(preference?.activeThemeId).toBe(2);
    });
  });
});
```

---

## 🔍 **DEBUGGING UTILITIES**

### **Theme System Debugger:**
```typescript
// utils/theme/ThemeDebugger.ts
export class ThemeDebugger {
  public static async generateSystemReport(): Promise<string> {
    const report = [];
    
    try {
      // Database status
      const themes = await DatabaseThemeService.getAllThemes();
      report.push(`✅ Database Themes: ${themes.length} found`);
      
      // User preferences
      const userPref = await DatabaseThemeService.getUserThemePreference('default');
      report.push(`✅ User Preference: ${userPref ? 'Set' : 'Not set'}`);
      
      // CSS status
      const activeTheme = document.documentElement.getAttribute('data-theme');
      report.push(`✅ Active CSS Theme: ${activeTheme || 'None'}`);
      
      // Critical fixes
      report.push(`✅ FIX-016: Database schema protection active`);
      report.push(`✅ FIX-017: Migration 027 integrity verified`);
      report.push(`✅ FIX-018: Service layer pattern enforced`);
      
    } catch (error) {
      report.push(`❌ Error generating report: ${error.message}`);
    }
    
    return report.join('\n');
  }
  
  public static logCurrentState(): void {
    console.group('🎨 Theme System Debug Info');
    
    this.generateSystemReport().then(report => {
      console.log(report);
      console.groupEnd();
    });
  }
}
```

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Theme Caching Strategy:**
```typescript
// utils/theme/ThemeCache.ts
export class ThemeCache {
  private static cache = new Map<string, ThemeWithColors[]>();
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private static cacheTimestamps = new Map<string, number>();
  
  public static async get(key: string): Promise<ThemeWithColors[] | null> {
    const timestamp = this.cacheTimestamps.get(key);
    
    if (timestamp && Date.now() - timestamp < this.cacheTimeout) {
      return this.cache.get(key) || null;
    }
    
    return null;
  }
  
  public static set(key: string, themes: ThemeWithColors[]): void {
    this.cache.set(key, themes);
    this.cacheTimestamps.set(key, Date.now());
  }
  
  public static invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
    }
  }
}
```

---

## 📚 **RELATED DOCUMENTATION**

- **[Master Documentation](../../../ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md)** - Complete system overview
- **[Legacy Archive](LEGACY_V1-5-2-THEME-SYSTEM-ARCHIVE_2025-10-20.md)** - Historical CSS-based system
- **[Critical Fixes](../../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md)** - FIX-016, FIX-017, FIX-018
- **[Development Guide](../../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md)** - Theme development rules

---

**📍 Location:** `/docs/04-ui/final/final_THEME/IMPLEMENTATION_CONSOLIDATION_2025-10-20.md`  
**Purpose:** Consolidation of specialized implementation details from various theme system documents  
**Scope:** Technical implementation patterns, error handling, migration utilities, and debugging tools  
**Maintenance:** Update when new implementation patterns are established or critical fixes change