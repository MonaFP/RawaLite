CREATE TABLE user_navigation_preferences_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  navigation_mode TEXT NOT NULL DEFAULT 'mode-dashboard-view' 
    CHECK (navigation_mode IN (
      'mode-dashboard-view',
      'mode-data-panel',
      'mode-compact-focus'
    )),
  header_height INTEGER DEFAULT 72 CHECK (header_height >= 36 AND header_height <= 220),
  sidebar_width INTEGER DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
  auto_collapse BOOLEAN DEFAULT FALSE,
  remember_focus_mode BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);