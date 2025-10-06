// Status update service with optimistic locking and conflict resolution
import type { Database } from 'better-sqlite3';

export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type TimesheetStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export type EntityTable = 'offers' | 'invoices' | 'timesheets';
export type EntityStatus = OfferStatus | InvoiceStatus | TimesheetStatus;

export interface StatusUpdateResult {
  id: number;
  status: EntityStatus;
  version: number;
  updated_at: string;
  sent_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  paid_at?: string | null;
  overdue_at?: string | null;
  cancelled_at?: string | null;
}

export interface StatusUpdateParams {
  id: number;
  newStatus: EntityStatus;
  expectedVersion: number;
  changedBy?: string;
}

export class StatusUpdateConflictError extends Error {
  constructor(
    public entityType: EntityTable,
    public entityId: number,
    public expectedVersion: number,
    public actualVersion: number
  ) {
    super(`Status update conflict for ${entityType} ${entityId}: expected version ${expectedVersion}, actual version ${actualVersion}`);
    this.name = 'StatusUpdateConflictError';
  }
}

export class EntityNotFoundError extends Error {
  constructor(
    public entityType: EntityTable,
    public entityId: number
  ) {
    super(`${entityType} with id ${entityId} not found`);
    this.name = 'EntityNotFoundError';
  }
}

/**
 * Updates entity status with optimistic locking and automatic timestamp management
 * 
 * @param db - Better-sqlite3 database instance
 * @param table - Entity table ('offers' | 'invoices' | 'timesheets')
 * @param params - Update parameters with id, status, expected version
 * @returns Updated entity with new version and timestamps
 * 
 * @throws StatusUpdateConflictError - When version mismatch occurs
 * @throws EntityNotFoundError - When entity doesn't exist
 */
export function updateEntityStatus(
  db: Database,
  table: EntityTable,
  params: StatusUpdateParams
): StatusUpdateResult {
  const { id, newStatus, expectedVersion, changedBy = 'system' } = params;
  
  // Validate status values based on entity type
  validateStatusForEntity(table, newStatus);
  
  // Start transaction for consistency
  db.exec('BEGIN IMMEDIATE;');
  
  try {
    // 1. Check current entity state and version
    const currentEntity = db.prepare(`
      SELECT id, status, version, updated_at 
      FROM ${table} 
      WHERE id = ?
    `).get(id) as { id: number; status: EntityStatus; version: number; updated_at: string } | undefined;
    
    if (!currentEntity) {
      throw new EntityNotFoundError(table, id);
    }
    
    // 2. Check version for optimistic locking
    if (currentEntity.version !== expectedVersion) {
      throw new StatusUpdateConflictError(
        table,
        id,
        expectedVersion,
        currentEntity.version
      );
    }
    
    // 3. Skip update if status hasn't changed
    if (currentEntity.status === newStatus) {
      db.exec('COMMIT;');
      return {
        id: currentEntity.id,
        status: currentEntity.status,
        version: currentEntity.version,
        updated_at: currentEntity.updated_at
      };
    }
    
    const now = new Date().toISOString();
    const newVersion = currentEntity.version + 1;
    
    // 4. Build status-specific timestamp updates
    const timestampUpdates = buildTimestampUpdates(table, newStatus, now);
    
    // 5. Update entity with new status, version, and timestamps
    const updateQuery = `
      UPDATE ${table} 
      SET status = ?, 
          version = ?, 
          updated_at = ?
          ${timestampUpdates.query}
      WHERE id = ? AND version = ?
    `;
    
    const updateParams = [
      newStatus,
      newVersion,
      now,
      ...timestampUpdates.params,
      id,
      expectedVersion
    ];
    
    const updateResult = db.prepare(updateQuery).run(updateParams);
    
    if (updateResult.changes !== 1) {
      throw new StatusUpdateConflictError(table, id, expectedVersion, -1);
    }
    
    // 6. Get updated entity (triggers will handle history logging)
    const updatedEntity = db.prepare(`
      SELECT * FROM ${table} WHERE id = ?
    `).get(id) as any;
    
    // 7. Commit transaction
    db.exec('COMMIT;');
    
    console.log(`✅ Status updated: ${table}[${id}] ${currentEntity.status} → ${newStatus} (v${expectedVersion} → v${newVersion})`);
    
    return {
      id: updatedEntity.id,
      status: updatedEntity.status,
      version: updatedEntity.version,
      updated_at: updatedEntity.updated_at,
      sent_at: updatedEntity.sent_at,
      accepted_at: updatedEntity.accepted_at,
      rejected_at: updatedEntity.rejected_at,
      paid_at: updatedEntity.paid_at,
      overdue_at: updatedEntity.overdue_at,
      cancelled_at: updatedEntity.cancelled_at
    };
    
  } catch (error) {
    // Rollback on any error
    db.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Validates status value for specific entity type
 */
function validateStatusForEntity(table: EntityTable, status: EntityStatus): void {
  const validStatuses = {
    offers: ['draft', 'sent', 'accepted', 'rejected'],
    invoices: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    timesheets: ['draft', 'sent', 'accepted', 'rejected']
  };
  
  if (!validStatuses[table].includes(status)) {
    throw new Error(`Invalid status '${status}' for ${table}. Valid statuses: ${validStatuses[table].join(', ')}`);
  }
}

/**
 * Builds timestamp update clauses for status-specific timestamps
 */
function buildTimestampUpdates(table: EntityTable, status: EntityStatus, timestamp: string) {
  const updates: string[] = [];
  const params: string[] = [];
  
  if (table === 'offers') {
    if (status === 'sent') {
      updates.push(', sent_at = COALESCE(sent_at, ?)');
      params.push(timestamp);
    } else if (status === 'accepted') {
      updates.push(', accepted_at = COALESCE(accepted_at, ?)');
      params.push(timestamp);
    } else if (status === 'rejected') {
      updates.push(', rejected_at = COALESCE(rejected_at, ?)');
      params.push(timestamp);
    }
  } else if (table === 'invoices') {
    if (status === 'sent') {
      updates.push(', sent_at = COALESCE(sent_at, ?)');
      params.push(timestamp);
    } else if (status === 'paid') {
      updates.push(', paid_at = COALESCE(paid_at, ?)');
      params.push(timestamp);
    } else if (status === 'overdue') {
      updates.push(', overdue_at = COALESCE(overdue_at, ?)');
      params.push(timestamp);
    } else if (status === 'cancelled') {
      updates.push(', cancelled_at = COALESCE(cancelled_at, ?)');
      params.push(timestamp);
    }
  }
  // Timesheets don't have additional timestamp fields yet
  
  return {
    query: updates.join(' '),
    params
  };
}

/**
 * Gets status history for an entity
 */
export function getStatusHistory(
  db: Database,
  table: EntityTable,
  entityId: number
): Array<{
  id: number;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string;
}> {
  const historyTable = `${table.slice(0, -1)}_status_history`; // offers -> offer_status_history
  
  return db.prepare(`
    SELECT id, old_status, new_status, changed_at, changed_by
    FROM ${historyTable}
    WHERE ${table.slice(0, -1)}_id = ?
    ORDER BY changed_at DESC
  `).all(entityId) as Array<{
    id: number;
    old_status: string | null;
    new_status: string;
    changed_at: string;
    changed_by: string;
  }>;
}

/**
 * Gets current entity with version for optimistic locking
 */
export function getEntityForUpdate(
  db: Database,
  table: EntityTable,
  id: number
): { id: number; status: EntityStatus; version: number } | null {
  const result = db.prepare(`
    SELECT id, status, version
    FROM ${table}
    WHERE id = ?
  `).get(id) as { id: number; status: EntityStatus; version: number } | undefined;
  
  return result || null;
}