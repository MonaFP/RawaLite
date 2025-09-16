import { useLocation, NavLink } from "react-router-dom";
import { useAutoUpdater } from "../hooks/useAutoUpdater";
import { useDesignSettings } from "../hooks/useDesignSettings";
import HeaderWidgets from "./HeaderWidgets";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/kunden": "Kunden",
  "/pakete": "Pakete",
  "/angebote": "Angebote",
  "/rechnungen": "Rechnungen",
  "/leistungsnachweise": "Leistungsnachweise",
  "/einstellungen": "Einstellungen",
};

interface HeaderProps {
  title?: string;
  right?: React.ReactNode;
}

export default function Header({ title: propTitle, right }: HeaderProps = {}) {
  const { pathname } = useLocation();
  // 🔧 CRITICAL FIX: Migrate to electron-updater based useAutoUpdater
  const [updateHookState, updateActions] = useAutoUpdater({
    autoCheckOnStart: false,
  });
  const { currentNavigationMode } = useDesignSettings();

  const title = propTitle ?? titles[pathname] ?? "RaWaLite";

  // 🔧 CRITICAL FIX: Adapter functions for electron-updater integration
  const isCheckingUpdates = updateHookState.state === "checking";
  const isUpdating =
    updateHookState.state === "downloading" || updateHookState.installInitiated;
  const updateAvailable =
    updateHookState.state === "available" ||
    updateHookState.state === "downloaded";
  const displayVersion = `v${updateHookState.currentVersion}` || "v1.0.0";

  const handleVersionClick = async () => {
    if (isUpdating || isCheckingUpdates) return; // Verhindere Mehrfach-Klicks

    if (updateHookState.state === "available") {
      // Update verfügbar - starte Download
      if (confirm("Update verfügbar! Jetzt herunterladen?")) {
        try {
          await updateActions.startDownload();
        } catch (error) {
          console.error("Download failed:", error);
          alert(
            "Download fehlgeschlagen: " +
              (error instanceof Error ? error.message : String(error))
          );
        }
      }
    } else if (updateHookState.state === "downloaded") {
      // Update heruntergeladen - installiere
      if (confirm("Update bereit zur Installation! App wird neu gestartet.")) {
        try {
          await updateActions.installAndRestart();
        } catch (error) {
          console.error("Install failed:", error);
          alert(
            "Installation fehlgeschlagen: " +
              (error instanceof Error ? error.message : String(error))
          );
        }
      }
    } else {
      // Kein Update verfügbar - prüfe nach Updates
      try {
        await updateActions.checkForUpdates();
        // Kurz warten, damit der State aktualisiert wird
        setTimeout(() => {
          if (updateHookState.state === "not-available") {
            alert("Sie verwenden bereits die neueste Version.");
          }
        }, 100);
      } catch (error) {
        console.error("Update check failed:", error);
        alert(
          "Update-Prüfung fehlgeschlagen: " +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  };

  // Icon basierend auf Status
  const getStatusIcon = () => {
    if (updateHookState.state === "downloading") return "⬇️";
    if (updateHookState.installInitiated) return "🔄";
    if (updateHookState.state === "checking") return "⏳";
    if (updateHookState.state === "available") return "🔔";
    if (updateHookState.state === "downloaded") return "✅";
    if (updateHookState.error) return "⚠️";
    return "🔍";
  };

  const getStatusColor = () => {
    if (
      updateHookState.state === "available" ||
      updateHookState.state === "downloaded"
    )
      return "#22c55e";
    if (
      updateHookState.state === "checking" ||
      updateHookState.state === "downloading" ||
      updateHookState.installInitiated
    )
      return "#f59e0b";
    if (updateHookState.error) return "#ef4444";
    return "#3b82f6";
  };

  const navigationItems = [
    { to: "/", label: "Dashboard" },
    { to: "/kunden", label: "Kunden" },
    { to: "/pakete", label: "Pakete" },
    { to: "/angebote", label: "Angebote" },
    { to: "/rechnungen", label: "Rechnungen" },
    { to: "/leistungsnachweise", label: "Leistungsnachweise" },
    { to: "/einstellungen", label: "Einstellungen" },
  ];

  return (
    <header className="header">
      {/* Navigation für Header-Modus */}
      {currentNavigationMode === "header" && (
        <nav style={{ display: "flex", gap: "6px" }}>
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              style={({ isActive }) => ({
                color: isActive ? "white" : "rgba(255,255,255,0.8)",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: isActive ? "600" : "500",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                transition: "all 0.2s ease",
                border: isActive
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid transparent",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Widgets für Sidebar-Modus */}
      {currentNavigationMode === "sidebar" && <HeaderWidgets />}

      {/* Right Content */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {right && <div className="header-right">{right}</div>}

        {/* Version Badge */}
        <div
          style={{
            opacity: isUpdating || isCheckingUpdates ? 0.6 : 1,
            cursor: isUpdating || isCheckingUpdates ? "wait" : "pointer",
            color: getStatusColor(),
            fontWeight: updateAvailable ? "600" : "500",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: updateAvailable
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(59, 130, 246, 0.1)",
            border: `1px solid ${
              updateAvailable
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(59, 130, 246, 0.3)"
            }`,
            userSelect: "none",
          }}
          onClick={handleVersionClick}
          title={
            updateHookState.state === "downloading"
              ? `Update wird heruntergeladen... ${
                  updateHookState.progress?.percent || 0
                }%`
              : updateHookState.installInitiated
              ? "Update wird installiert..."
              : updateHookState.state === "checking"
              ? "Prüfe nach Updates..."
              : updateHookState.state === "available"
              ? "Update verfügbar - Klicken zum Herunterladen"
              : updateHookState.state === "downloaded"
              ? "Update bereit - Klicken zum Installieren"
              : updateHookState.error
              ? `Fehler: ${updateHookState.error}`
              : "Klicken um nach Updates zu suchen"
          }
        >
          {getStatusIcon()} {displayVersion}
        </div>
      </div>
    </header>
  );
}
