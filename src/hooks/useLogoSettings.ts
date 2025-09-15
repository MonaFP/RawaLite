import { useState, useCallback, useEffect } from 'react';
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
    format: 'svg' | 'png' | 'jpg' | 'jpeg';
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const logoSettings = settings?.designSettings?.logoSettings || {};

  // Logo-URL laden wenn Logo-Settings sich ändern
  useEffect(() => {
    async function loadLogoUrl() {
      if (logoSettings.filePath && window.rawalite?.logo) {
        try {
          const url = await window.rawalite.logo.getUrl(logoSettings.filePath);
          setLogoUrl(url);
        } catch (error) {
          console.warn('Error loading logo URL:', error);
          setLogoUrl(null);
        }
      } else {
        setLogoUrl(null);
      }
    }

    loadLogoUrl();
  }, [logoSettings.filePath]);

  const uploadLogo = useCallback(async (options: LogoUploadOptions): Promise<LogoProcessResult> => {
    console.log('🖼️ [Logo] Starting upload:', options.file.name, options.file.type, options.file.size);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Prüfe ob Logo-API verfügbar ist
      if (!window.rawalite?.logo) {
        console.warn('Logo API not available - using fallback');
        // Fallback: Base64-Konvertierung für Storage in SQLite
        return await uploadLogoFallback(options);
      }

      setUploadProgress(25);

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
          format: result.metadata.format as 'svg' | 'png' | 'jpg' | 'jpeg',
          width: result.metadata.width,
          height: result.metadata.height,
          fileSize: result.metadata.fileSize,
          uploadedAt: new Date().toISOString()
        };

        console.log('💾 [Logo] Saving metadata to settings:', newLogoSettings);

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

  const uploadLogoFallback = useCallback(async (options: LogoUploadOptions): Promise<LogoProcessResult> => {
    try {
      setUploadProgress(25);

      // Base64-Konvertierung
      const base64Data = await fileToBase64(options.file);
      
      setUploadProgress(50);

      // Bildmetadaten extrahieren (falls möglich)
      const metadata = await extractImageMetadata(options.file);

      setUploadProgress(75);

      const newLogoSettings: LogoSettings = {
        fileName: options.file.name,
        format: getFileFormat(options.file.type),
        width: metadata.width,
        height: metadata.height,
        fileSize: options.file.size,
        base64Data,
        uploadedAt: new Date().toISOString()
      };

      await settingsAdapter.updateLogoSettings(newLogoSettings);

      setUploadProgress(100);
      console.log('✅ [Logo] Fallback upload completed successfully');

      return {
        success: true,
        metadata: {
          fileName: newLogoSettings.fileName!,
          format: newLogoSettings.format!,
          width: newLogoSettings.width,
          height: newLogoSettings.height,
          fileSize: newLogoSettings.fileSize!
        }
      };
    } catch (error) {
      console.error('❌ [Logo] Fallback upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  const getLogoUrl = useCallback(async (): Promise<string | null> => {
    // Verwende bereits geladene URL falls verfügbar
    if (logoUrl) {
      return logoUrl;
    }

    if (!logoSettings.filePath && !logoSettings.base64Data) {
      return null;
    }

    try {
      // IPC-basiert
      if (logoSettings.filePath && window.rawalite?.logo) {
        const url = await window.rawalite.logo.getUrl(logoSettings.filePath);
        setLogoUrl(url);
        return url;
      }

      // Fallback: Base64-Data direkt verwenden
      if (logoSettings.base64Data && logoSettings.format) {
        const mimeType = logoSettings.format === 'svg' 
          ? 'image/svg+xml' 
          : `image/${logoSettings.format}`;
        const dataUrl = `data:${mimeType};base64,${logoSettings.base64Data}`;
        setLogoUrl(dataUrl);
        return dataUrl;
      }

      return null;
    } catch (error) {
      console.error('❌ [Logo] Failed to get URL:', error);
      return null;
    }
  }, [logoSettings, logoUrl]);

  const removeLogo = useCallback(async (): Promise<boolean> => {
    console.log('🗑️ [Logo] Removing logo...');

    try {
      // Lösche Datei über IPC falls vorhanden
      if (logoSettings.filePath && window.rawalite?.logo) {
        try {
          const deleted = await window.rawalite.logo.delete(logoSettings.filePath);
          if (!deleted) {
            console.warn('⚠️ [Logo] File deletion failed, but continuing with settings cleanup');
          }
        } catch (deleteError) {
          console.warn('⚠️ [Logo] File deletion error:', deleteError);
        }
      }

      // Lösche Settings (sowohl für IPC als auch Fallback)
      await settingsAdapter.updateLogoSettings({});

      // Reset lokaler State
      setLogoUrl(null);

      console.log('✅ [Logo] Logo removed successfully');
      return true;
    } catch (error) {
      console.error('❌ [Logo] Failed to remove logo:', error);
      return false;
    }
  }, [logoSettings.filePath]);

  const getLogoForPdf = useCallback(async (): Promise<string | null> => {
    if (!logoSettings.filePath && !logoSettings.base64Data) {
      return null;
    }

    try {
      // IPC-basiert: Base64-Daten holen
      if (logoSettings.filePath && window.rawalite?.logo) {
        const logoData = await window.rawalite.logo.get(logoSettings.filePath);
        if (logoData) {
          const mimeType = logoSettings.format === 'svg' 
            ? 'image/svg+xml' 
            : `image/${logoSettings.format}`;
          return `data:${mimeType};base64,${logoData}`;
        }
      }

      // Fallback: Base64-Data direkt verwenden
      if (logoSettings.base64Data && logoSettings.format) {
        const mimeType = logoSettings.format === 'svg' 
          ? 'image/svg+xml' 
          : `image/${logoSettings.format}`;
        return `data:${mimeType};base64,${logoSettings.base64Data}`;
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
    logoUrl,
    uploadLogo,
    getLogoUrl,
    removeLogo,
    getLogoForPdf,
    hasLogo: !!(logoSettings.filePath || logoSettings.base64Data)
  };
}

// Helper Functions

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/...;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractImageMetadata(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({});
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => {
      resolve({});
    };
    img.src = URL.createObjectURL(file);
  });
}

function getFileFormat(mimeType: string): 'svg' | 'png' | 'jpg' | 'jpeg' {
  switch (mimeType.toLowerCase()) {
    case 'image/svg+xml':
      return 'svg';
    case 'image/png':
      return 'png';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpeg';
    default:
      return 'png'; // fallback
  }
}