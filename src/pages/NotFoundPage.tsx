import { useEffect, useState } from "react";
import Header from "@components/Header";
import { usePersistence } from "../contexts/PersistenceContext";

const NotFoundPage: React.FC = () => {
  return (
    <div>
      <Header title="Seite nicht gefunden" />
      <div className="card"><p>Der angeforderte Pfad existiert nicht.</p></div>
    </div>
  );
};
export default NotFoundPage;