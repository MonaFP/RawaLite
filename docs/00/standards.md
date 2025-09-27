## 🧠 Methodologie (Systematische Problemlösung)  
In RawaLite wird bei Problemen eine **systematische, evidenzbasierte Vorgehensweise** erwartet. Jeder Fehler wird strukturiert analysiert, statt durch zufälliges Probieren. Wichtige Grundsätze sind: **klare Problemdefinition, reproduzierbare Tests, schrittweises Ändern einzelner Variablen** und gründliche Dokumentation jeder Analyse. Dieses methodische Vorgehen stellt sicher, dass **Ursachen statt Symptome** gefunden werden und verhindert zeitaufwändige Irrwege. *(Details zum Ablauf siehe [Debugging-Workflow](debugging.md).)*

## 🚫 Anti-Patterns bei der Fehlersuche  
Typische Fehlverhaltensmuster, die vermieden werden müssen:  

- **Fehler nicht reproduziert** – Problem wird untersucht, ohne es zuverlässig auszulösen → Ursache und Wirkung bleiben unklar.  
- **Planloses Ausprobieren** – Änderungen vornehmen, ohne **Hypothese** oder Analyse → hoher Zeitverlust durch Zufallsversuche.  
- **Ergebnisse „raten“** – Ein Resultat oder Verhalten wird angenommen, ohne Daten zu überprüfen → falsche Schlussfolgerungen möglich.  
- **Mehrere Änderungen gleichzeitig** – Parallel viele Parameter ändern → unklar, welche Änderung welchen Effekt hatte.  
- **Logs ignorieren** – Vorhandene **Logs, Fehlermeldungen oder Hinweise** nicht gründlich auswerten → wertvolle Anhaltspunkte gehen verloren.  
- **Keine Dokumentation** – Durchgeführte Versuche nicht festhalten → Erkenntnisse gehen verloren und es kommt zu **Doppelarbeit** bei wiederholten Tests.
