import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export default function App(){
  return (
    <div className="app">
      <Sidebar />
      <Header />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
