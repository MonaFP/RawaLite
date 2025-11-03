# ❌ KI Mistakes - Anti-Pattern Prevention

> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 03.11.2025 (Code-Verification Update - KI Mistakes Anti-Patterns validation)  
> **Status:** Anti-Pattern Guide | **Typ:** Session-Killer Prevention  
> **Schema:** `VALIDATED_ANTIPATTERN-KI-MISTAKES_2025-10-26.md`  
> **Source:** ../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md + Consolidated KI failure modes

## 🤖 **KI-AUTO-DETECTION SYSTEM**

**🎯 STATUS DETECTION KEYWORDS:**
- `Anti-Pattern Guide` → **PREVENTION-CRITICAL** - Session-killer Prevention Rules
- `Session-Killer Prevention` → **ERROR-PREVENTION** - Critical mistake avoidance
- `MANDATORY READ` → **COMPLIANCE-REQUIRED** - Zwingend einzuhalten  
- `NIEMALS wiederholen` → **ABSOLUTE-FORBIDDEN** - Zero-tolerance patterns

**📖 TEMPLATE SOURCE:** [VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md](../TEMPLATE/VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md)  
**🔄 AUTO-UPDATE TRIGGER:** Neue Anti-Pattern entdeckt, Session-Killer-Fehler dokumentiert  
**🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
- ✅ **ANTI-PATTERN-GUARD:** Erkenne und verhindere dokumentierte Fehler aktiv
- ✅ **SESSION-PROTECTION:** Stoppe bei erkannten Session-Killer-Patterns sofort
- ✅ **VALIDATION-PRIORITY:** Prüfe gegen Anti-Patterns vor Code-Generierung
- ❌ **FORBIDDEN:** Dokumentierte Anti-Patterns ignorieren oder verwenden

> **⚠️ MANDATORY READ - Diese Fehler NIEMALS wiederholen**  
> **Zweck:** Session-killer prevention für KI development  
> **Pattern:** Was NICHT machen - Anti-Pattern recognition

## 🚨 **SESSION-KILLER ANTI-PATTERNS**

### **❌ FAILURE MODE 1: Critical Fixes Ignorieren**

**NIEMALS:**
- Critical fix patterns entfernen oder überschreiben
- WriteStream race conditions ignorieren
- File system flush delays (< 100ms) entfernen
- Duplicate event handlers hinzufügen
- Port 5174 in development ändern

**STATTDESSEN:**
```bash
# ✅ CORRECT: Always validate critical fixes first
pnpm validate:critical-fixes
# ✅ Then check file in critical fixes registry
# ✅ Preserve all required patterns
```

**Warning Signs:**
- Asset downloads failing
- Development server port conflicts  
- Memory leaks in production
- Update system broken

### **❌ FAILURE MODE 2: Release Workflow Violations**

**NIEMALS:**
- `pnpm version` direkt verwenden (npm config conflicts)
- Release-Schritte überspringen oder abkürzen
- GitHub Actions workflow_dispatch ohne Fallback ignorieren
- Pre-flight Validationen auslassen

**STATTDESSEN:**
```bash
# ✅ CORRECT: Safe version management
pnpm safe:version patch/minor/major  # MANDATORY!

# ✅ CORRECT: Pre-release validation
pnpm validate:critical-fixes
pnpm validate:docs-structure
npm config list  # Check npm config conflicts

# ✅ CORRECT: Manual fallback ready when GitHub Actions fail
```

**Warning Signs:**
- Version bump errors with npm config conflicts
- Release assets missing or corrupt
- Workflow dispatch API failures
- Manual correction required after automated release

### **❌ FAILURE MODE 3: Package Manager Chaos**

**NIEMALS:**
```bash
# ❌ FORBIDDEN Commands:
npm install                  # Wrong package manager
yarn add dependency         # Wrong package manager
npx electron-rebuild        # Wrong ABI targeting
npm rebuild better-sqlite3   # Wrong package manager
```

**STATTDESSEN:**
```bash
# ✅ CORRECT: PNPM-only commands
pnpm install
pnpm add dependency
node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs  # Proper ABI targeting
pnpm rebuild better-sqlite3
```

**Warning Signs:**
- ABI mismatch errors (better-sqlite3)
- Node modules conflicts
- Development server won't start
- Database connection failures

### **❌ FAILURE MODE 4: Database Anti-Patterns**

**NIEMALS:**
```typescript
// ❌ FORBIDDEN: SQL injection patterns
const query = `SELECT * FROM themes WHERE name = '${themeName}'`

// ❌ FORBIDDEN: Direct table access
const themes = db.prepare('SELECT * FROM themes').all()

// ❌ FORBIDDEN: Bypass service layer
const directUpdate = db.prepare('UPDATE themes SET...')

// ❌ FORBIDDEN: Hardcoded snake_case
const sql = 'SELECT theme_id, color_key FROM theme_colors'
```

**STATTDESSEN:**
```typescript
// ✅ CORRECT: Service layer pattern
const themes = await DatabaseThemeService.getAllThemes()

// ✅ CORRECT: Field mapper usage
const query = convertSQLQuery('SELECT * FROM themes WHERE is_system = ?', [true])

// ✅ CORRECT: Parameterized queries
const stmt = db.prepare('SELECT * FROM offers WHERE id = ?')
const result = stmt.get(offerId)
```

**Warning Signs:**
- SQL injection vulnerabilities
- Data inconsistency issues
- Service layer bypass
- Schema validation failures

### **❌ FAILURE MODE 5: Paths System Violations**

**NIEMALS:**
```typescript
// ❌ FORBIDDEN: Direct app.getPath() in Renderer Process
const userDataPath = app.getPath('userData')  // CRASHES!

// ❌ FORBIDDEN: Hardcoded paths
const dbPath = './database/rawalite.db'

// ❌ FORBIDDEN: process.env.NODE_ENV in Electron
if (process.env.NODE_ENV === 'production') {  // UNRELIABLE!
```

**STATTDESSEN:**
```typescript
// ✅ CORRECT: Renderer Process
import { PATHS } from 'src/lib/paths.ts'
const userDataPath = PATHS.USER_DATA_DIR

// ✅ CORRECT: Main Process
import { app } from 'electron'
const userDataPath = app.getPath('userData')

// ✅ CORRECT: Environment detection
if (!app.isPackaged) {  // Development
if (app.isPackaged) {   // Production
```

**Warning Signs:**
- Path resolution failures
- Asset loading problems
- Environment detection issues
- IPC path communication broken

### **❌ FAILURE MODE 6: Documentation Chaos**

**NIEMALS:**
- ROOT_ documents aus /docs Root verschieben
- Dokumente ohne Datums-Header erstellen
- Cross-references mit hardcoded Pfaden
- Schema-Patterns ignorieren
- Duplicate documentation erstellen ohne search

**STATTDESSEN:**
```markdown
# ✅ CORRECT: Always start with search
# 1. semantic_search docs/ nach ähnlichen Problemen
# 2. grep_search nach verwandten Keywords
# 3. Check LESSON_ + SOLVED_ Präfixe
# 4. Only create if truly NEW

# ✅ CORRECT: Proper document header
> **Erstellt:** 26.10.2025 | **Letzte Aktualisierung:** 26.10.2025 (Grund)
> **Status:** Production Ready | **Typ:** Guide

# ✅ CORRECT: Schema compliance
ROOT_VALIDATED_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md
```

**Warning Signs:**
- Broken cross-references
- Missing documentation
- Schema violations
- Duplicate content in multiple locations

### **❌ FAILURE MODE 7: External Dependencies**

**NIEMALS:**
```typescript
// ❌ FORBIDDEN: External navigation
window.open('https://external-site.com')
shell.openExternal('https://link.com')
<a href="https://link.com" target="_blank">

// ❌ FORBIDDEN: External PDF assets
const logoUrl = 'https://cdn.example.com/logo.png'
```

**STATTDESSEN:**
```typescript
// ✅ CORRECT: All in-app navigation
// Use internal routing and components only

// ✅ CORRECT: Local assets only
import logoUrl from '/src/assets/logo.png?url'
```

**Warning Signs:**
- Security vulnerabilities
- External dependency failures
- Network-dependent functionality
- PDF generation issues

### **❌ FAILURE MODE 8: ABI/Development Process Anti-Patterns** ⭐ **KRITISCH (27.10.2025)**

**Problem:** Start-Sleep unterbricht **laufende App-Prozesse**, verursacht ABI-Korruption und wiederkehrende Build-Fehler

**Kritische Sequenz:**
1. **App startet** (`pnpm dev:all`) - Native Module laden
2. **KI führt Start-Sleep aus** (unterbricht laufenden Prozess)
3. **App-Start bricht ab** (wegen Prozess-Interruption)
4. **Nächster Versuch** → **ABI-Fehler vorhanden** (korrupter Module-State)

**NIEMALS:**
```bash
# ❌ CRITICAL FAILURE: Laufende App mit Sleep unterbrechen
pnpm dev:all                    # App startet, Module laden...
Start-Sleep -Seconds 30         # ← TÖTET laufenden App-Prozess!
# Ergebnis: Nächstes pnpm dev:all → ABI-Fehler

# ❌ FORBIDDEN: Interruption während aktiver Prozesse
PowerShell -ExecutionPolicy Bypass -File ".\scripts\MAINTAIN_NATIVE_ADDONS_FIX.ps1"
Start-Sleep -Seconds 15         # ← UNTERBRICHT Rebuild-Prozess!

# ❌ FORBIDDEN: ANY Start-Sleep während Prozesse laufen
# Start-Sleep während App/Rebuild läuft = ABI-Korruption
```

**STATTDESSEN:**
```bash
# ✅ CORRECT: Prozesse natürlich beenden lassen, KEINE Unterbrechungen
pnpm dev:all
# Warten bis App vollständig gestartet (Terminal-Output beobachten)
# NUR weitermachen wenn App voll geladen und stabil

# ✅ CORRECT: Eine komplette Operation nach der anderen  
PowerShell -ExecutionPolicy Bypass -File ".\scripts\MAINTAIN_NATIVE_ADDONS_FIX.ps1"
# Warten auf "electron-rebuild succeeded" Nachricht
# DANN App starten: pnpm dev:all

# ✅ RULE: Wenn etwas läuft → vollständig beenden lassen
```

**STATTDESSEN:**
```bash
# ✅ CORRECT: ABI-Fix vor App-Start
.\scripts\MAINTAIN_NATIVE_ADDONS_FIX.ps1
# ODER: node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs

# ✅ CORRECT: Warten bis ABI-Rebuild komplett
# Kein Sleep während laufenden Build-Prozess
# Warten auf "electron-rebuild succeeded" Message

# ✅ CORRECT: Prozesse cleanen vor neuem Versuch
taskkill /F /IM node.exe
taskkill /F /IM electron.exe
```

**Warning Signs:**
- better-sqlite3 compilation failures
- "failed in 12.2s at better-sqlite3" errors
- ABI version mismatch (NODE_MODULE_VERSION)
- Sleep/timeout während Native Module Build
- Wiederkehrende ABI-Fehler nach Interruption

## 🛡️ **PREVENTION STRATEGIES**

### **Pre-Session Checklist:**
```markdown
- [ ] ✅ Read: docs/06-handbook/REFERENCE/CRITICAL_FIXES_CURRENT.md
- [ ] ✅ Read: docs/06-handbook/REFERENCE/DATABASE_SCHEMA.md
- [ ] ✅ Read: docs/06-handbook/ANTIPATTERN/KI_MISTAKES.md (this file)
- [ ] ✅ Execute: pnpm validate:critical-fixes
- [ ] ✅ Check: Current migration status
```

### **During Session Guards:**
```bash
# ✅ Before any file edit:
grep -r \"critical-fix\" docs/06-handbook/REFERENCE/CRITICAL_FIXES_CURRENT.md

# ✅ Before database changes:
pnpm analyze:database-schema

# ✅ Before package operations:
# Stop all processes first:
taskkill /F /IM node.exe
taskkill /F /IM electron.exe
```

### **Post-Session Validation:**
```bash
# ✅ Verify session success:
pnpm validate:critical-fixes      # Must pass
pnpm validate:docs-structure      # Must pass
pnpm dev:all                      # Must start clean
```

## 🚨 **EMERGENCY STOP CONDITIONS**

**IMMEDIATELY STOP SESSION IF:**
- ❌ Critical pattern missing from code
- ❌ Validation script fails
- ❌ ABI mismatch detected
- ❌ Database corruption suspected
- ❌ Documentation structure violated
- ❌ Anti-pattern detected in changes
- ❌ External dependencies introduced
- ❌ Release workflow deviation
- ❌ Service layer bypassed
- ❌ ROOT_ document moved
- **❌ NEW (29.10.2025): File replacement ohne backup creation**
- **❌ NEW (29.10.2025): Complex refactoring ohne backup preservation**

### **❌ FAILURE MODE 11: File Operations ohne Backup (NEW 29.10.2025)**

**NIEMALS:**
- File replacement ohne vorherige `.backup` creation
- Complete file rewrite ohne backup preservation
- Complex refactoring ohne backup strategy
- Remove operations ohne backup safety
- Overwrite existing files ohne backup protection

**STATTDESSEN:**
```powershell
# ✅ CORRECT: Create backup before file replacement
Copy-Item "path/to/file.ts" -Destination "path/to/file.ts.backup"

# ✅ Verify backup exists
Test-Path "path/to/file.ts.backup"  # Must return True

# ✅ THEN proceed with file operations
```

**Warning Signs:**
- File corruption during development
- Lost code during refactoring
- Unable to rollback failed changes
- Missing backup files in workspace

**Recovery Actions:**
1. **STOP** file operations immediately
2. **CHECK** for existing backup files (.backup extension)
3. **CREATE** backup before any further changes
4. **IMPLEMENT** backup policy for session
5. **VALIDATE** backup creation workflow

**Recovery Actions:**
1. **STOP** all development immediately
2. **RESTORE** from critical fixes registry
3. **VALIDATE** all changes before continuing
4. **TEST** functionality thoroughly
5. **DOCUMENT** incident for future prevention

---

**📍 Location:** `docs/06-handbook/ANTIPATTERN/VALIDATED_ANTIPATTERN-KI-MISTAKES_2025-10-26.md`  
**Purpose:** Session-killer prevention through anti-pattern recognition  
**Access:** 06-handbook navigation system  
**Critical:** Read BEFORE every coding session to prevent repeating mistakes