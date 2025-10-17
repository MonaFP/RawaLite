# CSS/THEME/NAVIGATION ARCHITEKTUR-ÜBERSICHT

> **Erstellt:** 17.10.2025 | **Letzte Aktualisierung:** 17.10.2025 (Initiale Dokumentation nach Status-Color Korrekturen)  
> **Status:** Production Ready | **Typ:** Architecture Registry  
> **Schema:** `ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md`  
> **🛡️ ROOT-PROTECTED:** Dieses Dokument NIEMALS aus /docs Root verschieben!

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_YYYY-MM-DD.md

Diese Datei: ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md
```

### **STATUS-PRÄFIXE:**
- `ROOT_` - **KI-kritische Dokumente die IMMER im /docs Root bleiben (NIEMALS verschieben!)**
- `VALIDATED_` - Validierte, stabile Dokumentation (verlässliche Quelle)
- `SOLVED_` - Gelöste Probleme und Fixes (fertige Lösung)
- `LESSON_` - Lessons Learned und Debugging (vergleichende Analyse)
- `WIP_` - Work in Progress (nur Orientierung)
- `COMPLETED_` - Abgeschlossene Implementierungen (fertige Reports)
- `PLAN_` - Planungsdokumente und Roadmaps (Entwurfsstatus)
- `DEPRECATED_` - Veraltete, ersetzte Dokumentation (ignorieren)

---

## 🏗️ **ZENTRALE CSS/THEME/NAVIGATION ARCHITEKTUR**

Diese Dokumentation definiert die komplette Frontend-Architektur von RawaLite mit besonderem Fokus auf das Status-Color-System und die modulare CSS-Struktur.

---

## 🎨 **1. STATUS-COLOR SYSTEM (MASTER)**

### **CSS Variables (MASTER SOURCE)**

| **Status** | **CSS Variable** | **Aktuelle Farbe** | **Typ** | **Quelle** |
|------------|------------------|-------------------|---------|------------|
| **draft** | `--status-draft-color` | `#6b7280` (Harmonisches Grau) | Neutral | status-core.css |
| **sent** | `--status-sent-color` | `#f5d4a9` (Dezentes Pastel Orange) | **PASTEL** | status-core.css |
| **accepted** | `--status-accepted-color` | `#9be69f` (Dezentes Pastel Grün) | **PASTEL** | status-core.css |
| **rejected** | `--status-rejected-color` | `#cf9ad6` (Dezentes Pastel Lila) | **PASTEL** | status-core.css |
| **paid** | `--status-paid-color` | `#9be69f` (Konsistent mit accepted) | **PASTEL** | status-core.css |
| **overdue** | `--status-overdue-color` | `#cf9ad6` (Konsistent mit rejected) | **PASTEL** | status-core.css |
| **cancelled** | `--status-cancelled-color` | `#8abbd1` (Dezentes Pastel Blau) | **PASTEL** | status-core.css |

### **CSS Variable Usage Pattern**
```css
/* KORREKT: CSS Variables verwenden */
color: var(--status-sent-color, #f5d4a9);

/* FALSCH: Hardcoded Farben */
color: #f59e0b;
```

### **Status-Color Hierarchie**
1. **CSS Variables** (MASTER) - `src/styles/status-updates/status-core.css`
2. **CSS Classes** - `.status-state-{status}` verwenden CSS Variables
3. **React Components** - Nutzen CSS Variables über `var()` oder CSS Classes
4. **Inline Styles** - Werden von CSS Variables überschrieben

---

## 📂 **2. CSS-DATEI ARCHITEKTUR**

### **Modulare CSS-Struktur**

```
src/
├── index.css                                    # MASTER CSS FILE
└── styles/
    ├── status-updates/                          # STATUS-SPECIFIC MODULE
    │   ├── status-core.css                      # ✅ CSS Variables (PASTEL!)
    │   ├── status-badges.css                    # Badge components
    │   ├── status-dropdowns.css                 # Dropdown styling
    │   ├── status-themes.css                    # Theme integration
    │   ├── status-layout-minimal.css            # Layout containers
    │   └── README.md                            # Module documentation
    └── focus-mode.css                           # Focus mode styling
```

### **CSS Import Chain (Master)**
```css
/* src/index.css - MASTER IMPORT */
@import url('./styles/status-updates/status-core.css');           /* CSS Variables */
@import url('./styles/status-updates/status-layout-minimal.css'); /* Layouts */
@import url('./styles/status-updates/status-dropdowns.css');      /* Dropdowns */
@import url('./styles/status-updates/status-badges.css');         /* Badges */
@import url('./styles/status-updates/status-themes.css');         /* Themes */
@import url('./styles/focus-mode.css');                          /* Focus modes */
```

### **CSS Datei Details**

| **CSS Datei** | **Zweck** | **Größe** | **Dependencies** | **Critical** |
|---------------|-----------|-----------|------------------|--------------|
| **`index.css`** | Master CSS + Global styles | ~1701 Zeilen | Importiert alle Module | ✅ |
| **`status-core.css`** | **CSS Variables (PASTEL)** | ~108 Zeilen | **KEINE** | ✅ **MASTER** |
| **`status-badges.css`** | Badge components | ~95 Zeilen | status-core.css | ✅ |
| **`status-dropdowns.css`** | Dropdown isolation | ~120 Zeilen | status-core.css | ✅ |
| **`status-themes.css`** | Theme integration | ~80 Zeilen | status-core.css | ✅ |
| **`status-layout-minimal.css`** | Layout containers | ~75 Zeilen | status-core.css | ✅ |
| **`focus-mode.css`** | Focus mode layouts | ~350 Zeilen | **KEINE** | ✅ |

---

## 🎨 **3. THEME SYSTEM ARCHITEKTUR**

### **6-Theme System Overview**

| **Theme** | **CSS Attribute** | **Primary Color** | **Accent Color** | **Status Integration** |
|-----------|-------------------|-------------------|------------------|----------------------|
| **sage** | `[data-theme="sage"]` | Salbeigrün | `--sage-accent` | ✅ Theme-agnostic |
| **sky** | `[data-theme="sky"]` | Himmelblau | `--sky-accent` | ✅ Theme-agnostic |
| **lavender** | `[data-theme="lavender"]` | Lavendel | `--lavender-accent` | ✅ Theme-agnostic |
| **peach** | `[data-theme="peach"]` | Pfirsich | `--peach-accent` | ✅ Theme-agnostic |
| **rose** | `[data-theme="rose"]` | Rosé | `--rose-accent` | ✅ Theme-agnostic |
| **default** | `[data-theme="default"]` | Blau | `--default-accent` | ✅ Theme-agnostic |

### **Theme Context System**
```typescript
// ThemeContext.tsx - Master theme management
export type Theme = 'sage' | 'sky' | 'lavender' | 'peach' | 'rose' | 'default';

// Theme persistence
localStorage.setItem('rawalite-theme', theme);
document.body.setAttribute('data-theme', theme);
```

### **Theme-Status Integration**
- **Status Colors:** Theme-agnostic (gleiche Pastel-Farben in allen Themes)
- **Accent Colors:** Theme-spezifisch (Button hovers, Focus states)
- **Background:** Theme-spezifisch (Sidebar, Cards)
- **Typography:** Theme-agnostic (konsistente Lesbarkeit)

---

## 🧭 **4. NAVIGATION SYSTEM ARCHITEKTUR**

### **3-Navigation-Modi System**

| **Navigation Mode** | **Header Component** | **Header Height** | **Sidebar Component** | **Sidebar Width** | **Grid Template** |
|--------------------|---------------------|-------------------|----------------------|-------------------|-------------------|
| **header** | HeaderStatistics | 80px | NavigationOnlySidebar | 200px | `200px 1fr` |
| **sidebar** | HeaderNavigation | 60px | CompactSidebar | 240px | `240px 1fr` |
| **full-sidebar** | Header (minimal) | 60px | Sidebar (full) | 240px | `240px 1fr` |

### **Navigation Context System**
```typescript
// NavigationContext.tsx - Master navigation management
export type NavigationMode = 'header' | 'sidebar' | 'full-sidebar';

// Mode persistence
localStorage.setItem('rawalite-navigation-mode', mode);
document.documentElement.setAttribute('data-navigation-mode', mode);
```

### **CSS Grid Integration**
```css
/* Navigation Mode Grid Layouts */
[data-navigation-mode="header"] .app {
  grid-template-columns: 200px 1fr;
  grid-template-areas: "sidebar header" "sidebar focus-bar" "sidebar main";
}

[data-navigation-mode="sidebar"] .app {
  grid-template-columns: 240px 1fr;
  grid-template-areas: "sidebar header" "sidebar focus-bar" "sidebar main";
}

[data-navigation-mode="full-sidebar"] .app {
  grid-template-columns: 240px 1fr;
  grid-template-areas: "sidebar header" "sidebar focus-bar" "sidebar main";
}
```

---

## 🎯 **5. COMPONENT-CSS ZUORDNUNG**

### **React Component Integration**

| **Component** | **CSS Classes** | **CSS Variables** | **Inline Styles** | **Status** |
|---------------|-----------------|-------------------|-------------------|------------|
| **StatusControl.tsx** | `.status-control-button` | ✅ `var(--status-{status}-color)` | ❌ **ENTFERNT** | ✅ **FIXED** |
| **Sidebar.tsx** | Native | ✅ `var(--status-paid-color)` | ✅ **MIT CSS VARS** | ✅ **FIXED** |
| **DashboardPage.tsx** | Native | ✅ `getStatusColor()` function | ✅ **PASTEL** | ✅ **WORKING** |
| **AngebotePage.tsx** | Table styling | ❌ Überschrieben | ✅ statusColors object | ⚠️ **REDUNDANT** |
| **RechnungenPage.tsx** | Table styling | ❌ Überschrieben | ✅ statusColors object | ⚠️ **REDUNDANT** |
| **TimesheetsPage.tsx** | Table styling | ❌ Überschrieben | ✅ statusColors object | ⚠️ **REDUNDANT** |

### **CSS Classes System**

| **Class Type** | **Pattern** | **Beispiel** | **Zweck** |
|----------------|-------------|--------------|-----------|
| **Base Classes** | `.status-{type}-base` | `.status-dropdown-base` | Grundlayout |
| **Entity Classes** | `.status-{type}-{entity}` | `.status-dropdown-invoice` | Entity-spezifisch |
| **State Classes** | `.status-state-{status}` | `.status-state-sent` | Status-spezifische Farben |
| **Size Classes** | `.status-{type}-{size}` | `.status-badge-small` | Größenvarianten |
| **Interactive Classes** | `.status-{type}-interactive` | `.status-badge-interactive` | Hover effects |

---

## 🔗 **6. CSS SPEZIFITÄTS-HIERARCHIE**

### **Prioritäts-Ordnung (Höchste zu Niedrigste)**

| **Priorität** | **CSS Quelle** | **Spezifität** | **Überschreibt** | **Beispiel** |
|---------------|----------------|----------------|------------------|--------------|
| **1. MASTER** | CSS Variables in `:root` | Höchste | **ALLES** | `--status-sent-color: #f5d4a9` |
| **2. HIGH** | CSS Classes + `!important` | Sehr hoch | Globale Regeln | `.status-dropdown-base !important` |
| **3. MEDIUM** | CSS Classes standard | Mittel | Inline styles | `.status-state-sent` |
| **4. LOW** | Inline styles | Niedrig | Browser defaults | `style={{ color: '#f5d4a9' }}` |
| **5. LOWEST** | Browser defaults | Niedrigste | Nichts | User agent stylesheet |

### **CSS Variable Override Pattern**
```css
/* MASTER (Höchste Priorität) */
:root {
  --status-sent-color: #f5d4a9;  /* Pastel Orange */
}

/* VERWENDUNG (Respektiert Master) */
.status-state-sent {
  color: var(--status-sent-color);  /* Verwendet #f5d4a9 */
}

/* INLINE (Wird überschrieben) */
style={{ color: '#f59e0b' }}  /* Ignoriert, CSS Variable gewinnt */
```

---

## 🏷️ **7. THEME-NAVIGATION INTEGRATION MATRIX**

### **Theme × Navigation Kompatibilität**

| **Theme** | **header Mode** | **sidebar Mode** | **full-sidebar Mode** | **Status Colors** |
|-----------|-----------------|------------------|----------------------|-------------------|
| **sage** | ✅ 200px sidebar | ✅ 240px sidebar | ✅ 240px sidebar | ✅ Pastel consistent |
| **sky** | ✅ 200px sidebar | ✅ 240px sidebar | ✅ 240px sidebar | ✅ Pastel consistent |
| **lavender** | ✅ 200px sidebar | ✅ 240px sidebar | ✅ 240px sidebar | ✅ Pastel consistent |
| **peach** | ✅ 200px sidebar | ✅ 240px sidebar | ✅ 240px sidebar | ✅ Pastel consistent |
| **rose** | ✅ 200px sidebar | ✅ 240px sidebar | ✅ 240px sidebar | ✅ Pastel consistent |
| **default** | ✅ 200px sidebar | ✅ 240px sidebar | ✅ 240px sidebar | ✅ Pastel consistent |

### **CSS Data Attributes Integration**
```css
/* Theme + Navigation Kombination */
[data-theme="sage"][data-navigation-mode="header"] .app {
  /* Sage theme + Header navigation layout */
}

[data-theme="sky"][data-navigation-mode="full-sidebar"] .sidebar {
  /* Sky theme + Full sidebar layout */
}
```

---

## 🔧 **8. ENTWICKLER-GUIDELINES**

### **Status-Color Implementierung**

#### ✅ **KORREKT: CSS Variables verwenden**
```typescript
// StatusControl.tsx
const getStatusCSSVariable = (status: string) => {
  return `var(--status-${status}-color, #6b7280)`;
};
```

#### ✅ **KORREKT: CSS Variables in Inline Styles**
```typescript
// Sidebar.tsx
<span style={{ color: "var(--status-paid-color, #9be69f)" }}>
  {stats.paidInvoices} Bezahlt
</span>
```

#### ❌ **FALSCH: Hardcoded Farben**
```typescript
// NIEMALS SO:
const statusColorMap = {
  'sent': '#0d6efd',  // Knallige Farben
  'accepted': '#198754'
};
```

### **CSS Class Verwendung**

#### ✅ **KORREKT: Modulare CSS Classes**
```html
<select className="status-dropdown-base status-dropdown-invoice">
<span className="status-badge-base status-badge-offer status-state-draft">
```

#### ❌ **FALSCH: Globale CSS Classes**
```html
<select className="dropdown">  <!-- Zu generisch -->
<span className="badge">       <!-- Konflikt möglich -->
```

### **Theme/Navigation Integration**

#### ✅ **KORREKT: Context-basiert**
```typescript
const { theme } = useTheme();
const { navigationMode } = useNavigation();
// CSS automatisch über data-attributes
```

#### ❌ **FALSCH: Manuelle CSS-Manipulation**
```typescript
// NIEMALS direkte Style-Manipulation
document.body.style.background = themeColors[theme];
```

---

## 📊 **9. VALIDIERUNG & TESTS**

### **Critical Fix Validation**
```bash
# ZWINGEND vor jeder Änderung
pnpm validate:critical-fixes

# TypeScript Validation
pnpm typecheck

# Theme/Navigation Tests
pnpm test:themes
pnpm test:navigation
```

### **Status-Color Testing Checklist**
- [ ] ✅ Alle Status verwenden Pastel-Farben
- [ ] ✅ CSS Variables sind MASTER
- [ ] ✅ Keine hardcoded knalligen Farben
- [ ] ✅ Theme-Wechsel funktioniert
- [ ] ✅ Navigation-Modi funktionieren
- [ ] ✅ StatusControl nutzt CSS Variables
- [ ] ✅ Sidebar nutzt CSS Variables

---

## 🔄 **10. MIGRATION & WARTUNG**

### **Neue Status hinzufügen**
1. **CSS Variable definieren** in `status-core.css`
2. **CSS Class hinzufügen** `.status-state-{newstatus}`
3. **TypeScript Types erweitern** in StatusControl.tsx
4. **Validation erweitern** in Tests

### **Neue Themes hinzufügen**
1. **Theme Type erweitern** in ThemeContext.tsx
2. **CSS Variables definieren** für neues Theme
3. **Theme Selector erweitern** in UI
4. **Theme-Navigation Tests erweitern**

### **CSS Refactoring Guidelines**
1. **Immer CSS Variables** für Status-Farben
2. **Modulare Struktur** beibehalten
3. **@import Reihenfolge** beachten
4. **Namespace-Prefix** verwenden (`status-*`)
5. **Critical Fixes** vor Änderungen prüfen

---

## 🚨 **11. CRITICAL PATTERNS (NIEMALS ÄNDERN)**

### **CSS Variable Definitionen (GESCHÜTZT)**
```css
/* NIEMALS diese Definitionen entfernen oder hardcoded ersetzen */
:root {
  --status-sent-color: #f5d4a9;     /* Pastel Orange */
  --status-accepted-color: #9be69f; /* Pastel Grün */
  --status-rejected-color: #cf9ad6; /* Pastel Lila */
  --status-paid-color: #9be69f;     /* Konsistent mit accepted */
  --status-overdue-color: #cf9ad6;  /* Konsistent mit rejected */
  --status-cancelled-color: #8abbd1; /* Pastel Blau */
}
```

### **Import-Reihenfolge (GESCHÜTZT)**
```css
/* NIEMALS Reihenfolge ändern - Dependencies beachten */
@import url('./styles/status-updates/status-core.css');           /* ERSTE */
@import url('./styles/status-updates/status-layout-minimal.css');
@import url('./styles/status-updates/status-dropdowns.css');
@import url('./styles/status-updates/status-badges.css');
@import url('./styles/status-updates/status-themes.css');         /* LETZTE */
```

---

## 📍 **ZUSAMMENFASSUNG**

**Diese Architektur-Dokumentation definiert:**

✅ **Pastel Status-Color System** - Dezente Farben statt knalligen  
✅ **Modulare CSS-Struktur** - Separation of Concerns  
✅ **6-Theme Integration** - Alle Themes kompatibel  
✅ **3-Navigation-Modi** - Flexible Layout-Optionen  
✅ **CSS Variable MASTER** - Zentrale Farbdefinition  
✅ **Component Integration** - React + CSS harmony  
✅ **Critical Fix Preservation** - Geschützte Patterns  

**Alle Status-Updates in RawaLite nutzen jetzt konsistent die dezenten Pastel-Farben aus dem zentralen CSS Variable System.**

---

**📍 Location:** `/docs/ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md`  
**Purpose:** Zentrale Architektur-Dokumentation für CSS/Theme/Navigation Systems  
**Access:** Direct from /docs root für maximum KI accessibility  
**Protection:** ROOT_ prefix prevents accidental reorganization

*Letzte Aktualisierung: 2025-10-17 - Vollständige Architektur nach Status-Color Pastel-Konvertierung*