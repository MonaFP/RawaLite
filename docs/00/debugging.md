# RawaLite – Debugging-Workflow (Safe Edition)  

Dieses Dokument beschreibt den empfohlenen **Ablauf zur Fehlersuche** in RawaLite. Durch einen strukturierten Workflow werden Probleme effizient, reproduzierbar und faktenbasiert gelöst. Jede Analyse soll den unten definierten Schritten folgen, um Zufallsfunde und Fehlversuche zu vermeiden.

## 🔄 Debugging-Workflow  
Der folgende Workflow stellt sicher, dass Probleme systematisch angegangen werden:  

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
