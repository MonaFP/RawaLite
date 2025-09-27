# RawaLite v1.8.91 - Verbesserter Update-Launcher-Pfad

## 🔧 Verbesserungen für Update-Launcher

- **📂 Korrekte Ressourcen-Platzierung**: Update-Launcher wird nun korrekt ohne Verschachtelung installiert
- **🔍 Robuste Pfadsuche**: Intelligente Suche nach dem Update-Launcher in mehreren möglichen Pfaden
- **⚙️ Optimierte electron-builder Konfiguration**: Verhindert duplizierte Ressourcen-Dateien

## 🧰 Technische Details

- Verbesserte Ressourcen-Filter in electron-builder.yml zur Vermeidung von Doppel-Kopien
- Implementierung einer Fallback-Strategie für den Launcher-Pfad mit explizitem Logging
- Systematische Suche in allen möglichen Pfaden für maximale Kompatibilität

## 🔄 Warum diese Änderungen wichtig sind

Diese Änderungen sorgen dafür, dass der Update-Prozess zuverlässiger funktioniert, indem der Update-Launcher konsistent und an der richtigen Stelle installiert wird. Die Fallback-Strategie stellt sicher, dass auch bei verschiedenen Installationsszenarien der Launcher gefunden wird.

---

**Release-Datum**: 23. September 2025