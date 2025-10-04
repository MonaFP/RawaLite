import DbClient from './DbClient';
import { convertSQLQuery, mapFromSQLArray } from '../lib/field-mapper';
import type { NumberingCircle } from '../lib/settings';

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
        sql: convertSQLQuery(`
          UPDATE numbering_circles 
          SET current = ?, lastResetYear = ?, updated_at = datetime('now')
          WHERE id = ?
        `),
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

  // Instance methods for IPC integration
  async getAll(): Promise<NumberingCircle[]> {
    const sqlRows = await NummernkreisService.getAllCircles();
    return sqlRows as NumberingCircle[];
  }

  async getNext(circleId: string): Promise<string> {
    return NummernkreisService.getNextNumber(circleId);
  }

  async update(id: string, circle: NumberingCircle): Promise<void> {
    const query = convertSQLQuery(`
      UPDATE numbering_circles 
      SET name = ?, prefix = ?, digits = ?, current = ?, resetMode = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    await NummernkreisService.client.exec(query, [
      circle.name,
      circle.prefix,
      circle.digits,
      circle.current,
      circle.resetMode,
      id
    ]);
  }
}