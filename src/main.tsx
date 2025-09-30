import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, createHashRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
import PersistenceProvider from "./PersistenceProvider";
import { LoadingProvider, LoadingOverlay } from "./contexts/LoadingContext";
import { NotificationProvider, NotificationContainer } from "./contexts/NotificationContext";
import { SettingsProvider } from "./contexts/SettingsContext";

// Import pages
import DashboardPage from "./pages/DashboardPage";
import KundenPage from "./pages/KundenPage";
import AngebotePage from "./pages/AngebotePage";
import AngebotDetailPage from "./pages/AngebotDetailPage";
import PaketePage from "./pages/PaketePage";
import RechnungenPage from "./pages/RechnungenPage";
import EinstellungenPage from "./pages/EinstellungenPage";
import UpdatesPage from "./pages/UpdatesPage";
import NotFoundPage from "./pages/NotFoundPage";

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
        path: "rechnungen",
        element: <RechnungenPage />,
      },
      {
        path: "einstellungen",
        element: <EinstellungenPage />,
      },
      {
        path: "updates",
        element: <UpdatesPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
];

// Use HashRouter for production (Electron), BrowserRouter for development
const router = import.meta.env.PROD 
  ? createHashRouter(routerConfig)
  : createBrowserRouter(routerConfig);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LoadingProvider>
      <NotificationProvider>
        <PersistenceProvider mode="sqlite">
          <SettingsProvider>
            <RouterProvider router={router} />
            <LoadingOverlay />
            <NotificationContainer />
          </SettingsProvider>
        </PersistenceProvider>
      </NotificationProvider>
    </LoadingProvider>
  </React.StrictMode>
);
