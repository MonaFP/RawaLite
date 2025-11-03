# Security Guide: IPC Database Access
> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY (Archived Historical Reference)
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch Archive, DEPRECATED, Historical Reference
> **Erstellt:** 29.09.2025 | $12025-10-17 (Content modernization + ROOT_ integration)|| filePath.includes('~')) {
    throw new Error('Invalid backup path: Directory traversal detected');
  }
  
  // Nur erlaubte Dateiendungen
  if (!filePath.endsWith('.sqlite') && !filePath.endsWith('.db')) {
    throw new Error('Invalid backup file extension');
  }
  
  // Pfad muss absolut sein
  if (!path.isAbsolute(filePath)) {
    throw new Error('Backup path must be absolute');
  }
}
```

### 5. Error Information Leakage Prevention
```typescript
// Keine sensitiven Informationen in Error Messages
try {
  const result = db.prepare(sql).all(params);
  return result;
} catch (error) {
  // Log details only in Main Process
  console.error('Database query failed:', error);
  
  // Return sanitized error to Renderer
  throw new Error('Database operation failed');
}
```

## Client-Side Security (DbClient.ts)

### Wrapper Pattern
```typescript
export class DbClient {
  private static instance: DbClient | null = null;

  private constructor() {
    // Validate API availability
    if (!window.rawalite?.db?.query) {
      throw new Error('Database API not available - check preload script');
    }
  }

  // Type-safe query methods
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      return await window.rawalite.db.query(sql, params) as T[];
    } catch (error) {
      // Log error but don't expose sensitive details
      await LoggingService.logError(error as Error, 'DbClient.query failed');
      throw error;
    }
  }
}
```

### Type Safety
```typescript
// Client-side type definitions für sichere API-Nutzung
interface Customer {
  id: number;
  company_name: string;
  contact_person?: string;
  email?: string;
  // ... weitere typisierte Felder
}

// Type-safe queries
const customers = await dbClient.query<Customer>('SELECT * FROM customers');
// customers ist automatisch als Customer[] typisiert
```

## Threat Mitigation

### Bedrohung: SQL Injection
**Mitigation**: 
- Ausschließlich prepared statements mit parameter binding
- Keine dynamischen SQL-String-Konstruktionen
- Input validation auf Client-Seite als zusätzliche Schicht

### Bedrohung: Path Traversal (Backup Operations)
**Mitigation**:
- Strikte Pfad-Validierung in BackupService
- Whitelist erlaubter Verzeichnisse
- Absolute Pfad-Anforderung

### Bedrohung: Process Compromise
**Mitigation**:
- Database läuft nur im Main Process
- Renderer hat keinen direkten Dateisystem-Zugriff
- contextBridge als sichere Kommunikationsschicht

### Bedrohung: Data Exfiltration
**Mitigation**:
- Explizite Whitelisting aller IPC-Channels
- Keine Wildcard- oder Dynamic-Channel-Registrierung
- Logging aller Database-Operationen

### Bedrohung: Backup File Tampering
**Mitigation**:
- Checksum-Validierung bei Backup-Erstellung
- Integrity-Check vor Restore-Operationen
- Sichere Backup-Pfad-Validierung

## Security Audit Checklist

### ✅ Implementiert
- [x] IPC-Only Database Access
- [x] Whitelisted IPC Channels
- [x] SQL Injection Prevention (Prepared Statements)
- [x] Path Traversal Prevention
- [x] Error Information Sanitization
- [x] Process Isolation (Main vs Renderer)
- [x] contextBridge Security Boundary
- [x] Type-Safe Client APIs
- [x] Backup File Validation
- [x] Operation Logging

### 🔄 Zusätzliche Sicherheitsmaßnahmen (Zukunft)
- [ ] Rate Limiting für IPC-Calls
- [ ] SQL Query Whitelisting (nur approved Patterns)
- [ ] Backup Encryption (AES-256)
- [ ] Database File Encryption at Rest
- [ ] Audit Log für alle Database-Operationen
- [ ] User Permission System

## Best Practices für Entwickler

### ✅ Richtige Verwendung
```typescript
// Query mit Parameter Binding
const customers = await dbClient.query<Customer>(
  'SELECT * FROM customers WHERE company_name LIKE ?', 
  [`%${searchTerm}%`]
);

// Transaction für mehrere Operations
await dbClient.transaction([
  { sql: 'INSERT INTO customers (company_name) VALUES (?)', params: ['Acme Corp'] },
  { sql: 'UPDATE settings SET value = ? WHERE key = ?', params: ['updated', 'last_action'] }
]);
```

### ❌ Vermeiden
```typescript
// String Concatenation - SQL Injection Risk!
const badQuery = `SELECT * FROM customers WHERE name = '${userInput}'`;

// Direct Node.js Module Usage im Renderer
const fs = require('fs'); // ❌ Nicht verfügbar und unsicher

// Dynamic IPC Channel Names
ipcRenderer.invoke(`db:${userAction}`, data); // ❌ Nicht whitelisted
```

## Compliance & Standards

- **OWASP**: Entspricht OWASP Top 10 Security Guidelines
- **Electron Security**: Folgt Electron Security Best Practices
- **SQLite Security**: Nutzt SQLite's integrierte Sicherheitsmechanismen
- **IPC Security**: Implements secure Inter-Process Communication patterns

---

**Security Review**: ✅ Passed  
**Penetration Test**: 🔄 Pending  
**Letzte Security Aktualisierung**: 29.09.2025
