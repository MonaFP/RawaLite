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
    name: 'Grün (Standard)',
    primary: '#1e3a2e',
    secondary: '#0f2419',
    accent: '#10b981',
    gradient: 'linear-gradient(160deg, #1e3a2e 0%, #0f2419 40%, #0a1b0f 100%)',
    description: 'Das klassische RawaLite-Design mit grünen Akzenten'
  },
  {
    id: 'blue',
    name: 'Blau (Business)',
    primary: '#1e3a8a',
    secondary: '#1e40af',
    accent: '#3b82f6',
    gradient: 'linear-gradient(160deg, #1e3a8a 0%, #1e40af 40%, #1d4ed8 100%)',
    description: 'Professionelles Business-Design in klassischem Blau'
  },
  {
    id: 'purple',
    name: 'Lila (Modern)',
    primary: '#581c87',
    secondary: '#6b21a8',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(160deg, #581c87 0%, #6b21a8 40%, #7c3aed 100%)',
    description: 'Modernes Design mit lila Farbakzenten'
  },
  {
    id: 'orange',
    name: 'Orange (Kreativ)',
    primary: '#9a3412',
    secondary: '#c2410c',
    accent: '#f97316',
    gradient: 'linear-gradient(160deg, #9a3412 0%, #c2410c 40%, #ea580c 100%)',
    description: 'Warmes, kreatives Design in Orange-Tönen'
  },
  {
    id: 'red',
    name: 'Rot (Dynamisch)',
    primary: '#991b1b',
    secondary: '#b91c1c',
    accent: '#ef4444',
    gradient: 'linear-gradient(160deg, #991b1b 0%, #b91c1c 40%, #dc2626 100%)',
    description: 'Dynamisches Design mit kraftvollen Rot-Tönen'
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
