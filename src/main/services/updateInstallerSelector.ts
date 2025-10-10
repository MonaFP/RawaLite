/**
 * Update Installer Selector - v1.0.42 Emergency Minimal Implementation
 * 
 * Provides backward compatibility for v1.0.41 while maintaining type safety
 */

// Constants
export const LEGACY_INSTALLER_FALLBACK_SIZE = 85 * 1024 * 1024; // 85MB fallback

// Types
export type InstallerSelectionSource = 'github-api' | 'legacy-fallback' | 'manual';

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface NormalizedInstallerSelection {
  assetName: string;
  downloadUrl: string;
  fileSize: number;
  needsManualNotice?: boolean;
  source?: InstallerSelectionSource;
}

/**
 * Normalizes installer selection for backward compatibility
 */
export function normalizeInstallerSelection(
  assets: ReleaseAsset[] | any
): NormalizedInstallerSelection | null {
  // Handle legacy object format (v1.0.41 compatibility)
  if (assets && !Array.isArray(assets) && assets.assetName) {
    return {
      assetName: assets.assetName,
      downloadUrl: assets.downloadUrl,
      fileSize: assets.fileSize || 0,
      needsManualNotice: assets.needsManualNotice,
      source: 'legacy-fallback'
    };
  }

  // Handle new array format
  if (Array.isArray(assets) && assets.length > 0) {
    const asset = assets[0];
    return {
      assetName: asset.name,
      downloadUrl: asset.browser_download_url,
      fileSize: asset.size,
      needsManualNotice: false,
      source: 'github-api'
    };
  }

  return null;
}

// Legacy export for v1.0.41 compatibility
export default normalizeInstallerSelection;
