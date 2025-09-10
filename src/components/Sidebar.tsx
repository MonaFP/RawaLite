import { NavLink } from "react-router-dom";

export default function Sidebar(){
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
      <div className="brand"><span className="dot" /> RaWaLite</div>
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
