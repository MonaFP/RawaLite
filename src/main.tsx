import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
import DashboardPage from "./pages/DashboardPage";
import KundenPage from "./pages/KundenPage";
import PaketePage from "./pages/PaketePage";
import AngebotePage from "./pages/AngebotePage";
import RechnungenPage from "./pages/RechnungenPage";
import EinstellungenPage from "./pages/EinstellungenPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "kunden", element: <KundenPage /> },
      { path: "pakete", element: <PaketePage /> },
      { path: "angebote", element: <AngebotePage /> },
      { path: "rechnungen", element: <RechnungenPage /> },
      { path: "einstellungen", element: <EinstellungenPage /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
