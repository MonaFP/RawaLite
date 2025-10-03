// Echter Settings-Hook - verwendet SettingsContext (konsistent mit der App)
import { useSettings as useSettingsContext } from '../contexts/SettingsContext';

export const useSettings = () => {
  return useSettingsContext();
};