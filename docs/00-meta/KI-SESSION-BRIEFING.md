# 🤖 KI-Session Briefing - Copy & Paste Template

**⚠️ WICHTIG: Verwende dieses Briefing für JEDE neue KI-Session!**

---

## 📋 Standard-Briefing für neue GitHub Copilot Sessions

```
🚨 KRITISCHE ANWEISUNG - SOFORT LESEN:

Bitte lese ZUERST und VOLLSTÄNDIG diese Dokumente, bevor du irgendwelche Code-Änderungen machst:

1. docs/00-meta/CRITICAL-FIXES-REGISTRY.md (ABSOLUT KRITISCH!)
2. docs/00-meta/INSTRUCTIONS-KI.md 
3. .github/copilot-instructions.md

DANN folge der optimalen Lesereihenfolge aus docs/00-meta/DOCUMENTATION-STRUCTURE-GUIDE.md

⛔ NIEMALS Code editieren ohne diese Dokumente gelesen zu haben!
⛔ NIEMALS kritische Fixes aus CRITICAL-FIXES-REGISTRY.md entfernen!
⛔ IMMER vor Version-Changes: pnpm validate:critical-fixes ausführen!

Bei Unsicherheit: Frag nach und validiere zuerst!
```

---

## 📝 Erweiterte Briefing-Varianten

### 🔧 Für Development-Tasks:
```
Neue KI-Session für Development:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen  
3. Dann: docs/03-development/INDEX.md + docs/01-standards/INDEX.md
4. Bei Code-Änderungen: pnpm validate:critical-fixes vor jedem Commit

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🗄️ Für Database/Backend-Tasks:
```
Neue KI-Session für Database/Backend:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen
3. Dann: docs/05-database/INDEX.md + docs/06-paths/INDEX.md + docs/07-ipc/INDEX.md
4. Immer: pnpm validate:critical-fixes vor Änderungen

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🎨 Für UI/Frontend-Tasks:
```
Neue KI-Session für UI/Frontend:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen
3. Dann: docs/08-ui/INDEX.md + docs/07-ipc/INDEX.md
4. Standards: docs/01-standards/INDEX.md beachten

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🚀 Für Release/Deployment-Tasks:
```
Neue KI-Session für Release/Deployment:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen
3. Dann: docs/11-deployment/INDEX.md + docs/10-security/INDEX.md
4. ZWINGEND: pnpm validate:pre-release vor jedem Release
5. ZWINGEND: pnpm validate:release-assets vX.X.X nach Release-Erstellung
6. Verwende: pnpm safe:version statt pnpm version
7. MANDATORY: Verify gh release view vX.X.X --json assets shows assets!

Task-Kontext: [DEINE AUFGABE HIER EINFÜGEN]
```

### 🐛 Für Debugging/Troubleshooting:
```
Neue KI-Session für Debugging:

1. PFLICHT: docs/00-meta/CRITICAL-FIXES-REGISTRY.md lesen
2. PFLICHT: docs/00-meta/INSTRUCTIONS-KI.md lesen
3. Dann: docs/00-meta/TROUBLESHOOTING.md + docs/12-lessons/INDEX.md
4. Prüfe: Sind bekannte Fixes noch vorhanden?
5. Validiere: pnpm validate:critical-fixes

Problem-Kontext: [DEIN PROBLEM HIER EINFÜGEN]
```

---

## 🎯 Quick-Validation Commands

```bash
# Vor jeder Code-Änderung:
pnpm validate:critical-fixes

# Vor Documentation-Änderungen:
pnpm validate:docs-structure

# Vor Releases:
pnpm validate:pre-release

# Nach Release-Erstellung:
pnpm validate:release-assets vX.X.X

# Sichere Version-Befehle:
pnpm safe:version patch
pnpm safe:dist
```

---

## 🚨 Emergency Stop Conditions

**SOFORT STOPPEN wenn:**
- ❌ Critical pattern aus REGISTRY fehlt
- ❌ Validation script fehlschlägt  
- ❌ Anti-patterns entdeckt
- ❌ WriteStream.end() ohne Promise wrapper
- ❌ Multiple process.on('close') handlers
- ❌ Port-Änderungen von 5174 in dev
- ❌ Release ohne Assets: {"assets": []} ← VERURSACHT "Failed to parse URL from" ERROR!

**Bei Zweifel:** Fragen, nicht raten!

---

## 📚 Vollständige Dokumentations-Reihenfolge

### Phase 1: Kritische Grundlagen (PFLICHT)
1. `docs/00-meta/CRITICAL-FIXES-REGISTRY.md`
2. `docs/00-meta/INSTRUCTIONS-KI.md`
3. `.github/copilot-instructions.md`

### Phase 2: Projekt-Orientierung
4. `docs/00-meta/DOCUMENTATION-STRUCTURE-GUIDE.md`
5. `docs/00-meta/ONBOARDING-GUIDE.md`
6. `docs/01-standards/INDEX.md`
7. `docs/02-architecture/INDEX.md`

### Phase 3: Task-abhängig
- Development: `docs/03-development/` + `docs/04-testing/`
- Database: `docs/05-database/` + `docs/06-paths/`
- UI: `docs/08-ui/` + `docs/07-ipc/`
- Security: `docs/10-security/`
- Deployment: `docs/11-deployment/`

### Phase 4: Deep-Dive
- `docs/12-lessons/INDEX.md`
- `docs/00-meta/TROUBLESHOOTING.md`

---

## ✅ Session-Erfolg Checkliste

- [ ] Kritische Dokumente vollständig gelesen
- [ ] Task-spezifische Dokumentation durchgegangen
- [ ] Validation-Commands erfolgreich ausgeführt
- [ ] Alle Änderungen validiert
- [ ] Keine Anti-patterns eingeführt
- [ ] Fix-preservation bestätigt

---

**📌 Diese Datei immer aktuell halten bei Struktur-Änderungen!**

*Letzte Aktualisierung: 2025-10-03*