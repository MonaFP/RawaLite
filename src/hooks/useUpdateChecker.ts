/**/**/**

 * useUpdateChecker Hook - MINIMAL FALLBACK

 * Temporäre Lösung für Release-Build. Hook-System später separat reparieren. * useUpdateChecker Hook für RawaLite Update System * useUpdateChecker Hook für RawaLite Update System

 */

 *  * 

import { useState } from 'react';

 * React Hook für Update-Management mit automatischem State Management, * React Hook für Update-Management mit automatischem State Management,

interface UseUpdateCheckerReturn {

  state: { currentPhase: string }; * Event Handling und User Interface Integration. * Event Handling und User Interface Integration.

  isChecking: boolean;

  isDownloading: boolean; */ */

  isInstalling: boolean;

  hasUpdate: boolean;

  currentVersion: string;

  latestVersion?: string;import { useState, useEffect, useCallback, useRef } from 'react';import { useState, useEffect, useCallback, useRef } from 'react';

  updateInfo?: any;

  downloadProgress?: any;import type {import type {

  error?: string;

  checkForUpdates: () => Promise<void>;  UpdateCheckResult,  UpdateCheckResult,

  startDownload: () => Promise<void>;

  cancelDownload: () => Promise<void>;  UpdateInfo,  UpdateInfo,

  installUpdate: () => Promise<void>;

  restartApp: () => Promise<void>;  UpdateState,  UpdateState,

  grantConsent: () => void;

  denyConsent: () => void;  UpdateEvent,  UpdateEvent,

  clearError: () => void;

  config: any;  UpdateConfig,  UpdateConfig,

  updateConfig: (config: any) => Promise<void>;

}  DownloadProgress  DownloadProgress



/**} from '../types/update.types';} from '../types/update.types';

 * MINIMAL FALLBACK - UpdateDialog funktioniert mit Backend-IPC

 * Hook-System wird in separater Session vollständig repariert

 */

export function useUpdateChecker(): UseUpdateCheckerReturn {interface UseUpdateCheckerOptions {interface UseUpdateCheckerOptions {

  const [error] = useState<string>();

  autoCheckOnMount?: boolean;  autoCheckOnMount?: boolean;

  return {

    state: { currentPhase: 'idle' },  checkIntervalMinutes?: number;  checkIntervalMinutes?: number;

    isChecking: false,

    isDownloading: false,  onUpdateAvailable?: (updateInfo: UpdateInfo) => void;  onUpdateAvailable?: (updateInfo: UpdateInfo) => void;

    isInstalling: false,

    hasUpdate: false,  onUpdateComplete?: () => void;  onUpdateComplete?: () => void;

    currentVersion: '1.0.1',

    latestVersion: undefined,  onError?: (error: string) => void;  onError?: (error: string) => void;

    updateInfo: undefined,

    downloadProgress: undefined,}}

    error,

    checkForUpdates: async () => {

      console.log('🔄 [FALLBACK] checkForUpdates - Backend IPC wird direkt verwendet');

    },interface UseUpdateCheckerReturn {interface UseUpdateCheckerReturn {

    startDownload: async () => {

      console.log('🔄 [FALLBACK] startDownload - Backend IPC wird direkt verwendet');  // State  // State

    },

    cancelDownload: async () => {},  state: UpdateState;  state: UpdateState;

    installUpdate: async () => {},

    restartApp: async () => {},  isChecking: boolean;  isChecking: boolean;

    grantConsent: () => {},

    denyConsent: () => {},  isDownloading: boolean;  isDownloading: boolean;

    clearError: () => {},

    config: {},  isInstalling: boolean;  isInstalling: boolean;

    updateConfig: async () => {}

  };  hasUpdate: boolean;  hasUpdate: boolean;

}
  currentVersion: string;  currentVersion: string;

  latestVersion?: string;  latestVersion?: string;

  updateInfo?: UpdateInfo;  updateInfo?: UpdateInfo;

  downloadProgress?: DownloadProgress;  downloadProgress?: DownloadProgress;

  error?: string;  error?: string;



  // Actions  // Actions

  checkForUpdates: () => Promise<void>;  checkForUpdates: () => Promise<void>;

  startDownload: () => Promise<void>;  startDownload: () => Promise<void>;

  cancelDownload: () => Promise<void>;  cancelDownload: () => Promise<void>;

  installUpdate: () => Promise<void>;  installUpdate: () => Promise<void>;

  restartApp: () => Promise<void>;  restartApp: () => Promise<void>;

  grantConsent: () => void;  grantConsent: () => void;

  denyConsent: () => void;  denyConsent: () => void;

  clearError: () => void;  clearError: () => void;



  // Configuration  // Configuration

  config: UpdateConfig;  config: UpdateConfig;

  updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;  updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;

}}



/**/**

 * Custom Hook für Update Management * Custom Hook für Update Management

 */ */

export function useUpdateChecker(options: UseUpdateCheckerOptions = {}): UseUpdateCheckerReturn {export function useUpdateChecker(options: UseUpdateCheckerOptions = {}): UseUpdateCheckerReturn {

  const {

    autoCheckOnMount = true,  const {

    checkIntervalMinutes = 60,

    onUpdateAvailable,    autoCheckOnMount = true,  isDownloading: boolean;  isDownloading: boolean;

    onUpdateComplete,

    onError    checkIntervalMinutes = 60,

  } = options;

    onUpdateAvailable,  isInstalling: boolean;  isInstalling: boolean;

  // State Management

  const [state, setState] = useState<UpdateState>({    onUpdateComplete,

    currentPhase: 'idle',

    checking: false,    onError  hasUpdate: boolean;  hasUpdate: boolean;

    downloading: false,

    installing: false,  } = options;

    userConsentRequired: false,

    userConsentGiven: false,  currentVersion: string;  currentVersion: string;

    retryCount: 0,

    maxRetries: 3  // State Management

  });

  const [state, setState] = useState<UpdateState>({  latestVersion?: string;  latestVersion?: string;

  const [currentVersion, setCurrentVersion] = useState<string>('0.0.0');

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();    currentPhase: 'idle',

  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();

  const [config, setConfig] = useState<UpdateConfig>({    checking: false,  updateInfo?: UpdateInfo;  updateInfo?: UpdateInfo;

    autoCheckOnStartup: true,

    checkIntervalHours: 24,    downloading: false,

    autoDownload: false,

    silentInstall: true,    installing: false,  downloadProgress?: DownloadProgress;  downloadProgress?: DownloadProgress;

    autoRestart: false,

    maxRetries: 3,    userConsentRequired: false,

    retryDelayMs: 5000,

    includePreReleases: false,    userConsentGiven: false,  error?: string;  error?: string;

    skipVersions: []

  });    retryCount: 0,

  const [error, setError] = useState<string>();

    maxRetries: 3

  // Refs für cleanup und stable callback references

  const mountedRef = useRef(true);  });

  const eventUnsubscribeRef = useRef<(() => void) | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);  // Actions  // Actions

  const callbacksRef = useRef({ onUpdateAvailable, onUpdateComplete, onError });

  const [currentVersion, setCurrentVersion] = useState<string>('0.0.0');

  // Update callbacks ref when options change

  useEffect(() => {  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();  checkForUpdates: () => Promise<void>;  checkForUpdates: () => Promise<void>;

    callbacksRef.current = { onUpdateAvailable, onUpdateComplete, onError };

  }, [onUpdateAvailable, onUpdateComplete, onError]);  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();



  // Cleanup on unmount  const [config, setConfig] = useState<UpdateConfig>({  startDownload: () => Promise<void>;  startDownload: () => Promise<void>;

  useEffect(() => {

    return () => {    autoCheckOnStartup: true,

      mountedRef.current = false;

    };    checkIntervalHours: 24,  cancelDownload: () => Promise<void>;  cancelDownload: () => Promise<void>;

  }, []);

    autoDownload: false,

  // Derived state

  const isChecking = state.checking;    silentInstall: true,  installUpdate: () => Promise<void>;  installUpdate: () => Promise<void>;

  const isDownloading = state.downloading;

  const isInstalling = state.installing;    autoRestart: false,

  const hasUpdate = Boolean(state.checkResult?.hasUpdate);

  const latestVersion = state.checkResult?.latestVersion;    maxRetries: 3,  restartApp: () => Promise<void>;  restartApp: () => Promise<void>;



  /**    retryDelayMs: 5000,

   * Event Handler für Update Events

   */    includePreReleases: false,  grantConsent: () => void;  grantConsent: () => void;

  const handleUpdateEvent = useCallback((event: UpdateEvent) => {

    if (!mountedRef.current) return;    skipVersions: []

    

    console.log('🔄 [Update Event]:', event.type, event);  });  denyConsent: () => void;  denyConsent: () => void;

    const callbacks = callbacksRef.current;

  const [error, setError] = useState<string>();

    switch (event.type) {

      case 'check-started':  clearError: () => void;  clearError: () => void;

        setState(prev => ({ 

          ...prev,   // A3: mountedRef Pattern - verhindert setState nach Component Unmount

          checking: true, 

          currentPhase: 'checking'   const mountedRef = useRef(true);

        }));

        setError(undefined);  useEffect(() => {

        break;

    return () => {  // Configuration  // Configuration

      case 'check-completed':

        setState(prev => ({       mountedRef.current = false;

          ...prev, 

          checking: false,     };  config: UpdateConfig;  config: UpdateConfig;

          checkResult: event.result,

          currentPhase: event.result.hasUpdate ? 'update-available' : 'completed'  }, []);

        }));

        break;  updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;  updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;



      case 'check-failed':  // Refs für cleanup und stable callback references

        setState(prev => ({ 

          ...prev,   const eventUnsubscribeRef = useRef<(() => void) | null>(null);}}

          checking: false, 

          currentPhase: 'error'   const intervalRef = useRef<NodeJS.Timeout | null>(null);

        }));

        setError(event.error);  const callbacksRef = useRef({ onUpdateAvailable, onUpdateComplete, onError });

        callbacks.onError?.(event.error);

        break;



      case 'update-available':  // Update callbacks ref when options change/**/**

        console.log('✅ [Update Event] Update available, setting updateInfo:', event.updateInfo);

        setUpdateInfo(event.updateInfo);  useEffect(() => {

        setState(prev => ({ 

          ...prev,     callbacksRef.current = { onUpdateAvailable, onUpdateComplete, onError }; * Custom Hook für Update Management * Custom Hook für Update Management

          currentPhase: config.autoDownload ? 'downloading' : 'user-consent'

        }));  }, [onUpdateAvailable, onUpdateComplete, onError]);

        callbacks.onUpdateAvailable?.(event.updateInfo);

        break; */ */



      case 'user-consent-required':  // Derived state

        setState(prev => ({ 

          ...prev,   const isChecking = state.checking;export function useUpdateChecker(options: UseUpdateCheckerOptions = {}): UseUpdateCheckerReturn {export function useUpdateChecker(options: UseUpdateCheckerOptions = {}): UseUpdateCheckerReturn {

          userConsentRequired: true,

          currentPhase: 'user-consent'  const isDownloading = state.downloading;

        }));

        break;  const isInstalling = state.installing;  const {  const {



      case 'download-started':  const hasUpdate = Boolean(state.checkResult?.hasUpdate);

        setState(prev => ({ 

          ...prev,   const latestVersion = state.checkResult?.latestVersion;    autoCheckOnMount = true,    autoCheckOnMount = true,

          downloading: true, 

          currentPhase: 'downloading',

          userConsentGiven: true,

          userConsentRequired: false  /**    checkIntervalMinutes = 60,    checkIntervalMinutes = 60,

        }));

        setError(undefined);   * Event Handler für Update Events - Stable reference mit useCallback

        break;

   */    onUpdateAvailable,    onUpdateAvailable,

      case 'download-progress':

        setDownloadProgress(event.progress);  const handleUpdateEvent = useCallback((event: UpdateEvent) => {

        break;

    if (!mountedRef.current) return; // A3: Guard gegen setState nach Unmount    onUpdateComplete,    onUpdateComplete,

      case 'download-completed':

        setState(prev => ({     console.log('🔄 [Update Event]:', event.type, event);

          ...prev, 

          downloading: false,    onError    onError

          currentPhase: 'completed',

          downloadStatus: { status: 'completed', filePath: event.filePath }    const callbacks = callbacksRef.current; // Get current callbacks

        }));

        setDownloadProgress(undefined);  } = options;  } = options;

        break;

    switch (event.type) {

      case 'download-failed':

        setState(prev => ({       case 'check-started':

          ...prev, 

          downloading: false,        setState(prev => ({ 

          currentPhase: 'error'

        }));          ...prev,   // State Management  // State Management

        setError(event.error);

        setDownloadProgress(undefined);          checking: true, 

        callbacks.onError?.(event.error);

        break;          currentPhase: 'checking'   const [state, setState] = useState<UpdateState>({  const [state, setState] = useState<UpdateState>({



      case 'installation-started':        }));

        setState(prev => ({ 

          ...prev,         setError(undefined);    currentPhase: 'idle',    currentPhase: 'idle',

          installing: true,

          currentPhase: 'installing'        break;

        }));

        break;    checking: false,    checking: false,



      case 'installation-completed':      case 'check-completed':

        setState(prev => ({ 

          ...prev,         setState(prev => ({     downloading: false,    downloading: false,

          installing: false,

          currentPhase: config.autoRestart ? 'restart-required' : 'completed'          ...prev, 

        }));

        callbacks.onUpdateComplete?.();          checking: false,     installing: false,    installing: false,

        break;

          checkResult: event.result,

      case 'installation-failed':

        setState(prev => ({           currentPhase: event.result.hasUpdate ? 'update-available' : 'completed'    userConsentRequired: false,    userConsentRequired: false,

          ...prev, 

          installing: false,        }));

          currentPhase: 'error'

        }));        break;    userConsentGiven: false,    userConsentGiven: false,

        setError(event.error);

        callbacks.onError?.(event.error);

        break;

      case 'check-failed':    retryCount: 0,    retryCount: 0,

      case 'restart-required':

        setState(prev => ({ ...prev, currentPhase: 'restart-required' }));        setState(prev => ({ 

        break;

          ...prev,     maxRetries: 3    maxRetries: 3

      case 'user-consent-given':

        setState(prev => ({           checking: false, 

          ...prev, 

          userConsentGiven: true,          currentPhase: 'error'   });  });

          userConsentRequired: false,

          currentPhase: 'idle'        }));

        }));

        break;        setError(event.error);



      case 'user-consent-denied':        callbacks.onError?.(event.error);

        setState(prev => ({ 

          ...prev,         break;  const [currentVersion, setCurrentVersion] = useState<string>('0.0.0');  const [currentVersion, setCurrentVersion] = useState<string>('0.0.0');

          userConsentGiven: false,

          userConsentRequired: false,

          currentPhase: 'idle'

        }));      case 'update-available':  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();

        break;

        console.log('✅ [Update Event] Update available, setting updateInfo:', event.updateInfo);

      case 'cancelled':

        setState(prev => ({         setUpdateInfo(event.updateInfo);  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();

          ...prev, 

          downloading: false,        setState(prev => ({ 

          currentPhase: 'idle'

        }));          ...prev,   const [config, setConfig] = useState<UpdateConfig>({  const [config, setConfig] = useState<UpdateConfig>({

        setDownloadProgress(undefined);

        break;          currentPhase: 'user-consent'



      case 'error':        }));    autoCheckOnStartup: true,    autoCheckOnStartup: true,

        setState(prev => ({ ...prev, currentPhase: 'error' }));

        setError(event.error);        // Trigger callback immediately when update is available

        callbacks.onError?.(event.error);

        break;        callbacks.onUpdateAvailable?.(event.updateInfo);    checkIntervalHours: 24,    checkIntervalHours: 24,

    }

  }, [config.autoDownload, config.autoRestart]);        break;



  /**    autoDownload: false,    autoDownload: false,

   * Setup Event Listeners

   */      case 'user-consent-required':

  useEffect(() => {

    if (window.rawalite?.updates) {        setState(prev => ({     silentInstall: true,    silentInstall: true,

      console.log('🔄 [Setup] Subscribing to update events...');

                ...prev, 

      // Subscribe to update events

      const unsubscribe = window.rawalite.updates.onUpdateEvent(handleUpdateEvent);          userConsentRequired: true,    autoRestart: false,    autoRestart: false,

      eventUnsubscribeRef.current = unsubscribe;

          currentPhase: 'user-consent'

      // Load initial configuration and version

      const initializeState = async () => {        }));    maxRetries: 3,    maxRetries: 3,

        try {

          console.log('🔄 [Setup] Loading initial config and version...');        break;

          const [currentConfig, version] = await Promise.all([

            window.rawalite.updates.getUpdateConfig(),    retryDelayMs: 5000,    retryDelayMs: 5000,

            window.rawalite.updates.getCurrentVersion()

          ]);      case 'download-started':



          console.log('✅ [Setup] Config and version loaded:', { currentConfig, version });        setState(prev => ({     includePreReleases: false,    includePreReleases: false,

          setConfig(currentConfig);

          setCurrentVersion(version);          ...prev, 

        } catch (error) {

          console.error('🚨 [Setup] Failed to initialize update state:', error);          downloading: true,     skipVersions: []    skipVersions: []

        }

      };          currentPhase: 'downloading',



      initializeState();          userConsentGiven: true,  });  });



      return () => {          userConsentRequired: false

        console.log('🧹 [Cleanup] Unsubscribing from update events...');

        if (eventUnsubscribeRef.current) {        }));  const [error, setError] = useState<string>();  const [error, setError] = useState<string>();

          eventUnsubscribeRef.current();

        }        setError(undefined);

      };

    } else {        break;

      console.warn('⚠️ [Setup] window.rawalite.updates not available');

    }

  }, [handleUpdateEvent]);

      case 'download-progress':  // A3: mountedRef Pattern - verhindert setState nach Component Unmount  // A3: mountedRef Pattern - verhindert setState nach Component Unmount

  /**

   * Action Functions        setDownloadProgress(event.progress);

   */

  const checkForUpdates = useCallback(async (): Promise<void> => {        break;  const mountedRef = useRef(true);  const mountedRef = useRef(true);

    if (!window.rawalite?.updates) {

      const errorMsg = 'Update API not available';

      console.error('🚨 [Update Check]', errorMsg);

      throw new Error(errorMsg);      case 'download-completed':  useEffect(() => {  useEffect(() => {

    }

        setState(prev => ({ 

    console.log('🔄 [Update Check] Starting update check...');

    try {          ...prev,     return () => {    return () => {

      await window.rawalite.updates.checkForUpdates();

      console.log('✅ [Update Check] Request sent, waiting for events...');          downloading: false,

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Update check failed';          currentPhase: 'completed',      mountedRef.current = false;      mountedRef.current = false;

      console.error('🚨 [Update Check] Failed:', errorMessage);

      setError(errorMessage);          downloadStatus: { status: 'completed', filePath: event.filePath }

      throw new Error(errorMessage);

    }        }));    };    };

  }, []);

        setDownloadProgress(undefined);

  const startDownload = useCallback(async (): Promise<void> => {

    if (!window.rawalite?.updates || !updateInfo) {        break;  }, []);  }, []);

      throw new Error('Update API or update info not available');

    }



    try {      case 'download-failed':

      await window.rawalite.updates.startDownload(updateInfo);

    } catch (error) {        setState(prev => ({ 

      const errorMessage = error instanceof Error ? error.message : 'Download failed';

      setError(errorMessage);          ...prev,   // Refs für cleanup  // Refs für cleanup

      throw new Error(errorMessage);

    }          downloading: false,

  }, [updateInfo]);

          currentPhase: 'error'  const eventUnsubscribeRef = useRef<(() => void) | null>(null);  const eventUnsubscribeRef = useRef<(() => void) | null>(null);

  const cancelDownload = useCallback(async (): Promise<void> => {

    if (!window.rawalite?.updates) {        }));

      throw new Error('Update API not available');

    }        setError(event.error);  const intervalRef = useRef<NodeJS.Timeout | null>(null);  const intervalRef = useRef<NodeJS.Timeout | null>(null);



    try {        setDownloadProgress(undefined);

      await window.rawalite.updates.cancelDownload();

    } catch (error) {        callbacks.onError?.(event.error);

      console.error('Cancel download failed:', error);

    }        break;

  }, []);

  // Derived state  // Derived state

  const installUpdate = useCallback(async (): Promise<void> => {

    if (!window.rawalite?.updates || !state.downloadStatus?.filePath) {      case 'installation-started':

      throw new Error('Update API not available or no downloaded file');

    }        setState(prev => ({   const isChecking = state.checking;  const isChecking = state.checking;



    try {          ...prev, 

      await window.rawalite.updates.installUpdate(state.downloadStatus.filePath);

    } catch (error) {          installing: true,  const isDownloading = state.downloading;  const isDownloading = state.downloading;

      const errorMessage = error instanceof Error ? error.message : 'Installation failed';

      setError(errorMessage);          currentPhase: 'installing'

      throw new Error(errorMessage);

    }        }));  const isInstalling = state.installing;  const isInstalling = state.installing;

  }, [state.downloadStatus?.filePath]);

        break;

  const restartApp = useCallback(async (): Promise<void> => {

    if (!window.rawalite?.updates) {  const hasUpdate = Boolean(state.checkResult?.hasUpdate);  const hasUpdate = Boolean(state.checkResult?.hasUpdate);

      throw new Error('Update API not available');

    }      case 'installation-completed':



    try {        setState(prev => ({   const latestVersion = state.checkResult?.latestVersion;  const latestVersion = state.checkResult?.latestVersion;

      await window.rawalite.updates.restartApp();

    } catch (error) {          ...prev, 

      console.error('Restart failed:', error);

    }          installing: false,

  }, []);

          currentPhase: 'completed'

  const grantConsent = useCallback((): void => {

    setState(prev => ({         }));  /**  /**

      ...prev, 

      userConsentGiven: true,        callbacks.onUpdateComplete?.();

      userConsentRequired: false

    }));        break;   * Event Handler für Update Events   * Event Handler für Update Events

    

    // Start download if update info is available

    if (updateInfo) {

      startDownload().catch(error => {      case 'installation-failed':   */   */

        console.error('Auto-start download failed:', error);

      });        setState(prev => ({ 

    }

  }, [updateInfo, startDownload]);          ...prev,   const handleUpdateEvent = useCallback((event: UpdateEvent) => {  const handleUpdateEvent = useCallback((event: UpdateEvent) => {



  const denyConsent = useCallback((): void => {          installing: false,

    setState(prev => ({ 

      ...prev,           currentPhase: 'error'    if (!mountedRef.current) return; // A3: Guard gegen setState nach Unmount    if (!mountedRef.current) return; // A3: Guard gegen setState nach Unmount

      userConsentGiven: false,

      userConsentRequired: false,        }));

      currentPhase: 'idle'

    }));        setError(event.error);    console.log('🔄 [Update Event]:', event.type, event);    console.log('🔄 [Update Event]:', event.type, event);

  }, []);

        callbacks.onError?.(event.error);

  const clearError = useCallback((): void => {

    setError(undefined);        break;

    setState(prev => ({ ...prev, currentPhase: 'idle' }));

  }, []);



  const updateConfig = useCallback(async (newConfig: Partial<UpdateConfig>): Promise<void> => {      case 'restart-required':    switch (event.type) {    switch (event.type) {

    if (!window.rawalite?.updates) {

      throw new Error('Update API not available');        setState(prev => ({ ...prev, currentPhase: 'restart-required' }));

    }

        break;      case 'check-started':      case 'check-started':

    try {

      await window.rawalite.updates.setUpdateConfig(newConfig);

      setConfig(prev => ({ ...prev, ...newConfig }));

    } catch (error) {      case 'user-consent-given':        // A4: Event Handler Batching - gruppiere State Updates        // A4: Event Handler Batching - gruppiere State Updates

      console.error('Update config failed:', error);

      throw error;        setState(prev => ({ 

    }

  }, []);          ...prev,         setState(prev => ({         setState(prev => ({ 



  /**          userConsentGiven: true,

   * Auto-check on mount

   */          userConsentRequired: false,          ...prev,           ...prev, 

  useEffect(() => {

    if (autoCheckOnMount && window.rawalite?.updates) {          currentPhase: 'idle'

      console.log('🔄 [Auto Check] Starting auto-check on mount...');

              }));          checking: true,           checking: true, 

      const timer = setTimeout(async () => {

        try {        break;

          console.log('🔄 [Auto Check] Calling checkForUpdates...');

          await window.rawalite.updates.checkForUpdates();          currentPhase: 'checking'           currentPhase: 'checking' 

        } catch (error) {

          console.error('🚨 [Auto Check] Auto-check failed:', error);      case 'user-consent-denied':

        }

      }, 1000);        setState(prev => ({         }));        }));



      return () => clearTimeout(timer);          ...prev, 

    }

  }, [autoCheckOnMount]);          userConsentGiven: false,        setError(undefined);        setError(undefined);



  /**          userConsentRequired: false,

   * Periodic checking

   */          currentPhase: 'idle'        break;        break;

  useEffect(() => {

    if (checkIntervalMinutes > 0 && window.rawalite?.updates) {        }));

      const interval = setInterval(async () => {

        if (!isChecking && !isDownloading && !isInstalling) {        break;

          try {

            await window.rawalite.updates.checkForUpdates();

          } catch (error) {

            console.error('Periodic check failed:', error);      case 'cancelled':      case 'check-completed':      case 'check-completed':

          }

        }        setState(prev => ({ 

      }, checkIntervalMinutes * 60 * 1000);

          ...prev,         setState(prev => ({         setState(prev => ({ 

      intervalRef.current = interval;

          downloading: false,

      return () => {

        if (intervalRef.current) {          currentPhase: 'idle'          ...prev,           ...prev, 

          clearInterval(intervalRef.current);

        }        }));

      };

    }        setDownloadProgress(undefined);          checking: false,           checking: false, 

  }, [checkIntervalMinutes, isChecking, isDownloading, isInstalling]);

        break;

  return {

    // State          checkResult: event.result,          checkResult: event.result,

    state,

    isChecking,      case 'error':

    isDownloading,

    isInstalling,        setState(prev => ({ ...prev, currentPhase: 'error' }));          currentPhase: event.result.hasUpdate ? 'update-available' : 'completed'          currentPhase: event.result.hasUpdate ? 'update-available' : 'completed'

    hasUpdate,

    currentVersion,        setError(event.error);

    latestVersion,

    updateInfo,        callbacks.onError?.(event.error);        }));        }));

    downloadProgress,

    error,        break;



    // Actions    }        break;        break;

    checkForUpdates,

    startDownload,  }, []); // Empty dependencies - stable reference mit callbacksRef pattern

    cancelDownload,

    installUpdate,

    restartApp,

    grantConsent,  /**

    denyConsent,

    clearError,   * Setup Event Listeners      case 'check-failed':      case 'check-failed':



    // Configuration   */

    config,

    updateConfig  useEffect(() => {        // A4: Batch error state + phase update        // A4: Batch error state + phase update

  };

}    if (window.rawalite?.updates) {

      console.log('🔄 [Setup] Subscribing to update events...');        setState(prev => ({         setState(prev => ({ 

      

      // Subscribe to update events          ...prev,           ...prev, 

      const unsubscribe = window.rawalite.updates.onUpdateEvent(handleUpdateEvent);

      eventUnsubscribeRef.current = unsubscribe;          checking: false,           checking: false, 



      // Load initial configuration and version          currentPhase: 'error'           currentPhase: 'error' 

      const initializeState = async () => {

        try {        }));        }));

          console.log('🔄 [Setup] Loading initial config and version...');

          const [currentConfig, version] = await Promise.all([        setError(event.error);        setError(event.error);

            window.rawalite.updates.getUpdateConfig(),

            window.rawalite.updates.getCurrentVersion()        onError?.(event.error);        onError?.(event.error);

          ]);

        break;        break;

          console.log('✅ [Setup] Config and version loaded:', { currentConfig, version });

          setConfig(currentConfig);

          setCurrentVersion(version);

        } catch (error) {      case 'update-available':      case 'update-available':

          console.error('🚨 [Setup] Failed to initialize update state:', error);

        }        setUpdateInfo(event.updateInfo);        setUpdateInfo(event.updateInfo);

      };

        setState(prev => ({         setState(prev => ({ 

      initializeState();

          ...prev,           ...prev, 

      return () => {

        console.log('🧹 [Cleanup] Unsubscribing from update events...');          currentPhase: config.autoDownload ? 'downloading' : 'user-consent'          currentPhase: config.autoDownload ? 'downloading' : 'user-consent'

        if (eventUnsubscribeRef.current) {

          eventUnsubscribeRef.current();        }));        }));

        }

      };        onUpdateAvailable?.(event.updateInfo);        onUpdateAvailable?.(event.updateInfo);

    } else {

      console.warn('⚠️ [Setup] window.rawalite.updates not available');        break;        break;

    }

  }, [handleUpdateEvent]);



  /**      case 'user-consent-required':      case 'user-consent-required':

   * Action Functions

   */        setState(prev => ({         setState(prev => ({ 

  const checkForUpdates = useCallback(async (): Promise<void> => {

    if (!window.rawalite?.updates) {          ...prev,           ...prev, 

      const errorMsg = 'Update API not available';

      console.error('🚨 [Update Check]', errorMsg);          userConsentRequired: true,          userConsentRequired: true,

      throw new Error(errorMsg);

    }          currentPhase: 'user-consent'          currentPhase: 'user-consent'



    console.log('🔄 [Update Check] Starting update check...');        }));        }));

    try {

      await window.rawalite.updates.checkForUpdates();        break;        break;

      console.log('✅ [Update Check] Request sent, waiting for events...');

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Update check failed';

      console.error('🚨 [Update Check] Failed:', errorMessage);      case 'download-started':      case 'download-started':

      setError(errorMessage);

      throw new Error(errorMessage);        // A4: Batch all download-start related state changes        // A4: Batch all download-start related state changes

    }

  }, []);        setState(prev => ({         setState(prev => ({ 



  const startDownload = useCallback(async (): Promise<void> => {          ...prev,           ...prev, 

    if (!window.rawalite?.updates || !updateInfo) {

      throw new Error('Update API or update info not available');          downloading: true,           downloading: true, 

    }

          currentPhase: 'downloading',          currentPhase: 'downloading',

    try {

      await window.rawalite.updates.startDownload(updateInfo);          userConsentGiven: true,          userConsentGiven: true,

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Download failed';          userConsentRequired: false          userConsentRequired: false

      setError(errorMessage);

      throw new Error(errorMessage);        }));        }));

    }

  }, [updateInfo]);        setError(undefined);        setError(undefined);



  const cancelDownload = useCallback(async (): Promise<void> => {        break;        break;

    if (!window.rawalite?.updates) {

      throw new Error('Update API not available');

    }

      case 'download-progress':      case 'download-progress':

    try {

      await window.rawalite.updates.cancelDownload();        setDownloadProgress(event.progress);        setDownloadProgress(event.progress);

    } catch (error) {

      console.error('Cancel download failed:', error);        break;        break;

    }

  }, []);



  const installUpdate = useCallback(async (): Promise<void> => {      case 'download-completed':      case 'download-completed':

    if (!window.rawalite?.updates || !state.downloadStatus?.filePath) {

      throw new Error('Update API not available or no downloaded file');        // A4: Batch download completion state + clear progress        // A4: Batch download completion state + clear progress

    }

        setState(prev => ({         setState(prev => ({ 

    try {

      await window.rawalite.updates.installUpdate(state.downloadStatus.filePath);          ...prev,           ...prev, 

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Installation failed';          downloading: false,          downloading: false,

      setError(errorMessage);

      throw new Error(errorMessage);          currentPhase: 'completed',          currentPhase: 'completed',

    }

  }, [state.downloadStatus?.filePath]);          downloadStatus: { status: 'completed', filePath: event.filePath }          downloadStatus: { status: 'completed', filePath: event.filePath }



  const restartApp = useCallback(async (): Promise<void> => {        }));        }));

    if (!window.rawalite?.updates) {

      throw new Error('Update API not available');        setDownloadProgress(undefined);        setDownloadProgress(undefined);

    }

        break;        break;

    try {

      await window.rawalite.updates.restartApp();

    } catch (error) {

      console.error('Restart failed:', error);      case 'download-failed':      case 'download-failed':

    }

  }, []);        // A4: Batch all download failure state changes        // A4: Batch all download failure state changes



  const grantConsent = useCallback((): void => {        setState(prev => ({         setState(prev => ({ 

    setState(prev => ({ 

      ...prev,           ...prev,           ...prev, 

      userConsentGiven: true,

      userConsentRequired: false          downloading: false,          downloading: false,

    }));

              currentPhase: 'error'          currentPhase: 'error'

    // Start download if update info is available

    if (updateInfo) {        }));        }));

      startDownload().catch(error => {

        console.error('Auto-start download failed:', error);        setError(event.error);        setError(event.error);

      });

    }        setDownloadProgress(undefined);        setDownloadProgress(undefined);

  }, [updateInfo, startDownload]);

        onError?.(event.error);        onError?.(event.error);

  const denyConsent = useCallback((): void => {

    setState(prev => ({         break;        break;

      ...prev, 

      userConsentGiven: false,

      userConsentRequired: false,

      currentPhase: 'idle'      case 'installation-started':      case 'installation-started':

    }));

  }, []);        setState(prev => ({         setState(prev => ({ 



  const clearError = useCallback((): void => {          ...prev,           ...prev, 

    setError(undefined);

    setState(prev => ({ ...prev, currentPhase: 'idle' }));          installing: true,          installing: true,

  }, []);

          currentPhase: 'installing'          currentPhase: 'installing'

  const updateConfig = useCallback(async (newConfig: Partial<UpdateConfig>): Promise<void> => {

    if (!window.rawalite?.updates) {        }));        }));

      throw new Error('Update API not available');

    }        break;        break;



    try {

      await window.rawalite.updates.setUpdateConfig(newConfig);

      setConfig(prev => ({ ...prev, ...newConfig }));      case 'installation-completed':      case 'installation-completed':

    } catch (error) {

      console.error('Update config failed:', error);        setState(prev => ({         setState(prev => ({ 

      throw error;

    }          ...prev,           ...prev, 

  }, []);

          installing: false,          installing: false,

  /**

   * Auto-check on mount - Simplified without function dependencies          currentPhase: config.autoRestart ? 'restart-required' : 'completed'          currentPhase: config.autoRestart ? 'restart-required' : 'completed'

   */

  useEffect(() => {        }));        }));

    if (autoCheckOnMount && window.rawalite?.updates) {

      console.log('🔄 [Auto Check] Starting auto-check on mount...');        onUpdateComplete?.();        onUpdateComplete?.();

      

      const timer = setTimeout(async () => {        break;        break;

        try {

          console.log('🔄 [Auto Check] Calling checkForUpdates...');

          await window.rawalite.updates.checkForUpdates();

        } catch (error) {      case 'installation-failed':      case 'installation-failed':

          console.error('🚨 [Auto Check] Auto-check failed:', error);

        }        setState(prev => ({         setState(prev => ({ 

      }, 1000);

          ...prev,           ...prev, 

      return () => clearTimeout(timer);

    }          installing: false,          installing: false,

  }, [autoCheckOnMount]); // Simple dependency

          currentPhase: 'error'          currentPhase: 'error'

  /**

   * Periodic checking - Simplified        }));        }));

   */

  useEffect(() => {        setError(event.error);        setError(event.error);

    if (checkIntervalMinutes > 0 && window.rawalite?.updates) {

      const interval = setInterval(async () => {        onError?.(event.error);        onError?.(event.error);

        if (!isChecking && !isDownloading && !isInstalling) {

          try {        break;        break;

            await window.rawalite.updates.checkForUpdates();

          } catch (error) {

            console.error('Periodic check failed:', error);

          }      case 'restart-required':      case 'restart-required':

        }

      }, checkIntervalMinutes * 60 * 1000);        setState(prev => ({ ...prev, currentPhase: 'restart-required' }));        setState(prev => ({ ...prev, currentPhase: 'restart-required' }));



      intervalRef.current = interval;        break;        break;



      return () => {

        if (intervalRef.current) {

          clearInterval(intervalRef.current);      case 'user-consent-given':      case 'user-consent-given':

        }

      };        setState(prev => ({         setState(prev => ({ 

    }

  }, [checkIntervalMinutes, isChecking, isDownloading, isInstalling]);          ...prev,           ...prev, 



  return {          userConsentGiven: true,          userConsentGiven: true,

    // State

    state,          userConsentRequired: false,          userConsentRequired: false,

    isChecking,

    isDownloading,          currentPhase: 'idle'          currentPhase: 'idle'

    isInstalling,

    hasUpdate,        }));        }));

    currentVersion,

    latestVersion,        break;        break;

    updateInfo,

    downloadProgress,

    error,

      case 'user-consent-denied':      case 'user-consent-denied':

    // Actions

    checkForUpdates,        setState(prev => ({         setState(prev => ({ 

    startDownload,

    cancelDownload,          ...prev,           ...prev, 

    installUpdate,

    restartApp,          userConsentGiven: false,          userConsentGiven: false,

    grantConsent,

    denyConsent,          userConsentRequired: false,          userConsentRequired: false,

    clearError,

          currentPhase: 'idle'          currentPhase: 'idle'

    // Configuration

    config,        }));        }));

    updateConfig

  };        break;        break;

}


      case 'cancelled':      case 'cancelled':

        setState(prev => ({         setState(prev => ({ 

          ...prev,           ...prev, 

          downloading: false,          downloading: false,

          currentPhase: 'idle'          currentPhase: 'idle'

        }));        }));

        setDownloadProgress(undefined);        setDownloadProgress(undefined);

        break;        break;



      case 'error':      case 'error':

        setState(prev => ({ ...prev, currentPhase: 'error' }));        setState(prev => ({ ...prev, currentPhase: 'error' }));

        setError(event.error);        setError(event.error);

        onError?.(event.error);        onError?.(event.error);

        break;        break;

    }    }

  }, [config.autoDownload, config.autoRestart, onError, onUpdateAvailable, onUpdateComplete]); // FIX: Korrekte Dependencies für Event Handler  }, [config.autoDownload, config.autoRestart, onError, onUpdateAvailable, onUpdateComplete]); // FIX: Korrekte Dependencies für Event Handler



  /**  /**

   * Setup Event Listeners   * Setup Event Listeners

   */   */

  useEffect(() => {  useEffect(() => {

    if (window.rawalite?.updates) {    if (window.rawalite?.updates) {

      console.log('🔄 [Setup] Subscribing to update events...');      // Subscribe to update events

      // Subscribe to update events      const unsubscribe = window.rawalite.updates.onUpdateEvent(handleUpdateEvent);

      const unsubscribe = window.rawalite.updates.onUpdateEvent(handleUpdateEvent);      eventUnsubscribeRef.current = unsubscribe;

      eventUnsubscribeRef.current = unsubscribe;

      // Load initial configuration and version

      // Load initial configuration and version      const initializeState = async () => {

      const initializeState = async () => {        try {

        try {          const [currentConfig, version] = await Promise.all([

          console.log('🔄 [Setup] Loading initial config and version...');            window.rawalite.updates.getUpdateConfig(),

          const [currentConfig, version] = await Promise.all([            window.rawalite.updates.getCurrentVersion()

            window.rawalite.updates.getUpdateConfig(),          ]);

            window.rawalite.updates.getCurrentVersion()

          ]);          setConfig(currentConfig);

          setCurrentVersion(version);

          console.log('✅ [Setup] Config and version loaded:', { currentConfig, version });        } catch (error) {

          setConfig(currentConfig);          console.error('Failed to initialize update state:', error);

          setCurrentVersion(version);        }

        } catch (error) {      };

          console.error('🚨 [Setup] Failed to initialize update state:', error);

        }      initializeState();

      };

      return () => {

      initializeState();        if (eventUnsubscribeRef.current) {

          eventUnsubscribeRef.current();

      return () => {        }

        console.log('🧹 [Cleanup] Unsubscribing from update events...');      };

        if (eventUnsubscribeRef.current) {    }

          eventUnsubscribeRef.current();  }, [handleUpdateEvent]);

        }

      };  /**

    } else {   * Action Functions - definiert vor den useEffects die sie nutzen

      console.warn('⚠️ [Setup] window.rawalite.updates not available');   */

    }  const checkForUpdates = useCallback(async (): Promise<void> => {

  }, [handleUpdateEvent]);    if (!window.rawalite?.updates) {

      const errorMsg = 'Update API not available';

  /**      console.error('🚨 [Update Check]', errorMsg);

   * Action Functions      throw new Error(errorMsg);

   */    }

  const checkForUpdates = useCallback(async (): Promise<void> => {

    if (!window.rawalite?.updates) {    console.log('🔄 [Update Check] Starting update check...');

      const errorMsg = 'Update API not available';    try {

      console.error('🚨 [Update Check]', errorMsg);      const result = await window.rawalite.updates.checkForUpdates();

      throw new Error(errorMsg);      console.log('✅ [Update Check] Result:', result);

    }    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Update check failed';

    console.log('🔄 [Update Check] Starting update check...');      console.error('🚨 [Update Check] Failed:', errorMessage);

    try {      setError(errorMessage);

      await window.rawalite.updates.checkForUpdates();      throw new Error(errorMessage);

      console.log('✅ [Update Check] Request sent, waiting for events...');    }

    } catch (error) {  }, []);

      const errorMessage = error instanceof Error ? error.message : 'Update check failed';

      console.error('🚨 [Update Check] Failed:', errorMessage);  /**

      setError(errorMessage);   * Auto-check on mount

      throw new Error(errorMessage);   */

    }  useEffect(() => {

  }, []);    if (autoCheckOnMount && window.rawalite?.updates) {

      console.log('🔄 [Auto Check] Starting auto-check on mount...');

  /**      // Delay initial check to allow component to mount

   * Auto-check on mount      const timer = setTimeout(() => {

   */        checkForUpdates().catch(error => {

  useEffect(() => {          console.error('🚨 [Auto Check] Auto-check failed:', error);

    if (autoCheckOnMount && window.rawalite?.updates) {        });

      console.log('🔄 [Auto Check] Starting auto-check on mount...');      }, 1000);

      // Delay initial check to allow component to mount

      const timer = setTimeout(() => {      return () => clearTimeout(timer);

        checkForUpdates().catch(error => {    }

          console.error('🚨 [Auto Check] Auto-check failed:', error);  }, [autoCheckOnMount, checkForUpdates]); // FIX: Füge checkForUpdates dependency hinzu

        });

      }, 1000);  /**

   * Periodic checking

      return () => clearTimeout(timer);   */

    }  useEffect(() => {

  }, [autoCheckOnMount, checkForUpdates]); // FIX: Füge checkForUpdates dependency hinzu    if (checkIntervalMinutes > 0) {

      const interval = setInterval(() => {

  /**        if (!isChecking && !isDownloading && !isInstalling) {

   * Periodic checking          checkForUpdates().catch(error => {

   */            console.error('Periodic check failed:', error);

  useEffect(() => {          });

    if (checkIntervalMinutes > 0) {        }

      const interval = setInterval(() => {      }, checkIntervalMinutes * 60 * 1000);

        if (!isChecking && !isDownloading && !isInstalling) {

          checkForUpdates().catch(error => {      intervalRef.current = interval;

            console.error('Periodic check failed:', error);

          });      return () => {

        }        if (intervalRef.current) {

      }, checkIntervalMinutes * 60 * 1000);          clearInterval(intervalRef.current);

        }

      intervalRef.current = interval;      };

    }

      return () => {  }, [checkIntervalMinutes, isChecking, isDownloading, isInstalling, checkForUpdates]); // FIX: Dependency hinzugefügt

        if (intervalRef.current) {    if (!window.rawalite?.updates) {

          clearInterval(intervalRef.current);      throw new Error('Update API not available');

        }    }

      };

    }    try {

  }, [checkIntervalMinutes, isChecking, isDownloading, isInstalling, checkForUpdates]); // FIX: Dependency hinzugefügt      await window.rawalite.updates.checkForUpdates();

    } catch (error) {

  const startDownload = useCallback(async (): Promise<void> => {      const errorMessage = error instanceof Error ? error.message : 'Update check failed';

    if (!window.rawalite?.updates || !updateInfo) {      setError(errorMessage);

      throw new Error('Update API or update info not available');      throw new Error(errorMessage);

    }    }

  }, []);

    try {

      await window.rawalite.updates.startDownload(updateInfo);  const startDownload = useCallback(async (): Promise<void> => {

    } catch (error) {    if (!window.rawalite?.updates || !updateInfo) {

      const errorMessage = error instanceof Error ? error.message : 'Download failed';      throw new Error('Update API or update info not available');

      setError(errorMessage);    }

      throw new Error(errorMessage);

    }    try {

  }, [updateInfo]);      await window.rawalite.updates.startDownload(updateInfo);

    } catch (error) {

  const cancelDownload = useCallback(async (): Promise<void> => {      const errorMessage = error instanceof Error ? error.message : 'Download failed';

    if (!window.rawalite?.updates) {      setError(errorMessage);

      throw new Error('Update API not available');      throw new Error(errorMessage);

    }    }

  }, [updateInfo]);

    try {

      await window.rawalite.updates.cancelDownload();  const cancelDownload = useCallback(async (): Promise<void> => {

    } catch (error) {    if (!window.rawalite?.updates) {

      console.error('Cancel download failed:', error);      throw new Error('Update API not available');

    }    }

  }, []);

    try {

  const installUpdate = useCallback(async (): Promise<void> => {      await window.rawalite.updates.cancelDownload();

    if (!window.rawalite?.updates || !state.downloadStatus?.filePath) {    } catch (error) {

      throw new Error('Update API not available or no downloaded file');      console.error('Cancel download failed:', error);

    }    }

  }, []);

    try {

      await window.rawalite.updates.installUpdate(state.downloadStatus.filePath);  const installUpdate = useCallback(async (): Promise<void> => {

    } catch (error) {    if (!window.rawalite?.updates || !state.downloadStatus?.filePath) {

      const errorMessage = error instanceof Error ? error.message : 'Installation failed';      throw new Error('Update API not available or no downloaded file');

      setError(errorMessage);    }

      throw new Error(errorMessage);

    }    try {

  }, [state.downloadStatus?.filePath]);      await window.rawalite.updates.installUpdate(state.downloadStatus.filePath);

    } catch (error) {

  const restartApp = useCallback(async (): Promise<void> => {      const errorMessage = error instanceof Error ? error.message : 'Installation failed';

    if (!window.rawalite?.updates) {      setError(errorMessage);

      throw new Error('Update API not available');      throw new Error(errorMessage);

    }    }

  }, [state.downloadStatus?.filePath]);

    try {

      await window.rawalite.updates.restartApp();  const restartApp = useCallback(async (): Promise<void> => {

    } catch (error) {    if (!window.rawalite?.updates) {

      console.error('Restart failed:', error);      throw new Error('Update API not available');

    }    }

  }, []);

    try {

  const grantConsent = useCallback((): void => {      await window.rawalite.updates.restartApp();

    setState(prev => ({     } catch (error) {

      ...prev,       console.error('Restart failed:', error);

      userConsentGiven: true,    }

      userConsentRequired: false  }, []);

    }));

      const grantConsent = useCallback((): void => {

    // Start download if update info is available    setState(prev => ({ 

    if (updateInfo) {      ...prev, 

      startDownload().catch(error => {      userConsentGiven: true,

        console.error('Auto-start download failed:', error);      userConsentRequired: false

      });    }));

    }    

  }, [updateInfo, startDownload]);    // Start download if update info is available

    if (updateInfo) {

  const denyConsent = useCallback((): void => {      startDownload().catch(error => {

    setState(prev => ({         console.error('Auto-start download failed:', error);

      ...prev,       });

      userConsentGiven: false,    }

      userConsentRequired: false,  }, [updateInfo, startDownload]);

      currentPhase: 'idle'

    }));  const denyConsent = useCallback((): void => {

  }, []);    setState(prev => ({ 

      ...prev, 

  const clearError = useCallback((): void => {      userConsentGiven: false,

    setError(undefined);      userConsentRequired: false,

    setState(prev => ({ ...prev, currentPhase: 'idle' }));      currentPhase: 'idle'

  }, []);    }));

  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<UpdateConfig>): Promise<void> => {

    if (!window.rawalite?.updates) {  const clearError = useCallback((): void => {

      throw new Error('Update API not available');    setError(undefined);

    }    setState(prev => ({ ...prev, currentPhase: 'idle' }));

  }, []);

    try {

      await window.rawalite.updates.setUpdateConfig(newConfig);  const updateConfig = useCallback(async (newConfig: Partial<UpdateConfig>): Promise<void> => {

      setConfig(prev => ({ ...prev, ...newConfig }));    if (!window.rawalite?.updates) {

    } catch (error) {      throw new Error('Update API not available');

      console.error('Update config failed:', error);    }

      throw error;

    }    try {

  }, []);      await window.rawalite.updates.setUpdateConfig(newConfig);

      setConfig(prev => ({ ...prev, ...newConfig }));

  return {    } catch (error) {

    // State      console.error('Update config failed:', error);

    state,      throw error;

    isChecking,    }

    isDownloading,  }, []);

    isInstalling,

    hasUpdate,  return {

    currentVersion,    // State

    latestVersion,    state,

    updateInfo,    isChecking,

    downloadProgress,    isDownloading,

    error,    isInstalling,

    hasUpdate,

    // Actions    currentVersion,

    checkForUpdates,    latestVersion,

    startDownload,    updateInfo,

    cancelDownload,    downloadProgress,

    installUpdate,    error,

    restartApp,

    grantConsent,    // Actions

    denyConsent,    checkForUpdates,

    clearError,    startDownload,

    cancelDownload,

    // Configuration    installUpdate,

    config,    restartApp,

    updateConfig    grantConsent,

  };    denyConsent,

}    clearError,

    // Configuration
    config,
    updateConfig
  };
}