# 🔧 Troubleshooting Guide - Fix Preservation System

> **Problemlösungen für das Critical Fix Preservation System**  
> **Erstellt:** 2025-10-03 | $12025-10-17 (Content modernization + ROOT_ integration)| **Status:** Production Ready

---

## 🎯 **Übersicht**

Dieser Guide hilft bei der Lösung von Problemen mit dem **Fix-Preservation System** und erklärt häufige Fehlerszenarien.

## 🚨 **Häufige Probleme & Lösungen**

### **Problem 1: Pre-commit Hook blockiert Commit**

**Fehlermeldung:**
```bash
🚨 COMMIT BLOCKED: Critical fixes validation failed!

📋 Required actions:
  1. Check CRITICAL_FIXES (see PATHS.md)
  2. Restore missing critical patterns
  3. Run: pnpm validate:critical-fixes
  4. Try commit again

> **📋 Vollständige Dokumentation:** Siehe [../../INDEX.md](../../INDEX.md) für alle verfügbaren Ressourcen.
```

**Diagnose:**
```bash
# Detaillierte Validation ausführen:
pnpm validate:critical-fixes

# Zeigt genau welche Patterns fehlen
```

**Lösungsschritte:**
1. **Validation Output analysieren:**
   ```bash
   ❌ MISSING: Critical pattern not found!
   📋 Expected pattern: await new Promise<void>((resolve, reject) => {
   ```

2. **Registry checken:**
   - Öffne: `CRITICAL_FIXES` (see PATHS.md)
   - Suche das fehlende Pattern
   - Verstehe den Kontext

3. **Pattern wiederherstellen:**
   ```typescript
   // ❌ FALSCH (Anti-Pattern):
   writeStream.end();
   
   // ✅ RICHTIG (Required Pattern):
   await new Promise<void>((resolve, reject) => {
     writeStream.end((error?: Error) => {
       if (error) {
         reject(error);
       } else {
         resolve();
       }
     });
   });
   ```

4. **Validation wiederholen:**
   ```bash
   pnpm validate:critical-fixes  # Muss ✅ sein
   git commit -m "..."          # Retry commit
   ```

---

### **Problem 2: Validation Script schlägt fehl**

**Fehlermeldung:**
```bash
❌ ERROR: Could not read file - ENOENT: no such file or directory
```

**Mögliche Ursachen:**
- Datei wurde umbenannt/verschoben
- Pattern ist in andere Datei migriert
- Registry ist veraltet

**Lösungsschritte:**

1. **Datei-Existenz prüfen:**
   ```bash
   # Datei suchen:
   find . -name "GitHubApiService.ts" -type f
   # oder Windows:
   Get-ChildItem -Recurse -Name "*GitHubApiService*"
   ```

2. **Pattern in Codebase suchen:**
   ```bash
   # Pattern suchen:
   grep -r "writeStream.end" src/
   # oder Windows:
   Select-String -Path "src\**\*.ts" -Pattern "writeStream.end"
   ```

3. **Registry aktualisieren:**
   - Falls Datei verschoben: Pfad in Registry korrigieren
   - Falls Pattern migriert: Neue Datei in Registry hinzufügen

---

### **Problem 3: Tests schlagen fehl**

**Fehlermeldung:**
```bash
❌ CRITICAL: WriteStream Promise Pattern in GitHubApiService
   Expected: /await new Promise<void>/
   Received: "writeStream.end();"
```

**Diagnose:**
Das kritische Pattern wurde durch Refactoring entfernt.

**Lösungsschritte:**

1. **Git History checken:**
   ```bash
   # Letzten funktionierenden Commit finden:
   git log --oneline -p src/main/services/GitHubApiService.ts
   
   # Pattern in History suchen:
   git log -S "await new Promise<void>" -- src/main/services/GitHubApiService.ts
   ```

2. **Pattern aus Registry wiederherstellen:**
   ```typescript
   // Original Pattern aus CRITICAL-FIXES-REGISTRY.md:
   await new Promise<void>((resolve, reject) => {
     writeStream.end((error?: Error) => {
       if (error) {
         reject(error);
       } else {
         resolve();
       }
     });
   });
   ```

3. **Test wiederholen:**
   ```bash
   pnpm test:critical-fixes
   ```

---

### **Problem 4: Hook läuft nicht**

**Symptom:**
Commit geht durch ohne Validation.

**Mögliche Ursachen:**
- Git Hooks deaktiviert
- Hook-Dateien fehlen/falsche Permissions
- Git config Problem

**Lösungsschritte:**

1. **Hook-Existenz prüfen:**
   ```bash
   # Linux/Mac:
   ls -la .git/hooks/pre-commit*
   
   # Windows:
   Get-ChildItem .git\hooks\pre-commit*
   ```

2. **Hook manuell testen:**
   ```bash
   # Linux/Mac:
   .git/hooks/pre-commit
   
   # Windows:
   .git/hooks/pre-commit.cmd
   ```

3. **Git config prüfen:**
   ```bash
   git config --get core.hooksPath
   # Sollte: .git/hooks (oder leer)
   
   # Falls falsch:
   git config core.hooksPath .git/hooks
   ```

4. **Hook wiederherstellen:**
   ```bash
   # Windows:
   copy docs\templates\pre-commit.cmd .git\hooks\
   
   # Linux/Mac:  
   cp docs/templates/pre-commit .git/hooks/
   chmod +x .git/hooks/pre-commit
   ```

---

## 🛠️ **Erweiterte Troubleshooting**

### **Problem: Validation Script ist kaputt**

**Notfall-Bypass (nur temporär!):**
```bash
# Hook temporär deaktivieren:
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled

# Commit durchführen:
git commit -m "emergency fix"

# Hook wieder aktivieren:
mv .git/hooks/pre-commit.disabled .git/hooks/pre-commit
```

**⚠️ ACHTUNG:** Nur im Notfall verwenden! Sofort danach:
1. Problem beheben
2. Hook wieder aktivieren  
3. Validation manuell nachprüfen

### **Problem: Unbekanntes Pattern**

**Wenn Registry Pattern nicht verstanden wird:**

1. **Git Blame für Kontext:**
   ```bash
   git blame src/main/services/GitHubApiService.ts
   # Zeigt wer das Pattern eingefügt hat
   ```

2. **Commit Message suchen:**
   ```bash
   git log --grep="WriteStream" --oneline
   git log --grep="race condition" --oneline
   ```

3. **Team fragen:**
   - Senior Developer konsultieren
   - GitHub Issue/PR History checken
   - Documentation Review

### **Problem: Pattern ist veraltet**

**Wenn kritisches Pattern nicht mehr benötigt wird:**

1. **NIEMALS einfach entfernen!**
2. **Team-Review einberufen**
3. **Begründung dokumentieren**
4. **Registry-Update mit Approval**
5. **Validation Script anpassen**

**Workflow für Pattern-Removal:**
```bash
# 1. Issue erstellen:
gh issue create --title "Remove obsolete critical pattern: XYZ"

# 2. Branch erstellen:
git checkout -b remove-pattern-xyz

# 3. Pattern dokumentieren warum obsolet
# 4. Tests für neue Lösung
# 5. Registry Update
# 6. Team Review
# 7. Merge nur nach Approval
```

---

## 📊 **Debugging Commands**

### **System Status checken:**
```bash
# Alle kritischen Patterns prüfen:
pnpm validate:critical-fixes

# Regression Tests:
pnpm test:critical-fixes

# Git Hook testen:
.git/hooks/pre-commit.cmd  # Windows
.git/hooks/pre-commit      # Linux/Mac

# Gesamte Test Suite:
pnpm test
```

### **Pattern-Suche in Codebase:**
```bash
# Spezifisches Pattern finden:
grep -r "await new Promise<void>" src/

# Alle writeStream Verwendungen:
grep -r "writeStream" src/ --include="*.ts"

# Anti-Pattern suchen:
grep -r "writeStream\.end()" src/ --include="*.ts"
```

### **File-System Status:**
```bash
# Registry Inhalt:
cat $(CRITICAL_FIXES)  # see PATHS.md for path

# Hook Status:
cat .git/hooks/pre-commit.cmd

# Package Scripts:
grep -A5 -B5 "validate:critical-fixes" package.json
```

---

## 🆘 **Notfall-Kontakte**

### **Bei kritischen Problemen:**

1. **Sofortmaßnahmen:**
   - Commit NICHT forcieren
   - Hook NICHT deaktivieren  
   - Pattern NICHT "reparieren"

2. **Team kontaktieren:**
   - Senior Developer: [Name]
   - System Architect: [Name]
   - Team Lead: [Name]

3. **Issue erstellen:**
   ```bash
   gh issue create --title "🚨 Critical Fix Validation Problem" \
     --body "Hook/Validation failing, need immediate help"
   ```

### **Escalation Path:**
1. **Level 1:** Team Member Review
2. **Level 2:** Senior Developer  
3. **Level 3:** System Architect
4. **Level 4:** Emergency Bypass (dokumentiert!)

---

## 📚 **Weiterführende Links**

- **[CRITICAL-FIXES-REGISTRY.md](CRITICAL-FIXES-REGISTRY.md)** - Alle kritischen Patterns
- **[ONBOARDING-GUIDE.md](ONBOARDING-GUIDE.md)** - Setup für neue Entwickler
- **[INSTRUCTIONS-KI.md](INSTRUCTIONS-KI.md)** - KI-Guidelines
- **[GitHub Issues](https://github.com/MonaFP/RawaLite/issues)** - Bekannte Probleme

---

**Remember:** Kritische Fixes sind kritisch aus gutem Grund. Im Zweifel: Team fragen! 🚀
