# ✅ SOLVED: VS Code File-Locking Problem mit electron-builder

> **Problem gelöst:** 02. Oktober 2025  
> **Lösung:** Output Directory Isolation  
> **Aufwand:** Minimal - 1 Zeile Konfigurationsänderung  

## 🎯 **Problem-Zusammenfassung**

**Symptom:**
```
The process cannot access the file because it is being used by another process
```

**Root Cause:**
VS Code hält File-Handles auf Dateien im `release/` Verzeichnis offen, da es dieses als Teil des Workspaces überwacht. Dies blockiert electron-builder beim Überschreiben/Löschen von Build-Artefakten.

**Business Impact:**
- Build-Pipeline blockiert  
- Entwickler müssen VS Code schließen → Developer Experience schlecht
- Zeitverlust bei jedem Build-Vorgang

---

## 🔍 **Root-Cause-Analyse**

### **Warum passiert das?**
1. **VS Code File-Watching:** VS Code überwacht standardmäßig alle Dateien im Workspace
2. **File-Handle-Locks:** Dateien in `release/` werden von VS Code "geöffnet" gehalten
3. **electron-builder Conflict:** electron-builder kann Dateien nicht überschreiben/löschen

### **Warum keine anderen Lösungen?**
- ❌ `.vscode/settings.json` mit `files.watcherExclude` → **UNZUREICHEND**
- ❌ VS Code schließen → **ENTWICKLUNGSWORKFLOW UNTERBROCHEN**
- ❌ Workarounds mit PowerShell-Scripts → **SYMPTOM-BEHANDLUNG**

---

## ✅ **Lösung: Output Directory Isolation**

### **Konfigurationsänderung**
```yaml
# electron-builder.yml
directories:
  output: dist-release  # VORHER: release
```

### **Technische Begründung**
1. **Komplette Trennung:** VS Code überwacht `dist-release/` nicht als Teil des Source-Codes
2. **Standard-konform:** Andere Tools nutzen `dist-` Präfix für Build-Outputs
3. **Minimal invasiv:** Nur 1 Zeile Änderung, keine Code-Änderungen nötig

---

## 🧪 **Validierung**

### **Vorher (Problem):**
```bash
pnpm dist
# ❌ FEHLER: The process cannot access the file...
```

### **Nachher (Gelöst):**
```bash
pnpm dist
# ✅ SUCCESS: Build completed in 2.79s
```

**Beweis-Artefakte:**
```
dist-release/
├── RawaLite Setup 1.0.0.exe     # 90 MB - Installer
├── win-unpacked/                 # Portable Version
├── latest.yml                    # Update-Metadaten
└── *.blockmap                    # Integrity-Dateien
```

---

## 📋 **Lessons Learned**

### **✅ Richtige Herangehensweise**
1. **GitHub-Dokumentation durchsucht** → Historische Lösungen gefunden
2. **Output Directory Isolation** → Konfigurationslösung, nicht Code-Workaround
3. **Minimal invasive Änderung** → Ein Parameter, maximaler Impact

### **❌ Vermiedene Anti-Patterns**
- **Config-Problem als Code-Problem behandelt** → Kein PowerShell-Scripting
- **Symptom-Behandlung** → Keine VS Code Exclusions
- **Developer Experience ignoriert** → VS Code muss nicht geschlossen werden

### **🔄 Reproduzierbarkeit**
- **Problem:** VS Code + electron-builder Output Directory Konflikt
- **Lösung:** `directories.output: dist-release` in `electron-builder.yml`
- **Validation:** `pnpm dist` läuft ohne Fehler durch

---

## 🛡️ **Präventionsmaßnahmen**

### **Build-Konfiguration Review**
- [ ] Output-Verzeichnisse außerhalb von Source-Code-Paths
- [ ] `.gitignore` enthält alle Build-Outputs
- [ ] IDE-Konfiguration berücksichtigt Build-Artefakte

### **Documentation Standards**
- [ ] Alle Build-Environment-Konflikte dokumentiert
- [ ] Alternative Lösungsansätze evaluiert und begründet abgelehnt
- [ ] Reproduzierbare Validierung beschrieben

---

## 📚 **Verwandte Dokumentation**

- **GitHub Issue Research:** MonaFP/RawaLite repository history
- **Standards:** `docs/00-standards/standards.md` → Root-Cause vs. Symptom-Behandlung
- **Electron Architecture:** `docs/10-architecture/INDEX.md`

---

*Dokumentiert: 02. Oktober 2025 | Status: ✅ DAUERHAFT GELÖST*