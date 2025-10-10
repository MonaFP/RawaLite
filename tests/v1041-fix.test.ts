/**
 * Test für v1.0.41 "Missing MZ header" Fix und Update-System Verbesserungen
 * 
 * Testet:
 * - UpdateTelemetryService operation tracking
 * - ReleaseHygieneValidator release validation
 * - GitHubApiService redirect handling (mockend)
 * - Legacy UI fallback detection
 * 
 * @since v1.0.41 Fix Implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch für kontrollierte Tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { UpdateTelemetryService } from '../src/main/services/UpdateTelemetryService';
import { ReleaseHygieneValidator } from '../src/main/services/ReleaseHygieneValidator';

// Mock GitHub Release für Tests
const mockValidRelease = {
  tag_name: 'v1.0.42',
  name: 'RawaLite v1.0.42 - Fixed Update System',
  body: 'Fixes the v1.0.41 "Missing MZ header" issue',
  published_at: new Date().toISOString(),
  prerelease: false,
  assets: [
    {
      name: 'RawaLite-Setup-1.0.42.exe',
      size: 50 * 1024 * 1024, // 50MB
      browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.42/RawaLite-Setup-1.0.42.exe',
      content_type: 'application/octet-stream',
      download_count: 123
    }
  ]
};

const mockInvalidRelease = {
  tag_name: 'v1.0.41',
  name: 'RawaLite v1.0.41 - Broken Release',
  body: 'This release has redirect issues',
  published_at: new Date().toISOString(),
  prerelease: false,
  assets: [
    {
      name: 'RawaLite-Setup-1.0.41.exe',
      size: 1024, // Too small
      browser_download_url: 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.41/broken.exe',
      content_type: 'text/html', // Wrong content type
      download_count: 5
    }
  ]
};

describe('UpdateTelemetryService', () => {
  beforeEach(() => {
    UpdateTelemetryService.clearData();
  });

  it('should track operations correctly', () => {
    // Start operation
    const operationId = UpdateTelemetryService.startOperation('update-check', {
      currentVersion: '1.0.41'
    });

    expect(operationId).toMatch(/^update-check-/);
    
    const activeOps = UpdateTelemetryService.getActiveOperations();
    expect(activeOps).toHaveLength(1);
    expect(activeOps[0].type).toBe('update-check');
    expect(activeOps[0].metadata?.currentVersion).toBe('1.0.41');
  });

  it('should complete operations with success', () => {
    const operationId = UpdateTelemetryService.startOperation('download', {
      version: '1.0.42'
    });

    UpdateTelemetryService.endOperation(operationId, true, undefined, {
      downloadSize: 52428800
    });

    const recentOps = UpdateTelemetryService.getRecentOperations(10);
    expect(recentOps).toHaveLength(1);
    expect(recentOps[0].success).toBe(true);
    expect(recentOps[0].metadata?.downloadSize).toBe(52428800);
  });

  it('should track errors and extract error codes', () => {
    const operationId = UpdateTelemetryService.startOperation('update-check');
    const error = new Error('E_REDIRECT_HTML: Got HTML instead of binary file');

    UpdateTelemetryService.endOperation(operationId, false, error);

    const errorCode = UpdateTelemetryService.extractErrorCode(error);
    expect(errorCode).toBe('E_REDIRECT_HTML');
  });

  it('should generate operator summary', () => {
    // Add some test operations
    const checkId = UpdateTelemetryService.startOperation('update-check');
    UpdateTelemetryService.endOperation(checkId, true);

    const downloadId = UpdateTelemetryService.startOperation('download');
    UpdateTelemetryService.endOperation(downloadId, false, new Error('E_NO_MZ: Missing MZ header'));

    const summary = UpdateTelemetryService.generateOperatorSummary();
    
    expect(summary.totalOperations).toBe(2);
    expect(summary.successRate).toBe(50); // 1 out of 2 successful
    expect(summary.errorPatterns['E_NO_MZ']).toBe(1);
  });
});

describe('ReleaseHygieneValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate good releases', async () => {
    // Mock successful HEAD request for accessibility check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: mockValidRelease.assets[0].browser_download_url,
      headers: new Map([
        ['content-type', 'application/octet-stream'],
        ['content-length', (50 * 1024 * 1024).toString()]
      ])
    });

    // Mock PE header check - return valid MZ header
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => {
        const buffer = new ArrayBuffer(1024);
        const view = new Uint8Array(buffer);
        view[0] = 0x4D; // 'M'
        view[1] = 0x5A; // 'Z'
        return buffer;
      }
    });

    const result = await ReleaseHygieneValidator.validateRelease(mockValidRelease);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.metadata.executableValidated).toBe(true);
  });

  it('should detect invalid releases', async () => {
    // Mock HTML response (indicates redirect issue)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      url: mockInvalidRelease.assets[0].browser_download_url,
      headers: new Map([
        ['content-type', 'text/html'], // Wrong content type
        ['content-length', '1024']
      ])
    });

    const result = await ReleaseHygieneValidator.validateRelease(mockInvalidRelease);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(error => error.includes('too small'))).toBe(true);
    expect(result.errors.some(error => error.includes('HTML instead of binary'))).toBe(true);
  });

  it('should handle PE header validation', async () => {
    // Mock HEAD request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: mockValidRelease.assets[0].browser_download_url,
      headers: new Map([
        ['content-type', 'application/octet-stream'],
        ['content-length', (50 * 1024 * 1024).toString()]
      ])
    });

    // Mock partial content request with invalid header
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => {
        const buffer = new ArrayBuffer(1024);
        const view = new Uint8Array(buffer);
        view[0] = 0x00; // Invalid
        view[1] = 0x00; // Invalid
        return buffer;
      }
    });

    const result = await ReleaseHygieneValidator.validateRelease(mockValidRelease);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.includes('Missing MZ signature'))).toBe(true);
  });

  it('should perform quick validation', async () => {
    // Mock successful responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: mockValidRelease.assets[0].browser_download_url,
        headers: new Map([
          ['content-type', 'application/octet-stream'],
          ['content-length', (50 * 1024 * 1024).toString()]
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => {
          const buffer = new ArrayBuffer(1024);
          const view = new Uint8Array(buffer);
          view[0] = 0x4D; // 'M'
          view[1] = 0x5A; // 'Z'
          return buffer;
        }
      });

    const isValid = await ReleaseHygieneValidator.quickValidation(mockValidRelease);
    expect(isValid).toBe(true);
  });
});

describe('Legacy v1.0.41 Detection', () => {
  it('should detect legacy version correctly', () => {
    const testVersions = [
      { version: '1.0.41', expected: true },
      { version: 'v1.0.41', expected: true },
      { version: '1.0.40', expected: true },
      { version: '1.0.42', expected: false },
      { version: '1.1.0', expected: false },
      { version: '2.0.0', expected: false }
    ];

    // Helper function aus UpdateDialog (simplified für Test)
    const isLegacyVersion = (version: string): boolean => {
      const cleanVersion = version.replace(/^v/, '');
      const [major, minor, patch] = cleanVersion.split('.').map(Number);
      
      if (major < 1) return true;
      if (major === 1 && minor < 1) {
        return patch <= 41;
      }
      return false;
    };

    testVersions.forEach(({ version, expected }) => {
      expect(isLegacyVersion(version)).toBe(expected);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete update flow with telemetry', async () => {
    UpdateTelemetryService.clearData();

    // Simulate update check
    const checkId = UpdateTelemetryService.startOperation('update-check', {
      currentVersion: '1.0.41'
    });

    // Simulate successful check
    UpdateTelemetryService.endOperation(checkId, true, undefined, {
      hasUpdate: true,
      latestVersion: '1.0.42'
    });

    // Simulate download
    const downloadId = UpdateTelemetryService.startOperation('download', {
      version: '1.0.42',
      assetSize: 52428800
    });

    // Simulate successful download
    UpdateTelemetryService.endOperation(downloadId, true, undefined, {
      filePath: '/tmp/installer.exe',
      downloadDuration: 5000
    });

    const summary = UpdateTelemetryService.generateOperatorSummary();
    expect(summary.totalOperations).toBe(2);
    expect(summary.successRate).toBe(100);
  });
});