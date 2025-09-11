import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useDesignSettings } from "./hooks/useDesignSettings";

export default function App(){
  const { currentNavigationMode } = useDesignSettings();
  
  return (
    <div className="app" data-nav-mode={currentNavigationMode}>
      {currentNavigationMode === 'sidebar' && <Sidebar />}
      <Header />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
