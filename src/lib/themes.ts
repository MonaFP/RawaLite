export type ThemeColor = 'green' | 'blue' | 'purple' | 'orange' | 'red';
export type NavigationMode = 'sidebar' | 'header';

export interface DesignSettings {
  theme: ThemeColor;
  navigationMode: NavigationMode;
}

export interface ThemeDefinition {
  id: ThemeColor;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  description: string;
}

export const availableThemes: ThemeDefinition[] = [
  {
    id: 'green',
    name: 'Salbeigrün (Standard)',
    primary: '#4a5d5a',
    secondary: '#3a4d4a',
    accent: '#7dd3a0',
    gradient: 'linear-gradient(160deg, #4a5d5a 0%, #3a4d4a 40%, #2f403d 100%)',
    description: 'Beruhigendes Salbeigrün mit sanften Pastellakzenten'
  },
  {
    id: 'blue',
    name: 'Himmelblau (Business)',
    primary: '#4a5b6b',
    secondary: '#3d4e5e',
    accent: '#87ceeb',
    gradient: 'linear-gradient(160deg, #4a5b6b 0%, #3d4e5e 40%, #324151 100%)',
    description: 'Sanftes Himmelblau für professionelle Eleganz'
  },
  {
    id: 'purple',
    name: 'Lavendel (Elegant)',
    primary: '#5a4d6b',
    secondary: '#4d405e',
    accent: '#b19cd9',
    gradient: 'linear-gradient(160deg, #5a4d6b 0%, #4d405e 40%, #403351 100%)',
    description: 'Elegantes Lavendel mit warmen Untertönen'
  },
  {
    id: 'orange',
    name: 'Pfirsich (Warm)',
    primary: '#6b5a4d',
    secondary: '#5e4d40',
    accent: '#f4a28c',
    gradient: 'linear-gradient(160deg, #6b5a4d 0%, #5e4d40 40%, #514033 100%)',
    description: 'Warme Pfirsichtöne für gemütliche Atmosphäre'
  },
  {
    id: 'red',
    name: 'Rosé (Soft)',
    primary: '#6b4d5a',
    secondary: '#5e4050',
    accent: '#e6a8b8',
    gradient: 'linear-gradient(160deg, #6b4d5a 0%, #5e4050 40%, #513343 100%)',
    description: 'Sanfte Rosétöne für dezente Eleganz'
  }
];

export const defaultDesignSettings: DesignSettings = {
  theme: 'green',
  navigationMode: 'sidebar'
};

export function getTheme(themeId: ThemeColor): ThemeDefinition {
  return availableThemes.find(theme => theme.id === themeId) || availableThemes[0];
}

export function applyThemeToDocument(themeId: ThemeColor): void {
  const theme = getTheme(themeId);
  const root = document.documentElement;
  
  // Set theme-specific CSS custom properties
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-gradient', theme.gradient);
  
  // Update data attribute for CSS selector specificity
  root.setAttribute('data-theme', themeId);
}

export function applyNavigationMode(mode: NavigationMode): void {
  const root = document.documentElement;
  root.setAttribute('data-nav-mode', mode);
}
