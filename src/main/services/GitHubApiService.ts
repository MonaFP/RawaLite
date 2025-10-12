/**
 * GitHub API Service für RawaLite Update System
 * 
 * HTTP-basierte GitHub API Integration als Ersatz für GitHubCliService.
 * Verwendet direkte GitHub REST API Calls ohne externe CLI-Dependencies.
 * 
 * @version 1.0.8
 * @author RawaLite Team
 * @since GitHub API Migration (Phase 1)
 */

import { EventEmitter } from 'events';
import { createWriteStream, promises as fs } from 'fs';
import { dirname } from 'path';
import { RateLimitManager } from './RateLimitManager';

/**
 * Debug Logger für Main Process
 */
function debugLog(component: string, action: string, data?: any, error?: string) {
  const timestamp = new Date().toISOString();
  const prefix = error ? '🚨' : '🔍';
  
  console.log(`${prefix} [${timestamp}] ${component}.${action}`);
  if (data) {
    console.log('📊 Data:', JSON.stringify(data, null, 2));
  }
  if (error) {
    console.error('❌ Error:', error);
  }
}

import type {
  GitHubRelease,
  GitHubAsset,
  DownloadProgress,
  UpdateCheckResult
} from '../../types/update.types';

/**
 * GitHub API Service - HTTP-basierte Alternative zu GitHubCliService
 */
export class GitHubApiService extends EventEmitter {
  private readonly baseUrl = 'https://api.github.com';
  private readonly repo = 'MonaFP/RawaLite';
  private readonly headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'RawaLite-UpdateChecker/1.0'
  };
  
  private rateLimitManager = new RateLimitManager();

  constructor() {
    super();
  }

  /**
   * Holt die neueste Release-Information
   * @param options - Backward compatibility parameter (ignored for v1.0.41 compatibility)
   */
  async getLatestRelease(options?: { channel?: 'stable' | 'beta' }): Promise<GitHubRelease> {
    const endpoint = `/repos/${this.repo}/releases/latest`;
    
    try {
      // Note: GitHub doesn't support beta channels directly, always return latest stable
      // This provides backward compatibility for v1.0.41 users with beta channel enabled
      const response = await this.makeRequest<any>(endpoint);
      return this.mapGitHubReleaseToInternal(response);
    } catch (error) {
      throw new Error(`Failed to fetch latest release: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Downloaded ein Asset mit Progress-Tracking
   */
  async downloadAsset(
    asset: GitHubAsset, 
    targetPath: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    try {
      // Ensure target directory exists
      await fs.mkdir(dirname(targetPath), { recursive: true });

      const response = await fetch(asset.browser_download_url, {
        headers: {
          'Accept': 'application/octet-stream',
          'User-Agent': 'RawaLite-UpdateChecker/1.0'
        },
        redirect: 'follow'  // ✅ CRITICAL: Follow GitHub 302 redirects to actual file
      });
      
      if (!response.ok) {
        const errorType = response.status === 404 ? 'E_NOT_FOUND' : 
                         response.status >= 500 ? 'E_SERVER_ERROR' : 'E_HTTP_ERROR';
        throw new Error(`${errorType}: HTTP ${response.status}: ${response.statusText}`);
      }

      // Enhanced content type validation for redirect/HTML detection
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('E_REDIRECT_HTML: Download returned HTML page instead of binary file');
      }
      if (contentType.includes('text/plain')) {
        throw new Error('E_REDIRECT_TEXT: Download returned text response instead of binary file');
      }
      if (!contentType.includes('application/octet-stream') && 
          !contentType.includes('application/x-msdownload') &&
          !contentType.includes('application/exe')) {
        console.warn(`Unexpected content-type: ${contentType}, proceeding with caution`);
      }

      const totalBytes = asset.size || parseInt(response.headers.get('content-length') || '0');
      let downloadedBytes = 0;
      const startTime = Date.now();
      let isFirstChunk = true;

      // Create write stream
      const writeStream = createWriteStream(targetPath);
      
      if (!response.body) {
        throw new Error('No response body for download');
      }

      // Track progress with ReadableStream
      const reader = response.body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          if (value) {
            // Critical: Check MZ header on first chunk to verify PE executable
            if (isFirstChunk) {
              if (value.length < 2) {
                throw new Error('E_INVALID_FILE: Download too small, missing PE header');
              }
              if (value[0] !== 0x4D || value[1] !== 0x5A) {
                // Log first few bytes for debugging
                const firstBytes = Array.from(value.slice(0, 16))
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join(' ');
                throw new Error(`E_NO_MZ: Not a PE executable. First bytes: ${firstBytes}`);
              }
              isFirstChunk = false;
            }
            
            writeStream.write(value);
            downloadedBytes += value.length;
            
            // Calculate progress metrics
            const elapsed = (Date.now() - startTime) / 1000;
            const percentage = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
            const speed = elapsed > 0 ? downloadedBytes / elapsed : 0;
            const eta = speed > 0 && totalBytes > downloadedBytes 
              ? (totalBytes - downloadedBytes) / speed 
              : 0;

            // Report progress
            if (onProgress) {
              onProgress({
                downloaded: downloadedBytes,
                total: totalBytes,
                percentage,
                speed,
                eta
              });
            }

            // Emit progress event
            this.emit('download-progress', {
              downloaded: downloadedBytes,
              total: totalBytes,
              percentage,
              speed,
              eta
            });
          }
        }

        // Final progress update
        if (onProgress) {
          onProgress({
            downloaded: totalBytes,
            total: totalBytes,
            percentage: 100,
            speed: 0,
            eta: 0
          });
        }

      } finally {
        reader.releaseLock();
        
        // Ensure WriteStream is properly closed with Promise-based completion
        await new Promise<void>((resolve, reject) => {
          writeStream.end((error?: Error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }

    } catch (error) {
      // Clean up partial download
      try {
        await fs.unlink(targetPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw new Error(`Failed to download ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prüft ob eine neue Version verfügbar ist
   */
  async checkForUpdate(currentVersion: string): Promise<UpdateCheckResult> {
    try {
      const latestRelease = await this.getLatestRelease();
      
      // Skip pre-releases for stable updates
      if (latestRelease.prerelease) {
        return { 
          hasUpdate: false,
          currentVersion,
          latestVersion: latestRelease.tag_name.replace(/^v/, ''),
          latestRelease
        };
      }

      // Extract version from tag (remove 'v' prefix if present)
      const latestVersion = latestRelease.tag_name.replace(/^v/, '');
      const currentClean = currentVersion.replace(/^v/, '');

      // Simple semantic version comparison
      const hasUpdate = this.compareVersions(currentClean, latestVersion) < 0;

      return {
        hasUpdate,
        currentVersion: currentClean,
        latestVersion,
        latestRelease: hasUpdate ? latestRelease : undefined
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // If no releases found, treat as "up to date"
      if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
        return { 
          hasUpdate: false,
          currentVersion,
          error: 'No releases found in repository'
        };
      }
      
      throw new Error(`Failed to check for updates: ${errorMessage}`);
    }
  }

  /**
   * Führt einen HTTP Request zur GitHub API aus
   */
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
      headers: {
        ...this.headers
      },
      redirect: 'follow'
    });

    // Handle GitHub rate limit headers
    this.handleRateLimitHeaders(response.headers);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(`GitHub API rate limit exceeded. Status: ${response.status}`);
      }
      if (response.status === 404) {
        throw new Error(`Not Found: ${endpoint}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Behandelt GitHub Rate Limit Headers
   */
  private handleRateLimitHeaders(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    
    if (remaining && parseInt(remaining) < 5) {
      console.warn(`GitHub API rate limit low: ${remaining} requests remaining`);
      
      if (reset) {
        const resetDate = new Date(parseInt(reset) * 1000);
        console.warn(`Rate limit resets at: ${resetDate.toISOString()}`);
      }
    }
  }

  /**
   * Mappt GitHub API Response zu internen Types
   */
  private mapGitHubReleaseToInternal(ghRelease: any): GitHubRelease {
    return {
      tag_name: ghRelease.tag_name,
      name: ghRelease.name,
      body: ghRelease.body,
      published_at: ghRelease.published_at,
      prerelease: ghRelease.prerelease,
      assets: ghRelease.assets.map((asset: any) => ({
        name: asset.name,
        browser_download_url: asset.browser_download_url,
        size: asset.size,
        content_type: asset.content_type,
        download_count: asset.download_count
      }))
    };
  }

  /**
   * Vergleicht zwei Semantic Versions
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    try {
      const parts1 = v1.split('.').map(n => parseInt(n, 10));
      const parts2 = v2.split('.').map(n => parseInt(n, 10));

      const maxLength = Math.max(parts1.length, parts2.length);

      for (let i = 0; i < maxLength; i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;

        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
      }

      return 0;
    } catch (error) {
      // Fallback to string comparison
      return v1.localeCompare(v2, undefined, { numeric: true });
    }
  }
}

/**
 * Singleton instance für globale Verwendung
 */
export const githubApiService = new GitHubApiService();