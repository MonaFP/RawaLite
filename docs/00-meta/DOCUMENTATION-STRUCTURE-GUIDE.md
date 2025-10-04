# 📁 RawaLite Documentation Structure Guide

> **Comprehensive guide for maintaining KI-friendly documentation organization**  
> **Version:** 2.0 (Post-Reorganization) | **Updated:** 2025-10-03

---

## 🎯 **Purpose**

This guide ensures **100% consistency** in documentation organization across all KI interactions and human contributors. Every file placement, naming, and cross-referencing decision must follow these rules.

## 🗂️ **Folder Structure & Purposes**

### **Core Principle:** One Topic = One Folder
Avoid overlap - each document should have a **clear singular home**.

| **Folder** | **Purpose** | **Contains** | **Examples** |
|---|---|---|---|
| **00-meta/** | Project management, meta-documentation | Instructions, guides, project status | `INSTRUCTIONS-KI.md`, `CRITICAL-FIXES-REGISTRY.md` |
| **01-standards/** | Code standards, conventions, guidelines | Coding rules, patterns, style guides | `standards.md`, `CODING-CONVENTIONS.md` |
| **02-architecture/** | System design, technical architecture | System diagrams, design decisions | `ARCHITEKTUR.md`, electron configs |
| **03-development/** | Development workflows, environment setup | Dev guides, debugging, workflows | `DEV_GUIDE.md`, `debugging.md`, `WORKFLOWS.md` |
| **04-testing/** | Testing strategies, test documentation | Test plans, testing guides | Unit test docs, E2E strategies |
| **05-database/** | Database design, schemas, migrations | SQLite docs, schema changes | `SQLITE-DATABASE-SYSTEM.md`, migrations |
| **06-paths/** | Path management, file system | Path utilities, file access patterns | `PATHS-SYSTEM-DOCUMENTATION.md` |
| **07-ipc/** | Inter-process communication | IPC patterns, main↔renderer communication | `IPC-DATABASE-SECURITY.md` |
| **08-ui/** | User interface, components, design | UI components, design patterns | Modal patterns, component docs |
| **09-pdf/** | PDF generation, document handling | PDF creation, document processing | PDF generation guides |
| **10-security/** | Security concepts, authentication | Security patterns, access control | Security architectures |
| **11-deployment/** | Deployment, updates, distribution | Release processes, update system | `UPDATE_SYSTEM_ARCHITECTURE.md` |
| **12-lessons/** | Lessons learned, retrospectives | General lessons, cross-cutting insights | Project-wide lessons learned |
| **13-deprecated/** | Deprecated/obsolete content | Old patterns, legacy documentation | Obsolete guides, old architectures |

---

## 📋 **File Placement Decision Tree**

### **Step 1: Identify Primary Topic**

```
Is it about...
├── Project management/meta-info? → 00-meta/
├── Coding standards/conventions? → 01-standards/
├── System architecture/design? → 02-architecture/
├── Development process/setup? → 03-development/
├── Testing strategies/docs? → 04-testing/
├── Database/schema/migrations? → 05-database/
├── File paths/system access? → 06-paths/
├── IPC/process communication? → 07-ipc/
├── UI/components/interface? → 08-ui/
├── PDF/document generation? → 09-pdf/
├── Security/authentication? → 10-security/
├── Deployment/updates/releases? → 11-deployment/
├── Cross-cutting lessons? → 12-lessons/
└── Obsolete/deprecated content? → 13-deprecated/
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
docs/05-database/IPC-DATABASE-SECURITY.md
docs/10-security/IPC-DATABASE-SECURITY.md  <-- Duplicate!
```

**✅ Correct Approach:**
```
docs/07-ipc/solved/IPC-DATABASE-SECURITY.md  <-- Single source
docs/05-database/INDEX.md  <-- References IPC security
docs/10-security/INDEX.md  <-- References IPC security
```

### **Cross-Reference Templates**

**For related content:**
```markdown
> **Related:** See [IPC Database Security](../07-ipc/solved/IPC-DATABASE-SECURITY.md) for implementation details
```

**For prerequisites:**
```markdown
> **Prerequisites:** Read [Architecture Overview](../02-architecture/ARCHITEKTUR.md) first
```

**For follow-up content:**
```markdown
> **Next Steps:** Continue with [Deployment Guide](../11-deployment/IMPLEMENTATION-PLAN-custom-updater.md)
```

**For cross-cutting concerns:**
```markdown
> **See Also:** 
> - [Database Integration](../05-database/SQLITE-DATABASE-SYSTEM.md)
> - [Security Patterns](../10-security/INDEX.md)
> - [Testing Strategy](../04-testing/INDEX.md)
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
2. **Update INSTRUCTIONS-KI.md** - ensure KI compliance
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