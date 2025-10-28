# Update System Development Guide
**Letzte Aktualisierung:** 02. Oktober 2025  
**Zielgruppe:** Entwickler  
**Kontext:** GitHub CLI → GitHub API Migration  
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
## 📋 Entwicklungsübersicht

Dieser Guide beschreibt die Implementierung der Migration vom GitHub CLI-basierten Update-System zu einem direkten GitHub HTTP API-basierten System.

## 🎯 Entwicklungsziele

### Primäre Ziele
- ✅ **Zero External Dependencies:** Entfernung der `gh` CLI Abhängigkeit
- ✅ **Simplified User Experience:** Keine GitHub-Authentifizierung für Endnutzer
- ✅ **Improved Reliability:** HTTP-basierte Fehlerbehandlung mit Retry-Logic
- ✅ **Better Performance:** Direkter API-Zugriff ohne CLI-Overhead

### Sekundäre Ziele
- ✅ **Backward Compatibility:** Bestehende UI und IPC-Interfaces beibehalten
- ✅ **Enhanced Testing:** HTTP-Mocks statt CLI-Mocks
- ✅ **Documentation:** Vollständige API-Dokumentation
- ✅ **Code Quality:** TypeScript-first, comprehensive error handling

---

## 🏗️ Implementierungsplan

### Phase 1: GitHubApiService Foundation (4h)

#### 1.1 Basis-Service erstellen (1.5h)
```typescript
// src/main/services/GitHubApiService.ts
import { Release, UpdateInfo } from '../../types/github';

export class GitHubApiService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly repo = 'MonaFP/RawaLite';
  private readonly headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'RawaLite-UpdateChecker/1.0'
  };

  constructor() {
    // Initialize service
  }

  async getLatestRelease(): Promise<Release> {
    // Implementation here
  }

  async downloadAsset(url: string, destination: string): Promise<void> {
    // Implementation here
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    // HTTP client implementation
  }
}
```

**Implementierungs-Schritte:**
1. **Basis-Klasse:** Service-Struktur mit TypeScript
2. **HTTP Client:** Native `fetch` mit Error Handling
3. **Configuration:** Repo-spezifische Einstellungen
4. **Type Safety:** Vollständige TypeScript-Integration

#### 1.2 GitHub API Integration (1.5h)
```typescript
// API-Endpoint Integration
async getLatestRelease(): Promise<Release> {
  const endpoint = `/repos/${this.repo}/releases/latest`;
  
  try {
    const response = await this.makeRequest<GitHubRelease>(endpoint);
    return this.mapGitHubReleaseToInternal(response);
  } catch (error) {
    throw new Error(`Failed to fetch latest release: ${error.message}`);
  }
}

// Type Mapping
private mapGitHubReleaseToInternal(ghRelease: GitHubRelease): Release {
  return {
    version: ghRelease.tag_name,
    name: ghRelease.name,
    body: ghRelease.body,
    publishedAt: new Date(ghRelease.published_at),
    assets: ghRelease.assets.map(asset => ({
      name: asset.name,
      downloadUrl: asset.browser_download_url,
      size: asset.size
    }))
  };
}
```

**Implementierungs-Details:**
- **Endpoint:** `/repos/MonaFP/RawaLite/releases/latest`
- **Response Mapping:** GitHub API → Internal Types
- **Error Handling:** Network, 404, Rate Limits
- **Validation:** Runtime type checking

#### 1.3 Download-Funktionalität (1h)
```typescript
async downloadAsset(url: string, destination: string): Promise<void> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const totalSize = parseInt(response.headers.get('content-length') || '0');
  let downloadedSize = 0;

  const fileStream = fs.createWriteStream(destination);
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('Failed to create download stream');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      fileStream.write(value);
      downloadedSize += value.length;
      
      // Emit progress event
      const progress = totalSize > 0 ? downloadedSize / totalSize : 0;
      this.emitDownloadProgress(progress);
    }
  } finally {
    fileStream.close();
    reader.releaseLock();
  }
}
```

**Features:**
- **Stream-based Download:** Memory-efficient für große Dateien
- **Progress Tracking:** Real-time Download-Progress
- **Error Recovery:** Graceful handling von Network-Issues
- **Resource Cleanup:** Proper stream management

### Phase 2: Rate Limiting Implementation (1h)

#### 2.1 RateLimitManager Service
```typescript
// src/main/services/RateLimitManager.ts
export class RateLimitManager {
  private requests: Date[] = [];
  private readonly maxRequests = 60; // GitHub rate limit
  private readonly timeWindow = 3600000; // 1 hour in milliseconds

  canMakeRequest(): boolean {
    this.cleanupOldRequests();
    return this.requests.length < this.maxRequests;
  }

  trackRequest(): void {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requests.push(new Date());
  }

  getRemainingRequests(): number {
    this.cleanupOldRequests();
    return this.maxRequests - this.requests.length;
  }

  getResetTime(): Date {
    if (this.requests.length === 0) {
      return new Date();
    }
    
    const oldestRequest = this.requests[0];
    return new Date(oldestRequest.getTime() + this.timeWindow);
  }

  private cleanupOldRequests(): void {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.timeWindow);
    
    this.requests = this.requests.filter(request => request > cutoff);
  }
}
```

#### 2.2 Integration in GitHubApiService
```typescript
export class GitHubApiService {
  private rateLimitManager = new RateLimitManager();

  private async makeRequest<T>(endpoint: string): Promise<T> {
    // Check rate limit before request
    if (!this.rateLimitManager.canMakeRequest()) {
      const resetTime = this.rateLimitManager.getResetTime();
      throw new Error(`Rate limit exceeded. Reset at: ${resetTime.toISOString()}`);
    }

    // Track request
    this.rateLimitManager.trackRequest();

    // Make HTTP request
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.headers
    });

    // Handle GitHub rate limit headers
    this.handleRateLimitHeaders(response.headers);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private handleRateLimitHeaders(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    
    if (remaining && parseInt(remaining) < 5) {
      console.warn(`GitHub API rate limit low: ${remaining} requests remaining`);
    }
  }
}
```

### Phase 3: UpdateManagerService Migration (2h)

#### 3.1 Service-Substitution (1h)
```typescript
// src/main/services/UpdateManagerService.ts
export class UpdateManagerService extends EventEmitter {
  // Vorher:
  // private githubCli = new GitHubCliService();
  
  // Nachher:
  private githubApi = new GitHubApiService();

  async checkForUpdates(): Promise<boolean> {
    try {
      const latestRelease = await this.githubApi.getLatestRelease();
      const currentVersion = this.getCurrentVersion();
      
      this.latestRelease = latestRelease;
      const hasUpdate = this.compareVersions(latestRelease.version, currentVersion) > 0;
      
      if (hasUpdate) {
        this.emit('update-available', {
          version: latestRelease.version,
          releaseNotes: latestRelease.body
        });
      }
      
      return hasUpdate;
    } catch (error) {
      this.emit('update-error', error);
      throw error;
    }
  }

  async startDownload(): Promise<string> {
    if (!this.latestRelease) {
      throw new Error('No update available to download');
    }

    const setupAsset = this.findSetupAsset(this.latestRelease.assets);
    if (!setupAsset) {
      throw new Error('Setup file not found in release assets');
    }

    const downloadPath = this.getDownloadPath(setupAsset.name);
    
    try {
      await this.githubApi.downloadAsset(setupAsset.downloadUrl, downloadPath);
      
      this.emit('update-downloaded', downloadPath);
      return downloadPath;
    } catch (error) {
      this.emit('update-error', error);
      throw error;
    }
  }
}
```

#### 3.2 Error Handling Improvements (1h)
```typescript
// Enhanced error handling for HTTP-based system
export class UpdateManagerService extends EventEmitter {
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error.message);
        
        await this.sleep(delay);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  async checkForUpdates(): Promise<boolean> {
    return this.retryOperation(async () => {
      return this.performUpdateCheck();
    });
  }

  async startDownload(): Promise<string> {
    return this.retryOperation(async () => {
      return this.performDownload();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Phase 4: Testing Implementation (2h)

#### 4.1 Unit Tests für GitHubApiService (1h)
```typescript
// tests/services/GitHubApiService.test.ts
import { GitHubApiService } from '../../src/main/services/GitHubApiService';
import { mockGitHubApiResponse } from '../mocks/github-api';

describe('GitHubApiService', () => {
  let service: GitHubApiService;
  
  beforeEach(() => {
    service = new GitHubApiService();
    jest.clearAllMocks();
  });

  describe('getLatestRelease', () => {
    test('should fetch and parse latest release', async () => {
      const mockRelease = mockGitHubApiResponse.release;
      
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease)
      });

      const result = await service.getLatestRelease();
      
      expect(result.version).toBe('v1.0.8');
      expect(result.assets).toHaveLength(2);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/MonaFP/RawaLite/releases/latest',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json'
          })
        })
      );
    });

    test('should handle rate limit errors', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'rate limit exceeded'
      });

      await expect(service.getLatestRelease()).rejects.toThrow('rate limit exceeded');
    });

    test('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getLatestRelease()).rejects.toThrow('Network error');
    });
  });

  describe('downloadAsset', () => {
    test('should download asset with progress tracking', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3, 4]));
          controller.close();
        }
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-length', '4']]),
        body: mockReadableStream
      });

      const fs = require('fs');
      const mockWriteStream = {
        write: jest.fn(),
        close: jest.fn()
      };
      
      fs.createWriteStream = jest.fn().mockReturnValue(mockWriteStream);

      await service.downloadAsset('http://example.com/asset', '/tmp/test');
      
      expect(mockWriteStream.write).toHaveBeenCalled();
      expect(mockWriteStream.close).toHaveBeenCalled();
    });
  });
});
```

#### 4.2 Integration Tests (1h)
```typescript
// tests/services/UpdateManagerService.integration.test.ts
import { UpdateManagerService } from '../../src/main/services/UpdateManagerService';
import { mockGitHubServer } from '../mocks/github-server';

describe('UpdateManagerService Integration', () => {
  let service: UpdateManagerService;
  let mockServer: any;

  beforeAll(async () => {
    mockServer = await mockGitHubServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    service = new UpdateManagerService();
  });

  test('should complete full update cycle', async () => {
    // Mock GitHub API responses
    mockServer.get('/repos/MonaFP/RawaLite/releases/latest')
      .reply(200, mockGitHubApiResponse.release);
    
    mockServer.get('/releases/download/v1.0.8/RawaLite-Setup-1.0.8.exe')
      .reply(200, Buffer.from('mock-installer-content'));

    // Test update check
    const hasUpdate = await service.checkForUpdates();
    expect(hasUpdate).toBe(true);

    // Test download
    const downloadPath = await service.startDownload();
    expect(downloadPath).toContain('RawaLite-Setup-1.0.8.exe');
    
    // Verify file exists
    const fs = require('fs');
    expect(fs.existsSync(downloadPath)).toBe(true);
  });

  test('should handle API errors gracefully', async () => {
    mockServer.get('/repos/MonaFP/RawaLite/releases/latest')
      .reply(500, { message: 'Internal Server Error' });

    await expect(service.checkForUpdates()).rejects.toThrow();
  });

  test('should respect rate limits', async () => {
    // Simulate rate limit response
    mockServer.get('/repos/MonaFP/RawaLite/releases/latest')
      .reply(403, { 
        message: 'API rate limit exceeded',
        documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
      });

    await expect(service.checkForUpdates()).rejects.toThrow('rate limit');
  });
});
```

---

## 🧪 Development Testing Strategy

### Lokale Test-Umgebung
```bash
# Setup Mock GitHub API Server
npm install --save-dev nock msw
npm install --save-dev @types/node-fetch

# Run tests with HTTP mocking
npm run test:unit    # Unit tests mit HTTP mocks
npm run test:integration  # Integration tests mit mock server
npm run test:e2e     # E2E tests mit real GitHub API (staging)
```

### Mock Data Management
```typescript
// tests/mocks/github-api.ts
export const mockGitHubApiResponse = {
  release: {
    tag_name: 'v1.0.8',
    name: 'Release 1.0.8',
    body: 'Bug fixes and improvements',
    published_at: '2025-10-02T10:00:00Z',
    assets: [
      {
        name: 'RawaLite-Setup-1.0.8.exe',
        browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.8/RawaLite-Setup-1.0.8.exe',
        size: 45678901
      },
      {
        name: 'latest.yml',
        browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.8/latest.yml',
        size: 567
      }
    ]
  }
};
```

### Manual Testing Checklist
```typescript
// Manual testing scenarios
const manualTests = [
  // Basic functionality
  '✅ Update detection works without CLI',
  '✅ Download completes successfully', 
  '✅ Progress events are emitted correctly',
  '✅ Installation proceeds normally',
  
  // Error scenarios
  '✅ Network timeout handling',
  '✅ Invalid response handling',
  '✅ Rate limit response handling',
  '✅ Asset not found handling',
  
  // Performance
  '✅ First update check < 2 seconds',
  '✅ Download speed comparable to CLI',
  '✅ Memory usage reasonable',
  '✅ No hanging processes',
  
  // User experience
  '✅ No GitHub authentication required',
  '✅ Error messages user-friendly',
  '✅ UI remains responsive during operations',
  '✅ Installation works for new users'
];
```

---

## 🐛 Debugging & Troubleshooting

### Logging Strategy
```typescript
// Enhanced logging for development
export class GitHubApiService {
  private logger = {
    info: (msg: string, data?: any) => console.log(`[GitHubAPI] ${msg}`, data),
    warn: (msg: string, data?: any) => console.warn(`[GitHubAPI] ${msg}`, data),
    error: (msg: string, data?: any) => console.error(`[GitHubAPI] ${msg}`, data)
  };

  async getLatestRelease(): Promise<Release> {
    this.logger.info('Fetching latest release');
    
    try {
      const response = await this.makeRequest<GitHubRelease>('/repos/MonaFP/RawaLite/releases/latest');
      this.logger.info('Successfully fetched release', { version: response.tag_name });
      return this.mapGitHubReleaseToInternal(response);
    } catch (error) {
      this.logger.error('Failed to fetch release', { error: error.message });
      throw error;
    }
  }
}
```

### Common Issues & Solutions
| Problem | Symptom | Solution |
|---------|---------|----------|
| **Rate Limit** | 403 Forbidden | Implement backoff strategy |
| **Network Timeout** | Request hangs | Add timeout + retry logic |
| **Invalid Response** | Parse errors | Add response validation |
| **Download Failure** | ENOENT, EACCES | Check permissions + paths |
| **Progress Not Updating** | UI freeze | Verify event emission |

### Development Commands
```bash
# Development workflow
npm run dev          # Start app in development mode
npm run test:watch   # Run tests in watch mode
npm run build        # Build for testing
npm run dist         # Create distribution package

# Debugging specific components
npm run test -- --grep "GitHubApiService"    # Test specific service
npm run test -- --grep "UpdateManager"       # Test update manager
npm run test -- --grep "rate limit"          # Test rate limiting

# Manual testing
npm run dev:verbose  # Enable detailed logging
npm run dev:mock     # Use mock GitHub API
```

---

## 📊 Performance Monitoring

### Metrics Collection
```typescript
// Performance monitoring during development
export class GitHubApiService {
  private metrics = {
    requestCount: 0,
    totalResponseTime: 0,
    errorCount: 0,
    lastRequestTime: 0
  };

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      const result = await this.performRequest<T>(endpoint);
      
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;
      this.metrics.lastRequestTime = responseTime;
      
      this.logger.info(`Request completed in ${responseTime}ms`);
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageResponseTime: this.metrics.requestCount > 0 
        ? this.metrics.totalResponseTime / this.metrics.requestCount 
        : 0,
      errorRate: this.metrics.requestCount > 0 
        ? this.metrics.errorCount / this.metrics.requestCount 
        : 0
    };
  }
}
```

### Performance Benchmarks
```typescript
// Development benchmarks
const performanceBenchmarks = {
  updateCheck: {
    target: '< 2000ms',
    actual: 'measure during dev'
  },
  downloadSpeed: {
    target: '> 1MB/s',
    actual: 'measure during dev'
  },
  memoryUsage: {
    target: '< 100MB',
    actual: 'measure during dev'
  },
  bundleSize: {
    target: 'no increase',
    actual: 'measure after build'
  }
};
```

---

## 🔧 Development Configuration

### TypeScript Configuration
```json
// tsconfig updates für neue Services
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true
  },
  "include": [
    "src/main/services/GitHubApiService.ts",
    "src/main/services/RateLimitManager.ts"
  ]
}
```

### ESLint Rules
```json
// .eslintrc.js updates
{
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/explicit-function-return-type": "error"
  },
  "overrides": [
    {
      "files": ["src/main/services/GitHubApiService.ts"],
      "rules": {
        "max-lines": ["error", 300]
      }
    }
  ]
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev:update-test": "npm run build && electron . --test-updates",
    "test:github-api": "jest tests/services/GitHubApiService.test.ts",
    "test:update-flow": "jest tests/integration/update-flow.test.ts",
    "benchmark:update": "node scripts/benchmark-update-system.js"
  }
}
```

---

## 📚 Referenzen

### API Dokumentation
- [GitHub REST API](https://docs.github.com/en/rest)
- [Node.js Fetch API](https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch)
- [Electron IPC](https://www.electronjs.org/docs/api/ipc-main)

### Interne Links
- [UPDATE_SYSTEM_ARCHITECTURE.md](../01-architecture/UPDATE_SYSTEM_ARCHITECTURE.md)
- [GITHUB_API_MIGRATION.md](../00-meta/GITHUB_API_MIGRATION.md)
- [UPDATE_TESTING.md](../03-testing/UPDATE_TESTING.md)

### Tools & Libraries
- **Testing:** Jest, Playwright, MSW
- **Mocking:** nock, msw, jest.mock
- **HTTP:** fetch (native), node-fetch (backup)
- **File System:** fs/promises (native)

---

**Erstellt:** 02. Oktober 2025  
**Status:** Ready for Implementation  
**Nächster Schritt:** Begin Phase 1 - GitHubApiService Implementation