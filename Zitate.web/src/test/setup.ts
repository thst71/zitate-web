/// <reference types="@testing-library/jest-dom" />
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "fake-indexeddb/auto";

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

Object.defineProperty(globalThis.navigator, "geolocation", {
  value: mockGeolocation,
  writable: true,
});

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// jsdom's File has no text(); the import reads backups with it
if (!("text" in File.prototype)) {
  Object.defineProperty(File.prototype, "text", {
    value(this: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(this);
      });
    },
  });
}
