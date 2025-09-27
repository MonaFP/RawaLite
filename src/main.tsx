import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import PersistenceProvider from "./PersistenceProvider";
import { LoadingProvider, LoadingOverlay } from "./contexts/LoadingContext";
import { NotificationProvider, NotificationContainer } from "./contexts/NotificationContext";
import { SettingsProvider } from "./contexts/SettingsContext";
// import { MigrationInitializer } from "./components/MigrationInitializer";
import { applyThemeToDocument, applyNavigationMode } from "./lib/themes";

// Pages werden jetzt direkt in App.tsx importiert

// ✨ Sofort Standard-Theme anwenden beim App-Start (verhindert weißen Bildschirm)
// Wird später von persistierten Settings aus SQLite überschrieben
applyThemeToDocument('salbeigrün');
applyNavigationMode('sidebar');

// Router v6 uses component-based routing

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode> // TEMP DISABLED: Testing double initialization hypothesis
    <LoadingProvider>
      <NotificationProvider>
        <PersistenceProvider mode="sqlite">
          <SettingsProvider>
            <HashRouter>
              <App />
            </HashRouter>
            <LoadingOverlay />
            <NotificationContainer />
          </SettingsProvider>
        </PersistenceProvider>
      </NotificationProvider>
    </LoadingProvider>
  // </React.StrictMode>
);
