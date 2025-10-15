/**
 * Critical Fixes Pattern Validation Tests
 * 
 * Simple regression tests that verify critical fix patterns 
 * are present in source code.
 * 
 * @version 1.0.13
 * @author RawaLite Team
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('Critical Fix Pattern Validation', () => {
  
  test('CRITICAL: WriteStream Promise Pattern in GitHubApiService', () => {
    const sourceCode = readFileSync('src/main/services/GitHubApiService.ts', 'utf8');
    
    // REQUIRED: Promise-based WriteStream completion
    expect(sourceCode).toMatch(
      /await new Promise<void>\(\(resolve, reject\) => {\s*writeStream\.end\(\(error\?\: Error\) => {/
    );
    
    // FORBIDDEN: Synchronous writeStream.end()
    expect(sourceCode).not.toMatch(/writeStream\.end\(\);\s*$/m);
  });

  test('CRITICAL: File System Flush Delay in UpdateManagerService', () => {
    const sourceCode = readFileSync('src/main/services/UpdateManagerService.ts', 'utf8');
    
    // REQUIRED: 100ms delay before fs.stat in verifyDownload
    expect(sourceCode).toMatch(
      /await new Promise\(resolve => setTimeout\(resolve, 100\)\);[\s\S]*?const stats = await fs\.stat\(filePath\);/
    );
    
    // REQUIRED: Pattern should be in verifyDownload method
    expect(sourceCode).toMatch(/private async verifyDownload/);
  });

  test('CRITICAL: Single Event Handler in UpdateManagerService', () => {
    const sourceCode = readFileSync('src/main/services/UpdateManagerService.ts', 'utf8');
    
    // REQUIRED: Single close handler with timeout cleanup
    expect(sourceCode).toMatch(
      /process\.on\('close', \(code\) => {\s*clearTimeout\(timeout\);/
    );
    
    // Should have timeout management
    expect(sourceCode).toMatch(/const timeout = setTimeout/);
  });

  test('CRITICAL: Port Consistency in vite.config.mts', () => {
    const sourceCode = readFileSync('vite.config.mts', 'utf8');
    
    // REQUIRED: Port 5174
    expect(sourceCode).toMatch(/server:\s*{\s*port:\s*5174\s*}/);
  });

  test('CRITICAL: Port Consistency in main window loader', () => {
    // After IPC refactoring (Step 1), createWindow() was extracted to electron/windows/main-window.ts
    // Check both locations for port 5174
    const mainSource = readFileSync('electron/main.ts', 'utf8');
    const windowSource = readFileSync('electron/windows/main-window.ts', 'utf8');
    
    // REQUIRED: Port 5174 in either main.ts OR main-window.ts
    const hasPortInMain = /win\.loadURL\('http:\/\/localhost:5174'\)/.test(mainSource);
    const hasPortInWindow = /win\.loadURL\('http:\/\/localhost:5174'\)/.test(windowSource);
    
    expect(hasPortInMain || hasPortInWindow).toBe(true);
    
    // If in main-window.ts, verify it's properly exported (function name is 'createWindow')
    if (hasPortInWindow) {
      expect(windowSource).toMatch(/export\s+(async\s+)?function\s+createWindow/);
    }
  });
});