# Lessons Learned – SQLite Persistenz Migration (LocalStorage → IPC)

Diese Datei dokumentiert alle Debugging- und Analyse-Versuche zu diesem Thema.  
Ziel: **KI soll wissen, was bereits probiert wurde, mit welchem Ergebnis**, um Doppelarbeit zu vermeiden.

---

## 📑 Struktur

Jeder Eintrag folgt diesem Schema:

### Versuch <Nummer>
- **Datum:** YYYY-MM-DD  
- **Durchgeführt von:** Entwickler / KI  
- **Beschreibung:** Was wurde getestet oder geändert?  
- **Hypothese:** Erwartetes Ergebnis  
- **Ergebnis:** (muss aktiv beim Entwickler erfragt werden!)  
- **Quelle:** Logs / Screenshots / Chatverlauf / Commit-Hash  

---

## 📝 Beispiel

### Versuch 1
- **Datum:** 2025-09-27  
- **Durchgeführt von:** KI (Codex)  
- **Beschreibung:** Update-System Test → `autoDownload:true` gesetzt, um Verhalten zu prüfen.  
- **Hypothese:** Update lädt automatisch beim Start.  
- **Ergebnis:** [Ergebnis noch nicht eingetragen – bitte Entwickler befragen]  
- **Quelle:** `logs/updater-2025-09-27.txt`, Chat #123  

---

## 🔒 Regeln
- Jeder Versuch **muss eingetragen** werden.  
- **Ergebnisse dürfen nicht geraten** werden → immer Entwickler fragen.  
- Nur Fakten, keine Spekulationen.  
- Keine Redundanzen → Eintrag referenziert ggf. vorherige Versuche.  
- **Vorgehen:** Immer dem [Debugging-Workflow](debugging.md) folgen (Problem definieren, Hypothese aufstellen, Test durchführen etc.).


---

## � Versuche

### Versuch 1
- **Datum:** 2025-09-27  
- **Durchgeführt von:** KI (GitHub Copilot)  
- **Beschreibung:** Vollständige Neuimplementierung des SQLiteAdapter von LocalStorage auf IPC-basierte File-Persistenz. Migration-Logik implementiert, Build erfolgreich, Test-Script validiert Migration.
- **Hypothese:** IPC-basierte File-Persistenz löst das Problem "daten nach neustart alle gelöscht" und behebt UI-Freeze in Leistungsnachweisen.  
- **Ergebnis:** **FEHLGESCHLAGEN** - Trotz erfolgreicher Migration und Build gibt es massive Laufzeit-Fehler (siehe Screenshot): "no such table: offers", "no such table: timesheets", "no such table: customers", etc. SQLiteAdapter lädt zwar Datenbank, aber Tabellen fehlen oder Schema ist inkorrekt.
- **Quelle:** Chat-Session 2025-09-27, Screenshot mit Fehlermeldungen, `src/adapters/SQLiteAdapter.ts`

**❌ KRITISCHER FEHLER:** KI hat vorschnell "ERFOLG" deklariert ohne Entwickler-Feedback abzuwarten. Tests und technische Validierung reichen nicht - nur Benutzer kann bestätigen ob Problem wirklich behoben ist.

---

## 📌 Status
- [x] **Bekannte Fehler:** SQLiteAdapter Schema-Problem - Tabellen existieren nicht trotz Migration  
- [ ] **Offene Fragen:** Warum fehlen Tabellen nach Migration? Legacy-DB-Schema kompatibel mit neuer Implementation?  
- [ ] **Gelöste Probleme:** Keine - ursprüngliches Problem besteht weiterhin
