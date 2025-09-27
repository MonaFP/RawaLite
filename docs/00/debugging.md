# RawaLite – Debugging-Workflow (Safe Edition)  

Dieses Dokument beschreibt den empfohlenen **Ablauf zur Fehlersuche** in RawaLite. Durch einen strukturierten Workflow werden Probleme effizient, reproduzierbar und faktenbasiert gelöst. Jede Analyse soll den unten definierten Schritten folgen, um Zufallsfunde und Fehlversuche zu vermeiden.

WICHTIG – NICHT VERHANDELBAR
In diesem Projekt gelten die RawaLite Coding Instructions als unveränderliche Referenz-Dokumente.

Du darfst keine Änderungen an PROJECT_OVERVIEW.md, RawaLite – AI Coding Instructions oder anderen Projekt-Dokumenten vornehmen.

Du darfst die Instruktionen nicht kürzen, umschreiben, interpretieren oder in anderes Format bringen.

Wenn du in Konflikt mit diesen Instruktionen kommst: nicht improvisieren, sondern sofort nachfragen.

Dein Fokus liegt ausschließlich auf Code-Änderungen, Bugfixes, Tests und Umsetzung innerhalb bestehender Patterns.

Die Dokumentation ist Read-Only und darf von dir niemals verändert oder überschrieben werden.

Bestätige bitte jedes Mal, dass du die Dokumentation nicht angepasst hast.

## Systematischer Problemlösungsprozess (Safe Edition)

Dieser Ansatz ist **verbindlicher Standard** für alle Debugging- und Problemlösungsaufgaben in RawaLite.  
Er basiert auf den Lessons Learned vom 15. September 2025 und ist Teil der Safe Edition.

### Vier Prinzipien (Do’s)
1. **Documentation-First**  
   Immer zuerst die relevante Dokumentation und Regeln lesen. Kein Einstieg ins Code-Hacking ohne Doku-Basis.
2. **Data-First**  
   Entscheidungen erst nach vollständiger Datensammlung (Logs, Status, Configs). Keine Lösungen aus Bauchgefühl.
3. **Simple-First**  
   Zuerst die einfachste funktionierende Lösung umsetzen. Komplexität nur, wenn nötig.
4. **Existing-First**  
   Bestehende Prozesse, Tools und Guards nutzen, bevor etwas Neues erfunden wird.

### Anti-Patterns (Don’ts)
- ❌ Code-First Debugging (Code öffnen ohne Doku/Analyse)  
- ❌ Solution-First Design (Lösung entwerfen ohne Datenlage)  
- ❌ Complex-First Implementation (Over-Engineering)  
- ❌ Invention-First Approach (Neuentwicklung trotz vorhandener Tools)

### Zero-Tolerance & DoD
Dieser Prozess gilt **für alle Probleme**, auch vermeintlich kleine.  
Kein Schritt darf übersprungen oder als „nicht kritisch“ abgetan werden.

**Definition of Done (DoD):**
- `pnpm typecheck` → 0 Fehler  
- `pnpm lint --max-warnings=0` → 0 Fehler/Warnungen  
- Alle Guards (`guard:external`, `guard:pdf`, `validate:ipc`, `validate:versions`, `guard:todos`, `validate:esm`) → grün  
- `pnpm test --run` → alle Tests grün und deterministisch  
- **Keine** Verstöße (`require`, `module.exports`, `window.open`, `target="_blank"`, `shell.openExternal`, `http(s)://`, `TODO/FIXME/HACK`) in Code oder Templates



## 🔄 Debugging-Workflow  
Der folgende Workflow stellt sicher, dass Probleme systematisch angegangen werden:  

** Zuerst: überprüfen, ob es das Problem bereits gab und schonmal behoben wurde.**

1. **Problem definieren & reproduzieren:** Fehlerbild klar beschreiben und zuverlässig reproduzierbar machen (Testfall erstellen).  
2. **Informationen sammeln:** Relevante **Logs**, Einstellungen und Umgebungsdaten erfassen; Ist- und Soll-Verhalten vergleichen.  
3. **Hypothese aufstellen:** Auf Basis der Fakten eine plausible **Ursachenannahme** formulieren (worin könnte das Problem begründet sein?).  
4. **Test planen:** Einen gezielten **Versuch** entwerfen, um die Hypothese zu überprüfen – **nur eine Variable ändern** bzw. einen isolierten Fix/Workaround vorbereiten.  
5. **Test durchführen:** Den geplanten Versuch ausführen und das Systemverhalten beobachten. **Keine parallelen Änderungen**, um den Effekt eindeutig zuzuordnen.  
6. **Ergebnis auswerten:** Resultat des Tests analysieren. Wurde die Hypothese **bestätigt oder widerlegt**? Befunde festhalten (z. B. in Form von Logs, Screenshots).  
7. **Iterieren oder abschließen:** Falls die Hypothese falsch war, aus den neuen Erkenntnissen eine nächste Hypothese ableiten und Schritt 4–6 wiederholen. Trifft die Hypothese zu, zur Fehlerbehebung übergehen.  
8. **Lösung verifizieren & dokumentieren:** Sobald die **Root Cause** feststeht, dauerhafte Korrektur implementieren. Anschließend den Fix testen, um den Erfolg zu bestätigen. Alle durchgeführten Versuche und Schlussfolgerungen im **Lessons Learned** Dokument zum Thema festhalten.

## 📋 Checkliste (Debugging)  
* [ ] **Fehler reproduziert** – Problem tritt verlässlich in einer Testumgebung auf.  
* [ ] **Logs analysiert** – Wichtige Log-Einträge, Fehlermeldungen und Systemzustände geprüft.  
* [ ] **Hypothese gebildet** – Mögliche Ursache basierend auf Fakten formuliert.  
* [ ] **Gezielter Test durchgeführt** – Eine einzelne Änderung/ Maßnahme zur Überprüfung umgesetzt.  
* [ ] **Ergebnis bewertet** – Ausgang des Tests untersucht (Hypothese bestätigt oder verworfen?).  
* [ ] **Versuch dokumentiert** – Durchgeführte Tests und Befunde schriftlich festgehalten (Lessons Learned Eintrag).  
* [ ] **Ursache gefunden** – Falls nein: neue Hypothese und nächster Test geplant; falls ja: Fix implementiert und Erfolg geprüft.
* [ ] **Ergebnisse dürfen nicht geraten** werden → immer Entwickler fragen.  
* [ ] Nur Fakten, keine Spekulationen.  
* [ ] Keine Redundanzen 