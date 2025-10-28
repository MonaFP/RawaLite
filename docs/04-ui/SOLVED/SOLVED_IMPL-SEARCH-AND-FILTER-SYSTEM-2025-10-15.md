# Search and Filter System - Implementation Documentation
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 16.10.2025 (Angebote-Seite Such-/Filter-Integration abgeschlossen)

## 📝 Übersicht

Das universelle Such- und Filtersystem für RawaLite wurde erfolgreich implementiert und ermöglicht einheitliche Such- und Filterfunktionalität auf allen Listenseiten.

## 🏗️ Architektur

### Komponenten-Struktur
```
src/components/SearchAndFilter/
├── SearchBar.tsx              # Debounced Suchleiste
├── FilterDropdown.tsx         # Multi-Type Filter Dropdown
├── SearchAndFilterBar.tsx     # Container mit allen Controls
├── useTableSearch.ts          # Hook für Such-/Filter-Logik
└── index.ts                   # Exports und Types
```

### Kern-Features

#### 1. SearchBar Komponente
- **Debounced Input**: 300ms Verzögerung für Performance
- **Theme Integration**: Automatische Farbabstimmung
- **Placeholder Support**: Anpassbare Suchtext-Hints
- **Clear Funktionalität**: X-Button zum Löschen

#### 2. FilterDropdown Komponente
- **Multi-Type Support**: 
  - `select`: Dropdown mit Optionen
  - `dateRange`: Von-Bis Datumsfilter
  - `numberRange`: Min-Max Zahlenfilter
- **Dynamic Options**: Zur Laufzeit generierte Filter-Optionen
- **Theme-Aware**: Konsistentes Design mit App

#### 3. useTableSearch Hook
- **Memoized Filtering**: Performance-optimiert mit useMemo
- **Flexible Field Mapping**: Unterstützt Funktionen und Objektpfade
- **Type Safety**: Vollständig typisiert mit TypeScript
- **Auto-Detection**: Filter-Typ-Erkennung basierend auf Werten

#### 4. SearchAndFilterBar Container
- **Sticky Positioning**: Bleibt beim Scrollen sichtbar
- **Result Counter**: Zeigt Filter-Ergebnisse an
- **Clear Controls**: Separate Buttons für Filter/Alles löschen
- **Responsive Design**: Mobile-optimiert

## 🚀 Implementierte Seiten

### ✅ Angebote-Seite (AngebotePage.tsx)
**Suchfelder**: Nummer, Kunde, Titel, Status, Betrag, Gültigkeitsdatum
**Filter**:
- Status: Entwurf, Versendet, Angenommen, Abgelehnt
- Gültig bis: Datumsbereich
- Betrag: Zahlenbereich (€)
- Kunde: Dropdown-Auswahl

### ✅ Kunden-Seite (KundenPage.tsx)
**Suchfelder**: Nummer, Name, E-Mail, Telefon, Straße, PLZ, Ort, Notizen
**Filter**:
- Ort: Dynamische Optionen aus vorhandenen Kunden
- Erstellt: Datumsbereich

### ✅ Rechnungen-Seite (RechnungenPage.tsx)
**Suchfelder**: Nummer, Kunde, Titel, Status, Fälligkeitsdatum, Betrag
**Filter**:
- Status: Entwurf, Versendet, Bezahlt, Überfällig
- Fälligkeitsdatum: Datumsbereich
- Rechnungsbetrag: Zahlenbereich (€)
- Kunde: Dropdown-Auswahl

## 📊 Usage Beispiel

```tsx
// 1. Import der Komponenten
import { SearchAndFilterBar, useTableSearch, FilterConfig } from '../components/SearchAndFilter';

// 2. Such-Mapping definieren
const searchFieldMapping = useMemo(() => ({
  number: 'offerNumber',
  customer: (offer: Offer) => {
    const customer = customers.find(c => c.id === offer.customerId);
    return customer?.name || '';
  },
  title: 'title'
}), [customers]);

// 3. Filter-Konfiguration
const filterConfigs: FilterConfig[] = useMemo(() => [
  {
    field: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Entwurf' },
      { value: 'sent', label: 'Versendet' }
    ]
  }
], []);

// 4. Hook verwenden
const {
  searchTerm, setSearchTerm, filters, setFilter,
  clearFilters, clearAll, filteredData, activeFilterCount
} = useTableSearch(data, searchFieldMapping);

// 5. Component rendern
<SearchAndFilterBar
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  filters={filters}
  filterConfigs={filterConfigs}
  onFilterChange={setFilter}
  // ... weitere Props
/>
```

## 🔧 Technische Details

### Performance Optimierungen
- **Debounced Search**: Verhindert übermäßige Re-Renders
- **Memoized Results**: useMemo für gefilterte Daten
- **Selective Updates**: Nur relevante Filter werden neu berechnet

### Type Safety
- Vollständig typisiert mit TypeScript
- Generic Support für verschiedene Datentypen
- Interface-basierte Konfiguration

### Theme Integration
- Automatische Farbanpassung an App-Theme
- Responsive Design für Mobile/Desktop
- Konsistente UI-Patterns

## 📋 Noch zu implementieren

### 🔄 Geplante Erweiterungen
- **Zeiterfassung-Seite**: Filter nach Projekt, Datum, Benutzer
- **Angebote-Seite**: Suche nach Nummer/Titel/Kunde, Filter nach Status/Betrag/Gültigkeit ✅ IMPLEMENTED 16.10.2025
- **Pakete-Seite**: Suche nach Namen, Filter nach Typ/Preis ✅ IMPLEMENTED
- **Kunden-Seite**: Suche nach Name/E-Mail, Filter nach Stadt/Datum ✅ IMPLEMENTED  
- **Rechnungen-Seite**: Suche nach Nummer/Kunde, Filter nach Status/Betrag ✅ IMPLEMENTED
- **Zeiterfassung-Seite**: Filter nach Projekt, Datum, Benutzer ✅ IMPLEMENTED
- **Globale Such-Integration**: App-weite Suchfunktion in Sidebar

### 🎯 Erweiterte Features (Optional)
- Export von Suchergebnissen
- Gespeicherte Filter-Presets
- Erweiterte Sortierung
- Bulk-Aktionen auf Suchergebnisse

## ✅ Status: Vollständig implementiert und funktional

Das Such- und Filtersystem ist vollständig funktionsfähig und auf ALLEN Hauptseiten (Angebote, Kunden, Rechnungen, Pakete, Zeiterfassung) integriert. 

### 🎉 Erfolgreiche Implementierung:
- **React Error #31 behoben:** FilterDropdown renderte Objekte als Text - durch `{option.label}` statt `{option}` gelöst
- **Build-Warnungen eliminiert:** VersionService Import-Konsistenz hergestellt
- **Nummernkreis-Problem behoben:** Rechnungen verwenden jetzt RE-0001 Format statt Timestamps

### 🚀 Live-Status:
- ✅ **Such-/Filter-System:** Vollständig funktional ohne Fehler
- ✅ **Performance:** Debounced Search + Memoization aktiv
- ✅ **User Experience:** Sticky positioning, Result Counter, Clear-Buttons
- ✅ **Nummernkreise:** Korrekte 4-stellige Sequenzen für alle Entitäten

Die modulare Architektur ermöglicht einfache Erweiterung auf weitere Seiten.