/**
 * SidebarUpdateWidget Component für RawaLite
 * 
 * Smart Update Widget für die Sidebar Navigation.
 * Ersetzt statischen Versions-Text durch dynamisches Update-System.
 * 
 * Features:
 * - Dynamic version loading via IPC
 * - Auto-check für Updates
 * - Visual state management (checking, available, up-to-date, error)
 * - Expandable layout bei verfügbaren Updates
 * - Integration mit bestehendem UpdateManagerService
 * 
 * @version 1.0.33+
 * @since Auto-Update Notifications Implementation
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { 
  SidebarUpdateWidgetProps, 
  UpdateWidgetState, 
  AutoUpdateStatus 
} from '../types/auto-update.types';
import { AutoUpdateUtils } from '../types/auto-update.types';

export const SidebarUpdateWidget: React.FC<SidebarUpdateWidgetProps> = ({
  onUpdateClick,
  checkOnMount = false,
  position = 'sidebar',
  className = '',
  disabled = false
}) => {
  // Widget State
  const [state, setState] = useState<UpdateWidgetState>({
    currentVersion: '1.0.33', // Fallback
    status: 'idle',
    updateInfo: undefined,
    lastCheck: undefined,
    error: undefined
  });

  // Loading flags
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoChecked, setHasAutoChecked] = useState(false);

  /**
   * Load current version from Main process
   */
  const loadCurrentVersion = useCallback(async () => {
    try {
      const version = await window.rawalite.updates.getCurrentVersion();
      setState(prev => ({
        ...prev,
        currentVersion: version || '1.0.33'
      }));
    } catch (error) {
      console.warn('SidebarUpdateWidget: Failed to load current version:', error);
      // Keep fallback version, don't show error for this
    }
  }, []);

  /**
   * Perform update check
   */
  const checkForUpdates = useCallback(async () => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      setState(prev => ({ ...prev, status: 'checking', error: undefined }));

      // Use existing UpdateManagerService via IPC
      const result = await window.rawalite.updates.checkForUpdates();
      
      if (result.hasUpdate) {
        setState(prev => ({
          ...prev,
          status: 'available',
          updateInfo: result.latestRelease ? {
            version: result.latestVersion || '1.0.34',
            name: result.latestRelease.name || `RawaLite v${result.latestVersion || '1.0.34'}`,
            releaseNotes: result.latestRelease.body || '',
            publishedAt: result.latestRelease.published_at || new Date().toISOString(),
            downloadUrl: result.latestRelease.assets?.[0]?.browser_download_url || '',
            assetName: result.latestRelease.assets?.[0]?.name || 'RawaLite.Setup.exe',
            fileSize: result.latestRelease.assets?.[0]?.size || 0,
            isPrerelease: result.latestRelease.prerelease || false
          } : undefined,
          lastCheck: new Date()
        }));
      } else {
        setState(prev => ({
          ...prev,
          status: 'up-to-date',
          updateInfo: undefined,
          lastCheck: new Date()
        }));
      }
    } catch (error) {
      console.error('SidebarUpdateWidget: Update check failed:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Update-Prüfung fehlgeschlagen'
      }));
    } finally {
      setIsLoading(false);
      setHasAutoChecked(true);
    }
  }, [disabled, isLoading]);

  /**
   * Handle widget click
   */
  const handleClick = useCallback(() => {
    if (disabled) return;

    if (state.status === 'available' && onUpdateClick) {
      // Open Update Manager for available updates
      onUpdateClick();
    } else if (state.status === 'idle' || state.status === 'up-to-date' || state.status === 'error') {
      // Manual check for updates
      checkForUpdates();
    }
    // Don't handle clicks during checking
  }, [disabled, state.status, onUpdateClick, checkForUpdates]);

  /**
   * Initialize widget
   */
  useEffect(() => {
    loadCurrentVersion();
    
    if (checkOnMount && !hasAutoChecked) {
      // Delay auto-check to avoid blocking UI
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [loadCurrentVersion, checkForUpdates, checkOnMount, hasAutoChecked]);

  // Get visual state for current status
  const visualState = AutoUpdateUtils.getVisualState(state.status, state.currentVersion);
  const shouldExpand = AutoUpdateUtils.shouldExpand(state.status);
  const lastCheckText = AutoUpdateUtils.formatLastCheck(state.lastCheck);

  // CSS classes
  const widgetClasses = [
    'sidebar-update-widget',
    `widget-${position}`,
    shouldExpand ? 'widget-expanded' : 'widget-compact',
    disabled ? 'widget-disabled' : 'widget-interactive',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={widgetClasses}
      onClick={handleClick}
      style={{
        // Base styling
        padding: shouldExpand ? '16px 8px' : '12px 8px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderRadius: shouldExpand ? '8px' : '0',
        background: shouldExpand ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
        border: shouldExpand ? '2px solid var(--accent)' : 'none',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'center',
        
        // Hover effects
        ...(disabled ? {} : {
          ':hover': {
            background: shouldExpand ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)'
          }
        })
      }}
      title={
        state.status === 'available' 
          ? `Update verfügbar: ${state.updateInfo?.version} - Klicken zum Öffnen`
          : state.status === 'error'
          ? `Fehler: ${state.error} - Klicken zum Wiederholen`
          : state.status === 'checking'
          ? 'Update-Prüfung läuft...'
          : `Aktuelle Version: ${state.currentVersion} - Klicken zum Prüfen`
      }
    >
      {/* Icon and Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: shouldExpand ? '8px' : '0'
      }}>
        <span 
          style={{ 
            fontSize: shouldExpand ? '20px' : '16px',
            transition: 'font-size 0.3s ease'
          }}
        >
          {visualState.icon}
        </span>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}>
          <div style={{
            fontSize: shouldExpand ? '14px' : '0.7rem',
            fontWeight: shouldExpand ? '600' : '500',
            color: visualState.color,
            lineHeight: '1.2',
            transition: 'all 0.3s ease'
          }}>
            {visualState.text}
          </div>
          
          {!shouldExpand && (
            <div style={{
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.3)',
              marginTop: '2px'
            }}>
              {state.lastCheck ? `${lastCheckText}` : 'Noch nie geprüft'}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Information */}
      {shouldExpand && state.status === 'available' && state.updateInfo && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.2)',
          paddingTop: '8px',
          marginTop: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '4px'
          }}>
            Version {state.updateInfo.version} verfügbar
          </div>
          
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            fontStyle: 'italic'
          }}>
            Klicken zum Installieren
          </div>
        </div>
      )}

      {/* Error Information */}
      {state.status === 'error' && (
        <div style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.6)',
          marginTop: '4px',
          fontStyle: 'italic'
        }}>
          Klicken zum Wiederholen
        </div>
      )}

      {/* CSS-in-JS Styles */}
      <style>{`
        .sidebar-update-widget {
          user-select: none;
          -webkit-user-select: none;
        }
        
        .widget-interactive:hover {
          background: ${shouldExpand ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)'} !important;
        }
        
        .widget-disabled {
          opacity: 0.6;
          cursor: not-allowed !important;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .widget-checking .widget-icon {
          animation: spin 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SidebarUpdateWidget;