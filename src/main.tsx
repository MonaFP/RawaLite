import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
import PersistenceProvider from "./PersistenceProvider";
import { LoadingProvider, LoadingOverlay } from "./contexts/LoadingContext";
import { NotificationProvider, NotificationContainer } from "./contexts/NotificationContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { MigrationInitializer } from "./components/MigrationInitializer";
import { applyThemeToDocument, applyNavigationMode } from "./lib/themes";

// Import pages
import DashboardPage from "./pages/DashboardPage";
import KundenPage from "./pages/KundenPage";
import AngebotePage from "./pages/AngebotePage";
import AngebotDetailPage from "./pages/AngebotDetailPage";
import PaketePage from "./pages/PaketePage";
import RechnungenPage from "./pages/RechnungenPage";
import TimesheetsPage from "./pages/TimesheetsPage";
import EinstellungenPage from "./pages/EinstellungenPage";
import NotFoundPage from "./pages/NotFoundPage";


const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <div>Routing Error - Lade Dashboard...</div>,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "kunden",
        element: <KundenPage />,
      },
      {
        path: "angebote",
        element: <AngebotePage />,
      },
      {
        path: "angebote/:id",
        element: <AngebotDetailPage />,
      },
      {
        path: "pakete",
        element: <PaketePage />,
      },
      {
        path: "rechnungen",
        element: <RechnungenPage />,
      },
      {
        path: "leistungsnachweise",
        element: <TimesheetsPage />,
      },
      {
        path: "einstellungen",
        element: <EinstellungenPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);


// ✨ NEUE STRATEGIE: Settings VOR React-Rendering laden und anwenden
async function initializeApp() {
  try {
    console.log('� [PRE-REACT] Initializing app with persisted settings...');
    
    // Dynamischer Import der benötigten Module
    const { SettingsAdapter } = await import('./adapters/SettingsAdapter');
    const { applyThemeToDocument, applyNavigationMode } = await import('./lib/themes');
    
    // Settings direkt aus SQLite laden
    const settingsAdapter = new SettingsAdapter();
    const settings = await settingsAdapter.getSettings();
    
    if (settings.designSettings) {
      console.log('🎨 [PRE-REACT] Applying design settings BEFORE React render:', settings.designSettings);
      applyThemeToDocument(settings.designSettings.theme, settings.designSettings.customColors);
      applyNavigationMode(settings.designSettings.navigationMode);
    } else {
      console.log('🎨 [PRE-REACT] No settings found, applying defaults');
      applyThemeToDocument('salbeigrün');
      applyNavigationMode('sidebar');
    }
    
    console.log('✅ [PRE-REACT] Settings applied successfully, starting React...');
  } catch (error) {
    console.error('❌ [PRE-REACT] Error loading settings, using defaults:', error);
    const { applyThemeToDocument, applyNavigationMode } = await import('./lib/themes');
    applyThemeToDocument('salbeigrün');
    applyNavigationMode('sidebar');
  }
}

// App initialisieren und dann React rendern
initializeApp().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <LoadingProvider>
        <NotificationProvider>
          <PersistenceProvider mode="sqlite">
            <SettingsProvider>
              <MigrationInitializer>
                <RouterProvider router={router} />
                <LoadingOverlay />
                <NotificationContainer />
              </MigrationInitializer>
            </SettingsProvider>
          </PersistenceProvider>
        </NotificationProvider>
      </LoadingProvider>
    </React.StrictMode>
  );
});
