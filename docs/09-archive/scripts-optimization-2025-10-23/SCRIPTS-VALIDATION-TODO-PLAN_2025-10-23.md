# SCRIPTS SYSTEM - CODE-FIRST VALIDATION TODO PLAN

> **Validierung:** 23.10.2025 | **Methodik:** Repository as Ground Truth | **Status:** ⚠️ **SYNC CORRECTIONS REQUIRED**  
> **Schema:** `SCRIPTS-VALIDATION-TODO-PLAN_2025-10-23.md`

---

## 📊 **VALIDATION ERGEBNIS: SYNC CORRECTIONS NEEDED**

### **🎯 SCRIPTS SYSTEM STATUS: 75% (FUNCTIONAL WITH GAPS)**

**REPOSITORY VERIFICATION:**
- ✅ 69 Scripts total im Filesystem (100% present)
- ⚠️ 14 Scripts fehlen in Registry Documentation
- ⚠️ 20.3% Schema non-compliance (mostly justified legacy scripts)
- ✅ 88% package.json coverage
- ✅ All critical scripts operational

**CORRECTIONS REQUIRED:**

| **Issue** | **Severity** | **Files Affected** | **Priority** |
|:--|:--|:--|:--|
| Registry Documentation Sync | MEDIUM | ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md | HIGH |
| Package.json Cleanup | LOW | package.json (7 obsolete entries) | MEDIUM |
| Schema Compliance Assessment | LOW | 14 non-compliant scripts | LOW |

---

## 📋 **TODO-PLAN: LOGISCHE REIHENFOLGE (ÜBERARBEITET)**

### **TASK 1: Schema Compliance Assessment & Renaming Strategy (HIGH PRIORITY - FIRST)**

```yaml
Objective: Evaluate schema non-compliant scripts for strategic renaming
Impact: HIGH (affects all subsequent tasks)
Files: 12 non-compliant scripts + 2 borderline cases
Time: 30-45 minutes (analysis + decisions)
Priority: MUST BE FIRST - affects registry entries and package.json
```

**Critical Decision Points:**
```yaml
IMMEDIATE RENAMING CANDIDATES (Strategic Value):
  FIX_BROKEN_DOCUMENTATION_REFERENCES.ps1 → DOCS_REFERENCES_BROKEN_FIX.ps1
  FIX_FINAL_DOCUMENTATION_ISSUES.ps1 → DOCS_ISSUES_FINAL_FIX.ps1  
  FIX_SPECIFIC_BROKEN_REFERENCES.ps1 → DOCS_REFERENCES_SPECIFIC_FIX.ps1
  FIX_TEMPLATE_DOCUMENTATION_REFERENCES.ps1 → DOCS_TEMPLATE_REFERENCES_FIX.ps1
  VALIDATE_DOCUMENTATION_REFERENCES.ps1 → VALIDATE_DOCS_REFERENCES_CHECK.ps1

KEEP AS-IS (Justified Legacy/Special Purpose):
  ipc-test-script.js → Legacy test utility (keep)
  COMPREHENSIVE_DATABASE_GAP_ANALYSIS.mjs → Analysis tool (keep)
  DEBUG_NAVIGATION_HEIGHTS_DETAILED.mjs → Debug utility (keep)
  DEMO_NAVIGATION_STATE_MANAGER_PHASE1.mjs → Demo/prototype (keep)
  DOCUMENT_NAVIGATION_HEIGHTS_PROBLEM.mjs → Documentation tool (keep)
  QUICK_NAVIGATION_STATUS_CHECK.mjs → Quick utility (keep)
  TEST_NAVIGATION_HEADER_HEIGHTS_FIX.mjs → Test utility (keep)
  TEST_PER_MODE_SETTINGS_FIX.mjs → Test utility (keep)
  VALIDATE_DATABASE_PATH_CONSISTENCY_SIMPLE.mjs → Simple variant (keep)
```

**DECISION RATIONALE:**
- **FIX_* Scripts:** Easily convert to DOCS_* schema (5 scripts)
- **VALIDATE_DOCUMENTATION_REFERENCES.ps1:** Clear schema mapping available
- **Others:** Keep as documented exceptions (development/analysis utilities)

### **TASK 2: Execute Strategic Script Renaming (HIGH PRIORITY - SECOND)**

```yaml
Objective: Rename strategically valuable scripts to schema compliance
Impact: MEDIUM (improves schema compliance from 79.7% to 88.4%)
Files: 6 scripts + package.json references + git history
Time: 20-30 minutes (rename + update references)
```

**Implementation Steps:**
```bash
# Rename operations (with git history preservation)
git mv scripts/FIX_BROKEN_DOCUMENTATION_REFERENCES.ps1 scripts/DOCS_REFERENCES_BROKEN_FIX.ps1
git mv scripts/FIX_FINAL_DOCUMENTATION_ISSUES.ps1 scripts/DOCS_ISSUES_FINAL_FIX.ps1
git mv scripts/FIX_SPECIFIC_BROKEN_REFERENCES.ps1 scripts/DOCS_REFERENCES_SPECIFIC_FIX.ps1
git mv scripts/FIX_TEMPLATE_DOCUMENTATION_REFERENCES.ps1 scripts/DOCS_TEMPLATE_REFERENCES_FIX.ps1
git mv scripts/VALIDATE_DOCUMENTATION_REFERENCES.ps1 scripts/VALIDATE_DOCS_REFERENCES_CHECK.ps1

# Update any internal references in scripts
# Update any package.json references if they exist
```

### **TASK 3: Registry Documentation Update (HIGH PRIORITY - THIRD)**

```yaml
Objective: Add all 69 scripts to registry with correct post-rename names
Impact: HIGH (complete documentation accuracy)
Files: docs/ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md
Time: 45-60 minutes
```

**Implementation Steps:**
```markdown
1. Update script count: 56 → 69
2. Add 14 scripts to registry table (with correct names after renames):
   - DOCS_REFERENCES_BROKEN_FIX.ps1 (renamed from FIX_*)
   - DOCS_ISSUES_FINAL_FIX.ps1 (renamed from FIX_*)
   - DOCS_REFERENCES_SPECIFIC_FIX.ps1 (renamed from FIX_*)
   - DOCS_TEMPLATE_REFERENCES_FIX.ps1 (renamed from FIX_*)
   - VALIDATE_DOCS_REFERENCES_CHECK.ps1 (renamed from VALIDATE_*)
   - COMPREHENSIVE_DATABASE_GAP_ANALYSIS.mjs (legacy exception)
   - DEBUG_NAVIGATION_HEIGHTS_DETAILED.mjs (debug exception) 
   - DEMO_NAVIGATION_STATE_MANAGER_PHASE1.mjs (demo exception)
   - DOCUMENT_NAVIGATION_HEIGHTS_PROBLEM.mjs (doc exception)
   - QUICK_NAVIGATION_STATUS_CHECK.mjs (utility exception)
   - TEST_NAVIGATION_HEADER_HEIGHTS_FIX.mjs (test exception)
   - TEST_PER_MODE_SETTINGS_FIX.mjs (test exception)
   - VALIDATE_DATABASE_PATH_CONSISTENCY_SIMPLE.mjs (variant exception)
   - ipc-test-script.js (legacy exception)

3. Update statistics section:
   - Schema compliance: 79.7% → 88.4% (61/69)
   - Categories distribution with new DOCS entries
   - Document 8 justified exceptions

4. Add exception documentation section
```

### **TASK 4: Package.json Cleanup (MEDIUM PRIORITY - FOURTH)**

```yaml
Objective: Remove obsolete script references + update renamed script references
Impact: LOW (cosmetic cleanup) + MEDIUM (renamed script references)
Files: package.json
Time: 20 minutes (increased due to rename updates)
```

**Implementation:**
```json
// UPDATE - renamed script references:
{
  "scripts": {
    // Update any references to renamed scripts:
    "docs:references-broken-fix": "pwsh -File scripts/DOCS_REFERENCES_BROKEN_FIX.ps1",
    "docs:issues-final-fix": "pwsh -File scripts/DOCS_ISSUES_FINAL_FIX.ps1", 
    "docs:references-specific-fix": "pwsh -File scripts/DOCS_REFERENCES_SPECIFIC_FIX.ps1",
    "docs:template-references-fix": "pwsh -File scripts/DOCS_TEMPLATE_REFERENCES_FIX.ps1",
    "validate:docs-references": "pwsh -File scripts/VALIDATE_DOCS_REFERENCES_CHECK.ps1"
  }
}

// REMOVE obsolete entries:
{
  "scripts": {
    // REMOVE - renamed/deleted scripts:
    "validate:docs-consistency-old": "REMOVED",
    "validate:links-quick": "REMOVED", 
    "validate:master-enhanced": "REMOVED",
    "docs:cross-reference-integrity": "REMOVED",
    "docs:metadata-consistency-old": "REMOVED",
    "docs:schema-compliance-old": "REMOVED",
    "docs:schema-compliance-incremental-old": "REMOVED"
  }
}
```

### **TASK 5: Final Validation Check (HIGH PRIORITY - LAST)**

```yaml
Objective: Verify all corrections are successful and functional
Impact: HIGH (ensure no breakage from changes)
Files: Complete system validation
Time: 10-15 minutes
```

**Validation Steps:**
```bash
# Verify script renames are functional
pnpm validate:scripts-registry

# Test renamed scripts work
pwsh -File scripts/DOCS_REFERENCES_BROKEN_FIX.ps1 --dry-run
pwsh -File scripts/VALIDATE_DOCS_REFERENCES_CHECK.ps1 --dry-run

# Verify package.json references work
pnpm docs:references-broken-fix --help
pnpm validate:docs-references --help

# Expected result after all tasks:
# - Registry Sync: ✅ (69/69 documented)
# - Schema Compliance: ✅ 88.4% (61/69) 
# - Package.json: ✅ (clean + updated references)
# - All scripts functional: ✅
```

---

## ⚡ **EXECUTION STRATEGY (ÜBERARBEITET)**

### **PHASE 1: SCHEMA OPTIMIZATION (Week 1 - HIGH PRIORITY)**
1. **Schema Compliance Assessment & Renaming Strategy** (FIRST - affects all other tasks)
   - Analyze 12 non-compliant scripts for rename potential
   - Decide which scripts get strategic renames vs documented exceptions
   - Document rationale for keep-as-is decisions

2. **Execute Strategic Script Renaming** (SECOND - before registry update)
   - Rename 5-6 high-value FIX_*/VALIDATE_* scripts to schema compliance
   - Preserve git history with git mv
   - Improve schema compliance from 79.7% to ~88.4%

3. **Registry Documentation Update** (THIRD - after renames complete)
   - Add all 69 scripts with correct post-rename names
   - Update statistics to reflect improved schema compliance
   - Document 8 justified exceptions with rationale

4. **Package.json Cleanup & Update** (FOURTH - sync with renames)
   - Remove 7 obsolete script references
   - Add/update references for renamed scripts
   - Verify all active scripts have proper package.json entries

5. **Final Validation Check** (LAST - ensure no breakage)
   - Run pnpm validate:scripts-registry
   - Test renamed scripts functionality
   - Verify package.json references work

### **PHASE 2: STRATEGIC DOCUMENTATION (Month 1)**
6. **Exception Documentation Strategy** (LOW priority - after functionality confirmed)
   - Document rationale for 8 remaining non-compliant scripts
   - Create schema evolution consideration document
   - Establish criteria for future schema exceptions

### **LOGICAL DEPENDENCY CHAIN:**
```
Schema Assessment → Script Renames → Registry Update → Package.json Sync → Validation
     (affects)         (affects)       (references)      (references)       (validates)
```

**CRITICAL INSIGHT:** Jeder Task hängt vom vorherigen ab. Schema-Entscheidungen beeinflussen alle nachfolgenden Schritte.

### **VALIDATION APPROACH:**
```bash
# After each phase:
git status                           # Verify renames preserved in git
pnpm validate:scripts-registry       # Check registry sync
ls scripts/ | measure-object         # Confirm 69 scripts present

# Expected result after Phase 1:
# - Schema Compliance: 88.4% (61/69 - 8 documented exceptions)
# - Registry Sync: ✅ (69/69 documented)
# - Package.json: ✅ (clean references + renamed script updates)
# - Git History: ✅ (preserved with git mv)
# - Functionality: ✅ (all scripts operational)
```

---

## 🎯 **SUCCESS CRITERIA**

### **PHASE 1 COMPLETION:**
- ✅ All 69 scripts documented in registry
- ✅ Schema compliance improved to 88.4% (61/69)
- ✅ 8 non-compliant scripts have documented exception rationale
- ✅ Package.json cleaned of obsolete entries + updated for renames
- ✅ Git history preserved for renamed scripts
- ✅ `pnpm validate:scripts-registry` passes all checks

### **PHASE 2 COMPLETION:**
- ✅ Exception strategy documented for remaining 8 scripts
- ✅ Schema evolution criteria established
- ✅ Future improvement roadmap created

### **FINAL TARGET:**
- **Registry Sync:** 100% (69/69 documented)
- **Schema Compliance:** 88.4% (61/69 with 8 documented exceptions)
- **Package.json Accuracy:** 100% (clean references + renamed script updates)
- **Git History:** Preserved (git mv for strategic renames)
- **Functionality:** 100% (all scripts operational)

---

## 🎯 **STRATEGIC ASSESSMENT**

**Scripts System Status:** ✅ **FUNCTIONAL WITH MINOR SYNC GAPS**

**Required Actions:** **MEDIUM PRIORITY CORRECTIONS**
- Registry documentation update needed
- Package.json cleanup beneficial
- Schema compliance strategy helpful but not critical

**System Health:** Scripts ecosystem is **100% FUNCTIONAL** with excellent automation. Documentation sync improves maintenance but doesn't affect operational capability.

**Business Impact:** **LOW** - All critical scripts work perfectly. Corrections improve documentation accuracy and maintenance efficiency.

---

## 📋 **IMPLEMENTATION TIMELINE**

### **IMMEDIATE (This Week - PHASE 1):**
- Schema compliance assessment & renaming strategy (FIRST)
- Strategic script renames for high-value improvements (SECOND)  
- Registry documentation sync with post-rename names (THIRD)
- Package.json cleanup & rename reference updates (FOURTH)
- Final validation to ensure no breakage (LAST)

### **SHORT-TERM (This Month - PHASE 2):**
- Exception documentation strategy (LOW priority)
- Schema evolution criteria establishment

### **LONG-TERM (Future):**
- Automated registry sync enhancement
- Schema evolution consideration  
- CI/CD registry validation

---

**📍 Location:** `/scripts/SCRIPTS-VALIDATION-TODO-PLAN_2025-10-23.md`  
**Purpose:** TODO plan for scripts system registry sync and cleanup  
**Priority:** MEDIUM - functional system with documentation gaps  
**Timeline:** Week 1 (critical), Month 1 (strategic)