# RawaLite v1.8.72 Release Notes
## 🚀 **Custom Install Routine - Interactive Installation System**

### ✅ **Problem gelöst: quitAndInstall() entfernt**

**Root Cause:** `autoUpdater.quitAndInstall()` funktionierte nicht, da **electron-updater** den Download nie selbst durchgeführt hat - unser **Custom Downloader** tat es.

**Solution:** Vollständige **Custom Install Routine** implementiert, die direkt mit unserem Custom Download System arbeitet.

### 🔧 **Neue Custom Install API**

#### **IPC-Handler: `updater:install-custom`**
```typescript
window.rawalite.updater.installCustom({
  filePath: string,           // Absoluter Pfad zum heruntergeladenen .exe
  args?: string[],           // Optional: Installer-Argumente (Default: Interactive)
  expectedSha256?: string    // Optional: SHA256-Verifikation
})
```

#### **Features:**
- ✅ **Datei-Existenz-Check:** Sicherstellung dass .exe verfügbar ist
- ✅ **SHA256-Verifikation:** Optional für Sicherheit (wenn bereitgestellt)
- ✅ **Interactive Installation:** `spawn()` mit sichtbarer UI statt Silent flags
- ✅ **Proper Process Management:** `detached: false`, `stdio: "pipe"`, `windowsHide: false`
- ✅ **Single Instance Lock Release:** Für sauberen Installer-Handover
- ✅ **Automatic App Quit:** Nach Installer-Start für Clean Installation

### 🎨 **UI/UX Verbesserungen**

#### **AutoUpdaterModal.tsx Updates:**
- **Button Safety:** Nur aktiv wenn `downloadedFile` verfügbar ist
- **Interactive Messaging:** "Interactive Installation starten" statt generisch
- **User Guidance:** Klare Anweisungen für sichtbare Windows-Installation
- **Process Transparency:** User sieht was passiert (Next → Install → Finish)

#### **Logging Integration:**
```typescript
console.log('🚀 [INSTALL_CLICKED] Starting custom installer');
console.log('✅ [SPAWN_OK] Interactive installer started successfully');
console.error('❌ [SPAWN_ERROR] Installation failed');
```

### 🔍 **Technical Implementation**

#### **Main Process (electron/main.ts):**
```typescript
// NEW: Custom Install IPC Handler
ipcMain.handle("updater:install-custom", async (event, { filePath, args, expectedSha256 }) => {
  // 1. File existence check
  // 2. Optional SHA256 verification  
  // 3. Interactive installer spawn
  // 4. Clean app exit for installer handover
});
```

#### **Preload (electron/preload.ts):**
```typescript
// NEW: Custom Install API
installCustom: (options: { filePath, args?, expectedSha256? }) => Promise<InstallResult>
```

#### **UI Component (AutoUpdaterModal.tsx):**
```typescript
// REPLACED: Legacy install() with new installCustom()
const result = await window.rawalite?.updater?.installCustom?.({
  filePath: downloadedFile,
  args: [], // Interactive Installation
});
```

### 📋 **Goldene Regeln Compliance**

- ✅ **Keine externen Links:** Nur interne IPC-Kommunikation
- ✅ **PNPM-only:** Alle Dependencies über pnpm verwaltet  
- ✅ **Strikte In-App Updates:** Kein shell.openExternal verwendet
- ✅ **Interactive Installation:** Windows-Standard UX befolgt
- ✅ **Race-Condition Safe:** Button nur aktiv wenn Pfad persistiert
- ✅ **Comprehensive Logging:** Alle wichtigen Events geloggt

### 🎯 **Expected Behavior**

**Update Flow v1.8.71 → v1.8.72:**
1. **Check Updates:** Custom Updater erkennt v1.8.72
2. **Download:** Custom Downloader lädt .exe herunter  
3. **Install Ready:** Button wird aktiv (nur wenn filePath verfügbar)
4. **Install Click:** `installCustom()` statt `quitAndInstall()` 
5. **Interactive Installer:** Sichtbarer NSIS-Dialog startet
6. **User durch Installation:** Next → Install → Finish
7. **Automatic Restart:** App startet automatisch neu

### 🧪 **Success Criteria**

- ✅ **Sichtbare Installation:** Installer-UI erscheint (kein unsichtbarer Prozess)
- ✅ **No quitAndInstall():** Alte electron-updater API komplett entfernt
- ✅ **Consistent Logging:** Install-Events klar ersichtlich in Logs
- ✅ **Stable Process:** Keine Race Conditions zwischen Download/Install
- ✅ **Standard Windows UX:** Interactive Installation wie erwartet

---

**Version:** 1.8.72  
**Build:** 2025-01-21T09:30:00.000Z  
**Type:** MINOR (New Custom Install API)  
**Upgrade:** Complete Custom Install Routine Implementation