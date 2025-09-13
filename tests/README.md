# 🧪 RawaLite Test Suite v1.5.5

Vollständige Test-Suite für RawaLite mit Unit Tests, Integration Tests und System-Validation. **Komplett reorganisiert** für maximale Effizienz und Wartbarkeit.

## 📁 **Test-Struktur (Aktualisiert)**

```
tests/
├── unit/                          # Unit Tests (Vitest)
│   ├── setup.ts                   # Test Setup & Configuration
│   ├── SettingsAdapter.test.ts    # ✅ Auto-Nummerierung Tests (4 Tests PASSED)
│   └── hooks/                     # React Hooks Unit Tests
│       ├── useCustomers.test.ts   # ⚠️ Import-Pfad Issues  
│       ├── useOffers.test.ts      # ⚠️ Import-Pfad Issues
│       ├── useInvoices.test.ts    # ⚠️ Import-Pfad Issues
│       └── useTimesheets.test.ts  # ⚠️ Import-Pfad Issues
├── integration/                   # Integration & System Tests
│   ├── database/                  # ✅ Database & Persistence
│   │   └── verification.js        # Database Creation & Schema
│   ├── design/                    # ✅ UI & Theme System
│   │   ├── custom-colors.cjs      # Custom Color Tests
│   │   ├── design-fix.js          # Design System Fixes
│   │   ├── persistence.js         # Theme Persistence
│   │   └── theme-persistence.js   # Theme State Management
│   ├── persistence/               # ✅ Data Consistency
│   │   └── complete.js            # Comprehensive Persistence Tests
│   └── update-system/             # ✅ GitHub API & Updates
│       ├── github-api.js          # Real GitHub API Tests
│       └── update-workflow.js     # Update System Validation
│   │   └── custom-colors.cjs      # Custom Color Tests
│   ├── update-system/             # Update & Release System
│   │   ├── github-api.js          # GitHub API Integration
│   │   └── update-workflow.js     # Update Process Testing
│   └── persistence/               # General Persistence
│       ├── complete-test.js       # End-to-End Persistence
│       └── reload-test.js         # Reload & Recovery Tests
└── README.md                      # This file
```

## 🚀 Test-Ausführung

### Unit Tests (Vitest)
```bash
# Alle Unit Tests ausführen
pnpm test

# Unit Tests im Watch-Modus
pnpm test --watch

# Test Coverage
pnpm test --coverage
```

### Integration Tests

#### Database Tests
```bash
# Database Verification
node tests/integration/database/verification.js

# Persistence Testing
node tests/integration/database/persistence.js

# Comprehensive Validation
node tests/integration/database/validation.mjs
```

#### Design System Tests
```bash
# Design Fix Tests
node tests/integration/design/design-fix.js

# Theme Persistence
node tests/integration/design/theme-persistence.js

# Custom Colors
node tests/integration/design/custom-colors.cjs
```

#### Update System Tests
```bash
# GitHub API Tests
node tests/integration/update-system/github-api.js

# Update Workflow
node tests/integration/update-system/update-workflow.js
```

#### Persistence Tests
```bash
# Complete Test Suite
node tests/integration/persistence/complete-test.js

# Reload Testing
node tests/integration/persistence/reload-test.js
```

## 🎯 Test-Kategorien

### ✅ Unit Tests
- **Fokus**: Einzelne Funktionen und Hooks
- **Framework**: Vitest + Testing Library
- **Isolation**: Gemockte Dependencies
- **Schnell**: < 1 Sekunde pro Test

### 🔗 Integration Tests
- **Fokus**: System-zu-System Interaktionen
- **Environment**: Echte Dependencies
- **Persistence**: Echte Database-Operationen
- **Umfassend**: End-to-End Workflows

## 📊 Test-Coverage

### Database & Persistence
- ✅ SQLite Schema Creation
- ✅ File-based Persistence (`%APPDATA%/rawalite/`)
- ✅ Dual-Mode (Electron + Browser)
- ✅ Transaction Handling
- ✅ Migration System

### Business Logic
- ✅ Auto-Nummerierung (K-0001, AN-2025-0001, etc.)
- ✅ CRUD Operations (Customers, Offers, Invoices, etc.)
- ✅ Validation & Error Handling
- ✅ State Management (React Hooks)

### UI & Design
- ✅ Theme System (5 Pastel Themes)
- ✅ Navigation Modes (Header/Sidebar)
- ✅ Design Persistence
- ✅ Custom Color Support

### System Integration
- ✅ Electron IPC Communication
- ✅ GitHub API Integration
- ✅ Update System Workflow
- ✅ File System Operations

## 🛠️ Test-Entwicklung

### Neue Tests hinzufügen

**Unit Test:**
```typescript
// tests/unit/MyComponent.test.ts
import { render } from '@testing-library/react'
import MyComponent from '../../src/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />)
    expect(getByText('Expected Text')).toBeInTheDocument()
  })
})
```

**Integration Test:**
```javascript
// tests/integration/category/my-test.js
console.log('🧪 Testing MyFeature...')

async function testMyFeature() {
  // Test implementation
  console.log('✅ MyFeature working correctly')
}

testMyFeature().catch(console.error)
```

### Test-Konventionen
- **Dateinnamen**: `kebab-case.js` für Integration, `PascalCase.test.ts` für Unit
- **Konsolen-Output**: Emoji-basierte Status-Nachrichten
- **Error Handling**: Try/catch mit aussagekräftigen Fehlermeldungen
- **Async/Await**: Konsistente Promise-Behandlung

## 🔍 Debugging

### Test-Logs analysieren
```bash
# Verbose Output für Integration Tests
node tests/integration/database/verification.js 2>&1 | tee test-output.log
```

### Debug-APIs verwenden
```javascript
// In Browser Console (Development)
window.rawaliteDebug.getDatabaseInfo()
window.rawaliteDebug.exportDatabase()
window.rawaliteDebug.saveDatabase()
```

---

**Version**: 1.5.5  
**Letzte Aktualisierung**: 12. September 2025  
**Maintainer**: MonaFP/RawaLite Team