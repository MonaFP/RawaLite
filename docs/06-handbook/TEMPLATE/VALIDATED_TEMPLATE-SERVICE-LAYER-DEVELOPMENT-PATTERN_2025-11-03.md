# TEMPLATE: SERVICE-LAYER-DEVELOPMENT-PATTERN

> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Template Creation - Initial Auto-Detection Setup)  
> **Status:** VALIDATED | **Typ:** TEMPLATE - Service Layer Development Pattern  
> **Schema:** `VALIDATED_TEMPLATE-SERVICE-LAYER-DEVELOPMENT-PATTERN_2025-11-03.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** VALIDATED (automatisch durch "Service-Layer Development", "Service Pattern" erkannt)
> - **TEMPLATE-QUELLE:** 06-handbook TEMPLATE Collection
> - **AUTO-UPDATE:** Bei Service-Architecture-Änderung automatisch Template aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "Service Pattern", "Dependency Injection", "Critical Patterns"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = VALIDATED:**
> - ✅ **Service-Development** - Verlässliche Quelle für Service-Layer-Entwicklung
> - ✅ **Architecture-Pattern** - Authoritative Standards für Services (12 existierende Services)
> - 🎯 **AUTO-REFERENCE:** Bei Service-Entwicklung IMMER dieses Template verwenden
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "NEW SERVICE" → Template kopieren und ausfüllen

> **⚠️ TEMPLATE-PURPOSE:** Strukturierte Entwicklung von Services mit Best-Practices und Critical Patterns (03.11.2025)  
> **Template Integration:** KI-SESSION-BRIEFING compatible mit Backend-Development-Workflows  
> **Critical Function:** Copy&Paste-Ready Service-Development Template für konsistente Service-Architecture

> **🎯 USE THIS TEMPLATE WHEN:**
> - ✅ Neuer Service entwickeln (GitHubAPI, UpdateManager, DatabaseTheme pattern)
> - ✅ Service-Änderung dokumentieren (Breaking Changes)
> - ✅ Service-Testing durchführen
> - ✅ Dependency Injection patterns anwenden
> - ✅ Error-Handling implementieren

---

## 📋 TEMPLATE START - Copy & Paste Ready

```markdown
# SERVICE: [SERVICE-NAME]

> **Erstellt:** [DD.MM.YYYY] | **Letzte Aktualisierung:** [DD.MM.YYYY] ([GRUND])  
> **Status:** [STATUS] | **Typ:** SERVICE - [Kategorie]  
> **Service File:** `src/main/services/[ServiceName].ts`  
> **Related Services:** [dependencies]

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** [STATUS] (automatisch durch "[SERVICE-KEYWORDS]" erkannt)
> - **SERVICE-PURPOSE:** [Spezifischer Zweck]
> - **AUTO-UPDATE:** Bei Service-Änderung automatisch Documentation aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "[KEY1]", "[KEY2]", "[PATTERN]"

## 🎯 SERVICE PURPOSE

[Kurze Beschreibung des Service und seiner Verantwortung]

### Service Type:
- [ ] **HTTP/API Service** (e.g., GitHubApiService)
- [ ] **Database Service** (e.g., DatabaseThemeService)
- [ ] **Manager Service** (e.g., UpdateManagerService)
- [ ] **Utility Service** (e.g., RateLimitManager)
- [ ] **Validator Service** (e.g., ConfigValidationService)

---

## 🏗️ SERVICE ARCHITECTURE

### 1. **Dependencies & Injection**

```typescript
// ✅ CORRECT: Constructor Injection Pattern
export class [ServiceName] {
  constructor(
    private db: Database,           // Database instance
    private config: ConfigService,  // Injected dependency
    private logger: Logger          // Logging dependency
  ) {}

  // Service methods...
}

// ✅ CORRECT: Usage
const service = new [ServiceName](db, configService, logger);
```

### 2. **Static Factory Methods (Optional)**

```typescript
// ✅ CORRECT: Factory pattern for singleton
export class [ServiceName] {
  private static instance: [ServiceName];

  static getInstance(db: Database): [ServiceName] {
    if (!this.instance) {
      this.instance = new [ServiceName](db);
    }
    return this.instance;
  }
}

// Usage
const service = [ServiceName].getInstance(db);
```

### 3. **Error Handling Strategy**

```typescript
// ✅ CORRECT: Typed error handling
export class [ServiceError] extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = '[ServiceName]Error';
  }
}

// Usage in service
try {
  // Service operation
} catch (error) {
  throw new [ServiceError](
    'Operation failed',
    'SERVICE_OPERATION_FAILED',
    error as Error
  );
}
```

### 4. **Lifecycle Management**

```typescript
// ✅ CORRECT: Initialization & Cleanup
export class [ServiceName] {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Setup operations
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;
    // Cleanup operations
    this.initialized = false;
  }
}

// Usage
const service = new [ServiceName](db);
await service.initialize();
// ... use service ...
await service.shutdown();
```

---

## 🛡️ CRITICAL PATTERNS (Read-Only - NEVER MODIFY)

### **Pattern FIX-001: WriteStream Promise Wrapper**
```typescript
// ✅ CRITICAL: Promise wrapper for WriteStream completion
return new Promise((resolve, reject) => {
  stream.on('finish', () => resolve());
  stream.on('error', (error) => reject(error));
  stream.end();  // ← Must have Promise wrapper!
});

// ❌ FORBIDDEN: Direct stream usage without Promise
stream.end();  // ← NO! No guarantee of completion
```

### **Pattern FIX-002: File System Flush Delay**
```typescript
// ✅ CRITICAL: Ensure file system operations complete
await new Promise(resolve => setTimeout(resolve, 100));

// Usage after file writes
fs.writeFileSync(filePath, content);
await new Promise(resolve => setTimeout(resolve, 100));  // Flush delay
// Now safe to read or move file

// ❌ FORBIDDEN: No delay (race conditions)
fs.writeFileSync(filePath, content);
fs.renameSync(filePath, newPath);  // ← Race condition!
```

### **Pattern FIX-003: Event Handler Cleanup**
```typescript
// ✅ CRITICAL: Remove previous listeners before adding
ipcMain.removeAllListeners('channel:name');
ipcMain.handle('channel:name', async (event, args) => {
  // Handler logic
});

// ❌ FORBIDDEN: Multiple handlers for same event
ipcMain.handle('channel:name', handler1);
ipcMain.handle('channel:name', handler2);  // ← Duplicate handlers!
```

### **Pattern FIX-015: Field-Mapper SQL Prevention**
```typescript
// ✅ CORRECT: Always use field-mapper for DB queries
import { convertSQLQuery } from '@/lib/field-mapper';
const query = convertSQLQuery('SELECT * FROM users WHERE user_id = ?', [userId]);
const user = this.db.prepare(query).get();

// ❌ FORBIDDEN: String concatenation in SQL
const query = `SELECT * FROM users WHERE user_id = '${userId}'`;  // SQL Injection!
```

### **Pattern: Database Service Pattern**
```typescript
// ✅ CORRECT: Service manages database access
export class DatabaseThemeService {
  constructor(private db: Database) {}

  async getAllThemes(): Promise<Theme[]> {
    const query = convertSQLQuery('SELECT * FROM themes');
    return this.db.prepare(query).all();
  }

  async getUserTheme(userId: string): Promise<Theme | null> {
    const query = convertSQLQuery(
      'SELECT * FROM user_theme_preferences WHERE user_id = ?',
      [userId]
    );
    return this.db.prepare(query).get();
  }
}

// ❌ FORBIDDEN: Direct DB access outside service
const themes = db.prepare('SELECT * FROM themes').all();  // Wrong location!
```

---

## 📋 SERVICE IMPLEMENTATION TEMPLATE

```typescript
// File: src/main/services/[ServiceName].ts
import { Database } from 'better-sqlite3';
import { convertSQLQuery } from '@/lib/field-mapper';

export interface I[ServiceName] {
  // Define service interface
  methodName(args: any): Promise<any>;
}

export class [ServiceError] extends Error {
  constructor(message: string, code: string, original?: Error) {
    super(message);
    this.name = '[ServiceName]Error';
  }
}

/**
 * [ServiceName]
 * 
 * Responsibility: [Description of what service does]
 * 
 * Dependencies:
 * - Database: For data persistence
 * - [Other]: [Purpose]
 * 
 * Critical Patterns:
 * - Promise wrappers for async operations (FIX-001)
 * - Event listener cleanup (FIX-003)
 * - Field-mapper for SQL queries (FIX-015)
 */
export class [ServiceName] implements I[ServiceName] {
  private initialized = false;

  constructor(private db: Database) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Setup validation, caching, etc.
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;
    // Cleanup event listeners, connections, etc.
    this.initialized = false;
  }

  // Public methods
  async publicMethod(args: any): Promise<any> {
    try {
      // Implementation
      return this.privateMethod(args);
    } catch (error) {
      throw new [ServiceError](
        'Public method failed',
        'PUBLIC_METHOD_FAILED',
        error as Error
      );
    }
  }

  // Private methods
  private async privateMethod(args: any): Promise<any> {
    // Private implementation
  }

  // Database access with field-mapper
  private async databaseOperation(id: string): Promise<any> {
    const query = convertSQLQuery(
      'SELECT * FROM table WHERE id = ?',
      [id]
    );
    return this.db.prepare(query).get();
  }
}
```

---

## 🧪 SERVICE TESTING PATTERN

```typescript
// File: tests/services/[ServiceName].test.ts

describe('[ServiceName]', () => {
  let service: [ServiceName];
  let db: Database;

  beforeAll(() => {
    db = new Database(':memory:');
    service = new [ServiceName](db);
  });

  afterAll(async () => {
    await service.shutdown();
    db.close();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      expect(service).toBeDefined();
    });
  });

  describe('public methods', () => {
    it('should handle successful operation', async () => {
      const result = await service.publicMethod({ /* args */ });
      expect(result).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      await expect(
        service.publicMethod({ /* invalid args */ })
      ).rejects.toThrow([ServiceName]Error);
    });
  });

  describe('critical patterns', () => {
    it('should use field-mapper for DB queries', () => {
      // Verify no SQL injection vulnerabilities
      // Check all DB queries use convertSQLQuery
    });

    it('should cleanup event listeners', async () => {
      // Verify removeAllListeners called before adding
    });
  });
});
```

---

## 🚨 COMMON SERVICE ISSUES & SOLUTIONS

### **Issue 1: Uninitialized Service**
```
Error: Service not initialized
Reason: initialize() never called
Solution: Always call initialize() before using service
```

### **Issue 2: Multiple Handler Registration**
```
Error: Handler called multiple times
Reason: Event listeners registered multiple times
Solution: Call removeAllListeners() before handle()
```

### **Issue 3: Uncaught Exceptions**
```
Error: Unhandled promise rejection
Reason: No error handling in async methods
Solution: Wrap in try-catch + throw typed errors
```

### **Issue 4: Resource Leaks**
```
Error: Memory usage increasing over time
Reason: Event listeners not cleaned up
Solution: Implement shutdown() for cleanup
```

### **Issue 5: Database Deadlocks**
```
Error: Query timeout
Reason: Circular dependencies or long transactions
Solution: Use transactions carefully, avoid nested DB calls
```

---

## 📊 SERVICE CHECKLIST

### Design Phase:
- [ ] Service responsibility clearly defined
- [ ] Dependencies identified
- [ ] Error types defined
- [ ] Interface created

### Implementation Phase:
- [ ] Constructor with dependency injection
- [ ] Initialize/shutdown methods
- [ ] Error handling with typed errors
- [ ] All DB queries use field-mapper
- [ ] Critical patterns applied (FIX-001, 002, 003, 015)

### Testing Phase:
- [ ] Unit tests for all public methods
- [ ] Error scenarios tested
- [ ] Resource cleanup verified
- [ ] Critical patterns validated

### Documentation Phase:
- [ ] Service purpose documented
- [ ] Dependencies listed
- [ ] Critical patterns referenced
- [ ] Lessons learned captured

---

## 📚 RELATED DOCUMENTATION

### **Service Architecture:**
- 📖 [VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-PROJECT-CORE-RULES_2025-10-26.md)
- 📖 [VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md](../REFERENCE/VALIDATED_REFERENCE-CRITICAL-FIXES-CURRENT_2025-10-26.md)

### **Existing Services (Reference):**
- 📖 GitHubApiService (HTTP API + WriteStream patterns)
- 📖 UpdateManagerService (Event handling + File ops)
- 📖 DatabaseThemeService (Database access pattern)
- 📖 RateLimitManager (Rate limiting logic)
- 📖 ConfigValidationService (Config validation)

### **Field-Mapper System:**
- 📖 `src/lib/field-mapper.ts` - SQL injection prevention

### **Live Services:**
- 📂 `src/main/services/` - 12 active services

---

## 🎯 NEXT STEPS

1. **Copy this template** → paste in implementation doc
2. **Define interface** → specify public methods
3. **Implement service** → TypeScript code
4. **Write tests** → coverage > 80%
5. **Document patterns** → Critical patterns applied?
6. **Integration test** → Service with real dependencies

---

## 🎨 CUSTOMIZATION GUIDE

### **For HTTP/API Services:**
- Error handling for network failures
- Retry logic for failed requests
- Rate limiting implementation

### **For Database Services:**
- Field-mapper integration
- Transaction management
- Schema validation

### **For Manager Services:**
- Complex state management
- Event coordination
- Error recovery strategies

---

**🎯 REMEMBER:** Services are the backbone of your architecture - design carefully!

*Template v1.0 - Complete Service Layer Development Pattern*
```
