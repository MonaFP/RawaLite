# RawaLite Installationsanleitung

> **Installation & Setup Guide** - Version 1.5.5 (Current: Dezember 2024)

## 📦 **Für Tester - Windows Installation**

### **Schnelle Installation**

1. **Herunterladen** des Installers: `RawaLite Setup 1.5.5.exe` (167MB)
2. **Rechtsklick** → "Als Administrator ausführen" (empfohlen)
3. **Installationsassistent** folgen
4. **Starten** über Startmenü: "RawaLite"

### **Installationsdetails**

- **Installer-Größe:** 167MB (Electron + Dependencies)
- **Bundle-Größe:** 553kB (React App)
- **Installationspfad:** `C:\Users\[Benutzername]\AppData\Local\Programs\RawaLite\`
- **Datenspeicher:** `C:\Users\[Benutzername]\AppData\Roaming\RawaLite\database.sqlite`
- **Desktop-Verknüpfung:** Wird automatisch erstellt
- **Startmenü:** Zu Programmliste hinzugefügt

### **Erststart-Konfiguration**

#### **1. Firmenkonfiguration**
```
Einstellungen → Firmendaten
├── Firmenname (erforderlich)
├── Adressinformationen
├── Kontaktdaten
└── Steuerinformationen
```

#### **2. Logo-Einrichtung**
```
Einstellungen → Logo & Design
├── Firmenlogo hochladen (PNG/JPG)
├── Max. Größe: 2MB
└── Empfohlen: 200x80px
```

#### **3. Nummerierungskonfiguration (Auto-System)**
```
Automatische Nummerierung bereits konfiguriert:
├── Kundennummern (K-001, K-002, ...)
├── Angebotsnummern (AN-2025-0001, AN-2025-0002, ...)
├── Rechnungsnummern (RE-2025-0001, RE-2025-0002, ...)
├── Leistungsnachweise (LN-2025-0001, LN-2025-0002, ...)
└── Paketnummern (P-001, P-002, ...)
```

#### **4. Design-System (v1.5.2+)**
```
Einstellungen → Design & Themes
├── 5 Pastel Themes: Salbeigrün, Himmelblau, Lavendel, Pfirsich, Rosé
├── Navigation: Header-Modus ↔ Sidebar-Modus
├── Sofortige Anwendung (ohne Reload)
└── Automatische Persistierung in SQLite
```

## 🧪 **Test-Checkliste**

### **Hauptfunktionen zum Testen**

#### **✅ Auto-Nummerierung System (v1.5.5)**
- [ ] Kunden: K-001, K-002, K-003...
- [ ] Angebote: AN-2025-0001, AN-2025-0002...
- [ ] Rechnungen: RE-2025-0001, RE-2025-0002...
- [ ] Leistungsnachweise: LN-2025-0001, LN-2025-0002...
- [ ] Jahreswechsel: Neue Nummerierung ab 2026-0001

#### **✅ Theme System (v1.5.2+)**
- [ ] Pastel Theme wechseln (5 verfügbare Themes)
- [ ] Navigation Header ↔ Sidebar umschalten
- [ ] Theme-Persistierung nach Neustart
- [ ] Widgets wechseln Position automatisch

#### **✅ Kundenverwaltung**
- [ ] Neuen Kunden erstellen (auto K-001)
- [ ] Kundendetails bearbeiten
- [ ] Kunden löschen
- [ ] Kunden suchen
- [ ] Kundendaten exportieren

#### **✅ Paketverwaltung**
- [ ] Paket mit Positionen erstellen
- [ ] Unterpakete hinzufügen
- [ ] Paketdetails bearbeiten
- [ ] Pakete löschen
- [ ] Preisberechnungen

#### **✅ Angebots-Workflow**
- [ ] Angebotsentwurf erstellen (AN-2025-0001)
- [ ] Hierarchische LineItems hinzufügen
- [ ] Preisberechnung mit/ohne MwSt.
- [ ] PDF-Export funktioniert
- [ ] Status-Management (draft → sent → accepted/rejected)
- [ ] In Rechnung umwandeln

#### **✅ Rechnungsverwaltung**
- [ ] Rechnung manuell erstellen
- [ ] Aus angenommenem Angebot erstellen
- [ ] Fälligkeitsdaten setzen
- [ ] Als bezahlt markieren
- [ ] PDF generieren
- [ ] Status-Verfolgung

#### **✅ Leistungsnachweis-Verwaltung**
- [ ] Leistungsnachweis erstellen
- [ ] Mehrere Tätigkeiten hinzufügen
- [ ] Verschiedene Stundensätze setzen
- [ ] Summen berechnen
- [ ] Status-Workflow
- [ ] Berichte generieren

#### **✅ Einstellungen & Konfiguration**
- [ ] Firmendaten speichern
- [ ] Logo-Upload funktioniert
- [ ] Nummernkreise funktionieren
- [ ] Tätigkeitsverwaltung
- [ ] Backup erstellen
- [ ] Backup wiederherstellen

### **Leistungstests**

#### **✅ Datenvolumen**
- [ ] 50+ Kunden erstellen
- [ ] 20+ Pakete erstellen
- [ ] 30+ Angebote generieren
- [ ] 20+ Rechnungen bearbeiten
- [ ] 10+ Leistungsnachweise hinzufügen

#### **✅ UI-Reaktionsfähigkeit**
- [ ] Schnelle Navigation zwischen Seiten
- [ ] Schnelle Suchfunktionalität
- [ ] Reibungslose Formular-Interaktionen
- [ ] PDF-Generierungsgeschwindigkeit

## 🐛 **Bekannte Probleme & Fehlerbehebung**

### **Installationsprobleme**
```
Problem: "App startet nicht"
Lösung: Installer als Administrator ausführen

Problem: "Fehlende Abhängigkeiten"
Lösung: Visual C++ Redistributable 2022 installieren
```

### **Leistungsprobleme**
```
Problem: "Langsame PDF-Generierung"
Lösung: Normal beim ersten PDF (Cache-Aufbau)

Problem: "Datenbankfehler"
Lösung: Benutzerberechtigungen im AppData-Ordner prüfen
```

### **Datenprobleme**
```
Problem: "Datenverlust nach Update"
Lösung: Immer vor Test neuer Versionen Backup erstellen

Problem: "Nummerierungskonflikte"
Lösung: Nummernkreise in Einstellungen zurücksetzen
```

## 📊 **Test-Szenarien**

### **Szenario 1: Kompletter Geschäfts-Workflow**
1. Firma einrichten → Kunden hinzufügen → Pakete erstellen
2. Angebote generieren → Angebote annehmen → Rechnungen erstellen
3. Leistungsnachweise verfolgen → Berichte generieren → PDFs exportieren

### **Szenario 2: Datenverwaltung**
1. Beispieldaten erstellen → Backup exportieren
2. Alle Daten löschen → Backup importieren
3. Datenintegrität überprüfen

### **Szenario 3: Multi-User-Simulation**
1. Daten als "Benutzer A" erstellen
2. Backup erstellen und Datei teilen
3. Als "Benutzer B" auf anderem Rechner importieren

## 📝 **Feedback & Fehlerberichte**

### **Bitte melden:**
- ❌ Abstürze oder Einfrieren
- ❌ Datenverlust-Vorfälle
- ❌ PDF-Generierungsfehler
- ❌ UI/UX-Probleme
- ❌ Leistungsprobleme
- ✅ Feature-Vorschläge
- ✅ Workflow-Verbesserungen

### **In Berichten einschließen:**
- Windows-Version
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten
- Screenshots falls anwendbar
- Fehlermeldungen

## 🔄 **Deinstallation**

### **Saubere Entfernung**
1. **Windows-Einstellungen** → Apps → RawaLite → Deinstallieren
2. **Daten löschen** (optional): `%APPDATA%\RawaLite\`
3. **Desktop-Verknüpfung** manuell entfernen

---

## 👨‍💻 **Für Entwickler**

### **Entwicklungsumgebung**
```bash
# Voraussetzungen
node 20+, pnpm@9

# Installation
pnpm install

# Entwicklung
pnpm dev

# Installer erstellen
pnpm build
pnpm dist
```

### **Build-Ausgabe**
- **Installer:** `dist/RawaLite Setup 1.0.0.exe`
- **Portable:** `dist/win-unpacked/`
- **Blockmap:** `dist/RawaLite Setup 1.0.0.exe.blockmap`

**Hinweis:** NSIS erforderlich für Windows-Installer-Builds.