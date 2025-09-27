import {useState, useCallback, useEffect, type FC, type ChangeEvent, type CSSProperties } from 'react';

// Hilfsfunktionen für Dezimal-Parsing
export function parseDecimal(input: string): number | null {
  if (!input || input.trim() === '') {
    return null;
  }
  
  // Validiere dass es ein gültiges Format ist (keine doppelten Punkte/Kommas)
  const hasMultipleSeparators = (input.match(/[.,]/g) || []).length > 1;
  if (hasMultipleSeparators) {
    return null;
  }
  
  // Ersetze Komma durch Punkt für deutsche Eingabe
  const normalized = input.replace(',', '.');
  
  // Validiere dass es eine gültige Zahl ist
  const parsed = parseFloat(normalized);
  
  if (isNaN(parsed)) {
    return null;
  }
  
  return parsed;
}

export function isValidDecimalInput(input: string): boolean {
  if (!input || input.trim() === '') {
    return true; // Leere Eingabe ist erlaubt
  }
  
  // Nur Punkt oder nur Komma ist ungültig
  if (input === '.' || input === ',') {
    return false;
  }
  
  // Erlaube nur Ziffern, einen Punkt oder ein Komma, nicht beide
  const regex = /^\d*[.,]?\d*$/;
  const hasMultipleSeparators = (input.match(/[.,]/g) || []).length > 1;
  
  return regex.test(input) && !hasMultipleSeparators;
}

export interface MoneyInputProps {
  value: number | null | undefined;
  onChangeNumber: (value: number) => void;
  placeholder?: string;
  style?: CSSProperties;
  min?: string;
  step?: string;
  required?: boolean;
  disabled?: boolean;
}

export const MoneyInput: FC<MoneyInputProps> = ({
  value,
  onChangeNumber,
  placeholder = "0,00",
  style,
  min = "0",
  step = "0.01",
  required = false,
  disabled = false
}) => {
  // Interner String-State für Eingabe
  const [inputValue, setInputValue] = useState<string>(
    value != null ? value.toString().replace('.', ',') : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  // Update interner State wenn value prop sich ändert (von außen)
  useEffect(() => {
    if (!isFocused && value != null) {
      setInputValue(value.toString().replace('.', ','));
    }
  }, [value, isFocused]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Validiere Eingabe während Tippen
    if (isValidDecimalInput(newValue)) {
      setInputValue(newValue);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Parse und validiere bei Blur
    const parsed = parseDecimal(inputValue);
    
    if (parsed !== null) {
      onChangeNumber(parsed);
      // Formatiere Anzeige (Punkt wird zu Komma)
      setInputValue(parsed.toString().replace('.', ','));
    } else if (inputValue.trim() === '') {
      // Leere Eingabe → 0
      onChangeNumber(0);
      setInputValue('');
    } else {
      // Ungültige Eingabe → zurück zum letzten gültigen Wert
      setInputValue(value != null ? value.toString().replace('.', ',') : '');
    }
  }, [inputValue, onChangeNumber, value]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const defaultStyle: CSSProperties = {
    width: "100%",
    padding: "6px",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: "4px",
    background: "rgba(17,24,39,.8)",
    color: "var(--muted)",
    fontSize: "14px",
    ...style
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      style={defaultStyle}
      min={min}
      step={step}
      required={required}
      disabled={disabled}
    />
  );
};
