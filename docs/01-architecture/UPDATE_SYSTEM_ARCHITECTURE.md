# Update System Architecture
**Letzte Aktualisierung:** 02. Oktober 2025  
**Status:** 🔄 Migration zu GitHub API geplant  
**Version:** 1.0.7 → 1.0.8  

## 📋 Übersicht

Das Update-System von RawaLite ermöglicht automatische Updates der Electron-Anwendung über GitHub Releases. Das System erkennt neue Versionen, lädt diese herunter und führt die Installation durch.

## 🏗️ Aktuelle Architektur (v1.0.7)

### Komponenten-Überblick
```
┌─────────────────┐    IPC     ┌──────────────────┐    CLI    ┌─────────────────┐
│   UpdateDialog  │◄──────────►│ UpdateManager    │◄─────────►│ GitHubCliService│
│   (React UI)    │            │ Service          │           │ (gh wrapper)    │
└─────────────────┘            └──────────────────┘           └─────────────────┘
                                        │                              │
                                        │                              │
                                        ▼                              ▼
                               ┌──────────────────┐           ┌─────────────────┐
                               │   IPC Handlers   │           │   gh.exe Binary │
                               │   (main.ts)      │           │   (external)    │
                               └──────────────────┘           └─────────────────┘
                                        │                              │
                                        │                              │
                                        ▼                              ▼
                               ┌──────────────────┐           ┌─────────────────┐
                               │ Preload Context  │           │  GitHub API     │
                               │ (preload.ts)     │           │  (via CLI)      │
                               └──────────────────┘           └─────────────────┘
```

### Datenfluss (Aktuell)
1. **UI Request:** UpdateDialog → IPC call
2. **Service Layer:** UpdateManagerService koordiniert Logik
3. **GitHub Access:** GitHubCliService → `gh` binary → GitHub API
4. **Response:** GitHub API → CLI parsing → Service → IPC → UI

### Technologie-Stack (Aktuell)
| Schicht | Technologie | Datei | Zweck |
|---------|-------------|-------|-------|
| **UI** | React + TypeScript | `UpdateDialog.tsx` | Benutzerinterface |
| **IPC** | Electron IPC | `preload.ts`, `main.ts` | Prozess-Kommunikation |
| **Service** | TypeScript | `UpdateManagerService.ts` | Business Logic |
| **GitHub** | CLI Wrapper | `GitHubCliService.ts` | API-Zugriff |
| **External** | GitHub CLI | `gh.exe` | Authentifizierung |

---

## 🎯 Geplante Architektur (v1.0.8)

### Neue Komponenten-Struktur
```
┌─────────────────┐    IPC     ┌──────────────────┐   HTTP    ┌─────────────────┐
│   UpdateDialog  │◄──────────►│ UpdateManager    │◄─────────►│ GitHubApiService│
│   (React UI)    │            │ Service          │           │ (HTTP client)   │
└─────────────────┘            └──────────────────┘           └─────────────────┘
                                        │                              │
                                        │                              │
                                        ▼                              ▼
                               ┌──────────────────┐           ┌─────────────────┐
                               │   IPC Handlers   │           │ RateLimitManager│
                               │   (main.ts)      │           │ (HTTP helper)   │
                               └──────────────────┘           └─────────────────┘
                                        │                              │
                                        │                              │
                                        ▼                              ▼
                               ┌──────────────────┐           ┌─────────────────┐
                               │ Preload Context  │           │  GitHub API     │
                               │ (preload.ts)     │           │  (direct HTTP)  │
                               └──────────────────┘           └─────────────────┘
```

### Neuer Datenfluss
1. **UI Request:** UpdateDialog → IPC call (unverändert)
2. **Service Layer:** UpdateManagerService koordiniert (unverändert)
3. **GitHub Access:** GitHubApiService → Direct HTTP → GitHub API
4. **Response:** GitHub API → JSON parsing → Service → IPC → UI

### Neuer Technologie-Stack
| Schicht | Technologie | Datei | Änderung |
|---------|-------------|-------|----------|
| **UI** | React + TypeScript | `UpdateDialog.tsx` | ✅ Unverändert |
| **IPC** | Electron IPC | `preload.ts`, `main.ts` | ✅ Unverändert |
| **Service** | TypeScript | `UpdateManagerService.ts` | 🔄 Service-Substitution |
| **GitHub** | HTTP Client | `GitHubApiService.ts` | 🆕 Neu implementiert |
| **External** | ~~GitHub CLI~~ | ~~`gh.exe`~~ | ❌ Entfernt |
| **Helper** | Rate Limiting | `RateLimitManager.ts` | 🆕 Neu hinzugefügt |

---

## 🔧 Detaillierte Komponenten

### 1. UpdateDialog (React Component)
**Datei:** `src/components/UpdateDialog.tsx`  
**Status:** ✅ Bleibt unverändert  

```typescript
interface UpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
}

// Verwendete IPC APIs:
// - window.rawalite.updates.startDownload()
// - window.rawalite.updates.installUpdate()
// - window.rawalite.updates.onUpdateProgress()
```

**Funktionen:**
- Update-Information anzeigen
- Download-Progress anzeigen
- Installation starten
- Fehlerbehandlung für UI

**Migration Impact:** ✅ Keine Änderungen erforderlich

### 2. UpdateManagerService (Business Logic)
**Datei:** `src/main/services/UpdateManagerService.ts`  
**Status:** 🔄 Service-Austausch erforderlich  

```typescript
class UpdateManagerService {
  // Vorher:
  private githubCli = new GitHubCliService();
  
  // Nachher:
  private githubApi = new GitHubApiService();
  
  async checkForUpdates(): Promise<boolean>;
  async startDownload(): Promise<string>;
  async installUpdate(installerPath: string): Promise<void>;
}
```

**Änderungen:**
- Service-Dependency von CLI → API
- Gleiche Public Interface
- Verbesserte Fehlerbehandlung

**Migration Impact:** 🔄 Interne Implementierung ändern

### 3. GitHubApiService (Neu)
**Datei:** `src/main/services/GitHubApiService.ts`  
**Status:** 🆕 Neu zu implementieren  

```typescript
class GitHubApiService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly repo = 'MonaFP/RawaLite';
  private rateLimitManager = new RateLimitManager();
  
  async getLatestRelease(): Promise<Release>;
  async downloadAsset(url: string, destination: string): Promise<void>;
  private async makeRequest<T>(endpoint: string): Promise<T>;
  private handleRateLimit(headers: Headers): void;
}
```

**Features:**
- Direct HTTP API calls
- Rate Limiting Management
- Stream-based Downloads
- Retry Logic mit Exponential Backoff

**Migration Impact:** 🆕 Vollständige Neuimplementierung

### 4. RateLimitManager (Helper)
**Datei:** `src/main/services/RateLimitManager.ts`  
**Status:** 🆕 Neu zu implementieren  

```typescript
class RateLimitManager {
  private requests: Date[] = [];
  private readonly maxRequests = 60; // GitHub Limit
  private readonly timeWindow = 3600000; // 1 Stunde
  
  canMakeRequest(): boolean;
  trackRequest(): void;
  getResetTime(): Date;
  getRemainingRequests(): number;
}
```

**Zweck:**
- GitHub API Rate Limits respektieren
- Request-Tracking über Zeitfenster
- Automatic Throttling

**Migration Impact:** 🆕 Vollständige Neuimplementierung

### 5. IPC Layer (Electron)
**Dateien:** `electron/main.ts`, `electron/preload.ts`  
**Status:** ✅ Interface bleibt unverändert  

```typescript
// IPC Handlers (main.ts)
ipcMain.handle('updates:check', async () => {
  return updateManager.checkForUpdates();
});

ipcMain.handle('updates:download', async () => {
  return updateManager.startDownload();
});

// Preload API (preload.ts)
contextBridge.exposeInMainWorld('rawalite', {
  updates: {
    checkForUpdates: () => ipcRenderer.invoke('updates:check'),
    startDownload: () => ipcRenderer.invoke('updates:download'),
    // ... weitere APIs
  }
});
```

**Migration Impact:** ✅ Keine Änderungen erforderlich

---

## 📊 API-Vergleich

### GitHub CLI vs. HTTP API

| Operation | GitHub CLI | GitHub HTTP API | Vorteile |
|-----------|------------|-----------------|----------|
| **Latest Release** | `gh release view latest --json` | `GET /repos/owner/repo/releases/latest` | ✅ Direkt, weniger Parsing |
| **Asset Download** | `gh release download --dir` | Direct asset URL | ✅ Stream-based, Progress |
| **Authentication** | CLI Login required | Public API (no auth) | ✅ Zero setup für Nutzer |
| **Rate Limits** | CLI handles internally | Manual management | ✅ Transparent control |
| **Error Handling** | CLI exit codes | HTTP status codes | ✅ Standard HTTP errors |
| **Dependencies** | External `gh.exe` binary | Native Node.js | ✅ Zero external deps |

### Performance-Vergleich

| Metrik | GitHub CLI | GitHub API | Verbesserung |
|--------|------------|------------|--------------|
| **Cold Start** | ~2-3s (CLI startup) | ~0.5s (HTTP request) | ✅ 4-6x schneller |
| **Memory Usage** | ~50MB (gh process) | ~5MB (HTTP client) | ✅ 10x effizienter |
| **Network** | CLI + HTTP overhead | Direct HTTP | ✅ Weniger Overhead |
| **Error Recovery** | Process restart | Retry request | ✅ Schnellere Recovery |

---

## 🧪 Testing-Architektur

### Test-Pyramide

```
                    ┌─────────────────┐
                    │   E2E Tests     │ ← Vollständiger Update-Flow
                    │   (Playwright)  │
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Integration Tests    │ ← Service Interaction
                  │   (Jest + Mocks)      │
                  └───────────────────────┘
              ┌─────────────────────────────────┐
              │        Unit Tests               │ ← Individual Components
              │   (Jest + HTTP Mocks)           │
              └─────────────────────────────────┘
```

### Test-Strategie

#### Unit Tests
```typescript
// GitHubApiService.test.ts
describe('GitHubApiService', () => {
  test('should fetch latest release from GitHub API');
  test('should handle rate limiting gracefully');
  test('should retry on network errors');
  test('should download assets with progress tracking');
});

// RateLimitManager.test.ts
describe('RateLimitManager', () => {
  test('should track requests within time window');
  test('should prevent requests when limit exceeded');
  test('should reset limits after time window');
});
```

#### Integration Tests
```typescript
// UpdateManagerService.test.ts (updated)
describe('UpdateManagerService with GitHubApi', () => {
  beforeEach(() => {
    // Mock GitHub API responses
    mockGitHubApi({
      releases: mockReleaseData,
      assets: mockAssetData
    });
  });
  
  test('should complete full update cycle');
  test('should handle network failures gracefully');
});
```

#### E2E Tests
```typescript
// update-flow.test.ts
test('complete update flow without CLI dependency', async () => {
  // Verify no gh.exe processes
  const processes = await getRunningProcesses();
  expect(processes).not.toContain('gh.exe');
  
  // Execute full update flow
  await updateDialog.checkForUpdates();
  await updateDialog.downloadUpdate();
  await updateDialog.installUpdate();
  
  // Verify update completed
  expect(await app.getVersion()).toBe('1.0.8');
});
```

---

## 🔒 Sicherheitsaspekte

### Aktuelle Sicherheit (CLI)
- **GitHub CLI Auth:** Benutzer-spezifische Token
- **Asset Verification:** CLI-interne Checksums
- **HTTPS:** Automatisch durch CLI
- **Code Signing:** Electron-Builder Integration

### Neue Sicherheit (HTTP API)
- **Public API:** Keine Authentifizierung, aber Rate Limits
- **Asset Verification:** Manuelle Checksum-Validierung (planned)
- **HTTPS:** Explizite Certificate Validation
- **Code Signing:** Unverändert

### Sicherheits-Verbesserungen
```typescript
class GitHubApiService {
  // HTTPS Certificate Pinning
  private validateCertificate(response: Response): void {
    // Verify GitHub's SSL certificate
  }
  
  // Asset Integrity Verification (zukünftig)
  private async verifyAssetChecksum(
    filePath: string, 
    expectedHash: string
  ): Promise<boolean> {
    // SHA-256 verification
  }
  
  // Request Validation
  private validateApiResponse(data: unknown): Release {
    // Runtime type checking
  }
}
```

---

## 📈 Performance-Optimierungen

### Caching-Strategie
```typescript
class GitHubApiService {
  private releaseCache = new Map<string, {
    data: Release;
    timestamp: number;
    ttl: number;
  }>();
  
  async getLatestRelease(): Promise<Release> {
    const cached = this.getCachedRelease();
    if (cached && !this.isCacheExpired(cached)) {
      return cached.data;
    }
    
    const release = await this.fetchLatestRelease();
    this.cacheRelease(release);
    return release;
  }
}
```

### Download-Optimierung
```typescript
class GitHubApiService {
  async downloadAsset(url: string, destination: string): Promise<void> {
    const response = await fetch(url);
    const reader = response.body?.getReader();
    const writer = fs.createWriteStream(destination);
    
    // Stream with progress tracking
    let downloaded = 0;
    const total = parseInt(response.headers.get('content-length') || '0');
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      writer.write(value);
      downloaded += value.length;
      
      // Emit progress event
      this.emitProgress(downloaded / total);
    }
  }
}
```

### Error Recovery
```typescript
class GitHubApiService {
  private async makeRequestWithRetry<T>(
    endpoint: string,
    maxRetries = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeRequest<T>(endpoint);
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
      }
    }
    
    throw new Error('Max retries exceeded');
  }
}
```

---

## 🔄 Migration-Reihenfolge

### Phase 1: Foundation (4h)
1. **GitHubApiService Implementation**
   - Basic HTTP client
   - GitHub API integration
   - Rate limiting logic

2. **RateLimitManager Implementation**
   - Request tracking
   - Limit enforcement
   - Reset handling

3. **Unit Tests**
   - API service tests
   - Rate limit tests
   - Error handling tests

### Phase 2: Integration (3h)
1. **UpdateManagerService Migration**
   - Service substitution
   - Method adaptation
   - Event system update

2. **Integration Tests**
   - Service interaction tests
   - Mock API responses
   - Error scenario tests

### Phase 3: Validation (2h)
1. **E2E Testing**
   - Full update flow
   - CLI dependency verification
   - Performance validation

2. **UI Compatibility**
   - Verify no UI changes
   - Error message updates
   - Progress tracking accuracy

### Phase 4: Cleanup (2h)
1. **Code Removal**
   - Delete GitHubCliService
   - Remove CLI dependencies
   - Update imports

2. **Documentation**
   - Architecture updates
   - API documentation
   - User guide updates

---

## 📚 Referenzen

### GitHub API Dokumentation
- [GitHub REST API](https://docs.github.com/en/rest)
- [Releases API](https://docs.github.com/en/rest/releases/releases)
- [Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

### Interne Dokumentation
- [GITHUB_API_MIGRATION.md](../00-meta/GITHUB_API_MIGRATION.md) - Migrations-Plan
- [UPDATE_DEVELOPMENT.md](../02-development/UPDATE_DEVELOPMENT.md) - Development Guide
- [UPDATE_TESTING.md](../03-testing/UPDATE_TESTING.md) - Testing Strategy

### Code-Referenzen
- `src/components/UpdateDialog.tsx` - UI Component
- `src/main/services/UpdateManagerService.ts` - Business Logic
- `electron/main.ts` - IPC Handlers
- `electron/preload.ts` - Preload Context

---

**Letzte Aktualisierung:** 02. Oktober 2025  
**Nächste Review:** Nach Phase 1 Implementation  
**Verantwortlich:** GitHub Copilot + Ramon