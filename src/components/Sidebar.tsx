import { NavLink } from "react-router-dom";
import { useUnifiedSettings } from "../hooks/useUnifiedSettings";

export default function Sidebar(){
  const { settings } = useUnifiedSettings();
  const items = [
    { to: "/", label: "Dashboard" },
    { to: "/kunden", label: "Kunden" },
    { to: "/pakete", label: "Pakete" },
    { to: "/angebote", label: "Angebote" },
    { to: "/rechnungen", label: "Rechnungen" },
    { to: "/einstellungen", label: "Einstellungen" }
  ];
  return (
    <aside className="sidebar">
      <div style={{ marginBottom: "20px" }}>
        <div className="brand" style={{ marginBottom: "12px" }}>
          <span className="dot" /> RaWaLite
        </div>
        {settings.companyData?.logo && (
          <div style={{ width: "100%", textAlign: "center", padding: "8px 0" }}>
            <img 
              src={settings.companyData.logo} 
              alt="Firmenlogo" 
              style={{ 
                maxWidth: "100%", 
                maxHeight: "60px", 
                objectFit: "contain",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)"
              }} 
            />
          </div>
        )}
      </div>
      <ul className="nav">
        {items.map(i => (
          <li key={i.to}>
            <NavLink to={i.to} end={i.to === "/"}>
              {i.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
