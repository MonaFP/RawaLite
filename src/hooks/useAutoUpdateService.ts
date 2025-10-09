/**
 * useAutoUpdateService Hook
 * 
 * Manages AutoUpdateService lifecycle based on auto-update preferences
 * Provides service control and status monitoring
 */

import { useEffect, useRef, useState } from 'react';
import { AutoUpdateService } from '../services/AutoUpdateService';
import { useAutoUpdatePreferences } from './useAutoUpdatePreferences';
import { useNotifications } from '../contexts/NotificationContext';

export interface AutoUpdateServiceStatus {
  isRunning: boolean;
  hasUpdate?: boolean;
  currentDownload?: {
    updateInfo: any;
    progress: number;
    status: 'downloading' | 'completed' | 'failed';
  };
  lastCheck?: number;
  nextCheck?: number;
}

export function useAutoUpdateService() {
  const { preferences, loading: preferencesLoading } = useAutoUpdatePreferences();
  const { showNotification } = useNotifications();
  const serviceRef = useRef<AutoUpdateService | null>(null);
  const [status, setStatus] = useState<AutoUpdateServiceStatus>({
    isRunning: false
  });

  // Service Lifecycle Management
  useEffect(() => {
    if (preferencesLoading || !preferences) return;

    const service = serviceRef.current;

    if (preferences.enabled && !service) {
      // Service aktivieren
      console.log('[useAutoUpdateService] Starting AutoUpdateService');
      
      const newService = AutoUpdateService.getInstance();
      serviceRef.current = newService;

      // Event Listeners
      newService.on('started', ({ preferences: servicePrefs }: { preferences: any }) => {
        console.log('[useAutoUpdateService] Service started:', servicePrefs);
        setStatus(prev => ({ ...prev, isRunning: true }));
      });

      newService.on('stopped', () => {
        console.log('[useAutoUpdateService] Service stopped');
        setStatus(prev => ({ ...prev, isRunning: false }));
      });

      newService.on('updateAvailable', ({ updateInfo }: { updateInfo: any }) => {
        console.log('[useAutoUpdateService] Update available:', updateInfo?.tag_name);
        setStatus(prev => ({ 
          ...prev, 
          hasUpdate: true 
        }));

        // Optional: Show notification based on preferences
        if (preferences.notificationStyle === 'prominent') {
          showNotification('info', 'Update verfügbar!');
        }
      });

      newService.on('downloadStarted', ({ updateInfo }: { updateInfo: any }) => {
        console.log('[useAutoUpdateService] Download started:', updateInfo?.tag_name);
        setStatus(prev => ({
          ...prev,
          currentDownload: {
            updateInfo,
            progress: 0,
            status: 'downloading'
          }
        }));
      });

      newService.on('downloadCompleted', ({ updateInfo, downloadPath }: { updateInfo: any; downloadPath: any }) => {
        console.log('[useAutoUpdateService] Download completed:', updateInfo?.tag_name);
        setStatus(prev => ({
          ...prev,
          currentDownload: prev.currentDownload ? {
            ...prev.currentDownload,
            progress: 100,
            status: 'completed'
          } : undefined
        }));
        
        // Show completion notification
        showNotification('success', `Update ${updateInfo?.tag_name} heruntergeladen`);
      });

      newService.on('downloadFailed', ({ updateInfo, error }: { updateInfo: any; error: any }) => {
        console.error('[useAutoUpdateService] Download failed:', error);
        setStatus(prev => ({
          ...prev,
          currentDownload: prev.currentDownload ? {
            ...prev.currentDownload,
            status: 'failed'
          } : undefined
        }));
        
        // Show error notification
        showNotification('error', `Download fehlgeschlagen: ${error}`);
      });

      newService.on('checkCompleted', ({ result, timestamp }: { result: any; timestamp: any }) => {
        console.log('[useAutoUpdateService] Check completed:', result.hasUpdate);
        setStatus(prev => ({
          ...prev,
          hasUpdate: result.hasUpdate,
          lastCheck: timestamp
        }));
      });

      newService.on('checkFailed', ({ error }: { error: any }) => {
        console.error('[useAutoUpdateService] Check failed:', error);
        setStatus(prev => ({
          ...prev,
          lastCheck: Date.now()
        }));
      });

      // Service starten
      newService.start(preferences);

    } else if (!preferences.enabled && service) {
      // Service deaktivieren
      console.log('[useAutoUpdateService] Stopping AutoUpdateService');
      
      service.stop();
      serviceRef.current = null;
      setStatus({ isRunning: false });

    } else if (preferences.enabled && service) {
      // Preferences wurden geändert - Update Service
      console.log('[useAutoUpdateService] Updating service preferences');
      service.updatePreferences(preferences);
    }

    // Cleanup
    return () => {
      if (serviceRef.current) {
        serviceRef.current.stop();
        serviceRef.current = null;
      }
    };
  }, [preferences, preferencesLoading, showNotification]);

  // Service Control Functions
  const manualCheck = async () => {
    const service = serviceRef.current;
    if (!service) {
      console.warn('[useAutoUpdateService] No service available for manual check');
      return;
    }

    try {
      await service.performManualCheck();
    } catch (error) {
      console.error('[useAutoUpdateService] Manual check failed:', error);
      showNotification('error', 'Update-Prüfung fehlgeschlagen');
    }
  };

  const getServiceInstance = () => serviceRef.current;

  return {
    status,
    preferences,
    preferencesLoading,
    manualCheck,
    getServiceInstance
  };
}