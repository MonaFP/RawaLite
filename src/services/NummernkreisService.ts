import DbClient from './DbClient';
import { convertSQLQuery, mapFromSQLArray } from '../lib/field-mapper';

export class NummernkreisService {
  private static client = DbClient.getInstance();
  
  static async getNextNumber(circleId: string): Promise<string> {
    const query = convertSQLQuery(`
      SELECT id, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      WHERE id = ?
    `);
    
    const circles = await this.client.query<{
      id: string;
      prefix: string;
      digits: number;
      current: number;
      resetMode: 'never' | 'yearly';
      lastResetYear: number | null;
    }>(query, [circleId]);

    if (circles.length === 0) {
      throw new Error(`Nummernkreis '${circleId}' nicht gefunden`);
    }

    const circle = circles[0];
    const currentYear = new Date().getFullYear();
    let nextNumber = circle.current + 1;

    if (circle.resetMode === 'yearly') {
      if (!circle.lastResetYear || circle.lastResetYear !== currentYear) {
        nextNumber = 1;
      }
    }

    await this.client.transaction([
      {
        sql: `
          UPDATE numbering_circles 
          SET current = ?, last_reset_year = ?, updated_at = datetime('now')
          WHERE id = ?
        `,
        params: [
          nextNumber,
          circle.resetMode === 'yearly' ? currentYear : circle.lastResetYear,
          circleId
        ]
      }
    ]);

    const paddedNumber = nextNumber.toString().padStart(circle.digits, '0');
    return `${circle.prefix}${paddedNumber}`;
  }

  static async getAllCircles() {
    const query = convertSQLQuery(`
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      ORDER BY name
    `);
    
    const sqlRows = await this.client.query(query);
    return mapFromSQLArray(sqlRows);
  }
}