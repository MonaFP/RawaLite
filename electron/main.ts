// electron/main.ts
import { app, BrowserWindow, shell, ipcMain, Menu, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import type { NsisUpdater } from "electron-updater";
import log from "electron-log";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import {
  PDFPostProcessor,
  PDFAConversionOptions,
} from "../src/services/PDFPostProcessor";
import { initializeBackupSystem } from "./backup";
import { initializeLogoSystem } from "./logo";

// === SINGLE INSTANCE LOCK ===
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log.info("Another instance is already running, quitting...");
  app.quit();
} else {
  app.on("second-instance", () => {
    log.info("Second instance detected, focusing existing window");
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// === LOGGING ===
log.transports.file.level = "debug";
log.transports.file.maxSize = 1024 * 1024 * 10; // 10MB
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.console.level = "debug";

// === AUTO-UPDATER BASE CONFIG ===
autoUpdater.logger = log;
autoUpdater.autoDownload = false;          // User bestätigt Download
autoUpdater.autoInstallOnAppQuit = false;  // Keine Auto-Installation
autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;
autoUpdater.disableWebInstaller = true;
autoUpdater.forceDevUpdateConfig = false;

// Stabilere Downloads von GitHub (kein H2-Transform)
autoUpdater.requestHeaders = {
  "Accept-Encoding": "identity",
  "Cache-Control": "no-transform",
};
// Optional: Diff-Updates vorübergehend aus (nur Full Download)
process.env.ELECTRON_BUILDER_DISABLE_DIFF_UPDATES = "true";

// ✅ WIRKLICH: NSIS-Signaturprüfung neutralisieren (funktionaler Override)
const nsis = autoUpdater as unknown as NsisUpdater;
/** return null => „ok“; string => Fehler */
nsis.verifyUpdateCodeSignature = async () => null;
log.info("🔒 NSIS code-signature verification overridden (accept all)");

// ⚠️ Keine Feed-URL im Code setzen! (nur electron-builder publish: github)
//    Doppel-Configs führen zu Chaos.

// === ENV DEBUG ===
log.info("=== AUTO-UPDATER ENVIRONMENT DEBUG ===");
log.info("App Version:", app.getVersion());
log.info("Is Packaged:", app.isPackaged);
log.info("Platform:", process.platform, process.arch);
log.info("Electron:", process.versions.electron);
log.info("Node:", process.versions.node);

// === AUTO-UPDATER STATE ===
let isUpdateAvailable = false;
let currentUpdateInfo: any = null;
let lastDownloadedInstaller: string | null = null;

// Helper: send messages to renderer
function sendUpdateMessage(type: string, data?: any) {
  const sanitizedData = data
    ? {
        ...data,
        version:
          typeof data.version === "string"
            ? data.version
            : String(data.version || "Unbekannt"),
        releaseNotes:
          typeof data.releaseNotes === "string"
            ? data.releaseNotes
            : String(data.releaseNotes || data.note || ""),
        releaseDate:
          typeof data.releaseDate === "string"
            ? data.releaseDate
            : String(
                data.releaseDate || data.date || new Date().toISOString()
              ),
      }
    : null;

  const message = { type, data: sanitizedData };
  BrowserWindow.getAllWindows().forEach((window) => {
    try {
      window.webContents.send("update-message", message);
    } catch (error) {
      log.error("[sendUpdateMessage] Failed to send message:", error);
    }
  });
}

// === AUTO-UPDATER EVENTS ===
autoUpdater.on("checking-for-update", () => {
  log.info("🔍 [UPDATE] checking-for-update");
  isUpdateAvailable = false;
  currentUpdateInfo = null;
  sendUpdateMessage("checking-for-update");
});

autoUpdater.on("update-available", (info) => {
  log.info("✅ [UPDATE] update-available:", info.version);
  isUpdateAvailable = true;
  currentUpdateInfo = info;
  sendUpdateMessage("update-available", {
    version: String(info.version || "Unknown"),
    releaseNotes: String(info.releaseNotes || ""),
    releaseDate: String(info.releaseDate || new Date().toISOString()),
  });
});

autoUpdater.on("update-not-available", (info) => {
  log.info("❌ [UPDATE] update-not-available (latest:", info?.version, ")");
  isUpdateAvailable = false;
  currentUpdateInfo = null;
  sendUpdateMessage("update-not-available", info);
});

autoUpdater.on("error", (err) => {
  log.error("💥 [UPDATE-ERROR]", err?.message);
  sendUpdateMessage("update-error", {
    message: err?.message,
    stack: (err as any)?.stack,
    code: (err as any)?.code,
  });
});

autoUpdater.on("download-progress", (p) => {
  const percent = Math.round(p.percent);
  const speedMBps = Math.round((p.bytesPerSecond / 1024 / 1024) * 100) / 100;
  if (percent % 5 === 0) {
    log.info(`📥 [PROGRESS] ${percent}% - ${speedMBps} MB/s`);
  }
  sendUpdateMessage("download-progress", {
    percent,
    transferred: p.transferred,
    total: p.total,
    bytesPerSecond: p.bytesPerSecond,
  });
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("🎉 [UPDATE] update-downloaded:", info.version);
  // Pfad zur heruntergeladenen Setup-EXE merken
  lastDownloadedInstaller = (info as any).downloadedFile || null;
  log.info("🎉 [UPDATE] installerPath:", lastDownloadedInstaller);
  sendUpdateMessage("update-downloaded", {
    version: info.version,
    releaseNotes: info.releaseNotes,
    installerPath: lastDownloadedInstaller,
  });
});

// === IPC: Updater ===
ipcMain.handle("updater:check-for-updates", async () => {
  try {
    log.info("Manual update check requested");
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo || null };
  } catch (error) {
    log.error("Check for updates failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});

ipcMain.handle("updater:start-download", async () => {
  try {
    if (!isUpdateAvailable || !currentUpdateInfo) {
      log.error("Cannot download: No update available or check not performed");
      return { success: false, error: "Bitte zuerst nach Updates suchen." };
    }
    log.info("Starting update download…");
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    log.error("Download update failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});

// 🚀 WICHTIG: Manuelle Installation statt quitAndInstall() (um Verify zu umgehen)
ipcMain.handle("updater:quit-and-install", async () => {
  try {
    log.info("🚀 [INSTALL] Starting manual installation");
    if (!isUpdateAvailable || !currentUpdateInfo) {
      return { success: false, error: "Kein Update zum Installieren verfügbar." };
    }
    const installer = lastDownloadedInstaller || (await findNsisInPending());
    if (!installer || !fs.existsSync(installer)) {
      return { success: false, error: "Installer-Pfad unbekannt. Bitte Download erneut starten." };
    }

    const cmd = process.env.COMSPEC || "C:\\Windows\\System32\\cmd.exe";
    // Startet die EXE über den Standard-Handler (zeigt ggf. Windows-Warnung),
    // kein PowerShell, keine Signatur-Prüfung durch electron-updater.
    spawn(cmd, ["/c", "start", "", `"${installer}"`], {
      detached: true,
      stdio: "ignore",
    }).unref();

    // App schließen, damit NSIS installieren kann
    setTimeout(() => {
      try {
        BrowserWindow.getAllWindows().forEach((w) => {
          if (!w.isDestroyed()) w.destroy();
        });
      } catch {}
      process.exit(0);
    }, 500);

    return { success: true };
  } catch (error) {
    log.error("Install failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});

// Hilfsfunktion: typische Pending-Pfade nach EXE durchsuchen
async function findNsisInPending(): Promise<string | null> {
  const dirs = [
    path.join(os.homedir(), "AppData", "Local", "rawalite-updater", "pending"),
    path.join(app.getPath("userData"), "pending"),
  ];
  for (const dir of dirs) {
    try {
      const files = await fs.promises.readdir(dir);
      const exe = files.find((f) => /\.exe$/i.test(f));
      if (exe) return path.join(dir, exe);
    } catch {}
  }
  return null;
}

// === MENU ===
const isDev = !app.isPackaged;

function createMenu() {
  const template: any = [
    {
      label: "Datei",
      submenu: [
        {
          label: "Beenden",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Bearbeiten",
      submenu: [
        { label: "Rückgängig", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Wiederholen", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "Ausschneiden", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Kopieren", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Einfügen", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Alles auswählen", accelerator: "CmdOrCtrl+A", role: "selectall" },
      ],
    },
    {
      label: "Ansicht",
      submenu: [
        { label: "Vollbild", accelerator: "F11", role: "togglefullscreen" },
        { type: "separator" },
        { label: "Neu laden", accelerator: "CmdOrCtrl+R", role: "reload" },
        { label: "Erzwungenes Neu laden", accelerator: "CmdOrCtrl+Shift+R", role: "forceReload" },
        { type: "separator" },
        { label: "Entwicklertools", accelerator: "F12", role: "toggledevtools" },
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
          click: () => {
            log.info("Manual update check triggered from menu");
            autoUpdater.checkForUpdates().catch((err) => {
              log.error("Manual update check failed:", err);
            });
          },
        },
        { type: "separator" },
        {
          label: "App-Version anzeigen",
          click: () => {
            const version = app.getVersion();
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
            const mainWindow = BrowserWindow.getAllWindows()[0];
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Über RawaLite",
                message: `RawaLite v${app.getVersion()}`,
                detail:
                  "Professional Business Management Solution\n\nCopyright © 2025 MonaFP. All rights reserved.",
                buttons: ["OK"],
              });
            }
          },
        },
        {
          label: "Version Information",
          click: () => {
            const mainWindow = BrowserWindow.getAllWindows()[0];
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Version Information",
                message: `RawaLite v${app.getVersion()}`,
                detail: `Electron: ${process.versions.electron}\nNode.js: ${process.versions.node}\nChrome: ${process.versions.chrome}`,
                buttons: ["OK"],
              });
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// === WINDOW ===
function createWindow() {
  const rootPath = isDev ? process.cwd() : app.getAppPath();
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
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(rootPath, "dist", "index.html"));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Externe Navigation blockieren
    console.log("External navigation blocked:", url);
    return { action: "deny" };
  });
}

// === IPC: App Ops ===
ipcMain.handle("app:restart", async () => {
  app.relaunch();
  app.exit();
});
ipcMain.handle("app:getVersion", async () => app.getVersion());

// === DB OPS ===
ipcMain.handle("db:load", async (): Promise<Uint8Array | null> => {
  try {
    const dbPath = path.join(app.getPath("userData"), "database.sqlite");
    if (!fs.existsSync(dbPath)) return null;
    return fs.readFileSync(dbPath);
  } catch (error) {
    console.error("Error loading database:", error);
    return null;
  }
});

ipcMain.handle("db:save", async (_e, data: Uint8Array): Promise<boolean> => {
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

// === PDF GENERATION (unverändert, aber gestrafft) ===
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
      theme?: any;
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

      if (!options.templateType || !options.data || !options.options) {
        return { success: false, error: "Invalid PDF generation parameters" };
      }

      const templatePath = getTemplatePath(options.templateType);
      if (!fs.existsSync(templatePath)) {
        return { success: false, error: `Template not found: ${options.templateType}` };
      }

      const templateData = {
        [options.templateType]:
          options.data.offer || options.data.invoice || options.data.timesheet,
        customer: options.data.customer,
        settings: options.data.settings,
        company: {
          ...options.data.settings?.companyData,
          zip:
            options.data.settings?.companyData?.postalCode ||
            options.data.settings?.companyData?.zip,
          taxId:
            options.data.settings?.companyData?.taxNumber ||
            options.data.settings?.companyData?.taxId,
        },
        currentDate:
          options.data.currentDate || new Date().toLocaleDateString("de-DE"),
        theme: options.theme,
      };

      const htmlContent = await renderTemplate(templatePath, templateData);

      const tempDir = path.join(os.tmpdir(), "rawalite-pdf");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
      let outputPdfPath: string;

      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { success: false, error: "No active window for PDF generation" };

      const pdfWindow = new BrowserWindow({
        show: false,
        webPreferences: { contextIsolation: true, sandbox: true },
      });

      try {
        await pdfWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const pdfBuffer = await pdfWindow.webContents.printToPDF({
          pageSize: "A4",
          printBackground: true,
          margins: { top: 2.5, bottom: 2, left: 2.5, right: 2 },
        });

        fs.writeFileSync(tempPdfPath, pdfBuffer);
        let finalPdfPath = tempPdfPath;
        let validationResult: any;

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
            console.warn("PDF/A conversion failed, using standard PDF:", conversionResult.error);
          }
        }

        if (options.options.previewOnly) {
          try {
            await shell.openPath(finalPdfPath);
          } catch (e) {
            console.warn("Could not open PDF preview:", e);
          }
          return {
            success: true,
            previewUrl: `file://${finalPdfPath}`,
            fileSize: fs.statSync(finalPdfPath).size,
            compliance: validationResult,
            message: `PDF generated successfully: ${options.options.filename}`,
          };
        }

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
            return { success: false, error: "Export vom Benutzer abgebrochen" };
          }
          outputPdfPath =
            saveResult.filePath ||
            path.join(app.getPath("downloads"), options.options.filename);
        } catch (dialogError) {
          console.error("Dialog error, using Downloads folder:", dialogError);
          outputPdfPath = path.join(app.getPath("downloads"), options.options.filename);
        }

        if (finalPdfPath !== outputPdfPath) {
          fs.copyFileSync(finalPdfPath, outputPdfPath);
        }

        const fileSize = fs.statSync(outputPdfPath).size;
        return {
          success: true,
          filePath: outputPdfPath,
          fileSize,
          compliance: validationResult,
          message: `PDF generated successfully: ${options.options.filename}`,
        };
      } finally {
        pdfWindow.close();
        cleanupTempFile(tempPdfPath);
      }
    } catch (error) {
      console.error("❌ PDF generation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown PDF generation error",
      };
    }
  }
);

// === PDF helpers ===
function getTemplatePath(templateType: string): string {
  if (isDev) {
    const rootPath = process.cwd();
    return path.join(rootPath, "templates", `${templateType}.html`);
  } else {
    const resourcesPath = process.resourcesPath;
    return path.join(resourcesPath, "app", "templates", `${templateType}.html`);
  }
}

async function renderTemplate(templatePath: string, data: any): Promise<string> {
  try {
    let template = fs.readFileSync(templatePath, "utf-8");

    // #if
    template = template.replace(
      /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs,
      (_m, condition, content) => {
        const value = getNestedValue(data, String(condition).trim());
        return value ? content : "";
      }
    );
    // #unless
    template = template.replace(
      /\{\{#unless\s+([^}]+)\}\}(.*?)\{\{\/unless\}\}/gs,
      (_m, condition, content) => {
        const value = getNestedValue(data, String(condition).trim());
        return !value ? content : "";
      }
    );
    // #each
    template = template.replace(
      /\{\{#each\s+([^}]+)\}\}(.*?)\{\{\/each\}\}/gs,
      (_m, arrayVar, itemTemplate) => {
        const array = getNestedValue(data, String(arrayVar).trim());
        if (!Array.isArray(array)) return "";
        return array
          .map((item) =>
            itemTemplate
              .replace(/\{\{this\.([^}]+)\}\}/g, (_mm, prop) =>
                String(item[prop] ?? "")
              )
              .replace(
                /\{\{formatCurrency\s+this\.([^}]+)\}\}/g,
                (_mm, prop) => {
                  const amount = item[prop];
                  return typeof amount === "number"
                    ? amount.toFixed(2).replace(".", ",") + " €"
                    : "0,00 €";
                }
              )
          )
          .join("");
      }
    );

    // format helpers
    template = template.replace(/\{\{formatDate\s+([^}]+)\}\}/g, (_m, dateVar) => {
      const dateValue = getNestedValue(data, String(dateVar).trim());
      if (!dateValue) return "";
      try {
        return new Date(dateValue).toLocaleDateString("de-DE");
      } catch {
        return String(dateValue);
      }
    });
    template = template.replace(/\{\{formatCurrency\s+([^}]+)\}\}/g, (_m, v) => {
      const amount = getNestedValue(data, String(v).trim());
      return typeof amount === "number"
        ? amount.toFixed(2).replace(".", ",") + " €"
        : "0,00 €";
    });

    // simple {{var}}
    template = template.replace(/\{\{([^}]+)\}\}/g, (_m, variable) => {
      const value = getNestedValue(data, String(variable).trim());
      return value == null ? "" : String(value);
    });

    // Theme-Anwendung (vereinfacht)
    if (data.theme && data.theme.theme) {
      const theme = data.theme.theme;
      template = template
        .replace(/#1e3a2e/g, theme.primary)
        .replace(/#0f2419/g, theme.secondary)
        .replace(/#10b981/g, theme.accent)
        .replace(/1px solid #e0e0e0/g, `1px solid ${theme.primary}33`)
        .replace(/1px solid #d0d0d0/g, `1px solid ${theme.primary}44`)
        .replace(/1px solid #ccc/g, `1px solid ${theme.primary}66`)
        .replace(/#f8f9fa/g, `${theme.primary}11`)
        .replace(/#fafafa/g, `${theme.primary}08`);
    }

    return template;
  } catch (error) {
    throw new Error(
      `Template rendering failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

function getNestedValue(obj: any, pathStr: string): any {
  return pathStr.split(".").reduce((cur, prop) => {
    return cur && typeof cur === "object" ? cur[prop] : undefined;
  }, obj);
}

ipcMain.handle("pdf:getStatus", async () => {
  try {
    const capabilities = await PDFPostProcessor.getSystemCapabilities();
    return { electronAvailable: true, ...capabilities };
  } catch {
    return {
      electronAvailable: true,
      ghostscriptAvailable: false,
      veraPDFAvailable: false,
      pdfa2bSupported: false,
    };
  }
});

function cleanupTempFile(filePath: string): void {
  const maxRetries = 5;
  const retryDelay = 2000;
  function attempt(retry = 0) {
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Cleaned up temporary PDF file: ${path.basename(filePath)}`);
        }
      } catch {
        if (retry < maxRetries) {
          attempt(retry + 1);
        } else {
          console.warn(`⚠️ Could not clean up temporary PDF file: ${path.basename(filePath)}`);
          app.once("before-quit", () => {
            try {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch {}
          });
        }
      }
    }, retryDelay * (retry + 1));
  }
  attempt();
}

// === APP LIFECYCLE ===

app.whenReady().then(() => {
  createMenu();
  createWindow();
  loadThemeIntegration();
  initializeBackupSystem();
  initializeLogoSystem();

  setTimeout(() => {
    log.info("Starting automatic update check on app ready");
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn("Startup update check failed:", (err as any)?.message);
    });
  }, 5000);
});

app.on("window-all-closed", () => {
  log.info("All windows closed");
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  log.info("App activated");
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on("before-quit", () => log.info("App is about to quit"));
app.on("will-quit", () => log.info("App will quit"));

// === THEME INTEGRATION (wie zuvor) ===
const pdfThemesPath = path.join(__dirname, "..", "src", "lib", "pdfThemes.ts");
let injectThemeIntoTemplate: any = null;

async function loadThemeIntegration() {
  try {
    if (!injectThemeIntoTemplate) {
      injectThemeIntoTemplate = (templateHTML: string, pdfThemeData: any): string => {
        if (!pdfThemeData) return templateHTML;
        const styleEndIndex = templateHTML.lastIndexOf("</style>");
        if (styleEndIndex === -1) return templateHTML;
        const themeInjection = `
          /* === PDF THEME INTEGRATION === */
          :root { ${pdfThemeData.cssVariables} }
          ${pdfThemeData.themeCSS}
          /* === END THEME INTEGRATION === */
        `;
        const themedTemplate =
          templateHTML.substring(0, styleEndIndex) +
          themeInjection +
          templateHTML.substring(styleEndIndex);
        return themedTemplate;
      };
    }
  } catch (error) {
    console.warn("Theme integration not available:", error);
    injectThemeIntoTemplate = (template: string) => template;
  }
}
