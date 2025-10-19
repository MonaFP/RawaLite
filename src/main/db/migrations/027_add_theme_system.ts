/**
 * Migration 027: Add Database-Theme-System
 * 
 * Introduces database-first theme management with:
 * - themes: System and custom theme definitions
 * - theme_colors: Key-value color definitions for themes
 * - user_theme_preferences: User's active theme selection
 * 
 * Enables unlimited custom themes while maintaining fallback compatibility
 * with existing CSS-based themes (default, sage, sky, lavender, peach, rose).
 * 
 * @since v1.0.42.7 (Database-Theme-System)
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-MIGRATION-027-THEME-SYSTEM_2025-10-17.md} Migration 027 Implementation Documentation
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-DATABASE-THEME-SYSTEM_2025-10-17.md} Complete Database-Theme-System Documentation
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md} FIX-017: Migration 027 Integrity Protection
 */

import type { Database } from 'better-sqlite3';

/**
 * Apply migration: Create theme system tables and seed with existing themes
 */
export const up = (db: Database): void => {
  console.log('🗄️ [Migration 027] Adding Database-Theme-System...');
  
  // Create themes table
  console.log('🔧 [Migration 027] Creating themes table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      is_system_theme INTEGER DEFAULT 0 CHECK (is_system_theme IN (0, 1)),
      is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create theme_colors table for key-value color definitions
  console.log('🔧 [Migration 027] Creating theme_colors table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS theme_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme_id INTEGER NOT NULL,
      color_key TEXT NOT NULL,
      color_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
      UNIQUE(theme_id, color_key)
    )
  `);
  
  // Create user_theme_preferences table
  console.log('🔧 [Migration 027] Creating user_theme_preferences table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_theme_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default' UNIQUE,
      active_theme_id INTEGER,
      fallback_theme_key TEXT DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (active_theme_id) REFERENCES themes(id) ON DELETE SET NULL
    )
  `);
  
  // Create indexes for performance
  console.log('🔧 [Migration 027] Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_themes_theme_key ON themes(theme_key);
    CREATE INDEX IF NOT EXISTS idx_themes_is_system_theme ON themes(is_system_theme);
    CREATE INDEX IF NOT EXISTS idx_theme_colors_theme_id ON theme_colors(theme_id);
    CREATE INDEX IF NOT EXISTS idx_theme_colors_color_key ON theme_colors(color_key);
    CREATE INDEX IF NOT EXISTS idx_user_theme_preferences_user_id ON user_theme_preferences(user_id);
  `);
  
  // Seed database with existing 6 system themes
  console.log('🔧 [Migration 027] Seeding system themes...');
  
  const insertTheme = db.prepare(`
    INSERT OR IGNORE INTO themes (theme_key, name, description, icon, is_system_theme)
    VALUES (?, ?, ?, ?, 1)
  `);
  
  const insertColor = db.prepare(`
    INSERT OR IGNORE INTO theme_colors (theme_id, color_key, color_value)
    VALUES (?, ?, ?)
  `);
  
  // System themes with their CSS color definitions
  const systemThemes = [
    {
      key: 'default',
      name: 'Standard',
      description: 'Klassisches Tannengrün Theme',
      icon: '🌲',
      colors: {
        'primary': '#1e3a2e',
        'accent': '#8b9dc3',
        'accent-hover': '#c1d0bc',
        'background': '#f1f5f9',
        'sidebar-bg': 'linear-gradient(160deg, #4a5d5a 0%, #3a4d4a 40%, #2f403d 100%)',
        'sidebar-green': '#4a5d5a',
        'sidebar-green-hover': '#3a4d4a',
        'main-bg': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        'card-bg': 'rgba(255,255,255,0.98)',
        'text-primary': '#1e293b',
        'text-secondary': '#374151'
      }
    },
    {
      key: 'sage',
      name: 'Salbeigrün',
      description: 'Dezentes Salbeigrün für augenschonende Atmosphäre',
      icon: '🟢',
      colors: {
        'primary': '#7d9b7d',
        'accent': '#d2ddcf',
        'accent-hover': '#c1d0bc',
        'background': '#fbfcfb',
        'sidebar-bg': 'linear-gradient(160deg, #4a5d5a 0%, #3a4d4a 40%, #2f403d 100%)',
        'sidebar-green': '#4a5d5a',
        'sidebar-green-hover': '#3a4d4a',
        'main-bg': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        'card-bg': 'rgba(255,255,255,0.98)',
        'text-primary': '#1e293b',
        'text-secondary': '#475569'
      }
    },
    {
      key: 'sky',
      name: 'Himmelblau',
      description: 'Sanftes Himmelblau für entspannte Eleganz',
      icon: '🔵',
      colors: {
        'primary': '#8bacc8',
        'accent': '#a2d1ec',
        'accent-hover': '#91c4dc',
        'background': '#fbfcfd',
        'sidebar-bg': 'linear-gradient(160deg, #4a5b6b 0%, #3d4e5e 40%, #324151 100%)',
        'sidebar-green': '#4a5b6b',
        'sidebar-green-hover': '#3d4e5e',
        'main-bg': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        'card-bg': 'rgba(255,255,255,0.98)',
        'text-primary': '#1e293b',
        'text-secondary': '#475569'
      }
    },
    {
      key: 'lavender',
      name: 'Lavendel',
      description: 'Beruhigendes Lavendel mit sanften Untertönen',
      icon: '🟣',
      colors: {
        'primary': '#a89dc8',
        'accent': '#cf9ad6',
        'accent-hover': '#c189cc',
        'background': '#fcfbfd',
        'sidebar-bg': 'linear-gradient(160deg, #5a4d6b 0%, #4d405e 40%, #403351 100%)',
        'sidebar-green': '#5a4d6b',
        'sidebar-green-hover': '#4d405e',
        'main-bg': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        'card-bg': 'rgba(255,255,255,0.98)',
        'text-primary': '#1e293b',
        'text-secondary': '#475569'
      }
    },
    {
      key: 'peach',
      name: 'Pfirsich',
      description: 'Warme Pfirsichtöne für gemütliche Lesbarkeit',
      icon: '🟠',
      colors: {
        'primary': '#c8a89d',
        'accent': '#feecd4',
        'accent-hover': '#eeddc1',
        'background': '#fdfcfb',
        'sidebar-bg': 'linear-gradient(160deg, #6b5a4d 0%, #5e4d40 40%, #514033 100%)',
        'sidebar-green': '#6b5a4d',
        'sidebar-green-hover': '#5e4d40',
        'main-bg': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        'card-bg': 'rgba(255,255,255,0.98)',
        'text-primary': '#1e293b',
        'text-secondary': '#475569'
      }
    },
    {
      key: 'rose',
      name: 'Rosé',
      description: 'Dezente Rosétöne für sanfte Eleganz',
      icon: '🌸',
      colors: {
        'primary': '#c89da8',
        'accent': '#feb2a8',
        'accent-hover': '#ed9e94',
        'background': '#fdfbfc',
        'sidebar-bg': 'linear-gradient(160deg, #6b4d5a 0%, #5e4050 40%, #513343 100%)',
        'sidebar-green': '#6b4d5a',
        'sidebar-green-hover': '#5e4050',
        'main-bg': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        'card-bg': 'rgba(255,255,255,0.98)',
        'text-primary': '#1e293b',
        'text-secondary': '#475569'
      }
    }
  ];
  
  for (const theme of systemThemes) {
    // Insert theme
    insertTheme.run(theme.key, theme.name, theme.description, theme.icon);
    
    // Get theme ID
    const themeId = db.prepare('SELECT id FROM themes WHERE theme_key = ?').get(theme.key) as { id: number };
    
    if (themeId) {
      // Insert colors
      for (const [colorKey, colorValue] of Object.entries(theme.colors)) {
        insertColor.run(themeId.id, colorKey, colorValue);
      }
    }
  }
  
  // Create default user preference
  console.log('🔧 [Migration 027] Creating default user preferences...');
  const defaultThemeId = db.prepare('SELECT id FROM themes WHERE theme_key = ?').get('default') as { id: number };
  
  if (defaultThemeId) {
    db.prepare(`
      INSERT OR IGNORE INTO user_theme_preferences (user_id, active_theme_id, fallback_theme_key)
      VALUES ('default', ?, 'default')
    `).run(defaultThemeId.id);
  }
  
  console.log('✅ [Migration 027] Database-Theme-System created successfully');
  console.log('📊 [Migration 027] Seeded 6 system themes with color definitions');
  console.log('🎨 [Migration 027] Themes: default, sage, sky, lavender, peach, rose');
  console.log('🛡️ [Migration 027] CSS fallback compatibility preserved');
};

/**
 * Revert migration: Remove theme system tables
 * 
 * Note: This will remove ALL custom themes and user preferences.
 * The app will fall back to hardcoded CSS themes.
 */
export const down = (db: Database): void => {
  console.log('🗄️ [Migration 027] Reverting Database-Theme-System...');
  
  console.log('⚠️  [Migration 027] Removing user theme preferences...');
  db.exec('DROP TABLE IF EXISTS user_theme_preferences');
  
  console.log('⚠️  [Migration 027] Removing theme colors...');
  db.exec('DROP TABLE IF EXISTS theme_colors');
  
  console.log('⚠️  [Migration 027] Removing themes...');
  db.exec('DROP TABLE IF EXISTS themes');
  
  console.log('✅ [Migration 027] Database-Theme-System removed successfully');
  console.log('🛡️ [Migration 027] App will fall back to CSS-based themes');
};