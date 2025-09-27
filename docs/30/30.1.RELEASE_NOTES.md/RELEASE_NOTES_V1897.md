# RawaLite v1.8.97 - Code-Bereinigung: UAC-Problem vereinfacht

## 🔧 Technische Verbesserungen

### ❌ Entfernt (Komplexe Altlasten):
- Alle komplexen Install-Handler (200+ Zeilen entfernt)
- execFile, ChildProcess Import-Dependencies 
- tryPowershellRunAs Fallback-Mechanismen
- Überkomplizierte PowerShell-Scripts mit System.Diagnostics
- Fehleranfällige Template-Literal-Konstruktionen

### ✅ Vereinfacht auf Essentials:
- **1-Zeilen PowerShell-Lösung**: Maximale Simplizität
- **UAC-Fix**: `Start-Process -Wait` verhindert App/Installer-Schließung  
- **Sauberer Code**: Von ~800 auf ~50 Zeilen Installation reduziert
- **Build-Stabilität**: Keine TypeScript-Compilation-Errors mehr

## 🎯 Ziel: UAC-Problem lösen

**Problem**: Nach UAC "Ja"-Klick schließen sich App + NSIS-Installer sofort
**Lösung**: `-Wait` Parameter hält beide Prozesse am Leben

## 📋 PowerShell-Command (Vereinfacht)
```powershell
Start-Process -FilePath "installer.exe" -ArgumentList "/NCRC" -Verb RunAs -Wait
```

## ⚠️ Test erforderlich
Bitte Update-Prozess testen:
1. Update-Button klicken
2. Bei UAC-Meldung "Ja" wählen  
3. Prüfen: Bleiben App + NSIS-Installer sichtbar?

**Erwartung**: Mit `-Wait` sollten beide Prozesse während Installation geöffnet bleiben.