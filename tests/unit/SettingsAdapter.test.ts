import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsAdapter } from '../../src/adapters/SettingsAdapter';
import type { NumberingCircle } from '../../src/lib/settings';

// Mock der SQLite-Datenbank-Funktionen
const mockAll = vi.fn();
const mockRun = vi.fn();
const mockWithTx = vi.fn();

vi.mock('../../src/persistence/sqlite/db', () => ({
  getDB: vi.fn(() => Promise.resolve({})),
  all: (...args: any[]) => mockAll(...args),
  run: (...args: any[]) => mockRun(...args),
  withTx: (fn: Function) => mockWithTx(fn)
}));

describe('Auto-Nummerierung (SettingsAdapter)', () => {
  let adapter: SettingsAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SettingsAdapter();
    
    // Mock withTx to execute function directly
    mockWithTx.mockImplementation((fn) => fn());
  });

  it('generiert sequentielle Kundennummern', async () => {
    // Mock numbering circle data from SQLite
    const customerCircle: NumberingCircle = {
      id: 'customers',
      name: 'Kunden',
      prefix: 'K-',
      digits: 3,
      current: 0,
      resetMode: 'never',
      lastResetYear: undefined
    };

    mockAll.mockReturnValueOnce([customerCircle]);

    const number = await adapter.getNextNumber('customers');
    
    expect(number).toBe('K-001');
    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE numbering_circles'),
      expect.arrayContaining([1, 2025, expect.any(String), 'customers'])
    );
  });

  it('generiert jährliche Angebotsnummern', async () => {
    const offerCircle: NumberingCircle = {
      id: 'offers',
      name: 'Angebote',
      prefix: 'AN-2025-',
      digits: 4,
      current: 0,
      resetMode: 'yearly',
      lastResetYear: 2025
    };

    mockAll.mockReturnValueOnce([offerCircle]);

    const number = await adapter.getNextNumber('offers');
    
    expect(number).toBe('AN-2025-0001');
  });

  it('wirft Fehler bei unbekanntem Nummernkreis', async () => {
    mockAll.mockReturnValueOnce([]); // No circle found

    await expect(adapter.getNextNumber('unknown')).rejects.toThrow(
      "Nummernkreis 'unknown' nicht gefunden"
    );
  });

  it('führt fortlaufende Nummerierung korrekt fort', async () => {
    const invoiceCircle: NumberingCircle = {
      id: 'invoices',
      name: 'Rechnungen',
      prefix: 'RE-2025-',
      digits: 4,
      current: 5,
      resetMode: 'yearly',
      lastResetYear: 2025
    };

    mockAll.mockReturnValueOnce([invoiceCircle]);

    const number = await adapter.getNextNumber('invoices');
    
    expect(number).toBe('RE-2025-0006');
    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE numbering_circles'),
      expect.arrayContaining([6, 2025, expect.any(String), 'invoices'])
    );
  });

  it('resettet jährliche Nummernkreise bei Jahreswechsel', async () => {
    const offerCircle: NumberingCircle = {
      id: 'offers',
      name: 'Angebote',
      prefix: 'AN-2025-',
      digits: 4,
      current: 10,
      resetMode: 'yearly',
      lastResetYear: 2024 // Last year
    };

    mockAll.mockReturnValueOnce([offerCircle]);

    const number = await adapter.getNextNumber('offers');
    
    expect(number).toBe('AN-2025-0001'); // Reset to 1
    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE numbering_circles'),
      expect.arrayContaining([1, 2025, expect.any(String), 'offers'])
    );
  });
});