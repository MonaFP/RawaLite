import Decimal from 'decimal.js'; // pnpm add decimal.js

export class NummernkreisService {
  private kreise: Map<string, { prefix: string; digits: number; current: Decimal; reset: 'jaehrlich' | 'nie' }> = new Map();

  constructor() {
    // Init aus Config
    this.kreise.set('RE', { prefix: 'RE-', digits: 6, current: new Decimal(0), reset: 'jaehrlich' });
    // ... K, AN, PAK
  }

  getNext(prefix: string): string {
    const kreis = this.kreise.get(prefix);
    if (!kreis) throw new Error('Ungültiger Kreis');
    // Reset Logic wenn jahrlich und neues Jahr
    kreis.current = kreis.current.add(1);
    return `${kreis.prefix}${kreis.current.toString().padStart(kreis.digits, '0')}`;
  }
}