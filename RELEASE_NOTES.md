# 🔒 RawaLite v1.8.24 - Updater Hardening & Config Cleanup

## 🛠️ Fixes
- **Updater Hardening**: Entfernt veraltete Boolean-Flags aus package.json updater config
- **IPC Enhancement**: Erweiterte preload.ts um installManual() für explizite Installer-Pfade  
- **Config Cleanup**: Bereinigung der Updater-Konfiguration - nur noch funktionale Settings

## 🔧 Technical Changes
### package.json
- Entfernt: `verifySignature: false`, `signVerify: false`, `allowUnsigned: true`
- Entfernt: `disableKeychain: true`, `allowInsecureConnection: true`
- Behalten: Nur funktionale Konfiguration (provider, channel, headers)

### electron/preload.ts  
- Neu: `installManual(installerPath?: string)` IPC-Bridge
- Erweiterte Typisierung für manuelle Installer-Pfad-Übergabe

## 📋 Compatibility
- ✅ Behebt potentielle "this.verifySignature is not a function" Crashes
- ✅ Robuste NSIS-Installation über manuelle EXE-Starts
- ✅ Saubere GitHub-only Update-Pipeline
- ✅ Alle RawaLite Security-Guidelines eingehalten

## 🔍 Verification
- Keine `publisherName` in app-update.yml manifesten
- PNPM-only Build-Pipeline 
- In-App Update-Flow ohne externe Links
- Typisierte IPC-Kanäle mit contextIsolation: true
