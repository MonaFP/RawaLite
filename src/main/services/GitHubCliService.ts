/**
 * GitHub CLI Service für RawaLite Update System
 * 
 * Nutzt GitHub CLI für authentifizierte API-Calls und vermeidet Rate-Limits.
 * Handles Release-Detection, Asset-Downloads und Repository-Informationen.
 */

import { spawn, SpawnOptions } from 'child_process';
import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  assets: GitHubAsset[];
}

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
  download_count: number;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
}

export interface GitHubCliError extends Error {
  code?: string;
  stderr?: string;
  exitCode?: number;
}

/**
 * GitHub CLI Service für Update-Operationen
 * 
 * Verwendet gh CLI für Rate-Limit-freie API-Calls und sichere Downloads.
 */
export class GitHubCliService {
  private readonly owner = 'MonaFP';
  private readonly repo = 'RawaLite';
  private readonly timeout = 30000; // 30 seconds

  /**
   * Prüft ob GitHub CLI verfügbar und authentifiziert ist
   */
  async checkAvailability(): Promise<{ available: boolean; authenticated: boolean; error?: string }> {
    try {
      // Check if gh command exists
      await this.executeCommand(['--version']);
      
      // Check authentication
      await this.executeCommand(['auth', 'status']);
      
      return { available: true, authenticated: true };
    } catch (error) {
      const githubError = error as GitHubCliError;
      
      if (githubError.stderr?.includes('not found') || githubError.code === 'ENOENT') {
        return { 
          available: false, 
          authenticated: false, 
          error: 'GitHub CLI not installed' 
        };
      }
      
      if (githubError.stderr?.includes('not logged into')) {
        return { 
          available: true, 
          authenticated: false, 
          error: 'GitHub CLI not authenticated' 
        };
      }
      
      return { 
        available: false, 
        authenticated: false, 
        error: `GitHub CLI error: ${githubError.message}` 
      };
    }
  }

  /**
   * Holt die neueste Release-Information
   */
  async getLatestRelease(): Promise<GitHubRelease> {
    try {
      const query = `{
        tag_name: .tag_name,
        name: .name,
        body: .body,
        published_at: .published_at,
        prerelease: .prerelease,
        assets: [.assets[] | {
          name: .name,
          browser_download_url: .browser_download_url,
          size: .size,
          content_type: .content_type,
          download_count: .download_count
        }]
      }`;

      const result = await this.executeCommand([
        'api',
        `repos/${this.owner}/${this.repo}/releases/latest`,
        '--jq', query
      ]);

      return JSON.parse(result);
    } catch (error) {
      const githubError = error as GitHubCliError;
      
      if (githubError.stderr?.includes('Not Found')) {
        throw new Error('No releases found in repository');
      }
      
      throw new Error(`Failed to fetch latest release: ${githubError.message}`);
    }
  }

  /**
   * Holt alle Releases (für Fallback oder Versionsliste)
   */
  async getAllReleases(limit: number = 10): Promise<GitHubRelease[]> {
    try {
      const query = `[.[] | {
        tag_name: .tag_name,
        name: .name,
        body: .body,
        published_at: .published_at,
        prerelease: .prerelease,
        assets: [.assets[] | {
          name: .name,
          browser_download_url: .browser_download_url,
          size: .size,
          content_type: .content_type,
          download_count: .download_count
        }]
      }] | .[0:${limit}]`;

      const result = await this.executeCommand([
        'api',
        `repos/${this.owner}/${this.repo}/releases`,
        '--jq', query
      ]);

      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Failed to fetch releases: ${(error as Error).message}`);
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
      await fs.mkdir(join(targetPath, '..'), { recursive: true });

      // Use native fetch for better progress tracking instead of gh CLI
      const response = await fetch(asset.browser_download_url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const totalBytes = asset.size || parseInt(response.headers.get('content-length') || '0');
      let downloadedBytes = 0;
      const startTime = Date.now();

      // Create write stream
      const writeStream = createWriteStream(targetPath);
      
      if (!response.body) {
        throw new Error('No response body for download');
      }

      // Track progress with TransformStream
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        if (value) {
          chunks.push(value);
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
        }
      }

      // Write all chunks to file
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(targetPath, buffer);

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

    } catch (error) {
      // Clean up partial download
      try {
        await fs.unlink(targetPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw new Error(`Failed to download ${asset.name}: ${(error as Error).message}`);
    }
  }

  /**
   * Prüft ob eine neue Version verfügbar ist
   */
  async checkForUpdate(currentVersion: string): Promise<{ hasUpdate: boolean; latestRelease?: GitHubRelease }> {
    try {
      const latestRelease = await this.getLatestRelease();
      
      // Skip pre-releases for stable updates
      if (latestRelease.prerelease) {
        return { hasUpdate: false };
      }

      // Extract version from tag (remove 'v' prefix if present)
      const latestVersion = latestRelease.tag_name.replace(/^v/, '');
      const currentClean = currentVersion.replace(/^v/, '');

      // Simple semantic version comparison
      const hasUpdate = this.compareVersions(currentClean, latestVersion) < 0;

      return {
        hasUpdate,
        latestRelease: hasUpdate ? latestRelease : undefined
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // If no releases found, treat as "up to date"
      if (errorMessage.includes('No releases found')) {
        return { hasUpdate: false };
      }
      
      throw new Error(`Failed to check for updates: ${errorMessage}`);
    }
  }

  /**
   * Führt einen GitHub CLI Befehl aus
   */
  private async executeCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: SpawnOptions = {
        timeout: this.timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      };

      const process = spawn('gh', args, options);
      
      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          const error = new Error(`GitHub CLI command failed: ${stderr || stdout}`) as GitHubCliError;
          error.exitCode = code || -1;
          error.stderr = stderr;
          reject(error);
        }
      });

      process.on('error', (error) => {
        const githubError = error as GitHubCliError;
        githubError.code = (error as any).code;
        reject(githubError);
      });
    });
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
 * Singleton instance for global access
 */
export const githubCliService = new GitHubCliService();