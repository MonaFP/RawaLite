import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";

// Fallback placeholder pages so the shell renders immediately.
// Replace with your real pages when ready.
function P({title}:{title:string}){ 
  return <div className="card"><h2 style={{marginTop:0}}>{title}</h2><p>Platzhalter-Seite – Inhalte folgen.</p></div>; 
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <P title="Dashboard" /> },
      { path: "kunden", element: <P title="Kunden" /> },
      { path: "pakete", element: <P title="Pakete" /> },
      { path: "angebote", element: <P title="Angebote" /> },
      { path: "rechnungen", element: <P title="Rechnungen" /> },
      { path: "einstellungen", element: <P title="Einstellungen" /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
