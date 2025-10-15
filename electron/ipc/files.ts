/**
 * Files IPC Handlers
 * 
 * File operations for image handling and file management.
 * Handles image saving, deletion, and reading as base64.
 * 
 * @since v1.0.42.5
 */

import { ipcMain, app } from 'electron';
import { join, extname, basename } from 'path';
import * as fs from 'node:fs/promises';

/**
 * Register all file IPC handlers
 */
export function registerFileHandlers(): void {
  console.log('🔌 [FILES] Registering file IPC handlers...');

  /**
   * Save image data to file system
   */
  ipcMain.handle('files:saveImage', async (event, imageData: string, filename: string, subDir?: string) => {
    try {
      console.log(`💾 Saving image: ${filename} to ${subDir || 'root'}`);
      
      const userDataPath = app.getPath('userData');
      const uploadsDir = join(userDataPath, 'assets', 'uploads', subDir || '');
      
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const timestamp = Date.now();
      const ext = extname(filename);
      const baseName = basename(filename, ext);
      const uniqueFilename = `${baseName}_${timestamp}${ext}`;
      
      const filePath = join(uploadsDir, uniqueFilename);
      
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      await fs.writeFile(filePath, buffer);
      
      console.log(`✅ Image saved successfully: ${filePath}`);
      return { success: true, filePath };
      
    } catch (error) {
      console.error('❌ Failed to save image:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown file save error' };
    }
  });

  /**
   * Delete file from file system
   */
  ipcMain.handle('files:deleteFile', async (event, filePath: string) => {
    try {
      console.log(`🗑️ Deleting file: ${filePath}`);
      
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }
      
      await fs.unlink(filePath);
      
      console.log(`✅ File deleted successfully: ${filePath}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown file deletion error' };
    }
  });

  /**
   * Read image file as base64 data
   */
  ipcMain.handle('files:readImageAsBase64', async (event, filePath: string) => {
    try {
      console.log(`📷 Reading image as base64: ${filePath}`);
      
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }
      
      const buffer = await fs.readFile(filePath);
      
      const ext = extname(filePath).toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      };
      const mimeType = mimeTypeMap[ext] || 'image/png';
      
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
      
      console.log(`✅ Image read successfully: ${filePath} (${Math.round(buffer.length/1024)}KB)`);
      return { success: true, base64Data, mimeType, fileSize: buffer.length };
      
    } catch (error) {
      console.error('❌ Failed to read image:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown file read error' };
    }
  });

  console.log('✅ [FILES] File IPC handlers registered successfully');
}