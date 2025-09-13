import '@testing-library/jest-dom';

// Mock window.rawalite for tests
Object.defineProperty(window, 'rawalite', {
  value: {
    db: {
      load: vi.fn(() => Promise.resolve(null)),
      save: vi.fn(() => Promise.resolve(true)),
    },
    app: {
      restart: vi.fn(() => Promise.resolve()),
      getVersion: vi.fn(() => Promise.resolve('1.5.5')),
    },
    shell: {
      openExternal: vi.fn(() => Promise.resolve()),
    },
  },
  writable: true,
});

// Mock electron APIs if needed
(global as any).electronAPI = {
  persistenceExecute: vi.fn(),
};
import { vi } from 'vitest';

// Mock window.matchMedia (used by some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock console methods to reduce noise in tests
globalThis.console = {
  ...console,
  // Suppress specific logs that are expected in tests
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};