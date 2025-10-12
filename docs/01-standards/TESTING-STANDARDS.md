# 🧪 Testing Standards - RawaLite

> **Comprehensive testing guidelines and strategies** für die RawaLite Anwendung
> 
> **Erstellt:** 12. Oktober 2025 | **Version:** 1.0 (New)

---

## 🎯 **Testing Philosophy**

RawaLite follows a **pragmatic testing approach** that balances comprehensive coverage with development velocity. We prioritize testing critical business logic, data integrity, and user workflows while maintaining fast feedback cycles.

### **Testing Pyramid Strategy**
```
              🔺 E2E Tests (5-10%)
            🔺🔺 Integration Tests (20-30%)  
        🔺🔺🔺🔺 Unit Tests (60-70%)
```

**Rationale:**
- **Unit Tests:** Fast feedback, isolated testing, high coverage
- **Integration Tests:** Component interaction, database operations
- **E2E Tests:** Critical user journeys, regression prevention

---

## 🧪 **Unit Testing Standards**

### **1. Test Structure & Organization**
```typescript
// ✅ RICHTIG: Clear test organization
describe('CustomerService', () => {
  describe('createCustomer', () => {
    it('should create customer with valid data', async () => {
      // Arrange
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      // Act
      const result = await customerService.createCustomer(customerData);
      
      // Assert
      expect(result).toEqual({
        id: expect.any(Number),
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: expect.any(String)
      });
    });
    
    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email'
      };
      
      // Act & Assert
      await expect(
        customerService.createCustomer(invalidData)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### **2. Test Naming Conventions**
```typescript
// ✅ Test file naming
CustomerService.test.ts
useCustomers.test.ts
CustomerForm.test.tsx

// ✅ Test description patterns
describe('ComponentName | ServiceName | HookName', () => {
  describe('methodName | functionality', () => {
    it('should [expected behavior] when [condition]', () => {});
    it('should throw [ErrorType] when [invalid condition]', () => {});
    it('should return [expected result] for [specific input]', () => {});
  });
});
```

### **3. Mock & Stub Strategies**
```typescript
// ✅ RICHTIG: Mock external dependencies
describe('CustomerHook', () => {
  const mockAdapter = {
    getCustomers: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn()
  } as jest.Mocked<PersistenceAdapter>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load customers on mount', async () => {
    // Arrange
    const customers = [{ id: 1, name: 'John', email: 'john@test.com' }];
    mockAdapter.getCustomers.mockResolvedValue(customers);
    
    // Act
    const { result } = renderHook(() => useCustomers(), {
      wrapper: ({ children }) => (
        <PersistenceProvider adapter={mockAdapter}>
          {children}
        </PersistenceProvider>
      )
    });
    
    // Assert
    await waitFor(() => {
      expect(result.current.customers).toEqual(customers);
    });
  });
});
```

### **4. Testing Utilities**
```typescript
// test-utils/setup.ts
export function createMockAdapter(): jest.Mocked<PersistenceAdapter> {
  return {
    ready: vi.fn().mockResolvedValue(undefined),
    getCustomers: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
    // ... all other methods
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  adapter: PersistenceAdapter = createMockAdapter()
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <PersistenceProvider adapter={adapter}>
        {children}
      </PersistenceProvider>
    )
  });
}
```

---

## 🔗 **Integration Testing Standards**

### **1. Database Integration Tests**
```typescript
// ✅ Database integration testing
describe('SQLiteAdapter Integration', () => {
  let adapter: SQLiteAdapter;
  let tempDbPath: string;

  beforeEach(async () => {
    // Create temporary database for testing
    tempDbPath = path.join(os.tmpdir(), `test-${Date.now()}.db`);
    adapter = new SQLiteAdapter(tempDbPath);
    await adapter.ready();
  });

  afterEach(async () => {
    // Cleanup
    adapter.close();
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  });

  it('should persist customer data correctly', async () => {
    // Arrange
    const customerData = {
      name: 'Integration Test Customer',
      email: 'integration@test.com'
    };

    // Act
    const created = await adapter.createCustomer(customerData);
    const retrieved = await adapter.getCustomer(created.id);

    // Assert
    expect(retrieved).toEqual({
      id: created.id,
      name: customerData.name,
      email: customerData.email,
      createdAt: expect.any(String)
    });
  });

  it('should enforce foreign key constraints', async () => {
    // Test database constraints
    await expect(
      adapter.createInvoice({
        customerId: 999999, // Non-existent customer
        amount: 100
      })
    ).rejects.toThrow(/foreign key constraint/i);
  });
});
```

### **2. Component Integration Tests**
```typescript
// ✅ Component with real hooks integration
describe('CustomerForm Integration', () => {
  it('should save customer and update list', async () => {
    // Arrange
    const mockAdapter = createMockAdapter();
    const newCustomer = { id: 1, name: 'New Customer', email: 'new@test.com', createdAt: '2025-10-12' };
    mockAdapter.createCustomer.mockResolvedValue(newCustomer);

    const { getByLabelText, getByRole } = renderWithProviders(
      <div>
        <CustomerForm onSave={() => {}} onCancel={() => {}} />
        <CustomerList />
      </div>,
      mockAdapter
    );

    // Act
    fireEvent.change(getByLabelText(/name/i), { target: { value: 'New Customer' } });
    fireEvent.change(getByLabelText(/email/i), { target: { value: 'new@test.com' } });
    fireEvent.click(getByRole('button', { name: /save/i }));

    // Assert
    await waitFor(() => {
      expect(mockAdapter.createCustomer).toHaveBeenCalledWith({
        name: 'New Customer',
        email: 'new@test.com'
      });
    });
  });
});
```

---

## 🌐 **End-to-End Testing Standards**

### **1. E2E Test Structure**
```typescript
// e2e/customer-management.test.ts
import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup clean state
    await page.goto('/');
    await page.getByTestId('reset-database').click(); // Test-only feature
  });

  test('should create, edit, and delete customer', async ({ page }) => {
    // Create customer
    await page.getByRole('button', { name: /add customer/i }).click();
    await page.getByLabel(/name/i).fill('E2E Test Customer');
    await page.getByLabel(/email/i).fill('e2e@test.com');
    await page.getByRole('button', { name: /save/i }).click();

    // Verify customer appears in list
    await expect(page.getByText('E2E Test Customer')).toBeVisible();

    // Edit customer
    await page.getByTestId('customer-1-edit').click();
    await page.getByLabel(/name/i).fill('Updated Customer');
    await page.getByRole('button', { name: /save/i }).click();

    // Verify update
    await expect(page.getByText('Updated Customer')).toBeVisible();

    // Delete customer
    await page.getByTestId('customer-1-delete').click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify deletion
    await expect(page.getByText('Updated Customer')).not.toBeVisible();
  });
});
```

### **2. E2E Test Utilities**
```typescript
// e2e/utils/test-helpers.ts
export class CustomerTestHelper {
  constructor(private page: Page) {}

  async createCustomer(name: string, email: string) {
    await this.page.getByRole('button', { name: /add customer/i }).click();
    await this.page.getByLabel(/name/i).fill(name);
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByRole('button', { name: /save/i }).click();
  }

  async expectCustomerInList(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }
}
```

### **3. Critical User Journey Tests**
```typescript
test('complete invoice workflow', async ({ page }) => {
  const customerHelper = new CustomerTestHelper(page);
  const invoiceHelper = new InvoiceTestHelper(page);

  // 1. Create customer
  await customerHelper.createCustomer('Invoice Customer', 'invoice@test.com');

  // 2. Create offer
  await invoiceHelper.createOffer('Invoice Customer', [
    { description: 'Service 1', quantity: 2, price: 100 }
  ]);

  // 3. Convert to invoice
  await invoiceHelper.convertOfferToInvoice();

  // 4. Generate PDF
  await invoiceHelper.generatePDF();

  // 5. Verify PDF download
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/i);
});
```

---

## 📊 **Performance Testing Standards**

### **1. Component Performance Tests**
```typescript
// Performance regression tests
describe('CustomerList Performance', () => {
  it('should render 1000 customers within 100ms', async () => {
    // Arrange
    const customers = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@test.com`,
      createdAt: '2025-10-12'
    }));

    // Act
    const startTime = performance.now();
    renderWithProviders(<CustomerList customers={customers} />);
    const endTime = performance.now();

    // Assert
    expect(endTime - startTime).toBeLessThan(100);
  });
});
```

### **2. Database Performance Tests**
```typescript
describe('Database Performance', () => {
  it('should bulk insert 1000 customers under 1 second', async () => {
    // Arrange
    const customers = Array.from({ length: 1000 }, (_, i) => ({
      name: `Bulk Customer ${i}`,
      email: `bulk${i}@test.com`
    }));

    // Act
    const startTime = Date.now();
    await adapter.bulkCreateCustomers(customers);
    const endTime = Date.now();

    // Assert
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
```

---

## 🔒 **Security Testing Standards**

### **1. Input Validation Tests**
```typescript
describe('Security: Input Validation', () => {
  it('should prevent SQL injection in search', async () => {
    const maliciousInput = "'; DROP TABLE customers; --";
    
    // Should not throw or cause damage
    const result = await adapter.searchCustomers(maliciousInput);
    expect(result).toEqual([]);
    
    // Verify table still exists
    const customers = await adapter.getCustomers();
    expect(customers).toBeDefined();
  });

  it('should sanitize XSS attempts in customer names', async () => {
    const xssAttempt = '<script>alert("xss")</script>';
    
    const customer = await adapter.createCustomer({
      name: xssAttempt,
      email: 'test@test.com'
    });
    
    // Should be escaped/sanitized
    expect(customer.name).not.toContain('<script>');
  });
});
```

### **2. Authentication/Authorization Tests**
```typescript
describe('Security: Authorization', () => {
  it('should require valid session for sensitive operations', async () => {
    // Test without authentication
    await expect(
      adapter.deleteAllCustomers() // Hypothetical dangerous operation
    ).rejects.toThrow(/unauthorized/i);
  });
});
```

---

## 🎯 **Test Coverage Standards**

### **Coverage Requirements**
```
Minimum Coverage Targets:
├── Business Logic (Services, Adapters): 90%
├── Custom Hooks: 85%
├── Components: 75%
├── Utilities: 95%
├── Critical Paths (E2E): 100%
└── Overall Project: 80%
```

### **Coverage Configuration**
```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/adapters/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/hooks/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    }
  }
});
```

---

## 🚀 **Test Automation & CI/CD**

### **1. Pre-commit Tests**
```bash
# .husky/pre-commit
#!/usr/bin/env sh
echo "🧪 Running tests before commit..."

# Fast unit tests only
pnpm test:unit --run --reporter=basic

# Type checking
pnpm typecheck

echo "✅ Pre-commit tests passed!"
```

### **2. CI/CD Pipeline Tests**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Run unit tests
        run: pnpm test:unit --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run integration tests
        run: pnpm test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Install Playwright
        run: pnpm dlx playwright install
      - name: Run E2E tests
        run: pnpm test:e2e
```

### **3. Test Scripts**
```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/**/*.test.{ts,tsx}",
    "test:integration": "vitest run src/**/*.integration.test.{ts,tsx}",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

---

## 🛠️ **Testing Tools & Setup**

### **Required Testing Stack**
```json
// package.json devDependencies
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/user-event": "^14.0.0",
  "@playwright/test": "^1.40.0",
  "vitest": "^1.0.0",
  "@vitest/ui": "^1.0.0",
  "jsdom": "^23.0.0",
  "happy-dom": "^12.0.0"
}
```

### **Test Environment Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**']
  }
});

// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  }
});
```

---

## 🏆 **Testing Best Practices**

### **DO's:**
- ✅ **Test behavior, not implementation details**
- ✅ **Use descriptive test names that explain the scenario**
- ✅ **Arrange-Act-Assert pattern for clarity**
- ✅ **Mock external dependencies consistently**
- ✅ **Test error conditions and edge cases**
- ✅ **Keep tests independent and idempotent**
- ✅ **Use data-testid for E2E element selection**

### **DON'Ts:**
- ❌ **Test private methods directly**
- ❌ **Write overly complex test setup**
- ❌ **Ignore flaky tests**
- ❌ **Test implementation details (CSS classes, internal state)**
- ❌ **Use sleep/wait for fixed times**
- ❌ **Skip cleanup in integration tests**

### **Code Quality Gates**
```bash
# All must pass for PR acceptance
pnpm test:unit          # Unit tests: > 80% coverage
pnpm test:integration   # Integration tests: Pass
pnpm test:e2e          # E2E tests: Critical paths pass
pnpm typecheck         # TypeScript: No errors
pnpm lint              # ESLint: No errors
```

---

*Letzte Aktualisierung: 12. Oktober 2025 | Nächste Review: April 2026*