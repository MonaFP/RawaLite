/**
 * ROLLBACK PLAN: Central Configuration Architecture
 * 
 * Gemäß Original-Plan Phase 6: Testing & Rollback Plan
 * 
 * Rollback-Strategie falls Probleme mit dem zentralen Konfigurationssystem auftreten.
 * Alle Components können auf die alte Methoden zurückfallen ohne Datenverlust.
 * 
 * @since Phase 6 - Testing & Rollback Plan
 * @version 1.0
 */

# 🔄 ROLLBACK PLAN: Central Configuration Architecture

## 📋 **ROLLBACK TRIGGERS**

Führe Rollback durch bei:
- ❌ getActiveConfig() Performance-Probleme (>500ms)
- ❌ IPC Channel Failures häufig auftreten
- ❌ Konfiguration nicht persistent gespeichert
- ❌ CSS Variables nicht korrekt angewendet
- ❌ Frontend Components brechen

## 🎯 **ROLLBACK STRATEGY**

### **Level 1: Feature Flag Disable (Sofort)**
```typescript
// In DatabaseConfigurationService.ts
const ENABLE_CENTRAL_CONFIG = process.env.ENABLE_CENTRAL_CONFIG !== 'false';

static async getActiveConfig(...args): Promise<ActiveConfiguration> {
  if (!ENABLE_CENTRAL_CONFIG) {
    return this.getLegacyConfiguration(...args);
  }
  // ... normal central config logic
}
```

**Aktivierung:**
```bash
# Environment Variable setzen
set ENABLE_CENTRAL_CONFIG=false

# Oder in package.json
"dev": "ENABLE_CENTRAL_CONFIG=false pnpm run dev:quick"
```

### **Level 2: Component Fallback (Partial)**
```typescript
// In NavigationContext.tsx
const loadNavigationPreferences = async () => {
  try {
    // OPTION 1: Try central configuration
    const config = await configurationService.getActiveConfig(userId, theme, mode, focusMode);
    if (config) {
      // Use central config
      setActiveConfig(config);
      return;
    }
  } catch (error) {
    console.warn('[NavigationContext] Central config failed, using legacy fallback');
  }
  
  // OPTION 2: Legacy fallback (existing code)
  const dbPreferences = await navigationService.getUserNavigationPreferences(userId);
  const dbLayoutConfig = await navigationService.getNavigationLayoutConfig(userId);
  // ... existing legacy logic
};
```

### **Level 3: Full Rollback (Complete)**

#### **3.1 Code Rollback**
```bash
# Revert specific components to pre-central-config state
git checkout HEAD~X -- src/contexts/NavigationContext.tsx
git checkout HEAD~X -- src/contexts/DatabaseThemeManager.tsx

# Keep backend services but disable usage
# Keep migration for data consistency
```

#### **3.2 Database Rollback (NOT RECOMMENDED)**
```sql
-- ONLY if absolutely necessary - removes configuration consistency fixes
-- BACKUP FIRST!

-- Revert Migration 037 (header heights)
UPDATE user_navigation_preferences 
SET header_height = CASE 
  WHEN navigation_mode = 'header-statistics' THEN 85
  WHEN navigation_mode = 'header-navigation' THEN 72  
  WHEN navigation_mode = 'full-sidebar' THEN 60
END;

-- But this breaks consistency we tried to fix!
```

## 🔧 **ROLLBACK EXECUTION STEPS**

### **Emergency Rollback (Production)**
```bash
# 1. Immediate disable via environment
export ENABLE_CENTRAL_CONFIG=false

# 2. Force rebuild and restart
pnpm run build:main
# Force Reload in App (Ctrl+R)

# 3. Verify legacy functionality
pnpm run validate:critical-fixes
```

### **Development Rollback**
```bash
# 1. Feature flag disable
echo "ENABLE_CENTRAL_CONFIG=false" >> .env.local

# 2. Component selective rollback
git checkout HEAD~5 -- src/contexts/NavigationContext.tsx

# 3. Build and test
pnpm run build:main
pnpm dev:quick

# 4. Validate legacy paths work
node scripts/VALIDATE_CONFIGURATION_CONSISTENCY.cjs --legacy-mode
```

## 📊 **VALIDATION AFTER ROLLBACK**

### **Verify Legacy Functionality**
```bash
# 1. Navigation modes work
# - Test all 3 modes: header-statistics, header-navigation, full-sidebar
# - Verify manual dimension changes persist
# - Check localStorage fallback

# 2. Theme switching works  
# - Test all themes: sage, dark, sky, etc.
# - Verify theme persistence
# - Check CSS application

# 3. Database operations work
# - User preferences save/load
# - Mode settings persist
# - Focus mode preferences work
```

### **Performance Check**
```bash
# No performance regression
# Navigation mode switching <100ms
# Theme switching <200ms
# App startup time unchanged
```

## 🎯 **ROLLBACK IMPACT ASSESSMENT**

### **What Works After Rollback:**
- ✅ All existing navigation functionality
- ✅ All theme functionality  
- ✅ Database persistence
- ✅ User preferences
- ✅ Mode-specific settings
- ✅ Focus mode preferences

### **What's Lost After Rollback:**
- ❌ Single source of truth (getActiveConfig)
- ❌ Performance optimizations (1 IPC call vs multiple)
- ❌ CSS variable unification
- ❌ Configuration consistency validation
- ❌ Centralized error handling

### **What Stays:**
- ✅ Migration 037 (header height fixes)
- ✅ SYSTEM_DEFAULTS constants
- ✅ Database structure improvements
- ✅ Backend services (unused but available)

## 🚨 **CRITICAL COMPATIBILITY NOTES**

### **Database Changes are PERMANENT:**
- ✅ Migration 037 should NOT be rolled back
- ✅ Header height consistency is preserved
- ✅ Database structure enhancements remain
- ✅ Data integrity is maintained

### **Code Compatibility:**
- ✅ Legacy IPC channels remain functional
- ✅ Old method signatures preserved
- ✅ Backward compatibility maintained
- ✅ No breaking changes for components

### **Feature Flag Integration:**
```typescript
// Example of feature flag pattern throughout codebase
const usesCentralConfig = () => {
  return process.env.ENABLE_CENTRAL_CONFIG !== 'false' && 
         !localStorage.getItem('disable-central-config');
};

// In any component
if (usesCentralConfig()) {
  // New central config path
  const config = await ConfigurationIpcService.getActiveConfig(...);
} else {
  // Legacy path  
  const navPrefs = await NavigationIpcService.getUserNavigationPreferences(...);
  const themePrefs = await ThemeIpcService.getUserTheme(...);
}
```

## 📝 **ROLLBACK TESTING CHECKLIST**

### **Before Rollback:**
- [ ] Backup current configuration
- [ ] Document current state 
- [ ] Test legacy paths are functional
- [ ] Verify database backup exists

### **During Rollback:**
- [ ] Set feature flag
- [ ] Rebuild application
- [ ] Force reload frontend
- [ ] Test core functionality

### **After Rollback:**
- [ ] All navigation modes work
- [ ] All themes work
- [ ] Settings persist correctly
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Database integrity maintained

## 🎯 **PREVENTION FOR FUTURE**

### **Better Testing:**
- Unit tests for all configuration paths
- Integration tests for frontend components
- Performance benchmarks
- Database consistency validation

### **Gradual Rollout:**
- Feature flags from day 1
- Component-by-component migration
- A/B testing for performance
- User feedback integration

### **Monitoring:**
- IPC call performance metrics
- Configuration load times
- Error rate monitoring
- User experience tracking

---

**📍 Location:** `/docs/06-lessons/ROLLBACK_PLAN_CENTRAL_CONFIGURATION.md`  
**Purpose:** Comprehensive rollback strategy for central configuration system  
**Context:** Phase 6 requirement from original 7-phase plan  
**Status:** Ready for emergency use

**🔑 Key Insight:** Rollback preserves data integrity while reverting to proven legacy code paths.