-- Migration 034: Navigation Mode Settings (Per-Mode Layout Configuration)
-- @since v1.0.46+ (Per-Mode Configuration System)
-- @priority CRITICAL (Database Schema Extension)
--
-- Extends navigation system with per-mode layout preferences:
-- - Mode-specific header heights and sidebar widths
-- - Auto-collapse behavior per navigation mode
-- - Responsive breakpoints configuration
-- - Grid template customization per mode
--
-- Dependencies: Migration 028 (user_navigation_preferences), 029 (focus_mode_preferences)
-- Foreign Keys: user_navigation_preferences.user_id
-- Integration: DatabaseNavigationService.getModeSpecificSettings()

-- Create user_navigation_mode_settings table
CREATE TABLE IF NOT EXISTS user_navigation_mode_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')),
  
  -- Mode-specific Layout Configuration
  header_height INTEGER NOT NULL DEFAULT 160 CHECK (header_height >= 60 AND header_height <= 220),
  sidebar_width INTEGER NOT NULL DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
  
  -- Mode-specific Behavior Settings
  auto_collapse_mobile BOOLEAN NOT NULL DEFAULT 0,
  auto_collapse_tablet BOOLEAN NOT NULL DEFAULT 0,
  remember_dimensions BOOLEAN NOT NULL DEFAULT 1,
  
  -- Responsive Design Configuration
  mobile_breakpoint INTEGER NOT NULL DEFAULT 768 CHECK (mobile_breakpoint >= 480 AND mobile_breakpoint <= 1024),
  tablet_breakpoint INTEGER NOT NULL DEFAULT 1024 CHECK (tablet_breakpoint >= 768 AND tablet_breakpoint <= 1440),
  
  -- CSS Grid Template Overrides (JSON format for flexibility)
  grid_template_columns TEXT NULL, -- Custom CSS grid-template-columns
  grid_template_rows TEXT NULL,    -- Custom CSS grid-template-rows
  grid_template_areas TEXT NULL,   -- Custom CSS grid-template-areas
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, navigation_mode),
  FOREIGN KEY (user_id) REFERENCES user_navigation_preferences(user_id) ON DELETE CASCADE
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_navigation_mode_settings_user_mode 
ON user_navigation_mode_settings(user_id, navigation_mode);

CREATE INDEX IF NOT EXISTS idx_navigation_mode_settings_mode 
ON user_navigation_mode_settings(navigation_mode);

-- Insert default settings for each navigation mode
INSERT OR IGNORE INTO user_navigation_mode_settings 
(user_id, navigation_mode, header_height, sidebar_width, auto_collapse_mobile, auto_collapse_tablet, remember_dimensions, mobile_breakpoint, tablet_breakpoint)
VALUES 
-- Default user mode-specific settings
('default', 'header-statistics', 160, 240, 1, 0, 1, 768, 1024),
('default', 'header-navigation', 90, 280, 0, 0, 1, 768, 1024),
('default', 'full-sidebar', 60, 240, 1, 1, 1, 768, 1024);

-- Create trigger for updated_at maintenance
CREATE TRIGGER IF NOT EXISTS trigger_navigation_mode_settings_updated_at 
AFTER UPDATE ON user_navigation_mode_settings
FOR EACH ROW
BEGIN
  UPDATE user_navigation_mode_settings 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- Validation: Ensure all existing users get default mode settings
INSERT OR IGNORE INTO user_navigation_mode_settings 
(user_id, navigation_mode, header_height, sidebar_width, auto_collapse_mobile, auto_collapse_tablet, remember_dimensions, mobile_breakpoint, tablet_breakpoint)
SELECT 
  unp.user_id,
  modes.mode,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 160
    WHEN 'header-navigation' THEN 90
    WHEN 'full-sidebar' THEN 60
  END as header_height,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 240
    WHEN 'header-navigation' THEN 280
    WHEN 'full-sidebar' THEN 240
  END as sidebar_width,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 1
    WHEN 'header-navigation' THEN 0
    WHEN 'full-sidebar' THEN 1
  END as auto_collapse_mobile,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 0
    WHEN 'header-navigation' THEN 0
    WHEN 'full-sidebar' THEN 1
  END as auto_collapse_tablet,
  1 as remember_dimensions,
  768 as mobile_breakpoint,
  1024 as tablet_breakpoint
FROM user_navigation_preferences unp
CROSS JOIN (
  SELECT 'header-statistics' as mode
  UNION SELECT 'header-navigation' as mode
  UNION SELECT 'full-sidebar' as mode
) modes;

-- Verify migration success
PRAGMA integrity_check;

-- Log migration completion
SELECT 'Migration 034 completed successfully - Navigation Mode Settings' as status;