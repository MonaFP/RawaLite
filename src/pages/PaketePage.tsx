import { useEffect, useState } from "react";
import Header from "@components/Header";
import { usePersistence } from "../contexts/PersistenceContext";

const PaketePage: React.FC = () => {
  return (
    <div>
      <Header title="Pakete" right={<button className="btn">Neu</button>} />
      <div className="card">
        <p>Hier werden später digitale Produkte & Webdesign-Pakete gepflegt.</p>
      </div>
    </div>
  );
};
export default PaketePage;