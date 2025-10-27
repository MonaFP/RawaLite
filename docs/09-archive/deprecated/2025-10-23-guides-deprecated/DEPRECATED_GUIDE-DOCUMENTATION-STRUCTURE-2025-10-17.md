# 📁 RawaLite Documentation Standards Guide

> **Comprehensive guide for maintaining KI-friendly documentation organization with quality tracking**  
> **Version:** 3.0 (Post-Consolidation) | **Updated:** 2025-10-20 (Complete structure update to actual folders)  
> **Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: VALIDATED_GUIDE-DOCUMENTATION-STRUCTURE-2025-10-15.md
```

### **STATUS-PRÄFIXE:**
- `VALIDATED_` - Validierte, stabile Dokumentation (verlässliche Quelle)
- `SOLVED_` - Gelöste Probleme und Fixes (fertige Lösung)
- `LESSON_` - Lessons Learned und Debugging (vergleichende Analyse)
- `WIP_` - Work in Progress (nur Orientierung)
- `COMPLETED_` - Abgeschlossene Implementierungen (fertige Reports)
- `PLAN_` - Planungsdokumente und Roadmaps (Entwurfsstatus)
- `DEPRECATED_` - Veraltete, ersetzte Dokumentation (ignorieren)

### **TYP-KATEGORIEN:**
- `GUIDE-` - Leitfäden, Anleitungen (wie diese Datei)
- `FIX-` - Lessons Learned, Debugging, Fixes, Problems
- `IMPL-` - Implementierungen, Features
- `REPORT-` - Berichte, Analysen, Completion-Reports
- `REGISTRY-` - Listen, Registries, Collections
- `TEMPLATE-` - Vorlagen, Templates
- `TRACKING-` - Status-Tracking, Quality-Tracking
- `PLAN-` - Planungsdokumente, Roadmaps

---

---

## 🎯 **Purpose**

This consolidated guide ensures **100% consistency** in documentation organization, quality tracking, and KI interaction patterns across all contributors. Every file placement, naming, cross-referencing, and quality decision must follow these rules.

## 🗂️ **Folder Structure & Purposes**

> **📋 Complete Current Structure:** See [../VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md](../VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md) for detailed folder contents and latest organization.

### **Core Principle:** One Topic = One Folder
Avoid overlap - each document should have a **clear singular home**.

| **Folder** | **Purpose** | **Contains** | **Examples** |
|---|---|---|---|
| **00-meta/** | Project management, meta-documentation | KI instructions, project standards, registry files | `ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS.md`, `VALIDATED_REGISTRY-CRITICAL-FIXES.md` |
| **01-core/** | Core system architecture, testing standards | System design, architecture decisions, core standards | `VALIDATED_GUIDE-ARCHITECTURE.md`, `VALIDATED_GUIDE-TESTING-STANDARDS.md` |
| **02-dev/** | Development workflows, debugging, implementation | Dev guides, debugging workflows, implementation docs | `VALIDATED_GUIDE-DEBUGGING.md`, `VALIDATED_GUIDE-DEVELOPMENT.md` |
| **03-data/** | Database design, schemas, migrations | SQLite docs, migration guides, database architecture | `VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM.md`, migration docs |
| **04-ui/** | User interface, components, PDF, themes | UI components, design patterns, PDF generation, theme system | Component docs, PDF guides, theme architecture |
| **05-deploy/** | Deployment, updates, distribution | Release processes, update system, deployment guides | Deployment docs, update manager guides |
| **06-lessons/** | Lessons learned, retrospectives, sessions | Project lessons, session reports, retrospectives | `COMPLETED_REPORT-*.md`, session summaries |
| **08-batch/** | Batch processing, operations | Batch operations, bulk processing | Batch processing guides |
| **archive/** | Deprecated/obsolete content | Old patterns, legacy documentation, deprecated files | Obsolete guides, old architectures |

---

## 📋 **File Placement Decision Tree**

### **Step 1: Identify Primary Topic**

```
Is it about...
├── Project management/meta-info? → 00-meta/
├── Core system architecture/testing? → 01-core/
├── Development workflows/debugging? → 02-dev/
├── Database/schema/migrations? → 03-data/
├── UI/components/PDF generation? → 04-ui/
├── Deployment/updates/releases? → 05-deploy/
├── Lessons learned/retrospectives? → 06-lessons/
├── Batch processing/operations? → 08-batch/
└── Deprecated/obsolete content? → archive/
```

### **Step 2: Check for Subtopics**

Many folders support **status-based** organization:
- `/active/` - Currently relevant, ongoing issues
- `/solved/` - Completed, resolved issues  
- `/migration/` - Migration-specific content (database)
- `/troubleshooting/` - Problem-solving content (architecture)

### **Step 3: Verify No Overlap**

**❌ Wrong:** Same content in multiple folders  
**✅ Right:** Single source of truth + cross-references

---

## 🏷️ **Naming Conventions**

### **Standard Patterns**

| **Type** | **Pattern** | **Example** |
|---|---|---|
| **Lessons Learned** | `LESSONS-LEARNED-specific-topic.md` | `LESSONS-LEARNED-download-verification-regression.md` |
| **Index Files** | `INDEX.md` (ALL CAPS) | `INDEX.md` |
| **Implementation Plans** | `IMPLEMENTATION-PLAN-feature.md` | `IMPLEMENTATION-PLAN-custom-updater.md` |
| **Status Reports** | `STATUS-OVERVIEW.md` | `STATUS-OVERVIEW.md` |
| **Troubleshooting** | `TROUBLESHOOTING-problem.md` | `TROUBLESHOOTING-build-issues.md` |
| **Migration Docs** | `MIGRATION-source-to-target.md` | `MIGRATION-dexie-to-sqlite.md` |
| **Validated Content** | `VALIDATED-YYYY-MM-DD_filename.md` | `VALIDATED-2025-10-15_DOCUMENTATION-STRUCTURE-GUIDE.md` |
| **Solved Problems** | `SOLVED-YYYY-MM-DD_filename.md` | `SOLVED-2025-10-15_DEBUG-REPORT-formatCurrency-extra-zero.md` |

### **Status Prefix System (KI-Friendly)**

- **`VALIDATED-YYYY-MM-DD_`** → Content reviewed and status confirmed by developer
- **`SOLVED-YYYY-MM-DD_`** → Problem completely resolved, implemented and user-confirmed  
- **Standard (no prefix)** → Needs manual review for status accuracy

### **File Naming Rules**

1. **Use hyphens (-) for word separation** - not underscores or spaces
2. **ALL CAPS for major document types** - INDEX, LESSONS-LEARNED, etc.
3. **Descriptive and specific names** - avoid generic terms
4. **Include status when relevant** - active, solved, deprecated
5. **Version or date for time-sensitive docs** - if applicable

---

## 🔗 **Cross-Reference Patterns**

### **Instead of Duplicates - Use References**

**❌ Wrong Approach:**
```
docs/03-data/IPC-DATABASE-SECURITY.md
docs/01-core/IPC-DATABASE-SECURITY.md  <-- Duplicate!
```

**✅ Correct Approach:**
```
docs/01-core/final/IPC-DATABASE-SECURITY.md  <-- Single source
docs/03-data/INDEX.md  <-- References IPC security
docs/01-core/INDEX.md  <-- References IPC security
```

### **Cross-Reference Templates**

**For related content:**
```markdown
> **Related:** See [IPC Database Security](../01-core/final/IPC-DATABASE-SECURITY.md) for implementation details
```

**For prerequisites:**
```markdown
> **Prerequisites:** Read [Architecture Overview](../01-core/final/VALIDATED_GUIDE-ARCHITECTURE.md) first
```

**For follow-up content:**
```markdown
> **Next Steps:** Continue with [Update Manager Guide](../05-deploy/final/VALIDATED_GUIDE-UPDATER-UPDATE-SYSTEM-ARCHITECTURE.md)
```

**For cross-cutting concerns:**
```markdown
> **See Also:** 
> - [Database Integration](../03-data/final/VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM.md)
> - [Core Architecture](../01-core/final/VALIDATED_GUIDE-ARCHITECTURE.md)
> - [Development Guide](../02-dev/final/VALIDATED_GUIDE-DEVELOPMENT.md)
```

---

## 📚 **INDEX.md Maintenance**

### **Every Folder Must Have INDEX.md**

**Purpose:** Overview and navigation for both humans and KI

**Template Structure:**
```markdown
# [Folder Topic] - Overview

> **Purpose:** Brief description of folder contents and scope

## 📋 **Contents**

### **Active Issues**
- [Issue Name](active/file.md) - Brief description

### **Solved Issues**  
- [Solution Name](solved/file.md) - Brief description

### **Documentation**
- [Doc Name](file.md) - Brief description

## 🔗 **Related Topics**

- [Related Topic](../other-folder/file.md) - Cross-reference
- [Another Topic](../folder/file.md) - Cross-reference

## 📈 **Status**

- **Last Updated:** YYYY-MM-DD
- **Active Issues:** X
- **Documentation Status:** Complete/In Progress/Needs Update
```

---

## 🤖 **KI Integration Guidelines**

### **For KI Agents (GitHub Copilot, etc.)**

**Before creating ANY documentation:**

1. **Check existing structure:** Review `docs/` folder organization
2. **Identify correct folder:** Use decision tree above
3. **Check for duplicates:** Search for similar content
4. **Follow naming patterns:** Use established conventions
5. **Update INDEX.md:** Add new content to relevant index
6. **Add cross-references:** Link to related content

### **Validation Checklist**

Before submitting documentation changes:

- [ ] File is in correct folder per decision tree
- [ ] Filename follows naming conventions  
- [ ] No duplicate content exists elsewhere
- [ ] Relevant INDEX.md files updated
- [ ] Cross-references added where appropriate
- [ ] Content serves single, clear purpose

---

## 🔄 **Migration & Updates**

### **When Structure Changes**

1. **Update this guide first** - maintain single source of truth
2. **Update ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS.md** - ensure KI compliance
3. **Update all INDEX.md files** - maintain navigation
4. **Add migration notes** - document what changed
5. **Validate all cross-references** - fix broken links

### **Continuous Maintenance**

- **Monthly review** - check for organizational drift
- **KI session validation** - verify KI follows structure
- **Cross-reference audits** - ensure links remain valid
- **Duplicate detection** - prevent content drift

---

## 🎯 **Success Metrics**

**Perfect Documentation Structure:**
- ✅ Zero duplicate files across folders
- ✅ Every file in logical, predictable location
- ✅ All INDEX.md files current and complete
- ✅ Cross-references working and relevant
- ✅ KI can navigate structure automatically
- ✅ New team members find information intuitively

---

## 📞 **Questions & Updates**

**For structure questions:**
1. Check this guide first
2. Review folder INDEX.md files
3. Look for similar existing content
4. Follow decision tree process
5. Ask team if still unclear

**For guide updates:**
- Only update through proper review process
- Document all changes with rationale
- Update KI instructions accordingly
- Communicate changes to team

---

**Remember:** Consistency is key to KI-friendly documentation. When in doubt, follow established patterns and ask for clarification rather than improvising. 🚀

---

## 📊 **Quality Tracking & Validation**

### **Documentation Quality Standards**

Every documentation change must meet these criteria:
- ✅ **Single Source of Truth** - No duplicate content across files
- ✅ **Correct Folder Placement** - Follows decision tree above
- ✅ **Proper Cross-References** - Links to related content, no broken links
- ✅ **KI-Friendly Structure** - Clear navigation for automated processing
- ✅ **Current Information** - No outdated technical references
- ✅ **Complete Coverage** - All major topics adequately documented

### **Quality Validation Checklist**

Before submitting documentation changes:

#### **Structure Validation:**
- [ ] File is in correct folder per decision tree
- [ ] Filename follows naming conventions  
- [ ] No duplicate content exists elsewhere
- [ ] Relevant INDEX.md files updated
- [ ] Cross-references added where appropriate

#### **Content Validation:**
- [ ] Information is current and accurate
- [ ] Technical references match actual implementation
- [ ] Examples work and are tested
- [ ] No broken internal or external links
- [ ] Proper markdown formatting

#### **KI Integration Validation:**
- [ ] Content serves single, clear purpose
- [ ] Navigation paths are logical
- [ ] Decision trees are unambiguous
- [ ] Emergency procedures are actionable

### **Common Quality Issues & Solutions**

| **Issue Type** | **Detection** | **Solution** | **Prevention** |
|---|---|---|---|
| **Broken Links** | Manual link checking | Fix or remove dead links | Use relative paths, validate during PR |
| **Duplicate Content** | Content comparison | Consolidate into single source | Check existing docs before creating |
| **Outdated Tech References** | Version mismatches | Update to current versions | Regular quarterly review |
| **Poor Cross-References** | Navigation difficulty | Add proper "See Also" sections | Follow cross-reference patterns |
| **Inconsistent Naming** | Pattern deviations | Rename to follow conventions | Use naming convention checklist |

### **Quality Metrics & Monitoring**

Track these metrics for documentation health:
- **Link Integrity:** % of working internal links
- **Coverage Completeness:** % of major features documented  
- **Update Frequency:** Days since last content update
- **KI Navigation Success:** Successful KI task completion rate
- **Developer Onboarding Time:** Time for new developers to find information

---
