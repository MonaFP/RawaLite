import { useLocation } from "react-router-dom";

const titles: Record<string,string> = {
  "/": "Dashboard",
  "/kunden": "Kunden",
  "/pakete": "Pakete",
  "/angebote": "Angebote",
  "/rechnungen": "Rechnungen",
  "/einstellungen": "Einstellungen"
};

interface HeaderProps {
  title?: string;
  right?: React.ReactNode;
}

export default function Header({ title: propTitle, right }: HeaderProps = {}){
  const { pathname } = useLocation();
  const title = propTitle ?? titles[pathname] ?? "RaWaLite";
  return (
    <header className="header">
      <div className="title">{title}</div>
      {right && <div className="header-right">{right}</div>}
      <div style={{opacity:.7}}>v0.1 UI-Fix</div>
    </header>
  );
}
