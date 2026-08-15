import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB
class IDBRequestMock extends EventTarget {
  result: any = null;
  error: any = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

class IDBOpenDBRequestMock extends IDBRequestMock {
  onupgradeneeded: (() => void) | null = null;
  onblocked: (() => void) | null = null;
}

const indexedDBMock = {
  open: vi.fn().mockImplementation(() => new IDBOpenDBRequestMock()),
  deleteDatabase: vi.fn().mockImplementation(() => new IDBRequestMock()),
};

global.indexedDB = indexedDBMock as unknown as IDBFactory;

// Mock window.matchMedia for theme tests
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
