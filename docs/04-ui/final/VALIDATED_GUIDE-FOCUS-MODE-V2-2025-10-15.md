# Focus Mode v2.0 - Grid-Based Implementation

## Übersicht

Die Focus Mode wurde komplett überarbeitet, um eine stabilere, intuitivere und grid-basierte Benutzeroberfläche zu bieten. Die neue Implementation löst die Positionierungsprobleme der ursprünglichen Version und bietet direkten Moduswechsel ohne Umwege.

## Architektur-Änderungen

### CSS Grid Layout

**Vorher (v1.x):**
```css
.app {
  grid-template-areas:
    "sidebar header-container"
    "sidebar main";
}
```

**Nachher (v2.0):**
```css
.app {
  grid-template-areas:
    "sidebar header"
    "sidebar focus-bar"
    "sidebar main";
}
```

### Neue Grid-Struktur

Die App verwendet jetzt ein **3-Zeilen Grid**:
1. **Header-Zeile**: Eigentlicher Header mit Navigation/Titel
2. **Focus-Bar-Zeile**: Optische zweite Header-Zeile mit Focus Mode Buttons
3. **Main-Zeile**: Hauptinhalt

## User Interface Verbesserungen

### Multi-Button Interface

**Vorher:**
- Ein einziger Toggle-Button mit Cycling-Logik
- Unklarer aktueller Zustand
- Positionierungsprobleme bei kleinen Fenstern
- Keine Navigation in Focus Modi

**Nachher:**
- Vier separate Buttons: `Zen`, `Mini`, `Free`, `Exit`
- Klarer visueller Status mit Badges `[●]` / `[ ]`
- Horizontale Anordnung in der Focus-Bar
- **Hamburger Navigation**: Kompakte Navigation für alle Bereiche
- **Hamburger Navigation**: Kompakte Navigation für alle Bereiche

### Direkte Moduswechsel

**Neue Toggle-Logik:**
```typescript
// Context: FocusModeContext.tsx
const toggle = useCallback((v?: FocusVariant) => {
  const targetVariant = v || 'zen';
  
  if (!active) {
    // Aktiviere Focus Mode
    setActive(true);
    setVariant(targetVariant);
  } else if (variant === targetVariant) {
    // Gleicher Modus → Deaktivieren
    setActive(false);
    setVariant(null);
  } else {
    // Anderer Modus → Direkter Wechsel
    setVariant(targetVariant);
  }
}, [active, variant]);
```

**Verhalten:**
- **Normal → Zen**: Direkter Wechsel zu Zen Mode
- **Zen → Mini**: Direkter Wechsel ohne Deaktivierung
- **Mini → Mini**: Deaktiviert Mini Mode (zurück zu Normal)

## Focus Mode Varianten

### 1. Zen Mode
- **Sidebar**: Ausgeblendet
- **Header**: Normal (56px)
- **Focus Bar**: Sichtbar mit Buttons
- **Use Case**: Fokussierte Arbeit ohne Ablenkung durch Navigation

### 2. Mini Mode
- **Sidebar**: Ausgeblendet
- **Header**: Kompakt (32px, kleine Schrift)
- **Focus Bar**: Kompakt (32px, kleinere Buttons)
- **Use Case**: Maximaler Content-Platz bei minimaler UI

### 3. Free Mode
- **Sidebar**: Ausgeblendet
- **Header**: Komplett ausgeblendet
- **Focus Bar**: Sichtbar (einzige UI-Kontrolle)
- **Use Case**: Vollbildmodus nur mit Content

## Focus Mode Navigation

### Hamburger Menu System

In allen Focus Modi ist eine kompakte Navigation verfügbar, die es ermöglicht, zwischen verschiedenen Anwendungsbereichen zu wechseln, ohne den Fokus zu verlieren.

#### Navigation Layout
```
[☰ Navigation]                    [Zen] [Mini] [Free] [Exit]
```

#### Verfügbare Bereiche
- 📊 **Dashboard** - Übersicht und Statistiken
- 👥 **Kunden** - Kundenverwaltung
- 📄 **Angebote** - Angebotserstellung und -verwaltung
- 💰 **Rechnungen** - Rechnungsstellung
- 📋 **Leistungsnachweise** - Arbeitszeiterfassung
- 📦 **Pakete** - Paketangebote
- ⚙️ **Einstellungen** - Systemkonfiguration

#### Mode-spezifische Anpassungen

**Zen Mode:**
- Vollständige Navigation mit Icon + Label
- Button: "☰ Navigation" (200px Dropdown)
- Optimiert für produktive Arbeitssessions

**Mini Mode:**
- Kompakte Navigation nur mit Icon
- Button: "☰" (160px Dropdown, kleinere Schrift)
- Maximaler Platz für Content

**Free Mode:**
- Einzige verfügbare UI-Navigation
- Gleiche Funktionalität wie andere Modi
- Essential für Navigation im Vollbildmodus

#### UX Features
- **Current Page Indicator**: Aktuelle Seite im Dropdown-Header hervorgehoben
- **Auto-Close**: Automatisches Schließen bei Klick außerhalb oder Navigation
- **Slide-in Animation**: Sanfte 0.2s Übergangsanimation
- **Responsive Design**: Anpassung an verschiedene Bildschirmgrößen
- **Keyboard-Friendly**: ESC-Taste schließt das Menü

## CSS-Implementierung

### Grid Areas Definition

```css
/* Basis Grid für alle Modi */
.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto auto 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar focus-bar"
    "sidebar main";
}

/* Focus Mode Overrides */
body[data-focus-mode="zen"] .app {
  grid-template-columns: 0 1fr;
  grid-template-areas:
    "header header"
    "focus-bar focus-bar"
    "main main";
}
```

### Focus Bar Styling

```css
.focus-bar-area {
  grid-area: focus-bar;
  background: linear-gradient(135deg, 
    var(--accent, #1e3a2e) 0%, 
    var(--sidebar-green, #2d5a42) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Navigation links, Focus Buttons rechts */
  gap: 16px;
}
```

### Focus Navigation Styling

```css
.focus-navigation {
  position: relative;
  display: flex;
  align-items: center;
}

.focus-nav-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  font-size: 0.8em;
}

/* Mini Mode - kompakter Button */
.focus-nav-button.mini {
  padding: 4px 8px;
  font-size: 0.7em;
}

.focus-nav-button.mini .focus-nav-label {
  display: none; /* Nur Icon im Mini Mode */
}
```

### Mini Mode Spezialbehandlung

```css
body[data-focus-mode="mini"] .header {
  height: 32px !important;
  padding: 4px 12px !important;
  font-size: 0.85em !important;
}

body[data-focus-mode="mini"] .focus-bar-area {
  min-height: 32px !important;
  padding: 4px 16px !important;
}
```

## Komponenten-Struktur

### App.tsx Layout

```tsx
return (
  <div className="app">
    {renderSidebar()}
    
    {/* Header - erste Zeile */}
    <div className="header">
      {renderHeader()}
    </div>
    
    {/* Focus Bar - zweite Zeile */}
    <div className="focus-bar-area">
      <FocusNavigation />
      <FocusModeToggle />
    </div>
    
    <main className="main">
      <Outlet />
    </main>
  </div>
);
```

### FocusNavigation.tsx

```tsx
export const FocusNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { active, variant } = useFocusMode();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render if focus mode is not active
  if (!active) return null;

  return (
    <div className="focus-navigation">
      <button
        className={`focus-nav-button ${variant}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="focus-nav-icon">☰</span>
        <span className="focus-nav-label">Navigation</span>
      </button>

      {isOpen && (
        <div className={`focus-nav-dropdown ${variant}`}>
          {/* Navigation items mit Icons */}
        </div>
      )}
    </div>
  );
};
```

### FocusModeToggle.tsx

```tsx
export const FocusModeToggle = () => {
  const { active, variant, toggle, disable } = useFocusMode();

  const handleModeClick = (mode: 'zen' | 'mini' | 'free') => {
    toggle(mode); // Context übernimmt die Logik
  };

  return (
    <div className="focus-mode-buttons-vertical">
      <button onClick={() => handleModeClick('zen')}>
        <span>Zen</span>
        <span>{active && variant === 'zen' ? '[●]' : '[ ]'}</span>
      </button>
      {/* Mini, Free, Exit buttons... */}
    </div>
  );
};
```

## Navigation Mode Kompatibilität

Die neue Focus Mode funktioniert mit allen Navigation Modi:

### Header Mode (200px Sidebar)
```css
[data-navigation-mode="header"] .app {
  grid-template-columns: 200px 1fr;
}
```

### Sidebar Mode (240px Sidebar)
```css
[data-navigation-mode="sidebar"] .app {
  grid-template-columns: 240px 1fr;
}
```

### Full Sidebar Mode (240px Sidebar)
```css
[data-navigation-mode="full-sidebar"] .app {
  grid-template-columns: 240px 1fr;
}
```

## Vorteile der neuen Implementation

### 1. Stabilität
- ✅ Keine Positionierungssprünge mehr
- ✅ Konsistente Grid-Struktur in allen Modi
- ✅ Vorhersagbare Layout-Übergänge

### 2. Benutzerfreundlichkeit
- ✅ Intuitives Multi-Button Interface
- ✅ Direkter Moduswechsel ohne Umwege
- ✅ Klarer visueller Status-Feedback
- ✅ **Kompakte Navigation** in allen Focus Modi verfügbar

### 3. Wartbarkeit
- ✅ Saubere Trennung von Header und Focus Controls
- ✅ Einheitliche CSS Grid-Logik
- ✅ Reduziertere CSS-Komplexität
- ✅ **Modulare Navigation-Komponente** für einfache Erweiterungen

### 4. Responsive Design
- ✅ Funktioniert auf allen Bildschirmgrößen
- ✅ Kompakte Modi für kleine Screens
- ✅ Skalierbare Button-Layouts

## Migration von v1.x

### Breaking Changes
- `header-container` Grid-Area entfernt
- Focus Mode Toggle nicht mehr im Header integriert
- CSS-Klassen für `focus-mode-toggle-area` entfernt

### Kompatibilität
- ✅ Alle Navigation Modi funktionieren weiter
- ✅ Focus Mode Shortcuts (ESC, Ctrl+Shift+F) unverändert
- ✅ LocalStorage-Persistierung unverändert
- ✅ Bestehende Themes kompatibel

## Performance

### CSS-Optimierungen
- Weniger DOM-Manipulationen durch stabile Grid-Struktur
- Effizientere CSS-Selektoren
- Reduzierte Reflow/Repaint-Operationen

### JavaScript-Optimierungen
- Intelligentere Toggle-Logik verhindert unnötige State-Changes
- Weniger Event-Handler durch konsolidierte Button-Logik

## Zukünftige Erweiterungen

### Geplante Features
- **Custom Focus Bars**: Unterschiedliche Inhalte je nach Modus
- **Focus Mode Presets**: Benutzerdefinierte Konfigurationen
- **Advanced Mini Mode**: Weitere Kompaktierungsoptionen
- **Focus Mode Analytics**: Nutzungsstatistiken

### API-Erweiterungen
```typescript
// Geplante Context-Erweiterungen
interface FocusModeState {
  // Bestehend...
  active: boolean;
  variant: FocusVariant;
  
  // Geplant...
  customConfigs?: FocusConfig[];
  analytics?: FocusAnalytics;
  presets?: FocusPreset[];
}
```

## Fazit

Die Focus Mode v2.0 stellt eine fundamentale Verbesserung der Benutzerinteraktion dar. Die grid-basierte Architektur löst alle Positionierungsprobleme und bietet eine solide Basis für zukünftige UI-Erweiterungen.

**Kernverbesserungen:**
- 🎯 Stabile, sprungfreie Layouts
- 🎨 Intuitive Multi-Button-Bedienung
- ⚡ Direkte Moduswechsel
- 🏗️ Saubere Grid-Architektur
- 📱 Responsive Design ready
- 🧭 **Hamburger Navigation** für vollständige Anwendungsnavigation in Focus Modi

Die Implementation ist rückwärtskompatibel und bietet eine deutlich verbesserte User Experience für alle Focus Mode-Szenarien. Mit der integrierten Navigation können Benutzer auch im Fokus-Modus effizient zwischen allen Anwendungsbereichen wechseln.