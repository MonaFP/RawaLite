# 📋 RawaLite Release Notes Collection

> **Zentrale Sammlung aller Release-Dokumentation und -Analysen**

## 📁 **Ordnerstruktur**

### **Release Notes (Chronologisch)**
- **Aktuelle Releases**: Detaillierte Release Notes für jede Version
- **Patch Notes**: Bug-Fixes und kleinere Verbesserungen
- **Feature Releases**: Neue Funktionalitäten und größere Updates
- **Critical Fixes**: Notfall-Releases und Sicherheits-Updates

### **Release-Analyse**
- **Performance-Tracking**: Build-Größen, Performance-Metriken
- **Asset-Analyse**: Download-Statistiken, Plattform-Verteilung
- **User-Feedback**: Community-Reaktionen und Bug-Reports
- **Technical Debt**: Erkannte Probleme für zukünftige Releases

## 🎯 **Verwendung**

### **Für Entwickler:**
```bash
# Neue Release Notes erstellen
docs/releases/v1.8.30-release-notes.md

# Template verwenden
cp docs/releases/TEMPLATE.md docs/releases/v1.8.31-release-notes.md
```

### **Für Release-Management:**
- **Pre-Release**: Review vorheriger Notes für Patterns
- **Post-Release**: Dokumentation von Lessons Learned
- **Changelog**: Automatische Generierung aus Release Notes

### **Für User-Communication:**
- **GitHub Releases**: Copy-Paste aus strukturierten Notes
- **Update-Notifications**: Extraktion key features
- **Documentation Updates**: Reference für User-Manual Updates

## 📊 **Metriken & Tracking**

### **Release-Qualität:**
- Build-Zeit und Asset-Größen
- Test-Coverage und Bug-Rate
- User-Adoption und Feedback-Score

### **Development-Velocity:**
- Features pro Release
- Bug-Fix-Rate
- Time-to-Release nach Feature-Completion

---

## 🔄 **Migration Information**

Am 23. September 2025 wurden alle Release Notes aus dem Root-Verzeichnis in diesen zentralen Ordner migriert. Dies verbessert die Repository-Organisation und erleichtert das Auffinden historischer Informationen zu Releases.

Die Migration umfasste:
- 33 Release Notes Dateien (v1.8.31 bis v1.8.91)
- Konsistente Namenskonvention (`RELEASE_NOTES_V[Version].md`)

*Letzte Aktualisierung: 23. September 2025*