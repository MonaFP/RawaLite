import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';

export type FocusVariant = 'zen' | 'mini' | 'free';

interface FocusModeState {
  active: boolean;
  variant: FocusVariant | null;
  autoRestore: boolean;
  sessionId: string;
  isLoading: boolean;
  toggle: (v?: FocusVariant) => void;
  disable: () => void;
  setAutoRestore: (enabled: boolean) => Promise<boolean>;
  resetPreferences: () => Promise<boolean>;
}

const FocusModeContext = createContext<FocusModeState | undefined>(undefined);

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

import { FocusIpcService, FocusPreferences } from '../services/ipc/FocusIpcService';

interface FocusModeProviderProps extends PropsWithChildren {
  children: React.ReactNode;
  userId?: string;
}

export const FocusModeProvider: React.FC<FocusModeProviderProps> = ({ 
  children, 
  userId = 'default' 
}) => {
  const [active, setActive] = useState(false);
  const [variant, setVariant] = useState<FocusVariant | null>(null);
  const [autoRestore, setAutoRestoreState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionId] = useState<string>(() => 
    `focus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const focusService = FocusIpcService.getInstance();

  // Toggle focus mode
  const toggle = useCallback(async (v?: FocusVariant) => {
    const targetVariant = v || 'zen';
    
    try {
      if (!active) {
        // Activate focus mode with specified variant
        await focusService.setFocusMode(userId, true, targetVariant);
        await focusService.startFocusSession(userId, targetVariant, sessionId);
        
        setActive(true);
        setVariant(targetVariant);
        console.log(`🎯 Focus Mode activated: ${targetVariant}`);
      } else if (variant === targetVariant) {
        // Same variant clicked - deactivate focus mode
        await focusService.setFocusMode(userId, false, null);
        await focusService.endFocusSession(sessionId);
        
        setActive(false);
        setVariant(null);
        console.log('🎯 Focus Mode deactivated - same variant clicked');
      } else {
        // Different variant clicked - switch to new variant
        await focusService.setFocusMode(userId, true, targetVariant);
        // End previous session and start new one
        await focusService.endFocusSession(sessionId);
        await focusService.startFocusSession(userId, targetVariant, sessionId);
        
        setVariant(targetVariant);
        console.log(`🎯 Focus Mode switched: ${variant} → ${targetVariant}`);
      }
    } catch (error) {
      console.error('[FocusModeContext] Error toggling focus mode:', error);
      // Update local state even if database fails
      if (!active) {
        setActive(true);
        setVariant(targetVariant);
      } else if (variant === targetVariant) {
        setActive(false);
        setVariant(null);
      } else {
        setVariant(targetVariant);
      }
    }
  }, [active, variant, focusService, userId, sessionId]);

  // Disable focus mode
  const disable = useCallback(async () => {
    try {
      // End current session if active
      if (active) {
        await focusService.endFocusSession(sessionId);
      }
      
      // Set focus mode inactive in database
      await focusService.setFocusMode(userId, false, null);
      
      setActive(false);
      setVariant(null);
      console.log('🎯 Focus Mode disabled via ESC');
    } catch (error) {
      console.error('[FocusModeContext] Error disabling focus mode:', error);
      // Still update local state even if database fails
      setActive(false);
      setVariant(null);
    }
  }, [active, sessionId, focusService, userId]);

  // Set auto-restore preference
  const setAutoRestore = useCallback(async (enabled: boolean): Promise<boolean> => {
    try {
      const success = await focusService.setAutoRestore(userId, enabled);
      if (success) {
        setAutoRestoreState(enabled);
      }
      return success;
    } catch (error) {
      console.error('[FocusModeContext] Error setting auto-restore:', error);
      return false;
    }
  }, [focusService, userId]);

  // Reset preferences to defaults
  const resetPreferences = useCallback(async (): Promise<boolean> => {
    try {
      const success = await focusService.resetPreferences(userId);
      if (success) {
        setActive(false);
        setVariant(null);
        setAutoRestoreState(false);
      }
      return success;
    } catch (error) {
      console.error('[FocusModeContext] Error resetting preferences:', error);
      return false;
    }
  }, [focusService, userId]);

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

  // Load focus mode preferences from database with localStorage fallback
  useEffect(() => {
    const loadFocusPreferences = async () => {
      try {
        setIsLoading(true);

        // Validate schema first
        const schemaValid = await focusService.validateFocusSchema();
        if (!schemaValid) {
          console.warn('[FocusModeContext] Schema validation failed, using localStorage fallback');
          loadFromLocalStorage();
          return;
        }

        // Load from database
        const dbPreferences = await focusService.getUserFocusPreferences(userId);

        if (dbPreferences) {
          // Apply database preferences
          setAutoRestoreState(dbPreferences.autoRestore);
          
          // Only restore focus mode if auto-restore is enabled and we have a valid variant
          if (dbPreferences.autoRestore && dbPreferences.focusModeActive && dbPreferences.focusModeVariant) {
            setActive(true);
            setVariant(dbPreferences.focusModeVariant);
            console.log(`🎯 Restored focus mode from database: ${dbPreferences.focusModeVariant}`);
          } else {
            console.log('🎯 Database preferences found but auto-restore disabled or no active focus mode');
          }
        } else {
          console.warn('[FocusModeContext] No database preferences found, using localStorage fallback');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('[FocusModeContext] Error loading focus preferences:', error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
      // localStorage fallback - but don't auto-restore to prevent UI hiding
      const savedVariant = localStorage.getItem('rawalite-focus-variant') as FocusVariant | null;
      const savedActive = localStorage.getItem('rawalite-focus-active') === 'true';
      const savedAutoRestore = localStorage.getItem('rawalite-focus-auto-restore') === 'true';
      
      setAutoRestoreState(savedAutoRestore);
      
      console.log(`🎯 Found focus mode in localStorage: active=${savedActive}, variant=${savedVariant}, autoRestore=${savedAutoRestore}`);
      console.log(`🎯 NOT auto-restoring from localStorage to prevent UI hiding - user can manually activate`);
      
      // Don't auto-restore from localStorage to prevent navigation UI hiding
      // if (savedAutoRestore && savedActive && savedVariant) {
      //   setActive(true);
      //   setVariant(savedVariant);
      //   console.log(`🎯 Restored focus mode from localStorage: ${savedVariant}`);
      // }
    };

    loadFocusPreferences();
  }, [focusService, userId]);

  // Save focus mode preference to localStorage (fallback sync)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('rawalite-focus-active', active.toString());
      localStorage.setItem('rawalite-focus-auto-restore', autoRestore.toString());
      if (variant) {
        localStorage.setItem('rawalite-focus-variant', variant);
      } else {
        localStorage.removeItem('rawalite-focus-variant');
      }
    }
  }, [active, variant, autoRestore, isLoading]);

  return (
    <FocusModeContext.Provider value={{
      active,
      variant,
      autoRestore,
      sessionId,
      isLoading,
      toggle,
      disable,
      setAutoRestore,
      resetPreferences
    }}>
      {children}
    </FocusModeContext.Provider>
  );
};