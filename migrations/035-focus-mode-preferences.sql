-- Migration 035: Focus Mode Preferences (Per-Mode Focus Configuration)
-- @since v1.0.46+ (Per-Mode Configuration System)  
-- @priority CRITICAL (Database Schema Extension)
--
-- Extends focus mode system with per-navigation-mode preferences:
-- - Mode-specific focus behavior (different per navigation mode)
-- - Auto-focus timers and thresholds per mode
-- - Focus transition animations per mode
-- - Distraction blocking levels per mode
--
-- Dependencies: Migration 029 (focus_mode_preferences), 034 (user_navigation_mode_settings)
-- Foreign Keys: user_navigation_preferences.user_id
-- Integration: DatabaseNavigationService.getFocusModePreferences()

-- Create user_focus_mode_preferences table
CREATE TABLE IF NOT EXISTS user_focus_mode_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')),
  
  -- Focus Mode Activation Settings
  auto_focus_enabled BOOLEAN NOT NULL DEFAULT 0,
  auto_focus_delay_seconds INTEGER NOT NULL DEFAULT 300 CHECK (auto_focus_delay_seconds >= 30 AND auto_focus_delay_seconds <= 3600),
  focus_on_mode_switch BOOLEAN NOT NULL DEFAULT 0,
  
  -- Focus Behavior Configuration  
  hide_sidebar_in_focus BOOLEAN NOT NULL DEFAULT 1,
  hide_header_stats_in_focus BOOLEAN NOT NULL DEFAULT 0,
  dim_background_opacity REAL NOT NULL DEFAULT 0.3 CHECK (dim_background_opacity >= 0.0 AND dim_background_opacity <= 1.0),
  
  -- Focus Transition Settings
  transition_duration_ms INTEGER NOT NULL DEFAULT 300 CHECK (transition_duration_ms >= 100 AND transition_duration_ms <= 1000),
  transition_easing TEXT NOT NULL DEFAULT 'ease-in-out' CHECK (transition_easing IN ('linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out')),
  
  -- Distraction Blocking Configuration
  block_notifications BOOLEAN NOT NULL DEFAULT 1,
  block_popups BOOLEAN NOT NULL DEFAULT 1,
  block_context_menu BOOLEAN NOT NULL DEFAULT 0,
  minimal_ui_mode BOOLEAN NOT NULL DEFAULT 0,
  
  -- Focus Analytics & Tracking
  track_focus_sessions BOOLEAN NOT NULL DEFAULT 1,
  show_focus_timer BOOLEAN NOT NULL DEFAULT 1,
  focus_break_reminders BOOLEAN NOT NULL DEFAULT 0,
  focus_break_interval_minutes INTEGER NOT NULL DEFAULT 25 CHECK (focus_break_interval_minutes >= 5 AND focus_break_interval_minutes <= 120),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, navigation_mode),
  FOREIGN KEY (user_id) REFERENCES user_navigation_preferences(user_id) ON DELETE CASCADE
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_focus_mode_preferences_user_mode 
ON user_focus_mode_preferences(user_id, navigation_mode);

CREATE INDEX IF NOT EXISTS idx_focus_mode_preferences_auto_focus 
ON user_focus_mode_preferences(user_id, auto_focus_enabled);

-- Insert default focus preferences for each navigation mode
INSERT OR IGNORE INTO user_focus_mode_preferences 
(user_id, navigation_mode, auto_focus_enabled, auto_focus_delay_seconds, focus_on_mode_switch, 
 hide_sidebar_in_focus, hide_header_stats_in_focus, dim_background_opacity, 
 transition_duration_ms, transition_easing, block_notifications, block_popups, 
 block_context_menu, minimal_ui_mode, track_focus_sessions, show_focus_timer, 
 focus_break_reminders, focus_break_interval_minutes)
VALUES 
-- header-statistics: Statistik-fokussiert, weniger ablenkend
('default', 'header-statistics', 1, 240, 1, 1, 0, 0.2, 400, 'ease-out', 1, 1, 0, 0, 1, 1, 1, 25),
-- header-navigation: Navigation-fokussiert, moderate Focus-Features  
('default', 'header-navigation', 0, 300, 0, 1, 1, 0.3, 300, 'ease-in-out', 1, 1, 0, 0, 1, 1, 0, 30),
-- full-sidebar: Vollständige Sidebar, intensive Focus-Modi
('default', 'full-sidebar', 1, 180, 1, 0, 1, 0.4, 500, 'ease-in', 1, 1, 1, 1, 1, 1, 1, 20);

-- Create trigger for updated_at maintenance
CREATE TRIGGER IF NOT EXISTS trigger_focus_mode_preferences_updated_at 
AFTER UPDATE ON user_focus_mode_preferences
FOR EACH ROW
BEGIN
  UPDATE user_focus_mode_preferences 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- Populate preferences for all existing users and all navigation modes
INSERT OR IGNORE INTO user_focus_mode_preferences 
(user_id, navigation_mode, auto_focus_enabled, auto_focus_delay_seconds, focus_on_mode_switch, 
 hide_sidebar_in_focus, hide_header_stats_in_focus, dim_background_opacity, 
 transition_duration_ms, transition_easing, block_notifications, block_popups, 
 block_context_menu, minimal_ui_mode, track_focus_sessions, show_focus_timer, 
 focus_break_reminders, focus_break_interval_minutes)
SELECT 
  unp.user_id,
  modes.mode,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 1
    WHEN 'header-navigation' THEN 0
    WHEN 'full-sidebar' THEN 1
  END as auto_focus_enabled,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 240
    WHEN 'header-navigation' THEN 300
    WHEN 'full-sidebar' THEN 180
  END as auto_focus_delay_seconds,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 1
    WHEN 'header-navigation' THEN 0
    WHEN 'full-sidebar' THEN 1
  END as focus_on_mode_switch,
  1 as hide_sidebar_in_focus,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 0
    WHEN 'header-navigation' THEN 1
    WHEN 'full-sidebar' THEN 1
  END as hide_header_stats_in_focus,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 0.2
    WHEN 'header-navigation' THEN 0.3
    WHEN 'full-sidebar' THEN 0.4
  END as dim_background_opacity,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 400
    WHEN 'header-navigation' THEN 300
    WHEN 'full-sidebar' THEN 500
  END as transition_duration_ms,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 'ease-out'
    WHEN 'header-navigation' THEN 'ease-in-out'
    WHEN 'full-sidebar' THEN 'ease-in'
  END as transition_easing,
  1 as block_notifications,
  1 as block_popups,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 0
    WHEN 'header-navigation' THEN 0
    WHEN 'full-sidebar' THEN 1
  END as block_context_menu,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 0
    WHEN 'header-navigation' THEN 0
    WHEN 'full-sidebar' THEN 1
  END as minimal_ui_mode,
  1 as track_focus_sessions,
  1 as show_focus_timer,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 1
    WHEN 'header-navigation' THEN 0
    WHEN 'full-sidebar' THEN 1
  END as focus_break_reminders,
  CASE modes.mode 
    WHEN 'header-statistics' THEN 25
    WHEN 'header-navigation' THEN 30
    WHEN 'full-sidebar' THEN 20
  END as focus_break_interval_minutes
FROM user_navigation_preferences unp
CROSS JOIN (
  SELECT 'header-statistics' as mode
  UNION SELECT 'header-navigation' as mode
  UNION SELECT 'full-sidebar' as mode
) modes;

-- Verify migration success
PRAGMA integrity_check;

-- Log migration completion
SELECT 'Migration 035 completed successfully - Focus Mode Preferences' as status;