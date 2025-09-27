# RawaLite v1.8.75 - Interactive Update Test Release

**🔄 Update-Test für Custom Install Routine**

## 🎯 Test-Ziel
Ende-zu-Ende Validierung des kompletten Custom Install Systems:
v1.8.74 → v1.8.75 Update mit installCustom() API

## 🔧 Custom Install Features (Bestätigt)
- **installCustom() API**: Ersetzt electron-updater quitAndInstall() vollständig
- **Interactive Installation**: Sichtbarer NSIS-Installer mit Standard Windows UI  
- **Process Management**: spawn() mit detached:true + shell:true + stdio:"ignore"
- **SHA256 Verification**: Optionale Sicherheitsprüfung vor Installation
- **Single Instance**: Korrekte App-Schließung für Installer-Handover

## 🚀 Technische Implementierung
```typescript
// Interactive Spawn Pattern (v1.8.74+)
spawn(filePath, args, {
  detached: true,   // Unabhängiger Prozess
  stdio: "ignore",  // Keine Pipe-Blockierung  
  shell: true,      // Windows Shell UI
  windowsHide: false
});
child.unref(); // Sofortige Trennung
```

## ✅ Erwarteter Update-Flow
1. **Update Check**: AutoUpdaterModal erkennt v1.8.75
2. **Download**: GitHub Asset Download mit Progress
3. **Install Trigger**: installCustom() statt quitAndInstall()
4. **App Closure**: RawaLite schließt sich sauber
5. **Interactive Install**: NSIS-Installer öffnet sich sichtbar
6. **Installation**: Standard Windows Setup-Prozess
7. **Auto-Restart**: App startet automatisch mit v1.8.75

## 🔍 Validierung
- [x] Lokale Installation v1.8.74 erfolgreich
- [ ] Update v1.8.74 → v1.8.75 über Custom Updater
- [ ] Interactive Installer Sichtbarkeit bestätigt  
- [ ] Automatischer App-Neustart nach Installation

---
**Release Date**: 2025-09-22  
**Build Target**: Windows x64  
**Update Method**: Custom In-App Updater mit GitHub Releases