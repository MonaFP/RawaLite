# GitHub Release Guidelines - RawaLite

## 🚨 **Wichtige Datenschutz-Richtlinien**

### **Was NICHT in Release-Beschreibungen gehört:**
❌ **Persönliche Hardware-Daten**: 
- Spezifische Computer-Namen (z.B. "ASUS MONAPC")
- Hardware-Spezifikationen (z.B. "16GB RAM")
- Persönliche Entwicklungsumgebung-Details

❌ **Spezifische Software-Versionen**: 
- Genaue VS Code Versionen (z.B. "v1.103.2")
- Entwickler-spezifische Tool-Versionen

❌ **Interne Entwicklungsdetails**:
- Spezifische Ordnerpfade vom Entwicklungsrechner
- Interne Debug-Informationen
- Persönliche Workspace-Konfiguration

### **Was in Release-Beschreibungen gehört:**
✅ **Feature-Beschreibungen**:
- Neue Funktionen und Verbesserungen
- Bug-Fixes und Stabilitätsverbesserungen
- Benutzer-relevante Änderungen

✅ **Technische Mindestanforderungen** (generisch):
- "Node.js 20.x oder höher"
- "Windows 10/11 mit PowerShell"
- "Latest LTS Versionen empfohlen"

✅ **Update-Hinweise**:
- Breaking Changes für Benutzer
- Migrations-Hinweise
- Backup-Empfehlungen

## 🔄 **Release-Erstellungs-Workflow**

### **1. Vorbereitung**
```powershell
# Version in package.json aktualisieren
# Version in src/services/VersionService.ts aktualisieren (BASE_VERSION)
# Build-Datum in VersionService.ts aktualisieren (BUILD_DATE)
```

### **2. GitHub Release erstellen**
```powershell
# Saubere Release-Beschreibung (OHNE persönliche Daten!)
& "C:\Program Files\GitHub CLI\gh.exe" release create vX.Y.Z \
  --title "RawaLite vX.Y.Z - Feature-Name" \
  --notes "
🆕 **Neue Features:**
- Feature 1 Beschreibung
- Feature 2 Beschreibung

🐛 **Bug-Fixes:**
- Fix 1 Beschreibung
- Fix 2 Beschreibung

🔧 **Verbesserungen:**
- Verbesserung 1
- Verbesserung 2

📋 **System-Anforderungen:**
- Windows 10/11
- Node.js 20.x+
- PowerShell 7.x (empfohlen)

💾 **Update-Hinweise:**
Automatische Datenbank-Migration enthalten.
Kein manueller Eingriff erforderlich.
"
```

### **3. Qualitätskontrolle**
✅ **Vor Release-Veröffentlichung prüfen:**
- [ ] Keine persönlichen Hardware-Daten
- [ ] Keine spezifischen Entwicklungsumgebung-Details  
- [ ] Keine internen Pfade oder Debug-Informationen
- [ ] Benutzer-fokussierte Beschreibung
- [ ] Technische Anforderungen sind generisch

### **4. Automatische Bereinigung**
Wenn versehentlich persönliche Daten enthalten sind:
```powershell
# Release bearbeiten
& "C:\Program Files\GitHub CLI\gh.exe" release edit vX.Y.Z --notes "NEUE_SAUBERE_BESCHREIBUNG"
```

## 📝 **Template für Release-Beschreibungen**

```markdown
🆕 **Neue Features:**
- [Feature-Liste basierend auf tatsächlichen Änderungen]

🐛 **Bug-Fixes:**
- [Fix-Liste basierend auf gelösten Issues]

🔧 **Verbesserungen:**
- [Performance, UI/UX, Stabilität]

📋 **System-Anforderungen:**
- Windows 10/11
- Node.js 20.x oder höher
- PowerShell 7.x (empfohlen)
- VS Code Latest LTS (für Entwicklung)

💾 **Update-Hinweise:**
[Spezifische Update-Anweisungen falls nötig]
```

## 🎯 **Ziel**
Professionelle, benutzer-fokussierte Release-Beschreibungen ohne persönliche Entwicklungsdaten.

---

**Wichtig**: Diese Richtlinien IMMER befolgen, um Datenschutz zu gewährleisten und professionelle GitHub Releases zu erstellen.