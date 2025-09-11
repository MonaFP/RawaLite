# 🎨 **RaWaLite - Theme & Navigation Features**

## ✨ **Neue Features**

### 🎨 **Klickbare Farbthemen**
- **5 vordefinierte Themes:** Grün (Standard), Blau (Business), Lila (Modern), Orange (Kreativ), Rot (Dynamisch)
- **Sofortige Anwendung:** Themes werden live beim Klick angewendet
- **Persistierung:** Theme-Auswahl wird automatisch in SQLite gespeichert
- **Vollständige Integration:** Alle UI-Elemente (Sidebar, Buttons, Akzente) werden angepasst

### 🧭 **Navigation-Switch (Sidebar ↔ Header)**
- **Sidebar-Modus:** Klassische Ansicht mit fixierter Navigation links + Mini-Dashboard
- **Header-Modus:** Moderne Ansicht mit horizontaler Navigation im oberen Bereich
- **Live-Umschaltung:** Wechsel erfolgt sofort ohne Page-Reload
- **Layout-Optimierung:** CSS Grid passt sich automatisch an den gewählten Modus an

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

### **CSS-Theme-System**
```css
:root[data-theme="blue"] {
  --theme-primary: #1e3a8a;
  --theme-secondary: #1e40af;
  --theme-accent: #3b82f6;
  --theme-gradient: linear-gradient(160deg, #1e3a8a 0%, #1e40af 40%, #1d4ed8 100%);
}
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
