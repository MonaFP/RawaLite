# Lessons Learned – PDF Logo & Field Mapping Issues

Diese Datei dokumentiert alle Debugging- und Analyse-Versuche zu PDF-Logo-Darstellung und Field-Mapping-Problemen.  
Ziel: **KI soll wissen, was bereits probiert wurde, mit welchem Ergebnis**, um Doppelarbeit zu vermeiden.

---

## 📑 Struktur
---
id: LL-PDF-001
bereich: electron/main.ts + src/lib/field-mapper.ts
status: open
schweregrad: medium
scope: both
build: app=1.0.13 electron=31.7.7
schema_version_before: 14
schema_version_after: 14
db_path: C:\Users\ramon\AppData\Roaming\rawalite\database\rawalite.db
reproduzierbar: yes
artefakte: [pdf-template-code, field-mapping-changes]
---

## 🧪 Versuche

### Versuch 1 - App-Icon Fix
- **Datum:** 2025-10-04  
- **Durchgeführt von:** KI  
- **Beschreibung:** BrowserWindow icon-Property hinzugefügt, assets-Ordner erstellt, extraResources konfiguriert
- **Hypothese:** Icon sollte in Taskbar/Window erscheinen
- **Ergebnis:** FEHLGESCHLAGEN - Kein Logo sichtbar (vom Entwickler bestätigt)
- **Quelle:** electron/main.ts Zeile ~25, electron-builder.yml
- **Problem:** Icon-Pfad möglicherweise falsch oder Electron cache

### Versuch 2 - PDF Template Unifikation
- **Datum:** 2025-10-04  
- **Durchgeführt von:** KI  
- **Beschreibung:** Inline body-header entfernt, headerTemplate/footerTemplate für alle PDFs
- **Hypothese:** Einheitliche PDF-Struktur mit Logo für Rechnungen/Leistungsnachweise
- **Ergebnis:** FEHLGESCHLAGEN - PDF-Logo nicht sichtbar (vom Entwickler bestätigt)
- **Quelle:** electron/main.ts Zeile ~1107, headerTemplate ab Zeile ~495
- **Problem:** Template-System möglicherweise nicht korrekt angewendet

### Versuch 3 - Field Mapping Vervollständigung
- **Datum:** 2025-10-04  
- **Durchgeführt von:** KI  
- **Beschreibung:** overdueAt, cancelledAt, sentAt, acceptedAt, rejectedAt mappings hinzugefügt
- **Hypothese:** Angebots-Status Dropdown sollte funktionieren
- **Ergebnis:** FEHLGESCHLAGEN - Status-Änderungen funktionieren nicht (vom Entwickler bestätigt)
- **Quelle:** src/lib/field-mapper.ts
- **Problem:** Möglicherweise andere Mapping-Probleme oder Cache-Issues

## 📌 Status
- [ ] **App-Icon:** Noch nicht sichtbar
- [ ] **PDF-Logo:** Rechnungen zeigen noch kein Logo  
- [ ] **Angebots-Status:** Dropdown noch nicht funktional

## 🔍 Nächste Debugging-Schritte

1. **App-Icon Debug:**
   - Icon-Pfad in Development vs Production prüfen
   - Electron cache leeren
   - Alternative Icon-Formate testen

2. **PDF-Logo Debug:**
   - Aktuellen PDF-Output inspizieren
   - headerTemplate HTML direkt testen
   - Logo-Daten-Flow von Settings verfolgen

3. **Field-Mapping Debug:**  
   - Database-Update Queries loggen
   - Frontend-Backend-Kommunikation prüfen
   - Console-Logs in AngebotePage.tsx auswerten

## 🚨 Entwickler-Feedback erforderlich

**CRITICAL:** Alle bisherigen Fixes scheinen fehlgeschlagen zu sein. 
Benötige Feedback zu:
1. Ist das App-Icon jetzt sichtbar? (In Taskbar/Window)
2. Zeigen Rechnung-PDFs jetzt das Logo im Header?
3. Funktioniert das Angebots-Status-Dropdown?
4. Gibt es Console-Logs/Fehlermeldungen?

## 🛠️ PowerShell Debug Commands

```powershell
# App neu starten für Icon-Test
pnpm run dev

# PDF-Generation mit Debug-Output
# (Rechnung erstellen und PDF generieren)

# Console-Logs prüfen in DevTools
# F12 → Console → Angebot-Status ändern versuchen
```

---

## 🤖 AI-Prompts Mini-Header
🚨 **KI-DEBUGGING REGELN** 🚨  
- ❌ NIEMALS Ergebnisse raten oder annehmen  
- ✅ IMMER Entwickler nach Validierung fragen  
- ✅ Systematisch Problem für Problem angehen
- ✅ Faktisch dokumentieren was nicht funktioniert
- ✅ Nächste Debugging-Schritte konkret planen