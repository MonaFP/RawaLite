🔄 **Auto-Restart Fix - NSIS Handover Optimized**

## ✅ **Implementierte Fixes**

### **🚀 Installer-Handover Optimization**
- **1.5s Delay**: Saubere Single-Instance Lock Release vor App-Exit  
- **app.exit(0)**: Hartes Exit statt `app.quit()` verhindert Race-Conditions
- **Error Handling**: Defensive Programmierung mit try/catch für alle kritischen Aufrufe
- **Spawn Cleanup**: Verbesserte Fehlerprotokollierung für Installer-Start

### **🔧 Technical Changes**

#### **electron/main.ts - updater:install Handler**
```typescript
// Vorher: Sofortiges app.quit() → Race-Conditions
// Nachher: 1.5s Delay + app.exit(0) für saubere NSIS-Übergabe

setTimeout(() => {
  try { log.info("🔚 [CUSTOM-UPDATER] Exiting app for installer handover"); } catch {}
  try { app.exit(0); } catch {}
}, 1500);
```

#### **Defensive Lock-Release**
```typescript
// Single-Instance-Lock nur freigeben, wenn verfügbar
try {
  app.releaseSingleInstanceLock?.();
  log.info("🔓 [CUSTOM-UPDATER] Released single instance lock for restart");
} catch {}
```

## 🎯 **Expected Result**

### **Update-Flow: v1.8.57 → v1.8.59**
1. **Download**: Custom Updater lädt v1.8.59 Setup
2. **Install**: User klickt "Installieren"
3. **Handover**: App startet NSIS-Installer + wartet 1.5s  
4. **Exit**: `app.exit(0)` beendet App sauber
5. **Install**: NSIS installiert neue Version
6. **Restart**: `runAfterFinish: true` startet App automatisch mit v1.8.59

## 🧪 **Test-Scenario**

Das kritische Problem war: **App schließt sich, NSIS läuft, aber App startet nicht automatisch neu.**

**Root Cause**: Race-Condition zwischen `app.quit()` und NSIS-Start → Single-Instance Lock nicht freigegeben → NSIS kann App nicht neu starten.

**Solution**: Delay + `app.exit(0)` + defensive Lock-Release → Saubere Übergabe an NSIS.

---
**Ready for final Auto-Restart test!** 🚀