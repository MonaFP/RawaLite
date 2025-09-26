# Update Diagnostics Report (2025-09-26)

## 1. Call-Graph & Logbeleg
- UI-Start: `handleInstallUpdate` triggert den Klick auf "Interactive Installation starten" (`src/components/AutoUpdaterModal.tsx:136`). Dort wird `window.rawalite?.updater?.installCustom?.({ filePath, elevate: true })` aufgerufen.
- Preload-Bruecke: `window.rawalite.updater.installCustom` delegiert via `ipcRenderer.invoke('updater:install-custom')` (`electron/preload.ts:11`).
- Main-Prozess: Aktiver Handler sitzt direkt in `electron/main.ts:552` (`ipcMain.handle('updater:install-custom', ...)`). Die alternative Implementierung in `electron/install-custom-handler.ts` wird nirgends registriert.
- Log-Marker: `logs/update-diag-20250926.log`, Zeile 1 bestaetigt den Pfad `[ACTIVE-HANDLER] src/components/AutoUpdaterModal.tsx:127 -> electron/preload.ts:11 -> electron/main.ts:551`.

## 2. Pfadpruefung des Installers
- Der Handler sucht zuerst einen explizit uebergebenen Pfad (Quotes entfernt) und faellt sonst auf `lastDownloadedPath` bzw. `findLatestExeInPending()` zurueck (`electron/main.ts:357-366`, `electron/main.ts:85-110`).
- Download-Zwischenspeicher: `pendingDir = %LOCALAPPDATA%\rawalite-updater\pending` (`electron/main.ts:85`). Der Ordner enthaelt zahlreiche Installer-Builds; aktuellster Fund: `rawalite-Setup-1.8.111.exe` mit 93.26 MB (`C:\Users\ramon\AppData\Local\rawalite-updater\pending`, `Get-ChildItem`-Ausgabe).
- Log-Auszug: `logs/update-diag-20250926.log`, Zeile 4 dokumentiert `[INSTALL] exePath=...\rawalite-Setup-1.8.111.exe exists=True sizeBytes=93258104`.
- Abweichung zu Metadaten: `fixed-latest.yml` und `fixed-update.json` referenzieren noch `rawalite-Setup-1.8.86.exe` trotz Version `1.8.87`. Dieses Naming-Mismatch muss vor der Reproduktion beruecksichtigt werden.

## 3. Spawn-Parameter & Sichtbarkeit
- Standard-Installationspfad (`updater:install`): `spawn('powershell.exe', launcherArgs, { detached: true, stdio: ['ignore','pipe','pipe'], windowsHide: false })` (`electron/main.ts:408-421`).
- Custom-Installer (`updater:install-custom`): identische Spawn-Optionen (`electron/main.ts:610-626`). `windowsHide: false` erlaubt sichtbare Fenster; `detached: true` verhindert, dass das Kind beim App-Exit beendet wird.
- Log-Referenzen in `logs/update-diag-20250926.log`, Zeilen 5-8 spiegeln die Parameter wider. Sie blockieren die GUI nicht; ein NSIS-Assistent duerfte sichtbar sein, wenn der nachgelagerte Launcher ihn nicht im Silent-Modus startet.

## 4. NSIS-Konfiguration
- `electron-builder.yml` setzt `oneClick: false`, `allowToChangeInstallationDirectory: true`, `perMachine: false`, `allowElevation: true`, `runAfterFinish: true`, `requestedExecutionLevel: asInvoker` (Zeilen 26-55).
- Interpretation: Der generierte Installer laeuft im UI-Modus (kein Silent-OneClick) und verlangt standardmaessig **keine** Administratorrechte (`perMachine: false`, `asInvoker`). Ein UAC-Dialog erscheint daher nur, wenn der Launcher ihn erzwingt.

## 5. Asset/Manifest-Abgleich
- Manifest-Dateien (`fixed-latest.yml`, `fixed-update.json`, `temp-update.json`) zeigen inkonsistente Referenzen: Update-Version `1.8.87`, aber Download-Link `rawalite-Setup-1.8.86.exe`.
- Der lokale Cache enthaelt hingegen Builds bis `1.8.111.exe`. Ein Downloader, der `findLatestExeInPending()` nutzt, startet somit ggf. einen anderen Build als im Manifest dokumentiert. Dieser Bruch erschwert die Fehlersuche, erklaert aber nicht allein das Ausbleiben des Installers.
- Hinweis: `temp-update.json` liegt in dezimal codierter Form vor, wirkt korrupt (reiner ASCII-Code pro Zeile). Das sollte gesaeubert werden, um falsche Dateinamen/Hashes auszuschliessen.

## 6. PowerShell-Aufruf & ExecutionPolicy
- Die Node-Seite reicht `-ExecutionPolicy Bypass` an `powershell.exe` durch (`electron/main.ts:409-414`, `electron/main.ts:612-617`). ExecutionPolicy-Blockaden sind daher unwahrscheinlich.
- Im Launcher (`resources/update-launcher.ps1:240-317`) wird per Heuristik geprueft, ob RawaLite unter `Program Files` liegt. Nur dann setzt `$needsElevation` auf `true` (`resources/update-launcher.ps1:285`) und ruft `Start-Process ... -Verb RunAs` auf (`resources/update-launcher.ps1:377-386`). Bei einer per-Benutzer-Installation (`LocalAppData`) wird dagegen **ohne** `-Verb RunAs` gestartet (`resources/update-launcher.ps1:405-413`).
- Log-Eintrag `logs/update-diag-20250926.log`, Zeilen 9-11, fasst diesen Status zusammen.

## 7. Priorisierte Root-Cause-Kandidaten
1. **Elevations-Heuristik verhindert UAC bei Per-User-Installationen.** Solange RawaLite unter `%LOCALAPPDATA%\Programs` liegt, bewertet `$needsElevation` als `false` und startet den NSIS-Installer ohne `RunAs`. Folge: kein UAC-Dialog, App bleibt aktiv. (Belegt durch `resources/update-launcher.ps1:285-413` und Log-Marker.)
2. **Manifest-/Asset-Divergenz.** Unterschiedliche Dateinamen zwischen Manifest (`rawalite-Setup-1.8.86.exe`) und tatsaechlichen Downloads (`rawalite-Setup-1.8.111.exe`) erschweren die Nachvollziehbarkeit, insbesondere wenn `lastDownloadedPath` nicht gesetzt wurde. (Quellen: `fixed-latest.yml`, `fixed-update.json`, Pending-Ordnerliste.)
3. **Korruptes `temp-update.json`.** Die numerische Darstellung wirkt unbrauchbar und koennte Tools brechen, die dieses Manifest lesen (z. B. CLI-Skripte oder Tests).

## 8. Fix-Vorschau (nicht umgesetzt)
- Launcher und IPC erweitern, um das UI-Flag `elevate: true` durchzureichen (z. B. `--force-elevation`) und die Heuristik zu umgehen, wenn explizit angefordert wird.
- Manifest-Generierung (`scripts/generate-update-json.mjs`) bzw. Release-Artefakte aktualisieren, sodass `latest.yml` & Co. immer den tatsaechlichen Dateinamen/Hash des juengsten Builds referenzieren.
- `temp-update.json` neu erzeugen oder loeschen, damit nur valide JSON-Manifeste im Repo liegen.

## Anhaenge
- Logdatei: `logs/update-diag-20250926.log`
- Keine Codeaenderungen vorgenommen; Untersuchung erfolgte ausschliesslich per Instrumentierung/Analyse.

## 9. Implementierung 2025-09-26 (Codex)
- UI aktualisiert: Einstellungen- und Updates-Seite nutzen jetzt das gemeinsame Modal `AutoUpdaterModal` (zentrale `installCustom`-Route).
- IPC erweitert: `installCustom` akzeptiert `installerPath`, `perMachine`, `quitDelayMs`; Preload/Types synchronisiert.
- Main-Handler schreibt Diagnose-Snapshot `%TEMP%/rawalite-update-*.json` und sendet `install-started`-Status mit Quit-Delay-Info.
- Launcher: Erzwingt sichtbares Fenster (`-WindowStyle Normal`), respektiert optional `RAWALITE_PER_MACHINE`.
- Build: Neues Skript `scripts/run-electron-builder.mjs` injiziert `nsis.perMachine` je nach ENV.
- Tests: `pnpm lint` ✅, `pnpm typecheck` ⚠️ (bestehende ungenutzte Variablen in Alt-Dateien – keine neuen Fehler durch diesen Patch).
- Nächste Schritte: Legacy-TS-Warnungen bereinigen, `pnpm typecheck` erneut; Release `v1.8.113` vorbereiten.
