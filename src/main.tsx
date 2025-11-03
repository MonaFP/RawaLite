import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, createHashRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";

// 🎨 DATABASE-THEME-SYSTEM INTEGRATION für CSS Module - Phase 1B
import "./styles/load-theme-integration.js";

import PersistenceProvider from "./PersistenceProvider";
import { LoadingProvider, LoadingOverlay } from "./contexts/LoadingContext";
import { NotificationProvider, NotificationContainer } from "./contexts/NotificationContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NumberingProvider } from "./contexts/NumberingContext";
import { DatabaseThemeProvider } from "./contexts/DatabaseThemeManager";
import { NavigationProvider } from "./contexts/NavigationContext";
import { FocusModeProvider } from "./contexts/FocusModeContext";

// Import pages
import DashboardPage from "./pages/DashboardPage";
import KundenPage from "./pages/KundenPage";
import AngebotePage from "./pages/AngebotePage";
import AngebotDetailPage from "./pages/AngebotDetailPage";
import PaketePage from "./pages/PaketePage";
import PackageEditPage from "./pages/PackageEditPage";
import RechnungenPage from "./pages/RechnungenPage";
import TimesheetsPage from "./pages/TimesheetsPage";
import EinstellungenPage from "./pages/EinstellungenPage";
import RollbackPage from "./pages/RollbackPage";
import NotFoundPage from "./pages/NotFoundPage";
import { UpdateManagerPage } from "./pages/UpdateManagerPage";

// Router configuration - conditional based on environment
const routerConfig = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
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
        path: "pakete/:id/edit",
        element: <PackageEditPage />,
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
        path: "rollback",
        element: <RollbackPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  // Separate Update Manager Window Route
  {
    path: "/update-manager",
    element: <UpdateManagerPage />,
  },
];

// Use HashRouter for production (Electron), BrowserRouter for development
const router = import.meta.env.PROD 
  ? createHashRouter(routerConfig)
  : createBrowserRouter(routerConfig);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DatabaseThemeProvider>
      <NavigationProvider>
        <FocusModeProvider>
          <LoadingProvider>
            <NotificationProvider>
              <PersistenceProvider mode="sqlite">
                <SettingsProvider>
                  <NumberingProvider>
                    <RouterProvider router={router} />
                    <LoadingOverlay />
                    <NotificationContainer />
                  </NumberingProvider>
                </SettingsProvider>
              </PersistenceProvider>
            </NotificationProvider>
          </LoadingProvider>
        </FocusModeProvider>
      </NavigationProvider>
    </DatabaseThemeProvider>
  </React.StrictMode>
);
