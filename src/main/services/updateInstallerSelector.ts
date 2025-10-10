/**
 * Update Installer Selection Utilities
 * 
 * Provides standardized logic for selecting the correct installer
 * from GitHub releases, with support for legacy compatibility
 * 
 * @version 1.0.44
 * @author RawaLite Team
 * @since v1.0.41 Missing MZ header fix
 */

export const LEGACY_INSTALLER_FALLBACK_SIZE = 50 * 1024 * 1024; // 50MB minimum

export type InstallerSelectionSource = 'github_releases' | 'legacy_fallback' | 'manual_selection';

export interface AssetInfo {
  name: string;
  browser_download_url: string;
  size: number;
  content_type?: string;
  download_count?: number;
}

export interface InstallerSelection {
  asset: AssetInfo | null;
  source: InstallerSelectionSource;
  confidence: 'high' | 'medium' | 'low';
  fallbackReason?: string;
  
  // v1.0.41 Backward Compatibility Properties
  assetName?: string;
  downloadUrl?: string;
  fileSize?: number;
  needsManualNotice?: boolean;
}

/**
 * Normalizes installer selection from various sources
 * with priority-based fallback logic
 * 
 * @overload For direct asset array (new API)
 */
export function normalizeInstallerSelection(
  assets: AssetInfo[],
  version?: string
): InstallerSelection;

/**
 * @overload For legacy v1.0.41 compatibility (complex object)
 */
export function normalizeInstallerSelection(legacyInput: {
  release?: any;
  requested?: {
    downloadUrl?: string;
    assetName?: string;
    fileSize?: number;
  };
  fallbackVersion?: string;
}): InstallerSelection;

export function normalizeInstallerSelection(
  assetsOrLegacy: AssetInfo[] | any,
  version?: string
): InstallerSelection {
  // Handle legacy v1.0.41 compatibility format
  if (!Array.isArray(assetsOrLegacy)) {
    const legacy = assetsOrLegacy;
    const assets = legacy.release?.assets || [];
    const requested = legacy.requested || {};
    
    const result = normalizeInstallerSelectionCore(assets, legacy.fallbackVersion);
    
    // Add v1.0.41 compatibility properties
    return {
      ...result,
      assetName: requested.assetName || result.asset?.name,
      downloadUrl: requested.downloadUrl || result.asset?.browser_download_url,
      fileSize: requested.fileSize || result.asset?.size,
      needsManualNotice: result.confidence === 'low'
    };
  }
  
  // Handle new direct assets array format
  return normalizeInstallerSelectionCore(assetsOrLegacy, version);
}

/**
 * Core installer selection logic
 */
function normalizeInstallerSelectionCore(
  assets: AssetInfo[],
  version?: string
): InstallerSelection {
  if (!assets || assets.length === 0) {
    return {
      asset: null,
      source: 'legacy_fallback',
      confidence: 'low',
      fallbackReason: 'No assets available'
    };
  }

  // Priority 1: Look for Windows installer (.exe)
  const windowsInstaller = assets.find(asset => 
    asset.name?.toLowerCase().endsWith('.exe') &&
    (asset.name.toLowerCase().includes('setup') || 
     asset.name.toLowerCase().includes('install')) &&
    asset.size > LEGACY_INSTALLER_FALLBACK_SIZE
  );

  if (windowsInstaller) {
    return {
      asset: windowsInstaller,
      source: 'github_releases',
      confidence: 'high'
    };
  }

  // Priority 2: Any .exe file with reasonable size
  const anyExe = assets.find(asset =>
    asset.name?.toLowerCase().endsWith('.exe') &&
    asset.size > LEGACY_INSTALLER_FALLBACK_SIZE
  );

  if (anyExe) {
    return {
      asset: anyExe,
      source: 'github_releases',
      confidence: 'medium'
    };
  }

  // Priority 3: Fallback to first asset (legacy compatibility)
  const firstAsset = assets[0];
  if (firstAsset) {
    return {
      asset: firstAsset,
      source: 'legacy_fallback',
      confidence: 'low',
      fallbackReason: 'No suitable installer found, using first asset'
    };
  }

  return {
    asset: null,
    source: 'manual_selection',
    confidence: 'low',
    fallbackReason: 'No suitable assets available'
  };
}

/**
 * Generates a fallback download URL for legacy versions
 */
export function generateLegacyDownloadUrl(version: string): string {
  const cleanVersion = version.replace(/^v/, '');
  return `https://github.com/MonaFP/RawaLite/releases/download/v${cleanVersion}/RawaLite-Setup-${cleanVersion}.exe`;
}

/**
 * Validates if an asset looks like a valid installer
 */
export function validateInstallerAsset(asset: AssetInfo): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!asset.name?.toLowerCase().endsWith('.exe')) {
    issues.push('Not a Windows executable');
  }

  if (asset.size < LEGACY_INSTALLER_FALLBACK_SIZE) {
    issues.push(`File too small (${asset.size} bytes, expected > ${LEGACY_INSTALLER_FALLBACK_SIZE})`);
  }

  if (!asset.browser_download_url) {
    issues.push('No download URL available');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}