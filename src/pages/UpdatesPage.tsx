export default function UpdatesPage() {
  return (
    <div className="page" style={{ padding: "20px" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, color: "var(--accent)", fontSize: "24px", fontWeight: "600" }}>
          Updates & Changelog
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
          Neue Funktionen, Verbesserungen und Fehlerbehebungen
        </p>
      </div>

      <div className="card" style={{ textAlign: "center", padding: "60px 40px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.6 }}>
          🚧
        </div>
        <h3 style={{ color: "var(--accent)", marginBottom: "12px" }}>
          In Entwicklung
        </h3>
        <p style={{ color: "var(--muted)", marginBottom: "20px", lineHeight: "1.5" }}>
          Die Update-Funktionalität wird derzeit entwickelt.<br/>
          Hier werden zukünftig alle Änderungen und neuen Features angezeigt.
        </p>
        <div style={{ 
          background: "rgba(30, 58, 46, 0.1)", 
          border: "1px solid var(--accent)", 
          borderRadius: "8px", 
          padding: "16px", 
          textAlign: "left",
          marginTop: "32px"
        }}>
          <h4 style={{ color: "var(--accent)", margin: "0 0 12px 0" }}>
            📋 Geplante Features:
          </h4>
          <ul style={{ color: "var(--muted)", margin: 0, paddingLeft: "20px" }}>
            <li>Automatische Update-Benachrichtigungen</li>
            <li>Changelog mit Versionsverlauf</li>
            <li>Feature-Ankündigungen</li>
            <li>Download-Links für neue Versionen</li>
            <li>Installations-Anweisungen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
