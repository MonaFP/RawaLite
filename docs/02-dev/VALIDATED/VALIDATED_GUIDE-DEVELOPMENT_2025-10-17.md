# 🚀 Entwickler-Leitfaden - RawaLite

> **Erstellt:** 29.09.2025 | **Letzte Aktualisierung:** 17.10.2025 (Content modernization + ROOT_ integration)  
> **Status:** VALIDATED - Reviewed and updated  
> **Schema:** `VALIDATED_GUIDE-DEVELOPMENT_2025-10-17.md`

> **⚠️ CRITICAL:** [../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - **MANDATORY READ vor Development**  
> **🛡️ NEVER violate:** Siehe [../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - Essential coding rules  
> **📚 ALWAYS:** `pnpm validate:critical-fixes` vor jedem Commit  

**Schnelleinstieg für Entwickler** in das RawaLite-Projekt

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
- **[workflows/WORKFLOWS.md](workflows/WORKFLOWS.md)** - Git-Workflow und Prozesse
- **[debugging/debugging.md](debugging/debugging.md)** - Debugging-Strategien
- **[../10-architecture/ARCHITEKTUR.md](../10-architecture/ARCHITEKTUR.md)** - Technische Architektur

---

*Vollständige Entwickler-Dokumentation in den verlinkten Dokumenten verfügbar.*