> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Konsolidierung Navigation/Heights/History, additiv/idempotent)
> **Status:** VALIDATED | **Typ:** GUIDE
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

# Leitfaden: Migration 047 – Navigation/Heights/History Konsolidierung

## Hintergrund
- Konflikte in Migrationen 037–046:
  - `header_height` teils TEXT `'160px'` (043), sonst INTEGER mit CHECK 36..220 (038/039/040/044/045).
  - Abweichende Defaults für `mode-compact-focus`: 36 (039/040) vs 60 (045).
  - Historie: `navigation_mode_history` (045) vs `user_navigation_mode_history` (046).
- Symptom: Silent Exit nach Installer, mutmaßlich DB-Init/Constraint-Fehler.

## Schritt 1 – Validierungs-Checks (READ-ONLY)
- Datentyp/Werte:
  - `PRAGMA table_info(user_navigation_preferences);`
  - `PRAGMA table_info(user_navigation_mode_settings);`
  - `SELECT typeof(header_height) AS t, COUNT(*) FROM user_navigation_preferences GROUP BY t;`
  - `SELECT header_height FROM user_navigation_preferences WHERE typeof(header_height) <> 'integer' OR CAST(header_height AS INTEGER) IS NULL LIMIT 20;`
  - TEXT mit „px“:
    - `SELECT header_height, COUNT(*) FROM user_navigation_preferences WHERE CAST(REPLACE(header_height,'px','') AS INTEGER) IS NOT header_height GROUP BY header_height;`
- KI-safe Enums:
  - `SELECT DISTINCT navigation_mode FROM user_navigation_preferences;`
  - `SELECT DISTINCT navigation_mode FROM user_navigation_mode_settings;`
- CHECK/DDL:
  - `SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('user_navigation_preferences','user_navigation_mode_settings');`
- Historie:
  - `SELECT name, type FROM sqlite_master WHERE name IN ('navigation_mode_history','user_navigation_mode_history');`
  - `PRAGMA table_info('user_navigation_mode_history');`
  - `PRAGMA index_list('user_navigation_mode_history');`
- Verteilung:
  - `SELECT navigation_mode, header_height, COUNT(*) FROM user_navigation_preferences GROUP BY navigation_mode, header_height ORDER BY navigation_mode, header_height;`

## Schritt 2 – Zielzustand (Schema/Defaults)
- `header_height`: INTEGER NOT NULL, CHECK (>= 36 AND <= 220); Normierung via UPDATE (kein Spalten-Default).
- `navigation_mode`: nur {'mode-dashboard-view','mode-data-panel','mode-compact-focus'} in allen relevanten Tabellen.
- Finale Normalisierung:
  - mode-dashboard-view → 160
  - mode-data-panel → 160
  - mode-compact-focus → 60
  - Begründung: Konsistenz mit 045 (GRID_ROWS „60px 1fr 60px“) und UI-Layout; vermeidet 36/60-Divergenzen.
- Historie:
  - kanonisch `user_navigation_mode_history`
  - VIEW `navigation_mode_history` → read-only Kompatibilität.
- Indizes/Trigger: `user_id`, `changed_at`, `session_id`; `updated_at`-Trigger wo sinnvoll.

## Schritt 3 – Migration 047 (Vorschlag – additiv & idempotent)
- up (Skizze):
  1) `user_navigation_preferences` reparieren (TEXT → INTEGER):
     - CREATE TABLE `_new` mit INTEGER/CHECK + KI-safe-ENUM.
     - INSERT … SELECT mit Konvertierung:
       - `header_height`: CASE `typeof(...)='text'` → `CAST(REPLACE(...,'px','') AS INTEGER)` ELSE Wert; `COALESCE` für NULL.
       - `navigation_mode`: CASE Legacy→KI-safe.
     - DROP alt; RENAME `_new` → original.
  2) Normalisierung erzwingen:
     - UPDATE: 160 für dashboard/data-panel; 60 für compact-focus (nur bei Abweichung).
  3) `user_navigation_mode_settings` vereinheitlichen (falls vorhanden):
     - Bei falschen CHECK/Typ: Recreate + Konvertierung + KI-safe-ENUM; optional Werte auf 160/60 normalisieren.
  4) Historie vereinheitlichen:
     - Falls nur `navigation_mode_history`: kompatibel? → RENAME; sonst Recreate `user_navigation_mode_history` + Datentransfer.
     - VIEW `navigation_mode_history` → SELECT … FROM `user_navigation_mode_history`.
     - Indizes: `user_id`, `changed_at`, `session_id`, `user_id+changed_at`.
  5) Validierung:
     - TEXT-Reste: `SELECT COUNT(*) FROM user_navigation_preferences WHERE typeof(header_height) <> 'integer';` → 0
     - Nur KI-safe Enums: `… NOT IN (…)` → 0
- down (defensiv):
  - VIEW droppen.
  - Optional nur via 047-Backups zurückrollen; keine Rückkehr zu TEXT-Schema.

## Schritt 4 – Service-/Theme-Verträglichkeit (Prüfpunkte)
- `header_height` als INTEGER (Vergleiche/Berechnungen).
- Historien-Verbrauch: VIEW sichert Referenzen auf `navigation_mode_history`.
- Field-Mapper/convertSQLQuery nutzen.
- UI-Grid: 60/160 konsistent.

## Schritt 5 – Risiken/Edge Cases
- TEXT-Formate (' 160 px'): robust konvertieren, sonst Modus-Defaults.
- Concurrency/Locks: App vor Migration beenden.
- Partiell migriert: Idempotenz (IF EXISTS/NOT EXISTS, CASE).
- UNIQUE/FKs: Recreate-Reihenfolge beachten.

## Abnahmekriterien
- `typeof(header_height) <> 'integer'` → 0 in `user_navigation_preferences`.
- Nur KI-safe `navigation_mode` in allen Tabellen.
- CHECKs korrekt (>=36 <=220) in preferences/settings.
- Historie: `user_navigation_mode_history` + VIEW vorhanden; Indizes vorhanden.
- Verteilung: (dashboard,160), (data-panel,160), (compact-focus,60) ohne Abweichungen.
- App startet, Fenster erscheint; kein `app.quit()` beim DB-Init.

---

## Validierungs-Checkliste (Copy/Paste)

### 1) Datentyp & TEXT-Reste
```sql
PRAGMA table_info(user_navigation_preferences);
PRAGMA table_info(user_navigation_mode_settings);

SELECT typeof(header_height) AS t, COUNT(*) AS n
FROM user_navigation_preferences
GROUP BY t;

SELECT header_height
FROM user_navigation_preferences
WHERE typeof(header_height) <> 'integer'
   OR CAST(header_height AS INTEGER) IS NULL
LIMIT 50;

-- 'px'-Suffix erkennen
SELECT header_height, COUNT(*) AS n
FROM user_navigation_preferences
WHERE CAST(REPLACE(header_height,'px','') AS INTEGER) IS NOT header_height
GROUP BY header_height;
```

### 2) KI-safe Enums (nur 3 Modi erlaubt)
```sql
SELECT DISTINCT navigation_mode FROM user_navigation_preferences;
SELECT DISTINCT navigation_mode FROM user_navigation_mode_settings;
```

### 3) CHECK-Constraints & DDL
```sql
SELECT name, sql
FROM sqlite_master
WHERE type='table'
  AND name IN ('user_navigation_preferences','user_navigation_mode_settings');
```

### 4) Historie – Tabelle/Indizes vorhanden
```sql
SELECT name, type
FROM sqlite_master
WHERE name IN ('navigation_mode_history','user_navigation_mode_history');

PRAGMA table_info('user_navigation_mode_history');
PRAGMA index_list('user_navigation_mode_history');
```

### 5) Werteverteilung (Plausibilität 60/160)
```sql
SELECT navigation_mode, header_height, COUNT(*) AS n
FROM user_navigation_preferences
GROUP BY navigation_mode, header_height
ORDER BY navigation_mode, header_height;
```

### 6) Integrität (optional vor Restore)
```sql
PRAGMA integrity_check;
```


