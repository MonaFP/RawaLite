// electron/ipc/numbering.ts
import { ipcMain } from 'electron'
import { getDb } from '../../src/main/db/Database'
import { convertSQLQuery } from '../../src/lib/field-mapper'

/**
 * Numbering Circles IPC Handlers - Extracted from main.ts Step 6
 * 
 * Provides numbering circle management for business documents:
 * - CRUD operations for numbering circles
 * - Automatic number generation with yearly reset support
 * - Direct database access with field mapping
 * 
 * Features:
 * - getAll: Retrieve all numbering circles
 * - create: Create new numbering circle
 * - update: Update existing numbering circle  
 * - getNext: Generate next number in sequence with yearly reset logic
 * 
 * Critical Fixes: None directly affected by this module
 * Risk Level: Medium (database operations but no Critical Fixes)
 */

/**
 * Register all numbering-related IPC handlers
 */
export function registerNumberingHandlers(): void {
  // 🔢 Numbering Circles IPC Handlers
  ipcMain.handle('nummernkreis:getAll', async () => {
    try {
      // Direct database access instead of DbClient service
      const db = getDb()
      const query = convertSQLQuery(`
        SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
        FROM numberingCircles 
        ORDER BY name
      `)
      const circles = db.prepare(query).all()
      console.log('🔍 [DEBUG] Main Process - Found circles:', circles.length);
      console.log('🔍 [DEBUG] Main Process - Circle data:', circles);
      return { success: true, data: circles }
    } catch (error) {
      console.error('Error getting numbering circles:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('nummernkreis:update', async (event, id: string, circle: any) => {
    try {
      // Direct database access instead of DbClient service
      const db = getDb()
      const updateQuery = convertSQLQuery(`
        UPDATE numberingCircles 
        SET name = ?, prefix = ?, digits = ?, current = ?, resetMode = ?, updatedAt = datetime('now')
        WHERE id = ?
      `)
      db.prepare(updateQuery).run(circle.name, circle.prefix, circle.digits, circle.current, circle.resetMode, id)
      return { success: true }
    } catch (error) {
      console.error('Error updating numbering circle:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('nummernkreis:create', async (event, id: string, circle: any) => {
    try {
      // Direct database access instead of DbClient service
      const db = getDb()
      const insertQuery = convertSQLQuery(`
        INSERT OR IGNORE INTO numberingCircles (id, name, prefix, digits, current, resetMode, lastResetYear, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      db.prepare(insertQuery).run(id, circle.name, circle.prefix, circle.digits, circle.current, circle.resetMode, circle.lastResetYear)
      return { success: true }
    } catch (error) {
      console.error('Error creating numbering circle:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('nummernkreis:getNext', async (event, circleId: string) => {
    try {
      // Direct database access instead of DbClient service
      const db = getDb()
      
      // Get current circle
      const selectQuery = convertSQLQuery(`
        SELECT id, prefix, digits, current, resetMode, lastResetYear 
        FROM numberingCircles 
        WHERE id = ?
      `)
      const circle = db.prepare(selectQuery).get(circleId) as any
      
      if (!circle) {
        throw new Error(`Nummernkreis '${circleId}' nicht gefunden`)
      }

      const currentYear = new Date().getFullYear()
      let nextNumber = circle.current + 1

      if (circle.resetMode === 'yearly') {
        if (!circle.lastResetYear || circle.lastResetYear !== currentYear) {
          nextNumber = 1
        }
      }

      // Update circle
      const updateQuery = convertSQLQuery(`
        UPDATE numberingCircles 
        SET current = ?, lastResetYear = ?, updatedAt = datetime('now')
        WHERE id = ?
      `)
      db.prepare(updateQuery).run(
        nextNumber,
        circle.resetMode === 'yearly' ? currentYear : circle.lastResetYear,
        circleId
      )

      const paddedNumber = nextNumber.toString().padStart(circle.digits, '0')
      const fullNumber = `${circle.prefix}${paddedNumber}`
      
      return { success: true, data: fullNumber }
    } catch (error) {
      console.error('Error getting next number:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}