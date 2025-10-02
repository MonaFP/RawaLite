# Lessons Learned – [THEMA / BEREICH]

Diese Datei dokumentiert alle Debugging- und Analyse-Versuche zu [Thema/Bereich].  
Ziel: **KI soll wissen, was bereits probiert wurde, mit welchem Ergebnis**, um Doppelarbeit zu vermeiden.

---

## 📑 Struktur
---
id: LL-<Bereich>-<laufende-nummer>
bereich: <bereich/pfad>
status: open|verified|resolved
schweregrad: low|medium|high|critical
scope: dev|prod|both
build: app=<versionsnummer> electron=<versionsnummer>
schema_version_before: x
schema_version_after: x
db_path: <Pfad zur DB-Datei falls vorhanden>
reproduzierbar: yes|no
artefakte: []
---

Jeder Eintrag folgt diesem Schema:

### Versuch <Nummer>
- **Datum:** YYYY-MM-DD  
- **Durchgeführt von:** Entwickler / KI  
- **Beschreibung:** Was wurde getestet oder geändert?  
- **Hypothese:** Erwartetes Ergebnis  
- **Ergebnis:** (!!muss!! aktiv beim Entwickler erfragt werden!)  
- **Quelle:** Logs / Screenshots / Chatverlauf / Commit-Hash  
- **Tags:** [OPTIONAL]  
- **Artefakte:** [OPTIONAL]  

---

## 🔒 Regeln
- Jeder Versuch **muss eingetragen** werden.  
- **Ergebnisse dürfen nicht geraten** werden → immer Entwickler fragen.  
- Nur Fakten, keine Spekulationen.  
- Keine Redundanzen → Eintrag referenziert ggf. vorherige Versuche.  
- **Vorgehen:** Immer dem [Debugging-Workflow](../00-standards/debugging.md) folgen.

---

## 🧪 Versuche

### Versuch 1
- **Datum:** YYYY-MM-DD  
- **Durchgeführt von:**  
- **Beschreibung:**  
- **Hypothese:**  
- **Ergebnis:**  
- **Quelle:**  

---

## 📌 Status
- [ ] **Gelöste Probleme:**  
- [ ] **Validierte Architektur-Entscheidungen:**  

---

## 🔍 Quick-Triage-Checkliste
- [ ] **App-Name korrekt?**  
- [ ] **IsPackaged Status?**  
- [ ] **userData Path korrekt?**  
- [ ] **DB File existiert?**  
- [ ] **PRAGMA Checks:**  
- [ ] **Tabellen vorhanden?**  
- [ ] **Migration Ledger konsistent?**  
- [ ] **IPC Bridge funktional?**  
- [ ] **Transaction State clean?**  
- [ ] **Log Files aktuell?**  

---

## 📝 Standard-SQL-Snippets
*(Platzhalter für SQL-Befehle)*

---

## 🛠️ PowerShell Env & DB-Report
*(Platzhalter für Debugging-Skripte, z. B. `env_report.ps1`)*

---

## 📊 Migrations-Ledger & Checksums
*(Platzhalter für `_migrations` Tabelle & Checksum-Validierung)*

---

## 🚨 Recovery-SOP
*(Standard-Prozess bei Defekten – hier mit Platzhaltern ausfüllen)*

---

## 🛡️ Guard-Skripte in CI
*(Platzhalter für Guards, die projektspezifisch ergänzt werden)*

---

## 🤖 AI-Prompts Mini-Header
🚨 **KI-DEBUGGING REGELN** 🚨  
- ❌ NIEMALS Ergebnisse raten oder annehmen  
- ✅ IMMER Entwickler nach Validierung fragen  
- ✅ Dev vs Prod Environment unterscheiden  
- ✅ PNPM-only (niemals npm/yarn)  
- ✅ Methodisch nach debugging.md vorgehen  
- ✅ Jeden Versuch dokumentieren (auch Failures)  
- ✅ Fakten-basiert, keine Spekulationen  

---

## 🏷️ Failure-Taxonomie (Tags)
*(Platzhalter für standardisierte Tags, z. B. `[PATH-MISCONFIG]`, `[SCHEMA-MISSING]`, …)*

---

## 📋 ADR-Kurzformat
*(Template für Architecture Decision Records mit Platzhaltern)*

---

## ⚡ Start-Assertions beim App-Boot
*(Platzhalter für Invarianten-Checks im main.ts o. Ä.)*

---

## 🔄 Shadow-Write Paritätstest (Dev-only)
*(Platzhalter für ShadowWriteValidator Konzept)*

---

## 🧪 Minimal-Repro Harness
*(Platzhalter für Skript, z. B. `scripts/repro-<thema>.js`)*

---

## 📍 Platzierung & Dateiname

**Diese Datei:** `docs/<bereich>/LESSONS-LEARNED-<thema>.md`  
**Verlinkt von:**  
- `docs/<bereich>.md`  
- `docs/00-standards/debugging.md`  

---

## ⚠️ WICHTIGE ERINNERUNG FÜR KI
- **NIEMALS Ergebnisse raten oder annehmen**  
- **IMMER Entwickler nach Validierung fragen**  
- **ALLE Versuche dokumentieren**, auch fehlgeschlagene  
- **Methodisch vorgehen** nach debugging.md Standards  
