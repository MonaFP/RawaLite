import DbClient from './DbClient';

export class NummernkreisService {
  private static client = DbClient.getInstance();
  
  static async getNextNumber(circleId: string): Promise<string> {
    const circles = await this.client.query<{
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
          SET current = ?, lastResetYear = ?, updatedAt = datetime('now')
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
    return await this.client.query(`
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      ORDER BY name
    `);
  }
}