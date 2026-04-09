/// <reference types="@testing-library/jest-dom" />
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import 'fake-indexeddb/auto';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(globalThis.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Node.js 25 ships a built-in `localStorage` that lacks the standard
// Web Storage API methods (getItem, setItem, removeItem, clear).
// Polyfill it so both production code and tests work correctly.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    get length() { return store.size; },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true });
  // Also ensure window.localStorage points to the same polyfill in jsdom
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: storage, writable: true, configurable: true });
  }
}
