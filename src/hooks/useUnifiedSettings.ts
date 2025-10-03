// Echter Settings-Hook - verwendet SettingsContext (konsistent mit der App)
import { useSettings } from '../contexts/SettingsContext';

export const useUnifiedSettings = () => {
  return useSettings();
};