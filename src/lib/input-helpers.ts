/**
 * Input Helper für benutzerfreundliche numerische Eingabefelder
 * 
 * Diese Utility-Funktionen verbessern die Benutzererfahrung bei numerischen Eingaben:
 * - Leere Felder statt "0" anzeigen
 * - Komma und Punkt als Dezimaltrennzeichen akzeptieren  
 * - Spinner entfernen
 * - Bestehende Validierung und Schema beibehalten
 */

/**
 * Formatiert einen numerischen Wert für die Anzeige im Input-Feld
 * @param value - Der numerische Wert
 * @returns Leer-String für 0, sonst den Wert als String
 */
export function formatNumberInputValue(value: number): string {
  // Zeige leeres Feld statt "0" für bessere UX
  if (value === 0 || isNaN(value)) {
    return '';
  }
  return value.toString();
}

/**
 * Parst einen Input-String zu einer Zahl mit Dezimaltrennzeichen-Normalisierung
 * @param input - Der Input-String vom Benutzer
 * @param fallback - Fallback-Wert (default: 0)
 * @returns Geparste Zahl
 */
export function parseNumberInput(input: string, fallback: number = 0): number {
  if (!input || input.trim() === '') {
    return fallback;
  }
  
  // Normalisiere Dezimaltrennzeichen: Komma zu Punkt
  const normalized = input.replace(',', '.');
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * CSS-Styles zum Entfernen der Browser-Spinner bei numerischen Inputs
 * @returns React.CSSProperties Objekt mit Spinner-Entfernung
 */
export function getNumberInputStyles(): React.CSSProperties {
  return {
    WebkitAppearance: 'none' as const,
    MozAppearance: 'textfield' as const,
  };
}