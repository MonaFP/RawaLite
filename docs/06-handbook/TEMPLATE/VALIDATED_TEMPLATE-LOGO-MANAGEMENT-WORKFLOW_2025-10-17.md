# Logo Management Workflow
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
**Complete guide for identifying, diagnosing, and fixing logo placement issues in RawaLite**

---

## 🎯 Overview

RawaLite uses a dual-logo system:
- **App Logos**: RawaLite branding (`/rawalite-logo.png`)
- **Company Logos**: User-uploaded company branding (`settings.companyData.logo`)

Each logo appears in specific UI components across different navigation modes.

---

## 📍 Logo Location Map

### **App Logos (RawaLite Branding)**
All use `/rawalite-logo.png` with 120px maxWidth and drop-shadow:

| Location | Component | Navigation Mode | Size | Description |
|----------|-----------|----------------|------|-------------|
| **LOGO-A** | `NavigationOnlySidebar.tsx` | Header Statistics | 120px | Left sidebar when header shows stats |
| **LOGO-B/C** | `CompactSidebar.tsx` | Header Navigation | 120px | Compact sidebar in header nav mode |
| **LOGO-H** | `Sidebar.tsx` | Full Sidebar | 120px | Main app logo at top of full sidebar |

### **Company Logos (User Branding)**
All use `settings.companyData.logo` with company name display:

| Location | Component | Navigation Mode | Size | Description |
|----------|-----------|----------------|------|-------------|
| **LOGO-E/F** | `HeaderStatistics.tsx` | Header Statistics | 50px | Company logo + name in header stats |
| **LOGO-G** | `HeaderNavigation.tsx` | Header Navigation | 40px | Company name + logo in header nav |
| **LOGO-I/J** | `Sidebar.tsx` | Full Sidebar | 60px | Company logo + name in sidebar |

---

## 🔍 Logo Identification Workflow

### **Step 1: Enable Debug Mode**
When logo issues are reported, add temporary identification labels:

```typescript
// Add to any logo container during debugging
<div style={{
  fontSize: '10px',
  color: 'red',
  fontWeight: 'bold',
  background: 'yellow',
  padding: '2px 4px',
  borderRadius: '2px'
}}>
  LOGO-{IDENTIFIER}
</div>
```

**Identifier Mapping:**
- `A` = NavigationOnlySidebar
- `B/C` = CompactSidebar  
- `E/F` = HeaderStatistics Company
- `G` = HeaderNavigation Company
- `H` = Sidebar App
- `I/J` = Sidebar Company

### **Step 2: Test All Navigation Modes**
1. **Header Statistics Mode**: Check LOGO-A, LOGO-E/F
2. **Header Navigation Mode**: Check LOGO-B/C, LOGO-G
3. **Full Sidebar Mode**: Check LOGO-H, LOGO-I/J

### **Step 3: Identify Problems**
User reports which numbered logos show issues:
- Wrong logo type (app vs company)
- Wrong size
- Missing elements (frames, names, etc.)
- Positioning problems

### **Step 4: Fix Issues**
Apply fixes based on problem type (see Fix Patterns below)

### **Step 5: Clean Up**
Remove all identification labels before final build

---

## 🛠️ Common Fix Patterns

### **Size Adjustments**
```typescript
// Standard App Logo Size (120px)
style={{
  width: "100%", 
  maxWidth: "120px",
  height: "auto", 
  objectFit: "contain",
  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))"
}}

// Company Logo Sizes
// HeaderStatistics: 50px
// HeaderNavigation: 40px  
// Sidebar: 60px maxHeight
```

### **Logo Type Conversion**
```typescript
// App Logo → Company Logo
src="/rawalite-logo.png"
// becomes
src={settings.companyData.logo}

// Company Logo → App Logo  
src={settings.companyData.logo}
// becomes
src="/rawalite-logo.png"
```

### **Remove Frames/Borders**
```typescript
// Remove these container styles:
{
  border: '2px solid rgba(255,255,255,0.2)',
  borderRadius: '12px',
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.05)'
}
```

### **Add/Remove Company Names**
```typescript
// Add company name display
<div style={{
  fontSize: '1rem',
  fontWeight: '600',
  color: 'white'
}}>
  {settings.companyData?.name || 'Firma'}
</div>
```

---

## 📋 Quick Reference Commands

### **Identify All Logos**
```bash
# Find all logo occurrences
grep -r "rawalite-logo.png" src/components/
grep -r "settings.companyData.logo" src/components/
```

### **Build After Changes**
```bash
pnpm run build:main
```

### **Navigation Mode Testing**
Test these routing scenarios:
- `/` (Dashboard - can be any mode)
- `/einstellungen` (Settings - check all modes)
- Toggle sidebar configurations

---

## ⚠️ Critical Guidelines

### **NEVER Modify Without Testing**
- Always test ALL navigation modes
- Check both with and without company logo uploaded
- Verify fallback placeholders work

### **Maintain Consistency**
- All app logos: 120px maxWidth
- All logos: drop-shadow for visibility
- Company logos: always show company name
- Responsive sizing: use maxWidth, not fixed width

### **Debug Safely**
- Add identification labels temporarily
- **ALWAYS** remove labels before production
- Test build compilation after changes

---

## 🔄 Workflow Example (This Session)

**Problem Reported:**
"Logo ist falsch bei header Statistics Navigation modus"

**Solution Process:**
1. ✅ Added LOGO-A through LOGO-J identification labels
2. ✅ User tested and reported: "Logo A ist zu klein, Logo D muss weg, etc."
3. ✅ Applied specific fixes to each identified logo
4. ✅ Adjusted sizes, removed unwanted logos, changed logo types
5. ✅ Removed all identification labels
6. ✅ Built and verified functionality

**Result:** All logos correctly sized and positioned across all navigation modes.

---

## 📚 Related Documentation

- `docs/00-meta/CRITICAL-FIXES-REGISTRY.md` - Critical patterns to preserve
- `docs/08-ui/COMPONENT-HIERARCHY.md` - Component relationships
- `docs/01-standards/LOGO-STANDARDS.md` - Logo usage guidelines

---

**Last Updated:** 2025-10-07  
**Maintained By:** Development Team  
**Version:** 1.0 (Initial documentation)
