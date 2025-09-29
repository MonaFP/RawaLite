import { getDB, all, run, withTx } from '../persistence/sqlite/db';

/**
 * 🔢 Robuster Nummernkreis-Service (Phase 2)
 * 
 * SQLite-basierte Nummernverwaltung mit:
 * - Atomaren Transaktionen
 * - Jahresreset-Funktionalität  
 * - Konsistenter Formatierung
 * - Thread-sicherer Implementierung
 */
export class NummernkreisService {
  
  /**
   * 🎯 Nächste Nummer generieren
   * Thread-sicher durch SQLite-Transaktionen
   */
  static async getNextNumber(circleId: string): Promise<string> {
    await getDB();
    
    return await withTx(async () => {
      // 1️⃣ Nummernkreis laden
      const circles = all<{
        id: string;
        prefix: string;
        digits: number;
        current: number;
        resetMode: 'never' | 'yearly';
        lastResetYear: number | null;
      }>(`
        SELECT id, prefix, digits, current, resetMode, lastResetYear 
        FROM numbering_circles 
        WHERE id = ?
      `, [circleId]);
      
      if (circles.length === 0) {
        throw new Error(`Nummernkreis '${circleId}' nicht gefunden`);
      }
      
      const circle = circles[0];
      const currentYear = new Date().getFullYear();
      let newCurrent = circle.current + 1;
      
      // 2️⃣ Jahresreset prüfen
      if (circle.resetMode === 'yearly' && circle.lastResetYear !== currentYear) {
        console.log(`🔄 Jahresreset für ${circleId}: ${circle.lastResetYear || 'nie'} → ${currentYear}`);
        newCurrent = 1;
      }
      
      // 3️⃣ Zähler atomisch aktualisieren
      run(`
        UPDATE numbering_circles 
        SET current = ?, lastResetYear = ?, updatedAt = datetime('now')
        WHERE id = ?
      `, [newCurrent, currentYear, circleId]);
      
      // 4️⃣ Formatierte Nummer zurückgeben
      const formattedNumber = `${circle.prefix}${newCurrent.toString().padStart(circle.digits, '0')}`;
      
      console.log(`✅ Neue Nummer generiert: ${formattedNumber} (${circleId})`);
      return formattedNumber;
    });
  }
  
  /**
   * 📋 Alle Nummernkreise abrufen
   */
  static async getAllCircles(): Promise<Array<{
    id: string;
    name: string;
    prefix: string;
    digits: number;
    current: number;
    resetMode: 'never' | 'yearly';
    lastResetYear: number | null;
  }>> {
    await getDB();
    
    return all(`
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear
      FROM numbering_circles
      ORDER BY name
    `);
  }
  
  /**
   * ⚙️ Nummernkreis konfigurieren
   */
  static async updateCircle(circleId: string, updates: {
    prefix?: string;
    digits?: number;
    resetMode?: 'never' | 'yearly';
  }): Promise<void> {
    await getDB();
    
    const setClause = [];
    const values = [];
    
    if (updates.prefix !== undefined) {
      setClause.push('prefix = ?');
      values.push(updates.prefix);
    }
    if (updates.digits !== undefined) {
      setClause.push('digits = ?');
      values.push(updates.digits);
    }
    if (updates.resetMode !== undefined) {
      setClause.push('resetMode = ?');
      values.push(updates.resetMode);
    }
    
    if (setClause.length === 0) return;
    
    setClause.push('updatedAt = datetime(\'now\')');
    values.push(circleId);
    
    run(`
      UPDATE numbering_circles 
      SET ${setClause.join(', ')}
      WHERE id = ?
    `, values);
    
    console.log(`⚙️ Nummernkreis ${circleId} aktualisiert:`, updates);
  }
  
  /**
   * 🔄 Manueller Reset eines Nummernkreises
   */
  static async resetCircle(circleId: string): Promise<void> {
    await getDB();
    
    const currentYear = new Date().getFullYear();
    
    run(`
      UPDATE numbering_circles 
      SET current = 0, lastResetYear = ?, updatedAt = datetime('now')
      WHERE id = ?
    `, [currentYear, circleId]);
    
    console.log(`🔄 Nummernkreis ${circleId} manuell zurückgesetzt`);
  }
  
  /**
   * 📊 Nummernkreis-Statistiken
   */
  static async getCircleStats(circleId: string): Promise<{
    id: string;
    name: string;
    current: number;
    nextNumber: string;
    lastResetYear: number | null;
    resetMode: string;
  } | null> {
    await getDB();
    
    const circles = all<{
      id: string;
      name: string;
      prefix: string;
      digits: number;
      current: number;
      resetMode: string;
      lastResetYear: number | null;
    }>(`
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear
      FROM numbering_circles 
      WHERE id = ?
    `, [circleId]);
    
    if (circles.length === 0) return null;
    
    const circle = circles[0];
    const nextNumber = circle.current + 1;
    const formattedNext = `${circle.prefix}${nextNumber.toString().padStart(circle.digits, '0')}`;
    
    return {
      id: circle.id,
      name: circle.name,
      current: circle.current,
      nextNumber: formattedNext,
      lastResetYear: circle.lastResetYear,
      resetMode: circle.resetMode
    };
  }
  
  /**
   * 🧪 Testing Helper - Zähler setzen
   */
  static async _setCounterForTesting(circleId: string, value: number): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('_setCounterForTesting only available in test environment');
    }
    
    await getDB();
    
    run(`
      UPDATE numbering_circles 
      SET current = ?, updatedAt = datetime('now')
      WHERE id = ?
    `, [value, circleId]);
  }
}