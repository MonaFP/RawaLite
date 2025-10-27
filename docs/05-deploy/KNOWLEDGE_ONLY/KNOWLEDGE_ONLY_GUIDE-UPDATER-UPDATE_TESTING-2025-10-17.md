# Update System Testing Strategy
$12025-10-17 (Content modernization + ROOT_ integration)| Test-Typ | Anzahl | Coverage | Ausführungszeit |
|----------|--------|----------|-----------------|
| **Unit Tests** | 40+ | 95%+ | < 30s |
| **Integration Tests** | 15 | 85%+ | < 2min |
| **E2E Tests** | 5 | 70%+ | < 5min |
| **Manual Tests** | 10 | N/A | < 30min |

---

## 🧪 Unit Testing

### GitHubApiService Tests
```typescript
// tests/services/GitHubApiService.test.ts
describe('GitHubApiService', () => {
  let service: GitHubApiService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    service = new GitHubApiService();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('getLatestRelease', () => {
    test('should successfully fetch latest release', async () => {
      // Arrange
      const mockRelease = {
        tag_name: 'v1.0.8',
        name: 'Release 1.0.8',
        body: 'Bug fixes and improvements',
        published_at: '2025-10-02T10:00:00Z',
        assets: [
          {
            name: 'RawaLite-Setup-1.0.8.exe',
            browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.8/RawaLite-Setup-1.0.8.exe',
            size: 45678901
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
        headers: new Headers()
      } as Response);

      // Act
      const result = await service.getLatestRelease();

      // Assert
      expect(result.version).toBe('v1.0.8');
      expect(result.name).toBe('Release 1.0.8');
      expect(result.assets).toHaveLength(1);
      expect(result.assets[0].name).toBe('RawaLite-Setup-1.0.8.exe');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/MonaFP/RawaLite/releases/latest',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'RawaLite-UpdateChecker/1.0'
          })
        })
      );
    });

    test('should handle 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(service.getLatestRelease()).rejects.toThrow('HTTP 404: Not Found');
    });

    test('should handle rate limit (403)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'rate limit exceeded',
        headers: new Headers({
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1696234800'
        })
      } as Response);

      await expect(service.getLatestRelease()).rejects.toThrow('rate limit exceeded');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(service.getLatestRelease()).rejects.toThrow('Network timeout');
    });

    test('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response);

      await expect(service.getLatestRelease()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('downloadAsset', () => {
    test('should download asset with progress tracking', async () => {
      // Mock ReadableStream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3, 4]));
          controller.enqueue(new Uint8Array([5, 6, 7, 8]));
          controller.close();
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-length': '8' }),
        body: mockStream
      } as Response);

      // Mock file system
      const mockWriteStream = {
        write: jest.fn(),
        close: jest.fn()
      };
      
      const fs = require('fs');
      fs.createWriteStream = jest.fn().mockReturnValue(mockWriteStream);

      // Track progress events
      const progressEvents: number[] = [];
      service.on('download-progress', (progress: number) => {
        progressEvents.push(progress);
      });

      // Act
      await service.downloadAsset('http://example.com/asset', '/tmp/test');

      // Assert
      expect(mockWriteStream.write).toHaveBeenCalledTimes(2);
      expect(mockWriteStream.close).toHaveBeenCalled();
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[progressEvents.length - 1]).toBe(1); // 100% complete
    });

    test('should handle download errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(service.downloadAsset('http://example.com/asset', '/tmp/test'))
        .rejects.toThrow('Download failed: 500 Internal Server Error');
    });

    test('should handle stream errors', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.error(new Error('Stream error'));
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-length': '8' }),
        body: mockStream
      } as Response);

      await expect(service.downloadAsset('http://example.com/asset', '/tmp/test'))
        .rejects.toThrow('Stream error');
    });
  });
});
```

### RateLimitManager Tests
```typescript
// tests/services/RateLimitManager.test.ts
describe('RateLimitManager', () => {
  let manager: RateLimitManager;

  beforeEach(() => {
    manager = new RateLimitManager();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should allow requests within limit', () => {
    // Make 59 requests (under limit of 60)
    for (let i = 0; i < 59; i++) {
      expect(manager.canMakeRequest()).toBe(true);
      manager.trackRequest();
    }

    expect(manager.getRemainingRequests()).toBe(1);
  });

  test('should block requests when limit exceeded', () => {
    // Fill up the rate limit
    for (let i = 0; i < 60; i++) {
      manager.trackRequest();
    }

    expect(manager.canMakeRequest()).toBe(false);
    expect(() => manager.trackRequest()).toThrow('Rate limit exceeded');
  });

  test('should reset after time window', () => {
    // Fill up rate limit
    for (let i = 0; i < 60; i++) {
      manager.trackRequest();
    }

    expect(manager.canMakeRequest()).toBe(false);

    // Advance time by 1 hour
    jest.advanceTimersByTime(3600000);

    expect(manager.canMakeRequest()).toBe(true);
    expect(manager.getRemainingRequests()).toBe(60);
  });

  test('should provide accurate reset time', () => {
    const startTime = new Date();
    jest.setSystemTime(startTime);

    manager.trackRequest();
    
    const resetTime = manager.getResetTime();
    const expectedResetTime = new Date(startTime.getTime() + 3600000);
    
    expect(resetTime).toEqual(expectedResetTime);
  });

  test('should cleanup old requests', () => {
    const startTime = new Date();
    jest.setSystemTime(startTime);

    // Make some requests
    for (let i = 0; i < 30; i++) {
      manager.trackRequest();
    }

    expect(manager.getRemainingRequests()).toBe(30);

    // Advance time by 30 minutes
    jest.advanceTimersByTime(1800000);

    // Make more requests
    for (let i = 0; i < 30; i++) {
      manager.trackRequest();
    }

    expect(manager.getRemainingRequests()).toBe(0);

    // Advance time by another 31 minutes (total 61 minutes)
    jest.advanceTimersByTime(1860000);

    // First batch should be cleaned up
    expect(manager.getRemainingRequests()).toBe(30);
  });
});
```

### UpdateManagerService Tests (Updated)
```typescript
// tests/services/UpdateManagerService.test.ts
describe('UpdateManagerService with GitHubApi', () => {
  let service: UpdateManagerService;
  let mockGitHubApi: jest.Mocked<GitHubApiService>;

  beforeEach(() => {
    mockGitHubApi = {
      getLatestRelease: jest.fn(),
      downloadAsset: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    } as any;

    service = new UpdateManagerService();
    (service as any).githubApi = mockGitHubApi;
  });

  test('should detect available updates', async () => {
    const mockRelease = {
      version: 'v1.0.8',
      name: 'Release 1.0.8',
      body: 'Bug fixes',
      publishedAt: new Date(),
      assets: [
        {
          name: 'RawaLite-Setup-1.0.8.exe',
          downloadUrl: 'http://example.com/setup.exe',
          size: 12345
        }
      ]
    };

    mockGitHubApi.getLatestRelease.mockResolvedValueOnce(mockRelease);
    
    // Mock current version as older
    jest.spyOn(service as any, 'getCurrentVersion').mockReturnValue('1.0.7');

    const hasUpdate = await service.checkForUpdates();

    expect(hasUpdate).toBe(true);
    expect(mockGitHubApi.getLatestRelease).toHaveBeenCalled();
  });

  test('should not detect updates when current', async () => {
    const mockRelease = {
      version: 'v1.0.7',
      name: 'Release 1.0.7',
      body: 'Current version',
      publishedAt: new Date(),
      assets: []
    };

    mockGitHubApi.getLatestRelease.mockResolvedValueOnce(mockRelease);
    jest.spyOn(service as any, 'getCurrentVersion').mockReturnValue('1.0.7');

    const hasUpdate = await service.checkForUpdates();

    expect(hasUpdate).toBe(false);
  });

  test('should download update successfully', async () => {
    const mockRelease = {
      version: 'v1.0.8',
      assets: [
        {
          name: 'RawaLite-Setup-1.0.8.exe',
          downloadUrl: 'http://example.com/setup.exe',
          size: 12345
        }
      ]
    };

    (service as any).latestRelease = mockRelease;
    mockGitHubApi.downloadAsset.mockResolvedValueOnce(undefined);

    const downloadPath = await service.startDownload();

    expect(downloadPath).toContain('RawaLite-Setup-1.0.8.exe');
    expect(mockGitHubApi.downloadAsset).toHaveBeenCalledWith(
      'http://example.com/setup.exe',
      expect.stringContaining('RawaLite-Setup-1.0.8.exe')
    );
  });

  test('should handle API errors with retry', async () => {
    mockGitHubApi.getLatestRelease
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        version: 'v1.0.8',
        name: 'Release 1.0.8',
        body: 'Success on retry',
        publishedAt: new Date(),
        assets: []
      });

    jest.spyOn(service as any, 'getCurrentVersion').mockReturnValue('1.0.7');

    const hasUpdate = await service.checkForUpdates();

    expect(hasUpdate).toBe(true);
    expect(mockGitHubApi.getLatestRelease).toHaveBeenCalledTimes(3);
  });
});
```

---

## 🔗 Integration Testing

### Service Integration Tests
```typescript
// tests/integration/update-service-integration.test.ts
import { UpdateManagerService } from '../../src/main/services/UpdateManagerService';
import { GitHubApiService } from '../../src/main/services/GitHubApiService';
import { setupMockGitHubApi } from '../helpers/mock-github-api';

describe('Update Service Integration', () => {
  let updateManager: UpdateManagerService;
  let mockApiServer: any;

  beforeAll(async () => {
    mockApiServer = await setupMockGitHubApi();
  });

  afterAll(async () => {
    await mockApiServer.close();
  });

  beforeEach(() => {
    updateManager = new UpdateManagerService();
  });

  test('should complete full update cycle', async () => {
    // Setup mock responses
    mockApiServer.get('/repos/MonaFP/RawaLite/releases/latest')
      .reply(200, {
        tag_name: 'v1.0.8',
        name: 'Release 1.0.8',
        body: 'Test release',
        published_at: '2025-10-02T10:00:00Z',
        assets: [
          {
            name: 'RawaLite-Setup-1.0.8.exe',
            browser_download_url: 'http://localhost:3333/download/setup.exe',
            size: 1000
          }
        ]
      });

    mockApiServer.get('/download/setup.exe')
      .reply(200, Buffer.from('mock setup file content'));

    // Execute full cycle
    const hasUpdate = await updateManager.checkForUpdates();
    expect(hasUpdate).toBe(true);

    const downloadPath = await updateManager.startDownload();
    expect(downloadPath).toContain('RawaLite-Setup-1.0.8.exe');

    // Verify file was downloaded
    const fs = require('fs');
    expect(fs.existsSync(downloadPath)).toBe(true);
    
    const content = fs.readFileSync(downloadPath, 'utf8');
    expect(content).toBe('mock setup file content');
  });

  test('should handle rate limiting across services', async () => {
    // Setup rate limit response
    mockApiServer.get('/repos/MonaFP/RawaLite/releases/latest')
      .reply(403, {
        message: 'API rate limit exceeded',
        documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
      });

    await expect(updateManager.checkForUpdates()).rejects.toThrow('rate limit');
  });

  test('should emit correct events during update process', async () => {
    const events: Array<{type: string, data: any}> = [];
    
    updateManager.on('update-available', (data) => events.push({type: 'update-available', data}));
    updateManager.on('download-progress', (data) => events.push({type: 'download-progress', data}));
    updateManager.on('update-downloaded', (data) => events.push({type: 'update-downloaded', data}));

    // Setup successful responses
    mockApiServer.get('/repos/MonaFP/RawaLite/releases/latest')
      .reply(200, { /* valid release data */ });
    
    mockApiServer.get('/download/setup.exe')
      .reply(200, Buffer.from('test content'));

    await updateManager.checkForUpdates();
    await updateManager.startDownload();

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('update-available');
    expect(events[1].type).toBe('download-progress');
    expect(events[2].type).toBe('update-downloaded');
  });
});
```

### IPC Integration Tests
```typescript
// tests/integration/ipc-update-integration.test.ts
import { ipcMain, ipcRenderer } from 'electron';
import { UpdateManagerService } from '../../src/main/services/UpdateManagerService';

describe('IPC Update Integration', () => {
  let updateManager: UpdateManagerService;

  beforeEach(() => {
    updateManager = new UpdateManagerService();
    // Setup IPC handlers like in main.ts
    ipcMain.handle('updates:check', () => updateManager.checkForUpdates());
    ipcMain.handle('updates:download', () => updateManager.startDownload());
  });

  afterEach(() => {
    ipcMain.removeAllListeners('updates:check');
    ipcMain.removeAllListeners('updates:download');
  });

  test('should handle update check via IPC', async () => {
    // Mock successful API response
    jest.spyOn(updateManager, 'checkForUpdates').mockResolvedValueOnce(true);

    const result = await ipcRenderer.invoke('updates:check');

    expect(result).toBe(true);
    expect(updateManager.checkForUpdates).toHaveBeenCalled();
  });

  test('should handle download via IPC', async () => {
    const mockPath = '/tmp/RawaLite-Setup-1.0.8.exe';
    jest.spyOn(updateManager, 'startDownload').mockResolvedValueOnce(mockPath);

    const result = await ipcRenderer.invoke('updates:download');

    expect(result).toBe(mockPath);
    expect(updateManager.startDownload).toHaveBeenCalled();
  });

  test('should propagate errors through IPC', async () => {
    const error = new Error('Network error');
    jest.spyOn(updateManager, 'checkForUpdates').mockRejectedValueOnce(error);

    await expect(ipcRenderer.invoke('updates:check')).rejects.toThrow('Network error');
  });
});
```

---

## 🎭 End-to-End Testing

### Complete Update Flow
```typescript
// e2e/update-flow.test.ts
import { ElectronApplication, Page } from 'playwright-core';
import { _electron as electron } from 'playwright';

describe('Update Flow E2E', () => {
  let app: ElectronApplication;
  let page: Page;

  beforeEach(async () => {
    app = await electron.launch({
      args: ['dist-electron/main.cjs'],
      env: {
        NODE_ENV: 'test',
        GITHUB_API_BASE_URL: 'http://localhost:3333' // Mock server
      }
    });
    
    page = await app.firstWindow();
  });

  afterEach(async () => {
    await app.close();
  });

  test('should complete update flow with GitHub API', async () => {
    // Verify no gh.exe processes are running
    const processes = await page.evaluate(() => {
      return new Promise((resolve) => {
        require('child_process').exec('tasklist /FI "IMAGENAME eq gh.exe"', (error, stdout) => {
          resolve(stdout.includes('gh.exe') ? ['gh.exe'] : []);
        });
      });
    });
    
    expect(processes).toEqual([]);

    // Navigate to update settings
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="updates-tab"]');

    // Check for updates
    await page.click('[data-testid="check-updates-button"]');

    // Wait for update detection
    await page.waitForSelector('[data-testid="update-available"]', { timeout: 10000 });

    // Start download
    await page.click('[data-testid="download-update-button"]');

    // Wait for download completion
    await page.waitForSelector('[data-testid="download-complete"]', { timeout: 30000 });

    // Verify download file exists
    const downloadPath = await page.evaluate(() => {
      return window.rawalite?.updates?.getLastDownloadPath?.();
    });

    expect(downloadPath).toBeTruthy();
    expect(downloadPath).toContain('RawaLite-Setup');
  });

  test('should handle network errors gracefully', async () => {
    // Navigate to updates
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="updates-tab"]');

    // Simulate network error by stopping mock server
    await stopMockApiServer();

    // Try to check for updates
    await page.click('[data-testid="check-updates-button"]');

    // Should show error message
    await page.waitForSelector('[data-testid="update-error"]', { timeout: 5000 });
    
    const errorText = await page.textContent('[data-testid="update-error"]');
    expect(errorText).toContain('network');
  });

  test('should show progress during download', async () => {
    // Setup mock server with slow download
    await setupSlowDownloadMock();

    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="updates-tab"]');
    await page.click('[data-testid="check-updates-button"]');
    
    await page.waitForSelector('[data-testid="update-available"]');
    await page.click('[data-testid="download-update-button"]');

    // Monitor progress
    const progressValues: number[] = [];
    
    await page.waitForFunction(() => {
      const progressElement = document.querySelector('[data-testid="download-progress"]');
      if (progressElement) {
        const progress = parseFloat(progressElement.textContent || '0');
        if (progress > 0) return true;
      }
      return false;
    });

    // Verify progress increases
    let lastProgress = 0;
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(500);
      const progressText = await page.textContent('[data-testid="download-progress"]');
      const currentProgress = parseFloat(progressText || '0');
      
      expect(currentProgress).toBeGreaterThanOrEqual(lastProgress);
      lastProgress = currentProgress;
      
      if (currentProgress >= 100) break;
    }
  });
});
```

### UI Regression Tests
```typescript
// e2e/ui-regression.test.ts
describe('Update UI Regression Tests', () => {
  test('should maintain consistent UI after API migration', async () => {
    // Compare UI screenshots before/after migration
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="updates-tab"]');

    const screenshot = await page.screenshot({ 
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });

    expect(screenshot).toMatchSnapshot('update-tab-layout.png');
  });

  test('should show same error messages for familiar scenarios', async () => {
    // Test that error messages remain user-friendly
    await simulateNetworkError();
    
    await page.click('[data-testid="check-updates-button"]');
    await page.waitForSelector('[data-testid="update-error"]');
    
    const errorText = await page.textContent('[data-testid="update-error"]');
    expect(errorText).not.toContain('HTTP 403');
    expect(errorText).not.toContain('fetch failed');
    expect(errorText).toContain('Unable to check for updates');
  });
});
```

---

## 🔧 Test Helpers & Utilities

### Mock GitHub API Server
```typescript
// tests/helpers/mock-github-api.ts
import express from 'express';
import { Server } from 'http';

export class MockGitHubApiServer {
  private app = express();
  private server?: Server;
  private port = 3333;

  constructor() {
    this.setupRoutes();
  }

  private setupRoutes() {
    // Latest release endpoint
    this.app.get('/repos/MonaFP/RawaLite/releases/latest', (req, res) => {
      res.json({
        tag_name: 'v1.0.8',
        name: 'Release 1.0.8',
        body: 'Mock release for testing',
        published_at: '2025-10-02T10:00:00Z',
        assets: [
          {
            name: 'RawaLite-Setup-1.0.8.exe',
            browser_download_url: `http://localhost:${this.port}/download/setup.exe`,
            size: 1000
          }
        ]
      });
    });

    // Asset download endpoint
    this.app.get('/download/setup.exe', (req, res) => {
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': '1000'
      });
      
      // Send mock binary data
      const buffer = Buffer.alloc(1000, 'mock-setup-data');
      res.send(buffer);
    });

    // Rate limit simulation
    this.app.use('/rate-limited/*', (req, res) => {
      res.status(403).json({
        message: 'API rate limit exceeded',
        documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
      });
    });

    // Error simulation
    this.app.use('/error/*', (req, res) => {
      res.status(500).json({
        message: 'Internal server error'
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Mock GitHub API server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Mock GitHub API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Test utilities
  simulateRateLimit() {
    this.app.get('/repos/MonaFP/RawaLite/releases/latest', (req, res) => {
      res.status(403).json({
        message: 'API rate limit exceeded'
      });
    });
  }

  simulateNetworkError() {
    this.app.get('/repos/MonaFP/RawaLite/releases/latest', (req, res) => {
      req.destroy();
    });
  }

  simulateSlowDownload() {
    this.app.get('/download/setup.exe', (req, res) => {
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': '1000'
      });

      // Send data slowly
      const buffer = Buffer.alloc(100, 'slow-data');
      let sent = 0;
      
      const interval = setInterval(() => {
        if (sent < 1000) {
          res.write(buffer);
          sent += 100;
        } else {
          res.end();
          clearInterval(interval);
        }
      }, 100); // 100ms between chunks
    });
  }
}

export const setupMockGitHubApi = () => new MockGitHubApiServer();
```

### Test Data Factory
```typescript
// tests/helpers/test-data-factory.ts
export class TestDataFactory {
  static createMockRelease(overrides: Partial<Release> = {}): Release {
    return {
      version: 'v1.0.8',
      name: 'Test Release 1.0.8',
      body: 'Mock release for testing',
      publishedAt: new Date('2025-10-02T10:00:00Z'),
      assets: [
        {
          name: 'RawaLite-Setup-1.0.8.exe',
          downloadUrl: 'http://localhost:3333/download/setup.exe',
          size: 45678901
        },
        {
          name: 'latest.yml',
          downloadUrl: 'http://localhost:3333/download/latest.yml',
          size: 567
        }
      ],
      ...overrides
    };
  }

  static createMockGitHubApiResponse(overrides: any = {}): any {
    return {
      tag_name: 'v1.0.8',
      name: 'Test Release 1.0.8',
      body: 'Mock release for testing',
      published_at: '2025-10-02T10:00:00Z',
      assets: [
        {
          name: 'RawaLite-Setup-1.0.8.exe',
          browser_download_url: 'http://localhost:3333/download/setup.exe',
          size: 45678901
        }
      ],
      ...overrides
    };
  }

  static createMockErrorResponse(status: number, message: string): any {
    return {
      status,
      message,
      documentation_url: 'https://docs.github.com/rest'
    };
  }
}
```

---

## 📊 Test Execution & CI Integration

### NPM Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/services",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test e2e",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:update": "jest tests/services/GitHubApiService.test.ts tests/services/RateLimitManager.test.ts",
    "test:migration": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/main/services/GitHubApiService.ts',
    'src/main/services/RateLimitManager.ts',
    'src/main/services/UpdateManagerService.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### GitHub Actions Integration
```yaml
# .github/workflows/test-update-migration.yml
name: Update System Migration Tests

on:
  push:
    branches: [feature/github-api-migration]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Build application
      run: npm run build
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          coverage/
          test-results/
```

---

## 🎯 Test Execution Plan

### Pre-Migration Testing
1. **Baseline Tests:** Alle existierenden Tests grün
2. **CLI Dependency Check:** Verifikation der aktuellen CLI-Usage
3. **Performance Baseline:** Aktuelle Update-Performance messen

### During Migration Testing
1. **Phase 1:** Unit Tests für GitHubApiService
2. **Phase 2:** Integration Tests mit MockServer
3. **Phase 3:** UpdateManagerService Integration
4. **Phase 4:** E2E Testing + Regression Tests

### Post-Migration Validation
1. **Full Test Suite:** Alle Tests müssen grün sein
2. **Performance Validation:** Keine Verschlechterung
3. **Manual Testing:** UI/UX Validation
4. **Deployment Testing:** Production-like Environment

### Success Criteria
```typescript
const migrationSuccessCriteria = {
  unitTests: {
    coverage: '>= 95%',
    passed: '100%',
    executionTime: '< 30s'
  },
  integrationTests: {
    coverage: '>= 85%',
    passed: '100%',
    executionTime: '< 2min'
  },
  e2eTests: {
    passed: '100%',
    executionTime: '< 5min',
    noCliDependencies: true
  },
  performance: {
    updateCheckTime: '< 2s',
    downloadSpeed: '>= current',
    memoryUsage: '<= current',
    bundleSize: '<= current'
  },
  userExperience: {
    noAuthRequired: true,
    errorMessagesUserFriendly: true,
    uiUnchanged: true,
    installationSimplified: true
  }
};
```

---

## 📚 Referenzen

### Testing Tools
- [Jest](https://jestjs.io/) - Unit & Integration Testing
- [Playwright](https://playwright.dev/) - E2E Testing
- [MSW](https://mswjs.io/) - API Mocking
- [Testing Library](https://testing-library.com/) - React Component Testing

### GitHub API Testing
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Octokit Testing](https://github.com/octokit/octokit.js#testing)
- [HTTP Mocking Best Practices](https://kentcdodds.com/blog/stop-mocking-fetch)

### Interne Dokumentation
- [UPDATE_SYSTEM_ARCHITECTURE.md](../01-architecture/UPDATE_SYSTEM_ARCHITECTURE.md)
- [UPDATE_DEVELOPMENT.md](../02-development/UPDATE_DEVELOPMENT.md)
- [GITHUB_API_MIGRATION.md](../00-meta/GITHUB_API_MIGRATION.md)

---

**Erstellt:** 02. Oktober 2025  
**Status:** Ready for Implementation  
**Nächster Schritt:** Setup Test Environment + Mock GitHub API Server
