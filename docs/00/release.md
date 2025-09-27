# RawaLite – Release-Prozess (Safe Edition)  

Dieses Dokument beschreibt den standardisierten Ablauf für neue Releases der Anwendung und die erforderlichen Überprüfungen vor einer Veröffentlichung.

## 🚀 Release-Ablauf  
Ein **Release** wird in RawaLite über das GitHub-Repository vorbereitet und automatisiert ausgeliefert:  

- Die **Versionsnummer** wird gemäß Richtlinien erhöht (siehe [Versionierung](versioning.md)) und alle Änderungen werden ins `main` übernommen.  
- Ein neuer Git-**Tag** (`vX.Y.Z`) wird erstellt und gepusht, um den CI/CD Release-Workflow zu triggern.  
- Die **CI** führt einen finalen Build auf Windows durch und erstellt die Release-Artefakte (`rawalite-Setup-X.Y.Z.exe`, `.blockmap`, `latest.yml`, `update.json`).  
- Die Artefakte werden **über die GitHub API** hochgeladen und ein Release-Eintrag (Titel, Notes) wird angelegt.  
- Nach Veröffentlichung prüft das integrierte Update-System bei den Nutzern das Update und bietet es zum Download/Installieren an.

## 📋 Checkliste vor Release  
* [ ] **Version erhöht** – Version gemäß Semver angepasst; `package.json` und Code-Version synchron.  
* [ ] **Changelog aktuell** – Alle relevanten Änderungen/Neuerungen dokumentiert (Release Notes).  
* [ ] **Tests/Checks ok** – Unit- und Integrations-Tests erfolgreich; alle CI-Guards (Lint, IPC, Versions, etc.) grün.  
* [ ] **Installer manuell geprüft** – Setup-Datei testweise ausgeführt und Update-Prozess durchlaufen (erscheint ein erwarteter UAC-Dialog? beendet sich die App korrekt? Installation erfolgreich?).  
* [ ] **Release-Assets vollständig** – Installer und zugehörige Dateien (`latest.yml`, `.blockmap`, etc.) vorhanden und auf GitHub hochgeladen.  
* [ ] **Backup-Verhalten verifiziert** *(optional)* – Sicherstellen, dass die automatische Backup-Erstellung vor Updates funktioniert (Daten bei Bedarf wiederherstellbar).
