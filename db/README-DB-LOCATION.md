# ⚠️ WICHTIGER HINWEIS: Diese Datei ist NICHT die aktive Datenbank!

**Echte Produktions-Datenbank:** `C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db`

**Diese Datei existiert nur als Platzhalter zur Klarstellung.**

Konfiguriert in `src/main/db/Database.ts`:
```typescript
function getDbPath(): string {
  const userData = app.getPath('userData'); // = AppData/Roaming/Electron
  return path.join(userData, 'database', 'rawalite.db');
}
```

Für echte DB-Analyse verwende:
```bash
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs
```