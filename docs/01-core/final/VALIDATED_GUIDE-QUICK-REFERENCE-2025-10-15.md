# ⚡ Quick Reference - RawaLite Standards

> **1-page KI-friendly summary** of all critical development standards and procedures
> 
> **Erstellt:** 12. Oktober 2025 | **Version:** 1.0 (New)

---

## 🚨 **CRITICAL: Always Check First**

```bash
# Before ANY code changes:
pnpm validate:critical-fixes  # MUST pass - preserves essential fixes

# Emergency Hotfix activation:
# "EMERGENCY HOTFIX für [problem] - Fast-Track Release durchführen"
```

---

## 📁 **Documentation Structure (Quick Decision)**

> **📋 Full Structure:** See [../VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md](../VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-16.md) for complete folder contents.

```
Is it about...
├── Project management/KI instructions? → 00-meta/
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
├── Deployment/releases? → 11-deployment/
├── Update system/auto-updates? → 12-update-manager/
├── Obsolete/deprecated content? → 13-deprecated/
├── Technical implementations? → 14-implementations/
└── Session logs/work summaries? → 15-session-summary/
```

**File Naming:** `LESSONS-LEARNED-topic.md`, `INDEX.md`, `IMPLEMENTATION-PLAN-feature.md`

---

## 💻 **Coding Standards (Essential)**

### **TypeScript Must-Haves:**
```typescript
// ✅ Required tsconfig.json settings
{
  "strict": true,
  "esModuleInterop": true,  // Standard imports
  "noUncheckedIndexedAccess": true
}

// ✅ Standard imports (with esModuleInterop)
import Database from 'better-sqlite3';
import path from 'node:path';

// ❌ Never use
import * as Database from 'better-sqlite3';  // Wrong
const data: any = {};                        // Wrong
```

### **React Patterns:**
```tsx
// ✅ Component structure
interface Props {
  customer?: Customer;
  onSave: (customer: Customer) => void;
}

export default function CustomerForm({ customer, onSave }: Props) {
  // Hooks always at top
  const [data, setData] = useState<CustomerFormData>({});
  
  return <form>{/* JSX */}</form>;
}

// ✅ Custom hooks for business logic
export function useCustomers() {
  const { adapter } = usePersistence();
  // Business logic here
  return { customers, loading, createCustomer };
}
```

### **Database Standards:**
```typescript
// ✅ Always use prepared statements
const stmt = db.prepare('SELECT * FROM customers WHERE name = ?');
const customers = stmt.all(searchTerm);

// ✅ Interface-based adapters
interface PersistenceAdapter {
  getCustomers(): Promise<Customer[]>;
  createCustomer(data: CreateCustomerData): Promise<Customer>;
}
```

---

## 🔄 **Workflow Essentials**

### **Git Commit Format:**
```bash
# Standard format
feat(customers): add email validation
fix(db): resolve SQLite deadlock
docs(api): update adapter documentation
hotfix(critical): fix data corruption

# Emergency format
🚨 HOTFIX: [Critical Fix Description]
```

### **Branch Strategy:**
```bash
main                    # Production code
├── feature/xxx        # New features
├── bugfix/xxx         # Bug fixes
└── hotfix/xxx         # Emergency fixes (fast-track)
```

### **Emergency Hotfix (15-20 minutes total):**
```bash
# Phase 1: Assessment (1-2 min)
git status && pnpm validate:critical-fixes

# Phase 2: Fix (5-10 min)
git checkout -b hotfix/v1.0.X
# Implement ONLY the critical fix
git commit -m "🚨 HOTFIX: [description]"

# Phase 3: Release (2-3 min)
git tag v1.0.X
git push origin main --tags
gh release create v1.0.X --title "🚨 EMERGENCY HOTFIX"

# Phase 4: Verify & Communicate (1 min)
gh release view v1.0.X --json assets  # MUST have assets
# Notify users immediately
```

---

## 🧪 **Testing Approach**

### **Test Pyramid:**
```
🔺 E2E (5-10%): Critical user journeys
🔺🔺 Integration (20-30%): Component + DB interaction  
🔺🔺🔺🔺 Unit (60-70%): Business logic, hooks
```

### **Manual QA Pflicht (bei Line-Item/PDF-Änderungen):**
- [ ] PDF-Sub-Items visuell prüfen (Angebot/Rechnung/Paket)

### **Quick Test Commands:**
```bash
pnpm test:unit          # Fast feedback, development
pnpm test:integration   # Database operations
pnpm test:e2e          # Critical paths
pnpm test:coverage     # Coverage report
```

### **Essential Test Patterns:**
```typescript
// Unit test structure
describe('CustomerService', () => {
  it('should create customer with valid data', async () => {
    // Arrange
    const data = { name: 'John', email: 'john@test.com' };
    
    // Act
    const result = await service.createCustomer(data);
    
    // Assert
    expect(result).toEqual({
      id: expect.any(Number),
      name: 'John',
      email: 'john@test.com'
    });
  });
});
```

---

## 🚨 **Error Handling Standards**

```typescript
// ✅ Specific error types
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ Central error handling
export function handleError(error: unknown): AppError {
  if (error instanceof ValidationError) {
    return { type: 'validation', message: error.message };
  }
  return { type: 'unknown', message: 'Unknown error' };
}
```

---

## 📊 **Quality Gates**

### **PR Requirements:**
- [ ] `pnpm typecheck` ✅ passes
- [ ] `pnpm lint` ✅ passes  
- [ ] `pnpm test` ✅ passes
- [ ] `pnpm build` ✅ passes
- [ ] Coverage > 80% for new code
- [ ] No `any` types
- [ ] Proper error handling

### **Architecture Compliance:**
- [ ] Layer separation (Pages → Hooks → Adapters → DB)
- [ ] No Node.js APIs in renderer
- [ ] Interface-based adapters
- [ ] Prepared SQL statements
- [ ] TypeScript strict mode

---

## 🔒 **Security Checklist**

```typescript
// ✅ Input validation
const schema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required()
});

// ✅ SQL injection prevention
const stmt = db.prepare('SELECT * FROM customers WHERE name LIKE ?');
const results = stmt.all(`%${searchTerm}%`);

// ❌ Never do
const query = `SELECT * FROM customers WHERE name LIKE '%${searchTerm}%'`;
```

---

## 🎯 **Performance Standards**

### **Acceptable Thresholds:**
- Bundle size: < 10MB
- Component render: < 100ms for 1000 items
- Database queries: < 1s for bulk operations
- Test suite: < 30s total

### **Optimization Patterns:**
```typescript
// ✅ React performance
const MemoizedComponent = React.memo(Component);
const value = useMemo(() => expensiveCalculation(), [deps]);
const callback = useCallback(() => handleClick(), [deps]);

// ✅ Database performance
const stmt = db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)');
const insertMany = db.transaction((customers) => {
  for (const customer of customers) stmt.run(customer.name, customer.email);
});
```

---

## 🛠️ **Development Environment**

### **Required Tools:**
```bash
# Core stack
Node.js 20+
pnpm (never npm/yarn)
TypeScript strict mode
Electron 31+
better-sqlite3 (not sql.js)

# Development
VS Code + Extensions
ESLint + Prettier
Vitest + Playwright
```

### **Project Commands:**
```bash
# Development
pnpm dev               # Start development
pnpm build             # Build for development
pnpm dist              # Build for production

# Testing
pnpm test              # Run all tests
pnpm typecheck         # TypeScript validation
pnpm lint              # Code quality

# Validation
pnpm validate:critical-fixes    # Preserve critical fixes
pnpm validate:migrations        # Database consistency
pnpm validate:line-items      # Line item hierarchy integrity (requires DB path)
```

---

## 🚀 **Release Process**

### **Standard Release:**
1. Feature branch → PR → Review → Merge
2. Update version (semantic versioning)
3. Run full test suite
4. `pnpm dist` → GitHub Release

### **Emergency Hotfix:**
1. Skip review, minimal testing
2. Fast-track release (15-20 min total)
3. Post-emergency validation

### **Version Format:**
```
MAJOR.MINOR.PATCH
1.0.0 → 1.0.1  # Bug fix
1.0.1 → 1.1.0  # New feature
1.1.0 → 2.0.0  # Breaking change
```

---

## 🤖 **KI Development Guidelines**

### **Session Startup:**
1. **ALWAYS read first:** `docs/00-meta/final/CRITICAL-FIXES-REGISTRY.md`
2. **Check current task:** Review existing documentation
3. **Validate environment:** `pnpm validate:critical-fixes`

### **Problem-Solving Approach:**
1. **Root-cause analysis** over symptom treatment
2. **Configuration fixes** over code workarounds  
3. **Standard patterns** over custom solutions
4. **Document methodology** in lessons learned

### **Code Changes:**
- Follow decision tree for file placement
- Update INDEX.md when adding files
- Use cross-references, avoid duplicates
- Test critical-fixes preservation

---

## ❌ **Never Do This**

- Use `npm` or `yarn` (PNPM only)
- Import with `import * as` (use `import X from`)
- Skip `pnpm validate:critical-fixes`
- Create duplicate documentation
- Use `any` types in TypeScript
- String interpolation in SQL
- Node.js APIs in renderer process
- External links in app (`shell.openExternal`)

---

**📌 Keep this reference handy for all RawaLite development!**

*Version: 1.0 | Updated: 12. Oktober 2025*