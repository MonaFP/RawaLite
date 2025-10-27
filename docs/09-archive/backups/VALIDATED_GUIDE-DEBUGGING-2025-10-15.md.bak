# 🔍 Debugging-Leitfaden - RawaLite

> **Erstellt:** 29.09.2025 | **Letzte Aktualisierung:** 17.10.2025 (Content modernization + ROOT_ integration)  
> **Status:** VALIDATED - Reviewed and updated  
> **Schema:** `VALIDATED_GUIDE-DEBUGGING_2025-10-17.md`

> **⚠️ CRITICAL:** [../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - **MANDATORY READ vor Debug-Sessions**  
> **🛡️ NEVER violate:** Critical fixes müssen bei jedem Debug-Prozess beachtet werden  
> **📚 BEFORE debugging:** Konsultiere [../ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md](../ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md)

**Systematisches Debugging & Troubleshooting** für die RawaLite Anwendung

---

## 🎯 **Übersicht**

Dieser Leitfaden bietet **systematische Debugging-Prozesse** für alle Bereiche der RawaLite-Anwendung: Frontend, Backend, Datenbank, Electron und Build-Prozesse.

### 🔗 **Bug-Reporting Integration**
- **GitHub Issue Template:** `/.github/ISSUE_TEMPLATE/bug_report.md` - Strukturiertes Bug-Reporting
- **Pull Request Template:** `/.github/PULL_REQUEST_TEMPLATE.md` - Referenziert diese Debugging-Richtlinien

---

# RawaLite – Debugging-Workflow (Safe Edition)  

Dieses Dokument beschreibt den empfohlenen **Ablauf zur Fehlersuche** in RawaLite. Durch einen strukturierten Workflow werden Probleme effizient, reproduzierbar und faktenbasiert gelöst. Jede Analyse soll den unten definierten Schritten folgen, um Zufallsfunde und Fehlversuche zu vermeiden.

WICHTIG – NICHT VERHANDELBAR
In diesem Projekt gelten die RawaLite Coding Instructions als unveränderliche Referenz-Dokumente.

Du darfst keine Änderungen an standards.md, debugging.md, RawaLite – AI Coding Instructions oder anderen Projekt-Dokumenten vornehmen.

Du darfst die Instruktionen nicht kürzen, umschreiben, interpretieren oder in anderes Format bringen.

Wenn du in Konflikt mit diesen Instruktionen kommst: nicht improvisieren, sondern sofort nachfragen.

Dein Fokus liegt ausschließlich auf Code-Änderungen, Bugfixes, Tests und Umsetzung innerhalb bestehender Patterns.

Die Dokumentation ist Read-Only und darf von dir niemals verändert oder überschrieben werden.

Bestätige bitte jedes Mal, dass du die Dokumentation nicht angepasst hast.

## Systematischer Problemlösungsprozess (Safe Edition)

Dieser Ansatz ist **verbindlicher Standard** für alle Debugging- und Problemlösungsaufgaben in RawaLite.  
Er basiert auf den Lessons Learned vom 15. September 2025 und ist Teil der Safe Edition.

### Vier Prinzipien (Do’s)
1. **Documentation-First**  
   Immer zuerst die relevante Dokumentation und Regeln lesen. Kein Einstieg ins Code-Hacking ohne Doku-Basis. Während des debuggingsprozesses das Template /docs/00-standards/lessons_learned_TEMPLATE.md als Vorlage nutzen und in /docs in thematisch passendem Ordner ablegen.
2. **Data-First**  
   Entscheidungen erst nach vollständiger Datensammlung (Logs, Status, Configs). Keine Lösungen aus Bauchgefühl.
3. **Simple-First**  
   Zuerst die einfachste funktionierende Lösung umsetzen. Komplexität nur, wenn nötig.
4. **Existing-First**  
   Bestehende Prozesse, Tools und Guards nutzen, bevor etwas Neues erfunden wird.

### Anti-Patterns (Don’ts)
- ❌ Code-First Debugging (Code öffnen ohne Doku/Analyse)  
- ❌ Solution-First Design (Lösung entwerfen ohne Datenlage)  
- ❌ Complex-First Implementation (Over-Engineering)  
- ❌ Invention-First Approach (Neuentwicklung trotz vorhandener Tools)

### Zero-Tolerance & DoD
Dieser Prozess gilt **für alle Probleme**, auch vermeintlich kleine.  
Kein Schritt darf übersprungen oder als „nicht kritisch“ abgetan werden.

**Definition of Done (DoD):**
- `pnpm typecheck` → 0 Fehler  
- `pnpm lint --max-warnings=0` → 0 Fehler/Warnungen  
- Alle Guards (`guard:external`, `guard:pdf`, `validate:ipc`, `validate:versions`, `guard:todos`, `validate:esm`) → grün  
- `pnpm test --run` → alle Tests grün und deterministisch  
- **Keine** Verstöße (`require`, `module.exports`, `window.open`, `target="_blank"`, `shell.openExternal`, `http(s)://`, `TODO/FIXME/HACK`) in Code oder Templates



## 🔄 Debugging-Workflow  
Der folgende Workflow stellt sicher, dass Probleme systematisch angegangen werden:  

** Zuerst: überprüfen, ob es das Problem bereits gab und schonmal behoben wurde.**

1. **Problem definieren & reproduzieren:** Fehlerbild klar beschreiben und zuverlässig reproduzierbar machen (Testfall erstellen).  
2. **Informationen sammeln:** Relevante **Logs**, Einstellungen und Umgebungsdaten erfassen; Ist- und Soll-Verhalten vergleichen.  
3. **Hypothese aufstellen:** Auf Basis der Fakten eine plausible **Ursachenannahme** formulieren (worin könnte das Problem begründet sein?).  
4. **Test planen:** Einen gezielten **Versuch** entwerfen, um die Hypothese zu überprüfen – **nur eine Variable ändern** bzw. einen isolierten Fix/Workaround vorbereiten.  
5. **Test durchführen:** Den geplanten Versuch ausführen und das Systemverhalten beobachten. **Keine parallelen Änderungen**, um den Effekt eindeutig zuzuordnen.  
6. **Ergebnis auswerten:** Resultat des Tests analysieren. Wurde die Hypothese **bestätigt oder widerlegt**? Befunde festhalten (z. B. in Form von Logs, Screenshots).  
7. **Iterieren oder abschließen:** Falls die Hypothese falsch war, aus den neuen Erkenntnissen eine nächste Hypothese ableiten und Schritt 4–6 wiederholen. Trifft die Hypothese zu, zur Fehlerbehebung übergehen.  
8. **Lösung verifizieren & dokumentieren:** Sobald die **Root Cause** feststeht, dauerhafte Korrektur implementieren. Anschließend den Fix testen, um den Erfolg zu bestätigen. Alle durchgeführten Versuche und Schlussfolgerungen im **Lessons Learned** Dokument zum Thema festhalten.

## 📋 Checkliste (Debugging)  
* [ ] **Fehler reproduziert** – Problem tritt verlässlich in einer Testumgebung auf.  
* [ ] **Logs analysiert** – Wichtige Log-Einträge, Fehlermeldungen und Systemzustände geprüft.  
* [ ] **Hypothese gebildet** – Mögliche Ursache basierend auf Fakten formuliert.  
* [ ] **Gezielter Test durchgeführt** – Eine einzelne Änderung/ Maßnahme zur Überprüfung umgesetzt.  
* [ ] **Ergebnis bewertet** – Ausgang des Tests untersucht (Hypothese bestätigt oder verworfen?).  
* [ ] **Versuch dokumentiert** – Durchgeführte Tests und Befunde schriftlich festgehalten (Lessons Learned Eintrag).  
* [ ] **Ursache gefunden** – Falls nein: neue Hypothese und nächster Test geplant; falls ja: Fix implementiert und Erfolg geprüft.
* [ ] **Ergebnisse dürfen nicht geraten** werden → immer Entwickler fragen.  
* [ ] Nur Fakten, keine Spekulationen.  
* [ ] Keine Redundanzen 

## 🏗️ **Debugging-Architektur**

### **Debug-Umgebungen**
```typescript
// Development vs Production Debugging
const isDev = !app.isPackaged;

if (isDev) {
  // Detailliertes Logging & DevTools
  win.webContents.openDevTools({ mode: 'detach' });
  app.commandLine.appendSwitch('enable-logging');
} else {
  // Produktions-Logging nur für kritische Errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Optional: Error Reporting Service
  });
}
```

### **Log-Level System**
```typescript
enum LogLevel {
  ERROR = 0,    // Kritische Fehler
  WARN = 1,     // Warnungen  
  INFO = 2,     // Informationen
  DEBUG = 3,    // Debug-Details
  TRACE = 4     // Vollständige Traces
}

class Logger {
  constructor(private level: LogLevel = LogLevel.INFO) {}
  
  error(message: string, error?: Error) {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error);
    }
  }
  
  debug(message: string, data?: any) {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
}
```

---

## 🚨 **Systematisches Error Debugging**

### **1. Error Classification**

#### **Frontend Errors**
```typescript
// React Component Errors
class ComponentError extends Error {
  constructor(
    public component: string,
    public action: string,
    message: string,
    public cause?: Error
  ) {
    super(`[${component}] ${action}: ${message}`);
    this.name = 'ComponentError';
  }
}

// Hook Errors  
class HookError extends Error {
  constructor(
    public hook: string,
    public method: string,
    message: string,
    public cause?: Error
  ) {
    super(`[${hook}] ${method}: ${message}`);
    this.name = 'HookError';
  }
}

// State Errors
class StateError extends Error {
  constructor(
    public context: string,
    message: string,
    public currentState?: any
  ) {
    super(`[State:${context}] ${message}`);
    this.name = 'StateError';
  }
}
```

#### **Backend/Database Errors**
```typescript
class DatabaseError extends Error {
  constructor(
    public operation: string,
    public table: string,
    message: string,
    public sqlError?: Error
  ) {
    super(`[DB:${table}] ${operation}: ${message}`);
    this.name = 'DatabaseError';
  }
}

class AdapterError extends Error {
  constructor(
    public adapter: string,
    public method: string,
    message: string,
    public cause?: Error
  ) {
    super(`[Adapter:${adapter}] ${method}: ${message}`);
    this.name = 'AdapterError';
  }
}
```

### **2. Error Tracking System**
```typescript
interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  category: 'frontend' | 'backend' | 'database' | 'electron';
  component?: string;
  message: string;
  stackTrace?: string;
  userAgent?: string;
  sessionId: string;
  context?: Record<string, any>;
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  
  track(error: Error, context?: Record<string, any>) {
    const report: ErrorReport = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level: 'error',
      category: this.categorizeError(error),
      message: error.message,
      stackTrace: error.stack,
      sessionId: this.getSessionId(),
      context
    };
    
    this.errors.push(report);
    this.persistError(report);
    
    // Development: Sofort loggen
    if (isDev) {
      console.group(`🚨 Error Tracked: ${report.id}`);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Context:', context);
      console.groupEnd();
    }
  }
  
  private categorizeError(error: Error): ErrorReport['category'] {
    if (error instanceof DatabaseError) return 'database';
    if (error instanceof ComponentError) return 'frontend';
    if (error.stack?.includes('electron')) return 'electron';
    return 'frontend';
  }
}
```

---

## 🔧 **Debugging-Tools & Setup**

### **1. Development Tools**
```typescript
// Development-Only Debug Panel
if (import.meta.env.DEV) {
  // React DevTools
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.checkDCE?.();
  
  // Custom Debug Panel
  window.RawaLiteDebug = {
    // Database Inspector
    async inspectDatabase() {
      const adapter = await import('../adapters/SQLiteAdapter');
      return adapter.debugInfo();
    },
    
    // State Inspector  
    inspectState() {
      return {
        persistence: window.__PERSISTENCE_STATE__,
        settings: window.__SETTINGS_STATE__,
        notifications: window.__NOTIFICATIONS_STATE__
      };
    },
    
    // Performance Monitor
    startPerformanceMonitoring() {
      performance.mark('debug-start');
      return () => {
        performance.mark('debug-end');
        performance.measure('debug-session', 'debug-start', 'debug-end');
      };
    }
  };
}
```

### **2. Electron DevTools**
```typescript
// electron/main.ts - Debug Configuration
if (isDev) {
  // Elektron DevTools Extensions
  app.whenReady().then(async () => {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import('electron-devtools-installer');
      await installExtension(REACT_DEVELOPER_TOOLS);
    } catch (err) {
      console.log('Error installing DevTools extension:', err);
    }
  });
  
  // Main Process Debugging
  app.commandLine.appendSwitch('enable-logging');
  app.commandLine.appendSwitch('log-level', '0'); // INFO level
  
  // IPC Debugging
  const { ipcMain } = require('electron');
  ipcMain.on('*', (event, ...args) => {
    console.log('IPC Message:', event.type, args);
  });
}
```

### **3. Database Debugging**
```typescript
class SQLiteDebugger {
  constructor(private db: Database) {}
  
  // Query Performance Analysis
  async analyzeQuery(sql: string, params: any[] = []) {
    const start = performance.now();
    
    try {
      // EXPLAIN QUERY PLAN für Performance
      const plan = this.db.exec(`EXPLAIN QUERY PLAN ${sql}`, params);
      const result = this.db.exec(sql, params);
      const duration = performance.now() - start;
      
      return {
        success: true,
        duration,
        rowCount: result[0]?.values?.length || 0,
        queryPlan: plan[0]?.values || [],
        result: result[0]?.values || []
      };
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - start,
        error: error.message,
        sql,
        params
      };
    }
  }
  
  // Schema Validation
  validateSchema(): SchemaValidationResult {
    const tables = this.db.exec(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `)[0]?.values || [];
    
    const issues: string[] = [];
    
    tables.forEach(([tableName, sql]: [string, string]) => {
      // Check for missing indices
      if (!sql.includes('INDEX') && !tableName.includes('_line_items')) {
        issues.push(`Table ${tableName} might need indices`);
      }
      
      // Check for missing Foreign Keys
      if (tableName.includes('Id') && !sql.includes('REFERENCES')) {
        issues.push(`Table ${tableName} might need foreign key constraints`);
      }
    });
    
    return { tables: tables.length, issues };
  }
}
```

---

## 🐛 **Häufige Probleme & Lösungen**

### **1. Database Issues**

#### **Problem: SQLite Lock Error**
```
Error: database is locked
```

**Debugging Steps:**
```typescript
// 1. Check for open transactions
const transactions = db.exec("PRAGMA journal_mode");
console.log('Journal Mode:', transactions);

// 2. Check for active connections
const connections = db.exec("PRAGMA busy_timeout");
console.log('Busy Timeout:', connections);

// 3. Force unlock (Development only!)
if (isDev) {
  db.exec("BEGIN IMMEDIATE; ROLLBACK;");
}
```

**Lösung:**
```typescript
// Implement proper transaction handling
export async function withTx<T>(fn: () => T | Promise<T>): Promise<T> {
  const d = await getDB();
  
  // Check if already in transaction
  const inTransaction = d.exec("PRAGMA journal_mode")[0]?.values[0][0] === 'wal';
  
  if (inTransaction) {
    return await fn(); // Don't nest transactions
  }
  
  d.exec("BEGIN IMMEDIATE");
  try {
    const res = await fn();
    d.exec("COMMIT");
    return res;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
```

#### **Problem: Migration Failures**
```
Error: no such column: packages.language
```

**Debugging Steps:**
```typescript
// 1. Check current schema
const schema = db.exec(`PRAGMA table_info(packages)`)[0]?.values || [];
console.log('Current Schema:', schema);

// 2. Check migration status
const migrations = localStorage.getItem('rawalite.migrations');
console.log('Applied Migrations:', migrations);

// 3. Manual schema fix
if (isDev) {
  try {
    db.exec(`ALTER TABLE packages DROP COLUMN language`);
  } catch (e) {
    console.log('Column does not exist, proceeding...');
  }
}
```

### **2. State Management Issues**

#### **Problem: State Not Updating**
```typescript
// Debug Hook State Issues
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Debug: Log state changes
  useEffect(() => {
    console.log('🔄 Customers state changed:', customers.length);
  }, [customers]);
  
  const createCustomer = async (data: CreateCustomerData) => {
    try {
      const customer = await adapter.createCustomer(data);
      
      // Debug: Verify update
      console.log('✅ Customer created:', customer);
      
      setCustomers(prev => {
        const updated = [...prev, customer];
        console.log('🔄 State will update from', prev.length, 'to', updated.length);
        return updated;
      });
      
    } catch (error) {
      console.error('❌ Create customer failed:', error);
      throw error;
    }
  };
}
```

#### **Problem: Context Value Undefined**
```typescript
// Debug Context Issues
export function usePersistence() {
  const context = useContext(PersistenceContext);
  
  if (!context) {
    console.error('❌ PersistenceContext not found!');
    console.trace('Component Tree:');
    throw new Error('usePersistence must be used within PersistenceProvider');
  }
  
  // Debug: Log context state
  useEffect(() => {
    console.log('🔄 Persistence context:', {
      ready: context.ready,
      adapter: !!context.adapter,
      error: context.error
    });
  }, [context]);
  
  return context;
}
```

### **3. Performance Issues**

#### **Problem: Slow Rendering**
```typescript
// Performance Debugging Component
function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.startsWith('react')) {
          console.log(`⚡ React Measure: ${entry.name} - ${entry.duration}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
  
  return <>{children}</>;
}

// Usage in Development
if (isDev) {
  ReactDOM.render(
    <PerformanceMonitor>
      <App />
    </PerformanceMonitor>,
    document.getElementById('root')
  );
}
```

#### **Problem: Memory Leaks**
```typescript
// Memory Leak Detection
class MemoryMonitor {
  private intervals: NodeJS.Timeout[] = [];
  
  startMonitoring() {
    if (!isDev) return;
    
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('💾 Memory Usage:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
      }
    }, 5000);
    
    this.intervals.push(interval);
  }
  
  stopMonitoring() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }
}
```

### **4. Electron-specific Issues**

#### **Problem: Preload Script Not Loading**
```typescript
// electron/main.ts - Debug Preload
function createWindow() {
  const preloadPath = isDev
    ? path.join(process.cwd(), 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js');
  
  // Debug: Verify preload file exists
  console.log('🔍 Preload path:', preloadPath);
  console.log('📁 Preload exists:', require('fs').existsSync(preloadPath));
  
  const win = new BrowserWindow({
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  // Debug: Listen for preload errors
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('❌ Preload Error:', preloadPath, error);
  });
}
```

---

## 📊 **Debug-Dashboard Development**

### **In-App Debug Panel**
```tsx
// Debug Panel Component (Development Only)
function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { adapter } = usePersistence();
  
  if (!import.meta.env.DEV) return null;
  
  return (
    <>
      <button 
        style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          zIndex: 9999,
          background: 'red',
          color: 'white',
          border: 'none',
          padding: '5px 10px'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        🐛 Debug
      </button>
      
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 50,
          right: 10,
          width: 300,
          height: 400,
          background: 'white',
          border: '1px solid #ccc',
          padding: 10,
          zIndex: 9998,
          overflow: 'auto'
        }}>
          <h3>RawaLite Debug Panel</h3>
          
          <section>
            <h4>Database</h4>
            <button onClick={() => console.log(adapter)}>
              Log Adapter State
            </button>
          </section>
          
          <section>
            <h4>Performance</h4>
            <button onClick={() => {
              const entries = performance.getEntriesByType('navigation');
              console.table(entries);
            }}>
              Show Performance Entries
            </button>
          </section>
          
          <section>
            <h4>Local Storage</h4>
            <button onClick={() => {
              console.table(Object.entries(localStorage));
            }}>
              Dump Local Storage
            </button>
          </section>
        </div>
      )}
    </>
  );
}
```

---

## 🔄 **Debugging Workflows**

### **1. Systematic Bug Investigation**

#### **Step 1: Reproduce**
```typescript
// Bug Reproduction Checklist
const bugReproduction = {
  environment: 'dev | prod',
  browser: 'Chrome | Firefox | Edge',
  os: 'Windows | macOS | Linux',
  steps: [
    '1. Open app',
    '2. Navigate to...',
    '3. Click on...',
    '4. Error occurs'
  ],
  expectedBehavior: 'Should save customer',
  actualBehavior: 'Shows error message',
  errorMessage: 'Database error: ...',
  screenshot: 'path/to/screenshot.png'
};
```

#### **Step 2: Isolate**
```typescript
// Isolation Testing
async function isolateBug() {
  // Test 1: Check if it's a data issue
  const testCustomer = { name: 'Test', email: 'test@test.com' };
  
  try {
    await adapter.createCustomer(testCustomer);
    console.log('✅ Basic customer creation works');
  } catch (error) {
    console.log('❌ Basic customer creation fails:', error);
    return 'database-issue';
  }
  
  // Test 2: Check if it's a UI issue
  try {
    const formData = new FormData();
    formData.append('name', 'Test');
    console.log('✅ Form data creation works');
  } catch (error) {
    console.log('❌ Form handling fails:', error);
    return 'ui-issue';
  }
  
  return 'integration-issue';
}
```

#### **Step 3: Fix & Verify**
```typescript
// Fix Verification
interface BugFix {
  id: string;
  description: string;
  fix: string;
  testCases: string[];
  verificationSteps: string[];
}

const bugFixes: BugFix[] = [
  {
    id: 'BUG-001',
    description: 'Customer creation fails with empty name',
    fix: 'Added validation in useCustomers hook',
    testCases: [
      'Empty name should show validation error',
      'Valid name should create customer',
      'Whitespace-only name should show validation error'
    ],
    verificationSteps: [
      'Run unit tests',
      'Test in development',
      'Test in production build'
    ]
  }
];
```

### **2. Performance Debugging**

#### **Database Performance**
```typescript
async function debugDatabasePerformance() {
  const queries = [
    'SELECT * FROM customers',
    'SELECT * FROM invoices JOIN customers ON invoices.customerId = customers.id',
    'SELECT COUNT(*) FROM offers WHERE status = "draft"'
  ];
  
  for (const query of queries) {
    const start = performance.now();
    
    try {
      const result = db.exec(query);
      const duration = performance.now() - start;
      
      console.log(`⚡ Query Performance:`, {
        query,
        duration: `${duration.toFixed(2)}ms`,
        rowCount: result[0]?.values?.length || 0
      });
      
      // Slow query warning
      if (duration > 100) {
        console.warn(`🐌 Slow query detected: ${query}`);
        
        // Analyze query plan
        const plan = db.exec(`EXPLAIN QUERY PLAN ${query}`);
        console.table(plan[0]?.values);
      }
      
    } catch (error) {
      console.error(`❌ Query failed: ${query}`, error);
    }
  }
}
```

#### **React Performance**
```typescript
function usePerformanceDebug(componentName: string) {
  const renderCount = useRef(0);
  const lastRender = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRender.current;
    
    console.log(`🔄 [${componentName}] Render #${renderCount.current}`, {
      timeSinceLastRender: `${timeSinceLastRender}ms`,
      timestamp: new Date(now).toISOString()
    });
    
    lastRender.current = now;
  });
  
  // Detect unnecessary re-renders
  if (renderCount.current > 10) {
    console.warn(`🚨 [${componentName}] High render count: ${renderCount.current}`);
  }
}

// Usage in Component
function CustomerForm() {
  usePerformanceDebug('CustomerForm');
  // ... component logic
}
```

---

## 🧪 **Testing-Based Debugging**

### **1. Debug-Driven Tests**
```typescript
// Test für Debugging spezifischer Bugs
describe('Bug Investigation: Customer Creation', () => {
  it('should handle empty names gracefully', async () => {
    const createCustomer = jest.fn().mockRejectedValue(
      new ValidationError('Name required', 'name')
    );
    
    // Debug: Was passiert bei leerem Namen?
    await expect(createCustomer({ name: '', email: 'test@test.com' }))
      .rejects
      .toThrow('Name required');
  });
  
  it('should create customer with minimal data', async () => {
    const mockAdapter = {
      createCustomer: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Test Customer',
        createdAt: '2025-01-01T00:00:00Z'
      })
    };
    
    const result = await mockAdapter.createCustomer({ 
      name: 'Test Customer' 
    });
    
    // Debug: Vergewissern dass Basis-Funktionalität funktioniert
    expect(result.id).toBe(1);
    expect(mockAdapter.createCustomer).toHaveBeenCalledWith({
      name: 'Test Customer'
    });
  });
});
```

### **2. Integration Testing für Debugging**
```typescript
// End-to-End Debug Test
describe('Full Customer Creation Flow', () => {
  it('should create customer through full stack', async () => {
    // Setup: Fresh database
    const db = new SQL.Database();
    await createSchemaIfNeeded(db);
    
    // Debug: Step durch jeden Layer
    const adapter = new SQLiteAdapter(db);
    const hook = renderHook(() => useCustomers(adapter));
    
    // Act: Create customer
    await act(async () => {
      await hook.result.current.createCustomer({
        name: 'Integration Test Customer',
        email: 'integration@test.com'
      });
    });
    
    // Debug: Verify auf Database Level
    const customers = db.exec('SELECT * FROM customers')[0]?.values || [];
    expect(customers).toHaveLength(1);
    
    // Debug: Verify auf Hook Level
    expect(hook.result.current.customers).toHaveLength(1);
  });
});
```

---

## 📋 **Debug Checklists**

### **Frontend Issue Checklist**
- [ ] React DevTools installiert und geöffnet?
- [ ] Console Errors überprüft?
- [ ] Network Tab für API-Calls überprüft?
- [ ] Component State korrekt?
- [ ] Props werden korrekt weitergegeben?
- [ ] useEffect Dependencies korrekt?
- [ ] Memory Leaks durch nicht-gecleante Event Listener?

### **Database Issue Checklist**
- [ ] SQLite DB-Datei existiert und ist lesbar?
- [ ] Schema-Migration erfolgreich?
- [ ] Foreign Key Constraints aktiv?
- [ ] Transaktionen korrekt gehandhabt?
- [ ] SQL-Queries syntaktisch korrekt?
- [ ] Indizes für Performance vorhanden?
- [ ] Concurrent Access Probleme?

### **Electron Issue Checklist**
- [ ] Main/Renderer Process Trennung beachtet?
- [ ] Preload Script lädt korrekt?
- [ ] IPC Communication funktioniert?
- [ ] File Paths für Development/Production korrekt?
- [ ] Security Settings (contextIsolation, etc.) korrekt?
- [ ] Native Dependencies verfügbar?

---

## 🚀 **Production Debugging**

### **1. Error Reporting**
```typescript
// Production Error Reporting
class ProductionErrorReporter {
  private static instance: ProductionErrorReporter;
  
  static getInstance(): ProductionErrorReporter {
    if (!this.instance) {
      this.instance = new ProductionErrorReporter();
    }
    return this.instance;
  }
  
  reportError(error: Error, context?: Record<string, any>) {
    const report = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };
    
    // In Production: Send to error reporting service
    // For now: Store locally for analysis
    const errors = JSON.parse(localStorage.getItem('rawalite.errors') || '[]');
    errors.push(report);
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
    
    localStorage.setItem('rawalite.errors', JSON.stringify(errors));
  }
}
```

### **2. Performance Monitoring**
```typescript
// Production Performance Monitoring
class PerformanceMonitor {
  static trackUserAction(action: string, duration: number) {
    if (!isDev && duration > 1000) { // Only track slow actions in production
      const report = {
        action,
        duration,
        timestamp: new Date().toISOString(),
        memory: (performance as any).memory?.usedJSHeapSize || 0
      };
      
      console.info('Performance Report:', report);
    }
  }
  
  static wrapAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T, 
    actionName: string
  ): T {
    return (async (...args: any[]) => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const duration = performance.now() - start;
        this.trackUserAction(actionName, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        this.trackUserAction(`${actionName}_ERROR`, duration);
        throw error;
      }
    }) as T;
  }
}
```

---

## 📞 **Support & Escalation**

### **Debug Information Export**
```typescript
// Debug Information für Support
function exportDebugInfo(): DebugInfo {
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: isDev ? 'development' : 'production',
    userAgent: navigator.userAgent,
    
    // App State
    appState: {
      persistence: !!window.__PERSISTENCE_STATE__,
      settings: !!window.__SETTINGS_STATE__,
      notifications: !!window.__NOTIFICATIONS_STATE__
    },
    
    // Database Info
    database: {
      version: localStorage.getItem('rawalite.db.version'),
      size: localStorage.getItem('rawalite.db')?.length || 0,
      migrations: localStorage.getItem('rawalite.migrations')
    },
    
    // Recent Errors
    recentErrors: JSON.parse(localStorage.getItem('rawalite.errors') || '[]')
      .slice(-5), // Last 5 errors
    
    // Performance
    performance: {
      memory: (performance as any).memory,
      timing: performance.timing
    }
  };
}
```

### **Remote Debugging Setup** 
```typescript
// Development: Remote Debug Access
if (isDev && process.env.ENABLE_REMOTE_DEBUG) {
  const debugPort = 9229;
  
  app.commandLine.appendSwitch('inspect', `localhost:${debugPort}`);
  app.commandLine.appendSwitch('enable-logging');
  
  console.log(`🔍 Remote debugging enabled on port ${debugPort}`);
  console.log(`Chrome DevTools: chrome://inspect/#devices`);
}
```

---

*Letzte Aktualisierung: 29. September 2025 | Nächste Review: Dezember 2025*