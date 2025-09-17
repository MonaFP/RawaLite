# RawaLite v1.8.3 - Umfassendes Suche/Filter/Sortierung-System

## 🚀 Hauptfeatures

### **Persistente Listen-Präferenzen**
- **Pro-Entität Einstellungen**: Individuelle Präferenzen für Kunden, Pakete, Angebote, Rechnungen und Leistungsnachweise
- **SQLite Persistence**: Alle Einstellungen werden dauerhaft in der Datenbank gespeichert
- **Automatische Wiederherstellung**: Listen-Zustand bleibt nach App-Restart erhalten

### **Erweiterte Such- und Filterfunktionen**
- **Real-Time Suche**: Sofortige Filterung während der Eingabe
- **Multi-Select Filter**: Mehrfachauswahl für Status, Kategorien etc.
- **Datum-Bereichs-Filter**: Flexible Zeitraum-Filterung für alle Entitäten
- **Filter-Chips**: Visuelle Darstellung aktiver Filter mit 1-Klick-Entfernung

### **Enhanced Table-Komponente**
- **Spalten-Sortierung**: Klick-basierte Sortierung mit visueller Indikation
- **Spalten-Auswahl**: Toggle-Menü für dynamische Spalten-Anzeige
- **Pagination**: Konfigurierbare Seitengröße (10, 25, 50, 100 Einträge)
- **Responsive Design**: Optimiert für verschiedene Bildschirmgrößen

## 🏗️ Technische Verbesserungen

### **Neue Architektur-Komponenten**
- `useListPreferences` Hook für zentrale Präferenz-Verwaltung
- `SearchInput` Component für universelle Such-Funktionalität  
- `FilterComponents` Suite (MultiSelect, DateRange, FilterChips)
- Enhanced `Table.tsx` mit erweiterten Funktionalitäten

### **Datenbank-Erweiterung**
- Neue `listPreferences` Spalte in Settings-Tabelle
- Additive Migration ohne Breaking Changes
- Backward-Kompatibilität zu älteren Versionen

### **Performance-Optimierungen**
- Memoization für komplexe Filter-Operationen
- Optimistische Updates mit Rollback-Mechanismus
- Effiziente State-Synchronisation zwischen UI und Persistence

## 🧪 Qualitätssicherung

### **Umfassende Test-Suite**
- **11/11 Unit Tests** erfolgreich für useListPreferences Hook
- **Integration Tests** für Persistence Layer
- **Mock Setup** für isolierte Component Tests
- **TypeScript Validation** für alle neuen Interfaces

### **Code-Qualität**
- Strikte TypeScript-Typisierung für alle Filter-Definitionen
- Einheitliche Error-Handling Patterns
- Konsistente Naming-Conventions

## 📊 Entwicklungs-Metriken

- **~1200 neue Code-Zeilen**
- **6 neue Dateien** (hooks, components, lib, tests)
- **4 erweiterte bestehende Dateien**
- **13 Dateien total geändert** mit 1741 insertions
- **Null Breaking Changes** - vollständig backward-kompatibel

---

## v1.8.1 - Kritische System-Reparaturen

### 🔧 Kritische Bugfixes

#### Update-System repariert
- **quitAndInstall Parameter korrigiert**: `quitAndInstall(false, true)` → `quitAndInstall(false, false)`
- **App-Restart Probleme behoben**: Updates werden nun korrekt installiert
- **Electron-Updater Stabilität**: Keine Hanging-Prozesse mehr nach Update-Download

#### Leistungsnachweise funktionsfähig
- **Activities-Validation entfernt**: Leistungsnachweise können jetzt ohne Activities erstellt werden
- **Workflow korrigiert**: BasicForm → Speichern → Activities später hinzufügen
- **ValidationError behoben**: "Mindestens eine Aktivität erforderlich" nicht mehr bei Erstellung

#### Logo-System vollständig funktional
- **IPC-Handler korrekt initialisiert**: `initializeLogoSystem()` beim App-Start
- **Base64-Fallback aktiv**: Funktioniert auch wenn IPC nicht verfügbar
- **SVG-Sanitization**: Sicherheitsstandards vollständig implementiert

---

**Download:** [GitHub Releases](https://github.com/MonaFP/RawaLite/releases/latest)