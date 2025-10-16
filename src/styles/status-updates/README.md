# Status Updates CSS Refactoring - README

## 📁 Dateien

```
src/styles/status-updates/
├── status-core.css          # Basis-Variablen und State-Klassen
├── status-dropdowns.css     # Isolierte Dropdown-Styles 
├── status-badges.css        # Badge-Styles für Status-Anzeige
└── status-themes.css        # Theme-Integration (5 Themes)
```

## 🎯 Zweck

Modulare, isolierte CSS-Struktur für alle Status-bezogenen UI-Elemente in RawaLite.

### Problem gelöst:
- CSS-Spezifitätskonflikte mit globalen `.card select` Regeln
- Monolithische CSS-Struktur in `index.css`
- Fehlende Namensräume für Status-Elemente

### Lösung implementiert:
- ✅ Komplette CSS-Isolation mit `status-*` Namespace
- ✅ Modulare Datei-Struktur
- ✅ @import-basierte Integration
- ✅ Theme-System Kompatibilität

## 🔧 Verwendung

### CSS-Klassen

#### Dropdowns:
```html
<select className="status-dropdown-base status-dropdown-offer">
<select className="status-dropdown-base status-dropdown-invoice">
<select className="status-dropdown-base status-dropdown-timesheet">
```

#### Badges:
```html
<span className="status-badge-base status-badge-offer status-state-draft">
<span className="status-badge-base status-badge-invoice status-state-paid">
```

#### State-Klassen:
- `status-state-draft`
- `status-state-sent` 
- `status-state-accepted`
- `status-state-rejected`
- `status-state-paid`
- `status-state-overdue`

### Integration

CSS wird automatisch über `index.css` geladen:

```css
/* In index.css */
@import url('./styles/status-updates/status-core.css');
@import url('./styles/status-updates/status-dropdowns.css');
@import url('./styles/status-updates/status-badges.css');
@import url('./styles/status-updates/status-themes.css');
```

## 📋 CSS-Variablen

### Status-Farben:
```css
--status-draft-color: #6b7280
--status-sent-color: #3b82f6
--status-accepted-color: #10b981
--status-rejected-color: #ef4444
--status-paid-color: #059669
--status-overdue-color: #dc2626
```

### Element-Basis:
```css
--status-font-size: 14px
--status-border-radius: 6px
--status-transition: all 0.2s ease
--status-font-weight: 500
```

## 🎨 Theme-Integration

Automatische Integration mit allen 5 RawaLite-Themes:
- Sage (Grün)
- Sky (Blau) 
- Lavender (Lila)
- Peach (Orange)
- Rose (Rosa)

Theme-spezifische Focus-Farben werden automatisch angewendet.

## 🔧 Erweiterung

### Neue Status hinzufügen:

1. **status-core.css:** Neue CSS-Variablen und State-Klasse
2. **status-dropdowns.css:** State-spezifische Border-Farbe
3. **status-badges.css:** State-spezifische Badge-Farben

### Neuen Element-Typ hinzufügen:

1. **status-dropdowns.css:** `.status-dropdown-newtype`
2. **status-badges.css:** `.status-badge-newtype`
3. **Komponente:** `status-dropdown-base status-dropdown-newtype`

## ⚠️ Wichtige Hinweise

- **Namespace beachten:** Alle Klassen müssen mit `status-` beginnen
- **!important Regeln:** Nur für kritische Override-Fälle verwenden
- **Theme-Kompatibilität:** Neue CSS-Variablen in status-themes.css ergänzen
- **Global Override:** `.card select:not([class*="status-"])` schließt Status-Elemente aus

## 📖 Dokumentation

Vollständige Dokumentation: [PATHS.md](../../../docs/PATHS.md#STATUS_DROPDOWN_COMPLETE_FIX)