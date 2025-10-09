/**
 * MockProgressService - Simuliert realistische Download-Progress für UpdateManager Development
 * Ermöglicht UI/UX Testing ohne echte Downloads oder GitHub API calls
 */

import { EventEmitter } from 'events';
import type { DownloadProgress } from '../../types/update.types';

export class MockProgressService extends EventEmitter {
  private mockInterval: NodeJS.Timeout | null = null;
  private currentProgress: DownloadProgress | null = null;
  private isDownloading = false;

  /**
   * Simuliert einen realistischen Download mit echten Timing-Mustern
   */
  async startMockDownload(
    totalSizeMB: number = 50,
    avgSpeedMBps: number = 0.3,  // ✅ MUCH SLOWER: 0.3 MB/s instead of 0.8 MB/s (~3 minutes for 50MB)
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (this.isDownloading) {
      throw new Error('Mock download already in progress');
    }

    // ✅ CREATE PROMISE: Return only when download is actually complete
    return new Promise<void>((resolve, reject) => {
      this.isDownloading = true;
      const totalBytes = totalSizeMB * 1024 * 1024;
      let downloadedBytes = 0;
      const startTime = Date.now();

      // Realistische Speed-Variation (1.5x bis 0.5x der Durchschnittsgeschwindigkeit)
      const getRealisticSpeed = (elapsed: number): number => {
        const baseSpeed = avgSpeedMBps * 1024 * 1024; // MB/s zu Bytes/s
        const variation = 0.8 + Math.random() * 0.4; // 0.8x bis 1.2x
        
        // Langsamerer Start (erste 10% des Downloads)
        const progressRatio = downloadedBytes / totalBytes;
        const startupFactor = progressRatio < 0.1 ? 0.3 + (progressRatio * 7) : 1;
        
        return baseSpeed * variation * startupFactor;
      };

      const updateProgress = () => {
        if (!this.isDownloading) {
          resolve(); // ✅ RESOLVE: When download is stopped/cancelled
          return;
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const currentSpeed = getRealisticSpeed(elapsed);
        
        // ✅ MUCH SLOWER CHUNK SIZE: Very small chunks for much slower realistic progress
        const chunkSize = Math.floor(currentSpeed * 0.05 * (0.8 + Math.random() * 0.4)); // Reduced from 0.2 to 0.05 (10x slower)
        downloadedBytes = Math.min(downloadedBytes + chunkSize, totalBytes);
        
        const percentage = (downloadedBytes / totalBytes) * 100;
        const avgSpeed = elapsed > 0 ? downloadedBytes / elapsed : 0;
        const eta = avgSpeed > 0 && downloadedBytes < totalBytes 
          ? (totalBytes - downloadedBytes) / avgSpeed 
          : 0;

        this.currentProgress = {
          downloaded: downloadedBytes,
          total: totalBytes,
          percentage,
          speed: currentSpeed,
          eta
        };

        // Progress callback ausführen
        if (onProgress) {
          onProgress(this.currentProgress);
        }

        // EventEmitter für andere Components
        this.emit('download-progress', this.currentProgress);

        // ✅ DOWNLOAD COMPLETED: Resolve promise when 100% reached
        if (downloadedBytes >= totalBytes) {
          this.completeMockDownload();
          resolve(); // ✅ RESOLVE: Promise resolves only when download is 100% complete
        }
      };

      // Update alle 500ms (wie echter UpdateManager)
      this.mockInterval = setInterval(updateProgress, 500);
      
      console.log(`[MockProgressService] Starting mock download: ${totalSizeMB}MB at ~${avgSpeedMBps}MB/s`);
      
      // Initial progress update
      updateProgress();
    });
  }

  /**
   * Beendet den Mock-Download
   */
  private completeMockDownload(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    
    this.isDownloading = false;
    this.emit('download-completed');
    
    console.log('[MockProgressService] Mock download completed');
  }

  /**
   * Stoppt den aktuellen Mock-Download
   */
  stopMockDownload(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    
    this.isDownloading = false;
    this.currentProgress = null;
    this.emit('download-cancelled');
    
    console.log('[MockProgressService] Mock download stopped');
  }

  /**
   * Aktueller Progress für getCurrentProgress() API
   */
  getCurrentProgress(): DownloadProgress | null {
    return this.currentProgress;
  }

  /**
   * Download Status
   */
  isDownloadActive(): boolean {
    return this.isDownloading;
  }

  /**
   * Simuliert verschiedene Download-Szenarien
   */
  async simulateScenario(scenario: 'fast' | 'slow' | 'large' | 'unstable'): Promise<void> {
    const scenarios = {
      fast: { sizeMB: 25, speedMBps: 10 },    // Schneller Download
      slow: { sizeMB: 30, speedMBps: 0.5 },   // Langsame Verbindung
      large: { sizeMB: 150, speedMBps: 3 },   // Großes Update
      unstable: { sizeMB: 50, speedMBps: 1 }  // Instabile Verbindung
    };

    const config = scenarios[scenario];
    console.log(`[MockProgressService] Simulating ${scenario} download scenario`);
    
    await this.startMockDownload(config.sizeMB, config.speedMBps);
  }
}

// Singleton instance für Development
export const mockProgressService = new MockProgressService();