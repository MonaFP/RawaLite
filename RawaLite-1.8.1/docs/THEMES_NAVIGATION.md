# 🎨 **RaWaLite - Theme & Navigation Features**

> **Design System & Navigation Modi** - Version 1.5.5+ (Integriert seit v1.5.2)

## ✨ **Aktuelle Features**

### 🎨 **Pastel Color Themes**
- **5 Pastel Themes:** Salbeigrün (Standard), Himmelblau (Business), Lavendel (Modern), Pfirsich (Kreativ), Rosé (Elegant)
- **Sofortige Anwendung:** Themes werden live beim Klick angewendet
- **SQLite Persistierung:** Theme-Auswahl wird dauerhaft in `settings.designSettings` gespeichert
- **Vollständige Integration:** Alle UI-Elemente (Sidebar, Buttons, Header, Akzente) werden angepasst
- **Reload-Sicherheit:** Theme bleibt nach App-Neustart erhalten

### 🧭 **Navigation Switching (Header ↔ Sidebar)**
- **Header-Modus:** Navigation im Header + Dashboard-Widgets in der Sidebar (240px fix)
- **Sidebar-Modus:** Navigation in der Sidebar + Dashboard-Widgets im Header (240px fix)
- **Live-Umschaltung:** Wechsel erfolgt sofort ohne Page-Reload
- **Stabile Layoutbreite:** Sidebar behält IMMER 240px Breite in beiden Modi
- **Smart Widget Distribution:** Widgets ergänzen Navigation komplementär
- **Persistente Einstellungen:** Navigation-Modus wird dauerhaft gespeichert

## 🛠️ **Technische Implementierung**

### **Dateien-Übersicht**
```
src/
├── lib/themes.ts                  # Theme-Definitionen + Utility-Funktionen
├── hooks/useDesignSettings.ts     # Design-Settings Management Hook
├── index.css                      # Erweiterte CSS-Variablen + Theme-Klassen
├── App.tsx                        # Layout-Switch-Logic
├── components/Header.tsx          # Header-Navigation für Header-Modus
└── pages/EinstellungenPage.tsx    # UI für Theme- und Navigation-Auswahl
```

### **Settings-Erweiterung**
```typescript
interface DesignSettings {
  theme: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  navigationMode: 'sidebar' | 'header';
}

interface Settings {
  companyData: CompanyData;
  numberingCircles: NumberingCircle[];
  designSettings: DesignSettings;  // ← NEU
}
```

### **CSS-Theme-System (Final Pastel Colors)**
```css
/* KRITISCH: Diese Farbwerte dürfen NIE geändert werden! */
:root[data-theme="salbeigrün"] {
  --theme-primary: #4a5d5a;
  --theme-secondary: #3a4d4a;
  --theme-accent: #7dd3a0;
  --theme-gradient: linear-gradient(160deg, #4a5d5a 0%, #3a4d4a 40%, #2f403d 100%);
}

:root[data-theme="himmelblau"] {
  --theme-primary: #4a5b6b;
  --theme-secondary: #3d4e5e;
  --theme-accent: #87ceeb;
  --theme-gradient: linear-gradient(160deg, #4a5b6b 0%, #3d4e5e 40%, #324151 100%);
}

:root[data-theme="lavendel"] {
  --theme-primary: #5a4d6b;
  --theme-secondary: #4d405e;
  --theme-accent: #b19cd9;
  --theme-gradient: linear-gradient(160deg, #5a4d6b 0%, #4d405e 40%, #403351 100%);
}

/* Weitere Themes... */
```
```

### **SQLite-Schema-Erweiterung**
```sql
ALTER TABLE settings ADD COLUMN designSettings TEXT;
```

## 📱 **Benutzerhandbuch**

### **Farbtheme ändern**
1. Gehe zu **Einstellungen** > **🎨 Farbthemen**
2. Klicke auf ein gewünschtes Theme-Panel
3. Das Theme wird sofort angewendet und gespeichert
4. Die Änderung ist in der gesamten App sichtbar

### **Navigation umschalten**
1. Gehe zu **Einstellungen** > **🧭 Navigation**
2. Wähle zwischen **Sidebar-Navigation** oder **Header-Navigation**
3. Das Layout wechselt sofort ohne Neustart
4. Die Einstellung bleibt dauerhaft gespeichert

## ⚡ **Performance & Kompatibilität**

- **Instant Apply:** Theme-Wechsel über CSS Custom Properties (keine DOM-Manipulation)
- **Fallback-Sicher:** Default-Settings bei Fehlern oder fehlenden Daten
- **Rückwärtskompatibel:** Bestehende Instanzen erhalten automatisch Standard-Theme
- **Speicher-Effizient:** Themes als CSS-Variablen, keine zusätzlichen Stylesheets

## 🔧 **Entwickler-Hinweise**

### **Neues Theme hinzufügen**
```typescript
// In src/lib/themes.ts
export const availableThemes: ThemeDefinition[] = [
  // ... bestehende themes
  {
    id: 'new-theme',
    name: 'Neues Theme',
    primary: '#hexcolor',
    secondary: '#hexcolor',
    accent: '#hexcolor',
    gradient: 'linear-gradient(...)',
    description: 'Beschreibung'
  }
];
```

### **CSS-Variablen erweitern**
```css
/* In src/index.css */
:root[data-theme="new-theme"] {
  --theme-primary: #hexcolor;
  --theme-secondary: #hexcolor;
  --theme-accent: #hexcolor;
  --theme-gradient: linear-gradient(...);
}
```

## 🎯 **Zukunftserweiterungen**

- **Custom Themes:** Benutzer-definierte Farbpaletten
- **Dark/Light Mode:** Zusätzlicher Umschalter für Helligkeit
- **Theme Import/Export:** Themes als JSON exportieren/importieren
- **Advanced Layout Options:** Weitere Layout-Varianten (Compact, Wide, etc.)

---

**Version:** v1.3.1+  
**Status:** ✅ Produktionsbereit  
**Getestet:** ✅ Windows, TypeScript-Clean, No Breaking Changes
