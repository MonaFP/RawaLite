# RaWaLite – Variant B Clean-Up (React + Vite + TS + sql.js)

Dieser Patch stellt **eine einheitliche Architektur** her:
- Renderer: **React + Vite + TypeScript**
- Persistenz: **sql.js (WASM)**, Speicherung als Base64 im `localStorage`
- Electron: **nur noch Wrapper**, lädt Vite (Dev) bzw. `dist/index.html` (Prod)

## 1) Dateien, die du LÖSCHEN solltest (Alt/Vanilla-App)
```
/index.html
/styles.css
/app.js
/database.js
/splash.html
/main.js        (falls auf Root-Ebene und alt)
```
> **Hinweis:** Falls du Altdateien in Unterordnern hast, bitte alle mit obigen Namen entfernen.

## 2) Dateien aus diesem Patch EINFÜGEN/ERSETZEN
```
/electron/main.js         (NEU – sicher konfiguriert)
/electron/preload.js      (NEU – minimaler Preload)
/src/db.ts                (NEU/ERSATZ – explizite INSERT-Spalten, Fix für created_at-Fehler)
```
> Achte darauf, dass `public/sql-wasm.wasm` vorhanden ist (wie bisher).

## 3) package.json – Skripte (Beispiel)
Ergänze/prüfe folgende Scripts:
```jsonc
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "dev:all": "cross-env VITE_DEV_SERVER_URL=http://localhost:5173 concurrently -k \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build",
    "start": "electron ."
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "wait-on": "^7.0.1",
    "cross-env": "^7.0.3",
    "electron": "^31.0.0"
  }
}
```
> Du kannst andere Versionen verwenden; wichtig ist, dass Electron **die Vite-URL** in Dev lädt und **dist/index.html** in Prod.

## 4) Development
1. **Nur eine Umgebung** zugleich nutzen (Browser *oder* Electron).
2. `pnpm i`
3. `pnpm dev:all` → Vite (5173) startet, Electron öffnet die SPA.
4. In der SPA: Kunden anlegen; Angebot erstellen; Kunden im Angebot wählen.

## 5) Production Build
```
pnpm build
pnpm start
```
Electron lädt dann `dist/index.html`.

## 6) Fix, der deinen Fehler behebt
Der Fehler aus der Konsole
```
NOT NULL constraint failed: offers.created_at
```
entstand, weil beim Insert die Spaltenliste nicht explizit war.  
In `src/db.ts` nutzt `createOffer` jetzt:
```sql
INSERT INTO offers(title, customer_id) VALUES(?, ?)
```
→ Dadurch greift das **DEFAULT (datetime('now'))** für `created_at` zuverlässig.

## 7) Kleinunternehmer & Summen
- `getSettings()` liefert `small_business` als String `"true" | "false"`.
- Renderer-Seiten sollten bei `"true"` die MwSt. auf `0` setzen und den Hinweis „§ 19 UStG“ anzeigen.

Viel Erfolg! ✨
