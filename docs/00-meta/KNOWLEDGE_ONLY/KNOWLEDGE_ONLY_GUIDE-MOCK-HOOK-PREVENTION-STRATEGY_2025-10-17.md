# 🛡️ Mock-Hook Prevention Strategy

> **Erstellt:** 15.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-AUTO-DETECTION SYSTEM Integration)  
> **Status:** Knowledge Archive | **Typ:** Guide - Mock Hook Prevention Strategy  
> **Schema:** `KNOWLEDGE_ONLY_GUIDE-MOCK-HOOK-PREVENTION-STRATEGY_2025-10-17.md` ✅ **SCHEMA-COMPLIANT**  

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Knowledge Archive (automatisch durch "Prevention Strategy", "Mock-Hook" erkannt)
> - **TEMPLATE-QUELLE:** KNOWLEDGE_ONLY Template
> - **AUTO-UPDATE:** Bei Hook-Development automatisch Strategy referenzieren
> - **STATUS-KEYWORDS:** Erkannt durch "Prevention Strategy", "Mock-Hook", "Critical Fixes"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = Knowledge Archive:**
> - ✅ **Historical Strategy** - Bewährte Mock-Hook Prevention Patterns archiviert
> - ⚠️ **Verification Required** - Vor Hook-Implementierung aktuelle Critical-Fixes-Registry prüfen
> - 🎯 **AUTO-REFERENCE:** Bei Hook-Development automatisch diese Prevention-Strategy konsultieren
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "MOCK HOOK PROBLEM" → Prevention-Patterns verfügbar

> **⚠️ CRITICAL:** [../../06-handbook/REFERENCE/VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md](../../06-handbook/REFERENCE/VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md) - **MANDATORY READ vor Hook development**  
> **🛡️ NEVER violate:** Siehe [../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - Essential hook patterns  
> **📚 ALWAYS:** `pnpm validate:critical-fixes` vor Hook-Änderungen  

## 🚨 **Root Cause Analysis: Mock-Hook Problem**

### **📋 Incident Timeline**
- **25ddd9e5**: Minimal Hook-Exports (Build-Fix nach 1800+ TypeScript-Errors)
- **9f56d74d v1.0.6**: "Funktionale Mock-Hooks mit echtem React State Management"  
- **v1.0.7-v1.0.9**: Mock-Hooks blieben unentdeckt (3 Releases!)
- **Today**: Mock-Hooks entdeckt durch Persistenz-Bug-Report

### **🔍 Why Undetected**
1. **Surface-Level Functionality**: Mock-Hooks mit React State funktonierten oberflächlich
2. **No Persistence Validation**: SQLite-Integration wurde nie systematisch getestet
3. **Rapid Development**: Focus auf Update-System, Database wurde vernachlässigt
4. **Missing Integration Tests**: Keine End-to-End Persistenz-Tests

---

## 🛡️ **Multi-Layer Prevention Strategy**

### **1. 🔬 Static Analysis Layer**

#### **TypeScript Integration Rules**
```json
// .eslintrc.js - Custom Rules
{
  "rules": {
    "no-mock-hooks-in-production": {
      "patterns": [
        "// Funktionale Mock-Hooks",
        "// Mock-Hook",
        "useState.*Mock",
        "initialMock.*:",
        "Mock.*Data"
      ],
      "message": "🚨 PRODUCTION BUILD: Mock-Hooks detected! Use real database connections."
    }
  }
}
```

#### **Pre-Commit Hooks**
```bash
# scripts/validate-no-mocks.sh
#!/bin/bash
echo "🔍 Scanning for Mock-Hooks..."

MOCK_PATTERNS=(
  "// Funktionale Mock-Hooks"
  "// Mock-Hook" 
  "useState.*Mock"
  "initialMock"
  "Mock.*Data"
)

for pattern in "${MOCK_PATTERNS[@]}"; do
  if grep -r "$pattern" src/hooks/; then
    echo "🚨 ERROR: Mock-Hook pattern detected: $pattern"
    exit 1
  fi
done

echo "✅ No Mock-Hooks detected"
```

### **2. 🧪 Integration Test Layer**

#### **Database Persistence Tests**
```typescript
// tests/integration/persistence.test.ts
describe('Real Database Integration', () => {
  test('useCustomers should connect to SQLite, not Mock', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: ({ children }) => (
        <PersistenceProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </PersistenceProvider>
      )
    });

    // Wait for database connection
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Create real customer
    const customerData = { name: 'Test Customer' };
    const customer = await result.current.createCustomer(customerData);

    // Verify persistence by re-rendering hook
    const { result: freshResult } = renderHook(() => useCustomers(), {
      wrapper: ({ children }) => (
        <PersistenceProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </PersistenceProvider>
      )
    });

    await waitFor(() => expect(freshResult.current.loading).toBe(false));
    
    // 🚨 CRITICAL: Data must persist across hook re-renders
    expect(freshResult.current.customers).toContainEqual(
      expect.objectContaining({ name: 'Test Customer' })
    );
  });

  test('No Mock-Data should exist after app initialization', async () => {
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // 🚨 Check for Mock indicators
    result.current.customers.forEach(customer => {
      expect(customer.name).not.toMatch(/Mock/i);
      expect(customer.email).not.toMatch(/mock@/i);
      expect(customer.street).not.toMatch(/Mock Street/i);
    });
  });
});
```

### **3. 🚀 Build-Time Validation**

#### **Production Build Checks**
```javascript
// scripts/validate-production-build.js
const fs = require('fs');
const glob = require('glob');

const FORBIDDEN_PATTERNS = [
  /\/\/ Funktionale Mock-Hooks/,
  /\/\/ Mock-Hook/,
  /useState.*Mock/,
  /initialMock.*:/,
  /Mock.*Data/,
  /Mock Customer/,
  /mock@.*\.com/
];

console.log('🔍 Validating production build for Mock-Hooks...');

const hookFiles = glob.sync('src/hooks/*.ts');
let foundMocks = false;

hookFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  FORBIDDEN_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      console.error(`🚨 PRODUCTION BUILD FAILED: Mock pattern ${index + 1} found in ${file}`);
      console.error(`Pattern: ${pattern}`);
      foundMocks = true;
    }
  });
});

if (foundMocks) {
  console.error('🛑 Build aborted: Mock-Hooks detected in production build!');
  process.exit(1);
}

console.log('✅ Production build validation passed');
```

### **4. 📋 Development Workflow Guards**

#### **Hook Creation Checklist** 
```markdown
# ✅ New Hook Checklist

Before creating/modifying hooks in `src/hooks/`:

- [ ] **Real Database Connection**: Uses `usePersistence()` or `useSettings()`
- [ ] **No Mock Data**: No hardcoded `initialMock`, `Mock Customer`, etc.
- [ ] **TypeScript Compliance**: Proper types from `persistence/adapter.ts`
- [ ] **Error Handling**: Database connection failures handled
- [ ] **Loading States**: Proper async/await with loading indicators
- [ ] **Integration Test**: Added to `tests/integration/`
- [ ] **No Build-Fix Shortcuts**: No "Minimal Hook-Exports" for build fixes

**🚨 NEVER:**
- Use `useState` with hardcoded Mock-Data for database entities
- Create "functional Mock-Hooks" as permanent solution
- Leave build-fix placeholders in production
```

#### **Code Review Requirements**
```markdown
# 🔍 Mandatory Code Review Points

## For Hook Changes (`src/hooks/*.ts`):

### 🚨 **Critical Checks:**
1. **Database Integration**: Does hook use real persistence layer?
2. **Mock Detection**: Search for `Mock`, `mock@`, `initialMock`
3. **useState Patterns**: No hardcoded entities in `useState([...])`
4. **Persistence Test**: Is there a corresponding integration test?

### ✅ **Approval Criteria:**
- [ ] Real database connection verified
- [ ] No Mock patterns detected  
- [ ] Integration test exists and passes
- [ ] TypeScript compliance confirmed
- [ ] Loading/Error states implemented

### ❌ **Auto-Reject Patterns:**
- Any file containing `// Funktionale Mock-Hooks`
- `useState` with hardcoded entity arrays
- Missing database adapter usage
- No corresponding integration test
```

### **5. 🔧 Automated CI/CD Integration**

#### **GitHub Actions Hook Validation**
```yaml
# .github/workflows/validate-hooks.yml
name: Validate Production Hooks

on: [push, pull_request]

jobs:
  validate-hooks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Scan for Mock-Hooks
        run: |
          if grep -r "// Funktionale Mock-Hooks\|// Mock-Hook\|useState.*Mock\|initialMock\|Mock.*Data" src/hooks/; then
            echo "🚨 ERROR: Mock-Hooks detected in production code!"
            exit 1
          fi
          echo "✅ No Mock-Hooks detected"
      
      - name: Run Integration Tests
        run: |
          npm test -- tests/integration/
      
      - name: Validate Database Connections
        run: |
          node scripts/validate-production-build.js
```

---

## 📋 **Implementation Priority**

### **🔥 Immediate (Today)**
1. ✅ Fix remaining Mock-Hooks (`useOffers`, `useInvoices`, `usePackages`)
2. Create `scripts/validate-no-mocks.sh`
3. Add pre-commit hook

### **📅 Short-term (This Week)**
1. Implement integration tests for all hooks
2. Add ESLint rules for Mock-detection
3. Update development documentation

### **🚀 Long-term (Next Release)**
1. Full CI/CD integration with automated validation
2. Comprehensive hook creation guidelines
3. Documentation consolidation in `docs/02-development/`

---

## 🎯 **Success Metrics**

- **Zero Mock-Hooks** in production builds
- **100% Integration Test Coverage** for database hooks
- **Automated Detection** in CI/CD pipeline
- **Developer Education** through clear guidelines

---

## 📚 **References**

- **Issue Source**: v1.0.9 Mock-Hook Discovery
- **Documentation**: `docs/00-meta/standards.md`
- **Integration Tests**: `tests/integration/`
- **Related**: Database consistency standards in `docs/04-database/`