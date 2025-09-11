# RawaLite Installationsanleitung

## 📦 **Für Tester - Windows Installation**

### **Schnelle Installation**

1. **Herunterladen** des Installers: `RawaLite Setup 1.0.0.exe`
2. **Rechtsklick** → "Als Administrator ausführen"
3. **Installationsassistent** folgen
4. **Starten** über Startmenü: "RawaLite"

### **Installationsdetails**

- **Installer-Größe:** ~150-200 MB
- **Installationspfad:** `C:\Users\[Benutzername]\AppData\Local\Programs\RawaLite\`
- **Datenspeicher:** `C:\Users\[Benutzername]\AppData\Roaming\RawaLite\`
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

#### **3. Nummerierungskonfiguration**
```
Einstellungen → Nummernkreise
├── Kundennummern (K-001, K-002, ...)
├── Rechnungsnummern (R-001, R-002, ...)
├── Angebotsnummern (A-001, A-002, ...)
└── Paketnummern (P-001, P-002, ...)
```

#### **4. Tätigkeiten-Setup (für Leistungsnachweise)**
```
Einstellungen → Tätigkeiten
├── Tätigkeiten hinzufügen (z.B. "Entwicklung", "Beratung")
├── Stundensätze pro Tätigkeit festlegen
└── Als Aktiv/Inaktiv markieren
```

## 🧪 **Test-Checkliste**

### **Hauptfunktionen zum Testen**

#### **✅ Kundenverwaltung**
- [ ] Neuen Kunden erstellen
- [ ] Kundendetails bearbeiten
- [ ] Kunden löschen
- [ ] Kunden suchen
- [ ] Auto-Nummerierung funktioniert

#### **✅ Paketverwaltung**
- [ ] Paket mit Positionen erstellen
- [ ] Unterpakete hinzufügen
- [ ] Paketdetails bearbeiten
- [ ] Pakete löschen
- [ ] Preisberechnungen

#### **✅ Angebots-Workflow**
- [ ] Angebotsentwurf erstellen
- [ ] Pakete zu Angebot hinzufügen
- [ ] PDF-Vorschau generieren
- [ ] Als versendet markieren
- [ ] Angebote annehmen/ablehnen
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