# 🔔 IMPLEMENTATION PLAN: Auto-Update Notifications - RawaLite

> **Option A: Smart Sidebar Update Widget System**  
> **Erstellt:** 2025-10-09 | **Status:** Planning Phase

---

## 🎯 **PROJEKT-ÜBERBLICK**

**Ziel:** Statisches Versions-Display in der Sidebar durch intelligentes Update-Notification Widget ersetzen

**Scope:** OPTION A - Auto-Update Notifications mit Sidebar-Integration

**Standards Compliance:** ✅ Schema, ✅ Field Mapping, ✅ PATHS System, ✅ Architecture Standards

**User Experience:** Sanfte, non-intrusive Benachrichtigungen im Sidebar-Footer statt Toast-Notifications

---

## 🏗️ **ARCHITEKTUR & STANDARDS ANALYSE**

### **✅ Schema & Field Mapping Compliance**
- **Keine DB-Änderungen:** Nutzt bestehende `UpdateHistoryService` (Migration 017)
- **Field Mapping:** Verwendet `FieldMapper.convertSQLQuery()` für alle DB-Zugriffe
- **Standards:** Folgt TypeScript strict mode, Interface-based abstractions

### **✅ PATHS System Compliance**
- **Renderer Process:** Nur PATHS System, niemals Node.js APIs
- **Main Process:** UpdateManagerService darf Node.js APIs verwenden
- **IPC:** Alle Pfad-Zugriffe über sichere preload.ts Bridge

### **✅ Architecture Compliance**
- **Layer Trennung:** UI → Services → IPC → Main Process
- **Electron Isolation:** Strikte Main/Renderer Trennung
- **Update System:** Nutzt bestehende Update Architecture (UpdateManagerService, GitHubApiService)

---

## 📁 **DATEI-STRUKTUR PLAN**

```typescript
// NEUE DATEIEN:
src/components/SidebarUpdateWidget.tsx     // Smart Update Widget
src/services/AutoUpdateService.ts         // Background Check Orchestration  
src/hooks/useAutoUpdates.ts               // React Hook für Update State
src/types/auto-update.types.ts            // TypeScript Definitionen

// MODIFIZIERTE DATEIEN:
src/components/NavigationOnlySidebar.tsx  // Widget Integration
src/pages/EinstellungenPage.tsx           // Update Preferences
electron/main.ts                          // IPC Handler Extensions
electron/preload.ts                       // IPC Bridge Extensions
```

---

## 🎯 **PHASE 1: Core Widget Implementation**

### **1.1 SidebarUpdateWidget Component**
```typescript
// src/components/SidebarUpdateWidget.tsx
interface SidebarUpdateWidgetProps {
  onUpdateClick?: () => void;           // Callback für Update-Action
  checkOnMount?: boolean;               // Auto-check beim Start  
  position?: 'sidebar' | 'footer';     // Positioning Context
}

interface UpdateWidgetState {
  currentVersion: string;
  status: 'idle' | 'checking' | 'available' | 'up-to-date' | 'error';
  updateInfo?: UpdateInfo;
  lastCheck?: Date;
}
```

**Features:**
- ✅ **Dynamic Version:** Via `window.rawalite.updates.getCurrentVersion()`
- ✅ **Status Visualization:** Icons + Colors für verschiedene Zustände
- ✅ **Smart Layout:** Kompakt für Sidebar, expandiert bei Updates
- ✅ **Accessibility:** Screen reader support, keyboard navigation

### **1.2 Auto-Update Service**
```typescript
// src/services/AutoUpdateService.ts
export class AutoUpdateService {
  private checkInterval: NodeJS.Timeout | null = null;
  private preferences: AutoUpdatePreferences;
  
  async startBackgroundChecks(): Promise<void>;
  async performCheck(): Promise<UpdateCheckResult>;
  async scheduleNextCheck(): Promise<void>;
  private notifyUpdate(updateInfo: UpdateInfo): void;
}
```

**Standards Compliance:**
- ✅ **PATHS System:** Kein direkter filesystem access
- ✅ **IPC Architecture:** Nutzt bestehende `window.rawalite.updates`
- ✅ **Error Handling:** Spezifische Error-Klassen, zentrale Handler

---

## 🎯 **PHASE 2: Preferences & Settings Integration**

### **2.1 Update Preferences UI**
```typescript
// Integration in src/pages/EinstellungenPage.tsx
interface AutoUpdatePreferences {
  enabled: boolean;                      // Auto-check aktiviert
  checkFrequency: 'startup' | 'daily' | 'weekly';
  notificationStyle: 'subtle' | 'prominent';
  reminderInterval: number;              // Stunden
  autoDownload: boolean;                 // Background Download
  installPrompt: 'immediate' | 'scheduled' | 'manual';
}
```

**UI Integration:**
- ✅ **Updates Tab:** Erweitert bestehende UpdateStatus Component
- ✅ **Settings Persistence:** Via `useUnifiedSettings` Hook
- ✅ **Real-time Updates:** Preferences ändern Widget-Verhalten sofort

### **2.2 Settings Storage**
```typescript
// Erweiterung der bestehenden Settings-Struktur
export interface UnifiedSettings {
  // ... bestehende Settings
  autoUpdate: AutoUpdatePreferences;
}
```

**Standards Compliance:**
- ✅ **Field Mapping:** Settings über `FieldMapper.toSQL()`
- ✅ **Schema:** Nutzt bestehende `settings` Tabelle
- ✅ **Validation:** Zod schemas für Runtime validation

---

## 🎯 **PHASE 3: Background Checking Logic**

### **3.1 App-Startup Integration**
```typescript
// Integration in electron/main.ts
app.whenReady().then(async () => {
  // ... bestehende Setup Logic
  
  // Auto-Update Service initialisieren
  if (userPreferences.autoUpdate.enabled) {
    setTimeout(() => {
      autoUpdateService.startBackgroundChecks();
    }, 10000); // 10 Sekunden nach App-Start
  }
});
```

### **3.2 Smart Scheduling**
```typescript
// src/services/AutoUpdateService.ts
private calculateNextCheck(): Date {
  const preferences = this.preferences;
  const now = new Date();
  
  switch (preferences.checkFrequency) {
    case 'startup': return null; // Nur bei App-Start
    case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}
```

**Features:**
- ✅ **Network Awareness:** Nur bei aktiver Internetverbindung
- ✅ **Performance:** Non-blocking background checks
- ✅ **Failure Resilience:** Retry logic bei Netzwerkproblemen

---

## 🎯 **PHASE 4: IPC Integration & Security**

### **4.1 IPC Handler Extensions**
```typescript
// electron/main.ts - Neue IPC Handler
ipcMain.handle('auto-updates:get-preferences', async () => {
  return await settingsService.getAutoUpdatePreferences();
});

ipcMain.handle('auto-updates:set-preferences', async (event, preferences) => {
  return await settingsService.setAutoUpdatePreferences(preferences);
});

ipcMain.handle('auto-updates:get-status', async () => {
  return await autoUpdateService.getStatus();
});
```

### **4.2 Preload Bridge Extensions**
```typescript
// electron/preload.ts
const rawaliteAPI = {
  // ... bestehende APIs
  autoUpdates: {
    getPreferences: () => ipcRenderer.invoke('auto-updates:get-preferences'),
    setPreferences: (prefs: AutoUpdatePreferences) => 
      ipcRenderer.invoke('auto-updates:set-preferences', prefs),
    getStatus: () => ipcRenderer.invoke('auto-updates:get-status'),
  }
};
```

**Security Compliance:**
- ✅ **Context Isolation:** Keine direkte Node.js API Exposition
- ✅ **Input Validation:** Alle IPC Parameter validiert
- ✅ **Error Boundaries:** Sichere Error Propagation

---

## 🎯 **PHASE 5: UI Integration & State Management**

### **5.1 React Hook Implementation**
```typescript
// src/hooks/useAutoUpdates.ts
export function useAutoUpdates() {
  const [status, setStatus] = useState<AutoUpdateStatus>('idle');
  const [preferences, setPreferences] = useState<AutoUpdatePreferences>();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
  
  // Auto-refresh Status alle 30 Sekunden
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentStatus = await window.rawalite.autoUpdates.getStatus();
      setStatus(currentStatus);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { status, preferences, updateInfo, checkForUpdates, updatePreferences };
}
```

### **5.2 Sidebar Integration**
```typescript
// src/components/NavigationOnlySidebar.tsx
export const NavigationOnlySidebar: React.FC = () => {
  // ... bestehende Navigation Logic
  
  return (
    <div className="sidebar navigation-only-sidebar">
      {/* ... bestehende Navigation */}
      
      {/* Smart Update Widget statt statischem Text */}
      <SidebarUpdateWidget 
        checkOnMount={true}
        onUpdateClick={() => openUpdateDialog()}
        position="sidebar"
      />
    </div>
  );
};
```

---

## 📊 **VISUELLER DESIGN PLAN**

### **Widget States Visualization:**
```typescript
// Widget State Design
interface WidgetVisualState {
  'idle': { icon: '📱', color: 'var(--text-secondary)', text: 'v1.0.33' };
  'checking': { icon: '🔄', color: 'var(--accent)', text: 'Suche...' };
  'available': { icon: '🎉', color: 'var(--ok)', text: 'Update verfügbar!' };
  'up-to-date': { icon: '✅', color: 'var(--text-secondary)', text: 'Aktuell v1.0.33' };
  'error': { icon: '⚠️', color: 'var(--error)', text: 'Check fehlgeschlagen' };
}
```

### **Sidebar Layout States:**
```css
/* Kompakter Zustand (Normal) */
.widget-compact {
  height: 60px;
  padding: 12px 8px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

/* Erweitert (Update verfügbar) */
.widget-expanded {
  height: 120px;
  padding: 16px 8px;
  border: 2px solid var(--accent);
  background: rgba(34, 197, 94, 0.1);
}
```

### **User Experience Flow:**
```
App Start → 10s delay → Background Check → Update Available?
   ↓ YES: Sidebar Widget expandiert + Icon + "Update verfügbar!"
   ↓ User klickt Widget → Bestehender UpdateManagerWindow öffnet sich
   ↓ NO: Widget zeigt "✅ Aktuell v1.0.33" + letzte Check-Zeit
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests:**
```typescript
// tests/components/SidebarUpdateWidget.test.tsx
describe('SidebarUpdateWidget', () => {
  it('shows current version on mount');
  it('transitions to checking state on auto-check');
  it('displays update notification when available');
  it('handles IPC failures gracefully');
});

// tests/services/AutoUpdateService.test.ts
describe('AutoUpdateService', () => {
  it('schedules checks based on preferences');
  it('respects network availability');
  it('integrates with UpdateManagerService correctly');
});
```

### **Integration Tests:**
```typescript
// e2e/auto-updates.test.ts
describe('Auto-Update Flow', () => {
  it('performs background check on app startup');
  it('shows notification in sidebar when update available');
  it('opens UpdateManager when widget clicked');
  it('saves preferences correctly');
});
```

---

## 🚨 **RISK MITIGATION**

### **Potential Issues & Solutions:**
1. **IPC Failures:** Fallback auf cached Version, graceful degradation
2. **Performance:** Background checks rate-limited, non-blocking
3. **Network Issues:** Retry logic, offline mode detection
4. **User Disruption:** Preferences für notification frequency
5. **Memory Leaks:** Proper cleanup von Intervals/Timers

### **Compliance Validation:**
```bash
# Pre-Implementation Checks
pnpm validate:path-compliance    # PATHS System konform
pnpm validate:critical-fixes     # Critical patterns eingehalten
pnpm typecheck                   # TypeScript strict mode
pnpm lint                        # ESLint Standards
```

---

## 📅 **IMPLEMENTATION TIMELINE**

```
Phase 1: Core Widget (2-3h)
├── SidebarUpdateWidget Component
├── Basic state management  
└── Version display logic

Phase 2: Preferences (1-2h)
├── Settings UI integration
├── Persistence logic
└── Real-time updates

Phase 3: Background Logic (2-3h)
├── AutoUpdateService
├── Scheduling logic
└── Network awareness

Phase 4: IPC & Security (1h)
├── IPC handlers
├── Preload bridge
└── Security validation

Phase 5: Integration (1h)
├── Sidebar integration
├── Hook implementation
└── Testing
```

**Total Estimated Time:** 7-10 Stunden

---

## ✅ **SUCCESS CRITERIA**

### **Functional Requirements:**
- [ ] Sidebar zeigt dynamische Version statt statischem Text
- [ ] Background checks alle X Stunden (konfigurierbar)
- [ ] Sanfte Notification bei verfügbaren Updates
- [ ] Settings für Update-Verhalten in Einstellungen
- [ ] Graceful fallback bei Netzwerk-/IPC-Problemen

### **Non-Functional Requirements:**
- [ ] ✅ Standards Compliance (Schema, PATHS, Architecture)
- [ ] < 100ms Widget rendering time
- [ ] < 2s Background check completion
- [ ] 100% TypeScript strict mode compatibility
- [ ] 90%+ test coverage

---

## 🔗 **RELATED DOCUMENTATION**

- **[Update System Architecture](../UPDATE-SYSTEM-ARCHITECTURE.md)** - Bestehende Update-Infrastruktur
- **[PATHS System Documentation](../../06-paths/PATHS-SYSTEM-DOCUMENTATION.md)** - Pfad-Compliance
- **[Standards Documentation](../../01-standards/standards.md)** - Coding Standards
- **[UI Components Documentation](../../08-ui/INDEX.md)** - UI Integration Patterns

---

## 📝 **IMPLEMENTATION NOTES**

### **Integration Points:**
1. **NavigationOnlySidebar.tsx:** Ersetze statisches Version Display
2. **EinstellungenPage.tsx:** Erweitere Updates Tab um Preferences
3. **UpdateManagerService:** Nutze bestehende Infrastructure
4. **Settings System:** Erweitere um AutoUpdate Preferences

### **Key Design Decisions:**
- **Non-intrusive:** Widget in Sidebar statt Toast-Notifications
- **Standards Compliant:** Kein Breaking Change der Architecture
- **Backwards Compatible:** Bestehende Update-Funktionalität bleibt unverändert
- **User Control:** Vollständige Konfigurierbarkeit über Settings

---

*Implementierung bereit für Phase 1 Start nach Freigabe des Plans.*