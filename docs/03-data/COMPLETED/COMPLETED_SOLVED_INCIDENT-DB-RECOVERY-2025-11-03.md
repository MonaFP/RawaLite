> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Recovery-Playbook Prod, atomar/reversibel)
> **Status:** COMPLETED | **Typ:** SOLVED_INCIDENT
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

# Vorfallbericht + Recovery: Prod-DB Restore (Copy-on-Write)

## Problem
- Dev und Prod nutzten dieselbe DB → Datenverlustgefahr.

## Aktuellstes Backup finden (Plan)
- Suchorte:
  - `<userData>/database/backups/` (In-App Backups)
  - `<Documents>/RawaLite-Backups/` (Export/ZIP)
- Auswahl:
  - Namensschema mit Timestamp lexikografisch absteigend ODER mtime absteigend.
- Validierung (READ-ONLY):
  - `PRAGMA integrity_check;` muss `ok` liefern
  - Schema-Check Kern-Tabellen

## Recovery (atomar, reversibel)
1) App vollständig beenden (Locks vermeiden).
2) Backup → Temp-Zieldatei: `rawalite.db.restoring`
3) Integrität/Schema prüfen (Temp):
   - `PRAGMA integrity_check;` = `ok`
   - Kern-Tabellen vorhanden
4) Atomarer Switch:
   - `rawalite.db` → `rawalite.db.previous`
   - `rawalite.db.restoring` → `rawalite.db`
5) Post-Checks:
   - Größe > 0, `PRAGMA integrity_check;` auf neuer Prod-DB
6) Rollback bei Fehler:
   - `rawalite.db.previous` zurückbenennen
   - Temp behalten, nichts löschen

## Abnahme
- Integrität ok, Schema kompatibel
- App-Start erfolgreich


