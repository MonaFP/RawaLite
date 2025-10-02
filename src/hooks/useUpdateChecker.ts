/**/**/**

 * useUpdateChecker Hook für RawaLite Update System

 *  * useUpdateChecker Hook für RawaLite Update System * useUpdateChecker Hook für RawaLite Update System

 * React Hook für Update-Management mit automatischem State Management,

 * Event Handling und User Interface Integration. *  * 

 */

 * React Hook für Update-Management mit automatischem State Management, * React Hook für Update-Management mit automatischem State Management,

import { useState, useEffect, useCallback, useRef } from 'react';

import type { * Event Handling und User Interface Integration. * Event Handling und User Interface Integration.

  UpdateCheckResult,

  UpdateInfo, */ */

  UpdateState,

  UpdateEvent,

  UpdateConfig,

  DownloadProgressimport { useState, useEffect, useCallback, useRef } from 'react';import { useState, useEffect, useCallback, useRef } from 'react';

} from '../types/update.types';

import type {import type {

interface UseUpdateCheckerOptions {

  autoCheckOnMount?: boolean;  UpdateCheckResult,  UpdateCheckResult,

  checkIntervalMinutes?: number;

  onUpdateAvailable?: (updateInfo: UpdateInfo) => void;  UpdateInfo,  UpdateInfo,

  onUpdateComplete?: () => void;

  onError?: (error: string) => void;  UpdateState,  UpdateState,

}

  UpdateEvent,  UpdateEvent,

interface UseUpdateCheckerReturn {

  // State  UpdateConfig,  UpdateConfig,

  state: UpdateState;

  isChecking: boolean;  DownloadProgress  DownloadProgress

  isDownloading: boolean;

  isInstalling: boolean;} from '../types/update.types';} from '../types/update.types';

  hasUpdate: boolean;

  currentVersion: string;

  latestVersion?: string;

  updateInfo?: UpdateInfo;interface UseUpdateCheckerOptions {interface UseUpdateCheckerOptions {

  downloadProgress?: DownloadProgress;

  error?: string;  autoCheckOnMount?: boolean;  autoCheckOnMount?: boolean;



  // Actions  checkIntervalMinutes?: number;  checkIntervalMinutes?: number;

  checkForUpdates: () => Promise<void>;

  startDownload: () => Promise<void>;  onUpdateAvailable?: (updateInfo: UpdateInfo) => void;  onUpdateAvailable?: (updateInfo: UpdateInfo) => void;

  cancelDownload: () => Promise<void>;

  installUpdate: () => Promise<void>;  onUpdateComplete?: () => void;  onUpdateComplete?: () => void;

  restartApp: () => Promise<void>;

  grantConsent: () => void;  onError?: (error: string) => void;  onError?: (error: string) => void;

  denyConsent: () => void;

  clearError: () => void;}}



  // Configuration

  config: UpdateConfig;

  updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;interface UseUpdateCheckerReturn {interface UseUpdateCheckerReturn {

}

  // State  // State

/**

 * Custom Hook für Update Management  state: UpdateState;  state: UpdateState;

 */

export function useUpdateChecker(options: UseUpdateCheckerOptions = {}): UseUpdateCheckerReturn {  isChecking: boolean;  isChecking: boolean;

  const {

    autoCheckOnMount = true,  isDownloading: boolean;  isDownloading: boolean;

    checkIntervalMinutes = 60,

    onUpdateAvailable,  isInstalling: boolean;  isInstalling: boolean;

    onUpdateComplete,

    onError  hasUpdate: boolean;  hasUpdate: boolean;

  } = options;

  currentVersion: string;  currentVersion: string;

  // State Management

  const [state, setState] = useState<UpdateState>({  latestVersion?: string;  latestVersion?: string;

    currentPhase: 'idle',

    checking: false,  updateInfo?: UpdateInfo;  updateInfo?: UpdateInfo;

    downloading: false,

    installing: false,  downloadProgress?: DownloadProgress;  downloadProgress?: DownloadProgress;

    userConsentRequired: false,

    userConsentGiven: false,  error?: string;  error?: string;

    retryCount: 0,

    maxRetries: 3

  });

  // Actions  // Actions

  const [currentVersion, setCurrentVersion] = useState<string>('0.0.0');

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();  checkForUpdates: () => Promise<void>;  checkForUpdates: () => Promise<void>;

  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();

  const [config, setConfig] = useState<UpdateConfig>({  startDownload: () => Promise<void>;  startDownload: () => Promise<void>;

    autoCheckOnStartup: true,

    checkIntervalHours: 24,  cancelDownload: () => Promise<void>;  cancelDownload: () => Promise<void>;

    autoDownload: false,

    silentInstall: true,  installUpdate: () => Promise<void>;  installUpdate: () => Promise<void>;

    autoRestart: false,

    maxRetries: 3,  restartApp: () => Promise<void>;  restartApp: () => Promise<void>;

    retryDelayMs: 5000,

    includePreReleases: false,  grantConsent: () => void;  grantConsent: () => void;

    skipVersions: []

  });  denyConsent: () => void;  denyConsent: () => void;

  const [error, setError] = useState<string>();

  clearError: () => void;  clearError: () => void;

  // A3: mountedRef Pattern - verhindert setState nach Component Unmount

  const mountedRef = useRef(true);

  useEffect(() => {

    return () => {  // Configuration  // Configuration

      mountedRef.current = false;

    };  config: UpdateConfig;  config: UpdateConfig;

  }, []);

  updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;  updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;

  // Refs für cleanup und stable callback references

  const eventUnsubscribeRef = useRef<(() => void) | null>(null);}}

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const callbacksRef = useRef({ onUpdateAvailable, onUpdateComplete, onError });



  // Update callbacks ref when options change/**/**

  useEffect(() => {

    callbacksRef.current = { onUpdateAvailable, onUpdateComplete, onError }; * Custom Hook für Update Management * Custom Hook für Update Management

  }, [onUpdateAvailable, onUpdateComplete, onError]);

 */ */

  // Derived state

  const isChecking = state.checking;export function useUpdateChecker(options: UseUpdateCheckerOptions = {}): UseUpdateCheckerReturn {export function useUpdateChecker(options: UseUpdateCheckerOptions = {}): UseUpdateCheckerReturn {

  const isDownloading = state.downloading;

  const isInstalling = state.installing;  const {  const {

  const hasUpdate = Boolean(state.checkResult?.hasUpdate);

  const latestVersion = state.checkResult?.latestVersion;    autoCheckOnMount = true,    autoCheckOnMount = true,



  /**    checkIntervalMinutes = 60,    checkIntervalMinutes = 60,

   * Event Handler für Update Events - Stable reference mit useCallback

   */    onUpdateAvailable,    onUpdateAvailable,

  const handleUpdateEvent = useCallback((event: UpdateEvent) => {

    if (!mountedRef.current) return; // A3: Guard gegen setState nach Unmount    onUpdateComplete,    onUpdateComplete,

    console.log('🔄 [Update Event]:', event.type, event);

    onError    onError

    const callbacks = callbacksRef.current; // Get current callbacks

  } = options;  } = options;

    switch (event.type) {

      case 'check-started':

        setState(prev => ({ 

          ...prev,   // State Management  // State Management

          checking: true, 

          currentPhase: 'checking'   const [state, setState] = useState<UpdateState>({  const [state, setState] = useState<UpdateState>({

        }));

        setError(undefined);    currentPhase: 'idle',    currentPhase: 'idle',

        break;

    checking: false,    checking: false,

      case 'check-completed':

        setState(prev => ({     downloading: false,    downloading: false,

          ...prev, 

          checking: false,     installing: false,    installing: false,

          checkResult: event.result,

          currentPhase: event.result.hasUpdate ? 'update-available' : 'completed'    userConsentRequired: false,    userConsentRequired: false,

        }));

        break;    userConsentGiven: false,    userConsentGiven: false,



      case 'check-failed':    retryCount: 0,    retryCount: 0,

        setState(prev => ({ 

          ...prev,     maxRetries: 3    maxRetries: 3

          checking: false, 

          currentPhase: 'error'   });  });

        }));

        setError(event.error);

        callbacks.onError?.(event.error);

        break;  const [currentVersion, setCurrentVersion] = useState<string>('0.0.0');  const [currentVersion, setCurrentVersion] = useState<string>('0.0.0');



      case 'update-available':  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();

        console.log('✅ [Update Event] Update available, setting updateInfo:', event.updateInfo);

        setUpdateInfo(event.updateInfo);  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>();

        setState(prev => ({ 

          ...prev,   const [config, setConfig] = useState<UpdateConfig>({  const [config, setConfig] = useState<UpdateConfig>({

          currentPhase: 'user-consent'

        }));    autoCheckOnStartup: true,    autoCheckOnStartup: true,

        // Trigger callback immediately when update is available

        callbacks.onUpdateAvailable?.(event.updateInfo);    checkIntervalHours: 24,    checkIntervalHours: 24,

        break;

    autoDownload: false,    autoDownload: false,

      case 'user-consent-required':

        setState(prev => ({     silentInstall: true,    silentInstall: true,

          ...prev, 

          userConsentRequired: true,    autoRestart: false,    autoRestart: false,

          currentPhase: 'user-consent'

        }));    maxRetries: 3,    maxRetries: 3,

        break;

    retryDelayMs: 5000,    retryDelayMs: 5000,

      case 'download-started':

        setState(prev => ({     includePreReleases: false,    includePreReleases: false,

          ...prev, 

          downloading: true,     skipVersions: []    skipVersions: []

          currentPhase: 'downloading',

          userConsentGiven: true,  });  });

          userConsentRequired: false

        }));  const [error, setError] = useState<string>();  const [error, setError] = useState<string>();

        setError(undefined);

        break;



      case 'download-progress':  // A3: mountedRef Pattern - verhindert setState nach Component Unmount  // A3: mountedRef Pattern - verhindert setState nach Component Unmount

        setDownloadProgress(event.progress);

        break;  const mountedRef = useRef(true);  const mountedRef = useRef(true);



      case 'download-completed':  useEffect(() => {  useEffect(() => {

        setState(prev => ({ 

          ...prev,     return () => {    return () => {

          downloading: false,

          currentPhase: 'completed',      mountedRef.current = false;      mountedRef.current = false;

          downloadStatus: { status: 'completed', filePath: event.filePath }

        }));    };    };

        setDownloadProgress(undefined);

        break;  }, []);  }, []);



      case 'download-failed':

        setState(prev => ({ 

          ...prev,   // Refs für cleanup  // Refs für cleanup

          downloading: false,

          currentPhase: 'error'  const eventUnsubscribeRef = useRef<(() => void) | null>(null);  const eventUnsubscribeRef = useRef<(() => void) | null>(null);

        }));

        setError(event.error);  const intervalRef = useRef<NodeJS.Timeout | null>(null);  const intervalRef = useRef<NodeJS.Timeout | null>(null);

        setDownloadProgress(undefined);

        callbacks.onError?.(event.error);

        break;

  // Derived state  // Derived state

      case 'installation-started':

        setState(prev => ({   const isChecking = state.checking;  const isChecking = state.checking;

          ...prev, 

          installing: true,  const isDownloading = state.downloading;  const isDownloading = state.downloading;

          currentPhase: 'installing'

        }));  const isInstalling = state.installing;  const isInstalling = state.installing;

        break;

  const hasUpdate = Boolean(state.checkResult?.hasUpdate);  const hasUpdate = Boolean(state.checkResult?.hasUpdate);

      case 'installation-completed':

        setState(prev => ({   const latestVersion = state.checkResult?.latestVersion;  const latestVersion = state.checkResult?.latestVersion;

          ...prev, 

          installing: false,

          currentPhase: 'completed'

        }));  /**  /**

        callbacks.onUpdateComplete?.();

        break;   * Event Handler für Update Events   * Event Handler für Update Events



      case 'installation-failed':   */   */

        setState(prev => ({ 

          ...prev,   const handleUpdateEvent = useCallback((event: UpdateEvent) => {  const handleUpdateEvent = useCallback((event: UpdateEvent) => {

          installing: false,

          currentPhase: 'error'    if (!mountedRef.current) return; // A3: Guard gegen setState nach Unmount    if (!mountedRef.current) return; // A3: Guard gegen setState nach Unmount

        }));

        setError(event.error);    console.log('🔄 [Update Event]:', event.type, event);    console.log('🔄 [Update Event]:', event.type, event);

        callbacks.onError?.(event.error);

        break;



      case 'restart-required':    switch (event.type) {    switch (event.type) {

        setState(prev => ({ ...prev, currentPhase: 'restart-required' }));

        break;      case 'check-started':      case 'check-started':



      case 'user-consent-given':        // A4: Event Handler Batching - gruppiere State Updates        // A4: Event Handler Batching - gruppiere State Updates

        setState(prev => ({ 

          ...prev,         setState(prev => ({         setState(prev => ({ 

          userConsentGiven: true,

          userConsentRequired: false,          ...prev,           ...prev, 

          currentPhase: 'idle'

        }));          checking: true,           checking: true, 

        break;

          currentPhase: 'checking'           currentPhase: 'checking' 

      case 'user-consent-denied':

        setState(prev => ({         }));        }));

          ...prev, 

          userConsentGiven: false,        setError(undefined);        setError(undefined);

          userConsentRequired: false,

          currentPhase: 'idle'        break;        break;

        }));

        break;



      case 'cancelled':      case 'check-completed':      case 'check-completed':

        setState(prev => ({ 

          ...prev,         setState(prev => ({         setState(prev => ({ 

          downloading: false,

          currentPhase: 'idle'          ...prev,           ...prev, 

        }));

        setDownloadProgress(undefined);          checking: false,           checking: false, 

        break;

          checkResult: event.result,          checkResult: event.result,

      case 'error':

        setState(prev => ({ ...prev, currentPhase: 'error' }));          currentPhase: event.result.hasUpdate ? 'update-available' : 'completed'          currentPhase: event.result.hasUpdate ? 'update-available' : 'completed'

        setError(event.error);

        callbacks.onError?.(event.error);        }));        }));

        break;

    }        break;        break;

  }, []); // Empty dependencies - stable reference mit callbacksRef pattern



  /**

   * Setup Event Listeners      case 'check-failed':      case 'check-failed':

   */

  useEffect(() => {        // A4: Batch error state + phase update        // A4: Batch error state + phase update

    if (window.rawalite?.updates) {

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