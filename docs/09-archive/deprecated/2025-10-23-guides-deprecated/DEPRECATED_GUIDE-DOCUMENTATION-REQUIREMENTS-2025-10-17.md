# 📚 Documentation Requirements - Main.ts Refactor

> **Comprehensive documentation strategy** für den Refactor
> 
> **Scope:** Code + Architecture + Process | **Status:** MANDATORY

---

## 🎯 **Documentation Philosophy**

### **Documentation Pyramid**
```
         🔺 Architecture Documentation (High-Level)
       🔺🔺 Module Documentation (JSDoc)
     🔺🔺🔺 Code Comments (Implementation Details)
```

**Principle:** Documentation should enable future developers to understand and maintain the modular structure.

---

## 📝 **Code Documentation Requirements**

### **JSDoc Standards (Mandatory)**

#### **Function Documentation Template**
```typescript
/**
 * Brief one-line description of function purpose
 * 
 * Detailed description if the function is complex or has specific behavior.
 * Include any important implementation notes or constraints.
 * 
 * @param paramName Parameter description including type constraints
 * @param options Configuration object description
 * @returns Description of return value and possible states
 * 
 * @example
 * ```typescript
 * const result = await functionName('example', { option: true });
 * console.log(result); // Expected output
 * ```
 * 
 * @throws {ErrorType} Description of when this error is thrown
 * @since 1.0.42 (version when added/significantly changed)
 */
```

#### **Module Documentation Template**
```typescript
/**
 * Module: Brief description of module purpose
 * 
 * This module handles [specific responsibility] for the RawaLite application.
 * It was extracted from the main.ts refactor to improve maintainability
 * and separation of concerns.
 * 
 * Key responsibilities:
 * - Responsibility 1
 * - Responsibility 2
 * - Responsibility 3
 * 
 * Security considerations:
 * - Security point 1
 * - Security point 2
 * 
 * Dependencies:
 * - External dependency 1: Purpose
 * - External dependency 2: Purpose
 * 
 * @module ModuleName
 * @since 1.0.42 Main.ts refactor
 */
```

### **JSDoc Coverage per Module**

#### **windows/mainWindow.ts**
```typescript
/**
 * Main application window creation and configuration
 * 
 * This module handles the creation of the primary RawaLite application window
 * with proper security settings, icon configuration, and dev/prod loading.
 * 
 * Key responsibilities:
 * - Window creation with security settings (contextIsolation, sandbox)
 * - Dev/prod URL loading (localhost:5174 vs static files)
 * - Icon path resolution and validation
 * - External URL blocking for security
 * 
 * Security considerations:
 * - contextIsolation: true (prevents renderer access to main context)
 * - sandbox: true (restricts renderer capabilities)
 * - setWindowOpenHandler prevents opening external URLs
 * 
 * @module MainWindow
 * @since 1.0.42 Main.ts refactor
 */

interface CreateMainWindowOptions {
  /** Whether running in development mode */
  isDev: boolean;
}

/**
 * Creates and configures the main application window
 * 
 * Handles all aspects of main window creation including security settings,
 * icon loading, and proper URL handling for dev vs production environments.
 * 
 * @param options Configuration options
 * @param options.isDev Development mode flag for URL and path resolution
 * @returns Configured BrowserWindow instance ready for use
 * 
 * @example
 * ```typescript
 * const mainWindow = createMainWindow({ isDev: !app.isPackaged });
 * ```
 * 
 * @since 1.0.42
 */
export function createMainWindow({ isDev }: CreateMainWindowOptions): BrowserWindow
```

#### **ipc/paths.ts**
```typescript
/**
 * Path-related IPC handlers
 * 
 * This module provides secure access to system paths for the renderer process.
 * All path operations are controlled and validated through the main process.
 * 
 * Key responsibilities:
 * - Provide access to user data directory
 * - Provide access to downloads directory
 * - Provide access to temporary directory
 * - Ensure path security and validation
 * 
 * Security considerations:
 * - All paths are resolved through Electron's secure path API
 * - No arbitrary path access allowed
 * - Paths are validated before returning
 * 
 * @module PathsIPC
 * @since 1.0.42 Main.ts refactor
 */

/**
 * Get user data directory path
 * 
 * Returns the path to the user's application data directory.
 * This is where RawaLite stores its configuration and database files.
 * 
 * @returns Promise resolving to the user data directory path
 * 
 * @example
 * ```typescript
 * const userDataPath = await window.rawalite.paths.getUserDataPath();
 * // Result: "C:\Users\Username\AppData\Roaming\RawaLite"
 * ```
 * 
 * @since 1.0.42
 */
ipcMain.handle('paths:getUserDataPath', async (): Promise<string> => {
  return app.getPath('userData');
});
```

#### **ipc/pdf.ts [CRITICAL]**
```typescript
/**
 * PDF generation IPC handlers
 * 
 * This module handles PDF generation for invoices, offers, and other documents.
 * It maintains the critical parameter-based theme system (FIX-007) and provides
 * secure PDF generation capabilities.
 * 
 * CRITICAL: This module preserves FIX-007 parameter-based theme detection.
 * The theme system MUST use parameter passing instead of DOM inspection.
 * 
 * Key responsibilities:
 * - PDF generation for all document types
 * - Theme-based styling with parameter-based detection
 * - File dialog handling for PDF saves
 * - HTML template generation and conversion
 * 
 * Critical Fixes:
 * - FIX-007: Parameter-based theme system (DO NOT MODIFY)
 * 
 * @module PDFIPC
 * @since 1.0.42 Main.ts refactor
 */

/**
 * Get current PDF theme for document styling
 * 
 * CRITICAL: This implements FIX-007 parameter-based theme detection.
 * DO NOT modify this to use DOM inspection or other methods.
 * 
 * @returns Current theme name ('default', 'sage', 'sky', 'lavender', 'peach', 'rose')
 * 
 * @example
 * ```typescript
 * const theme = getCurrentPDFTheme();
 * const color = getThemeColor(theme);
 * ```
 * 
 * @since 1.0.42 (preserved from FIX-007)
 */
private getCurrentPDFTheme(): string {
  return this.currentTheme || 'default';
}

/**
 * Get theme color for PDF styling
 * 
 * CRITICAL: This mapping is part of FIX-007 and must remain complete.
 * All 6 themes must be supported with exact color values.
 * 
 * @param theme Theme name to get color for
 * @returns Hex color value for the theme
 * 
 * @since 1.0.42 (preserved from FIX-007)
 */
private getThemeColor(theme: string): string {
  const themeColors: Record<string, string> = {
    'default': '#2D5016',     // Standard - Tannengrün
    'sage': '#9CAF88',        // Salbeigrün  
    'sky': '#87CEEB',         // Himmelblau
    'lavender': '#DDA0DD',    // Lavendel
    'peach': '#FFCBA4',       // Pfirsich
    'rose': '#FFB6C1'         // Rosé
  };
  return themeColors[theme] || themeColors['default'];
}
```

---

## 🏗️ **Architecture Documentation Updates**

### **README.md Updates**

#### **Architecture Section Addition**
```markdown
## 🏗️ Architecture

### Electron Main Process Structure

The main process has been modularized for better maintainability and separation of concerns:

```
electron/
├── main.ts                      # Bootstrap & App lifecycle (< 500 lines)
├── windows/
│   ├── mainWindow.ts            # Main application window creation
│   └── updateManagerWindow.ts   # Update manager modal window
└── ipc/
    ├── paths.ts                 # System path access handlers
    ├── fs.ts                    # File system operation handlers
    ├── files.ts                 # File upload/download handlers
    ├── numbering.ts             # Auto-numbering system handlers
    ├── backup.ts                # Database backup handlers
    ├── db.ts                    # Database operation handlers
    └── pdf.ts                   # PDF generation handlers
```

### Module Responsibilities

#### Windows Module
- **mainWindow.ts**: Creates and configures the primary application window with security settings
- **updateManagerWindow.ts**: Handles the modal update manager interface

#### IPC Modules
- **paths.ts**: Provides secure access to system directories (userData, downloads, temp)
- **fs.ts**: Handles file system operations with security validation
- **files.ts**: Manages file uploads, downloads, and image processing
- **numbering.ts**: Implements automatic numbering for customers, offers, invoices
- **backup.ts**: Database backup creation and management
- **db.ts**: Direct database operations and query handling
- **pdf.ts**: PDF generation with theme support and file dialogs

### Security Features
- **Process Isolation**: Strict main/renderer separation maintained
- **Sandboxing**: All windows use `contextIsolation: true` and `sandbox: true`
- **IPC Security**: All IPC handlers validate inputs and limit access
- **External URL Blocking**: `setWindowOpenHandler` prevents external navigation

### Critical Fixes Preservation
This modular structure preserves all 13 active critical fixes, particularly:
- **FIX-007**: Parameter-based PDF theme system in `pdf.ts`
- **FIX-012**: SQLite parameter binding null conversion in `db.ts`
- **FIX-004**: Port consistency (5174) in `mainWindow.ts`
```

### **docs/02-architecture/ARCHITEKTUR.md Updates**

#### **New Section: Electron Main Process Architecture**
```markdown
## 🖥️ Electron Main Process Architecture

### Modular Structure (v1.0.54+)

Der Main Process wurde in thematische Module aufgeteilt:

#### Bootstrap (main.ts)
- App-Lifecycle Management
- Database-Initialisierung
- Window-Creation Orchestration
- Update-Manager Integration

#### Window Management
- `mainWindow.ts`: Hauptfenster mit Security-Settings
- `updateManagerWindow.ts`: Update-Manager Modal

#### IPC Handler Organization
```
ipc/
├── System Access
│   ├── paths.ts      # Pfad-Zugriff
│   ├── fs.ts         # Dateisystem
│   └── files.ts      # Upload/Download
├── Business Logic
│   ├── numbering.ts  # Nummernkreise
│   ├── backup.ts     # Datensicherung
│   └── db.ts         # Datenbank-Ops
└── Document Generation
    └── pdf.ts        # PDF-Erstellung
```

### Sicherheitsarchitektur

#### Process Isolation
- **Main Process**: System-Zugriff, Datenbank, IPC-Handler
- **Renderer Process**: UI, Business Logic Hooks, React Components
- **Preload**: Sichere IPC-Bridge (minimale Exposition)

#### IPC Security Model
```typescript
// Sichere IPC-Exposition über Preload
contextBridge.exposeInMainWorld('rawalite', {
  paths: {
    getUserDataPath: () => ipcRenderer.invoke('paths:getUserDataPath')
  },
  // Nur explizit definierte APIs zugänglich
});
```

### Critical Fixes Integration

Die Modularisierung erhält alle Critical Fixes:

- **PDF-System (pdf.ts)**: FIX-007 Parameter-based Theme System
- **Datenbank (db.ts)**: FIX-012 SQLite Parameter Binding
- **Window (mainWindow.ts)**: FIX-004 Port Consistency

### Migration Benefits

#### Wartbarkeit
- Kleinere, fokussierte Module (< 300 Zeilen)
- Klare Verantwortlichkeiten
- Einfachere Tests und Debugging

#### Sicherheit
- Isolierte IPC-Handler
- Begrenzte Zugriffsfläche
- Validierung pro Modul

#### Entwicklung
- Parallele Entwicklung möglich
- Weniger Merge-Konflikte
- Bessere Code-Review-Möglichkeiten
```

---

## 📋 **Process Documentation**

### **Migration Notes Documentation**

#### **docs/02-architecture/plan/MIGRATION-NOTES.md**
```markdown
# Migration Notes - Main.ts Refactor

## Migration Process

### Approach
- **Schritt-für-Schritt**: 13 einzelne Schritte mit Freigabe-Protokoll
- **Auskommentieren-dann-Verschieben**: Sicherer Rollback möglich
- **1:1 Logic Transfer**: Keine Optimierungen während Migration
- **Critical Fixes First**: Besondere Aufmerksamkeit für FIX-007 und FIX-012

### Challenges Encountered

#### Challenge 1: [To be documented during refactor]
- **Problem**: [Description]
- **Solution**: [How it was solved]
- **Lessons Learned**: [What to do differently next time]

### Technical Decisions

#### Decision 1: Side-Effect Imports for IPC
- **Context**: IPC-Handler müssen registriert werden
- **Decision**: `import './ipc/modulename'` für side-effect registration
- **Rationale**: Klare Abhängigkeiten, automatische Registrierung
- **Alternative**: Explizite Registration-Function calls

#### Decision 2: Interface für Window-Creation
- **Context**: Window-Funktionen benötigen Parameter
- **Decision**: TypeScript Interfaces für alle Window-Functions
- **Rationale**: Type-Safety, Dokumentation, Zukunftssicherheit

### Performance Impact

#### Build Time
- **Before**: Single large file compilation
- **After**: Multiple smaller modules
- **Impact**: Marginally faster incremental builds

#### Runtime Performance
- **Import Cost**: Minimal (side-effect imports)
- **Memory**: Unchanged (same functionality)
- **IPC Performance**: Unchanged (same handlers)

### Security Considerations

#### Maintained Security Features
- Process isolation preserved
- Sandbox settings unchanged
- IPC validation patterns preserved

#### Enhanced Security Opportunities
- Smaller attack surface per module
- Easier security auditing
- Potential for module-level access controls
```

### **Breaking Changes Documentation**

#### **Breaking Changes für v1.0.54**
```markdown
#### **Breaking Changes für v1.0.54**

# Breaking Changes v1.0.54

## Internal Architecture Changes

### Electron Main Process Restructuring

**Impact**: Internal only - no API changes for end users

#### Changed Files
- `electron/main.ts`: Reduced from 2560+ lines to < 500 lines
- **New**: `electron/windows/` directory with window creation modules
- **New**: `electron/ipc/` directory with IPC handler modules

#### Developer Impact
- Main process code now organized in thematic modules
- IPC handlers moved to separate files
- Window creation extracted to dedicated modules

#### Migration for Developers
If you were directly modifying `electron/main.ts`:
1. Identify the functionality you were modifying
2. Find the corresponding new module in `windows/` or `ipc/`
3. Make changes in the appropriate module file

#### No User-Facing Changes
- All functionality preserved
- UI remains identical
- Performance characteristics unchanged
- Critical fixes preserved
```

---

## ✅ **Documentation Checklist**

### **Code Documentation (Per Step)**
- [ ] JSDoc added for all exported functions
- [ ] Module-level documentation header
- [ ] Parameter types documented
- [ ] Return types documented
- [ ] Error conditions documented
- [ ] Example usage provided where complex

### **Architecture Documentation (Step 12)**
- [ ] README.md Architecture section updated
- [ ] ARCHITEKTUR.md new sections added
- [ ] Module responsibility matrix created
- [ ] Security model documented
- [ ] Migration benefits explained

### **Process Documentation (Step 12-13)**
- [ ] Migration notes documented
- [ ] Technical decisions recorded
- [ ] Challenges and solutions documented
- [ ] Performance impact analyzed
- [ ] Breaking changes documented (if any)

### **Cross-References (Final)**
- [ ] All modules reference main plan
- [ ] Architecture docs link to code modules
- [ ] Critical fixes documentation updated
- [ ] Testing strategy references updated

---

## 📊 **Documentation Quality Gates**

### **JSDoc Coverage Requirements**
- ✅ **100%** of exported functions documented
- ✅ **100%** of module headers present
- ✅ **100%** of critical fix preservation noted
- ✅ **100%** of security considerations documented

### **Architecture Documentation Requirements**
- ✅ Module responsibility clearly defined
- ✅ Security implications explained
- ✅ Migration benefits articulated
- ✅ Cross-references complete and accurate

### **Process Documentation Requirements**
- ✅ Migration approach documented
- ✅ Technical decisions justified
- ✅ Lessons learned captured
- ✅ Future maintenance guidance provided

---

## 🔗 **Related Documentation**

- **[Testing Strategy](./TESTING-STRATEGY.md)** - Testing protocols for refactor
- **[Critical Fixes Impact](./CRITICAL-FIXES-IMPACT.md)** - Critical fix preservation
- **[Main Refactor Plan](../MAIN-TS-REFACTOR-PLAN.md)** - Overall strategy
- **[Documentation Standards](../../01-standards/DOCUMENTATION-QUALITY-TRACKING.md)** - Quality guidelines

---

*Erstellt: 13. Oktober 2025 | Teil des [Main.ts Refactor Plans](../MAIN-TS-REFACTOR-PLAN.md)*
