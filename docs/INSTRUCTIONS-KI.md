# RawaLite – Kurz-Instructions für KI

Dies ist die **Kurzfassung** der verbindlichen Projektregeln, optimiert für KI-Prompts.  
Immer strikt befolgen, keine Abweichungen.

---

## 🔑 Kernregeln

- **PNPM-only** – niemals `npm` oder `yarn` verwenden.  
- **Alles in-App** – keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  
- **Update-System**:  
  - Auto-Check nur beim App-Start.  
  - Danach manuell (Header-Version oder Einstellungen → Updates).  
  - `autoDownload: false`.  
  - Download & Install nur nach Nutzeraktion.  
  - `pendingDir` basiert auf `PATHS.userData()`.  
  - **Verboten:** Browser-Redirects oder externe Download-Links.  
- **Paths**:  
  - Nur über `src/lib/paths.ts` (`PATHS`).  
  - Standalone: `src/lib/path-utils.ts`.  
  - **Verboten:** direkter `app.getPath()`.  
- **PDF**:  
  - Workflow: `PDFService → PDFPostProcessor → templates`.  
  - Nur lokale Assets & Fonts (bundled, lizenzkonform).  
  - Keine externen Ressourcen/CDNs.  
- **Persistenz**:  
  - Primary: SQLite (sql.js).  
  - Dev-Fallback: Dexie.  
  - Einstiegspunkt: `src/persistence/index.ts`.  
  - Adapter-Parität, Migration additiv & idempotent.  
  - **Verboten:** Direktimporte `SQLiteAdapter`/`DexieAdapter`.  
- **Security/IPC**:  
  - Prod zwingend: `sandbox:true` + `contextIsolation:true`.  
  - IPC nur typisiert via `preload`/ContextBridge.  
  - **Verboten:** dynamische Kanäle, Node im Renderer.  
- **Nummernkreise**:  
  - Präfix, Stellen, aktueller Zähler, Reset (Nie/Jährlich/Monatlich).  
  - Atomar, Jahres-Reset optional.  
- **Theme/Navigation**:  
  - Theme persistiert über SQLite (Dexie Dev-Fallback).  
  - Sidebar 240 px, kein FOUC.  
  - Farbpalette fix, darf nie geändert werden.
 **Testergebnisse (`test-results`) liegen in `/tests/`**, nicht im Projekt-Root. In der Dokumentation dürfen sie nur referenziert werden, nicht dupliziert.
 - Debugging erfolgt ausschließlich nach dem 
  [Systematischen Problemlösungsprozess (Safe Edition)](../development/DEBUGGING_STANDARDS.md).
---

## 🚫 Verbotene Muster (niemals generieren)

- `npm` oder `yarn` Befehle.  
- `app.getPath()` außerhalb `paths.ts`.  
- `shell.openExternal`, externe Links, `window.open`, `target="_blank"`.  
- PDF-Assets aus dem Netz.  
- Direktimporte von `SQLiteAdapter` oder `DexieAdapter`.  
- Dynamische IPC-Kanäle.  
- Node-APIs direkt im Renderer.

---

## ✅ Ziel für KI
- **Nur Regeln anwenden**, keine Workarounds vorschlagen.  
- Änderungen immer in Einklang mit den Master-Dokumenten in `/docs`.  
- Keine Duplikate oder widersprüchlichen Aussagen erzeugen.  
