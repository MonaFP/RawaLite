/**
 * Update Manager Page für RawaLite
 * 
 * Separates Update-Manager-Fenster für bessere UX.
 * Diese Seite wird in einem eigenen BrowserWindow geöffnet.
 */

import React from 'react';
import { UpdateManagerWindow } from '../components/UpdateManagerWindow';

export function UpdateManagerPage() {
  return <UpdateManagerWindow autoCheckOnMount={true} />;
}