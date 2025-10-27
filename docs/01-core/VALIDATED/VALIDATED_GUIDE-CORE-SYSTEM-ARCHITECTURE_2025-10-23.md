# CORE SYSTEM ARCHITECTURE - RawaLite (Current State v1.0.54)

> **Erstellt:** 23.10.2025 | **Letzte Aktualisierung:** 23.10.2025 (COMPLETE ARCHITECTURE UPDATE - Migration 040, 14-Layer Architecture)  
> **Status:** VALIDATED - Current Repository State | **Typ:** System Architecture Guide  
> **Schema:** `VALIDATED_GUIDE-CORE-SYSTEM-ARCHITECTURE_2025-10-23.md`

> **🤖 KI-SESSION-BRIEFING COMPLIANCE:**
> **✅ Critical Fixes Validation:** 16/16 patterns preserved und validiert  
> **✅ Protocol Followed:** ROOT-Dokumentation vollständig gelesen  
> **🎯 Phase:** COMPLETE ARCHITECTURE UPDATE - Current State Documentation

> **🔗 Verwandte Dokumentation:**
> **Critical Fixes:** [ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - 16 Active Critical Fixes  
> **KI Instructions:** [ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - Development Standards  
> **IPC Documentation:** [VALIDATED_REGISTRY-IPC-INDEX-2025-10-17.md](VALIDATED_REGISTRY-IPC-INDEX-2025-10-17.md) - Complete IPC Channel Registry  
> **Migration System:** [Migration Index](../../03-data/final/) - Database Schema Evolution (000→040)  
> **Service Layer:** [Development Standards](../../02-dev/final/) - Service Layer Patterns  

---

## 🏗️ **SYSTEM OVERVIEW**

### **RawaLite Architecture Vision**
RawaLite ist eine **fortgeschrittene Desktop-Anwendung** basierend auf **Electron + React + SQLite**, optimiert für **Rechnung- und Angebotsverwaltung** mit **Multi-Service Architecture**, **Database-First Management Systems**, und **Advanced Configuration Architecture**.

### **Core Design Principles (v1.0.54)**
1. **Database-First Architecture** - SQLite als Single Source of Truth (Migration 040)
2. **Multi-Service Architecture** - Spezialisierte Service-Layer mit klarer Trennung
3. **Configuration-Driven Systems** - Centralized Configuration Architecture (Migration 037)
4. **Advanced Navigation System** - Database-driven Navigation mit Focus Mode (Migration 028/029)
5. **Type-Safe Operations** - Field-Mapper für sichere Database-Queries
6. **IPC Security** - 14 spezialisierte, whitelisted Communication Channels
7. **Theme-System Integration** - Dynamic Theming mit Database-Persistence (Migration 027)
8. **Update Management** - Sophisticated Auto-Update System mit Security Monitoring
9. **Focus Mode Enhancement** - Enhanced user experience modes (Migration 029/035)
10. **Header Height Management** - Responsive header system (Migration 031-033/038-039)

---

## 📊 **MULTI-SERVICE SYSTEM ARCHITECTURE**

### **Layer 1: Database Foundation (SQLite + Migrations)**
```
┌─────────────────────────────────────────────────────────────────┐
│                    SQLite Database (Migration 040)              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Core Business Tables                    │ │
│  │  • offers, invoices, customers, line_items, packages      │ │
│  │  • timesheets, numbering_circles, migration_history       │ │
│  │  • delivery_info, attachments, update_history             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Theme System (Migration 027)                  │ │
│  │  • themes, theme_colors, user_theme_preferences           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           Navigation System (Migration 028)                │ │
│  │  • navigation_preferences, navigation_state               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │            Focus Mode System (Migration 029/035)           │ │
│  │  • focus_mode_preferences, focus_mode_state               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │      Centralized Configuration (Migration 037)             │ │
│  │  • configuration_entries, configuration_history           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            ↕️ better-sqlite3 (Native Performance)
```

**Key Technologies:**
- **better-sqlite3 v12.4.1** - Native SQLite bindings für maximale Performance
- **Migration System** - 40 versionierte Schema-Evolutionen (000→040)
- **WAL Mode** - Write-Ahead Logging für Concurrent Access
- **Field-Mapper** - Type-safe SQL Query Generation
- **FIX-008 Protection** - ABI Compatibility Management

### **Layer 2: Main Process Services (Business Logic)**
```
┌─────────────────────────────────────────────────────────────────┐
│                  Main Process Service Layer                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Core Business Services                      │ │
│  │  • EntityStatusService - Database-driven Status Management │ │
│  │  • GitHubApiService - Release & Update Management         │ │
│  │  • UpdateManagerService - Sophisticated Auto-Updates      │ │
│  │  • UpdateHistoryService - Update Tracking & Telemetry     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │               Advanced Update System                       │ │
│  │  • UpdateTelemetryService - Usage Analytics               │ │
│  │  • RateLimitManager - API Rate Limiting                   │ │
│  │  • ReleaseHygieneValidator - Release Quality Validation   │ │
│  │  • updateInstallerSelector - Platform-specific Installers │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Focus Mode & Navigation                       │ │
│  │  • DatabaseFocusModeService - Focus Mode State Management │ │
│  │  • MockProgressService - Development Testing Support      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            ↕️ Field-Mapper & Transaction Management
```

**Critical Protection:** FIX-001 (WriteStream), FIX-002 (File Flush), FIX-003 (Event Handlers)

### **Layer 3: Renderer Process Services (Application Logic)**
```
┌─────────────────────────────────────────────────────────────────┐
│                Renderer Process Service Layer                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Core Application Services                     │ │
│  │  • DatabaseThemeService - Theme CRUD Operations           │ │
│  │  • DatabaseNavigationService - Navigation State           │ │
│  │  • DatabaseConfigurationService - Config Management       │ │
│  │  • PDFService - Document Generation with Dynamic Themes   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Business Application Services                 │ │
│  │  • NummernkreisService - Number Circle Management         │ │
│  │  • TimesheetService - Time Tracking                       │ │
│  │  • ExportService - Data Export Operations                 │ │
│  │  • BackupClient - Database Backup Operations              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │               Development & Security Services              │ │
│  │  • DebugLogger - Development Logging                      │ │
│  │  • CryptoService - Encryption Operations                  │ │
│  │  • VersionService - Version Management                    │ │
│  │  • AutoUpdateService - Client-side Update Handling        │ │
│  │  • AutoUpdateSecurityMonitor - Security Monitoring        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Support Services                       │ │
│  │  • ThemeFallbackManager - Theme Fallback Strategy         │ │
│  │  • DbClient - Database Client Interface                   │ │
│  │  • LoggingService - Application Logging                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            ↕️ IPC Bridge Communication
```

**Critical Protection:** FIX-018 (DatabaseThemeService Pattern), FIX-016 (Theme Schema Protection)

### **Layer 4: IPC Communication Bridge (14 Specialized Modules)**
```
┌─────────────────────────────────────────────────────────────────┐
│                14-Module IPC Communication System               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Core System IPC                          │ │
│  │  • backup.ts - Database Backup Operations                 │ │
│  │  • database.ts - Core Database Operations                 │ │
│  │  • filesystem.ts - File System Operations                 │ │
│  │  • files.ts - File Management                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Configuration & Theme IPC                   │ │
│  │  • configuration.ts - Configuration Management            │ │
│  │  • themes.ts - Theme System Communication                 │ │
│  │  • paths.ts - Path Management                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              User Experience & Navigation IPC             │ │
│  │  • navigation.ts - Navigation State Management            │ │
│  │  • status.ts - Entity Status Updates                     │ │
│  │  • numbering.ts - Number Circle Operations                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Document & Update IPC                      │ │
│  │  • pdf-core.ts - PDF Generation Core                     │ │
│  │  • pdf-templates.ts - PDF Template Management            │ │
│  │  • update-manager.ts - Update Management Communication    │ │
│  │  • updates.ts - Update Operations                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            ↕️ Whitelisted Channel Security
```

**Security Features:**
- Whitelisted Channel Approach
- Type-safe IPC Communication  
- Request/Response Validation
- Error Boundary Isolation

**Critical Protection:** FIX-007 (IPC Channel Security)

### **Layer 5-14: Additional Architecture Layers**

**Layer 5: Persistence & Adapter System**
- `src/persistence/` - Data Access Layer
- `src/adapters/` - Database Adapter Pattern
- Local Storage Integration

**Layer 6: React Context & State Management**
- Theme Context Management
- Navigation Context
- Configuration Context
- Focus Mode Context

**Layer 7: Component Architecture**
- Core Components (`src/components/`)
- Page Components (`src/pages/`)
- Utility Components

**Layer 8: Hooks & Custom Logic**
- Database Hooks
- State Management Hooks
- UI Interaction Hooks

**Layer 9: Type System & Domain**
- TypeScript Definitions (`src/types/`)
- Domain Models (`src/domain.ts`)
- Global Types (`src/global.d.ts`)

**Layer 10: Utility & Library Layer**
- Core Utilities (`src/lib/`)
- Field Mapper System
- Path Management (`src/lib/paths.ts`)

**Layer 11: Asset & Style Management**
- Static Assets (`src/assets/`)
- CSS Styles (`src/styles/`)
- Theme CSS Variables

**Layer 12: Electron Main Process**
- Main Process Entry (`electron/main.ts`)
- Window Management (`electron/windows/`)
- Preload Scripts (`electron/preload.ts`)

**Layer 13: Build & Distribution**
- Vite Configuration
- Electron Builder
- TypeScript Compilation

**Layer 14: Development & Testing**
- Testing Infrastructure (`tests/`)
- E2E Testing (`e2e/`)
- Development Scripts (`scripts/`)

---

## 🗄️ **DATABASE-FIRST ARCHITECTURE (Migration 040)**

### **Migration Evolution Timeline**
```
Migration 000: Initial Schema
Migration 027: Theme System Foundation
Migration 028: Navigation System
Migration 029: Focus Mode System
Migration 030: Navigation Mode Values Fix
Migration 031: Header Height Limit Increase
Migration 032: Header Height to 220px
Migration 033: Header Navigation Height Normalization
Migration 034: Navigation Mode Settings
Migration 035: Focus Mode Preferences
Migration 036: Theme Overrides
Migration 037: ⭐ CENTRALIZED CONFIGURATION ARCHITECTURE
Migration 038: Header Heights Final Correction
Migration 039: Full Sidebar Header Height Fix
Migration 040: ⭐ CURRENT STATE - Navigation Preferences Constraint Fix
```

### **Current Schema Highlights (Migration 040)**

**Theme System (Complete)**
- `themes` - System & Custom Themes
- `theme_colors` - 13 colors per theme
- `user_theme_preferences` - User selections

**Navigation System (Advanced)**
- `navigation_preferences` - User navigation settings
- `navigation_mode_settings` - Mode-specific configurations
- Responsive header height management (60px→220px range)

**Focus Mode System (Enhanced)**
- `focus_mode_preferences` - User focus settings
- `focus_mode_state` - Current focus state
- Enhanced user experience modes

**Centralized Configuration (NEW)**
- `configuration_entries` - Unified config storage
- `configuration_history` - Config change tracking
- Single source of truth for all app settings

---

## 🎯 **ADVANCED FEATURES OVERVIEW**

### **1. Configuration-Driven Architecture (Migration 037)**
```typescript
// Centralized Configuration System
interface ConfigurationEntry {
  id: string;
  scope: 'system' | 'user' | 'session';
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  created_at: string;
  updated_at: string;
}

// Unified Configuration Access
class DatabaseConfigurationService {
  async getConfig(scope: string, key: string): Promise<any>
  async setConfig(scope: string, key: string, value: any): Promise<void>
  async getAllConfigs(scope?: string): Promise<ConfigurationEntry[]>
}
```

### **2. Advanced Navigation System (Migration 028/034)**
```typescript
// Navigation State Management
interface NavigationPreferences {
  navigation_mode: 'standard' | 'focus' | 'mobile';
  sidebar_width: number;
  header_height: number; // 60px-220px range
  focus_bar_height: number;
  grid_template_areas: string;
  grid_template_columns: string;
  grid_template_rows: string;
}

// Dynamic Grid System
const NAVIGATION_MODES = {
  standard: '"sidebar header" "sidebar focus-bar" "sidebar main"',
  focus: '"header header" "focus-bar focus-bar" "main main"',
  mobile: '"header" "main"'
};
```

### **3. Enhanced Focus Mode (Migration 029/035)**
```typescript
// Focus Mode Enhancement
interface FocusModePreferences {
  auto_focus_enabled: boolean;
  focus_duration_minutes: number;
  break_reminder_enabled: boolean;
  focus_sound_enabled: boolean;
  distraction_blocking: boolean;
}

// Focus Mode State Tracking
class DatabaseFocusModeService {
  async startFocusSession(): Promise<FocusSession>
  async endFocusSession(): Promise<void>
  async getFocusStatistics(): Promise<FocusStats>
}
```

### **4. Sophisticated Update System**
```typescript
// Multi-Service Update Architecture
class UpdateManagerService {
  // FIX-002: File flush delays preserved
  async verifyDownload(path: string): Promise<boolean>
}

class UpdateTelemetryService {
  async trackUpdateEvent(event: UpdateEvent): Promise<void>
  async getUpdateStatistics(): Promise<UpdateStats>
}

class ReleaseHygieneValidator {
  async validateRelease(release: GitHubRelease): Promise<ValidationResult>
}
```

---

## 🛡️ **CRITICAL FIXES INTEGRATION**

### **Active Critical Fixes (16/16 Validated)**

**FIX-001:** WriteStream Race Condition Protection (`GitHubApiService.ts`)
**FIX-002:** File System Flush Delay (`UpdateManagerService.ts`)  
**FIX-003:** Event Handler Duplication Prevention (`UpdateManagerService.ts`)
**FIX-004:** Port Consistency 5174 (`vite.config.mts`, `electron/windows/main-window.ts`)
**FIX-008:** Better-sqlite3 ABI Compatibility (Production Ready)
**FIX-016:** Database-Theme-System Schema Protection
**FIX-017:** Migration 027 Theme System Integrity
**FIX-018:** DatabaseThemeService Pattern Preservation

[See complete registry: ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md]

---

## 🚀 **DEVELOPMENT STANDARDS**

### **Service Layer Patterns**
- **Database-First:** All persistent state through SQLite
- **Service Layer:** Business logic encapsulation
- **Field-Mapper:** Type-safe SQL generation
- **IPC Security:** Whitelisted channels only

### **Architecture Compliance**
- **No Direct DB Access:** Always through service layer
- **Type Safety:** TypeScript strict mode
- **Error Boundaries:** Proper error handling
- **Performance:** Optimized query patterns

### **Critical Validations**
```bash
# Before any changes:
pnpm validate:critical-fixes

# Development workflow:
pnpm typecheck && pnpm lint && pnpm test

# Release preparation:
pnpm validate:critical-fixes && pnpm validate:migrations
```

---

## 📊 **SYSTEM METRICS (v1.0.54)**

**Database:**
- 40 Migrations Applied
- 15+ Core Tables
- 4 Specialized Systems (Theme, Navigation, Focus, Configuration)

**Services:**
- 14 Main Process Services
- 12 Renderer Process Services  
- 14 IPC Communication Modules

**Architecture:**
- Multi-Service System Design
- Type-safe Operations
- Comprehensive Error Handling
- Advanced Configuration Management

**Critical Fixes:**
- 16/16 Active Fixes Validated
- Zero Tolerance Fix Preservation
- Automated Validation Pipeline

---

## 🔮 **FUTURE ARCHITECTURE EVOLUTION**

**Planned Enhancements:**
1. **Microservice Extraction** - Plugin architecture for extensions
2. **Advanced Analytics** - User behavior tracking and optimization
3. **Cloud Integration** - Optional cloud sync capabilities
4. **AI Integration** - Smart document processing
5. **Performance Optimization** - Further query optimization and caching

**Migration Path:**
- Maintain backward compatibility
- Incremental feature rollout
- Database schema evolution
- Service layer expansion

---

**📍 Location:** `/docs/01-core/final/VALIDATED_GUIDE-CORE-SYSTEM-ARCHITECTURE_2025-10-23.md`  
**Purpose:** Complete and current system architecture documentation  
**Status:** VALIDATED - Reflects actual repository state v1.0.54  
**Migration Level:** 040 (Current)  
**Architecture:** Multi-Service Architecture

*Erstellt: 2025-10-23 - Complete architecture update reflecting current repository state (Migration 040, 14-layer architecture, all current services and systems)*