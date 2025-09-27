// ============================================================
// FILE: src/hooks/useVersion.ts
// ============================================================
// 🆕 UNIFIED VERSION HOOK - Single source of truth for all version queries
// Eliminates version drift between app.getVersion() (Electron version) and package.json (App version)

import { useState, useEffect, useCallback } from 'react';

/**
 * Version information from unified source (package.json)
 */
export interface VersionInfo {
  /** Application version from package.json */
  app: string;
  /** Electron framework version */
  electron: string;
  /** Chrome/Chromium version */
  chrome: string;
}

/**
 * Hook state for version management
 */
interface UseVersionState {
  /** Current version information */
  version: VersionInfo | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Manual refresh function */
  refresh: () => Promise<void>;
  /** Convenience getter for app version */
  appVersion: string | null;
}

/**
 * Unified Version Hook
 * 
 * Provides single source of truth for version information.
 * Eliminates drift between multiple version sources.
 * 
 * @returns Version state and control functions
 */
export function useVersion(): UseVersionState {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch version information from unified IPC handler
   */
  const fetchVersion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Electron APIs are available
      if (!window.rawalite?.version) {
        throw new Error('Version API not available - running outside Electron?');
      }

      // Get version data from unified source
      const versionData = await window.rawalite.version.get();
      
      // Ensure all required properties are present
      if (versionData.ok && versionData.app && versionData.electron && versionData.chrome) {
        setVersion({
          app: versionData.app,
          electron: versionData.electron,
          chrome: versionData.chrome
        });
      } else {
        throw new Error('Incomplete version data received from API');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch version information';
      console.error('[useVersion] Version fetch failed:', err);
      setError(errorMessage);
      setVersion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manual refresh function for consumers
   */
  const refresh = useCallback(async () => {
    await fetchVersion();
  }, [fetchVersion]);

  // Initial version fetch on mount
  useEffect(() => {
    fetchVersion();
  }, [fetchVersion]);

  return {
    version,
    loading,
    error,
    refresh,
    appVersion: version?.app || null,
  };
}

/**
 * Convenience hook to get just the app version string with intelligent fallback
 * @returns App version string or fallback version
 */
export function useAppVersion(): string | null {
  const { appVersion, loading, error } = useVersion();
  
  // ✨ CRITICAL FIX: Robust version fallback system
  if (loading) {
    return null; // Still loading
  }
  
  if (appVersion) {
    return appVersion; // IPC worked
  }
  
  // IPC failed - use intelligent fallbacks
  console.warn('[useAppVersion] IPC version failed, checking fallbacks:', { error });
  
  // Try to get version from build-time injection (if available)
  if (typeof import.meta.env?.PACKAGE_VERSION === 'string') {
    console.info('[useAppVersion] Using build-time version:', import.meta.env.PACKAGE_VERSION);
    return import.meta.env.PACKAGE_VERSION;
  }
  
  // Final fallback: hardcoded version (better than v1.0.0)
  console.warn('[useAppVersion] Using hardcoded fallback version');
  return '1.8.117';
}

/**
 * Convenience hook to check if version system is ready
 * @returns True if version data is loaded and available
 */
export function useVersionReady(): boolean {
  const { version, loading, error } = useVersion();
  return !loading && !error && !!version;
}