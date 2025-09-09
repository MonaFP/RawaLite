import React from 'react';
import { NavLink } from 'react-router-dom';

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? 'active' : '')}
    >
      {label}
    </NavLink>
  </li>
);

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <h1>RaWaLite <span className="badge">Skeleton</span></h1>
      <ul>
        <NavItem to="/" label="Dashboard" />
        <NavItem to="/kunden" label="Kunden" />
        <NavItem to="/pakete" label="Pakete" />
        <NavItem to="/angebote" label="Angebote" />
        <NavItem to="/rechnungen" label="Rechnungen" />
        <NavItem to="/einstellungen" label="Einstellungen" />
      </ul>
    </aside>
  );
};

export default Sidebar;