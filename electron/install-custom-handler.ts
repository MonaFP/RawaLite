// install-custom-handler.ts
// Vereinfachte Implementierung des updater:install-custom Handlers mit ShellExecute-Ansatz

import { app, BrowserWindow, ipcMain } from "electron";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Interface für den Payload
interface InstallCustomPayload {
  filePath: string;
  args?: string[];
  expectedSha256?: string;
  elevate?: boolean;
  unblock?: boolean;
  quitDelayMs?: number;
}

// Globale Typen für Logger und Globals
declare const log: {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
};

declare const global: {
  __rawaliteUpdateInProgress?: boolean;
  [key: string]: any;
};

// Hilfsfunktionen
async function sha256Of(path: string): Promise<string> {
  const h = crypto.createHash("sha256");
  return await new Promise<string>((resolve, reject) => {
    const s = fs.createReadStream(path);
    s.on("data", d => h.update(d));
    s.on("end", () => resolve(h.digest("hex")));
    s.on("error", reject);
  });
}

function psEscape(s: string): string { 
  return s.replace(/'/g, "''"); 
}

async function unblockFileWindows(filePath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ps = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-Command",
      `Unblock-File -Path '${psEscape(filePath)}'`
    ], { stdio: "ignore", windowsHide: false });
    
    ps.once("error", reject);
    ps.once("exit", () => resolve());
  });
}

// Handler-Implementierung
export function registerInstallCustomHandler() {
  ipcMain.handle("updater:install-custom", async (event, payload: InstallCustomPayload) => {
    const {
      filePath,
      args = [],
      expectedSha256,
      elevate = true,
      unblock = true,
      quitDelayMs = 7000,
    } = payload ?? {};

    const runId = Date.now().toString(36);
    const tag = (msg: string) => `[CUSTOM-INSTALL ${runId}] ${msg}`;

    try {
      log.info("🚀 [INSTALL_CLICKED] Custom installer requested");
      log.info(tag(`Install requested: ${filePath}`));
      log.info(tag(`Args: ${JSON.stringify(args)}`));
      log.info(tag(`Expected SHA256: ${expectedSha256 ? "provided" : "none"}`));
      log.info(tag(`Elevate: ${elevate}, Unblock: ${unblock}, QuitDelay: ${quitDelayMs}ms`));

      // ⚠️ Prüfen ob Update-Installation bereits läuft (verhindert Doppelausführungen)
      const isUpdateInProgress = !!global.__rawaliteUpdateInProgress;
      if (isUpdateInProgress) {
        const msg = "Update-Installation läuft bereits";
        log.warn(tag(msg));
        return { ok: false, error: msg, alreadyInProgress: true };
      }

      // ⚠️ Markieren dass Update-Installation läuft
      global.__rawaliteUpdateInProgress = true;

      // 1. Validation - Datei existiert?
      if (!filePath || !fs.existsSync(filePath)) {
        const msg = `Installer nicht gefunden: ${filePath}`;
        log.error("❌ [CUSTOM-INSTALL] " + msg);
        global.__rawaliteUpdateInProgress = false; // Reset Flag
        return { ok: false, error: msg };
      }

      // 2. Prüfe ob Datei ausführbar ist
      try {
        const stats = fs.statSync(filePath);
        const isExecutable = stats.isFile() && filePath.toLowerCase().endsWith(".exe");
        if (!isExecutable) {
          const msg = `Datei ist keine ausführbare .exe: ${filePath}`;
          log.error("❌ [CUSTOM-INSTALL] " + msg);
          global.__rawaliteUpdateInProgress = false; // Reset Flag
          return { ok: false, error: msg };
        }
        
        // Größe protokollieren
        const fileSizeMB = Math.round(stats.size / 1024 / 1024 * 100) / 100;
        log.info(tag(`Installer file size: ${fileSizeMB} MB`));
      } catch (statError: any) {
        log.warn(tag(`Could not check file stats: ${statError.message}`));
        // Continue anyway - nicht kritisch
      }

      // 3. SHA256-Verifikation (optional)
      if (expectedSha256) {
        try {
          const digest = await sha256Of(filePath);
          if (digest.toLowerCase() !== expectedSha256.toLowerCase()) {
            const msg = `SHA256-Mismatch. expected=${expectedSha256} got=${digest}`;
            log.error("❌ [CUSTOM-INSTALL] " + msg);
            global.__rawaliteUpdateInProgress = false; // Reset Flag
            return { ok: false, error: msg };
          }
          log.info("✅ [CUSTOM-INSTALL] SHA256 verification passed");
        } catch (shaError: any) {
          log.warn("⚠️ [CUSTOM-INSTALL] SHA256 verification failed:", shaError.message);
        }
      }

      // 4. MOTW-Unblocking (Windows-spezifisch)
      if (unblock && process.platform === "win32") {
        try {
          await unblockFileWindows(filePath);
          log.info("✅ [CUSTOM-INSTALL] MOTW unblocked successfully");
        } catch (unblockError: any) {
          log.warn("⚠️ [CUSTOM-INSTALL] MOTW unblock failed:", unblockError.message);
          // Continue anyway - nicht kritisch
        }
      }

      // 5. Status an Renderer melden bevor Single-Instance-Lock freigegeben wird
      try {
        // Sende Nachricht an Renderer vor Lock-Freigabe
        const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send("updater:status", {
            status: "preparing-installer",
            message: "Installer wird vorbereitet..."
          });
        }
      } catch (notifyError) {
        log.warn(tag(`Failed to notify renderer: ${notifyError instanceof Error ? notifyError.message : String(notifyError)}`));
      }

      // 6. Single Instance Lock freigeben
      try {
        app.releaseSingleInstanceLock?.();
        log.info("🔓 [CUSTOM-INSTALL] Released single instance lock for installer");
      } catch {}

      // 7. 🚀 ShellExecute-Ansatz - vereinfacht und robust
      let child: ChildProcess;
      try {
        if (process.platform === "win32") {
          // Priorität senken für bessere Installer-Performance
          try {
            const lowerPriorityPs = spawn("powershell.exe", [
              "-NoProfile",
              "-ExecutionPolicy", "Bypass",
              "-Command", `$currentPid = [System.Diagnostics.Process]::GetCurrentProcess().Id; (Get-Process -Id $currentPid).PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal`
            ], { stdio: "ignore" });
            
            await new Promise<void>((resolve) => {
              lowerPriorityPs.on("exit", () => resolve());
              setTimeout(resolve, 500);
            });
            
            log.info("✅ [PRIORITY] Lowered current process priority for better installer performance");
          } catch (priorityError) {
            log.warn("⚠️ [PRIORITY] Failed to lower process priority:", priorityError instanceof Error ? priorityError.message : String(priorityError));
            // Nicht kritisch, fortfahren
          }
          
          // ShellExecute-Ansatz für die Installation - vereinfacht
          log.info(`🚀 [SHELLEXEC] Using simplified ShellExecute approach for installer launch`);
          
          // PowerShell-Skript mit ShellExecute für direkte UAC-Elevation
          const cmd = `
            $ErrorActionPreference = "Stop";
            $installerPath = "${psEscape(filePath)}";
            $argString = "${args.join(" ")} /NCRC";
            
            # Unblock file (MOTW entfernen)
            try {
              Unblock-File -Path "$installerPath" -ErrorAction SilentlyContinue
              Write-Host "✅ File unblocked successfully"
            } catch {
              Write-Host "⚠️ Failed to unblock file: $_"
            }
            
            # ShellExecute über .NET für direkte UAC-Elevation
            try {
              Add-Type -TypeDefinition @"
              using System;
              using System.Diagnostics;
              using System.Runtime.InteropServices;
              
              public class ShellExecute {
                  [DllImport("shell32.dll", CharSet = CharSet.Auto)]
                  public static extern IntPtr ShellExecuteW(IntPtr hwnd, string lpOperation, string lpFile, 
                                                          string lpParameters, string lpDirectory, int nShowCmd);
                  
                  public const int SW_SHOW = 5;
              }
"@
              # Operation "runas" fordert UAC-Elevation an
              $operation = "${elevate ? "runas" : "open"}";
              $directory = [System.IO.Path]::GetDirectoryName($installerPath);
              
              Write-Host "🚀 Launching installer with ShellExecute..."
              Write-Host "📂 Path: $installerPath"
              Write-Host "🔧 Args: $argString"
              Write-Host "📂 Dir: $directory"
              Write-Host "⚙️ Operation: $operation"
              
              $result = [ShellExecute]::ShellExecuteW(
                  [IntPtr]::Zero,     # kein Parent-Fenster
                  $operation,         # "runas" für UAC
                  $installerPath,     # Installer-Pfad
                  $argString,         # Kommandozeilenargumente
                  $directory,         # Arbeitsverzeichnis
                  [ShellExecute]::SW_SHOW  # Fenster anzeigen
              );
              
              if ($result -gt 32) {
                  Write-Host "✅ ShellExecute erfolgreich, Rückgabewert: $result"
                  exit 0
              } else {
                  Write-Host "❌ ShellExecute fehlgeschlagen, Fehlercode: $result"
                  
                  # Fallback zu Start-Process bei ShellExecute-Fehler
                  Write-Host "🔄 Versuche Fallback mit Start-Process..."
                  Start-Process -FilePath "$installerPath" -ArgumentList $argString -Verb "RunAs"
                  exit 0
              }
            } catch {
              Write-Host "❌ ShellExecute-Ausnahme: $_"
              exit 1
            }
          `;
          
          // PowerShell ausführen mit Ausgabeverarbeitung
          const ps = spawn("powershell.exe", [
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-Command", cmd
          ], {
            detached: true,
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: false,
            cwd: path.dirname(filePath),
            windowsVerbatimArguments: true
          });
          
          // Ausgaben protokollieren
          ps.stdout?.on("data", (data) => {
            log.info(`[SHELLEXEC] ${data.toString().trim()}`);
          });
          
          ps.stderr?.on("data", (data) => {
            log.warn(`[SHELLEXEC] ${data.toString().trim()}`);
          });
          
          // Als Child-Process behandeln für Exit-Code
          child = ps;
          
          log.info("✅ [SHELLEXEC] PowerShell ShellExecute command launched");
        } else {
          // Fallback für andere Plattformen
          child = spawn(filePath, args, { 
            detached: true, 
            stdio: "ignore" 
          });
        }

        // Vollständig abkoppeln - KRITISCH für echten Detach
        child.unref();
        
        log.info("✅ [SPAWN_OK] Installer launched successfully");
        log.info(tag(`PID: ${child.pid}, Detached: true, Unref: true`));
        
      } catch (spawnError: any) {
        log.error("❌ [SPAWN_ERROR] All launch attempts failed:", spawnError?.message || spawnError);
        global.__rawaliteUpdateInProgress = false; // Reset Flag bei Fehler
        return { ok: false, error: spawnError?.message ?? String(spawnError) };
      }

      // 8. UI-Update vor dem Beenden
      try {
        const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send("updater:status", {
            status: "install-started",
            message: "Installer wurde gestartet. Die App wird in Kürze beendet..."
          });
        }
      } catch (notifyError) {
        log.warn(tag(`Failed to notify renderer before exit: ${notifyError instanceof Error ? notifyError.message : String(notifyError)}`));
      }

      // 9. App nach kurzer Verzögerung beenden (vereinfacht)
      const updatedQuitDelayMs = 10000; // 10 Sekunden
      log.info(tag(`Setting up delayed app termination in ${updatedQuitDelayMs}ms`));
      
      setTimeout(() => {
        try {
          log.info("💡 [DELAY-FIX] Closing all windows gracefully");
          
          const allWindows = BrowserWindow.getAllWindows();
          if (allWindows.length > 0) {
            allWindows.forEach(win => {
              try {
                if (!win.isDestroyed()) {
                  win.close();
                }
              } catch (winErr: any) {
                log.warn(`⚠️ [WINDOW-CLOSE] Error closing window: ${winErr?.message}`);
              }
            });
          }
          
          // Nach kurzer Verzögerung App beenden
          setTimeout(() => {
            log.info(`💡 [DELAY-FIX] Exiting app after delay`);
            app.quit();
            
            // Fallback nach kurzem Delay
            setTimeout(() => {
              log.info("💡 [DELAY-FIX] Fallback to app.exit(0)");
              app.exit(0);
            }, 2000);
          }, 2000);
          
        } catch (exitError: any) {
          log.warn("⚠️ [CUSTOM-INSTALL] Exit sequence failed:", exitError?.message);
          // Fallback zu direktem app.exit
          try { app.exit(0); } catch { /* Ignorieren */ }
        }
      }, updatedQuitDelayMs);

      return { 
        ok: true, 
        installerStarted: true, 
        pid: child.pid ?? null,
        filePath, 
        args,
        runId 
      };

    } catch (error: any) {
      log.error("❌ [CUSTOM-INSTALL] Exception:", error?.message || error);
      global.__rawaliteUpdateInProgress = false; // Reset Flag bei Fehler
      return { ok: false, error: error?.message ?? String(error) };
    }
  });
}