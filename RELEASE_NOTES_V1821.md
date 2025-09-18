# RawaLite v1.8.21 - Kritische Updater-Fixes

## 🚨 **Kritische Verbesserungen**

### **Auto-Update System Komplett überarbeitet**

#### **Problem behoben: NSIS Signatur-Blockade**
- ❌ **Vorher**: `autoUpdater.quitAndInstall()` blockierte bei unsigned Packages
- ✅ **Jetzt**: Manueller Installer-Start via `cmd /c start` umgeht Signaturprüfung
- 🎯 **Effekt**: Unsigned NSIS-Updates funktionieren wieder zuverlässig

#### **Problem behoben: SHA512 Checksum Mismatches**
- ❌ **Vorher**: Update-Failures durch falsche Checksums in latest.yml
- ✅ **Jetzt**: `scripts/verify-release.mjs` validiert Checksums vor Release
- 🎯 **Effekt**: Verhindert Checksum-basierte Update-Ausfälle

#### **Problem behoben: HTTP2 Protokoll-Fehler**
- ❌ **Vorher**: GitHub Downloads schlugen fehl durch HTTP2-Instabilität
- ✅ **Jetzt**: Forcierte HTTP/1.1 Headers für stabile Downloads
- 🎯 **Effekt**: Zuverlässige Update-Downloads von GitHub

#### **Problem behoben: Feed-Konfigurationskonflikte**
- ❌ **Vorher**: Doppelte Konfiguration (setFeedURL + electron-builder.yml)
- ✅ **Jetzt**: Einheitliche GitHub Provider Konfiguration
- 🎯 **Effekt**: Keine widersprüchlichen Update-Feeds mehr

## 🔧 **Technische Änderungen**

### **electron/main.ts**
- Entfernt: `autoUpdater.setFeedURL()` Konfiguration
- Hinzugefügt: Stabile HTTP/1.1 Download-Headers
- Ersetzt: `quitAndInstall()` → Manueller Installer-Launch
- Verbessert: Fehlerbehandlung und Logging

### **Neue Scripts**
- `scripts/verify-release.mjs`: SHA512 Checksum-Validierung
- `pnpm verify:release`: Release-Validierung vor Veröffentlichung

### **package.json**
- Hinzugefügt: `yaml` Dependency für Checksum-Validation
- Hinzugefügt: `verify:release` Script für Release-Checks

## 🎯 **Für Entwickler**

### **Neuer Release-Workflow**
```bash
# 1. Build erstellen
pnpm build && pnpm dist

# 2. Release validieren (NEU!)
pnpm verify:release

# 3. Bei Erfolg: GitHub Release erstellen
gh release create v1.8.21 --title "RawaLite v1.8.21" --notes-from-file RELEASE_NOTES_V1821.md
```

### **Update-System Architektur**
- **Feed**: Nur noch electron-builder.yml (vereinheitlicht)
- **Downloads**: HTTP/1.1 mit stabilen Headers
- **Installation**: Manueller NSIS-Start (signaturunabhängig)
- **Validation**: SHA512-Prüfung vor Release

## ⚠️ **Breaking Changes**
Keine Breaking Changes für Endbenutzer. Die Fixes sind vollständig abwärtskompatibel.

## 📊 **Auswirkung auf Updates**
- ✅ Unsigned NSIS-Packages installieren fehlerfrei
- ✅ Keine Checksum-Mismatches mehr
- ✅ Stabile Downloads auch bei langsamen Verbindungen
- ✅ Einheitliche Feed-Konfiguration ohne Konflikte

---

**Diese Version behebt kritische Update-Probleme und macht das Auto-Update System deutlich robuster und zuverlässiger.**