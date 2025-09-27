## 📄 Datei: `/docs/20-paths.md`

````markdown
# Pfad-Management

## Übersicht
Alle Pfade der Anwendung werden zentral verwaltet.  
Dies stellt Konsistenz, Wartbarkeit und Sicherheit sicher.  
Änderungen erfolgen ausschließlich in **`src/lib/paths.ts`**.

## Offizielle Quelle
- **Single Source of Truth:** `src/lib/paths.ts`  
  Enthält alle Getter-Funktionen und das `PATHS`-Objekt.  
- Nutzung in allen Services, Renderer-Komponenten und im Main-Prozess.  

**Beispiel:**
```ts
import { PATHS } from "@/lib/paths";

const logDir = PATHS.logs();
````

## Standalone-Scripts

* Für Skripte außerhalb des Electron-Kontexts (CLI, CI, Installer, Updater) gilt:

  * **Quelle:** `src/lib/path-utils.ts`
  * Dort existieren Fallbacks ohne Zugriff auf `electron.app`.

**Beispiel:**

```ts
import { getUserDataDirUniversal } from "@/lib/path-utils";

const userData = getUserDataDirUniversal();
```

## Feste Ordnerstruktur

Die folgenden Pfade sind garantiert und konsistent über alle Plattformen:

* `db`: Datenbankdatei (SQLite)
* `backups`: Backups der Datenbank
* `templates`: PDF-/Logo-Vorlagen
* `downloads`: System-Downloads-Verzeichnis
* `logs`: Anwendungs-Logs
* `cache`: Cache-Verzeichnis
* `temp`: Temporäre Dateien
* `documents`: System-Dokumente-Verzeichnis
* `desktop`: System-Desktop

## Regeln

* Alle Services und Module nutzen ausschließlich **Helper-Funktionen aus `paths.ts`**.
* **Kein direkter Aufruf von `app.getPath()` außerhalb `paths.ts`.**
* Einheitliche Struktur darf nicht verändert werden.

## Tests

* Mock-Implementierungen für deterministische Tests.
* Sicherstellen, dass alle Services konsistent `PATHS` verwenden.

```

---

```
