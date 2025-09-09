RaWaLite – Schritt 3: Electron + SQLite + Logging + NSIS

Befehle:
1) pnpm install
   -> Bei Rückfragen zu Builds: pnpm approve-builds electron esbuild 

2) Dev (Renderer + Electron):
   pnpm dev:all
   - Startet Vite (Renderer) und Electron (Main)
   - DB: %APPDATA%/RaWaLite/rawalite.db
   - Log: %APPDATA%/RaWaLite/rawalite.log

3) Build (Renderer + Electron) & Installer:
   pnpm dist
   -> erzeugt NSIS-Installer unter dist/

Hinweis:
- Der Renderer nutzt automatisch die Electron-IPC API, wenn vorhanden.
- Ohne Electron (nur Browser) fällt er auf LocalStorage zurück.