import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NummernkreisService } from '../../src/services/NummernkreisService';

// Mock window.rawalite für Test-Umgebung
const mockRawalite = {
  db: {
    query: vi.fn(),
    exec: vi.fn(),
    transaction: vi.fn()
  }
};

// Setup global mock
Object.defineProperty(global, 'window', {
  value: { rawalite: mockRawalite },
  writable: true
});

describe('NummernkreisService', () => {
  let service: NummernkreisService;

  beforeEach(() => {
    service = new NummernkreisService();
    vi.clearAllMocks();
  });

  it('vergibt sequentielle Nummern', async () => {
    // Mock response für getNext
    mockRawalite.db.query.mockResolvedValueOnce([{
      id: 'RE',
      prefix: 'RE-',
      digits: 6,
      current: 0,
      resetMode: 'never',
      lastResetYear: null
    }]);
    
    mockRawalite.db.transaction.mockResolvedValue([{}]);

    const result1 = await service.getNext('RE');
    expect(result1).toBe('RE-000001');

    // Mock für zweiten Aufruf
    mockRawalite.db.query.mockResolvedValueOnce([{
      id: 'RE',
      prefix: 'RE-',
      digits: 6,
      current: 1,
      resetMode: 'never',
      lastResetYear: null
    }]);

    const result2 = await service.getNext('RE');
    expect(result2).toBe('RE-000002');
  });

  // Fuzz-Tests: Viele Aufrufe, Kollisionscheck
});