import { useEffect, useState } from "react";
import Header from "@components/Header";
import { usePersistence } from "../contexts/PersistenceContext";

const DashboardPage: React.FC = () => {
  return (
    <div>
      <Header title="Willkommen zu RaWaLite 🚀" />
      <div className="card">
        <p>Dies ist das Grundgerüst. Navigiere über das Menü links.</p>
      </div>
    </div>
  );
};
export default DashboardPage;