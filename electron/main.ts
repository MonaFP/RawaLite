// electron/main.ts - 🚀 Custom In-App Updater
import { app, BrowserWindow, shell, ipcMain, Menu, dialog } from "electron";
import log from "electron-log";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import https from "node:https";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import pkg from "../package.json" assert { type: "json" };

// TypeScript-Erweiterung für globale Variablen
declare global {
  var __rawaliteUpdateInProgress: boolean;
}

// --- Debug/Telemetry helpers (nur Node-Core) ---
// Debug-Environment-Variables entfernt - Interactive Installer ist viel einfacher
function safeMkdirp(p: string) { try { fs.mkdirSync(p, { recursive: true }); } catch {} }
function safeWriteFile(p: string, data: string) { try { fs.writeFileSync(p, data); } catch {} }
function safeReadJson<T=any>(p: string): T | null { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; } }
function safeUnlink(p: string) { try { fs.unlinkSync(p); } catch {} }

// Mark helper functions as used to avoid TypeScript warnings
// These are utility functions that may be needed for debugging/telemetry
void safeMkdirp; void safeWriteFile; void safeReadJson; void safeUnlink;

// 🚀 CUSTOM IN-APP UPDATER SYSTEM
import {
  PDFPostProcessor,
  PDFAConversionOptions,
} from "../src/services/PDFPostProcessor";
import { initializeBackupSystem } from "./backup";
import { initializeLogoSystem } from "./logo";

// Import update system types
import type { UpdateManifest, UpdateProgress } from "../src/types/updater";

// === SINGLE INSTANCE LOCK ===
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this instance
  log.info("Another instance is already running, quitting...");
  app.quit();
} else {
  // Handle second instance attempt - focus existing window
  app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
    log.info("Second instance detected, focusing existing window");
    // Someone tried to run a second instance, focus our existing window instead
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// === CUSTOM UPDATER CONFIGURATION ===
// Configure enhanced logging for custom updater
log.transports.file.level = "debug";
log.transports.file.maxSize = 1024 * 1024 * 10; // 10MB max log file
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.console.level = "debug";

// 🔍 CUSTOM UPDATER DEBUG: Environment logging
log.info("=== CUSTOM UPDATER ENVIRONMENT DEBUG ===");
log.info("App Version:", pkg.version);
log.info("App Name:", app.getName());
log.info("Product Name:", app.getName());
log.info("App ID:", "com.rawalite.app");
log.info("Is Packaged:", app.isPackaged);
log.info("Platform:", process.platform, process.arch);
log.info("Electron Version:", process.versions.electron);
log.info("Node Version:", process.versions.node);
log.info("App Path:", app.getAppPath());
log.info("User Data Path:", app.getPath("userData"));
log.info("Update Manifest URL:", "https://api.github.com/repos/MonaFP/RawaLite/releases/latest");

// === CUSTOM UPDATER STATE MANAGEMENT ===
let currentUpdateManifest: UpdateManifest | null = null;

// 🔧 HOTFIX: Persistent paths & state for robust installer finding
const pendingDir = path.join(app.getPath("userData"), "..", "Local", "rawalite-updater", "pending");
let lastDownloadedPath: string | null = null;

function stripQuotes(p?: string) {
  if (!p || typeof p !== "string") return p ?? "";
  return p.replace(/^"+|"+$/g, "");
}

async function findLatestExeInPending(): Promise<string | null> {
  try {
    const entries = await fs.promises.readdir(pendingDir, { withFileTypes: true });
    const exes = await Promise.all(
      entries
        .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".exe"))
        .map(async e => {
          const full = path.join(pendingDir, e.name);
          const st = await fs.promises.stat(full);
          return { full, mtime: st.mtimeMs };
        })
    );
    if (exes.length === 0) return null;
    exes.sort((a, b) => b.mtime - a.mtime);
    return exes[0].full;
  } catch {
    return null;
  }
}

// Nach JEDER erfolgreichen Dateiübertragung aufrufen:
function afterDownloadComplete(outPath: string) {
  lastDownloadedPath = outPath;
  const win = BrowserWindow.getAllWindows()[0];
  win?.webContents.send("updater:progress", { transferred: 1, total: 1, percent: 100 });
  log.info("✅ [CUSTOM-UPDATER] Download completed and registered:", outPath);
}

function resolvePackagedLauncherScript(): string {
  // electron-builder can bundle extra resources either directly under resourcesPath
  // or in a nested `resources/` directory. Probe both locations before failing.
  const candidatePaths = [
    path.join(process.resourcesPath, "resources", "update-launcher.ps1"),
    path.join(process.resourcesPath, "update-launcher.ps1")
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`update-launcher.ps1 nicht gefunden. Prüfpfade: ${candidatePaths.join(", ")}`);
}

function ensureLegacyLauncherPath(): void {
  const rootLauncherPath = path.join(process.resourcesPath, "update-launcher.ps1");
  const nestedLauncherPath = path.join(process.resourcesPath, "resources", "update-launcher.ps1");

  if (fs.existsSync(rootLauncherPath)) {
    return;
  }

  try {
    if (fs.existsSync(nestedLauncherPath)) {
      fs.copyFileSync(nestedLauncherPath, rootLauncherPath);
      log.info(
        `[LEGACY-LAUNCHER] Repariert: ${nestedLauncherPath} -> ${rootLauncherPath}`
      );
    }
  } catch (error) {
    log.warn(`[LEGACY-LAUNCHER] Konnte nicht repariert werden: ${error}`);
  }
}

ensureLegacyLauncherPath();

function scheduleQuitAfterLauncherStart(originTag: (message: string) => string) {
  if (!app.isPackaged) {
    log.info(originTag("DEV-Modus - kein automatisches Beenden"));
    return;
  }

  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => {
    try {
      window.webContents.send("updater:will-quit", {
        message: "Anwendung wird für das Update beendet",
      });
    } catch (notifyError) {
      log.warn(originTag(`Renderer-Benachrichtigung fehlgeschlagen: ${notifyError}`));
    }
  });

  const quitDelayMs = 5000;
  log.info(originTag(`App wird in ${quitDelayMs}ms für das Update beendet`));
  setTimeout(() => {
    log.info(originTag("App quit ausgelöst"));
    app.quit();
  }, quitDelayMs);
}

// === CUSTOM UPDATER IPC HANDLERS ===

// 1️⃣ VERSION:GET - Single source of truth for app version
ipcMain.handle("version:get", () => {
  log.info(`[version:get] Returning unified version data: app=${pkg.version}, electron=${process.versions.electron}`);
  return {
    ok: true,
    app: pkg.version,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  };
});

// 2️⃣ UPDATE:CHECK - Check for updates via GitHub manifest
ipcMain.handle("updater:check", async () => {
  try {
    log.info("🔍 [CUSTOM-UPDATER] Checking for updates via GitHub update.json");
    
    // Development mode check
    if (!app.isPackaged) {
      log.info("🔧 [DEV-MODE] Update check skipped in development");
      return {
        ok: false,
        error: "Update-System ist im Development-Modus deaktiviert"
      };
    }
    
    const currentVersion = pkg.version;
    
    // Try to fetch update.json manifest from GitHub releases
    const updateManifest = await fetchUpdateManifest();
    
    if (!updateManifest) {
      return {
        ok: true,
        hasUpdate: false,
        current: currentVersion
      };
    }
    
    // Compare versions using semver
    const { isNewerVersion } = await import('../src/services/semver.js');
    const hasUpdate = isNewerVersion(updateManifest.version, currentVersion);
    
    if (hasUpdate) {
      // Store manifest for download phase
      currentUpdateManifest = updateManifest;
      
      // 🔧 0MB FIX: Try to get size if not available
      const nsisFile = updateManifest.files.find(
        file => file.kind === 'nsis' && file.arch === 'x64'
      );
      
      if (nsisFile && (!nsisFile.size || nsisFile.size === 0) && nsisFile.url) {
        log.info(`🔍 [CUSTOM-UPDATER] Size unknown, fetching via HEAD request: ${nsisFile.url}`);
        nsisFile.size = await getContentLengthFromUrl(nsisFile.url);
        if (nsisFile.size > 0) {
          log.info(`✅ [CUSTOM-UPDATER] Size determined via HEAD: ${Math.round(nsisFile.size / 1024 / 1024 * 100) / 100} MB`);
        }
      }
      
      log.info(`✅ [CUSTOM-UPDATER] Update available: ${currentVersion} -> ${updateManifest.version}`);
      
      return {
        ok: true,
        hasUpdate: true,
        current: currentVersion,
        target: updateManifest
      };
    } else {
      // Clear any stored manifest
      currentUpdateManifest = null;
      
      log.info(`✅ [CUSTOM-UPDATER] No update available: ${currentVersion} is latest`);
      
      return {
        ok: true,
        hasUpdate: false,
        current: currentVersion
      };
    }
    
  } catch (error) {
    log.error("❌ [CUSTOM-UPDATER] Update check failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Update-Prüfung fehlgeschlagen',
      current: pkg.version
    };
  }
});

// 3️⃣ UPDATE:DOWNLOAD - Download update file with progress
ipcMain.handle("updater:download", async () => {
  try {
    if (!currentUpdateManifest) {
      throw new Error('Kein Update verfügbar. Bitte zuerst nach Updates suchen.');
    }
    
    // Find the NSIS x64 file
    const nsisFile = currentUpdateManifest.files.find(
      file => file.kind === 'nsis' && file.arch === 'x64'
    );
    
    if (!nsisFile) {
      throw new Error('Keine kompatible Installer-Datei gefunden.');
    }
    
    log.info("🔽 [CUSTOM-UPDATER] Starting download:", nsisFile.url);
    
    // Download file with progress tracking
    const filePath = await downloadFileWithProgress(nsisFile.url, nsisFile.name, nsisFile.size);
    
    // Verify SHA512 if provided
    if (nsisFile.sha512) {
      const isValid = await verifyFileSha512(filePath, nsisFile.sha512);
      if (!isValid) {
        // Clean up invalid file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw new Error('Download-Verifikation fehlgeschlagen. Datei wurde nicht korrekt heruntergeladen.');
      }
      log.info("✅ [CUSTOM-UPDATER] SHA512 verification successful");
    }
    
    // Store file path for installation (legacy) - removed downloadedFilePath
    
    // 🔧 HOTFIX: Register downloaded path and notify completion
    afterDownloadComplete(filePath);
    
    // 🔧 0MB FIX: Get actual file size after download
    let actualSize = nsisFile.size || 0;
    try {
      const stats = await fs.promises.stat(filePath);
      actualSize = stats.size;
      log.info(`📊 [CUSTOM-UPDATER] Actual file size: ${Math.round(actualSize / 1024 / 1024 * 100) / 100} MB`);
    } catch (error) {
      log.warn("⚠️ [CUSTOM-UPDATER] Could not get file stats:", error);
    }
    
    log.info(`✅ [CUSTOM-UPDATER] Download completed: ${filePath}`);
    
    return {
      ok: true,
      file: filePath,
      size: actualSize
    };
    
  } catch (error) {
    log.error("❌ [CUSTOM-UPDATER] Download failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Download fehlgeschlagen'
    };
  }
});

// 4️⃣ UPDATE:INSTALL-LAUNCHER - UAC-resistant launcher-based installation
ipcMain.handle("updater:install", async (_evt, exePath?: string) => {
  const runId = Date.now().toString(36);
  const tag = (m: string) => `[LAUNCHER-INSTALL ${runId}] ${m}`;
  
  try {
    log.info(tag("Launcher-based install requested"));
    
    // Find installer path
    let candidate = stripQuotes(exePath);
    if (!candidate) candidate = lastDownloadedPath ?? "";
    if (!candidate || !fs.existsSync(candidate)) {
      const fallback = await findLatestExeInPending();
      if (fallback) candidate = fallback;
    }

    if (!candidate || !fs.existsSync(candidate)) {
      const msg = "Installer-Datei nicht gefunden. Bitte zuerst herunterladen.";
      log.error(tag(`Install failed: ${msg}`));
      return { ok: false, error: msg };
    }

    // Get launcher script path with ASAR extraction
    let launcherPath: string;
    
    if (isDev) {
      launcherPath = path.join(process.cwd(), "resources", "update-launcher.ps1");
    } else {
      // In production, extract launcher from ASAR to temp directory
      const tempDir = path.join(os.tmpdir(), "rawalite-launcher");
      const tempLauncherPath = path.join(tempDir, "update-launcher.ps1");
      
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Extract launcher from resources
      try {
        const resourcesLauncherPath = resolvePackagedLauncherScript();
        // Copy launcher to temp location
        fs.copyFileSync(resourcesLauncherPath, tempLauncherPath);
        launcherPath = tempLauncherPath;
        log.info(tag(`Launcher extracted to temp: ${tempLauncherPath}`));
      } catch (extractError) {
        const msg = `Launcher extraction failed: ${extractError}`;
        log.error(tag(msg));
        return { ok: false, error: msg };
      }
    }

    if (!fs.existsSync(launcherPath)) {
      const msg = "Update-Launcher nicht gefunden. Installation nicht möglich.";
      log.error(tag(msg));
      return { ok: false, error: msg };
    }

    log.info(tag(`Starting UAC-resistant launcher: ${candidate}`));
    log.info(tag(`Launcher script: ${launcherPath}`));
    
    // Execute launcher script with detached process
    const launcherArgs = [
      "-NoProfile",
      "-ExecutionPolicy", "Bypass", 
      "-File", `"${launcherPath}"`,
      "-InstallerPath", `"${candidate}"`
    ];
    
    const launcherProcess = spawn("powershell.exe", launcherArgs, {
      detached: true,  // CRITICAL: Detached for UAC-resistance
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: false
    });

    // Allow launcher to outlive the Electron process (otherwise Windows tears it down).
    if (launcherProcess.unref) {
      launcherProcess.unref();
    }

    // Monitor launcher output briefly
    let launcherOutput = "";
    let launcherError = "";

    launcherProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      launcherOutput += output + "\n";
      log.info(tag(`LAUNCHER-OUT: ${output}`));
    });
    
    launcherProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      launcherError += error + "\n";
      log.warn(tag(`LAUNCHER-ERR: ${error}`));
    });

    // Return promise that resolves when launcher starts (not when install completes)
    return new Promise((resolve) => {
      launcherProcess.on('exit', (code) => {
        log.info(tag(`Launcher process exited with code: ${code}`));
        
        if (code === 0) {
          log.info(tag("✅ Launcher started successfully - installation running independently"));

          // Notify UI about launcher success
          const allWindows = BrowserWindow.getAllWindows();
          allWindows.forEach((window) => {
            window.webContents.send('updater:launcher-started', {
              success: true,
              message: 'Installation gestartet. Bitte bestätigen Sie die UAC-Anfrage.',
              launcherOutput: launcherOutput.trim()
            });
          });

          scheduleQuitAfterLauncherStart(tag);

          resolve({ 
            ok: true, 
            launcherStarted: true, 
            exitCode: code,
            message: "Launcher gestartet - Installation läuft unabhängig",
            output: launcherOutput.trim()
          });
        } else {
          log.error(tag(`❌ Launcher failed with code: ${code}`));
          
          resolve({ 
            ok: false, 
            error: `Launcher fehlgeschlagen (Exit Code: ${code})`,
            exitCode: code,
            output: launcherOutput.trim(),
            errorOutput: launcherError.trim()
          });
        }
      });
      
      launcherProcess.on('error', (error) => {
        log.error(tag(`Launcher process error: ${error.message}`));
        resolve({ 
          ok: false, 
          error: `Launcher-Fehler: ${error.message}`,
          output: launcherOutput.trim()
        });
      });
    });
    
  } catch (e: any) {
    log.error(tag(`Exception: ${e?.message || e}`));
    return { ok: false, error: e?.message ?? String(e) };
  }
});

// 5️⃣ UPDATE:CHECK-RESULTS - Check installation results from launcher
ipcMain.handle("updater:check-results", async () => {
  const tag = "[CHECK-RESULTS]";
  
  try {
    const resultsPath = path.join(os.homedir(), "AppData", "Local", "rawalite-updater", "install-results.json");
    
    if (!fs.existsSync(resultsPath)) {
      log.info(tag + " No installation results found");
      return { ok: true, hasResults: false };
    }
    
    // Read and parse results
    const resultsData = fs.readFileSync(resultsPath, "utf-8");
    const results = JSON.parse(resultsData);
    
    log.info(tag + ` Found installation results: Success=${results.success}, ExitCode=${results.exitCode}`);
    
    // Clean up results file after reading
    try {
      fs.unlinkSync(resultsPath);
      log.info(tag + " Results file cleaned up");
    } catch (cleanupError) {
      log.warn(tag + ` Could not clean up results file: ${cleanupError}`);
    }
    
    return {
      ok: true,
      hasResults: true,
      results: results
    };
    
  } catch (error) {
    log.error(tag + ` Error checking results: ${error}`);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// === CUSTOM INSTALL IPC HANDLER ===

type InstallCustomPayload = {
  filePath: string;
  args?: string[];
  expectedSha256?: string;
  elevate?: boolean;       // default: true
  unblock?: boolean;       // default: true
  quitDelayMs?: number;    // default: 7000
};

ipcMain.handle("updater:install-custom", async (_event, payload: InstallCustomPayload) => {
  const {
    filePath,
    elevate: _elevate = true,
    quitDelayMs: _quitDelayMs = 1000,
  } = payload ?? {};

  const runId = Date.now().toString(36);
  const tag = (msg: string) => `[LAUNCHER-INSTALL-CUSTOM ${runId}] ${msg}`;

  try {
    log.info(tag(`Launcher-based custom install requested: ${filePath}`));

    // 1. Validation - Datei existiert?
    if (!filePath || !fs.existsSync(filePath)) {
      const msg = `Installer nicht gefunden: ${filePath}`;
      log.error(tag(msg));
      return { ok: false, error: msg };
    }

    // Get launcher script path with ASAR extraction
    let launcherPath: string;
    
    if (isDev) {
      launcherPath = path.join(process.cwd(), "resources", "update-launcher.ps1");
    } else {
      // In production, extract launcher from ASAR to temp directory
      const tempDir = path.join(os.tmpdir(), "rawalite-launcher");
      const tempLauncherPath = path.join(tempDir, "update-launcher.ps1");
      
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Extract launcher from resources
      try {
        const resourcesLauncherPath = resolvePackagedLauncherScript();
        // Copy launcher to temp location
        fs.copyFileSync(resourcesLauncherPath, tempLauncherPath);
        launcherPath = tempLauncherPath;
        log.info(tag(`Launcher extracted to temp: ${tempLauncherPath}`));
      } catch (extractError) {
        const msg = `Launcher extraction failed: ${extractError}`;
        log.error(tag(msg));
        return { ok: false, error: msg };
      }
    }

    if (!fs.existsSync(launcherPath)) {
      const msg = "Update-Launcher nicht gefunden. Installation nicht möglich.";
      log.error(tag(msg));
      return { ok: false, error: msg };
    }

    log.info(tag(`Starting UAC-resistant launcher: ${filePath}`));
    log.info(tag(`Launcher script: ${launcherPath}`));
    
    // Execute launcher script with detached process
    const launcherArgs = [
      "-NoProfile",
      "-ExecutionPolicy", "Bypass", 
      "-File", `"${launcherPath}"`,
      "-InstallerPath", `"${filePath}"`
    ];
    
    const launcherProcess = spawn("powershell.exe", launcherArgs, {
      detached: true,  // CRITICAL: Detached for UAC-resistance
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: false
    });

    if (launcherProcess.unref) {
      launcherProcess.unref();
    }

    // Monitor launcher output briefly
    let launcherOutput = "";
    let launcherError = "";

    launcherProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      launcherOutput += output + "\n";
      log.info(tag(`LAUNCHER-OUT: ${output}`));
    });
    
    launcherProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      launcherError += error + "\n";
      log.warn(tag(`LAUNCHER-ERR: ${error}`));
    });

    // Return promise that resolves when launcher starts (not when install completes)
    return new Promise((resolve) => {
      launcherProcess.on('exit', (code) => {
        log.info(tag(`Launcher process exited with code: ${code}`));
        
        if (code === 0) {
          log.info(tag("✅ Launcher started successfully - installation running independently"));

          // Notify UI about launcher success
          const allWindows = BrowserWindow.getAllWindows();
          allWindows.forEach((window) => {
            window.webContents.send('updater:launcher-started', {
              success: true,
              message: 'Installation gestartet. Bitte bestätigen Sie die UAC-Anfrage.',
              launcherOutput: launcherOutput.trim()
            });
          });

          scheduleQuitAfterLauncherStart(tag);

          resolve({
            ok: true,
            launcherStarted: true,
            exitCode: code,
            message: "Launcher gestartet - Installation läuft unabhängig",
            filePath,
            runId,
            output: launcherOutput.trim()
          });
        } else {
          log.error(tag(`❌ Launcher failed with code: ${code}`));
          
          resolve({ 
            ok: false, 
            error: `Launcher fehlgeschlagen (Exit Code: ${code})`,
            exitCode: code,
            filePath,
            runId,
            output: launcherOutput.trim(),
            errorOutput: launcherError.trim()
          });
        }
      });
      
      launcherProcess.on('error', (error) => {
        log.error(tag(`Launcher process error: ${error.message}`));
        resolve({ 
          ok: false, 
          error: `Launcher-Fehler: ${error.message}`,
          filePath,
          runId,
          output: launcherOutput.trim()
        });
      });
    });

  } catch (error: any) {
    log.error(tag(`Exception: ${error?.message || error}`));
    return { ok: false, error: error?.message ?? String(error) };
  }
});

// === CLEANED UP UPDATER (Removed complex installer functions) ===

// === CUSTOM UPDATER HELPER FUNCTIONS ===

/**
 * Fetch file size via HEAD request (for 0MB size fix)
 */
async function getContentLengthFromUrl(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);
    
    const request = https.request({
      hostname: requestUrl.hostname,
      port: requestUrl.port || 443,
      path: requestUrl.pathname + requestUrl.search,
      method: 'HEAD',
      headers: {
        'User-Agent': 'RawaLite-CustomUpdater/1.0',
        'Accept': '*/*'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        if (response.headers.location) {
          getContentLengthFromUrl(response.headers.location).then(resolve).catch(reject);
          return;
        }
      }
      
      const contentLength = response.headers['content-length'];
      if (contentLength) {
        resolve(parseInt(contentLength, 10));
      } else {
        resolve(0);
      }
    });
    
    request.on('error', (error) => {
      log.warn(`[HEAD request failed for ${url}]:`, error.message);
      resolve(0); // Fallback to 0, not reject
    });
    
    // Timeout after 10 seconds
    request.setTimeout(10000, () => {
      log.warn(`[HEAD request timeout for ${url}]`);
      request.destroy();
      resolve(0);
    });
    
    request.end();
  });
}

/**
 * Fetch update manifest from GitHub releases
 */
async function fetchUpdateManifest(): Promise<UpdateManifest | null> {
  try {
    // Try to get update.json from latest release assets
    const releaseResponse = await fetch("https://api.github.com/repos/MonaFP/RawaLite/releases/latest", {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RawaLite-CustomUpdater/1.0'
      }
    });
    
    if (!releaseResponse.ok) {
      throw new Error(`GitHub API error: ${releaseResponse.status}`);
    }
    
    const releaseData = await releaseResponse.json();
    
    // Try to find update.json asset first (preferred)
    const updateJsonAsset = releaseData.assets?.find((a: any) => a.name === 'update.json');
    
    if (updateJsonAsset) {
      const updateJsonResponse = await fetch(updateJsonAsset.browser_download_url, {
        headers: { 'User-Agent': 'RawaLite-CustomUpdater/1.0' }
      });
      
      if (updateJsonResponse.ok) {
        const manifest = await updateJsonResponse.json();
        log.info("✅ [CUSTOM-UPDATER] Found update.json manifest");
        return manifest;
      }
    }
    
    // Fallback: Construct manifest from GitHub API data
    log.info("⚠️ [CUSTOM-UPDATER] No update.json found, constructing from GitHub API");
    
    const latestVersion = releaseData.tag_name?.replace('v', '') || releaseData.name?.replace('v', '');
    
    // Find the Windows executable asset
    const asset = releaseData.assets?.find((a: any) => 
      a.name?.includes('Setup') && a.name?.endsWith('.exe')
    );
    
    if (asset) {
      const manifest: UpdateManifest = {
        product: "RawaLite",
        channel: "stable",
        version: latestVersion,
        releasedAt: releaseData.published_at || new Date().toISOString(),
        notes: releaseData.body || 'Neue Version verfügbar.',
        files: [{
          kind: "nsis",
          arch: "x64",
          name: asset.name,
          size: asset.size,
          sha512: "", // Empty for fallback
          url: asset.browser_download_url
        }]
      };
      
      return manifest;
    }
    
    return null;
    
  } catch (error) {
    log.error("❌ [CUSTOM-UPDATER] Failed to fetch update manifest:", error);
    return null;
  }
}

/**
 * Download file with progress tracking
 */
async function downloadFileWithProgress(url: string, fileName: string, expectedSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const downloadDir = path.join(os.homedir(), 'AppData', 'Local', 'rawalite-updater', 'pending');
    
    // Create download directory
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const filePath = path.join(downloadDir, fileName);
    
    // Remove existing file if present
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        if (response.headers.location) {
          // Recursive call for redirect
          https.get(response.headers.location, handleResponse);
        } else {
          reject(new Error('Redirect without location header'));
        }
        return;
      }
      
      handleResponse(response);
    });
    
    function handleResponse(response: any) {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: HTTP ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'] || '0') || expectedSize;
      let downloadedSize = 0;
      let lastProgressTime = Date.now();
      const startTime = Date.now();
      
      const fileStream = fs.createWriteStream(filePath);
      
      response.on('data', (chunk: Buffer) => {
        downloadedSize += chunk.length;
        
        // Send progress updates (throttled to 200ms)
        const now = Date.now();
        if (now - lastProgressTime > 200) {
          const percent = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
          const speed = downloadedSize / ((now - startTime) / 1000); // bytes per second
          const etaSec = speed > 0 ? (totalSize - downloadedSize) / speed : 0;
          
          const progress: UpdateProgress = {
            percent: Math.round(percent * 100) / 100,
            transferred: downloadedSize,
            total: totalSize,
            speed,
            etaSec
          };
          
          // Send to renderer
          const allWindows = BrowserWindow.getAllWindows();
          allWindows.forEach((window) => {
            window.webContents.send('updater:progress', progress);
          });
          
          lastProgressTime = now;
        }
      });
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        log.info(`✅ [CUSTOM-UPDATER] Download completed: ${filePath}`);
        log.info(`📊 [CUSTOM-UPDATER] Size: ${downloadedSize} bytes`);
        resolve(filePath);
      });
      
      fileStream.on('error', (error) => {
        fs.unlink(filePath, () => {}); // Clean up on error
        reject(error);
      });
    }
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('Download timeout (60s)'));
    });
  });
}

/**
 * Verify file SHA512 hash (Base64)
 */
async function verifyFileSha512(filePath: string, expectedSha512Base64: string): Promise<boolean> {
  try {
    if (!expectedSha512Base64) {
      // No hash to verify
      return true;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha512');
    hash.update(fileBuffer);
    const calculatedSha512Base64 = hash.digest('base64');
    
    const isValid = calculatedSha512Base64 === expectedSha512Base64;
    
    if (isValid) {
      log.info("✅ [CUSTOM-UPDATER] SHA512 verification successful");
    } else {
      log.error("❌ [CUSTOM-UPDATER] SHA512 verification failed");
      log.error(`Expected: ${expectedSha512Base64}`);
      log.error(`Calculated: ${calculatedSha512Base64}`);
    }
    
    return isValid;
    
  } catch (error) {
    log.error("❌ [CUSTOM-UPDATER] SHA512 verification error:", error);
    return false;
  }
}

// === LEGACY COMPATIBILITY HANDLERS ===
// Note: These are deprecated and will be removed in future versions

// � DEPRECATED: updater:get-version handler removed in favor of unified version:get API (v1.8.44+)
// Use window.rawalite.version.get() in renderer process instead

// PDF Theme Integration Import
// Note: Import path needs compilation compatibility
const _pdfThemesPath = path.join(__dirname, "..", "src", "lib", "pdfThemes.ts");  // Referenced for future PDF theme customization
void _pdfThemesPath;
let injectThemeIntoTemplate: any = null;

// Dynamic import for theme integration (compiled compatibility)
async function loadThemeIntegration() {
  try {
    if (!injectThemeIntoTemplate) {
      // For development/build compatibility, we'll implement theme injection inline
      injectThemeIntoTemplate = (
        templateHTML: string,
        pdfThemeData: any
      ): string => {
        if (!pdfThemeData) return templateHTML;

        // Find the closing </style> tag and inject theme CSS before it
        const styleEndIndex = templateHTML.lastIndexOf("</style>");

        if (styleEndIndex === -1) {
          console.warn(
            "No <style> tag found in template, cannot inject theme CSS"
          );
          return templateHTML;
        }

        const themeInjection = `
          
          /* === PDF THEME INTEGRATION === */
          :root {
            ${pdfThemeData.cssVariables}
          }
          
          ${pdfThemeData.themeCSS}
          /* === END THEME INTEGRATION === */
        `;

        // Insert theme CSS before closing </style>
        const themedTemplate =
          templateHTML.substring(0, styleEndIndex) +
          themeInjection +
          templateHTML.substring(styleEndIndex);

        return themedTemplate;
      };
    }
  } catch (error) {
    console.warn("Theme integration not available:", error);
    injectThemeIntoTemplate = (template: string) => template; // Fallback
  }
}

const isDev = !app.isPackaged; // zuverlässig für Dev/Prod

function createMenu() {
  const template = [
    {
      label: "Datei",
      submenu: [
        {
          label: "Beenden",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Bearbeiten",
      submenu: [
        { label: "Rückgängig", accelerator: "CmdOrCtrl+Z", role: "undo" },
        {
          label: "Wiederholen",
          accelerator: "Shift+CmdOrCtrl+Z",
          role: "redo",
        },
        { type: "separator" },
        { label: "Ausschneiden", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Kopieren", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Einfügen", accelerator: "CmdOrCtrl+V", role: "paste" },
        {
          label: "Alles auswählen",
          accelerator: "CmdOrCtrl+A",
          role: "selectall",
        },
      ],
    },
    {
      label: "Ansicht",
      submenu: [
        { label: "Vollbild", accelerator: "F11", role: "togglefullscreen" },
        { type: "separator" },
        { label: "Neu laden", accelerator: "CmdOrCtrl+R", role: "reload" },
        {
          label: "Erzwungenes Neu laden",
          accelerator: "CmdOrCtrl+Shift+R",
          role: "forceReload",
        },
        { type: "separator" },
        {
          label: "Entwicklertools",
          accelerator: "F12",
          role: "toggledevtools",
        },
        ...(isDev
          ? []
          : [
              {
                label: "Debug-Logs exportieren",
                click: async () => {
                  try {
                    const mainWindow = BrowserWindow.getAllWindows()[0];
                    if (mainWindow) {
                      mainWindow.webContents.send("export-logs");
                    }
                  } catch (error) {
                    log.error("Error triggering log export:", error);
                  }
                },
              },
            ]),
      ],
    },
    {
      label: "Update",
      submenu: [
        {
          label: "Nach Updates suchen",
          click: async () => {
            log.info("Manual update check triggered from menu");
            try {
              // Use new custom updater check
              const result = await fetchUpdateManifest();
              if (result) {
                const { isNewerVersion } = await import('../src/services/semver.js');
                const hasUpdate = isNewerVersion(result.version, pkg.version);
                
                if (hasUpdate) {
                  log.info(`Update available: ${result.version}`);
                  // Show update notification
                  dialog.showMessageBox({
                    type: 'info',
                    title: 'Update verfügbar',
                    message: `RawaLite ${result.version} ist verfügbar`,
                    detail: 'Öffnen Sie die Einstellungen um das Update zu installieren.',
                    buttons: ['OK']
                  });
                } else {
                  log.info("No updates available");
                  dialog.showMessageBox({
                    type: 'info',
                    title: 'Keine Updates',
                    message: 'Sie verwenden bereits die neueste Version',
                    buttons: ['OK']
                  });
                }
              } else {
                log.error("Menu update check failed: Could not fetch manifest");
                dialog.showMessageBox({
                  type: 'error',
                  title: 'Update-Prüfung fehlgeschlagen',
                  message: 'Konnte nicht nach Updates suchen. Bitte versuchen Sie es später erneut.',
                  buttons: ['OK']
                });
              }
            } catch (err) {
              log.error("Menu update check failed:", err);
              dialog.showMessageBox({
                type: 'error',
                title: 'Update-Prüfung fehlgeschlagen',
                message: 'Ein Fehler ist aufgetreten beim Suchen nach Updates.',
                buttons: ['OK']
              });
            }
          },
        },
        { type: "separator" },
        {
          label: "App-Version anzeigen",
          click: () => {
            const version = pkg.version; // 🔧 FIX: Use unified version system (package.json)
            dialog.showMessageBox({
              type: "info",
              title: "App-Version",
              message: `RawaLite Version ${version}`,
              detail: `Electron: ${process.versions.electron}\nNode.js: ${process.versions.node}\nChrome: ${process.versions.chrome}`,
              buttons: ["OK"],
            });
          },
        },
      ],
    },
    {
      label: "Hilfe",
      submenu: [
        {
          label: "Über RawaLite",
          click: () => {
            // In-App Über-Dialog statt externe URL
            const allWindows = BrowserWindow.getAllWindows();
            const mainWindow = allWindows[0];
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Über RawaLite",
                message: `RawaLite v${pkg.version}`, // 🔧 FIX: Use unified version system (package.json)
                detail:
                  "Professional Business Management Solution\n\nCopyright © 2025 MonaFP. All rights reserved.",
                buttons: ["OK"],
              });
            }
          },
        },
        {
          label: "App-Version anzeigen",
          click: () => {
            // Version Info statt Dokumentation
            const allWindows = BrowserWindow.getAllWindows();
            const mainWindow = allWindows[0];
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Version Information",
                message: `RawaLite v${pkg.version}`, // 🔧 FIX: Use unified version system (package.json)
                detail: `Electron: ${process.versions.electron}\nNode.js: ${process.versions.node}\nChrome: ${process.versions.chrome}`,
                buttons: ["OK"],
              });
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // Projekt-Root ermitteln:
  const rootPath = isDev ? process.cwd() : app.getAppPath();

  // Preload: im Dev aus <root>/dist-electron, im Prod neben main.cjs
  const preloadPath = isDev
    ? path.join(rootPath, "dist-electron", "preload.js")
    : path.join(__dirname, "preload.js");

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (isDev) {
    // Vite-Dev-Server
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Statisches HTML aus dist-Ordner
    win.loadFile(path.join(rootPath, "dist", "index.html"));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    // SECURITY: Externe Navigation blockiert gemäß COPILOT_INSTRUCTIONS.md
    console.log("External navigation blocked:", url);
    return { action: "deny" };
  });
}

// IPC Handler für App-Operationen
ipcMain.handle("app:restart", async () => {
  app.relaunch();
  app.exit();
});

// 🔄 NEW: Manual restart after successful update installation
ipcMain.handle("app:restart-after-update", async () => {
  log.info("🔄 Manual app restart requested after update installation");
  
  // Short delay to allow UI feedback
  setTimeout(() => {
    log.info("🔄 Restarting app to load new version");
    app.relaunch();
    app.exit();
  }, 500);
  
  return { ok: true, message: "App wird neu gestartet..." };
});

// � DEPRECATED: app:getVersion handler kept for backward compatibility only
// Use window.rawalite.version.get() for new code instead (unified version system v1.8.44+)
ipcMain.handle("app:getVersion", async () => {
  console.warn("⚠️ DEPRECATED: app:getVersion used - migrate to version:get API");
  
  // For backward compatibility, return pkg.version (same as version:get)
  return pkg.version;
});

// ===== DATENBANK & PDF HANDLER =====

// IPC Handler für Datenbank-Operationen
ipcMain.handle("db:load", async (): Promise<Uint8Array | null> => {
  try {
    const dbPath = path.join(app.getPath("userData"), "database.sqlite");
    if (!fs.existsSync(dbPath)) {
      return null;
    }
    return fs.readFileSync(dbPath);
  } catch (error) {
    console.error("Error loading database:", error);
    return null;
  }
});

ipcMain.handle("db:save", async (_, data: Uint8Array): Promise<boolean> => {
  try {
    const userDataPath = app.getPath("userData");
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, "database.sqlite");
    fs.writeFileSync(dbPath, data);
    return true;
  } catch (error) {
    console.error("Error saving database:", error);
    return false;
  }
});

// IPC Handler für PDF-Generierung
ipcMain.handle(
  "pdf:generate",
  async (
    _event,
    options: {
      templateType: "offer" | "invoice" | "timesheet";
      data: {
        offer?: any;
        invoice?: any;
        timesheet?: any;
        customer: any;
        settings: any;
        currentDate?: string;
      };
      theme?: any; // ✅ Theme-Daten hinzufügen
      options: {
        filename: string;
        previewOnly: boolean;
        enablePDFA: boolean;
        validateCompliance: boolean;
      };
    }
  ) => {
    try {
      console.log(
        `🎯 PDF generation requested: ${options.templateType} - ${options.options.filename}`
      );

      // 🚨 IPC DEBUG: Check what arrives via IPC
      console.log("🔍 IPC TRANSMISSION DEBUG:");
      console.log("  - options.data exists:", !!options.data);
      console.log("  - options.data.offer exists:", !!options.data.offer);
      if (options.data.offer) {
        console.log("  - offer.offerNumber:", options.data.offer.offerNumber);
        console.log(
          "  - offer.lineItems exists:",
          !!options.data.offer.lineItems
        );
        console.log(
          "  - offer.lineItems length:",
          options.data.offer.lineItems?.length || 0
        );
        if (
          options.data.offer.lineItems &&
          options.data.offer.lineItems.length > 0
        ) {
          console.log(
            "  - First line item structure:",
            Object.keys(options.data.offer.lineItems[0] || {})
          );
          console.log(
            "  - First line item values:",
            options.data.offer.lineItems[0]
          );
        }
      }

      // 1. Validate inputs
      if (!options.templateType || !options.data || !options.options) {
        return {
          success: false,
          error: "Invalid PDF generation parameters",
        };
      }

      // 2. Get template path
      const templatePath = getTemplatePath(options.templateType);
      if (!fs.existsSync(templatePath)) {
        return {
          success: false,
          error: `Template not found: ${options.templateType}`,
        };
      }

      // 3. Render template with data - ENHANCED with Field Mapping
      const templateData = {
        [options.templateType]:
          options.data.offer || options.data.invoice || options.data.timesheet,
        customer: options.data.customer,
        settings: options.data.settings,
        company: {
          // Map company fields to match template expectations
          ...options.data.settings?.companyData,
          zip:
            options.data.settings?.companyData?.postalCode ||
            options.data.settings?.companyData?.zip, // FIX: Map postalCode to zip
          taxId:
            options.data.settings?.companyData?.taxNumber ||
            options.data.settings?.companyData?.taxId, // FIX: Map taxNumber to taxId
        },
        currentDate:
          options.data.currentDate || new Date().toLocaleDateString("de-DE"),
        theme: options.theme, // ✅ CRITICAL FIX: Theme-Daten für PDF-Templates hinzufügen
      };

      // 🚨 KRITISCHER DEBUG: Prüfe was wirklich ankommt
      console.log("🚨 RAW DEBUG - options.data.settings:");
      console.log("  - settings object:", !!options.data.settings);
      if (options.data.settings) {
        console.log(
          "  - settings.companyData:",
          !!options.data.settings.companyData
        );
        console.log("  - settings keys:", Object.keys(options.data.settings));
        if (options.data.settings.companyData) {
          console.log(
            "  - companyData.kleinunternehmer:",
            options.data.settings.companyData.kleinunternehmer
          );
          console.log(
            "  - companyData keys:",
            Object.keys(options.data.settings.companyData)
          );
        }
      }
      console.log("🚨 RAW DEBUG - options.theme:");
      console.log("  - theme object:", !!options.theme);
      if (options.theme) {
        console.log("  - theme keys:", Object.keys(options.theme));
        console.log("  - theme.theme:", !!options.theme.theme);
      }

      // 🔍 DEBUG: Log template data structure ERWEITERT
      console.log("📊 Template Data Structure:");
      console.log("  - Type:", options.templateType);
      console.log("  - Offer exists:", !!templateData.offer);
      console.log("  - Customer exists:", !!templateData.customer);
      console.log("  - Company exists:", !!templateData.company);
      if (templateData.company) {
        console.log(
          "  - Company Kleinunternehmer:",
          templateData.company.kleinunternehmer
        );
        console.log(
          "  - Company Name (name field):",
          templateData.company.name
        ); // ✅ CORRECT DEBUG
        console.log("  - Company Street:", templateData.company.street);
        console.log("  - Company City:", templateData.company.city);
        console.log("  - Company Keys:", Object.keys(templateData.company));
      }
      console.log("  - Theme exists:", !!templateData.theme);
      if (templateData.theme) {
        console.log("  - Theme ID:", templateData.theme.themeId);
        console.log(
          "  - Theme Colors:",
          templateData.theme.primary,
          templateData.theme.secondary,
          templateData.theme.accent
        );
        console.log("  - Theme.theme exists:", !!templateData.theme.theme);
        if (templateData.theme.theme) {
          console.log(
            "  - Nested Theme Colors:",
            templateData.theme.theme.primary,
            templateData.theme.theme.secondary
          );
        }
      }
      if (templateData.offer) {
        console.log("  - Offer Number:", templateData.offer.offerNumber);
        console.log("  - Offer VAT Amount:", templateData.offer.vatAmount);
        console.log("  - Offer VAT Rate:", templateData.offer.vatRate);
        console.log(
          "  - Line Items Count:",
          templateData.offer.lineItems?.length || 0
        );

        // 🚨 CRITICAL DEBUG: Line Items Details
        if (
          templateData.offer.lineItems &&
          templateData.offer.lineItems.length > 0
        ) {
          console.log("🔍 LINE ITEMS DETAILED ANALYSIS:");
          templateData.offer.lineItems.forEach((item: any, index: number) => {
            console.log(`  Item ${index}:`, {
              title: item.title,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              types: {
                quantity: typeof item.quantity,
                unitPrice: typeof item.unitPrice,
                total: typeof item.total,
              },
            });
          });
        }
      }
      if (templateData.settings) {
        console.log("  - Settings exists:", !!templateData.settings);
        console.log(
          "  - Settings.companyData exists:",
          !!templateData.settings.companyData
        );
        if (templateData.settings.companyData) {
          console.log(
            "  - Settings companyData Kleinunternehmer:",
            templateData.settings.companyData.kleinunternehmer
          );
        }
      }

      // 🧪 CRITICAL TEST: Test template variable resolution
      console.log("🧪 TEMPLATE VARIABLE RESOLUTION TEST:");
      const testVars = ["offer.offerNumber", "customer.name", "company.name"];
      testVars.forEach((varPath) => {
        const value = getNestedValue(templateData, varPath);
        console.log(
          `  {{${varPath}}} = ${
            value !== undefined ? `"${value}"` : "UNDEFINED"
          }`
        );
      });

      const htmlContent = await renderTemplate(templatePath, templateData); // 4. Create temporary file for PDF generation
      const tempDir = path.join(os.tmpdir(), "rawalite-pdf");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
      let outputPdfPath: string;

      if (options.options.previewOnly) {
        outputPdfPath = tempPdfPath;
      } else {
        // Show save dialog for export
        try {
          const saveResult = await dialog.showSaveDialog({
            title: "PDF speichern unter...",
            defaultPath: options.options.filename,
            filters: [
              { name: "PDF-Dateien", extensions: ["pdf"] },
              { name: "Alle Dateien", extensions: ["*"] },
            ],
          });

          if (saveResult.canceled) {
            return {
              success: false,
              error: "Export vom Benutzer abgebrochen",
            };
          }

          outputPdfPath =
            saveResult.filePath ||
            path.join(app.getPath("downloads"), options.options.filename);
        } catch (dialogError) {
          console.error("Dialog error, using Downloads folder:", dialogError);
          outputPdfPath = path.join(
            app.getPath("downloads"),
            options.options.filename
          );
        }
      }

      // 5. Generate PDF using Electron's webContents.printToPDF
      const win = BrowserWindow.getFocusedWindow();
      if (!win) {
        return {
          success: false,
          error: "No active window for PDF generation",
        };
      }

      // Create hidden window for PDF rendering
      const pdfWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          contextIsolation: true,
          sandbox: true,
        },
      });

      try {
        // Load HTML content
        await pdfWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
        );

        // Wait for content to load
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate PDF
        const pdfBuffer = await pdfWindow.webContents.printToPDF({
          pageSize: "A4",
          printBackground: true,
          margins: {
            top: 2.5,
            bottom: 2,
            left: 2.5,
            right: 2,
          },
        });

        // Save initial PDF
        fs.writeFileSync(tempPdfPath, pdfBuffer);

        let finalPdfPath = tempPdfPath;
        let validationResult;

        // 6. PDF/A-2b conversion if enabled
        if (options.options.enablePDFA) {
          const pdfaPath = tempPdfPath.replace(".pdf", "_pdfa.pdf");

          const conversionOptions: PDFAConversionOptions = {
            inputPath: tempPdfPath,
            outputPath: pdfaPath,
            title: `${options.templateType} - ${options.options.filename}`,
            author: options.data.settings?.companyName || "RawaLite",
            subject: `Business ${options.templateType}`,
            keywords: ["PDF/A", "Business", options.templateType],
            creator: "RawaLite PDF Service",
            producer: "RawaLite v1.5.6 with Electron & Ghostscript",
          };

          const conversionResult = await PDFPostProcessor.convertToPDFA(
            conversionOptions
          );

          if (conversionResult.success && conversionResult.outputPath) {
            finalPdfPath = conversionResult.outputPath;
            validationResult = conversionResult.validationResult;
          } else {
            console.warn(
              "PDF/A conversion failed, using standard PDF:",
              conversionResult.error
            );
          }
        }

        // 7. Move to final location if not preview
        if (!options.options.previewOnly && finalPdfPath !== outputPdfPath) {
          fs.copyFileSync(finalPdfPath, outputPdfPath);
          finalPdfPath = outputPdfPath;
        }

        // 8. Handle preview mode
        if (options.options.previewOnly) {
          // Open PDF in external viewer for preview
          try {
            await shell.openPath(finalPdfPath);
          } catch (previewError) {
            console.warn("Could not open PDF preview:", previewError);
          }
        }

        // 9. Create result
        const fileSize = fs.statSync(finalPdfPath).size;
        const result = {
          success: true,
          filePath: options.options.previewOnly ? undefined : finalPdfPath,
          previewUrl: options.options.previewOnly
            ? `file://${finalPdfPath}`
            : undefined,
          fileSize,
          compliance: validationResult,
          message: `PDF generated successfully: ${options.options.filename}`,
        };

        console.log(
          `✅ PDF generation completed: ${
            options.options.filename
          } (${Math.round(fileSize / 1024)}KB)`
        );
        return result;
      } finally {
        // Clean up PDF window
        pdfWindow.close();

        // Robust cleanup with retry mechanism
        cleanupTempFile(tempPdfPath);
      }
    } catch (error) {
      console.error("❌ PDF generation failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown PDF generation error",
      };
    }
  }
);

// Helper: Get template file path
function getTemplatePath(templateType: string): string {
  if (isDev) {
    // Development: Templates im Projekt-Root/templates
    const rootPath = process.cwd();
    return path.join(rootPath, "templates", `${templateType}.html`);
  } else {
    // Production: Templates in extraResources/app/templates
    const resourcesPath = process.resourcesPath;
    return path.join(resourcesPath, "app", "templates", `${templateType}.html`);
  }
}

// Helper: Render template with data using simple string replacement
async function renderTemplate(
  templatePath: string,
  data: any
): Promise<string> {
  try {
    let template = fs.readFileSync(templatePath, "utf-8");

    // STEP 1: Process conditionals and loops FIRST (before variable replacement)
    console.log("🔄 Processing conditionals and loops first...");

    template = template.replace(
      /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs,
      (_match, condition, content) => {
        const value = getNestedValue(data, condition.trim());
        const result = value ? content : "";
        console.log(
          `🔄 Conditional {{#if ${condition.trim()}}}: value=${!!value}, showing=${!!result}`
        );
        return result;
      }
    );

    template = template.replace(
      /\{\{#unless\s+([^}]+)\}\}(.*?)\{\{\/unless\}\}/gs,
      (_match, condition, content) => {
        const value = getNestedValue(data, condition.trim());
        const result = !value ? content : "";
        console.log(
          `🔄 Conditional {{#unless ${condition.trim()}}}: value=${!!value}, showing=${!!result}`
        );
        return result;
      }
    );

    // Handle loops {{#each}}
    template = template.replace(
      /\{\{#each\s+([^}]+)\}\}(.*?)\{\{\/each\}\}/gs,
      (_match, arrayVar, itemTemplate) => {
        const array = getNestedValue(data, arrayVar.trim());
        console.log(
          `🔄 Loop {{#each ${arrayVar.trim()}}}: array length=${
            Array.isArray(array) ? array.length : "NOT_ARRAY"
          }`
        );

        if (!Array.isArray(array)) {
          console.log(`⚠️ {{#each}} target is not an array:`, array);
          return "";
        }

        console.log(`📋 Processing ${array.length} items in loop...`);
        return array
          .map((item, index) => {
            console.log(`  📄 Item ${index}:`, Object.keys(item || {}));

            // 🚨 CRITICAL DEBUG: Check actual values
            if (item && typeof item === "object") {
              console.log(`    🔍 Item values:`, {
                title: item.title,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
              });
            }

            return itemTemplate
              .replace(
                /\{\{this\.([^}]+)\}\}/g,
                (_match: string, prop: string) => {
                  const itemValue = String(item[prop] || "");
                  if (itemValue) {
                    console.log(`    ✅ {{this.${prop}}} = "${itemValue}"`);
                  } else {
                    console.log(
                      `    ⚠️ Empty {{this.${prop}}} (value was: ${item[prop]})`
                    );
                  }
                  return itemValue;
                }
              )
              .replace(
                /\{\{formatCurrency\s+this\.([^}]+)\}\}/g,
                (_match: string, prop: string) => {
                  // CRITICAL FIX: Handle formatCurrency within loop context
                  const amount = item[prop];
                  console.log(
                    `💰 [LOOP] Formatting currency: this.${prop} = ${amount}`
                  );
                  if (typeof amount === "number") {
                    const formatted =
                      amount.toFixed(2).replace(".", ",") + " €";
                    console.log(
                      `✅ [LOOP] Currency formatted: ${amount} → ${formatted}`
                    );
                    return formatted;
                  }
                  console.log(
                    `⚠️ [LOOP] Invalid currency value for: this.${prop}`
                  );
                  return "0,00 €";
                }
              );
          })
          .join("");
      }
    );

    // STEP 2: Handle special formatters BEFORE general variable replacement
    template = template.replace(
      /\{\{formatDate\s+([^}]+)\}\}/g,
      (_match, dateVar) => {
        const dateValue = getNestedValue(data, dateVar.trim());
        console.log(`📅 Formatting date: ${dateVar.trim()} = ${dateValue}`);
        if (dateValue) {
          try {
            const formatted = new Date(dateValue).toLocaleDateString("de-DE");
            console.log(`✅ Date formatted: ${dateValue} → ${formatted}`);
            return formatted;
          } catch (err) {
            console.error(`❌ Date formatting failed for ${dateValue}:`, err);
            return String(dateValue);
          }
        }
        console.log(`⚠️ Empty date value for: ${dateVar.trim()}`);
        return "";
      }
    );

    template = template.replace(
      /\{\{formatCurrency\s+([^}]+)\}\}/g,
      (_match, amountVar) => {
        const amount = getNestedValue(data, amountVar.trim());
        console.log(`💰 Formatting currency: ${amountVar.trim()} = ${amount}`);
        if (typeof amount === "number") {
          const formatted = amount.toFixed(2).replace(".", ",") + " €";
          console.log(`✅ Currency formatted: ${amount} → ${formatted}`);
          return formatted;
        }
        console.log(`⚠️ Invalid currency value for: ${amountVar.trim()}`);
        return "0,00 €";
      }
    );

    // STEP 3: Replace simple {{variable}} with actual values
    console.log("🔄 Starting Handlebars-like variable replacement...");
    template = template.replace(/\{\{([^}]+)\}\}/g, (_match, variable) => {
      const parts = variable.trim().split(".");
      let value = data;
      let path = "";

      for (const part of parts) {
        path += (path ? "." : "") + part;
        if (value && typeof value === "object" && part in value) {
          value = value[part];
        } else {
          console.log(
            `⚠️ Missing value for: ${variable.trim()} (failed at: ${path})`
          );
          return ""; // Return empty string for missing values
        }
      }

      const result = String(value || "");
      if (result) {
        console.log(`✅ Replaced {{${variable.trim()}}} = "${result}"`);
      } else {
        console.log(`⚠️ Empty result for {{${variable.trim()}}}`);
      }
      return result;
    });

    // STEP 4: AFTER template rendering - Apply theme colors to the FINAL HTML
    if (data.theme && data.theme.theme) {
      console.log(
        "🎨 Applying theme colors to RENDERED template:",
        data.theme.themeId
      );
      console.log("🎨 Theme colors:", data.theme.theme);

      // Direct color replacement for reliable PDF rendering
      const theme = data.theme.theme;

      // === COMPREHENSIVE COLOR REPLACEMENT STRATEGY ===
      console.log("🔄 Starting color replacements on FINAL HTML...");

      // 1. Replace PRIMARY colors (brand colors that should be theme primary)
      template = template.replace(/#1e3a2e/g, theme.primary); // Main brand color
      template = template.replace(/color: #1e3a2e/g, `color: ${theme.primary}`); // With CSS property

      // 2. Replace SECONDARY colors (text and supporting elements)
      template = template.replace(/#0f2419/g, theme.secondary); // Secondary brand
      template = template.replace(/color: #333/g, `color: ${theme.secondary}`);
      template = template.replace(/color: #666/g, `color: ${theme.secondary}`);
      template = template.replace(/color: #555/g, `color: ${theme.secondary}`);

      // 3. Replace ACCENT colors (highlights and active elements)
      template = template.replace(/#10b981/g, theme.accent); // Accent color

      // 4. Replace BORDERS with theme-based transparency
      template = template.replace(
        /border-bottom: 1px solid #e0e0e0/g,
        `border-bottom: 1px solid ${theme.primary}33`
      );
      template = template.replace(
        /border-top: 1px solid #e0e0e0/g,
        `border-top: 1px solid ${theme.primary}33`
      );
      template = template.replace(
        /border: 1px solid #d0d0d0/g,
        `border: 1px solid ${theme.primary}44`
      );
      template = template.replace(
        /border-right: 1px solid #e0e0e0/g,
        `border-right: 1px solid ${theme.primary}33`
      );
      template = template.replace(
        /border-top: 2px solid #1e3a2e/g,
        `border-top: 2px solid ${theme.primary}`
      );
      template = template.replace(
        /border-bottom: 1px solid #ccc/g,
        `border-bottom: 1px solid ${theme.primary}66`
      );

      // 5. Replace BACKGROUND colors with theme-based transparency
      template = template.replace(
        /background-color: #f8f9fa/g,
        `background-color: ${theme.primary}11`
      );
      template = template.replace(
        /background-color: #fafafa/g,
        `background-color: ${theme.primary}08`
      );

      // 6. ADDITIONAL COMPREHENSIVE REPLACEMENTS (from template analysis)
      // These are ALL colors found in the template that should be themed:

      // Text colors that should match theme
      template = template.replace(/color: #000/g, `color: ${theme.secondary}`); // Black text to theme secondary

      // All border variations found in template
      template = template.replace(
        /1px solid #e0e0e0/g,
        `1px solid ${theme.primary}33`
      );
      template = template.replace(
        /1px solid #d0d0d0/g,
        `1px solid ${theme.primary}44`
      );
      template = template.replace(
        /1px solid #ccc/g,
        `1px solid ${theme.primary}66`
      );
      template = template.replace(
        /2px solid #1e3a2e/g,
        `2px solid ${theme.primary}`
      );

      // Background variations
      template = template.replace(/#f8f9fa/g, `${theme.primary}11`); // Table header background
      template = template.replace(/#fafafa/g, `${theme.primary}08`); // Sub-item background

      // ✨ FINAL CATCH-ALL: Replace any remaining #1e3a2e instances
      template = template.replace(/#1e3a2e/g, theme.primary);

      console.log(
        "✅ Applied COMPREHENSIVE color replacements to FINAL HTML for theme:",
        theme.primary,
        theme.secondary,
        theme.accent
      );
      console.log(
        "🔍 Total replacements: Primary brand, text colors, borders, backgrounds"
      );
      console.log(
        "📄 Template length after replacements:",
        template.length,
        "characters"
      );
    } else {
      console.log(
        "⚠️ No theme data provided or incorrect structure:",
        data.theme
      );
    }

    return template;
  } catch (error) {
    console.error("Template rendering failed:", error);
    throw new Error(
      `Template rendering failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Helper: Get nested object value by dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, prop) => {
    return current && typeof current === "object" ? current[prop] : undefined;
  }, obj);
}

// IPC Handler für PDF-Status
ipcMain.handle("pdf:getStatus", async () => {
  try {
    const capabilities = await PDFPostProcessor.getSystemCapabilities();
    return {
      electronAvailable: true,
      ...capabilities,
    };
  } catch (error) {
    console.error("Failed to get PDF status:", error);
    return {
      electronAvailable: true,
      ghostscriptAvailable: false,
      veraPDFAvailable: false,
      pdfa2bSupported: false,
    };
  }
});

// Helper: Robust temporary file cleanup with retry mechanism
function cleanupTempFile(filePath: string): void {
  const maxRetries = 5;
  const retryDelay = 2000; // Start with 2 seconds

  function attemptCleanup(retryCount: number = 0): void {
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(
            `✅ Cleaned up temporary PDF file: ${path.basename(filePath)}`
          );
        }
      } catch (error) {
        if (retryCount < maxRetries) {
          console.log(
            `⏳ Retry ${
              retryCount + 1
            }/${maxRetries} - PDF file still locked, retrying in ${
              retryDelay * (retryCount + 1)
            }ms...`
          );
          attemptCleanup(retryCount + 1);
        } else {
          // Final attempt failed - log warning but don't crash
          console.warn(
            `⚠️ Could not clean up temporary PDF file after ${maxRetries} attempts:`,
            path.basename(filePath)
          );
          console.warn(
            "File may be opened in external viewer. Manual cleanup may be required."
          );

          // Optional: Try to schedule cleanup for later (when app closes)
          const cleanupOnExit = () => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(
                  `✅ Cleaned up temporary file on app exit: ${path.basename(
                    filePath
                  )}`
                );
              }
            } catch (e) {
              // Silent fail on exit cleanup
            }
          };

          // Schedule cleanup when app is about to quit
          app.once("before-quit", cleanupOnExit);
        }
      }
    }, retryDelay * (retryCount + 1)); // Exponential backoff
  }

  attemptCleanup();
}

// IPC Handler für Log-Export
ipcMain.handle("app:exportLogs", async () => {
  try {
    const logPath = log.transports.file.getFile().path;
    const userData = app.getPath("userData");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const exportPath = path.join(userData, `rawalite-logs-${timestamp}.log`);

    log.info("LOG-EXPORT: Starting log export process...");

    // Check if log file exists
    if (!fs.existsSync(logPath)) {
      log.warn("LOG-EXPORT: No log file found at:", logPath);
      return {
        success: false,
        error: "Log-Datei nicht gefunden",
      };
    }

    // Copy log file to export location
    await fs.promises.copyFile(logPath, exportPath);

    log.info("LOG-EXPORT: Log file copied to:", exportPath);

    // Show dialog to reveal file in explorer
    const result = await dialog.showMessageBox({
      type: "info",
      title: "Logs exportiert",
      message: "Debug-Logs wurden erfolgreich exportiert.",
      detail: `Gespeichert unter:\n${exportPath}`,
      buttons: ["Im Explorer anzeigen", "OK"],
    });

    if (result.response === 0) {
      // Show in explorer
      shell.showItemInFolder(exportPath);
    }

    return {
      success: true,
      filePath: exportPath,
    };
  } catch (error) {
    log.error("LOG-EXPORT: Export failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
});

// Lifecycle-Logging (hilft bei Race-Conditions)
// Lifecycle events - Interactive Installer System
app.on("will-quit", () => { try { log.info("[LIFECYCLE] app will-quit"); } catch {} });
app.on("quit", (_e, _c) => { try { log.info("[LIFECYCLE] app quit"); } catch {} });
process.on("beforeExit", (code) => { try { log.info(`[LIFECYCLE] process beforeExit code=${code}`); } catch {} });
process.on("exit", (code) => { try { log.info(`[LIFECYCLE] process exit code=${code}`); } catch {} });

app.whenReady().then(() => {
  // Sentinel system entfernt - Interactive Installer System braucht das nicht

  createMenu();
  createWindow();

  // Initialize theme integration
  loadThemeIntegration();

  // Initialize backup system
  initializeBackupSystem();

  // Initialize logo system (using consolidated ./logo implementation)
  initializeLogoSystem();

  // Auto-check for updates on startup (delayed to avoid blocking app start)
  setTimeout(async () => {
    if (!app.isPackaged) {
      log.info("Skipping startup update check in development mode");
      return;
    }
    
    log.info("Starting automatic update check on app ready");
    try {
      const manifest = await fetchUpdateManifest();
      if (manifest) {
        const { isNewerVersion } = await import('../src/services/semver.js');
        const hasUpdate = isNewerVersion(manifest.version, pkg.version);
        
        if (hasUpdate) {
          log.info(`Startup: Update available: ${manifest.version}`);
          // Store for later use
          currentUpdateManifest = manifest;
        } else {
          log.info("Startup: No updates available");
        }
      } else {
        log.warn("Startup update check failed: Could not fetch manifest");
      }
    } catch (err) {
      log.warn("Startup update check failed:", err instanceof Error ? err.message : err);
    }
  }, 5000); // 5 second delay
});
app.on("window-all-closed", () => {
  log.info("All windows closed");
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  log.info("App activated");
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on("before-quit", (_event) => {
  log.info("App is about to quit");
});
app.on("will-quit", (_event) => {
  log.info("App will quit");
});
