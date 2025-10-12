# 🔄 Development & Release Workflows

> **Purpose:** Standardisierte Workflows für Hotfixes, Releases und Entwicklungsprozesse.

## 📋 **Contents**

### **🚨 Hotfix Workflows**
- **[HOTFIX-WORKFLOW-PROMPT.md](HOTFIX-WORKFLOW-PROMPT.md)** - Kritischer Hotfix-Prozess
  - Emergency Response Workflow
  - Fast-Track Release Pipeline
  - Critical Fix Validation

### **🚀 Release Workflows**
- **[RELEASE-WORKFLOW-PROMPT.md](RELEASE-WORKFLOW-PROMPT.md)** - Standard Release-Prozess
- **[RELEASE-CHECKLIST-COMPACT.md](RELEASE-CHECKLIST-COMPACT.md)** - Kompakte Release-Checkliste
- **[RELEASE-TROUBLESHOOTING-PROMPT.md](RELEASE-TROUBLESHOOTING-PROMPT.md)** - Release-Debugging Guide

## 🎯 **KI-Navigation**

**Release Workflow:**
1. ✅ **Patch Release:** `pnpm release:patch`
2. ✅ **Minor Release:** `pnpm release:minor`
3. ✅ **Hotfix Release:** Follow `HOTFIX-WORKFLOW-PROMPT.md`

**Bei Release-Problemen:**
1. ✅ **Troubleshooting:** `RELEASE-TROUBLESHOOTING-PROMPT.md`
2. ✅ **Validation:** `pnpm validate:critical-fixes`
3. ✅ **Recovery:** Follow documented procedures

## 🔗 **Related Topics**
- [Project Management](../project-management/) - Status und Planning
- [Critical Fixes](../critical-fixes/) - Fix Preservation
- [Scripts](../../scripts/) - Automation Tools