# RawaLite - Professionelle Geschäftsverwaltungslösung

![RawaLite Logo](assets/rawalite-logo.png)

> **Version 1.0.0** - Professionelle Desktop-Anwendung für Geschäftsverwaltung

## 🏢 **Proprietäre Software**

**© 2025 MonaFP. Alle Rechte vorbehalten.**

Dies ist proprietäre Software. Aller Quellcode, Dokumentation und zugehörige Materialien sind vertraulich und durch Urheberrecht geschützt.

## ⚡ **Funktionen**

- 👥 **Kundenverwaltung** - Komplette Kundendatenbank mit Auto-Nummerierung
- 📦 **Paketverwaltung** - Hierarchische Pakete mit Unterpositionen
- 📋 **Professionelle Angebote** - Vom Entwurf bis zur Annahme-Workflow
- 🧾 **Rechnungsverwaltung** - Komplettes Abrechnungssystem mit Status-Verfolgung
- ⏱️ **Leistungsnachweis-Verwaltung** - Tätigkeitsbasierte Zeiterfassung mit Stundensätzen
- 🏢 **Firmen-Branding** - Logo-Integration und professionelle Präsentation
- 📊 **Dashboard-Übersicht** - Echtzeit-Geschäftsstatistiken
- 💾 **Lokale Datenbank** - Sichere SQLite-basierte Datenspeicherung
- 🎨 **Moderne Benutzeroberfläche** - Professionelles dunkles Theme-Design
- 📄 **PDF-Export** - Professionelle Dokumentenerstellung
- 🔄 **Datensicherung** - Komplette Backup- und Wiederherstellungsfunktionalität

## 🚀 **Technologie-Stack**

- **Desktop:** Electron 31.7.7
- **Frontend:** React 18.3.1 + TypeScript 5.5.4
- **Datenbank:** SQLite (via SQL.js)
- **Build:** Vite 5.4.0

## 📦 **Installation für Tester**

### **Windows-Installation**

1. **Herunterladen** des Installers: `RawaLite Setup 1.0.0.exe`
2. **Installer ausführen** als Administrator (Rechtsklick → "Als Administrator ausführen")
3. **Installationsassistent** folgen
4. **RawaLite starten** über Startmenü oder Desktop-Verknüpfung

### **Erststart**

1. **Firmendaten einrichten** - Gehe zu Einstellungen → Firmendaten
2. **Logo hinzufügen** - Einstellungen → Logo & Design
3. **Nummerierung konfigurieren** - Einstellungen → Nummernkreise
4. **Tätigkeiten erstellen** - Einstellungen → Tätigkeiten (für Leistungsnachweise)
5. **Beginnen** mit dem ersten Kunden

### **Test-Bereiche**

- ✅ Kundenverwaltung (erstellen, bearbeiten, löschen)
- ✅ Paketerstellung mit hierarchischer Struktur
- ✅ Angebots-Workflow (Entwurf → versendet → angenommen)
- ✅ Rechnungsgenerierung und Status-Verfolgung
- ✅ Leistungsnachweis-Erstellung mit Tätigkeiten
- ✅ PDF-Export-Funktionalität
- ✅ Datensicherung und Wiederherstellung
- ✅ Einstellungskonfiguration

## 📋 **Systemanforderungen**

- **Windows:** 10/11 (x64)
- **macOS:** 10.15+ (Intel/Apple Silicon) *[Demnächst]*
- **Linux:** Ubuntu 18.04+ oder gleichwertig *[Demnächst]*
- **Arbeitsspeicher:** 4GB RAM minimum
- **Speicherplatz:** 100MB freier Speicherplatz

## 🐛 **Tests & Feedback**

**Für Beta-Tester:**

1. **Alle Kernfunktionen testen** (Kunden, Pakete, Angebote, Rechnungen, Leistungsnachweise)
2. **PDF-Export ausprobieren** für Dokumente
3. **Backup/Wiederherstellung testen** 
4. **Bugs oder Vorschläge melden**
5. **Leistung und UI-Reaktionsfähigkeit prüfen**

**Häufige Probleme:**
- Falls App nicht startet, als Administrator ausführen
- Datenbank wird lokal im Benutzerprofil gespeichert
- Zur Fehlerbehebung Windows-Ereignisanzeige prüfen

## 🔄 **Updates**

Updates werden über die integrierte Update-Funktion bereitgestellt:
- Gehe zu Einstellungen → Updates
- Prüfe auf verfügbare Updates
- Automatischer Download und Installation

## 📚 **Dokumentation**

- **[Installationsanleitung](docs/INSTALL.md)** - Detaillierte Installationsanweisungen
- **[Entwicklerhandbuch](docs/DEV_GUIDE.md)** - Für Entwickler
- **[Architektur](docs/ARCHITEKTUR.md)** - Technische Details

## 📞 **Support**

**Für Entwickler:**
```bash
# Entwicklungsumgebung
node 20+, pnpm@9

# Installation
pnpm install

# Entwicklung starten
pnpm dev

# Installer erstellen
pnpm build
pnpm dist
```

---

**RawaLite** - Professionelle Geschäftsverwaltung leicht gemacht.  
© 2025 MonaFP. Alle Rechte vorbehalten.
