# UI, Theme & Navigation

## Überblick
RawaLite implementiert ein konsistentes Design-System mit persistenten Themes und flexiblen Navigation-Modi. Das Theme-System unterstützt fünf fest definierte Pastel-Farben und garantiert ein professionelles Erscheinungsbild.

## Theme-System

### Feste Farbpalette (NICHT ÄNDERBAR)
Die Farbpalette ist final definiert und darf niemals geändert werden:

- **salbeigrün**: `#9CAF88` - Beruhigend, professionell
- **himmelblau**: `#87CEEB` - Vertrauensvoll, klar  
- **lavendel**: `#B19CD9` - Elegant, kreativ
- **pfirsich**: `#FFCBA4` - Warm, einladend
- **rosé**: `#FFB6C1` - Freundlich, modern

### Theme-Varianten
- **Gradient-Support**: Automatische Gradient-Generierung für jede Farbe
- **Contrast-Optimization**: Automatische Text-Farben für optimale Lesbarkeit
- **Accessibility**: WCAG 2.1 AA konforme Kontrastverhältnisse
- **Dark/Light**: Responsive Anpassung an System-Theme

### Theme-Persistenz
- **Primary Storage**: SQLite über SettingsService
- **Dev-Fallback**: IndexedDB (Dexie) für Development-Mode
- **Cross-Session**: Theme-Auswahl bleibt über App-Neustarts erhalten
- **Real-Time**: Sofortige Anwendung ohne Neustart erforderlich

## Navigation-Modi

### Dual-Navigation-System
RawaLite unterstützt zwei Navigation-Modi, die zur Laufzeit umschaltbar sind:

#### Header-Modus
- **Navigation**: Im Header (horizontal)
- **Sidebar**: Enthält Widgets und Quick-Actions
- **Vorteil**: Mehr Platz für Hauptinhalt
- **Nutzung**: Bevorzugt für Content-intensive Workflows

#### Sidebar-Modus  
- **Navigation**: In der Sidebar (vertikal)
- **Header**: Enthält Widgets und Aktionen
- **Vorteil**: Klassisches Desktop-Layout
- **Nutzung**: Bevorzugt für Navigation-intensive Workflows

### Sidebar-Spezifikationen
- **Feste Breite**: 240px (nicht änderbar)
- **Responsive**: Automatische Anpassung des Main-Content
- **Collapse**: Optional einklappbar (in Sidebar-Modus)
- **Persistence**: Navigation-Modus wird persistent gespeichert

## FOUC-Vermeidung (Flash of Unstyled Content)

### Theme-Loading-Strategie
- **Pre-Render**: Theme wird vor erstem Render geladen
- **Blocking-Load**: App-Start wartet auf Theme-Verfügbarkeit
- **Fallback**: Default-Theme bei Load-Fehlern
- **Smooth-Transition**: Übergangslose Theme-Wechsel

### Implementation
```typescript
// Verhindert FOUC durch Pre-Loading
const theme = await settingsService.getTheme();
document.documentElement.setAttribute('data-theme', theme);
// Erst dann React-App rendern
```

### CSS-Integration
- **CSS Custom Properties**: Theme-Farben als CSS-Variablen
- **Immediate Application**: Keine Verzögerung bei Theme-Anwendung
- **Transition-Support**: Smooth-Transitions zwischen Themes

## Typografie-System

### Konsistente Schrift-Hierarchie
- **Primary Font**: Source Sans Pro (lokal gebundled)
- **Fallback**: System-Fonts (Segoe UI, Arial, sans-serif)
- **Font-Loading**: Lokale Fonts zur FOUC-Vermeidung
- **Sizes**: Definierte Größen-Skala (12px - 32px)

### Text-Konventionen
- **Headings**: h1-h6 mit konsistenten Größen und Gewichtungen
- **Body Text**: 14px Standard, 16px für Hauptinhalte
- **UI Elements**: 12px für Labels, 13px für Buttons
- **Code/Numbers**: Monospace-Font für Dokumentnummern

## Layout-System

### Grid-Based Layout
- **CSS Grid**: Hauptlayout mit definierten Grid-Areas
- **Flexbox**: Komponenten-interne Layouts
- **Responsive**: Anpassung an verschiedene Bildschirmgrößen
- **Consistent Spacing**: 8px-Grid für alle Abstände

### Component-Hierarchie
```
App Container
├── Header (Navigation oder Widgets)
├── Sidebar (Navigation oder Widgets) - 240px
└── Main Content (Dynamic)
```

### Breakpoints
- **Desktop**: > 1024px (Primary Target)
- **Laptop**: 768px - 1024px
- **Tablet**: 480px - 768px (Limited Support)
- **Mobile**: < 480px (Not Supported)

## Persistenz-Implementation

### Settings-Schema
```typescript
interface ThemeSettings {
  currentTheme: 'salbeigrün' | 'himmelblau' | 'lavendel' | 'pfirsich' | 'rosé';
  navigationMode: 'header' | 'sidebar';
  sidebarCollapsed: boolean;
  customizations: {
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
}
```

### Storage-Adapter
- **SQLite**: `settings` Tabelle mit JSON-Spalte für Theme-Config
- **IndexedDB**: Object Store für Development-Mode
- **Validation**: Schema-Validierung bei Load und Save
- **Migration**: Automatic Migration alter Theme-Configs

## Widget-System

### Sidebar-Widgets (Header-Modus)
- **Quick Actions**: Häufige Aktionen (Neues Angebot, Rechnung erstellen)
- **Recent Items**: Zuletzt bearbeitete Dokumente
- **Statistics**: Übersichtszahlen (Offene Angebote, Überfällige Rechnungen)
- **Notifications**: System-Benachrichtigungen und Updates

### Header-Widgets (Sidebar-Modus)
- **User Profile**: Firmen-Logo und Benutzername
- **Search**: Globale Suche über alle Entitäten
- **Settings**: Schnellzugriff auf Einstellungen
- **Version Badge**: Aktuelle Version mit Update-Indikator

## Responsive Design

### Adaptive Layout
- **Container**: Max-Width mit zentrierter Ausrichtung
- **Sidebar**: Automatisch hidden auf kleinen Bildschirmen
- **Navigation**: Collapsible Mobile-Menu
- **Tables**: Horizontal-Scroll für große Daten-Tabellen

### Touch-Optimierung (Optional)
- **Button-Sizes**: Minimum 44px für Touch-Targets
- **Gesture-Support**: Basic Touch-Gesten für Navigation
- **Scroll-Behavior**: Smooth-Scrolling in Listen

## Testing-Anforderungen

### Theme-Persistence Tests
```typescript
describe('Theme Persistence', () => {
  it('should persist theme across app restarts', async () => {
    await themeService.setTheme('lavendel');
    await simulateAppRestart();
    const currentTheme = await themeService.getTheme();
    expect(currentTheme).toBe('lavendel');
  });
});
```

### Navigation-Mode Tests
```typescript
describe('Navigation Mode', () => {
  it('should toggle between header and sidebar mode', async () => {
    await navigationService.setMode('sidebar');
    expect(document.body.getAttribute('data-nav-mode')).toBe('sidebar');
    
    await navigationService.setMode('header');
    expect(document.body.getAttribute('data-nav-mode')).toBe('header');
  });
});
```

### FOUC Prevention Tests
- **Load-Time**: Theme muss vor erstem Render verfügbar sein
- **Transition**: Keine sichtbaren Sprünge bei Theme-Wechsel
- **Performance**: Theme-Load darf App-Start nicht verzögern (< 100ms)

## Accessibility (A11y)

### Keyboard-Navigation
- **Tab-Order**: Logische Tab-Reihenfolge in allen Modi
- **Focus-Indicators**: Sichtbare Focus-States für alle interaktiven Elemente
- **Skip-Links**: Navigation-Sprungmarken für Screen-Reader

### Screen-Reader-Support
- **ARIA-Labels**: Beschriftung für alle UI-Elemente
- **Semantic HTML**: Korrekte HTML-Semantik für Navigation
- **Live-Regions**: Dynamische Content-Updates werden angekündigt

### Color-Contrast
- **WCAG AA**: Mindestens 4.5:1 Kontrastverhältnis für Text
- **Theme-Validation**: Alle Themes erfüllen Contrast-Requirements
- **High-Contrast**: Optional verfügbarer High-Contrast-Modus
