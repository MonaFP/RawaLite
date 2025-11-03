> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Dev/Prod DB-Pfad-Trennung via PATHS/IPC)
> **Status:** VALIDATED | **Typ:** GUIDE
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

# Leitfaden: Dev/Prod Datenbank-Trennung (DB-ENV-SEPARATION)

## Ziele
- Vermeidung von Datenverlust: Dev und Prod nutzen getrennte DB-Dateien.
- Pfadauflösung ausschließlich über `PATHS`/IPC (keine Hardcodes).

## Soll-Pfade (aus PATHS)
- Prod-DB: `PATHS.DATABASE_FILE()` → `<userData>/database/rawalite.db`
- Backups:
  - `PATHS.DATABASE_BACKUP_FILE()` → `<userData>/database/backups/backup-<ISO>.db`
  - `PATHS.BACKUPS_DIR()` → `<Documents>/RawaLite-Backups`
- Dev-DB (Vorschlag):
  - `<userData>/database-dev/rawalite.db` (konsistent mit Electron-UserData)

## Umgebungsdetektion
- Main: `app.isPackaged` (nicht `process.env.NODE_ENV`).
- Renderer: Pfade ausschließlich via IPC/`PATHS`.

## Implementierungsplan (ohne Code)
- IPC/Paths-Bridge erweitert: env-aware `database-file`.
- Renderer `PATHS.DATABASE_FILE()` → holt env-spezifischen Pfad.
- Optionale Settings:
  - `db_env_mode`: auto/dev/prod (default auto via `app.isPackaged`)
  - `db_path_dev`, `db_path_prod`: optionale Overrides (validiert)
- Keine DB-Migration nötig.

## Tests (Abnahme)
- Dev-Start: nur `database-dev/`
- Prod-Start (Dist/Installer): nur `database/`
- Keine Überschneidung, Backups korrekt abgelegt.


