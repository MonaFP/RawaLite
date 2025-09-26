// src/services/semver.ts
// Semantic Version Comparison Utilities

/**
 * Compare two semantic version strings
 * @param {string} v1 - First version (e.g., "1.8.101")
 * @param {string} v2 - Second version (e.g., "1.8.100")
 * @returns {number} -1 if v1 < v2, 0 if v1 = v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  // Remove any 'v' prefix if present
  v1 = v1.replace(/^v/, '');
  v2 = v2.replace(/^v/, '');
  
  // Split into parts and convert to numbers
  const parts1 = v1.split('.').map((n: string) => parseInt(n, 10) || 0);
  const parts2 = v2.split('.').map((n: string) => parseInt(n, 10) || 0);
  
  // Pad shorter array with zeros
  const maxLength = Math.max(parts1.length, parts2.length);
  while (parts1.length < maxLength) parts1.push(0);
  while (parts2.length < maxLength) parts2.push(0);
  
  // Compare each part
  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i];
    const part2 = parts2[i];
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Check if newVersion is newer than currentVersion
 * @param {string} newVersion - New version to check
 * @param {string} currentVersion - Current version to compare against
 * @returns {boolean} True if newVersion > currentVersion
 */
export function isNewerVersion(newVersion: string, currentVersion: string): boolean {
  return compareVersions(newVersion, currentVersion) > 0;
}

/**
 * Check if version is valid semver format
 * @param {string} version - Version string to validate
 * @returns {boolean} True if valid semver format
 */
export function isValidVersion(version: string): boolean {
  // Basic semver pattern: major.minor.patch
  const pattern = /^v?\d+\.\d+\.\d+$/;
  return pattern.test(version);
}

/**
 * Parse version string into components
 * @param {string} version - Version string to parse
 * @returns {{major: number, minor: number, patch: number} | null} Parsed version or null
 */
export function parseVersion(version: string): {major: number, minor: number, patch: number} | null {
  if (!isValidVersion(version)) {
    return null;
  }
  
  const cleaned = version.replace(/^v/, '');
  const [major, minor, patch] = cleaned.split('.').map(n => parseInt(n, 10));
  
  return { major, minor, patch };
}

/**
 * Format version components into string
 * @param {{major: number, minor: number, patch: number}} components - Version components
 * @returns {string} Formatted version string
 */
export function formatVersion(components: {major?: number, minor?: number, patch?: number}): string {
  const { major = 0, minor = 0, patch = 0 } = components;
  return `${major}.${minor}.${patch}`;
}

/**
 * Get the latest version from an array of versions
 * @param {string[]} versions - Array of version strings
 * @returns {string | null} Latest version or null if array is empty
 */
export function getLatestVersion(versions: string[]): string | null {
  if (!versions || versions.length === 0) {
    return null;
  }
  
  return versions.reduce((latest, current) => {
    return isNewerVersion(current, latest) ? current : latest;
  });
}

/**
 * Sort versions in ascending order
 * @param {string[]} versions - Array of version strings
 * @returns {string[]} Sorted array of versions
 */
export function sortVersionsAscending(versions: string[]): string[] {
  return [...versions].sort(compareVersions);
}

/**
 * Sort versions in descending order
 * @param {string[]} versions - Array of version strings
 * @returns {string[]} Sorted array of versions
 */
export function sortVersionsDescending(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareVersions(b, a));
}