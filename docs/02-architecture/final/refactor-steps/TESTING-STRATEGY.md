# 🧪 Testing Strategy - Main.ts Refactor

> **Comprehensive testing approach** für den main.ts Refactor
> 
> **Coverage:** Unit + Integration + Manual | **Status:** ACTIVE

---

## 🎯 **Testing Philosophy**

### **Testing Pyramid für Refactor**
```
           🔺 Manual E2E (Critical Paths)
         🔺🔺 Integration Tests (IPC Functionality)  
       🔺🔺🔺 Automated Guards (Fast Feedback)
```

**Rationale:**
- **Guards:** Schnelle Regression-Detection
- **Integration:** IPC-Handler Functionality
- **Manual:** Critical business workflows

---

## 🔧 **Guard Protocol (Standard)**

### **Complete Guard Suite**
```bash
# Standard Guards nach jedem Schritt:
pnpm typecheck && pnpm lint && pnpm test && pnpm guard:cjs && pnpm guard:pkgtype && pnpm guard:assets && pnpm validate:critical-fixes
```

### **Guard Breakdown**
| Guard | Purpose | Expected Time | Failure Action |
|-------|---------|---------------|----------------|
| `typecheck` | TypeScript compliance | 10-20s | Fix types immediately |
| `lint` | Code style consistency | 5-10s | Auto-fix where possible |
| `test` | Unit test regression | 30-60s | Fix failing tests |
| `guard:cjs` | CommonJS pattern detection | 5s | Review import patterns |
| `guard:pkgtype` | Package.json type compliance | 5s | Review package configs |
| `guard:assets` | Asset availability check | 5s | Verify asset paths |
| `validate:critical-fixes` | Critical fix preservation | 10s | **IMMEDIATE ROLLBACK** |

### **Guard Failure Response**
```bash
# Bei Guard-Failure:
echo "🚨 Guard failure detected in step X"
echo "Failed guard: [guard-name]"
echo "Action: Investigating..."

# Standard Rollback:
git reset --hard HEAD~1

# Re-run guards:
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:critical-fixes

# If still failing:
echo "🆘 Escalation required - guards failing on clean state"
```

---

## 🔌 **IPC Integration Testing**

### **IPC Handler Validation (per step)**

#### **Step 3: Path IPC Testing**
```bash
# Manual Test:
# 1. App starten
# 2. DevTools öffnen
# 3. Console:
await window.rawalite.paths.getUserDataPath()
await window.rawalite.paths.getDownloadsPath()
# Erwartung: Korrekter Pfad returned, keine Errors
```

#### **Step 4: File System IPC Testing**
```bash
# Manual Test:
await window.rawalite.fs.getCwd()
await window.rawalite.fs.ensureDir('/tmp/test-dir')
# Erwartung: Funktionen arbeiten, Ordner wird erstellt
```

#### **Step 5: Files IPC Testing**
```bash
# Manual Test:
# 1. Einstellungen → Logo upload testen
# 2. Base64-Konvertierung funktioniert
# 3. File speichert korrekt
# Erwartung: Logo-Upload workflow unverändert
```

#### **Step 6: Numbering IPC Testing**
```bash
# Manual Test (WICHTIG):
# 1. Einstellungen → Nummernkreise
# 2. Neuen Nummernkreis erstellen
# 3. getNext() aufrufen
# 4. Nächste Nummer abrufen
# Erwartung: Nummerierung funktioniert exakt wie vorher
```

#### **Step 7: Backup IPC Testing**
```bash
# Manual Test:
# 1. Backup erstellen (falls UI vorhanden)
# 2. Console: await window.rawalite.backup.create()
# Erwartung: Backup-Datei wird erstellt
```

#### **Step 8: Database IPC Testing [CRITICAL]**
```bash
# Manual Test (AUSFÜHRLICH):
# 1. Kunde erstellen → Speichern
# 2. Angebot erstellen → Speichern  
# 3. Rechnung erstellen → Speichern
# 4. Listen laden
# Erwartung: 
# - Keine SQLite binding Errors
# - CRUD-Operationen funktionieren
# - undefined → null Konvertierung arbeitet
```

#### **Step 9: PDF IPC Testing [CRITICAL]**
```bash
# Manual Test (THEME-VALIDATION):
# 1. Angebot erstellen mit Daten
# 2. PDF exportieren
# 3. PDF öffnen → Theme-Farbe prüfen
# 4. Theme wechseln → PDF exportieren → Farbe erneut prüfen
# Erwartung:
# - PDF generiert erfolgreich
# - Theme-Farben korrekt (FIX-007)
# - Parameter-based theme detection arbeitet
```

---

## 🎯 **Manual Testing Workflows**

### **Core Workflow Testing**

#### **Customer Management Workflow**
```bash
# Test nach Step 6 (und final):
1. Navigation → Kunden
2. Neuen Kunden erstellen
   - Name: "Refactor Test Kunde"
   - Email: "test@refactor.local"
3. Speichern
4. Liste → Kunde erscheint
5. Kunde bearbeiten → Änderung speichern
6. Kunde löschen → Bestätigung

# Erwartung: Identisch wie vor Refactor
```

#### **Offer-Invoice Workflow**  
```bash
# Test nach Step 8 (DB-IPC):
1. Navigation → Angebote
2. Neues Angebot erstellen
   - Kunde: "Refactor Test Kunde"
   - Position hinzufügen
3. Speichern → Angebotsnummer generiert
4. Status → "Gesendet"
5. Navigation → Rechnungen
6. "Aus Angebot erstellen" → Angebot auswählen
7. Rechnung speichern

# Erwartung: 
# - Automatische Nummerierung
# - Status-Updates
# - Angebot-zu-Rechnung Übernahme
```

#### **PDF Export Workflow**
```bash
# Test nach Step 9 (PDF-IPC):
1. Angebot oder Rechnung öffnen
2. PDF Export Button
3. Dialog → Speicherort wählen
4. PDF generieren
5. PDF öffnen → Design prüfen:
   - Logo korrekt
   - Theme-Farbe korrekt
   - Layout unverändert

# Theme Test:
6. Einstellungen → Theme ändern (z.B. Lavender)
7. PDF Export wiederholen
8. PDF öffnen → Theme-Farbe = Lavender (#DDA0DD)

# Erwartung: FIX-007 Theme-System funktioniert
```

---

## 🔄 **Dev-Smoke Testing**

### **Standard Dev-Smoke (nach jedem Schritt)**
```bash
# 1. App Start
pnpm dev:all
# Erwartung: 
# - Vite startet auf Port 5174
# - Electron lädt erfolgreich
# - Hauptfenster erscheint
# - Keine Console-Errors

# 2. Basic Navigation
# Dashboard → Kunden → Angebote → Einstellungen
# Erwartung: Alle Seiten laden ohne Errors

# 3. IPC Availability Check (Console)
Object.keys(window.rawalite)
# Erwartung: Alle IPC-APIs verfügbar
```

### **Extended Dev-Smoke (nach kritischen Schritten)**

#### **Nach Step 2 (Windows)**
```bash
# Update Manager Dev Test:
pnpm dev:all

# Separates Terminal:
node -e "
const { spawn } = require('child_process');
spawn('pnpm', ['run', 'electron:dev', '--', '--update-manager-dev'], { stdio: 'inherit' });
"

# Erwartung: Update Manager Modal öffnet sich
```

#### **Nach Step 6 (Numbering)**
```bash
# Numbering System Test:
# 1. App starten
# 2. Einstellungen → Nummernkreise
# 3. "Nächste Nummer" Button klicken
# Erwartung: Nummer wird korrekt generiert und angezeigt
```

#### **Nach Step 9 (PDF)**
```bash
# PDF System Test:
# 1. Dummy-Angebot erstellen
# 2. PDF Export Button
# 3. PDF wird generiert ohne Errors
# Erwartung: PDF-Datei erstellt, öffnet korrekt
```

---

## 🧪 **Critical Fixes Testing**

### **FIX-007 PDF Theme Testing**
```typescript
// Test in DevTools Console nach Step 9:
// 1. Theme-Service verfügbar?
await window.rawalite.pdf.getStatus()

// 2. Theme-Color Function Test (falls zugänglich):
// (Internal function test - manuell im PDF-IPC-Code prüfen)

// 3. End-to-End Theme Test:
// Manual: PDF export in different themes, verify colors
```

### **FIX-012 SQLite Binding Testing**
```typescript
// Test in DevTools Console nach Step 8:
// 1. Database operations mit undefined values
await window.rawalite.db.query("SELECT 1", [undefined, null, "test"])

// 2. CREATE operations mit partiellen Daten
// Manual: Customer form mit leeren optionalen Feldern

// 3. UPDATE operations mit undefined patches
// Manual: Customer edit mit undefined-Feldern
```

---

## 📊 **Test Execution Matrix**

| Step | Standard Guards | IPC Test | Dev-Smoke | Manual Test | Critical | Duration |
|------|----------------|----------|-----------|-------------|----------|----------|
| 0 | ✅ | - | ✅ | - | - | 5 min |
| 1 | ✅ | - | ✅ | Navigation | - | 10 min |
| 2 | ✅ | - | ✅ Extended | Update Manager | - | 15 min |
| 3 | ✅ | ✅ Paths | ✅ | - | - | 10 min |
| 4 | ✅ | ✅ FS | ✅ | - | - | 10 min |
| 5 | ✅ | ✅ Files | ✅ | Logo Upload | - | 15 min |
| 6 | ✅ | ✅ Numbering | ✅ Extended | Nummernkreise | - | 20 min |
| 7 | ✅ | ✅ Backup | ✅ | - | - | 10 min |
| 8 | ✅ | ✅ DB | ✅ | CRUD Workflow | FIX-012 | 30 min |
| 9 | ✅ | ✅ PDF | ✅ Extended | PDF + Theme | FIX-007 | 30 min |
| 10 | ✅ | - | ✅ | Update Test | - | 10 min |
| 11 | ✅ | - | ✅ | - | - | 10 min |
| 12 | ✅ Complete | ✅ All | ✅ Full | E2E Complete | All | 45 min |
| 13 | ✅ Complete | ✅ All | ✅ Final | - | All | 20 min |

**Total Testing Time:** ~4-5 Stunden (parallel zu Development)

---

## 🚨 **Failure Response Protocols**

### **Guard Failure**
```bash
# Immediate Action:
1. Note which guard failed
2. Check error message
3. git reset --hard HEAD~1
4. Re-run guards on clean state
5. If clean state fails → Escalate
6. If clean state passes → Investigate step changes
```

### **IPC Test Failure**
```bash
# Investigation Process:
1. Check browser console for IPC errors
2. Check main process console for handler errors
3. Verify IPC handler registration
4. Compare with pre-refactor behavior
5. Rollback if behavior differs
```

### **Critical Fix Failure**
```bash
# IMMEDIATE ESCALATION:
1. STOP all work immediately
2. git reset --hard HEAD~1
3. Verify critical fix restoration
4. Document failure mode
5. Review migration approach
6. Get approval before retry
```

---

## 📈 **Success Criteria**

### **Per Step Success**
- ✅ All guards pass
- ✅ IPC functionality identical
- ✅ Dev-smoke successful
- ✅ Manual tests pass
- ✅ No regressions detected

### **Overall Success**
- ✅ Complete functionality preservation
- ✅ All 13 critical fixes active
- ✅ Performance characteristics unchanged
- ✅ Zero behavior modifications

---

## 🔗 **Related Documentation**

- **[Critical Fixes Impact](./CRITICAL-FIXES-IMPACT.md)** - Critical fix preservation
- **[Testing Standards](../../01-standards/TESTING-STANDARDS.md)** - General testing guidelines
- **[Main Refactor Plan](../MAIN-TS-REFACTOR-PLAN.md)** - Overall strategy

---

*Erstellt: 13. Oktober 2025 | Teil des [Main.ts Refactor Plans](../MAIN-TS-REFACTOR-PLAN.md)*