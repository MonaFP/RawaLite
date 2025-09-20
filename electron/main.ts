// electron/main.ts
import { app, BrowserWindow, shell, ipcMain, Menu, dialog } from "electron";
import log from "electron-log";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import pkg from "../package.json" assert { type: "json" };

// 🔧 FIXED: Disable automatic update-electron-app initialization for NSIS builds
// update-electron-app expects Squirrel, but we use NSIS - causes "Can not find Squirrel" error
// We keep our GitHub API-based update system instead
try {
  // updateElectronApp() disabled - our GitHub API system works better for NSIS
  log.info("✅ update-electron-app disabled (using GitHub API system for NSIS builds)");
} catch (error) {
  log.error("❌ update-electron-app initialization failed:", error);
}
import {
  PDFPostProcessor,
  PDFAConversionOptions,
} from "../src/services/PDFPostProcessor";
import { initializeBackupSystem } from "./backup";
import { initializeLogoSystem } from "./logo";

// === SINGLE INSTANCE LOCK ===
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this instance
  log.info("Another instance is already running, quitting...");
  app.quit();
} else {
  // Handle second instance attempt - focus existing window
  app.on("second-instance", (event, commandLine, workingDirectory) => {
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

// === AUTO-UPDATER CONFIGURATION ===
// Configure enhanced logging
log.transports.file.level = "debug";
log.transports.file.maxSize = 1024 * 1024 * 10; // 10MB max log file
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.console.level = "debug";

// � CUSTOM UPDATE SYSTEM: All autoUpdater configuration disabled - using GitHub API
// DISABLED: autoUpdater.logger = log;
// DISABLED: autoUpdater.autoDownload = false; // User confirmation required - keeps UX control
// DISABLED: autoUpdater.autoInstallOnAppQuit = false; // Manual installation with user confirmation
// DISABLED: autoUpdater.allowDowngrade = false; // Prevent version downgrades for stability
// DISABLED: autoUpdater.allowPrerelease = false; // Stable releases only
// DISABLED: autoUpdater.disableWebInstaller = true; // Disable web installer fallback
// DISABLED: autoUpdater.forceDevUpdateConfig = false; // Production behavior always

// DISABLED: 🌐 NETWORK OPTIMIZATION: Ensure HTTP/1.1 for stable downloads
// DISABLED: autoUpdater.requestHeaders = {
//   "User-Agent": "RawaLite-Updater/1.0",
//   "Cache-Control": "no-cache",
//   "Connection": "keep-alive"
// };

// DISABLED: 🔧 DOWNLOAD OPTIMIZATION: Configure HTTP executor for stability
// DISABLED: try {
//   Object.defineProperty(autoUpdater, 'httpExecutor', {
//     get() {
//       const { HttpExecutor } = require("builder-util-runtime");
//       const executor = new HttpExecutor();
//       
//       // Force stable HTTP configuration
//       const originalRequest = executor.request;
//       if (originalRequest) {
//         executor.request = (options: any, cancellationToken: any, data: any) => {
//           // Ensure HTTP/1.1 to avoid protocol errors  
//           options.protocol = 'https:';
//           options.method = options.method || 'GET';
//           
//           return originalRequest.call(executor, options, cancellationToken, data);
//         };
//       }
//       
//       return executor;
//     }
//   });
//   log.info("✅ [NATIVE-UPDATE] HTTP executor configured for stable downloads");
// } catch (error) {
//   log.warn("⚠️ [NATIVE-UPDATE] HTTP executor configuration failed, using defaults:", error);
// }

// 🔍 ENHANCED DEBUG: Comprehensive environment logging
log.info("=== AUTO-UPDATER ENVIRONMENT DEBUG ===");
log.info("App Version:", pkg.version); // 🔧 FIXED: Use pkg.version instead of app.getVersion() for correct app version
log.info("App Name:", app.getName());
log.info("Product Name:", app.getName());
log.info("App ID:", "com.rawalite.app");
log.info("Is Packaged:", app.isPackaged);
log.info("Platform:", process.platform, process.arch);
log.info("Electron Version:", process.versions.electron);
log.info("Node Version:", process.versions.node);
log.info("App Path:", app.getAppPath());
log.info("User Data Path:", app.getPath("userData"));
log.info(
  "Auto-updater feed URL will be:",
  "https://github.com/MonaFP/RawaLite"
);
// 🔧 REPLACED: These settings are now handled by update-electron-app
/*
log.info("autoDownload setting:", autoUpdater.autoDownload);
log.info("autoInstallOnAppQuit setting:", autoUpdater.autoInstallOnAppQuit);
log.info("allowDowngrade setting:", autoUpdater.allowDowngrade);
log.info("allowPrerelease setting:", autoUpdater.allowPrerelease);
log.info("disableWebInstaller setting:", autoUpdater.disableWebInstaller);
*/

// === AUTO-UPDATER STATE MANAGEMENT ===
let isUpdateAvailable = false;
let currentUpdateInfo: any = null;

// � NATIVE UPDATE SYSTEM: Reaktivierte electron-updater Events für vollständige in-app Updates
// Auto-updater events für IPC-Kommunikation
// DISABLED: autoUpdater.on("checking-for-update", () => {
//   log.info("🔍 [NATIVE-UPDATE] Starting update check...");
//   log.info("🔍 [NATIVE-UPDATE] Current app version:", app.getVersion());
//   log.info("🔍 [NATIVE-UPDATE] Checking against GitHub releases API");
//   // Reset state when starting new check
//   isUpdateAvailable = false;
//   currentUpdateInfo = null;
//   sendUpdateMessage("checking-for-update");
// });

// DISABLED: autoUpdater.on("update-available", (info) => {
//   log.info("✅ [NATIVE-UPDATE] Update available!");
//   log.info("📦 [UPDATE-AVAILABLE] Available version:", info.version);
//   log.info("📦 [UPDATE-AVAILABLE] Current version:", app.getVersion());
//   log.info(
//     "📦 [UPDATE-AVAILABLE] Release notes length:",
//     info.releaseNotes?.length || 0
//   );
//   log.info("📦 [UPDATE-AVAILABLE] Release date:", info.releaseDate);
//   log.info(
//     "📦 [UPDATE-AVAILABLE] Files to download:",
//     JSON.stringify(info.files, null, 2)
//   );
//   if (info.files && info.files[0]) {
//     log.info(
//       "📦 [UPDATE-AVAILABLE] Download size:",
//       info.files[0].size,
//       "bytes"
//     );
//     log.info("📦 [UPDATE-AVAILABLE] Download URL:", info.files[0].url);
//     log.info("📦 [UPDATE-AVAILABLE] SHA512:", info.files[0].sha512);
//   }
//   // Store state for download phase
//   isUpdateAvailable = true;
//   currentUpdateInfo = info;
//   sendUpdateMessage("update-available", {
//     version: info.version,
//     releaseNotes: info.releaseNotes,
//     releaseDate: info.releaseDate,
//   });
// });

// DISABLED: autoUpdater.on("update-not-available", (info) => {
//   log.info("❌ [NATIVE-UPDATE] Update not available");
//   log.info("❌ [UPDATE-NOT-AVAILABLE] Current version:", app.getVersion());
//   log.info(
//     "❌ [UPDATE-NOT-AVAILABLE] Latest version:",
//     info?.version || "unknown"
//   );
//   log.info(
//     "❌ [UPDATE-NOT-AVAILABLE] Full info:",
//     JSON.stringify(info, null, 2)
//   );
//   // Reset state when no update available
//   isUpdateAvailable = false;
//   currentUpdateInfo = null;
//   sendUpdateMessage("update-not-available", info);
// });

// DISABLED: autoUpdater.on("error", (err) => {
//   log.error("💥 [NATIVE-UPDATE-ERROR] Update system error occurred!");
//   log.error("💥 [UPDATE-ERROR] Error type:", err.constructor.name);
//   log.error("💥 [UPDATE-ERROR] Error message:", err.message);
//   log.error("💥 [UPDATE-ERROR] Error code:", (err as any).code);
//   log.error("💥 [UPDATE-ERROR] Error stack:", err.stack);
//   log.error("💥 [UPDATE-ERROR] Current app version:", app.getVersion());
//   log.error("💥 [UPDATE-ERROR] App is packaged:", app.isPackaged);
//   
//   // 🔧 ENHANCED FIX: Handle verschiedene Update-Fehler mit spezifischen Fallbacks
//   if (err.message.includes("ERR_HTTP2_PROTOCOL_ERROR") || 
//       err.message.includes("net::ERR_HTTP2_PROTOCOL_ERROR")) {
//     log.error("🌐 [HTTP2-ERROR] Detected HTTP/2 protocol error - fallback to GitHub browser redirect");
//     sendUpdateMessage("update-error", {
//       message: "Netzwerkfehler beim Download. GitHub-Browser-Redirect wird verwendet.",
//       type: "network_error", 
//       code: "HTTP2_PROTOCOL_ERROR",
//       fallbackToBrowser: true
//     });
//     return;
//   }
//   
//   sendUpdateMessage("update-error", {
//     message: err.message,
//     stack: err.stack,
//     code: (err as any).code,
//   });
// });

// DISABLED: autoUpdater.on("download-progress", (progressObj) => {
//   const percent = Math.round(progressObj.percent * 100) / 100;
//   const speedMBps =
//     Math.round((progressObj.bytesPerSecond / 1024 / 1024) * 100) / 100;

//   // Log every 5% or at critical checkpoints
//   if (percent % 5 < 0.1 || (percent >= 74 && percent <= 76)) {
//     log.info(`📥 [NATIVE-DOWNLOAD] ${percent}% - ${speedMBps} MB/s`);
//     log.info(
//       `📥 [NATIVE-DOWNLOAD] ${progressObj.transferred}/${progressObj.total} bytes`
//     );

//     // Special logging for the problematic 74% range
//     if (percent >= 74 && percent <= 76) {
//       log.info(
//         "⚠️ [DOWNLOAD-CRITICAL] Entering 74-76% range - potential checksum validation phase"
//       );
//       log.info(
//         "⚠️ [DOWNLOAD-CRITICAL] This phase may take longer due to differential download validation"
//       );
//     }
//   }

//   sendUpdateMessage("download-progress", {
//     percent: Math.round(progressObj.percent),
//     transferred: progressObj.transferred,
//     total: progressObj.total,
//     bytesPerSecond: progressObj.bytesPerSecond,
//   });
// });

// DISABLED: autoUpdater.on("update-downloaded", (info) => {
//   log.info("🎉 [NATIVE-UPDATE-DOWNLOADED] Update successfully downloaded!");
//   log.info("🎉 [UPDATE-DOWNLOADED] Downloaded version:", info.version);
//   log.info("🎉 [UPDATE-DOWNLOADED] Current version:", app.getVersion());
//   log.info(
//     "🎉 [UPDATE-DOWNLOADED] Download completed at:",
//     new Date().toISOString()
//   );
//   log.info(
//     "🎉 [UPDATE-DOWNLOADED] Files info:",
//     JSON.stringify(info.files, null, 2)
//   );
//   log.info("🎉 [UPDATE-DOWNLOADED] Ready for quitAndInstall()");
//   sendUpdateMessage("update-downloaded", {
//     version: info.version,
//     releaseNotes: info.releaseNotes,
//   });
// });

// Helper function to send update messages to renderer
function sendUpdateMessage(type: string, data?: any) {
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((window) => {
    window.webContents.send("updater:message", { type, data });
  });
}

// 🚀 NATIVE UPDATE SYSTEM: IPC Handlers für vollständige in-app Updates
ipcMain.handle("updater:check-for-updates", async () => {
  try {
    log.info("🔍 [NATIVE-UPDATE] Manual update check requested via IPC");
    
    // Development mode check
    if (!app.isPackaged) {
      log.info("🔧 [DEV-MODE] Update check skipped in development");
      return {
        success: false,
        devMode: true,
        error: "Update-System ist im Development-Modus deaktiviert"
      };
    }

    // DISABLED: Use electron-updater for native update check
    // log.info("🚀 [NATIVE-UPDATE] Starting native electron-updater check");
    
    // const updateCheckResult = await autoUpdater.checkForUpdates();
    
    // if (updateCheckResult && updateCheckResult.updateInfo) {
    //   log.info("✅ [NATIVE-UPDATE] electron-updater check completed successfully");
    //   
    //   // 🔧 CRITICAL FIX: Set global variables for download handler
    //   isUpdateAvailable = true;
    //   currentUpdateInfo = updateCheckResult.updateInfo;
    //   
    //   log.info(`🔍 [NATIVE-UPDATE] Update available: ${currentUpdateInfo.version}`);
    //   
    //   return { 
    //     success: true,
    //     updateInfo: updateCheckResult.updateInfo
    //   };
    // } else {
    //   log.info("❌ [NATIVE-UPDATE] No update available via electron-updater");
    //   
    //   // 🔧 CRITICAL FIX: Clear global variables when no update
    //   isUpdateAvailable = false;
    //   currentUpdateInfo = null;
    //   
    //   return { 
    //     success: true,
    //     noUpdate: true 
    //   };
    // }
    
    // Fallback to GitHub API since electron-updater is disabled
    log.info("🔄 [FALLBACK] Using GitHub API for update checks");
    return await checkForUpdatesViaGitHub();
    
  } catch (error) {
    log.error("💥 [UPDATE-ERROR] Update check failed:", error);
    
    // Fallback to GitHub API if anything fails
    log.info("🔄 [FALLBACK] Trying GitHub API as fallback");
    return await checkForUpdatesViaGitHub();
  }
});

// 🔧 CRITICAL FIX: Gemeinsame GitHub API Update-Check Funktion
async function checkForUpdatesViaGitHub() {
  try {
    log.info("Checking for updates via GitHub API (bypassing electron-updater)");
    
    // 🔧 FIXED: Notify UI that update check is starting
    sendUpdateMessage("checking-for-update");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch("https://api.github.com/repos/MonaFP/RawaLite/releases/latest", {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RawaLite-UpdateChecker/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
    }
    
    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');
    const currentVersion = pkg.version; // 🔧 FIX: Use unified version system (package.json)
    
    log.info(`Current version: ${currentVersion}, Latest version: ${latestVersion}`);
    
    const updateAvailable = compareVersions(currentVersion, latestVersion) < 0;
    
    // 🔧 CRITICAL FIX: Set global variables for download handler
    if (updateAvailable) {
      const updateInfo = {
        version: latestVersion,
        releaseNotes: release.body || "Neue Version verfügbar",
        releaseDate: release.published_at,
        downloadUrl: release.html_url
      };
      
      // 🚨 CRITICAL: Set global state for download handler
      isUpdateAvailable = true;
      currentUpdateInfo = updateInfo;
      
      sendUpdateMessage("update-available", updateInfo);
      log.info("✅ Update available - UI notified");
    } else {
      // 🚨 CRITICAL: Reset global state when no update
      isUpdateAvailable = false;
      currentUpdateInfo = null;
      
      sendUpdateMessage("update-not-available", { version: latestVersion });
      log.info("✅ No updates available - UI notified");
    }
    
    return {
      success: true,
      updateInfo: isUpdateAvailable ? {
        version: latestVersion,
        releaseNotes: release.body || "Neue Version verfügbar",
        releaseDate: release.published_at,
        downloadUrl: release.html_url
      } : null,
      hasUpdate: isUpdateAvailable
    };
    
  } catch (error) {
    log.error("GitHub API update check failed:", error);
    
    // 🔧 FIXED: Notify UI about update check errors
    sendUpdateMessage("update-error", {
      message: error instanceof Error ? error.message : "Update check failed",
      type: "github_api_error"
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update check failed",
      hasUpdate: false
    };
  }
}

// Simple version comparison helper
function compareVersions(current: string, latest: string): number {
  const parseVersion = (v: string) => v.split('.').map(n => parseInt(n, 10));
  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (currentPart < latestPart) return -1;
    if (currentPart > latestPart) return 1;
  }
  return 0;
}

ipcMain.handle("updater:start-download", async () => {
  try {
    log.info("🚀 [NATIVE-UPDATE] Starting native download via electron-updater");

    // Development mode check
    if (!app.isPackaged) {
      log.info("🔧 [DEV-MODE] Download skipped in development");
      return {
        success: false,
        error: "Download-System ist im Development-Modus deaktiviert"
      };
    }

    // 🚨 CRITICAL FIX: Check if update is available before download
    if (!isUpdateAvailable || !currentUpdateInfo) {
      log.error("❌ [NATIVE-DOWNLOAD] Cannot download: No update available or check not performed");
      return {
        success: false,
        error: "Bitte prüfe zuerst auf Updates bevor der Download gestartet wird",
      };
    }

    // DISABLED: Use electron-updater for native download
    // log.info("� [NATIVE-DOWNLOAD] Starting electron-updater download");
    // log.info("📥 [NATIVE-DOWNLOAD] Target version:", currentUpdateInfo.version);
    
    // Fallback to GitHub browser redirect since electron-updater is disabled
    log.info("🔄 [FALLBACK] Using GitHub browser redirect for downloads");
    
    try {
      // await autoUpdater.downloadUpdate();
      // log.info("✅ [NATIVE-DOWNLOAD] Download initiated successfully");
      
      // return {
      //   success: true,
      //   message: "Download gestartet - Fortschritt wird in der UI angezeigt"
      // };
      
    } catch (nativeError) {
      log.error("💥 [NATIVE-DOWNLOAD-ERROR] electron-updater download failed:", nativeError);
      
      // Fallback to GitHub browser redirect if native download fails
      log.info("🔄 [FALLBACK] Falling back to GitHub browser redirect");
      
      const releaseUrl = `https://github.com/MonaFP/RawaLite/releases/tag/v${currentUpdateInfo.version}`;
      log.info(`🌐 [FALLBACK] Opening GitHub release page: ${releaseUrl}`);
      
      await shell.openExternal(releaseUrl);
      
      // Notify UI about fallback redirect
      sendUpdateMessage("download-progress", {
        percent: 100,
        transferred: 1,
        total: 1,
        bytesPerSecond: 0,
        fallback: true
      });
      
      // Simulate fallback download completion
      setTimeout(() => {
        sendUpdateMessage("update-downloaded", {
          version: currentUpdateInfo?.version,
          downloadMethod: "github_fallback"
        });
      }, 1000);
      
      return { 
        success: true, 
        method: "github_fallback",
        url: releaseUrl,
        message: "Fallback zu GitHub-Download verwendet"
      };
    }
    
  } catch (error) {
    log.error("💥 [NATIVE-DOWNLOAD-ERROR] Download system failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download fehlgeschlagen",
    };
  }
});

// � NATIVE UPDATE SYSTEM: Installation mit electron-updater quitAndInstall
ipcMain.handle("updater:quit-and-install", async () => {
  try {
    log.info("🚀 [NATIVE-INSTALL] Starting installation process");
    log.info("🚀 [NATIVE-INSTALL] Current app version:", app.getVersion());

    // Development mode check
    if (!app.isPackaged) {
      log.info("🔧 [DEV-MODE] Installation skipped in development");
      return {
        success: false,
        error: "Installations-System ist im Development-Modus deaktiviert"
      };
    }

    // Check if update is downloaded and ready
    if (!isUpdateAvailable || !currentUpdateInfo) {
      log.error("🚀 [INSTALL-ERROR] No update available for installation");
      return {
        success: false,
        error: "Kein Update verfügbar. Bitte zuerst nach Updates suchen und herunterladen.",
      };
    }

    // DISABLED: � NATIVE INSTALLATION: Use electron-updater's quitAndInstall
    // log.info("🚀 [NATIVE-INSTALL] Attempting native installation via electron-updater");
    
    // Fallback to manual installation since electron-updater is disabled
    log.info("🔄 [FALLBACK] Using manual installation guidance");
    
    try {
      // DISABLED: Native installation with electron-updater
      // autoUpdater.quitAndInstall();
      
      // log.info("✅ [NATIVE-INSTALL] Installation initiated successfully - app should restart");
      // return { 
      //   success: true, 
      //   action: 'native_install',
      //   message: "Installation gestartet - App wird automatisch neu gestartet"
      // };
      
    } catch (nativeError) {
      log.error("💥 [NATIVE-INSTALL-ERROR] electron-updater installation failed:", nativeError);
      
      // Fallback to manual installation guidance
      log.info("🔄 [FALLBACK] Falling back to manual installation guidance");
      
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'RawaLite Update - Manuelle Installation',
        message: `Update auf Version ${currentUpdateInfo.version} verfügbar`,
        detail: 'Die automatische Installation ist fehlgeschlagen. Bitte führen Sie das Setup manuell aus:\n\n' +
                '1. Laden Sie das Setup von GitHub herunter\n' +
                '2. Führen Sie die Datei aus\n' +
                '3. Ihre Daten bleiben erhalten\n\n' +
                'Die neuen Features werden nach der Installation verfügbar sein.',
        buttons: ['GitHub öffnen', 'App beenden', 'Später'],
        defaultId: 0,
        cancelId: 2
      });

      switch (result.response) {
        case 0: // GitHub öffnen
          const releaseUrl = `https://github.com/MonaFP/RawaLite/releases/tag/v${currentUpdateInfo.version}`;
          await shell.openExternal(releaseUrl);
          return { success: true, action: 'github_opened', method: 'manual_fallback' };
          
        case 1: // App beenden
          log.info("🚀 [MANUAL-INSTALL] User chose to quit app for manual installation");
          app.quit();
          return { success: true, action: 'app_quit', method: 'manual_fallback' };
          
        case 2: // Später
          return { success: true, action: 'postponed', method: 'manual_fallback' };
          
        default:
          return { success: true, action: 'cancelled', method: 'manual_fallback' };
      }
    }
    
  } catch (error) {
    log.error("💥 [NATIVE-INSTALL-ERROR] Installation system failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Installation fehlgeschlagen",
    };
  }
});

// 🧪 DEVELOPMENT TEST: Force-simulate update for download handler testing
ipcMain.handle("updater:force-test-update", async () => {
  log.info("🧪 [TEST] Forcing test update simulation for download handler validation");
  
  // Künstlich setze Update-State für Test
  isUpdateAvailable = true;
  currentUpdateInfo = {
    version: "1.8.37",
    releaseNotes: "🧪 TEST UPDATE - Download-Handler Validation",
    releaseDate: new Date().toISOString(),
    downloadUrl: "https://github.com/MonaFP/RawaLite/releases/tag/v1.8.37"
  };
  
  // Benachrichtige UI über simuliertes Update
  sendUpdateMessage("update-available", currentUpdateInfo);
  
  log.info("✅ [TEST] Test update state forced - Download button should now work");
  
  return {
    success: true,
    testUpdate: currentUpdateInfo,
    message: "Test-Update simuliert - Download-Button sollte jetzt funktionieren"
  };
});

// � DEPRECATED: updater:get-version handler removed in favor of unified version:get API (v1.8.44+)
// Use window.rawalite.version.get() in renderer process instead

// PDF Theme Integration Import
// Note: Import path needs compilation compatibility
const pdfThemesPath = path.join(__dirname, "..", "src", "lib", "pdfThemes.ts");
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
              // 🔧 CRITICAL FIX: Menu auch auf GitHub API Bypass umstellen
              const result = await checkForUpdatesViaGitHub();
              if (result.success && result.hasUpdate) {
                log.info(`Update available: ${result.updateInfo?.version}`);
                // Show update notification or open update window
              } else if (result.success) {
                log.info("No updates available");
              } else {
                log.error("Menu update check failed:", result.error);
              }
            } catch (err) {
              log.error("Menu update check failed:", err);
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

// 🔧 UNIFIED VERSION API - Single Source of Truth (package.json)
// Replaces multiple version handlers with single source of truth from package.json
ipcMain.handle("version:get", () => {
  log.info(`[version:get] Returning unified version data: app=${pkg.version}, electron=${process.versions.electron}`);
  return {
    app: pkg.version,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  };
});

// � DEPRECATED: app:getVersion handler kept for backward compatibility only
// Use window.rawalite.version.get() for new code instead (unified version system v1.8.44+)
ipcMain.handle("app:getVersion", async () => {
  console.warn("⚠️ DEPRECATED: app:getVersion used - migrate to version:get API");
  
  // For backward compatibility, return pkg.version (same as version:get)
  return pkg.version;
});

// 🚀 CUSTOM IN-APP UPDATER - Replace electron-updater with own implementation

// Check for updates via custom update.json manifest
ipcMain.handle("updater:check", async () => {
  try {
    log.info("🔄 [CUSTOM-UPDATER] Checking for updates via GitHub update.json");
    
    const currentVersion = pkg.version;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // First try to get update.json directly from latest release
    let updateManifest: any = null;
    
    try {
      // Try to fetch update.json from latest release assets
      const releaseResponse = await fetch("https://api.github.com/repos/MonaFP/RawaLite/releases/latest", {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RawaLite-CustomUpdater/1.0'
        },
        signal: controller.signal
      });
      
      if (releaseResponse.ok) {
        const releaseData = await releaseResponse.json();
        const updateJsonAsset = releaseData.assets?.find((a: any) => a.name === 'update.json');
        
        if (updateJsonAsset) {
          const updateJsonResponse = await fetch(updateJsonAsset.browser_download_url, {
            headers: { 'User-Agent': 'RawaLite-CustomUpdater/1.0' },
            signal: controller.signal
          });
          
          if (updateJsonResponse.ok) {
            updateManifest = await updateJsonResponse.json();
            log.info("✅ [CUSTOM-UPDATER] Found update.json manifest");
          }
        }
      }
    } catch (error) {
      log.warn("⚠️ [CUSTOM-UPDATER] Could not fetch update.json, falling back to GitHub API");
    }
    
    // Fallback: Use GitHub API to construct manifest
    if (!updateManifest) {
      const response = await fetch("https://api.github.com/repos/MonaFP/RawaLite/releases/latest", {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RawaLite-CustomUpdater/1.0'
        },
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      const latestVersion = data.tag_name?.replace('v', '') || data.name?.replace('v', '');
      
      // Find the Windows executable asset
      const asset = data.assets?.find((a: any) => 
        a.name?.includes('Setup') && a.name?.endsWith('.exe')
      );
      
      if (asset) {
        updateManifest = {
          product: "RawaLite",
          channel: "stable", 
          version: latestVersion,
          releasedAt: data.published_at || new Date().toISOString(),
          notes: data.body || 'Keine Release Notes verfügbar.',
          files: [{
            kind: "nsis",
            arch: "x64",
            name: asset.name,
            size: asset.size,
            sha512: "", // Will be empty for fallback
            url: asset.browser_download_url
          }]
        };
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!updateManifest) {
      return {
        hasUpdate: false,
        current: currentVersion
      };
    }
    
    // Import semver comparison
    const { isNewerVersion } = await import('../src/services/semver.js');
    const hasUpdate = isNewerVersion(updateManifest.version, currentVersion);
    
    log.info(`🔄 [CUSTOM-UPDATER] Current: ${currentVersion}, Latest: ${updateManifest.version}, HasUpdate: ${hasUpdate}`);
    
    return {
      hasUpdate,
      current: currentVersion,
      target: hasUpdate ? updateManifest : undefined
    };
    
  } catch (error) {
    log.error("❌ [CUSTOM-UPDATER] Update check failed:", error);
    return {
      hasUpdate: false,
      current: pkg.version,
      error: error instanceof Error ? error.message : 'Update-Prüfung fehlgeschlagen'
    };
  }
});

// Download update file with SHA512 verification
ipcMain.handle("updater:download", async (event, url: string) => {
  try {
    log.info("🔽 [CUSTOM-UPDATER] Starting download:", url);
    
    const https = await import('https');
    const crypto = await import('crypto');
    
    // Create download directory in %LOCALAPPDATA%
    const downloadDir = path.join(os.homedir(), 'AppData', 'Local', 'rawalite-updater', 'pending');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const fileName = path.basename(url);
    const filePath = path.join(downloadDir, fileName);
    
    // Remove existing file if present
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          if (response.headers.location) {
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
        
        const totalSize = parseInt(response.headers['content-length'] || '0');
        let downloadedSize = 0;
        let lastProgressTime = Date.now();
        const startTime = Date.now();
        
        const fileStream = fs.createWriteStream(filePath);
        const hash = crypto.createHash('sha512');
        
        response.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;
          hash.update(chunk);
          
          // Send progress updates
          const now = Date.now();
          if (now - lastProgressTime > 200) { // Throttle to 200ms
            const percent = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
            const speed = downloadedSize / ((now - startTime) / 1000); // bytes per second
            const etaSec = speed > 0 ? (totalSize - downloadedSize) / speed : 0;
            
            const mainWindow = BrowserWindow.getAllWindows()[0];
            if (mainWindow) {
              mainWindow.webContents.send('updater:progress', {
                percent: Math.round(percent * 100) / 100,
                transferred: downloadedSize,
                total: totalSize,
                speed,
                etaSec
              });
            }
            
            lastProgressTime = now;
          }
        });
        
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          const calculatedHash = hash.digest('base64');
          
          log.info(`✅ [CUSTOM-UPDATER] Download completed: ${filePath}`);
          log.info(`📊 [CUSTOM-UPDATER] Size: ${downloadedSize} bytes`);
          log.info(`🔐 [CUSTOM-UPDATER] SHA512 (Base64): ${calculatedHash}`);
          
          // TODO: Verify hash against manifest if available
          // For now, we trust the download from GitHub
          
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
      
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  } catch (error) {
    log.error("❌ [CUSTOM-UPDATER] Download failed:", error);
    throw error;
  }
});

// Install update (start installer and quit app)
ipcMain.handle("updater:install", async (_, exePath: string) => {
  try {
    log.info("Starting update installation:", exePath);
    
    if (!fs.existsSync(exePath)) {
      throw new Error('Installer-Datei nicht gefunden');
    }
    
    const { spawn } = await import('child_process');
    
    // Start installer detached
    spawn('cmd', ['/c', 'start', '', `"${exePath}"`], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    
    // Quit app so installer can proceed
    setTimeout(() => {
      app.quit();
    }, 1000);
    
    return { success: true };
  } catch (error) {
    log.error("Installation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Installation fehlgeschlagen',
    };
  }
});

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
    event,
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
      (match, condition, content) => {
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
      (match, condition, content) => {
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
      (match, arrayVar, itemTemplate) => {
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
      (match, dateVar) => {
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
      (match, amountVar) => {
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
    template = template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
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

app.whenReady().then(() => {
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
    log.info("Starting automatic update check on app ready");
    try {
      const result = await checkForUpdatesViaGitHub();
      if (result.success && result.hasUpdate) {
        log.info(`Startup: Update available: ${result.updateInfo?.version}`);
      } else if (result.success) {
        log.info("Startup: No updates available");
      } else {
        log.warn("Startup update check failed:", result.error);
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
app.on("before-quit", (event) => {
  log.info("App is about to quit");
});
app.on("will-quit", (event) => {
  log.info("App will quit");
});
