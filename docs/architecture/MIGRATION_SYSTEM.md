# 🔧 RaWaLite Migration & Update System

> **Database Migration & Update Architecture** - Version 1.5.5 (Current: Dezember 2024)

This document describes the comprehensive database migration and application update system for RaWaLite, designed to ensure safe upgrades without data loss.

## Overview

The migration system provides:

- **Automatic schema versioning** with incremental migrations
- **Automatic backup creation** before each migration
- **Integrity validation** to ensure data consistency
- **Rollback capabilities** in case of failures
- **Progress tracking** with user-friendly UI
- **GitHub Releases Integration** for seamless updates
- **Cleanup mechanisms** for old backups

## Architecture

### Core Services

#### `MigrationService.ts`
- Handles database schema migrations
- Creates and manages backups
- Validates data integrity
- Provides rollback capabilities

#### `UpdateService.ts` (Real GitHub API Integration)
- Coordinates application updates via GitHub Releases API
- Integrates with MigrationService
- Manages update progress
- Handles portable app update workflow

#### `VersionService.ts`
- Version management (v1.5.5 current)
- Update notifications to users
- Build date tracking

#### `useMigration.ts` (React Hook)
- Provides React integration
- Manages migration state
- Handles user interactions

#### `MigrationManager.tsx` (UI Component)
- Visual interface for migrations
- Progress visualization
- Backup management
- Error handling

## Database Schema Versioning

### Version History

| Version | Changes | Migration Script |
|---------|---------|------------------|
| 1 | Initial schema | `migration_001_initial_schema()` |
| 2 | Add activity tracking | `migration_002_add_activity_tracking()` |
| 3 | Improve numbering system | `migration_003_improve_numbering()` |
| 4 | Add audit fields | `migration_004_add_audit_fields()` |
| 5 | Performance optimization | `migration_005_optimize_indexes()` |

### Schema Tables

#### `schema_versions`
Tracks migration history:
```sql
CREATE TABLE schema_versions (
    version INTEGER PRIMARY KEY,
    lastMigration TEXT,
    appVersion TEXT,
    migratedAt TEXT
);
```

#### `backup_metadata`
Manages backup information:
```sql
CREATE TABLE backup_metadata (
    id TEXT PRIMARY KEY,
    version INTEGER,
    appVersion TEXT,
    size INTEGER,
    createdAt TEXT,
    description TEXT,
    checksumSHA256 TEXT
);
```

## Migration Process

### 1. Pre-Migration
1. Check current schema version
2. Identify required migrations
3. Create automatic backup
4. Validate database integrity

### 2. Migration Execution
1. Run migrations sequentially
2. Validate each step
3. Update schema version
4. Test migration success

### 3. Post-Migration
1. Final integrity check
2. Cleanup temporary files
3. Update backup metadata
4. Log completion

### 4. Error Handling
- Automatic rollback on failure
- Restore from backup if needed
- Detailed error logging
- User notification

## Backup System

### Backup Creation
- **Automatic**: Before each migration
- **Manual**: On-demand via UI
- **Scheduled**: Not yet implemented

### Backup Storage
- Local storage as binary data
- SHA-256 checksums for integrity
- Metadata tracking
- Automatic cleanup

### Backup Restoration
Currently not implemented in UI, but service supports:
```typescript
await migrationService.restoreBackup(backupId);
```

## Usage

### Programmatic Usage

```typescript
import { MigrationService } from './services/MigrationService';
import { UpdateService } from './services/UpdateService';

// Initialize migration service
const migrationService = new MigrationService();
await migrationService.initialize();

// Check migration status
const status = await migrationService.getMigrationStatus();
if (status.needsMigration) {
    // Handle migration needed
}

// Create manual backup
const backupId = await migrationService.createManualBackup('Before major change');

// Update service with progress tracking
const updateService = new UpdateService();
await updateService.performUpdate();
```

### React Integration

```typescript
import { useMigration } from './hooks/useMigration';

function MyComponent() {
    const {
        needsMigration,
        isUpdating,
        progress,
        backups,
        runMigration,
        createBackup
    } = useMigration();

    return (
        <div>
            {needsMigration && (
                <button onClick={runMigration}>
                    Run Migration
                </button>
            )}
            {progress && (
                <div>Progress: {progress.progress}%</div>
            )}
        </div>
    );
}
```

### UI Component

```typescript
import { MigrationManager } from './components/MigrationManager';

function App() {
    const [showMigration, setShowMigration] = useState(false);

    return (
        <div>
            {showMigration && (
                <MigrationManager onClose={() => setShowMigration(false)} />
            )}
        </div>
    );
}
```

## Configuration

### Migration Settings

```typescript
const MIGRATION_CONFIG = {
    CURRENT_VERSION: 5,           // Latest schema version
    MAX_BACKUPS: 5,               // Keep last 5 backups
    BACKUP_CLEANUP_INTERVAL: 7,   // Days before cleanup
    INTEGRITY_CHECK_TIMEOUT: 30000, // 30 seconds
};
```

### Logging

All migration activities are logged via `LoggingService`:
- Migration start/completion
- Backup creation
- Error conditions
- Performance metrics

## Error Recovery

### Common Issues

1. **Migration Failure**: Automatic rollback to previous backup
2. **Corruption Detection**: Restore from last known good backup
3. **Insufficient Space**: Cleanup old backups automatically
4. **Network Issues**: Retry with exponential backoff

### Manual Recovery

If automatic recovery fails:

1. Check logs in `LoggingService`
2. Manually restore from backup:
   ```typescript
   await migrationService.restoreBackup(lastKnownGoodBackup);
   ```
3. Re-run integrity checks:
   ```typescript
   await migrationService.runIntegrityCheck();
   ```

## Performance Considerations

### Migration Performance
- Migrations run within transactions
- Batch operations where possible
- Progress reporting for user feedback
- Timeout handling for long operations

### Backup Performance
- Incremental backups (not yet implemented)
- Compression (not yet implemented)
- Background cleanup
- Size monitoring

## Security

### Data Protection
- Backups stored locally only
- No PII exposure in logs
- Checksums prevent tampering
- Secure deletion of old backups

### Validation
- Schema integrity checks
- Data consistency validation
- Rollback verification
- Corruption detection

## Future Enhancements

### Planned Features
1. **Incremental Backups**: Only backup changed data
2. **Cloud Backup**: Optional cloud storage
3. **Scheduled Migrations**: Background updates
4. **Migration Testing**: Dry-run capabilities
5. **Advanced Recovery**: Point-in-time recovery

### Integration Points
- **Settings Page**: Migration controls
- **Dashboard**: Status indicators
- **Notification System**: Migration alerts
- **Audit Log**: Migration history

## Testing

### Unit Tests
```bash
npm test src/services/MigrationService.test.ts
npm test src/services/UpdateService.test.ts
```

### Integration Tests
- Full migration workflow
- Backup/restore cycle
- Error scenarios
- Performance benchmarks

### Manual Testing Checklist
- [ ] Fresh installation migration
- [ ] Incremental version upgrades
- [ ] Backup creation/cleanup
- [ ] Error handling/recovery
- [ ] UI responsiveness
- [ ] Performance with large datasets

## Monitoring

### Key Metrics
- Migration execution time
- Backup creation frequency
- Error rates
- Storage usage
- User interaction patterns

### Health Checks
- Database integrity status
- Backup validity
- Schema version consistency
- Storage space availability

---

This migration system ensures RaWaLite can safely evolve its database schema while protecting user data and providing a smooth upgrade experience.
