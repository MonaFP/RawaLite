# 🚀 Entwickler-Leitfaden - RawaLite

> **Schnelleinstieg für Entwickler** in das RawaLite-Projekt
> 
> **Letzte Aktualisierung:** 29. September 2025 | **Version:** 1.1.0

---

## 🎯 **Grundregeln**

### **Code-Konventionen**
- **ESM only:** Ausschließlich ES Modules verwenden
- **TypeScript strict:** Strict Mode immer aktiviert
- **Public APIs:** Alle APIs über explizite exports verfügbar machen

### **Architektur-Regeln**
- **Renderer/Main Trennung:** Strikte Process-Isolation in Electron
- **Layer Separation:** Klare Trennung zwischen UI, Business Logic und Data Layer
- **Interface Contracts:** Alle Schnittstellen über TypeScript Interfaces definiert

---

## 📚 **Weiterführende Dokumentation**

Für detaillierte Informationen siehe:
- **[standards.md](standards.md)** - Vollständige Coding Standards
- **[WORKFLOWS.md](WORKFLOWS.md)** - Git-Workflow und Prozesse
- **[debugging.md](debugging.md)** - Debugging-Strategien
- **[ARCHITEKTUR.md](ARCHITEKTUR.md)** - Technische Architektur

---

*Vollständige Entwickler-Dokumentation in den verlinkten Dokumenten verfügbar.*