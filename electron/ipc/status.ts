// electron/ipc/status.ts
import { ipcMain } from 'electron'
import { getDb } from '../../src/main/db/Database'
import { updateEntityStatus, getStatusHistory, getEntityForUpdate } from '../../src/main/services/EntityStatusService'

/**
 * Database Status IPC Handlers - Extracted from main.ts Step 5
 * 
 * CRITICAL: Implements FIX-010 - Database-driven status updates with optimistic locking
 * 
 * Provides secure status management for business entities:
 * - Optimistic locking with version control
 * - Status history tracking
 * - Entity update preparation
 * 
 * Critical Fixes Preserved:
 * - FIX-010: Database-driven status updates with optimistic locking
 * 
 * Used by:
 * - Offer status management
 * - Invoice status management  
 * - Timesheet status management
 * - Status history tracking
 */

/**
 * Register all status-related IPC handlers
 * CRITICAL: Must preserve optimistic locking patterns from FIX-010
 */
export function registerStatusHandlers(): void {
  // === STATUS UPDATE SYSTEM ===
  // Handler for updating entity status with optimistic locking
  ipcMain.handle('status:updateOfferStatus', async (event, params: { id: number; status: string; expectedVersion: number }) => {
    try {
      const db = getDb()
      const result = updateEntityStatus(db, 'offers', {
        id: params.id,
        newStatus: params.status as any,
        expectedVersion: params.expectedVersion,
        changedBy: 'user'
      })
      return result
    } catch (error) {
      console.error('Failed to update offer status:', error)
      throw error
    }
  })

  ipcMain.handle('status:updateInvoiceStatus', async (event, params: { id: number; status: string; expectedVersion: number }) => {
    try {
      const db = getDb()
      const result = updateEntityStatus(db, 'invoices', {
        id: params.id,
        newStatus: params.status as any,
        expectedVersion: params.expectedVersion,
        changedBy: 'user'
      })
      return result
    } catch (error) {
      console.error('Failed to update invoice status:', error)
      throw error
    }
  })

  ipcMain.handle('status:updateTimesheetStatus', async (event, params: { id: number; status: string; expectedVersion: number }) => {
    try {
      const db = getDb()
      const result = updateEntityStatus(db, 'timesheets', {
        id: params.id,
        newStatus: params.status as any,
        expectedVersion: params.expectedVersion,
        changedBy: 'user'
      })
      return result
    } catch (error) {
      console.error('Failed to update timesheet status:', error)
      throw error
    }
  })

  // Handler for getting status history
  ipcMain.handle('status:getHistory', async (event, params: { entityType: string; entityId: number }) => {
    try {
      const db = getDb()
      return getStatusHistory(db, params.entityType as any, params.entityId)
    } catch (error) {
      console.error('Failed to get status history:', error)
      throw error
    }
  })

  // Handler for getting entity for update (with version for optimistic locking)
  ipcMain.handle('status:getEntityForUpdate', async (event, params: { entityType: string; entityId: number }) => {
    try {
      const db = getDb()
      return getEntityForUpdate(db, params.entityType as any, params.entityId)
    } catch (error) {
      console.error('Failed to get entity for update:', error)
      throw error
    }
  })
}