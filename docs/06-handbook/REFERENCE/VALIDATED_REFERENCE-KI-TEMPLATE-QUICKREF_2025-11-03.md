# 🎯 KI-Template System - Kurzreferenz Checkliste

> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Quick Reference Creation)  
> **Status:** Reference | **Typ:** Quick Reference  
> **Schema:** `VALIDATED_REFERENCE-KI-TEMPLATE-QUICKREF_2025-11-03.md`

---

## 📋 **LAYER 1 vs LAYER 2 vs LAYER 3 - SCHNELL VERGLEICHEN**

```
┌──────────────┬──────────────────────┬──────────────────┬──────────────────┐
│ ASPEKT       │ LAYER 1              │ LAYER 2           │ LAYER 3          │
│              │ GLOBAL INSTRUCTIONS  │ SESSION BRIEFING  │ SESSION-START    │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ DATEI        │ copilot-             │ KI-SESSION-       │ VALIDATED_       │
│              │ instructions.md      │ BRIEFING.         │ TEMPLATE-        │
│              │                      │ prompt.md         │ SESSION-START    │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ PFAD         │ .github/             │ .github/prompts/  │ docs/06-handbook/│
│              │ instructions/        │                   │ TEMPLATE/        │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ SCOPE        │ **GLOBAL**           │ **PER SESSION**   │ **INDIVIDUAL**   │
│              │ Alle Sessions        │ Task-Typ-Vorlage  │ Diese Session    │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ WANN LESEN   │ **AUTO beim Start**   │ **VOR JEDER NEW   │ **AM SESSION     │
│              │ (Copilot loads)      │ SESSION**         │ START** (Kopieren)
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ WAS IST      │ Projektregeln        │ Task-Typ          │ Session-Kontext  │
│              │ (unveränderlich)     │ Checklisten       │ (Protokoll)      │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ FORMAT       │ **READ-ONLY**        │ **COPY-PASTE**    │ **AUSFÜLLBAR**   │
│              │ (Locked)             │ Template          │ (Platzhalter)    │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ BEISPIELE    │ Critical Fixes,      │ Development,      │ Session-Datum,   │
│              │ PATHS-System,        │ Database,         │ Betroffene       │
│              │ Anti-Patterns        │ UI, Release,      │ Dateien,         │
│              │                      │ Theme, Debug      │ Scope, Logs      │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ ÄNDERUNGEN   │ Nur von Dev         │ Nur von Dev       │ KI + Dev ausfüllen
│              │ (LOCKED!)           │ (bei neuen Rules) │ pro Session      │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ LÄNGE        │ **LANG** (~550 Z.)   │ **SEHR LANG**      │ **MITTEL**       │
│              │                      │ (~800 Zeilen)     │ (~170 Zeilen)    │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ AKTUALISIERUNG│ SELTEN              │ OFT               │ PRO SESSION      │
│ Kadenz       │ Bei Major Changes   │ Bei New Patterns  │ (immer neu)      │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ KI-VERHALTEN │ **ENFORCE**          │ **GUIDE**         │ **DOCUMENT**     │
│              │ (Must obey)          │ (Should follow)   │ (Should track)   │
├──────────────┼──────────────────────┼──────────────────┼──────────────────┤
│ HIERARCHIE   │ **TOP** (Basis)      │ **MIDDLE**        │ **BOTTOM** (Use) │
│              │                      │ (Verbindung)      │                  │
└──────────────┴──────────────────────┴──────────────────┴──────────────────┘
```

---

## ✅ **WANN WELCHEN LAYER NUTZEN?**

### **Frage: "Wo finde ich die Information?"**

| Frage | Antwort | Layer |
|:--|:--|:--|
| Darf ich npm verwenden? | Nein, nur PNPM | Layer 1 |
| Was checke ich VOR einer Development-Session? | [Layer 2 Development-Variante] | Layer 2 |
| Welche Dateien change ich DIESE Session? | [In Layer 3 Scope eintragen] | Layer 3 |
| Wie vermeide ich Critical Fixes zu brechen? | [Layer 1 lesen] | Layer 1 |
| Was sind die Varianten der Session Briefing? | 7 Typen: Dev/DB/UI/Release/Theme/Debug/General | Layer 2 |
| Wie dokumentiere ich diese Session? | [Layer 3 ausfüllen] | Layer 3 |
| Welche Patterns sind verboten? | [Layer 1 Anti-Patterns] | Layer 1 |
| Wie validiere ich vor Release? | `pnpm safe:version` + `validate:critical-fixes` | Layer 1 |

---

## 🔄 **ABLAUF BEI NEUER SESSION**

```
1️⃣ KI-Session startet
   ↓
2️⃣ Layer 1 wird AUTOMATISCH geladen
   ├─ Copilot liest: copilot-instructions.md
   ├─ Regeln sind bindend
   └─ KI kennt: Critical Fixes, Patterns, Regeln
   ↓
3️⃣ KI identifiziert Task-Typ
   ├─ "Ist das Development/DB/UI/Release/Theme/Debug?"
   ↓
4️⃣ KI lädt Layer 2 (SESSION BRIEFING)
   ├─ Kopiert relevante Variante
   ├─ Zeigt Checklisten für diesen Task-Typ
   └─ KI zeigt: "Hier sind die Vorbereitungs-Schritte"
   ↓
5️⃣ Developer + KI füllen Layer 3 aus
   ├─ Copy: VALIDATED_TEMPLATE-SESSION-START
   ├─ Ersetzen: Platzhalter [DATUM], [ZIEL], [DATEIEN]
   ├─ Abhaken: Pre-Session Checklist
   └─ Speichern: [SESSION_NAME]-2025-11-03.md
   ↓
6️⃣ Session läuft
   ├─ Befolgt: Layer 1 Regeln
   ├─ Nutzt: Layer 2 Checklisten
   └─ Dokumentiert: Layer 3 Protokoll (Live ausfüllen!)
   ↓
7️⃣ Session endet
   ├─ Layer 3 aktualisiert: Lessons Learned hinzufügen
   ├─ Als COMPLETED_IMPL oder SOLVED_FIX speichern
   └─ Zukünftige Sessions lernen davon!
```

---

## 📝 **TEMPLATE-AUSWAHL ENTSCHEIDUNGSBAUM**

```
Neue KI-Session? 
├─→ Programmierung/Code-Änderung?
│   ├─→ Normale Development? ➜ [LAYER 2: Development-Variante]
│   ├─→ Database/Migration? ➜ [LAYER 2: Database-Variante]
│   ├─→ UI/Frontend? ➜ [LAYER 2: UI-Variante]
│   └─→ Theme-System? ➜ [LAYER 2: Theme-Variante]
│
├─→ Release/Deployment?
│   └─→ [LAYER 2: Release-Variante]
│
├─→ Debugging/Troubleshooting?
│   └─→ [LAYER 2: Debug-Variante]
│
└─→ Allgemein/Unbekannt?
    └─→ [LAYER 2: Standard-Variante]

DANN: Kopiere LAYER 3 Template + Fülle aus!
```

---

## 🚀 **COPY-PASTE BEFEHLE FÜR LAYER-START**

### **Option 1: Vollständiger Workflow (Empfohlen)**
```powershell
# 1. LAYER 1 lesen (automatisch, aber zur Sicherheit)
code .github/instructions/copilot-instructions.md

# 2. LAYER 2 öffnen (richtige Variante wählen)
code .github/prompts/KI-SESSION-BRIEFING.prompt.md

# 3. LAYER 3 Template kopieren
Copy-Item `
  -Path "docs/06-handbook/TEMPLATE/VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md" `
  -Destination "docs/08-batch/sessions/DEVELOPMENT-2025-11-03-THEME-UPDATE.md"

# 4. Platzhalter ausfüllen
code "docs/08-batch/sessions/DEVELOPMENT-2025-11-03-THEME-UPDATE.md"
```

### **Option 2: Nur Layer 2 + 3 (Schnell)**
```powershell
# Layer 2 schnell ansehen + Layer 3 Template kopieren
code .github/prompts/KI-SESSION-BRIEFING.prompt.md

Copy-Item `
  -Path "docs/06-handbook/TEMPLATE/VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md" `
  -Destination "docs/08-batch/sessions/[TASK_TYPE]-$(Get-Date -Format 'yyyy-MM-dd')-[KÜRZEL].md"
```

---

## ⚠️ **HÄUFIGE FEHLERVERSTÖSSE**

| Fehler | Symptom | Lösung |
|:--|:--|:--|
| Layer 1 ignorieren | Code verletzt Critical Fixes | Immer Layer 1 zuerst! |
| Layer 2 auslassen | Irrelevante Checkliste | Task-Typ Layer 2 wählen |
| Layer 3 nicht ausfüllen | Session keine Dokumentation | Template kopieren + ausfüllen |
| Alte Layer3-Vorlage | Veraltete Checklisten | Immer aktuelle Version verwenden |
| Varianten vermischen | Widersprüchliche Guidelines | NUR 1 Layer 2-Variante pro Session |

---

## 📊 **COMPLIANCE CHECK - Bin ich Layer-Konform?**

```
🔍 Session Validierung:

Layer 1 ✅?
 └─ Habe ich copilot-instructions.md beachtet?
    ├─ Critical Fixes erhalten?
    ├─ Paths System beachtet?
    └─ Anti-Patterns vermieden?

Layer 2 ✅?
 └─ Habe ich richtige Briefing-Variante verwendet?
    ├─ Für meinen Task-Typ?
    ├─ Checklisten durchgegangen?
    └─ Abhaken dokumentiert?

Layer 3 ✅?
 └─ Habe ich Session-Template ausgefüllt?
    ├─ Alle [PLATZHALTER] ersetzt?
    ├─ Session Log dokumentiert?
    └─ Lessons Learned hinzugefügt?

Alle 3 ✅? → Session VALID! 🎉
Einzelne ❌? → Nicht konform - Layer wiederholen!
```

---

## 📚 **Quick Links - Alle 3 Layer**

| Layer | Datei | Pfad |
|:--|:--|:--|
| **1** | copilot-instructions.md | `.github/instructions/` |
| **2** | KI-SESSION-BRIEFING.prompt.md | `.github/prompts/` |
| **3** | VALIDATED_TEMPLATE-SESSION-START | `docs/06-handbook/TEMPLATE/` |

---

**Kurz gesagt:**

- **Layer 1:** "Was darf ich NICHT tun?" → Regeln (Global)
- **Layer 2:** "Was muss ich TUN?" → Checklisten (Task-spezifisch)
- **Layer 3:** "WAS MACHE ICH GERADE?" → Protokoll (Diese Session)

**Alle 3 zusammen = KI-Session erfolgreich!** ✅
