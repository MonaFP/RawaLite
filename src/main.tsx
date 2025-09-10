import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import PersistenceProvider from "./PersistenceProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PersistenceProvider mode="sqlite">
      <App />
    </PersistenceProvider>
  </React.StrictMode>
);
