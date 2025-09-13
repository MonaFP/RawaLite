/**
 * 🎨 PDF Theme Integration System
 * 
 * Generates theme-specific CSS for PDF templates based on current app theme.
 * Maintains DIN 5008 compliance while applying dynamic colors.
 */

import type { ThemeColor, CustomColorSettings, ThemeDefinition } from './themes';
import { getTheme } from './themes';

export interface PDFThemeData {
  /** Current theme ID */
  themeId: ThemeColor;
  /** Theme definition with colors */
  theme: ThemeDefinition;
  /** Generated CSS variables for PDF template injection */
  cssVariables: string;
  /** Theme-specific CSS classes for PDF elements */
  themeCSS: string;
}

/**
 * Generate PDF-compatible theme CSS from current app theme
 */
export function generatePDFThemeCSS(
  themeId: ThemeColor, 
  customColors?: CustomColorSettings
): PDFThemeData {
  const theme = getTheme(themeId, customColors);
  
  // Generate CSS custom properties for PDF template
  const cssVariables = `
    --pdf-theme-primary: ${theme.primary};
    --pdf-theme-secondary: ${theme.secondary};
    --pdf-theme-accent: ${theme.accent};
    --pdf-theme-gradient: ${theme.gradient};
    
    /* Derived colors for professional document styling */
    --pdf-company-name: ${theme.primary};
    --pdf-document-title: ${theme.primary};
    --pdf-table-header: ${theme.primary};
    --pdf-table-border: ${adjustColorOpacity(theme.primary, 0.3)};
    --pdf-accent-elements: ${theme.accent};
    --pdf-total-highlight: ${theme.primary};
    --pdf-info-labels: ${theme.secondary};
  `;
  
  // Generate theme-specific CSS classes
  const themeCSS = `
    /* Theme-aware company branding */
    .company-name {
      color: var(--pdf-company-name) !important;
    }
    
    /* Document title styling */
    .document-title {
      color: var(--pdf-document-title) !important;
    }
    
    /* Table header theming */
    .positions-table th,
    .activities-table th {
      background-color: ${adjustColorOpacity(theme.primary, 0.1)} !important;
      color: var(--pdf-table-header) !important;
    }
    
    /* Border and line theming */
    .letterhead,
    .info-block,
    .notes-section,
    .business-footer {
      border-color: var(--pdf-table-border) !important;
    }
    
    .positions-table,
    .activities-table,
    .totals-table {
      border-color: var(--pdf-table-border) !important;
    }
    
    .positions-table th,
    .positions-table td,
    .activities-table th,
    .activities-table td {
      border-color: var(--pdf-table-border) !important;
    }
    
    /* Information labels */
    .info-label,
    .notes-title {
      color: var(--pdf-info-labels) !important;
    }
    
    /* Total amount highlighting */
    .total-final {
      border-color: var(--pdf-theme-primary) !important;
      color: var(--pdf-theme-primary) !important;
    }
    
    /* Accent elements */
    .sender-line {
      border-color: var(--pdf-table-border) !important;
    }
    
    /* Subtle background theming for sub-items */
    .sub-position {
      background-color: ${adjustColorOpacity(theme.primary, 0.05)} !important;
    }
  `;
  
  return {
    themeId,
    theme,
    cssVariables: cssVariables.trim(),
    themeCSS: themeCSS.trim()
  };
}

/**
 * Inject theme CSS into PDF template HTML
 */
export function injectThemeIntoTemplate(
  templateHTML: string, 
  pdfThemeData: PDFThemeData
): string {
  // Find the closing </style> tag and inject theme CSS before it
  const styleEndIndex = templateHTML.lastIndexOf('</style>');
  
  if (styleEndIndex === -1) {
    console.warn('No <style> tag found in template, cannot inject theme CSS');
    return templateHTML;
  }
  
  const themeInjection = `
    
    /* === PDF THEME INTEGRATION === */
    :root {
      ${pdfThemeData.cssVariables}
    }
    
    ${pdfThemeData.themeCSS}
    /* === END THEME INTEGRATION === */
  `;
  
  // Insert theme CSS before closing </style>
  const themedTemplate = 
    templateHTML.substring(0, styleEndIndex) + 
    themeInjection + 
    templateHTML.substring(styleEndIndex);
  
  return themedTemplate;
}

/**
 * Utility: Adjust color opacity for subtle styling
 */
function adjustColorOpacity(hexColor: string, opacity: number): string {
  // Convert hex to RGB and add alpha
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get current theme data for PDF generation
 * This integrates with the app's theme system
 */
export function getCurrentPDFTheme(
  currentTheme: ThemeColor,
  customColors?: CustomColorSettings
): PDFThemeData {
  return generatePDFThemeCSS(currentTheme, customColors);
}

/**
 * Validate theme integration in PDF templates
 */
export function validatePDFThemeIntegration(templateHTML: string): {
  hasStyleTag: boolean;
  hasThemeVariables: boolean;
  hasThemeCSS: boolean;
  isValid: boolean;
} {
  const hasStyleTag = templateHTML.includes('<style>') && templateHTML.includes('</style>');
  const hasThemeVariables = templateHTML.includes('--pdf-theme-primary');
  const hasThemeCSS = templateHTML.includes('PDF THEME INTEGRATION');
  
  return {
    hasStyleTag,
    hasThemeVariables,
    hasThemeCSS,
    isValid: hasStyleTag && hasThemeVariables && hasThemeCSS
  };
}