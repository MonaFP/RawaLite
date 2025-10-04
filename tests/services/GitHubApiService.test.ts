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

// Mock fetch global
global.fetch = vi.fn(); // ✅ Vitest vi.fn()

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

    it('should handle 404 not found', async () => { // ✅ test → it
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
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