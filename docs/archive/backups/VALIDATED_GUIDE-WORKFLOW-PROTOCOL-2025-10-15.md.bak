# 🔄 Workflow Protocol - Main.ts Refactor

> **Step-by-step execution protocol** für den main.ts Refactor
> 
> **Method:** Incremental + Approval-Based | **Status:** ACTIVE

---

## 🎯 **Protocol Philosophy**

### **Safety-First Approach**
- **Incremental Changes**: Ein Schritt zur Zeit
- **Approval Gates**: Freigabe nach jedem Schritt erforderlich
- **Rollback Ready**: Sofortige Rückgängigmachung bei Problemen
- **Documentation Driven**: Vollständige Nachverfolgung

### **Communication Protocol**
- **Status Reports**: Standardisiertes Format nach jedem Schritt
- **Risk Assessment**: Klare Risiko-Einschätzung
- **Freigabe-Workflow**: Explizite GO/NO-GO Entscheidungen

---

## 📋 **Status Report Template**

### **Standard Format (Mandatory)**
```
[STEP N DONE]
Was getan: <1-2 Sätze mit konkreten Änderungen>
Risiko: <low/medium/high + Begründung>
Tests: <Ergebnis aller ausgeführten Tests>
Diff-Vorschau: <Auflistung aller geänderten Dateien>
Commit: <Exakte Commit-Message>
Bereit für Step N+1? (Ja/Nein)
```

### **Status Report Examples**

#### **Low Risk Step Example**
```
[STEP 3 DONE]
Was getan: Path-IPC Handler (paths:getUserDataPath, getDownloadsPath, etc.) nach ipc/paths.ts extrahiert
Risiko: low - nur Strukturänderung, keine Logik-Modifikation
Tests: typecheck ✅, lint ✅, test ✅, guards ✅, paths-ipc-manual ✅
Diff-Vorschau: 
  - main.ts (5 IPC-Handler auskommentiert, import './ipc/paths' hinzugefügt)
  - ipc/paths.ts (neu, 85 Zeilen, JSDoc komplett)
Commit: refactor(ipc): extract path handlers to separate module
Bereit für Step 4? (Ja/Nein)
```

#### **High Risk Step Example**
```
[STEP 9 DONE]
Was getan: PDF-IPC Handler nach ipc/pdf.ts extrahiert, FIX-007 Theme-System 1:1 übertragen
Risiko: high - Critical Fix FIX-007 betroffen, PDF-Funktionalität kritisch
Tests: typecheck ✅, lint ✅, test ✅, guards ✅, validate:critical-fixes ✅, pdf-manual-theme-test ✅
Diff-Vorschau:
  - main.ts (PDF-Handler auskommentiert, import './ipc/pdf' hinzugefügt)
  - ipc/pdf.ts (neu, 280 Zeilen, FIX-007 Pattern erhalten, JSDoc komplett)
  - VALIDATION: PDF-Export mit Theme-Test erfolgreich
Commit: refactor(ipc): extract PDF handlers to separate module [CRITICAL-FIX-007]
Bereit für Step 10? (Ja/Nein)
```

---

## ⚡ **Approval Workflow**

### **Freigabe-Kriterien**

#### **Automatische Freigabe (Low Risk)**
```bash
# Kriterien für automatische Freigabe:
- Risiko: Low
- Alle Guards: ✅ 
- Funktions-Test: ✅
- Keine Critical Fixes betroffen
- File Size im Rahmen

# Response:
"OK, weiter mit Step N+1"
```

#### **Review Required (Medium/High Risk)**
```bash
# Kriterien für Review:
- Risiko: Medium oder High
- Critical Fixes betroffen
- Komplexe Funktionalität
- Ungewöhnliche Test-Ergebnisse

# Response nach Review:
"OK, weiter mit Step N+1" ODER "STOP - Issue: [Beschreibung]"
```

### **Freigabe-Responses**

#### **Standard Approval**
```
OK, weiter mit Step N+1
```

#### **Conditional Approval**
```
OK, weiter mit Step N+1 - aber beachte [spezifische Punkte]
```

#### **Review Request**
```
PAUSE - Review benötigt:
- [Spezifische Fragen/Bedenken]
- [Zusätzliche Tests erforderlich]
- [Dokumentation nachreichen]
```

#### **Stop/Rollback**
```
STOP - Issue detected:
- Problem: [Beschreibung]
- Action: Rollback zu Step N-1
- Next: [Alternative Approach]
```

---

## 🚨 **Emergency Procedures**

### **Problem Detection Protocol**

#### **Level 1: Test Failure**
```bash
# Symptom: Guard failure, IPC test failure
# Response:
echo "🔍 Level 1 Issue - Test Failure in Step N"
echo "Action: Investigating..."

# Investigation:
1. Re-run failed test
2. Check error message
3. Compare with pre-step state
4. Identify root cause

# Resolution:
- Quick fix möglich → Fix + Continue
- Complex issue → Rollback + Alternative
```

#### **Level 2: Critical Fix Regression**
```bash
# Symptom: validate:critical-fixes failure
# Response:
echo "🚨 Level 2 Issue - CRITICAL FIX REGRESSION"
echo "Action: IMMEDIATE ROLLBACK"

# Immediate Action:
git reset --hard HEAD~1
pnpm validate:critical-fixes  # Must pass

# Investigation:
1. Identify which fix was lost
2. Analyze migration approach
3. Plan prevention strategy
4. Document for future reference

# Resolution:
- Alternative migration approach
- Enhanced validation
- Additional safeguards
```

#### **Level 3: System Instability**
```bash
# Symptom: App crashes, guards failing on clean state
# Response:
echo "🆘 Level 3 Issue - SYSTEM INSTABILITY"
echo "Action: FULL STOP + INVESTIGATION"

# Immediate Action:
git reset --hard HEAD~2  # Go back further
pnpm clean && pnpm install  # Clean rebuild
pnpm validate:critical-fixes  # Validate clean state

# Investigation:
1. Environment issue?
2. Dependency problem?  
3. Git state corruption?
4. System-level problem?

# Resolution:
- Identify and fix system issue
- Re-validate environment
- Resume from known good state
```

### **Rollback Procedures**

#### **Single Step Rollback**
```bash
# Standard rollback for most issues
git reset --hard HEAD~1

# Validation:
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:critical-fixes

# If validation passes:
echo "✅ Rollback successful - clean state restored"

# If validation fails:
echo "🚨 Rollback failed - deeper investigation required"
```

#### **Multi-Step Rollback**
```bash
# For complex issues or cascading problems
git log --oneline -10  # Review recent commits
git reset --hard HEAD~N  # Go back N steps

# Alternative: Reset to specific commit
git reset --hard [commit-hash]

# Validation:
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:critical-fixes

# Documentation:
echo "Rollback performed: Reason, Steps affected, Resolution plan"
```

#### **Nuclear Rollback**
```bash
# Complete restart if everything is broken
git reset --hard [refactor-start-commit]

# Clean environment:
pnpm clean
Remove-Item -Path "node_modules" -Recurse -Force
pnpm install

# Validation:
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:critical-fixes

# Documentation:
echo "Nuclear rollback performed - restart refactor from Step 0"
```

---

## 📊 **Progress Tracking**

### **Step Completion Matrix**
| Step | Status | Risk | Tests | Approval | Notes |
|------|--------|------|-------|----------|-------|
| 0 | ⏳ PENDING | Low | - | - | Preparation |
| 1 | ⏳ PENDING | Low | - | - | Main Window |
| 2 | ⏳ PENDING | Low-Med | - | - | Update Window |
| 3 | ⏳ PENDING | Low | - | - | Path IPC |
| 4 | ⏳ PENDING | Low | - | - | FS IPC |
| 5 | ⏳ PENDING | Low | - | - | Files IPC |
| 6 | ⏳ PENDING | Medium | - | - | Numbering IPC |
| 7 | ⏳ PENDING | Medium | - | - | Backup IPC |
| 8 | ⏳ PENDING | **HIGH** | - | - | DB IPC [FIX-012] |
| 9 | ⏳ PENDING | **HIGH** | - | - | PDF IPC [FIX-007] |
| 10 | ⏳ PENDING | Low | - | - | Update Validation |
| 11 | ⏳ PENDING | Medium | - | - | main.ts Cleanup |
| 12 | ⏳ PENDING | Medium | - | - | E2E + Docs |
| 13 | ⏳ PENDING | Low | - | - | Final Cleanup |

**Status Codes:**
- ⏳ PENDING - Nicht gestartet
- 🔄 IN-PROGRESS - Wird bearbeitet
- ✅ COMPLETED - Erfolgreich abgeschlossen
- ❌ FAILED - Fehlgeschlagen, Rollback erforderlich
- ⚠️ REVIEW - Review erforderlich vor Fortsetzung

---

## 🕒 **Time Management**

### **Estimated Timeline**
```
Phase 1 (Steps 0-2): 2-3 Stunden
├── Step 0: 30 min (Preparation)
├── Step 1: 60 min (Main Window + Testing)
└── Step 2: 60 min (Update Window + Testing)

Phase 2 (Steps 3-7): 3-4 Stunden  
├── Step 3: 30 min (Path IPC)
├── Step 4: 45 min (FS IPC)
├── Step 5: 45 min (Files IPC)
├── Step 6: 60 min (Numbering IPC + Manual Testing)
└── Step 7: 45 min (Backup IPC)

Phase 3 (Steps 8-9): 3-4 Stunden [CRITICAL]
├── Step 8: 90 min (DB IPC + Critical Fix Validation)
└── Step 9: 120 min (PDF IPC + Extensive Testing)

Phase 4 (Steps 10-13): 2-3 Stunden
├── Step 10: 30 min (Update Validation)
├── Step 11: 60 min (main.ts Cleanup)
├── Step 12: 90 min (E2E + Documentation)
└── Step 13: 45 min (Final Cleanup)

TOTAL: 10-14 Stunden (über 2-3 Tage verteilt)
```

### **Break Points**
```bash
# Empfohlene Pausenpunkte:
Nach Step 2:  "Window Management Complete"
Nach Step 7:  "Standard IPC Complete"  
Nach Step 9:  "Critical IPC Complete" 
Nach Step 13: "Refactor Complete"
```

---

## 📈 **Quality Gates**

### **Per-Step Quality Gates**
```bash
# Must pass for each step:
✅ TypeScript compilation
✅ ESLint (0 errors)
✅ Unit tests passing
✅ Critical fixes validation
✅ Manual functionality test
✅ File size compliance

# Additional for Critical Steps (8-9):
✅ Extended critical fixes testing
✅ Manual E2E workflow testing
✅ Performance baseline check
```

### **Overall Quality Gates**
```bash
# Must pass for refactor completion:
✅ All 13 critical fixes preserved
✅ Zero functionality regressions
✅ Complete documentation
✅ File size targets met
✅ Security settings preserved
✅ Build/dist pipeline working
```

---

## 🔄 **Iterative Improvement**

### **Process Optimization**

#### **After Each Critical Step**
```bash
# Retrospective questions:
1. Was the risk assessment accurate?
2. Were the tests sufficient?
3. Could the rollback have been faster?
4. What additional safeguards would help?
5. How can documentation be improved?
```

#### **Mid-Refactor Assessment (After Step 7)**
```bash
# Process check:
- Time estimates vs actual
- Quality gate effectiveness  
- Communication clarity
- Rollback procedures tested
- Documentation completeness
```

#### **Post-Refactor Analysis**
```bash
# Full retrospective:
- Total time vs estimate
- Number of rollbacks/issues
- Quality gate effectiveness
- Critical fix preservation success
- Process improvements for next time
```

---

## 📚 **Communication Guidelines**

### **Status Update Frequency**
- **After each step**: Mandatory status report
- **During step**: Updates if issues arise
- **Between sessions**: Daily summary if work spans multiple days

### **Escalation Triggers**
- Critical fix regression detected
- Multiple rollbacks on same step
- Unexpected system instability
- Timeline significantly exceeded

### **Documentation Requirements**
- All status reports archived
- All issues and resolutions documented
- Process improvements documented
- Final retrospective completed

---

## 🎯 **Success Definition**

### **Process Success**
- ✅ All 13 steps completed
- ✅ No critical fix regressions
- ✅ Complete functionality preservation
- ✅ Documentation standards met
- ✅ Quality gates passed

### **Outcome Success**
- ✅ main.ts < 500 lines (from 2560+)
- ✅ Modular, maintainable structure
- ✅ Zero behavior changes
- ✅ Enhanced developer experience
- ✅ Foundation for future improvements

---

*Erstellt: 13. Oktober 2025 | Teil des [Main.ts Refactor Plans](../MAIN-TS-REFACTOR-PLAN.md)*