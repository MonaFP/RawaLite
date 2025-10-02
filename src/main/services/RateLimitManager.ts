/**
 * Rate Limit Manager für GitHub API
 * 
 * Verwaltet GitHub API Rate Limits für öffentliche Repositories.
 * Implementiert client-seitige Rate Limit Überwachung und Prevention.
 * 
 * @version 1.0.8
 * @author RawaLite Team
 * @since GitHub API Migration (Phase 1)
 */

/**
 * Rate Limiting Manager für GitHub API
 * 
 * GitHub API Limits für öffentliche Repositories:
 * - 60 Requests pro Stunde für nicht-authentifizierte Requests
 * - Rate Limit Reset erfolgt am Anfang jeder Stunde
 */
export class RateLimitManager {
  private requests: Date[] = [];
  private readonly maxRequests = 60; // GitHub public API limit
  private readonly timeWindow = 3600000; // 1 hour in milliseconds

  /**
   * Prüft ob ein Request gemacht werden kann ohne Rate Limit zu überschreiten
   */
  canMakeRequest(): boolean {
    this.cleanupOldRequests();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Registriert einen neuen Request und prüft Rate Limit
   * @throws Error wenn Rate Limit überschritten wird
   */
  trackRequest(): void {
    if (!this.canMakeRequest()) {
      const resetTime = this.getResetTime();
      throw new Error(`Rate limit exceeded. ${this.getRemainingRequests()} requests remaining. Reset at: ${resetTime.toISOString()}`);
    }
    
    this.requests.push(new Date());
  }

  /**
   * Gibt die Anzahl verbleibender Requests zurück
   */
  getRemainingRequests(): number {
    this.cleanupOldRequests();
    return this.maxRequests - this.requests.length;
  }

  /**
   * Gibt den Zeitpunkt zurück, wann das Rate Limit zurückgesetzt wird
   */
  getResetTime(): Date {
    if (this.requests.length === 0) {
      return new Date();
    }
    
    const oldestRequest = this.requests[0];
    return new Date(oldestRequest.getTime() + this.timeWindow);
  }

  /**
   * Gibt den aktuellen Rate Limit Status zurück
   */
  getStatus(): {
    remaining: number;
    limit: number;
    resetTime: Date;
    canRequest: boolean;
    timeToReset: number; // milliseconds
  } {
    this.cleanupOldRequests();
    const resetTime = this.getResetTime();
    
    return {
      remaining: this.getRemainingRequests(),
      limit: this.maxRequests,
      resetTime,
      canRequest: this.canMakeRequest(),
      timeToReset: Math.max(0, resetTime.getTime() - Date.now())
    };
  }

  /**
   * Wartet bis ein Request gemacht werden kann (rate limit compliant)
   * @param maxWaitTime Maximum wait time in milliseconds (default: 1 hour)
   */
  async waitForAvailableSlot(maxWaitTime: number = 3600000): Promise<void> {
    const status = this.getStatus();
    
    if (status.canRequest) {
      return; // Can make request immediately
    }

    const waitTime = Math.min(status.timeToReset, maxWaitTime);
    
    if (waitTime > maxWaitTime) {
      throw new Error(`Rate limit exceeded and wait time (${waitTime}ms) exceeds maximum (${maxWaitTime}ms)`);
    }

    console.warn(`Rate limit reached. Waiting ${Math.round(waitTime / 1000)}s for reset...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.cleanupOldRequests();
        resolve();
      }, waitTime + 1000); // Add 1 second buffer
    });
  }

  /**
   * Entfernt alte Requests außerhalb des Time Window
   */
  private cleanupOldRequests(): void {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.timeWindow);
    
    this.requests = this.requests.filter(request => request > cutoff);
  }

  /**
   * Reset der Rate Limit Tracking (für Tests)
   */
  reset(): void {
    this.requests = [];
  }
}