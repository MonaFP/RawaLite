/**
 * ReleaseHygieneValidator - Validates GitHub releases for update consistency
 * 
 * Purpose: Prevents v1.0.41-style issues by validating release assets,
 * checking download URLs, verifying executable integrity, and ensuring
 * proper release metadata before presenting updates to users.
 * 
 * Features:
 * - Asset availability and accessibility validation
 * - Executable file format verification (PE header, etc.)
 * - Redirect chain analysis and validation
 * - Release metadata consistency checks
 * - Size and checksum validation where available
 * 
 * Design: Static service for pre-update validation, configurable checks,
 * detailed error reporting for operator debugging.
 * 
 * @since v1.0.41 - Added to prevent future release hygiene issues
 */

import type { GitHubRelease, GitHubAsset } from '../../types/update.types';

// Local debug logging for ReleaseHygieneValidator
function debugLog(component: string, action: string, data?: any, error?: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${component}::${action}`;
  
  if (error) {
    console.error(`❌ ${logMessage}`, data || {}, error);
  } else {
    console.log(`🔍 ${logMessage}`, data || {});
  }
}

export interface ReleaseValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    assetsChecked: number;
    redirectsFollowed: number;
    executableValidated: boolean;
    sizeVerified: boolean;
  };
}

export interface ValidationConfig {
  maxRedirects: number;
  minFileSize: number; // Minimum expected installer size (bytes)
  maxFileSize: number; // Maximum expected installer size (bytes)
  requiredContentTypes: string[];
  validateExecutableHeader: boolean;
  timeoutMs: number;
}

/**
 * Static service for release hygiene validation
 */
export class ReleaseHygieneValidator {
  private static readonly DEFAULT_CONFIG: ValidationConfig = {
    maxRedirects: 5,
    minFileSize: 10 * 1024 * 1024, // 10MB minimum
    maxFileSize: 200 * 1024 * 1024, // 200MB maximum
    requiredContentTypes: ['application/octet-stream', 'application/x-msdownload', 'application/exe'],
    validateExecutableHeader: true,
    timeoutMs: 30000 // 30 seconds
  };

  /**
   * Validate a GitHub release for update suitability
   */
  static async validateRelease(
    release: GitHubRelease, 
    config: Partial<ValidationConfig> = {}
  ): Promise<ReleaseValidationResult> {
    const validationConfig = { ...this.DEFAULT_CONFIG, ...config };
    const result: ReleaseValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      metadata: {
        assetsChecked: 0,
        redirectsFollowed: 0,
        executableValidated: false,
        sizeVerified: false
      }
    };

    debugLog('ReleaseHygieneValidator', 'validation_started', {
      releaseTag: release.tag_name,
      assetsCount: release.assets.length
    });

    try {
      // 1. Basic release metadata validation
      await this.validateReleaseMetadata(release, result);

      // 2. Validate assets (installers)
      await this.validateAssets(release.assets, validationConfig, result);

      // 3. Check for potential redirect issues
      await this.validateDownloadAccessibility(release.assets, validationConfig, result);

      // 4. Validate executable files
      if (validationConfig.validateExecutableHeader) {
        await this.validateExecutableHeaders(release.assets, validationConfig, result);
      }

      // Final validation status
      result.valid = result.errors.length === 0;

    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    debugLog('ReleaseHygieneValidator', 'validation_completed', {
      releaseTag: release.tag_name,
      valid: result.valid,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length,
      metadata: result.metadata
    });

    return result;
  }

  /**
   * Validate basic release metadata
   */
  private static async validateReleaseMetadata(
    release: GitHubRelease, 
    result: ReleaseValidationResult
  ): Promise<void> {
    // Check for required fields
    if (!release.tag_name || !release.name) {
      result.errors.push('Release missing required metadata (tag_name or name)');
    }

    // Check if release is too old (potential security issue)
    const releaseDate = new Date(release.published_at);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    if (releaseDate < twoYearsAgo) {
      result.warnings.push('Release is older than 2 years - consider security implications');
    }

    // Check for prerelease warnings
    if (release.prerelease) {
      result.warnings.push('Release is marked as prerelease - may contain unstable features');
    }

    // Check for assets
    if (!release.assets || release.assets.length === 0) {
      result.errors.push('Release has no assets (no installer files)');
    }
  }

  /**
   * Validate release assets (installer files)
   */
  private static async validateAssets(
    assets: GitHubAsset[], 
    config: ValidationConfig, 
    result: ReleaseValidationResult
  ): Promise<void> {
    const installerAssets = assets.filter(asset => 
      asset.name.toLowerCase().includes('setup') || 
      asset.name.toLowerCase().includes('installer') ||
      asset.name.endsWith('.exe') ||
      asset.name.endsWith('.msi')
    );

    if (installerAssets.length === 0) {
      result.errors.push('No installer assets found in release');
      return;
    }

    result.metadata.assetsChecked = installerAssets.length;

    for (const asset of installerAssets) {
      // Validate file size
      if (asset.size < config.minFileSize) {
        result.errors.push(`Asset ${asset.name} is too small (${asset.size} bytes < ${config.minFileSize} bytes)`);
      }
      
      if (asset.size > config.maxFileSize) {
        result.warnings.push(`Asset ${asset.name} is unusually large (${asset.size} bytes > ${config.maxFileSize} bytes)`);
      } else {
        result.metadata.sizeVerified = true;
      }

      // Validate content type
      if (asset.content_type && !config.requiredContentTypes.includes(asset.content_type)) {
        result.warnings.push(`Asset ${asset.name} has unexpected content type: ${asset.content_type}`);
      }

      // Check for suspicious names
      if (asset.name.includes('debug') || asset.name.includes('test')) {
        result.warnings.push(`Asset ${asset.name} may be a debug/test build`);
      }
    }
  }

  /**
   * Test download accessibility and redirect handling
   */
  private static async validateDownloadAccessibility(
    assets: GitHubAsset[], 
    config: ValidationConfig, 
    result: ReleaseValidationResult
  ): Promise<void> {
    const installerAssets = assets.filter(asset => asset.name.endsWith('.exe'));
    
    for (const asset of installerAssets) {
      try {
        const response = await fetch(asset.browser_download_url, {
          method: 'HEAD', // Only get headers, not full file
          redirect: 'follow', // This is the key fix for v1.0.41
          signal: AbortSignal.timeout(config.timeoutMs)
        });

        // Count redirects by checking if final URL differs
        if (response.url !== asset.browser_download_url) {
          result.metadata.redirectsFollowed++;
          debugLog('ReleaseHygieneValidator', 'redirect_detected', {
            originalUrl: asset.browser_download_url,
            finalUrl: response.url,
            assetName: asset.name
          });
        }

        // Check response status
        if (!response.ok) {
          result.errors.push(`Asset ${asset.name} is not accessible (HTTP ${response.status})`);
          continue;
        }

        // Validate content type from actual response
        const actualContentType = response.headers.get('content-type');
        if (actualContentType && !actualContentType.includes('application/octet-stream') && 
            !actualContentType.includes('application/x-msdownload') &&
            !actualContentType.includes('text/html')) { // HTML indicates redirect issues
          result.warnings.push(`Asset ${asset.name} returns unexpected content type: ${actualContentType}`);
        }

        // Check for HTML response (indicates redirect loop or GitHub error page)
        if (actualContentType && actualContentType.includes('text/html')) {
          result.errors.push(`Asset ${asset.name} returns HTML instead of binary file - possible redirect issue`);
        }

        // Validate content length matches asset size
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) !== asset.size) {
          result.warnings.push(`Asset ${asset.name} content-length (${contentLength}) doesn't match reported size (${asset.size})`);
        }

      } catch (error) {
        result.errors.push(`Failed to validate accessibility for ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Validate executable file headers (PE format for Windows)
   */
  private static async validateExecutableHeaders(
    assets: GitHubAsset[], 
    config: ValidationConfig, 
    result: ReleaseValidationResult
  ): Promise<void> {
    const exeAssets = assets.filter(asset => asset.name.endsWith('.exe'));
    
    for (const asset of exeAssets) {
      try {
        // Download only first 1024 bytes to check PE header
        const response = await fetch(asset.browser_download_url, {
          headers: {
            'Range': 'bytes=0-1023'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(config.timeoutMs)
        });

        if (!response.ok) {
          result.warnings.push(`Cannot validate PE header for ${asset.name} (HTTP ${response.status})`);
          continue;
        }

        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // Check DOS header "MZ" signature
        if (bytes.length >= 2 && bytes[0] === 0x4D && bytes[1] === 0x5A) {
          result.metadata.executableValidated = true;
          debugLog('ReleaseHygieneValidator', 'pe_header_valid', {
            assetName: asset.name,
            headerBytes: `${bytes[0].toString(16)},${bytes[1].toString(16)}`
          });
        } else {
          result.errors.push(`Asset ${asset.name} does not have valid PE header (Missing MZ signature)`);
        }

      } catch (error) {
        result.warnings.push(`Cannot validate PE header for ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Quick validation for critical issues only
   */
  static async quickValidation(release: GitHubRelease): Promise<boolean> {
    const result = await this.validateRelease(release, {
      validateExecutableHeader: true,
      maxRedirects: 3,
      timeoutMs: 10000 // Faster timeout for quick check
    });

    return result.valid && result.errors.length === 0;
  }

  /**
   * Get validation summary for operator monitoring
   */
  static formatValidationSummary(result: ReleaseValidationResult): string {
    const status = result.valid ? '✅ VALID' : '❌ INVALID';
    const summary = [
      `Release Validation: ${status}`,
      `Assets Checked: ${result.metadata.assetsChecked}`,
      `Redirects: ${result.metadata.redirectsFollowed}`,
      `PE Headers: ${result.metadata.executableValidated ? 'Valid' : 'Not Checked'}`,
      ''
    ];

    if (result.errors.length > 0) {
      summary.push('🚨 ERRORS:');
      result.errors.forEach(error => summary.push(`  • ${error}`));
      summary.push('');
    }

    if (result.warnings.length > 0) {
      summary.push('⚠️ WARNINGS:');
      result.warnings.forEach(warning => summary.push(`  • ${warning}`));
    }

    return summary.join('\n');
  }
}