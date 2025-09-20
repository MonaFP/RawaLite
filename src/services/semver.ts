// src/services/semver.ts
/**
 * Simple semantic version comparison utilities
 */

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export function parseSemVer(version: string): SemVer {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),  
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

export function compareSemVer(a: string, b: string): number {
  const versionA = parseSemVer(a);
  const versionB = parseSemVer(b);
  
  // Compare major
  if (versionA.major !== versionB.major) {
    return versionA.major - versionB.major;
  }
  
  // Compare minor
  if (versionA.minor !== versionB.minor) {
    return versionA.minor - versionB.minor;
  }
  
  // Compare patch
  if (versionA.patch !== versionB.patch) {
    return versionA.patch - versionB.patch;
  }
  
  // Compare prerelease (if any)
  if (versionA.prerelease && !versionB.prerelease) {
    return -1; // prerelease < release
  }
  if (!versionA.prerelease && versionB.prerelease) {
    return 1; // release > prerelease
  }
  if (versionA.prerelease && versionB.prerelease) {
    return versionA.prerelease.localeCompare(versionB.prerelease);
  }
  
  return 0; // equal
}

export function isNewerVersion(latest: string, current: string): boolean {
  try {
    return compareSemVer(latest, current) > 0;
  } catch {
    return false;
  }
}

export function formatVersion(version: string): string {
  try {
    const semver = parseSemVer(version);
    return `${semver.major}.${semver.minor}.${semver.patch}${semver.prerelease ? '-' + semver.prerelease : ''}`;
  } catch {
    return version; // Return as-is if parsing fails
  }
}