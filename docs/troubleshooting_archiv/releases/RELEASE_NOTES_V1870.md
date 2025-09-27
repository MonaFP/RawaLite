# RawaLite v1.8.70 Release Notes
## 🔧 **Interactive Installation System - Fixed**

### 🐛 **Problem von v1.8.69 behoben**

**Issue:** Interactive Installer startete nicht sichtbar - kein PowerShell-Fenster, keine UI
**Root Cause:** `detached: true` + `stdio: "ignore"` + `child.unref()` machte Installer unsichtbar
**Solution:** Reparierte spawn() Parameter für sichtbare Interactive Installation

### ✅ **Reparierte Interactive Installation**

**Neue spawn() Konfiguration:**
```typescript
// VORHER (v1.8.69): Unsichtbar
spawn(candidate, [], {
  detached: true,     // ❌ Installer läuft im Hintergrund
  stdio: "ignore"     // ❌ Keine UI-Interaktion möglich
});
child.unref();        // ❌ Prozess sofort detached

// NACHHER (v1.8.70): Sichtbar ✅
spawn(candidate, [], {
  detached: false,    // ✅ Installer bleibt attached für UI
  stdio: "pipe",      // ✅ UI-Interaktion möglich
  windowsHide: false  // ✅ Installer-Fenster wird angezeigt
});
// Kein unref() - Installer bleibt sichtbar
```

### 🎯 **Erwartetes Verhalten (Fixed)**

**Interactive Installation jetzt:**
1. **Sichtbarer NSIS-Installer** startet (Windows-Standard UI)
2. **User kann durchklicken** (Next, Install, Finish buttons)
3. **Progress-Anzeige** zeigt Installation-Status
4. **Automatischer Restart** nach Installation (runAfterFinish=true)

### 📋 **Test-Szenario v1.8.70**

**Update-Flow Test:**
- **Von:** RawaLite v1.8.68 (installiert)
- **Zu:** RawaLite v1.8.70 (dieser Fix)
- **Erwartung:** Sichtbare Interactive Installation funktioniert

**Success Criteria:**
- ✅ Installer-UI erscheint (nicht unsichtbar im Hintergrund)
- ✅ User kann Installation steuern und überwachen  
- ✅ Standard Windows-Installation Experience
- ✅ Automatischer App-Neustart funktioniert

### 🔍 **Technical Fix Details**

**spawn() Parameter adjustiert:**
- `detached: false` → Installer bleibt mit Main-Process verbunden für UI
- `stdio: "pipe"` → Ermöglicht UI-Interaktion zwischen Installer und System
- `windowsHide: false` → Explizit Installer-Fenster anzeigen
- Entfernt: `child.unref()` → Verhindert vorzeitiges Detaching

**Event Handlers hinzugefügt:**
- `child.on("error")` → Spawn-Fehler abfangen
- `child.on("close")` → Installation-Completion tracking

---

**Version:** 1.8.70  
**Build:** 2025-01-21T09:00:00.000Z  
**Type:** PATCH (Interactive Installation Fix)  
**Fix:** Sichtbare Interactive Installation repariert