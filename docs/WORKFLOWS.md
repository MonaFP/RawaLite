Super 👍 – ich habe dir eine **neue konsolidierte Anweisung als Markdown-Datei** gebaut, die du direkt als `/docs/WORKFLOWS.md` ablegen kannst. Sie enthält alle Regeln für CI/CD, Build, Release und Versionierung – **kopierfertig**.

---

## 📄 Datei: `/docs/WORKFLOWS.md`

````markdown
# RawaLite – CI/CD & Release Workflows (Safe Edition)

Dieses Dokument definiert die **verbindlichen Regeln für Build- und Release-Workflows** von RawaLite.  
Es ersetzt alle älteren Workflow-Beschreibungen.

---

## 🛠️ Build & CI

### Node & pnpm
- **Node-Version:** `20.18.0`  
- **pnpm-Version:** `10.15.1`  
- **Verboten:** `npm`, `yarn`

### Cache-Management
- Verwende `actions/cache` für `~/.pnpm-store`  
- Key basiert auf `pnpm-lock.yaml`  
- Vor jedem Release-Build Cache **vollständig leeren**, um Setup-Dateien >300MB zu verhindern:
  ```powershell
  Remove-Item -Recurse -Force .\dist, .\release, .\node_modules\.vite, .\node_modules\.cache -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force "$env:APPDATA\electron-builder" -ErrorAction SilentlyContinue
````

---

## ✅ CI-Workflow (Pull Requests, main branch)

### verify-Job (ubuntu-latest)

* Install:

  ```bash
  pnpm install --frozen-lockfile
  ```
* Checks:

  ```bash
  pnpm typecheck
  pnpm lint
  pnpm guard:external
  pnpm guard:pdf
  pnpm validate:ipc
  pnpm validate:versions
  pnpm test
  pnpm e2e   # optional, Playwright
  ```

### build-Job (windows-latest, needs: verify)

* Install:

  ```bash
  pnpm install --frozen-lockfile
  ```
* Build:

  ```bash
  pnpm build && pnpm dist
  ```

  **Verboten:** `--publish`
* Guards:

  ```bash
  pnpm guard:release:assets
  ```
* Release-Checks:

  * Setup-Dateigröße `< 300 MB` (sonst Fehler)
  * `latest.yml` existiert und enthält `sha512 (base64)`
  * `builder-effective-config.yaml` prüfen:

    * `appId` stabil
    * `nsis.perMachine=false`

---

## 🚀 Release-Workflow (Tags vX.Y.Z)

### Trigger

* `push: tags: v*`

### Regeln

* Build wie oben (Windows-Job, Cache-Bereinigung, Checks)
* **Upload ausschließlich via GitHub CLI (authentifiziert):**

  ```bash
  gh release create vX.Y.Z \
    --title "RawaLite vX.Y.Z" \
    --notes "Release notes..." \
    --repo MonaFP/RawaLite

  gh release upload vX.Y.Z \
    "dist/rawalite-Setup-X.Y.Z.exe" \
    "dist/rawalite-Setup-X.Y.Z.exe.blockmap" \
    "dist/latest.yml" \
    "dist/update.json" \
    --clobber --repo MonaFP/RawaLite
  ```
* **Verboten:** `electron-builder --publish`

---

## 🔢 Versionierung

### Schema

* **MAJOR (X.0.0)**: neue Features mit Breaking Changes (z. B. neue Entitäten, DB-Schema-Updates)
* **MINOR (X.Y.0)**: neue Features ohne Breaking Changes (z. B. neue UI-Komponenten, PDF-Verbesserungen)
* **PATCH (X.Y.Z)**: Bugfixes, Tests, interne Verbesserungen

### Regeln

* **KI muss bei jeder Release-Aufforderung** (`🚀 Release v<semver> - JETZT ausführen`) die Versionsnummer nach diesem Schema **korrekt erhöhen**.
* Versionen müssen **semantisch konsistent** sein.
* **package.json** und `VersionService.ts` (inkl. BUILD_DATE) werden synchronisiert.

---

## 📋 Checkliste (jeder Build/Release)

* [ ] Node = 20.18.0
* [ ] pnpm = 10.15.1
* [ ] Cache geleert, Größe `< 300 MB`
* [ ] Alle Guards grün (`guard:external`, `guard:pdf`, `validate:ipc`, `validate:versions`)
* [ ] Tests erfolgreich (`unit`, optional `e2e`)
* [ ] `latest.yml` enthält `sha512 (base64)`
* [ ] Release-Upload ausschließlich via `gh release upload`
* [ ] Versionsnummer nach offiziellem Schema erhöht

```

---
