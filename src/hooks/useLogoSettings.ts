import { useState, useCallback } from 'react';
import { useUnifiedSettings } from './useUnifiedSettings';
import { SettingsAdapter } from '../adapters/SettingsAdapter';
import type { LogoSettings } from '../lib/settings';

interface LogoUploadOptions {
  file: File;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface LogoProcessResult {
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: {
    fileName: string;
    format: 'svg' | 'png' | 'jpg';
    width?: number;
    height?: number;
    fileSize: number;
  };
}

const settingsAdapter = new SettingsAdapter();

export function useLogoSettings() {
  const { settings } = useUnifiedSettings();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const logoSettings = settings?.logoSettings || {};

  const uploadLogo = useCallback(async (options: LogoUploadOptions): Promise<LogoProcessResult> => {
    console.log('🖼️ [Logo] Starting upload:', options.file.name, options.file.type, options.file.size);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Verwende die neue IPC-basierte Logo API
      if (!window.rawalite?.logo) {
        throw new Error('Logo API not available');
      }

      const result = await window.rawalite.logo.upload({
        buffer: await options.file.arrayBuffer(),
        fileName: options.file.name,
        mimeType: options.file.type,
        maxWidth: options.maxWidth || 800,
        maxHeight: options.maxHeight || 600,
        quality: options.quality || 0.85
      });

      setUploadProgress(50);

      if (result.success && result.metadata) {
        // Aktualisiere Settings mit neuen Logo-Metadaten
        const newLogoSettings: LogoSettings = {
          filePath: result.filePath,
          fileName: result.metadata.fileName,
          format: result.metadata.format,
          width: result.metadata.width,
          height: result.metadata.height,
          fileSize: result.metadata.fileSize,
          updatedAt: new Date().toISOString()
        };

        console.log('💾 [Logo] Saving metadata to settings:', newLogoSettings);

        // Update Settings direkt über den SettingsAdapter
        await settingsAdapter.updateLogoSettings(newLogoSettings);

        setUploadProgress(100);
        console.log('✅ [Logo] Upload completed successfully');
        return result;
      } else {
        throw new Error(result.error || 'Logo upload failed');
      }
    } catch (error) {
      console.error('❌ [Logo] Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const getLogoUrl = useCallback(async (): Promise<string | null> => {
    if (!logoSettings.filePath) {
      return null;
    }

    try {
      if (!window.rawalite?.logo) {
        throw new Error('Logo API not available');
      }

      const url = await window.rawalite.logo.getUrl(logoSettings.filePath);
      return url;
    } catch (error) {
      console.error('❌ [Logo] Failed to get URL:', error);
      return null;
    }
  }, [logoSettings.filePath]);

  const removeLogo = useCallback(async (): Promise<boolean> => {
    console.log('🗑️ [Logo] Removing logo...');

    try {
      // Lösche Datei über IPC
      if (logoSettings.filePath && window.rawalite?.logo) {
        const deleted = await window.rawalite.logo.delete(logoSettings.filePath);
        if (!deleted) {
          console.warn('⚠️ [Logo] File deletion failed, but continuing with settings cleanup');
        }
      }

      // Lösche Settings
      await settingsAdapter.updateLogoSettings({});

      console.log('✅ [Logo] Logo removed successfully');
      return true;
    } catch (error) {
      console.error('❌ [Logo] Failed to remove logo:', error);
      return false;
    }
  }, [logoSettings.filePath]);

  const getLogoForPdf = useCallback(async (): Promise<string | null> => {
    if (!logoSettings.filePath) {
      return null;
    }

    try {
      // Für PDFs: Base64-encoded Daten holen
      if (!window.rawalite?.logo) {
        throw new Error('Logo API not available');
      }

      const logoData = await window.rawalite.logo.get(logoSettings.filePath);
      if (logoData) {
        const mimeType = logoSettings.format === 'svg' 
          ? 'image/svg+xml' 
          : `image/${logoSettings.format}`;
        return `data:${mimeType};base64,${logoData}`;
      }
      return null;
    } catch (error) {
      console.error('❌ [Logo] Failed to get logo for PDF:', error);
      return null;
    }
  }, [logoSettings]);

  return {
    logoSettings,
    isUploading,
    uploadProgress,
    uploadLogo,
    getLogoUrl,
    removeLogo,
    getLogoForPdf,
    hasLogo: !!logoSettings.filePath
  };
}