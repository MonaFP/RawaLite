# 01-standards - Development Standards Overview

> **Purpose:** Comprehensive development standards, guidelines, and quality frameworks for RawaLite

## 📋 **Core Standards Documentation**

### **💻 Coding Standards**
- [CODING-STANDARDS.md](CODING-STANDARDS.md) - TypeScript, React, Database, and Architecture standards
- [TESTING-STANDARDS.md](TESTING-STANDARDS.md) - Unit, Integration, E2E testing guidelines and best practices

### **🔄 Process Standards**  
- [WORKFLOWS.md](WORKFLOWS.md) - Git workflow, Release processes, and Emergency hotfix procedures

### **📁 Documentation Standards**
- [DOCUMENTATION-STRUCTURE-GUIDE.md](DOCUMENTATION-STRUCTURE-GUIDE.md) - File organization, naming, and quality standards
- [DOCUMENTATION-QUALITY-TRACKING.md](DOCUMENTATION-QUALITY-TRACKING.md) - Issue tracking for documentation problems

### **⚡ Quick Access**
- [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - 1-page summary for KI sessions and rapid development

## 🎯 **Quick Navigation for Common Tasks**

### **🚀 Starting Development:**
1. **Quick Overview:** [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
2. **Coding Rules:** [CODING-STANDARDS.md](CODING-STANDARDS.md)  
3. **Testing Approach:** [TESTING-STANDARDS.md](TESTING-STANDARDS.md)

### **📦 Release & Deployment:**
1. **Standard Release:** [WORKFLOWS.md](WORKFLOWS.md#release-workflow)
2. **Emergency Hotfix:** [WORKFLOWS.md](WORKFLOWS.md#emergency-hotfix-workflow)
3. **Quality Gates:** [CODING-STANDARDS.md](CODING-STANDARDS.md#code-quality-metrics)

### **📝 Documentation Work:**
1. **File Placement:** [DOCUMENTATION-STRUCTURE-GUIDE.md](DOCUMENTATION-STRUCTURE-GUIDE.md#file-placement-decision-tree)
2. **Quality Standards:** [DOCUMENTATION-STRUCTURE-GUIDE.md](DOCUMENTATION-STRUCTURE-GUIDE.md#quality-tracking--validation)
3. **Issue Tracking:** [DOCUMENTATION-QUALITY-TRACKING.md](DOCUMENTATION-QUALITY-TRACKING.md)

### **🤖 KI Development:**
1. **Session Startup:** [QUICK-REFERENCE.md](QUICK-REFERENCE.md#ki-development-guidelines)
2. **Critical Checks:** Always `pnpm validate:critical-fixes` first
3. **Problem Solving:** [CODING-STANDARDS.md](CODING-STANDARDS.md#entscheidungsfindung--problem-solving)

## 🔗 **Related Documentation**

- [Critical Fixes](../00-meta/critical-fixes/) - Protected fixes that must be preserved
- [Development Guide](../03-development/) - Setup and debugging procedures  
- [Architecture Standards](../02-architecture/) - System design principles
- [Testing Implementation](../04-testing/) - Specific testing implementations
- [Standards Legacy Files](../15-session-summary/) - Historical standards development sessions

## 📊 **Standards Status**

| **Area** | **Status** | **Last Updated** | **Coverage** |
|----------|------------|------------------|--------------|
| **Coding Standards** | ✅ Complete | 2025-10-12 | TypeScript, React, DB, Security, Architecture |
| **Testing Standards** | ✅ Complete | 2025-10-12 | Unit, Integration, E2E, Performance, CI/CD |
| **Workflow Standards** | ✅ Complete | 2025-10-12 | Git, Release, Emergency, Version control |
| **Documentation Standards** | ✅ Complete | 2025-10-12 | Structure, Quality, KI-friendly navigation |
| **Quick Reference** | ✅ Complete | 2025-10-12 | 1-page KI summary for rapid development |

## ⚠️ **Important Notes**

- **Always check critical fixes first:** `pnpm validate:critical-fixes` before any changes
- **Use QUICK-REFERENCE.md** for rapid development and KI session orientation
- **Follow WORKFLOWS.md** for all git, release, and emergency procedures
- **Refer to CODING-STANDARDS.md** for all development decisions and patterns
- **Update DOCUMENTATION-QUALITY-TRACKING.md** when resolving documentation issues
- **Check TESTING-STANDARDS.md** for comprehensive test coverage requirements
- **📅 Daily Review Reminder:** KI soll täglich nach Standards-Updates und Verbesserungen fragen

---

*Last Updated: 12. Oktober 2025 | Next Review: Täglich (aktive Entwicklungsphase)*