# 🔍 Intelligent Detection Template

> **Erstellt:** 27.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (Template-Erstellung)  
> **Status:** Production Ready | **Typ:** Template - Intelligent Detection System  
> **Purpose:** KI-Assistant template for intelligent validation and auto-correction  
> **Schema:** `VALIDATED_TEMPLATE-INTELLIGENT-DETECTION_2025-10-27.md`

## 🤖 **KI-AUTO-DETECTION SYSTEM**

**🎯 STATUS DETECTION KEYWORDS:**
- `TEMPLATE-INTELLIGENT-DETECTION` → **AI-ENHANCEMENT** - KI-gestützte Problem-Erkennung
- `Auto-correction` → **AUTOMATED SYSTEM** - Selbst-korrigierende Workflows
- `Production Ready` → **STABLE TEMPLATE** - Verlässlicher Detection-Standard
- `Validation patterns` → **PATTERN-RECOGNITION** - Systematische Problem-Patterns

**📖 TEMPLATE SOURCE:** Dieses Template selbst - Basis für intelligente KI-Detection  
**🔄 AUTO-UPDATE TRIGGER:** Neue Detection-Patterns, Validation-Improvements, Error-Types  
**🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
- ✅ **DETECTION-PRIORITY:** Nutze für systematische Problem-Erkennung
- ✅ **AUTO-CORRECTION:** Wende sichere Korrekturen automatisch an
- ✅ **STOP-CONDITIONS:** Halte bei kritischen Problemen sofort an
- ❌ **FORBIDDEN:** Detection-System ohne Validation-Context verwenden

---

## 📋 **DETECTION PATTERNS & KEYWORDS**

### **🔍 SCRIPT-VALIDATION PATTERNS**

```yaml
Detection Keywords:
  - "script fehlt" → SCRIPT-UPDATE-REQUIRED
  - "command not found" → SCRIPT-MISSING  
  - "execution failed" → SCRIPT-BROKEN
  - "validation failed" → VALIDATION-ERROR
  - "permission denied" → SCRIPT-PERMISSIONS

Auto-Correction Level: STOP + REQUEST-VALIDATION
Behavior: 
  1. ❌ STOP: Keine Alternativen verwenden
  2. 📝 LOG: "Script validation required: [SCRIPT_NAME]"
  3. 🔧 ACTION: Request manual script repair
  4. ⏸️ WAIT: Halt until script fixed
```

### **📊 DATA-CONSISTENCY PATTERNS**

```yaml
Detection Keywords:
  - "migration count: X" + "actual count: Y" → MIGRATION-COUNT-ERROR
  - "schema version" + "mismatch" → SCHEMA-VERSION-ERROR
  - "count inconsistency" → COUNT-VALIDATION-REQUIRED
  - "version mismatch" → VERSION-SYNC-REQUIRED

Auto-Correction Level: SAFE-TO-CORRECT
Behavior:
  1. 🔍 SCAN: Determine actual count/version
  2. 📊 COMPARE: Compare documented vs. actual
  3. 🔧 CORRECT: Update documentation automatically
  4. 📝 LOG: "Auto-corrected: [FIELD] from [OLD] to [NEW]"
```

### **📄 TEMPLATE-COMPLIANCE PATTERNS**

```yaml
Detection Keywords:
  - "missing KI-AUTO-DETECTION" → HEADER-UPDATE-REQUIRED
  - "outdated template" → TEMPLATE-MODERNIZATION
  - "template missing" → TEMPLATE-REQUIRED
  - "header outdated" → HEADER-UPDATE-REQUIRED

Auto-Correction Level: SAFE-TO-UPDATE
Behavior:
  1. 🔍 DETECT: Missing template elements
  2. 📖 REFERENCE: Load from 06-handbook/templates/
  3. 🔧 UPDATE: Apply template automatically
  4. ✅ VERIFY: Confirm template compliance
```

### **🔗 REFERENCE-INTEGRITY PATTERNS**

```yaml
Detection Keywords:
  - "broken reference" → CROSS-REFERENCE-FIX
  - "link not found" → REFERENCE-REPAIR-REQUIRED
  - "reference broken:" → REFERENCE-UPDATE-REQUIRED
  - "path not found" → PATH-VERIFICATION-REQUIRED

Auto-Correction Level: SAFE-TO-REPAIR
Behavior:
  1. 🔍 SCAN: Identify broken reference
  2. 🔎 SEARCH: Find correct target location
  3. 🔧 FIX: Update reference automatically
  4. ✅ VALIDATE: Confirm reference works
```

---

## ⚡ **AUTO-CORRECTION WORKFLOWS**

### **🟢 SAFE AUTO-CORRECTIONS (Immediately Applied)**

```markdown
## Count/Version Corrections
TRIGGER: Numbers, versions, counts that can be verified
ACTION: 
- Scan actual state (filesystem, database, etc.)
- Compare with documented state
- Update documentation to match reality
- Log correction with old→new values

## Template Updates
TRIGGER: Missing headers, outdated formats
ACTION:
- Detect template requirements
- Load appropriate template from 06-handbook
- Apply missing elements
- Verify compliance

## Reference Repairs
TRIGGER: Broken links, missing files
ACTION:
- Search for correct target
- Update reference to correct location
- Test reference functionality
- Confirm repair success
```

### **🟡 MANUAL-VALIDATION REQUIRED (Stop + Request)**

```markdown
## Script Errors
TRIGGER: Script execution failures, missing commands
ACTION:
- STOP all code generation
- LOG specific error details
- REQUEST developer intervention
- WAIT for manual script repair

## Architecture Changes
TRIGGER: Breaking changes, new patterns detected
ACTION:
- STOP implementation work
- DOCUMENT change details
- REQUEST developer review
- WAIT for confirmation/guidance

## Critical Fix Missing
TRIGGER: Required patterns missing from code
ACTION:
- STOP any modifications
- IDENTIFY missing critical fix
- REQUEST fix restoration
- WAIT for critical pattern restoration
```

---

## 🎯 **BEHAVIORAL RULES**

### **🔍 Detection Priority Order:**
1. **CRITICAL-FIXES** → Highest priority, immediate stop
2. **SCRIPT-ERRORS** → High priority, stop + validate
3. **ARCHITECTURE-CHANGES** → Medium priority, stop + confirm
4. **DATA-CONSISTENCY** → Medium priority, auto-correct + log
5. **TEMPLATE-COMPLIANCE** → Low priority, auto-update + verify

### **🤖 KI-Decision Matrix:**

```yaml
Problem Type: SCRIPT-ERROR
Detection: "command not found", "execution failed"
Decision: STOP + REQUEST-VALIDATION
Reasoning: Scripts are critical infrastructure, no guessing

Problem Type: COUNT-MISMATCH  
Detection: "migration count: X actual: Y"
Decision: AUTO-CORRECT + LOG
Reasoning: Counts can be verified objectively

Problem Type: TEMPLATE-MISSING
Detection: "missing KI-AUTO-DETECTION"
Decision: AUTO-UPDATE + VERIFY
Reasoning: Templates are standardized, safe to apply

Problem Type: BREAKING-CHANGE
Detection: "architecture change detected"
Decision: STOP + REQUEST-CONFIRMATION
Reasoning: Breaking changes need human decision
```

### **📝 Logging Requirements:**

```markdown
ALL ACTIONS must be logged:
- ✅ AUTO-CORRECTED: [What] from [Old] to [New] - [Reason]
- ⚠️ MANUAL-REQUIRED: [What] needs [Action] - [Reason] 
- ❌ BLOCKED: [What] stopped due to [Issue] - [Resolution needed]
- 🔄 ENHANCED: [What] improved by [Enhancement] - [Benefit]
```

---

## 📊 **SUCCESS METRICS**

### **Detection Accuracy:**
- **False Positives:** < 5% (incorrectly flagged issues)
- **False Negatives:** < 2% (missed actual issues)
- **Auto-Correction Success:** > 95% (corrections that work)
- **Manual-Request Relevance:** > 90% (requests that are actually needed)

### **Response Time:**
- **Critical Issues:** Immediate stop (< 1 action)
- **Auto-Corrections:** Real-time application
- **Manual Requests:** Within same session
- **Validation Coverage:** 100% of detected issues

### **Quality Improvement:**
- **Documentation Consistency:** Measurable improvement
- **Template Compliance:** 100% for new/updated files
- **Reference Integrity:** 0 broken links in updated content
- **Script Reliability:** All referenced scripts functional

---

## 🔧 **TEMPLATE USAGE**

### **For KI-Assistants:**
```prompt
SYSTEM: 
Apply intelligent detection patterns from this template.
- Use DETECTION KEYWORDS to identify issues automatically
- Follow AUTO-CORRECTION WORKFLOWS for safe operations
- Apply BEHAVIORAL RULES for decision making
- Generate VALIDATION LOGS for all actions
- Maintain SUCCESS METRICS for quality tracking
```

### **For Developers:**
```markdown
- Use this template to understand KI detection behavior
- Extend DETECTION PATTERNS for new issue types
- Update AUTO-CORRECTION WORKFLOWS for new safe operations
- Monitor SUCCESS METRICS for system effectiveness
- Review VALIDATION LOGS for system improvements
```

### **Integration Points:**
- **Session Start:** Load detection patterns
- **Real-Time:** Apply during all documentation/code work
- **Problem Detection:** Trigger appropriate workflows
- **Session End:** Generate validation log
- **Template Evolution:** Update patterns based on experience

---

**📍 Location:** `/docs/06-handbook/templates/VALIDATED_TEMPLATE-INTELLIGENT-DETECTION_2025-10-27.md`  
**Purpose:** KI-Assistant intelligent detection and auto-correction system  
**Usage:** Systematic problem detection and safe auto-correction workflows  
**Integration:** Core component of enhanced KI-PRÄFIX-ERKENNUNGSREGELN system