import { describe, it, expect } from 'vitest';
import { NummernkreisService } from '../src/services/NummernkreisService.ts';

describe('NummernkreisService', () => {
  it('vergibt sequentielle Nummern', () => {
    const service = new NummernkreisService();
    expect(service.getNext('RE')).toBe('RE-000001');
    expect(service.getNext('RE')).toBe('RE-000002');
  });

  // Fuzz-Tests: Viele Aufrufe, Kollisionscheck
});