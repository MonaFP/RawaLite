/**
 * GitHubApiService Tests
 * 
 * Unit Tests für HTTP-basierte GitHub API Integration
 * 
 * @version 1.0.8
 * @author RawaLite Team
 * @since GitHub API Migration (Phase 3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; // ✅ afterEach hinzugefügt
import { GitHubApiService } from '../../src/main/services/GitHubApiService';
import { RateLimitManager } from '../../src/main/services/RateLimitManager';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';

// Mock fetch global
global.fetch = vi.fn(); // ✅ Vitest vi.fn()

// Mock fs modules
vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(void 0),
    readFile: vi.fn().mockResolvedValue(Buffer.alloc(0)),
    unlink: vi.fn().mockResolvedValue(void 0),
    mkdir: vi.fn().mockResolvedValue(void 0),
    stat: vi.fn().mockResolvedValue({ size: 1000 })
  },
  writeFile: vi.fn().mockResolvedValue(void 0),
  readFile: vi.fn().mockResolvedValue(Buffer.alloc(0)),
  unlink: vi.fn().mockResolvedValue(void 0),
  mkdir: vi.fn().mockResolvedValue(void 0),
  stat: vi.fn().mockResolvedValue({ size: 1000 })
}));
vi.mock('fs', () => ({
  createWriteStream: vi.fn(() => ({
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn()
  })),
  promises: {
    writeFile: vi.fn().mockResolvedValue(void 0),
    readFile: vi.fn().mockResolvedValue(Buffer.alloc(0)),
    unlink: vi.fn().mockResolvedValue(void 0),
    mkdir: vi.fn().mockResolvedValue(void 0),
    stat: vi.fn().mockResolvedValue({ size: 1000 })
  }
}));

const mockFs = vi.mocked(fs);
const mockCreateWriteStream = vi.mocked(createWriteStream);

describe('GitHubApiService', () => {
  let service: GitHubApiService;
  let mockFetch: ReturnType<typeof vi.fn>; // ✅ Vitest typing

  beforeEach(() => {
    service = new GitHubApiService();
    mockFetch = fetch as ReturnType<typeof vi.fn>; // ✅ Vitest typing
    mockFetch.mockClear();
  });

  describe('getLatestRelease', () => {
    it('should successfully fetch latest release', async () => { // ✅ test → it
      // Arrange
      const mockRelease = {
        tag_name: 'v1.0.8',
        name: 'Release 1.0.8',
        body: 'Bug fixes and improvements',
        published_at: '2025-10-02T10:00:00Z',
        prerelease: false,
        assets: [
          {
            name: 'RawaLite-Setup-1.0.8.exe',
            browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.8/RawaLite-Setup-1.0.8.exe',
            size: 45678901,
            content_type: 'application/octet-stream',
            download_count: 100
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
      expect(result.tag_name).toBe('v1.0.8');
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

    it('should handle 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers()
      } as Response);

      await expect(service.getLatestRelease()).rejects.toThrow('Not Found');
    });

    it('should handle rate limit (403)', async () => { // ✅ test → it
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

    it('should handle network errors', async () => { // ✅ test → it
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(service.getLatestRelease()).rejects.toThrow('Failed to fetch latest release: Network timeout');
    });
  });

  describe('checkForUpdate', () => {
    it('should detect available updates', async () => { // ✅ test → it
      const mockRelease = {
        tag_name: 'v1.0.8',
        name: 'Release 1.0.8',
        body: 'Bug fixes',
        published_at: '2025-10-02T10:00:00Z',
        prerelease: false,
        assets: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
        headers: new Headers()
      } as Response);

      const result = await service.checkForUpdate('1.0.7');

      expect(result.hasUpdate).toBe(true);
      expect(result.currentVersion).toBe('1.0.7');
      expect(result.latestVersion).toBe('1.0.8');
    });

    it('should not detect updates when current', async () => { // ✅ test → it
      const mockRelease = {
        tag_name: 'v1.0.7',
        name: 'Release 1.0.7',
        body: 'Current version',
        published_at: '2025-10-02T10:00:00Z',
        prerelease: false,
        assets: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
        headers: new Headers()
      } as Response);

      const result = await service.checkForUpdate('1.0.7');

      expect(result.hasUpdate).toBe(false);
    });
  });
});

describe('RateLimitManager', () => {
  let manager: RateLimitManager;

  beforeEach(() => {
    manager = new RateLimitManager();
    vi.useFakeTimers(); // ✅ jest → vi
  });

  afterEach(() => { // ✅ Import hinzugefügt oben
    vi.useRealTimers(); // ✅ jest → vi
  });

  it('should allow requests within limit', () => { // ✅ test → it
    // Make 59 requests (under limit of 60)
    for (let i = 0; i < 59; i++) {
      expect(manager.canMakeRequest()).toBe(true);
      manager.trackRequest();
    }

    expect(manager.getRemainingRequests()).toBe(1);
  });

  it('should block requests when limit exceeded', () => { // ✅ test → it
    // Fill up the rate limit
    for (let i = 0; i < 60; i++) {
      manager.trackRequest();
    }

    expect(manager.canMakeRequest()).toBe(false);
    expect(() => manager.trackRequest()).toThrow('Rate limit exceeded');
  });

  it('should reset after time window', () => { // ✅ test → it
    // Fill up rate limit
    for (let i = 0; i < 60; i++) {
      manager.trackRequest();
    }

    expect(manager.canMakeRequest()).toBe(false);

    // Advance time by 1 hour
    vi.advanceTimersByTime(3600000); // ✅ jest → vi

    expect(manager.canMakeRequest()).toBe(true);
    expect(manager.getRemainingRequests()).toBe(60);
  });
});

describe('Robust Download with Redirect Support', () => {
  let service: GitHubApiService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new GitHubApiService();
    mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockClear();
    mockFs.mkdir.mockResolvedValue(undefined);
    
    // Mock WriteStream
    const mockWriteStream = {
      write: vi.fn(),
      end: vi.fn((callback) => callback && callback()),
      on: vi.fn()
    };
    mockCreateWriteStream.mockReturnValue(mockWriteStream as any);
  });

  it('should follow 302 redirects correctly', async () => {
    const mockAsset = {
      name: 'test.exe',
      browser_download_url: 'https://github.com/test/releases/download/v1.0.0/test.exe',
      size: 1000,
      content_type: 'application/octet-stream',
      download_count: 0
    };

    // Mock PE executable bytes (MZ header)
    const peBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, ...Array(996).fill(0x00)]);
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ['content-type', 'application/octet-stream'],
        ['content-length', '1000']
      ]),
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: peBytes })
            .mockResolvedValueOnce({ done: true }),
          releaseLock: vi.fn()
        })
      }
    } as any);

    // Verify fetch is called with redirect: 'follow'
    await service.downloadAsset(mockAsset, '/tmp/test.exe');
    
    expect(mockFetch).toHaveBeenCalledWith(
      'https://github.com/test/releases/download/v1.0.0/test.exe',
      expect.objectContaining({
        redirect: 'follow'
      })
    );
  });

  it('should reject HTML redirect pages with E_REDIRECT_HTML', async () => {
    const mockAsset = {
      name: 'test.exe',
      browser_download_url: 'https://github.com/test/releases/download/v1.0.0/test.exe',
      size: 1000,
      content_type: 'application/octet-stream',
      download_count: 0
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ['content-type', 'text/html'],
        ['content-length', '500']
      ]),
      body: null
    } as any);

    await expect(service.downloadAsset(mockAsset, '/tmp/test.exe'))
      .rejects.toThrow('E_REDIRECT_HTML: Download returned HTML page instead of binary file');
  });

  it('should reject files without MZ header with E_NO_MZ', async () => {
    const mockAsset = {
      name: 'test.exe',
      browser_download_url: 'https://github.com/test/releases/download/v1.0.0/test.exe',
      size: 1000,
      content_type: 'application/octet-stream',
      download_count: 0
    };

    // Mock HTML content (no MZ header)
    const htmlBytes = new Uint8Array([0x3C, 0x68, 0x74, 0x6D, 0x6C, ...Array(995).fill(0x00)]); // <html...
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ['content-type', 'application/octet-stream'],
        ['content-length', '1000']
      ]),
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: htmlBytes })
            .mockResolvedValueOnce({ done: true }),
          releaseLock: vi.fn()
        })
      }
    } as any);

    await expect(service.downloadAsset(mockAsset, '/tmp/test.exe'))
      .rejects.toThrow('E_NO_MZ: Not a PE executable. First bytes: 3c 68 74 6d 6c 00 00 00 00 00 00 00 00 00 00 00');
  });
});