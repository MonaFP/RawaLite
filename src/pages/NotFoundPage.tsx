import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@components/Header";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate("/", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div>
      <Header title="Seite nicht gefunden" />
      <div className="card">
        <h2>🔍 Seite nicht gefunden</h2>
        <p>Der angeforderte Pfad existiert nicht.</p>
        <p>Sie werden in <strong>{countdown}</strong> Sekunden automatisch zum Dashboard weitergeleitet.</p>
        <button 
          onClick={() => navigate("/", { replace: true })}
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "12px"
          }}
        >
          Sofort zum Dashboard
        </button>
      </div>
    </div>
  );
};
export default NotFoundPage;