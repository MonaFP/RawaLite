import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';

export type FocusVariant = 'zen' | 'mini' | 'free' | null;

interface FocusModeState {
  active: boolean;
  variant: FocusVariant;
  toggle: (v?: FocusVariant) => void;
  disable: () => void;
}

const FocusModeContext = createContext<FocusModeState | undefined>(undefined);

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

interface FocusModeProviderProps extends PropsWithChildren {
  children: React.ReactNode;
}

export const FocusModeProvider: React.FC<FocusModeProviderProps> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [variant, setVariant] = useState<FocusVariant>(null);

  // Toggle focus mode
  const toggle = useCallback((v?: FocusVariant) => {
    const targetVariant = v || 'zen';
    
    if (!active) {
      // Activate focus mode with specified variant
      setActive(true);
      setVariant(targetVariant);
      console.log(`🎯 Focus Mode activated: ${targetVariant}`);
    } else if (variant === targetVariant) {
      // Same variant clicked - deactivate focus mode
      setActive(false);
      setVariant(null);
      console.log('🎯 Focus Mode deactivated - same variant clicked');
    } else {
      // Different variant clicked - switch to new variant
      setVariant(targetVariant);
      console.log(`🎯 Focus Mode switched: ${variant} → ${targetVariant}`);
    }
  }, [active, variant]);

  // Disable focus mode
  const disable = useCallback(() => {
    setActive(false);
    setVariant(null);
    console.log('🎯 Focus Mode disabled via ESC');
  }, []);

  // Apply data-focus-mode attribute to document body
  useEffect(() => {
    if (active && variant) {
      document.body.dataset.focusMode = variant;
      console.log(`🎯 Applied focus mode: data-focus-mode="${variant}"`);
    } else {
      delete document.body.dataset.focusMode;
      console.log('🎯 Removed focus mode from body');
    }
  }, [active, variant]);

  // Global ESC key handler to exit focus mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active) {
        e.preventDefault();
        disable();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [active, disable]);

  // Global keyboard shortcuts for focus mode
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Ctrl+Shift+F or F11 to toggle focus mode
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') || e.key === 'F11') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [toggle]);

  // Load focus mode preference from localStorage
  useEffect(() => {
    const savedVariant = localStorage.getItem('rawalite-focus-variant') as FocusVariant;
    const savedActive = localStorage.getItem('rawalite-focus-active') === 'true';
    
    if (savedActive && savedVariant && (savedVariant === 'zen' || savedVariant === 'mini' || savedVariant === 'free')) {
      setActive(true);
      setVariant(savedVariant);
      console.log(`🎯 Restored focus mode from localStorage: ${savedVariant}`);
    }
  }, []);

  // Save focus mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('rawalite-focus-active', active.toString());
    if (variant) {
      localStorage.setItem('rawalite-focus-variant', variant);
    } else {
      localStorage.removeItem('rawalite-focus-variant');
    }
  }, [active, variant]);

  return (
    <FocusModeContext.Provider value={{
      active,
      variant,
      toggle,
      disable
    }}>
      {children}
    </FocusModeContext.Provider>
  );
};