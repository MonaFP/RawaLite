# UPDATE SYSTEM ARCHITECTURE DOCUMENTATION

**Version:** v1.0.47  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** 20. Oktober 2025 (Migration 029 - Focus Mode System)  

## 🎯 Architektur-Übersicht

Das RawaLite Update System besteht aus **zwei völlig getrennten Systemen** die niemals verwechselt werden dürfen:

### 1. 🔄 **App-Update System** (Software Updates)
**Zweck:** Updates der RawaLite App selbst  
**Location:** Settings → Updates Tab  
**Services:** UpdateManagerService, GitHubApiService, UpdateHistoryService  

### 2. 📊 **Entity-Status Update System** (Business Document Status)
**Zweck:** Status-Updates von Geschäftsdokumenten (bezahlt, versendet, etc.)  
**Location:** Invoices, Offers, Timesheets  
**Services:** EntityStatusService (ehemals UpdateStatusService)  

---

## 🏗️ App-Update System Komponenten

### Core Services

#### **UpdateManagerService** (`src/main/services/UpdateManagerService.ts`)
- **Role:** 🎯 Master Orchestrator für kompletten Update-Prozess
- **Responsibilities:**
  - Version checking und comparison
  - Download management mit progress tracking  
  - File verification (integrity checks)
  - Installation coordination
  - Error handling und retry logic
  - **Update History Integration:** Logging aller Update-Events
- **Path Compliance:** ✅ Main Process (Node.js path APIs erlaubt)
- **Dependencies:** GitHubApiService, UpdateHistoryService

#### **GitHubApiService** (`src/main/services/GitHubApiService.ts`)
- **Role:** 🌐 HTTP-basierte GitHub API Integration
- **Responsibilities:**
  - Direct GitHub REST API calls (ersetzt CLI dependencies)
  - Release checking und asset discovery
  - File downloading mit progress tracking
  - Rate limiting management
- **Path Compliance:** ✅ Main Process (dirname() usage korrekt)
- **Critical Fix:** FIX-001 WriteStream Race Condition (Promise-based completion)

#### **UpdateHistoryService** (`src/main/services/UpdateHistoryService.ts`)
- **Role:** 📊 Audit-Trail für alle Update-Aktivitäten
- **Responsibilities:**
  - Session-basierte Update-Logs
  - Event tracking (check/download/install)
  - Statistics und History-Analyse
  - Cleanup alter Einträge
- **Database:** Migration 017 (`update_history` table)
- **Features:** Session IDs, Error tracking, Performance metrics

### Database Integration

#### **Migration 017** (`src/main/db/migrations/017_add_update_history.ts`)
```sql
CREATE TABLE update_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- check_started, download_completed, etc.
  current_version TEXT NOT NULL,
  target_version TEXT,
  success BOOLEAN,
  error_message TEXT,
  progress_percent INTEGER,
  duration_ms INTEGER,
  user_action TEXT, -- automatic, manual, scheduled
  download_url TEXT,
  file_size_bytes INTEGER,
  file_hash TEXT,
  -- ... weitere Audit-Felder
);
```

### IPC Architecture

#### **Main Process IPC Handlers** (`electron/main.ts`)
```typescript
// App-Update System
ipcMain.handle('update:check', async () => {
  return await updateManagerService.checkForUpdates();
});

ipcMain.handle('update:download', async (event, updateInfo) => {
  return await updateManagerService.startDownload(updateInfo);
});

ipcMain.handle('update:install', async (event, filePath) => {
  return await updateManagerService.installUpdate(filePath);
});

// Separate von Entity-Status System!
ipcMain.handle('status:update-offer-status', async (event, params) => {
  return await entityStatusService.updateEntityStatus({
    tableName: 'offers',
    ...params
  });
});
```

---

## 📊 Entity-Status Update System

### **EntityStatusService** (`src/main/services/EntityStatusService.ts`)
- **Role:** 🔄 Status-Management für Geschäftsdokumente
- **Responsibilities:**
  - Offer status updates (draft, sent, accepted, rejected)
  - Invoice status updates (draft, sent, paid, overdue, cancelled)
  - Timesheet status updates (draft, sent, accepted, rejected)
  - Optimistic locking für concurrency
  - Status history tracking
- **Database:** Nutzt bestehende Entity-Tabellen mit Status-Versionierung
- **Critical Fix:** FIX-008 Database-driven status updates with optimistic locking

---

## 🔍 Validation & Compliance

### **Path Compliance** (`scripts/validate-path-compliance.mjs`)
```bash
pnpm validate:path-compliance
```

**Validation Rules:**
- ✅ **Main Process Services:** Node.js path APIs erlaubt (app.getPath(), dirname(), join())
- ❌ **Renderer Process:** Path APIs verboten - nur PATHS System
- ✅ **Update Services:** Alle 3/3 compliant validiert

**Current Status:** 0 Violations, 100% Compliance

### **Critical Fixes** (`scripts/validate-critical-fixes.mjs`)
```bash
pnpm validate:critical-fixes
```

**Update System Critical Fixes:**
- **FIX-001:** WriteStream Race Condition (GitHubApiService)
- **FIX-003:** Single close event handler (UpdateManagerService)
- **FIX-008:** Database-driven status updates (EntityStatusService)

---

## 🚀 Development Workflow

### **Pre-Release Validation**
```bash
pnpm pre:release
# Runs: validate:critical-fixes && validate:docs-structure && 
#       validate:path-compliance && typecheck && lint && build
```

### **Safe Version Management**
```bash
pnpm safe:version patch  # Validiert Critical Fixes vor Version bump
pnpm safe:dist          # Validiert vor Distribution
```

### **Update Testing**
```bash
pnpm test:update-all    # Complete Update System E2E tests
pnpm test:github-cli    # GitHub API integration tests
pnpm test:update-manager # UpdateManagerService tests
```

---

## 📁 File Structure

```
src/main/services/
├── UpdateManagerService.ts     # 🎯 App-Update Orchestrator
├── GitHubApiService.ts         # 🌐 GitHub API Integration  
├── UpdateHistoryService.ts     # 📊 Update Audit-Trail
└── EntityStatusService.ts      # 📊 Business Document Status

src/main/db/migrations/
└── 017_add_update_history.ts   # 📊 Update History Database

scripts/
├── validate-critical-fixes.mjs     # 🔒 Critical Pattern Protection
├── validate-path-compliance.mjs    # 🛤️ Path API Compliance
└── validate-documentation-structure.mjs # 📖 Docs Validation

electron/
├── main.ts                     # 🔌 IPC Handlers für beide Update-Systeme
└── preload.ts                  # 🌉 IPC Bridge APIs
```

---

## ⚠️ KRITISCHE UNTERSCHEIDUNG

### ❌ **NIEMALS VERWECHSELN:**

| **App-Update System** | **Entity-Status System** |
|----------------------|--------------------------|
| Software-Updates     | Document Status Changes  |
| UpdateManagerService | EntityStatusService      |
| GitHub Releases      | Business Logic          |
| Settings → Updates   | Invoices/Offers/Timesheets |
| Version 1.0.x → 1.1.x | draft → sent → paid      |

### ✅ **Korrekte Verwendung:**

```typescript
// App-Update (Software)
await updateManagerService.checkForUpdates();

// Entity-Status (Business Documents)  
await entityStatusService.updateEntityStatus({
  tableName: 'invoices',
  id: 123,
  newStatus: 'paid'
});
```

---

## 🔄 Update Sequence Flow

### **App-Update Prozess:**
1. **Check:** UpdateManagerService → GitHubApiService.checkForUpdate()
2. **Log:** UpdateHistoryService.addEntry('check_started')
3. **Download:** GitHubApiService.downloadAsset() mit Progress
4. **Verify:** File integrity check mit 100ms flush delay
5. **Install:** Controlled installation mit cleanup
6. **History:** Kompletter Audit-Trail aller Schritte

### **Entity-Status Prozess:**
1. **Request:** UI → IPC → EntityStatusService
2. **Validate:** Status transition rules
3. **Lock:** Optimistic locking check
4. **Update:** Database transaction
5. **History:** Status change logging

---

## 📊 Monitoring & Analytics

### **Update History Analytics:**
```typescript
const stats = updateHistoryService.getStatistics();
// Returns: total_entries, successful_updates, failed_updates, 
//          last_successful_update, last_check
```

### **Path Compliance Monitoring:**
- Automated validation in CI/CD pipeline
- Pre-release checks verhindert Regressionen
- Kontinuierliche Überwachung aller Path API Verwendungen

---

**🎯 WICHTIG:** Diese Architektur gewährleistet klare Trennung, Auditierbarkeit und Standards-Compliance für beide Update-Systeme in RawaLite.
