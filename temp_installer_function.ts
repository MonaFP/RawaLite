// Simple, clean installer function for RawaLite
ipcMain.handle("updater:install-custom", async (event, payload: InstallCustomPayload) => {
  const {
    filePath,
    args = [],
    elevate = true,
    quitDelayMs = 2000,
  } = payload ?? {};

  const runId = Date.now().toString(36);
  const tag = (msg: string) => `[CUSTOM-INSTALL ${runId}] ${msg}`;

  try {
    log.info(tag(`Install requested: ${filePath}`));

    // 1. Validation - Datei existiert?
    if (!filePath || !fs.existsSync(filePath)) {
      const msg = `Installer nicht gefunden: ${filePath}`;
      log.error(tag(msg));
      return { ok: false, error: msg };
    }

    // 2. Benachrichtige UI
    try {
      const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send("updater:status", {
          status: "install-started",
          message: "Installer wird gestartet..."
        });
      }
    } catch (notifyError) {
      log.warn(tag(`Failed to notify UI: ${notifyError}`));
    }

    // 3. Starte Installer (einfach und robust)
    let child: ChildProcess;
    if (process.platform === "win32") {
      const psCommand = elevate 
        ? `Start-Process -FilePath '${filePath.replace(/'/g, "''")}' -Verb RunAs`
        : `Start-Process -FilePath '${filePath.replace(/'/g, "''")}' `;
      
      log.info(tag(`PowerShell command: ${psCommand}`));
      
      child = spawn("powershell.exe", [
        "-NoProfile",
        "-ExecutionPolicy", "Bypass", 
        "-Command", psCommand
      ], {
        detached: true,
        stdio: "ignore",
        windowsHide: false
      });
    } else {
      child = spawn(filePath, args, { 
        detached: true, 
        stdio: "ignore" 
      });
    }

    child.unref();
    log.info(tag(`✅ Installer started with PID: ${child.pid}`));

    // 4. App nach kurzer Verzögerung beenden
    setTimeout(() => {
      log.info(tag("App wird beendet für Installer"));
      app.quit();
    }, quitDelayMs);

    return { 
      ok: true, 
      installerStarted: true, 
      pid: child.pid ?? null,
      filePath, 
      args,
      runId 
    };

  } catch (error: any) {
    log.error(tag(`Exception: ${error?.message || error}`));
    return { ok: false, error: error?.message ?? String(error) };
  }
});