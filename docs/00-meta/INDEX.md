# 📋 RELEASE WORKFLOW INDEX - KI-optimierte Release-Prompts# 📋 RELEASE WORKFLOW INDEX - KI-optimierte Release-Prompts



**Zweck:** Strukturierte Prompts für VS Code Chat zur Automatisierung des Release-Prozesses**Zweck:** Strukturierte Prompts für VS Code Chat zur Automatisierung des Release-Prozesses



## 🚀 MAIN WORKFLOWS## 🚀 MAIN WORKFLOWS



### 📄 RELEASE-WORKFLOW-PROMPT.md### 📄 RELEASE-WORKFLOW-PROMPT.md

**Verwendung:** Vollständiger Standard-Release-Prozess  **Verwendung:** Vollständiger Standard-Release-Prozess  

**Trigger:** *"Führe einen Release-Workflow durch - Typ: [patch/minor/major] für [Beschreibung]"*  **Trigger:** *"Führe einen Release-Workflow durch - Typ: [patch/minor/major] für [Beschreibung]"*  

**Dauer:** ~10-15 Minuten  **Dauer:** ~10-15 Minuten  

**Scope:** Pre-validation → Version bump → GitHub Release → Post-verification**Scope:** Pre-validation → Version bump → GitHub Release → Post-verification



### ⚡ RELEASE-CHECKLIST-COMPACT.md  ### ⚡ RELEASE-CHECKLIST-COMPACT.md  

**Verwendung:** Schneller Release ohne ausführliche Details  **Verwendung:** Schneller Release ohne ausführliche Details  

**Trigger:** *"Quick Release: [patch/minor/major] für [Beschreibung] - alle Steps durchführen"*  **Trigger:** *"Quick Release: [patch/minor/major] für [Beschreibung] - alle Steps durchführen"*  

**Dauer:** ~5-10 Minuten  **Dauer:** ~5-10 Minuten  

**Scope:** Kompakte Checkliste für erfahrene Releases**Scope:** Kompakte Checkliste für erfahrene Releases



### 🚨 HOTFIX-WORKFLOW-PROMPT.md### 🚨 HOTFIX-WORKFLOW-PROMPT.md

**Verwendung:** Emergency-Release für kritische Production-Issues  **Verwendung:** Emergency-Release für kritische Production-Issues  

**Trigger:** *"EMERGENCY HOTFIX für [kritisches Problem] - Fast-Track Release durchführen"*  **Trigger:** *"EMERGENCY HOTFIX für [kritisches Problem] - Fast-Track Release durchführen"*  

**Dauer:** ~15-20 Minuten max  **Dauer:** ~15-20 Minuten max  

**Scope:** Minimal-Validation → Critical Fix → Sofort-Release**Scope:** Minimal-Validation → Critical Fix → Sofort-Release



### 🔧 RELEASE-TROUBLESHOOTING-PROMPT.md### 🔧 RELEASE-TROUBLESHOOTING-PROMPT.md

**Verwendung:** Problem-Lösung wenn Release-Workflow fehlschlägt  **Verwendung:** Problem-Lösung wenn Release-Workflow fehlschlägt  

**Trigger:** *"Release Problem Troubleshooting für [spezifisches Problem]"*  **Trigger:** *"Release Problem Troubleshooting für [spezifisches Problem]"*  

**Dauer:** Variable  **Dauer:** Variable  

**Scope:** Diagnose → Lösung → Recovery**Scope:** Diagnose → Lösung → Recovery



## 🎯 USAGE PATTERNS## 🎯 USAGE PATTERNS



### Standard Release Workflow### Standard Release Workflow

``````

1. Drag & Drop: RELEASE-WORKFLOW-PROMPT.md → VS Code Chat1. Drag & Drop: RELEASE-WORKFLOW-PROMPT.md → VS Code Chat

2. Message: "Führe Release-Workflow durch - patch für UpdateManager fixes"2. Message: "Führe Release-Workflow durch - patch für UpdateManager fixes"

3. KI führt kompletten Workflow durch3. KI führt kompletten Workflow durch

4. Human: Minimal oversight, bestätigt kritische Steps4. Human: Minimal oversight, bestätigt kritische Steps

``````



### Emergency Hotfix### Emergency Hotfix

``````

1. Drag & Drop: HOTFIX-WORKFLOW-PROMPT.md → VS Code Chat  1. Drag & Drop: HOTFIX-WORKFLOW-PROMPT.md → VS Code Chat  

2. Message: "EMERGENCY HOTFIX für [critical issue] - Fast-Track Release"2. Message: "EMERGENCY HOTFIX für [critical issue] - Fast-Track Release"

3. KI prioritizes speed + safety3. KI prioritizes speed + safety

4. Human: Immediate testuser communication4. Human: Immediate testuser communication

``````



### Quick Release### Quick Release

``````

1. Drag & Drop: RELEASE-CHECKLIST-COMPACT.md → VS Code Chat1. Drag & Drop: RELEASE-CHECKLIST-COMPACT.md → VS Code Chat

2. Message: "Quick Release: patch - alle Steps durchführen"2. Message: "Quick Release: patch - alle Steps durchführen"

3. KI arbeitet Checklist schnell ab3. KI arbeitet Checklist schnell ab

4. Human: Final verification4. Human: Final verification

``````



## 📊 RELEASE TRACKING## 📊 RELEASE TRACKING



### Current State (2025-10-09)### Current State (2025-10-09)

- **Version:** 1.0.33- **Version:** 1.0.33

- **Critical Fixes:** 14/14 active- **Critical Fixes:** 14/14 active

- **Last Release:** UpdateManager Asset Validation + Testuser Experience- **Last Release:** UpdateManager Asset Validation + Testuser Experience

- **GitHub Actions:** .github/workflows/release.yml operational- **GitHub Actions:** .github/workflows/release.yml operational



### Next Planned Releases### Next Planned Releases

- **v1.0.34:** Patch - Release workflow improvements  - **v1.0.34:** Patch - Release workflow improvements  

- **v1.1.0:** Minor - Focus Mode v3 + Activity Templates enhancement- **v1.1.0:** Minor - Focus Mode v3 + Activity Templates enhancement

- **v2.0.0:** Major - Architecture changes (TBD)- **v2.0.0:** Major - Architecture changes (TBD)



## 🔧 TECHNICAL INTEGRATION## 🔧 TECHNICAL INTEGRATION



### Required Tools### Required Tools

- **pnpm:** Package Manager (never npm!)- **pnpm:** Package Manager (never npm!)

- **GitHub CLI:** `gh` command for release creation- **GitHub CLI:** `gh` command for release creation

- **Git:** Version control + tagging- **Git:** Version control + tagging

- **VS Code:** With GitHub Copilot Chat- **VS Code:** With GitHub Copilot Chat



### Key Files### Key Files

- **package.json:** Version source of truth- **package.json:** Version source of truth

- **CRITICAL-FIXES-REGISTRY.md:** Mandatory validation patterns- **CRITICAL-FIXES-REGISTRY.md:** Mandatory validation patterns

- **.github/workflows/release.yml:** Automated build pipeline- **.github/workflows/release.yml:** Automated build pipeline

- **dist-release/:** Manual asset fallback location- **dist-release/:** Manual asset fallback location



### Validation Commands### Validation Commands

```bash```bash

pnpm validate:critical-fixes  # 14/14 expectedpnpm validate:critical-fixes  # 14/14 expected

pnpm test                     # All tests must passpnpm test                     # All tests must pass

git status                    # Clean working tree requiredgit status                    # Clean working tree required

``````



## 🎨 CUSTOMIZATION## 🎨 CUSTOMIZATION



### Modifying Prompts### Modifying Prompts

- **Add new validation steps:** Update PHASE 1 in main workflow- **Add new validation steps:** Update PHASE 1 in main workflow

- **Change release types:** Modify semantic versioning rules- **Change release types:** Modify semantic versioning rules

- **Add new troubleshooting:** Extend RELEASE-TROUBLESHOOTING-PROMPT.md- **Add new troubleshooting:** Extend RELEASE-TROUBLESHOOTING-PROMPT.md

- **Custom communications:** Update testuser communication templates- **Custom communications:** Update testuser communication templates



### Project-Specific Context### Project-Specific Context

- **Repository:** MonaFP/RawaLite- **Repository:** MonaFP/RawaLite

- **Package Manager:** pnpm only- **Package Manager:** pnpm only

- **Critical Fixes:** Must be preserved across all releases- **Critical Fixes:** Must be preserved across all releases

- **Asset Requirements:** .exe + .yml files for UpdateManager- **Asset Requirements:** .exe + .yml files for UpdateManager



## 📚 INTEGRATION WITH DOCUMENTATION## 📚 INTEGRATION WITH DOCUMENTATION



### Cross-References### Cross-References

- **Critical Fixes:** Links to CRITICAL-FIXES-REGISTRY.md- **Critical Fixes:** Links to CRITICAL-FIXES-REGISTRY.md

- **Lessons Learned:** Integration with /docs/12-lessons/- **Lessons Learned:** Integration with /docs/12-lessons/

- **Troubleshooting:** References to existing debugging guides- **Troubleshooting:** References to existing debugging guides

- **Update System:** Connection to /docs/11-deployment/- **Update System:** Connection to /docs/11-deployment/



### Documentation Updates### Documentation Updates

- **Post-Release:** Update version references in README.md- **Post-Release:** Update version references in README.md

- **Critical Fixes:** New fixes added to registry during workflow- **Critical Fixes:** New fixes added to registry during workflow

- **Lessons Learned:** Failed releases documented in /docs/12-lessons/- **Lessons Learned:** Failed releases documented in /docs/12-lessons/



------



## 🎯 QUICK REFERENCE## 🎯 QUICK REFERENCE



**Standard Release:** `RELEASE-WORKFLOW-PROMPT.md`  **Standard Release:** `RELEASE-WORKFLOW-PROMPT.md`  

**Quick Release:** `RELEASE-CHECKLIST-COMPACT.md`  **Quick Release:** `RELEASE-CHECKLIST-COMPACT.md`  

**Emergency:** `HOTFIX-WORKFLOW-PROMPT.md`  **Emergency:** `HOTFIX-WORKFLOW-PROMPT.md`  

**Problems:** `RELEASE-TROUBLESHOOTING-PROMPT.md`**Problems:** `RELEASE-TROUBLESHOOTING-PROMPT.md`



**All workflows expect GitHub Copilot to execute systematically with human oversight for critical decisions.****All workflows expect GitHub Copilot to execute systematically with human oversight for critical decisions.**



------



# 00-meta - Project Meta-Documentation# 00-meta - Project Meta-Documentation



> **Purpose:** Project management, KI instructions, standards, and organizational documentation> **Purpose:** Project management, KI instructions, standards, and organizational documentation



## 📋 **Contents**## 📋 **Contents**



### **🤖 KI Instructions & Guides**### **🤖 KI Instructions & Guides**

- [INSTRUCTIONS-KI.md](INSTRUCTIONS-KI.md) - Mandatory KI development rules and patterns- [INSTRUCTIONS-KI.md](INSTRUCTIONS-KI.md) - Mandatory KI development rules and patterns

- [ONBOARDING-GUIDE.md](ONBOARDING-GUIDE.md) - Complete setup guide for new team members- [ONBOARDING-GUIDE.md](ONBOARDING-GUIDE.md) - Complete setup guide for new team members

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problem-solving guide for fix preservation system- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problem-solving guide for fix preservation system

- [DOCUMENTATION-STRUCTURE-GUIDE.md](DOCUMENTATION-STRUCTURE-GUIDE.md) - How to organize documentation correctly- [DOCUMENTATION-STRUCTURE-GUIDE.md](DOCUMENTATION-STRUCTURE-GUIDE.md) - How to organize documentation correctly



### **🛡️ Fix Preservation System**### **🛡️ Fix Preservation System**

- [CRITICAL-FIXES-REGISTRY.md](CRITICAL-FIXES-REGISTRY.md) - Registry of all critical fixes that must be preserved- [CRITICAL-FIXES-REGISTRY.md](CRITICAL-FIXES-REGISTRY.md) - Registry of all critical fixes that must be preserved

- [SYSTEMATIC-FIX-PRESERVATION-STRATEGY.md](active/SYSTEMATIC-FIX-PRESERVATION-STRATEGY.md) - 4-layer defense strategy- [SYSTEMATIC-FIX-PRESERVATION-STRATEGY.md](active/SYSTEMATIC-FIX-PRESERVATION-STRATEGY.md) - 4-layer defense strategy



### **📊 Project Management**### **📊 Project Management**

- [README.md](README.md) - Meta-documentation overview- [README.md](README.md) - Meta-documentation overview

- [DOCUMENTATION-QUALITY-TRACKING.md](DOCUMENTATION-QUALITY-TRACKING.md) - Documentation quality metrics- [DOCUMENTATION-QUALITY-TRACKING.md](DOCUMENTATION-QUALITY-TRACKING.md) - Documentation quality metrics

- [REORGANIZATION-CHANGE-LOG.md](REORGANIZATION-CHANGE-LOG.md) - Documentation structure changes- [REORGANIZATION-CHANGE-LOG.md](REORGANIZATION-CHANGE-LOG.md) - Documentation structure changes

- [LESSONS-LEARNED-TEMPLATE.md](LESSONS-LEARNED-TEMPLATE.md) - Template for lessons learned documents- [LESSONS-LEARNED-TEMPLATE.md](LESSONS-LEARNED-TEMPLATE.md) - Template for lessons learned documents



### **🔄 Active Issues**### **🔄 Active Issues**

- [DOWNLOAD-VERIFICATION-BUG.md](active/DOWNLOAD-VERIFICATION-BUG.md) - Download verification analysis- [DOWNLOAD-VERIFICATION-BUG.md](active/DOWNLOAD-VERIFICATION-BUG.md) - Download verification analysis

- [LESSONS-LEARNED-DOWNLOAD-VERIFICATION-REGRESSION.md](active/LESSONS-LEARNED-DOWNLOAD-VERIFICATION-REGRESSION.md) - Regression analysis- [LESSONS-LEARNED-DOWNLOAD-VERIFICATION-REGRESSION.md](active/LESSONS-LEARNED-DOWNLOAD-VERIFICATION-REGRESSION.md) - Regression analysis

- [MOCK-HOOK-PREVENTION-STRATEGY.md](active/MOCK-HOOK-PREVENTION-STRATEGY.md) - Mock hook prevention- [MOCK-HOOK-PREVENTION-STRATEGY.md](active/MOCK-HOOK-PREVENTION-STRATEGY.md) - Mock hook prevention

- [SESSION-REPORT-v1.0.10-DEVELOPMENT.md](active/SESSION-REPORT-v1.0.10-DEVELOPMENT.md) - Development session report- [SESSION-REPORT-v1.0.10-DEVELOPMENT.md](active/SESSION-REPORT-v1.0.10-DEVELOPMENT.md) - Development session report



### **✅ Solved Issues**### **✅ Solved Issues**

- [LESSONS-LEARNED-DOCUMENTATION-REORGANIZATION.md](solved/LESSONS-LEARNED-DOCUMENTATION-REORGANIZATION.md) - Documentation reorganization lessons- [LESSONS-LEARNED-DOCUMENTATION-REORGANIZATION.md](solved/LESSONS-LEARNED-DOCUMENTATION-REORGANIZATION.md) - Documentation reorganization lessons



### **🔧 Debugging & Development**### **🔧 Debugging & Development**

- [CHAT-SESSION-SUMMARY-2025-10-01.md](debugging/active/CHAT-SESSION-SUMMARY-2025-10-01.md) - Chat session analysis- [CHAT-SESSION-SUMMARY-2025-10-01.md](debugging/active/CHAT-SESSION-SUMMARY-2025-10-01.md) - Chat session analysis

- [CROSS-REF-settings-schema-migration.md](debugging/solved/CROSS-REF-settings-schema-migration.md) - Schema migration cross-reference- [CROSS-REF-settings-schema-migration.md](debugging/solved/CROSS-REF-settings-schema-migration.md) - Schema migration cross-reference

- [LESSONS-LEARNED-typescript-unused-imports.md](debugging/solved/LESSONS-LEARNED-typescript-unused-imports.md) - TypeScript import cleanup- [LESSONS-LEARNED-typescript-unused-imports.md](debugging/solved/LESSONS-LEARNED-typescript-unused-imports.md) - TypeScript import cleanup



### **📈 Project Status**### **📈 Project Status**

- [REPOSITORY-STATUS-POST-v1.0.10-SESSION.md](REPOSITORY-STATUS-POST-v1.0.10-SESSION.md) - Repository status analysis- [REPOSITORY-STATUS-POST-v1.0.10-SESSION.md](REPOSITORY-STATUS-POST-v1.0.10-SESSION.md) - Repository status analysis

- [SCHEMA-CONSISTENCY-STANDARDS.md](SCHEMA-CONSISTENCY-STANDARDS.md) - Database schema standards- [GITHUB_API_MIGRATION.md](GITHUB_API_MIGRATION.md) - GitHub CLI to API migration plan

- [SCHEMA-CONSISTENCY-STANDARDS.md](SCHEMA-CONSISTENCY-STANDARDS.md) - Database schema standards

## 🔗 **Related Topics**

## 🔗 **Related Topics**

- [Standards & Conventions](../01-standards/) - Code standards and development guidelines

- [Architecture](../02-architecture/) - System design and technical architecture  - [Standards & Conventions](../01-standards/) - Code standards and development guidelines

- [Development](../03-development/) - Development workflows and environment setup- [Architecture](../02-architecture/) - System design and technical architecture  

- [Critical Fix Tests](../../tests/critical-fixes/) - Automated validation of critical patterns- [Development](../03-development/) - Development workflows and environment setup

- [Critical Fix Tests](../../tests/critical-fixes/) - Automated validation of critical patterns

## 📈 **Status**

## 📈 **Status**

- **Last Updated:** 2025-10-09

- **Active Issues:** 4 (Fix preservation, download verification, documentation)- **Last Updated:** 2025-10-09

- **Documentation Status:** Complete - Post-reorganization structure + Release workflows- **Active Issues:** 4 (Fix preservation, download verification, documentation)

- **Fix Preservation:** 4-layer defense system implemented and documented- **Documentation Status:** Complete - Post-reorganization structure + Release workflows
- **Fix Preservation:** 4-layer defense system implemented and documented