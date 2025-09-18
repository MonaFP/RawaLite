import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsAdapter } from '../../src/adapters/SettingsAdapter';
import type { NumberingCircle, Settings } from '../../src/lib/settings';

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
  let mockSettings: Settings;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SettingsAdapter();
    
    // Mock withTx to execute function directly
    mockWithTx.mockImplementation((fn) => fn());
    
    // Mock complete settings object
    mockSettings = {
      companyData: {
        name: 'Test Company',
        street: '',
        postalCode: '',
        city: '',
        kleinunternehmer: false
      },
      designSettings: {
        theme: 'salbeigrün',
        navigationMode: 'sidebar'
      },
      numberingCircles: []
    };
  });

  it('generiert sequentielle Kundennummern', async () => {
    // Mock numbering circle data
    const customerCircle: NumberingCircle = {
      id: 'customers',
      name: 'Kunden',
      prefix: 'K-',
      digits: 4,
      current: 0,
      resetMode: 'never',
      lastResetYear: undefined
    };

    mockSettings.numberingCircles = [customerCircle];
    
    // Mock getSettings to return our mock settings
    vi.spyOn(adapter, 'getSettings').mockResolvedValue(mockSettings);
    vi.spyOn(adapter, 'updateNumberingCircles').mockResolvedValue();

    const number = await adapter.getNextNumber('customers');
    
    expect(number).toBe('K-0001');
  });

  it('generiert jährliche Angebotsnummern', async () => {
    const offerCircle: NumberingCircle = {
      id: 'offers',
      name: 'Angebote',
      prefix: 'AN-',
      digits: 4,
      current: 0,
      resetMode: 'yearly',
      lastResetYear: 2025
    };

    mockSettings.numberingCircles = [offerCircle];
    
    vi.spyOn(adapter, 'getSettings').mockResolvedValue(mockSettings);
    vi.spyOn(adapter, 'updateNumberingCircles').mockResolvedValue();

    const number = await adapter.getNextNumber('offers');
    
    expect(number).toBe('AN-0001');
  });

  it('wirft Fehler bei unbekanntem Nummernkreis', async () => {
    mockSettings.numberingCircles = []; // Empty circles
    
    vi.spyOn(adapter, 'getSettings').mockResolvedValue(mockSettings);

    await expect(adapter.getNextNumber('unknown')).rejects.toThrow(
      "Nummernkreis 'unknown' nicht gefunden"
    );
  });

  it('führt fortlaufende Nummerierung korrekt fort', async () => {
    const invoiceCircle: NumberingCircle = {
      id: 'invoices',
      name: 'Rechnungen',
      prefix: 'RE-',
      digits: 4,
      current: 5,
      resetMode: 'yearly',
      lastResetYear: 2025
    };

    mockSettings.numberingCircles = [invoiceCircle];
    
    vi.spyOn(adapter, 'getSettings').mockResolvedValue(mockSettings);
    vi.spyOn(adapter, 'updateNumberingCircles').mockResolvedValue();

    const number = await adapter.getNextNumber('invoices');
    
    expect(number).toBe('RE-0006');
  });

  it('resettet jährliche Nummernkreise bei Jahreswechsel', async () => {
    const offerCircle: NumberingCircle = {
      id: 'offers',
      name: 'Angebote',
      prefix: 'AN-',
      digits: 4,
      current: 10,
      resetMode: 'yearly',
      lastResetYear: 2024 // Last year
    };

    mockSettings.numberingCircles = [offerCircle];
    
    vi.spyOn(adapter, 'getSettings').mockResolvedValue(mockSettings);
    vi.spyOn(adapter, 'updateNumberingCircles').mockResolvedValue();

    const number = await adapter.getNextNumber('offers');
    
    expect(number).toBe('AN-0001'); // Reset to 1
  });
});