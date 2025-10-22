-- Migration 036: Theme Overrides (Scoped Theme Configuration)
-- @since v1.0.46+ (Per-Mode Configuration System)
-- @priority CRITICAL (Database Schema Extension)
--
-- Enables scoped theme customization for navigation modes and focus states:
-- - Per-navigation-mode theme overrides
-- - Focus-mode specific theme adjustments
-- - CSS Custom Properties override system
-- - Theme inheritance and cascade control
--
-- Dependencies: Migration 027 (theme system), 034 (navigation_mode_settings), 035 (focus_mode_preferences)
-- Foreign Keys: user_navigation_preferences.user_id, theme_configurations.theme_id
-- Integration: DatabaseThemeService.getScopedThemeOverrides()

-- Create theme_overrides table for scoped customization
CREATE TABLE IF NOT EXISTS theme_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  
  -- Scope Configuration
  scope_type TEXT NOT NULL CHECK (scope_type IN ('navigation-mode', 'focus-mode', 'combined')),
  navigation_mode TEXT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')),
  is_focus_mode BOOLEAN NOT NULL DEFAULT 0,
  
  -- Theme Reference (optional - for base theme inheritance)
  base_theme_id TEXT NULL,
  
  -- CSS Custom Properties Overrides (JSON format for flexibility)
  css_variables TEXT NOT NULL DEFAULT '{}', -- JSON object with CSS custom property overrides
  
  -- Specific Override Categories
  color_overrides TEXT NULL,      -- JSON: {"primary": "#ff0000", "secondary": "#00ff00"}
  typography_overrides TEXT NULL, -- JSON: {"font-size": "14px", "line-height": "1.5"}
  spacing_overrides TEXT NULL,    -- JSON: {"padding": "8px", "margin": "16px"}
  animation_overrides TEXT NULL,  -- JSON: {"duration": "200ms", "easing": "ease-out"}
  
  -- Priority and Application Rules
  priority INTEGER NOT NULL DEFAULT 100 CHECK (priority >= 0 AND priority <= 1000),
  apply_to_descendants BOOLEAN NOT NULL DEFAULT 1,
  override_system_theme BOOLEAN NOT NULL DEFAULT 0,
  
  -- Conditional Application
  min_screen_width INTEGER NULL CHECK (min_screen_width >= 320),
  max_screen_width INTEGER NULL CHECK (max_screen_width <= 3840),
  time_based_activation TEXT NULL, -- JSON: {"start": "09:00", "end": "17:00"} for work hours themes
  
  -- Metadata
  name TEXT NULL,                 -- User-friendly name for the override
  description TEXT NULL,          -- Description of what this override does
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (user_id) REFERENCES user_navigation_preferences(user_id) ON DELETE CASCADE,
  FOREIGN KEY (base_theme_id) REFERENCES themes(theme_key) ON DELETE SET NULL,
  
  -- Validation: scope_type consistency
  CHECK (
    (scope_type = 'navigation-mode' AND navigation_mode IS NOT NULL AND is_focus_mode = 0) OR
    (scope_type = 'focus-mode' AND is_focus_mode = 1) OR
    (scope_type = 'combined' AND navigation_mode IS NOT NULL)
  )
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_theme_overrides_user_scope 
ON theme_overrides(user_id, scope_type, navigation_mode, is_focus_mode);

CREATE INDEX IF NOT EXISTS idx_theme_overrides_active 
ON theme_overrides(user_id, is_active, priority);

CREATE INDEX IF NOT EXISTS idx_theme_overrides_screen_size 
ON theme_overrides(min_screen_width, max_screen_width);

-- Insert default theme overrides for each navigation mode
INSERT OR IGNORE INTO theme_overrides 
(user_id, scope_type, navigation_mode, is_focus_mode, css_variables, color_overrides, 
 priority, apply_to_descendants, name, description, is_active)
VALUES 
-- Header-Statistics Mode: Optimized for data visualization
('default', 'navigation-mode', 'header-statistics', 0, '{"--header-bg-opacity": "0.95", "--sidebar-shadow": "0 2px 8px rgba(0,0,0,0.1)"}', 
 '{"accent": "var(--color-primary-600)", "background": "var(--color-neutral-50)"}', 
 200, 1, 'Statistics Mode Theme', 'Optimized theme for statistics and data visualization', 1),

-- Header-Navigation Mode: Clean and minimal
('default', 'navigation-mode', 'header-navigation', 0, '{"--header-height": "90px", "--sidebar-compact": "true"}', 
 '{"primary": "var(--color-blue-600)", "surface": "var(--color-white)"}', 
 200, 1, 'Navigation Mode Theme', 'Clean minimal theme for navigation focus', 1),

-- Full-Sidebar Mode: Rich sidebar experience
('default', 'navigation-mode', 'full-sidebar', 0, '{"--sidebar-width": "240px", "--content-padding": "24px"}', 
 '{"sidebar": "var(--color-gray-100)", "border": "var(--color-gray-200)"}', 
 200, 1, 'Full Sidebar Theme', 'Rich theme optimized for full sidebar experience', 1),

-- Focus Mode Overrides (applied regardless of navigation mode)
('default', 'focus-mode', NULL, 1, '{"--focus-overlay": "rgba(0,0,0,0.3)", "--focus-border": "2px solid var(--color-primary-500)"}', 
 '{"overlay": "rgba(0,0,0,0.3)", "focus-ring": "var(--color-primary-500)"}', 
 300, 1, 'Focus Mode Override', 'Theme adjustments for focus mode activation', 1),

-- Combined: Header-Statistics + Focus Mode
('default', 'combined', 'header-statistics', 1, '{"--stats-focus-highlight": "var(--color-amber-400)", "--animation-speed": "0.2s"}', 
 '{"highlight": "var(--color-amber-400)", "dimmed": "var(--color-gray-400)"}', 
 400, 1, 'Statistics Focus Theme', 'Combined theme for statistics view in focus mode', 1),

-- Combined: Full-Sidebar + Focus Mode  
('default', 'combined', 'full-sidebar', 1, '{"--sidebar-focus-blur": "blur(2px)", "--main-focus-scale": "1.02"}', 
 '{"blur-background": "rgba(255,255,255,0.8)", "focus-scale": "1.02"}', 
 400, 1, 'Sidebar Focus Theme', 'Combined theme for full sidebar in focus mode', 1);

-- Create trigger for updated_at maintenance
CREATE TRIGGER IF NOT EXISTS trigger_theme_overrides_updated_at 
AFTER UPDATE ON theme_overrides
FOR EACH ROW
BEGIN
  UPDATE theme_overrides 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- Populate theme overrides for all existing users
INSERT OR IGNORE INTO theme_overrides 
(user_id, scope_type, navigation_mode, is_focus_mode, css_variables, color_overrides, 
 priority, apply_to_descendants, name, description, is_active)
SELECT 
  unp.user_id,
  'navigation-mode' as scope_type,
  modes.mode as navigation_mode,
  0 as is_focus_mode,
  CASE modes.mode 
    WHEN 'header-statistics' THEN '{"--header-bg-opacity": "0.95", "--sidebar-shadow": "0 2px 8px rgba(0,0,0,0.1)"}'
    WHEN 'header-navigation' THEN '{"--header-height": "90px", "--sidebar-compact": "true"}'
    WHEN 'full-sidebar' THEN '{"--sidebar-width": "240px", "--content-padding": "24px"}'
  END as css_variables,
  CASE modes.mode 
    WHEN 'header-statistics' THEN '{"accent": "var(--color-primary-600)", "background": "var(--color-neutral-50)"}'
    WHEN 'header-navigation' THEN '{"primary": "var(--color-blue-600)", "surface": "var(--color-white)"}'
    WHEN 'full-sidebar' THEN '{"sidebar": "var(--color-gray-100)", "border": "var(--color-gray-200)"}'
  END as color_overrides,
  200 as priority,
  1 as apply_to_descendants,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 'Statistics Mode Theme'
    WHEN 'header-navigation' THEN 'Navigation Mode Theme'
    WHEN 'full-sidebar' THEN 'Full Sidebar Theme'
  END as name,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 'Optimized theme for statistics and data visualization'
    WHEN 'header-navigation' THEN 'Clean minimal theme for navigation focus'
    WHEN 'full-sidebar' THEN 'Rich theme optimized for full sidebar experience'
  END as description,
  1 as is_active
FROM user_navigation_preferences unp
CROSS JOIN (
  SELECT 'header-statistics' as mode
  UNION SELECT 'header-navigation' as mode
  UNION SELECT 'full-sidebar' as mode
) modes;

-- Add focus mode overrides for all users
INSERT OR IGNORE INTO theme_overrides 
(user_id, scope_type, navigation_mode, is_focus_mode, css_variables, color_overrides, 
 priority, apply_to_descendants, name, description, is_active)
SELECT DISTINCT
  unp.user_id,
  'focus-mode' as scope_type,
  NULL as navigation_mode,
  1 as is_focus_mode,
  '{"--focus-overlay": "rgba(0,0,0,0.3)", "--focus-border": "2px solid var(--color-primary-500)"}' as css_variables,
  '{"overlay": "rgba(0,0,0,0.3)", "focus-ring": "var(--color-primary-500)"}' as color_overrides,
  300 as priority,
  1 as apply_to_descendants,
  'Focus Mode Override' as name,
  'Theme adjustments for focus mode activation' as description,
  1 as is_active
FROM user_navigation_preferences unp;

-- Verify migration success
PRAGMA integrity_check;

-- Log migration completion
SELECT 'Migration 036 completed successfully - Theme Overrides' as status;