# PDF-Workflow

## Überblick
Das PDF-System von RawaLite generiert professionelle Geschäftsdokumente (Angebote, Rechnungen, Leistungsnachweise) vollständig offline mit lokalen Assets und Templates.

## Verbindliche Pipeline

Der PDF-Workflow folgt einer strikten 3-Stufen-Pipeline:

### 1. PDFService (`src/services/PDFService.ts`)
- **Aufgabe**: HTML-zu-PDF-Konvertierung
- **Input**: Business-Daten (Angebot, Rechnung, Timesheet)
- **Output**: Basis-PDF mit eingebettetem HTML/CSS
- **Technologie**: Electron BrowserWindow mit Print-to-PDF API
- **Template-Laden**: Lokale HTML-Templates aus `/templates/`-Verzeichnis

### 2. PDFPostProcessor (`src/services/PDFPostProcessor.ts`)
- **Aufgabe**: PDF/A-Konvertierung und Qualitätsverbesserung
- **Input**: Basis-PDF vom PDFService
- **Output**: PDF/A-2b konforme Datei (DIN 5008 Standard)
- **Funktionen**:
  - Font-Einbettung validieren
  - Metadaten normalisieren
  - PDF/A-2b Compliance sicherstellen
  - Dateigröße optimieren

### 3. Templates (`/templates/`)
- **Aufgabe**: HTML/CSS-Vorlagen für Dokumenttypen
- **Struktur**:
  - `offer.html` - Angebotsvorlage
  - `invoice.html` - Rechnungsvorlage  
  - `timesheet.html` - Leistungsnachweis-Vorlage
  - `assets/` - Lokale Ressourcen (Fonts, Styles)

## Asset-Management

### Lokale Font-Einbettung
- **Regel**: Alle Fonts müssen lokal im Repository liegen
- **Pfad**: `/templates/assets/fonts/`
- **Erlaubte Lizenzen**:
  - SIL Open Font License (OFL)
  - Kommerzielle Lizenzen mit expliziter Einbettungserlaubnis
  - Nicht erlaubt: Web-Fonts von Google Fonts, Adobe Fonts, etc.

### CSS und Assets
- **Regel**: Keine externen URLs in Templates
- **Verboten**: `@import url()`, `<link href="http://">`, `<img src="http://">`
- **Erlaubt**: Nur relative Pfade zu lokalen Dateien
- **Base64-Einbettung**: Für kleine Icons und Grafiken empfohlen

### Logo-Integration
- **Firmen-Logo**: Über `LogoService` hochgeladen und lokal gespeichert
- **Template-Integration**: Logo wird als `data:` URI eingebettet
- **Formate**: SVG (bevorzugt), PNG, JPEG

## Fehlerbehandlung

### Template-Loading
- **Missing Template**: Fallback auf Standard-Template
- **Fehlerhafte Syntax**: Logging und Standardwerte einsetzen
- **Asset-Fehler**: Template ohne Asset rendern, Warnung loggen

### PDF-Generierung
- **Render-Fehler**: Retry mit vereinfachtem Template
- **PostProcessor-Fehler**: Basis-PDF ohne PDF/A-Konvertierung ausgeben
- **Speicher-Limits**: Schrittweise Template-Vereinfachung

## Theme Integration

- **Theme-Variablen**: CSS Custom Properties für aktuelle Theme-Farben
- **Template-Updates**: Automatische Theme-Farben in PDF-Templates
- **Konsistenz**: UI-Theme wird 1:1 in PDFs übernommen

## Qualitätssicherung

### Deterministische Tests
- **Snapshot-Tests**: Generierte PDFs müssen byte-identisch reproduzierbar sein
- **Template-Validierung**: HTML/CSS-Linting für alle Templates
- **Asset-Checks**: Alle referenzierten Dateien müssen existieren

### Offline-Anforderung
- **Regel**: PDF-Generation muss ohne Internetverbindung funktionieren
- **Test**: CI/CD läuft mit deaktiviertem Netzwerk
- **Validierung**: Keine HTTP-Requests während PDF-Erstellung

## Performance

- **Template-Caching**: HTML-Templates werden beim App-Start geladen
- **Asset-Optimierung**: Komprimierte Fonts und Bilder
- **Memory-Management**: PDF-Buffer werden nach Speichern freigegeben

## Pfad-Konfiguration

- **Template-Pfad**: Über `PATHS.templates()` aus `src/lib/paths.ts`
- **Output-Pfad**: Über `PATHS.documents()` (User-Downloads)
- **Cache-Pfad**: Über `PATHS.cache()` für temporäre PDF-Dateien

## DIN 5008 Compliance

- **Layout**: Geschäftsbriefnorm für alle Dokumenttypen
- **Schrift**: Professionelle Fonts (z.B. Source Sans Pro, Liberation Sans)
- **Abstände**: Normgerechte Zeilenhöhen und Ränder
- **Struktur**: Einheitlicher Aufbau (Header, Adressfeld, Inhalt, Footer)
