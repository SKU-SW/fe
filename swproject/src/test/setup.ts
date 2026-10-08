/** @file Deterministic in-memory browser storage for store and hook tests. */
import { vi } from 'vitest';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(String(key)) ?? null,
    setItem: (key, value) => { values.set(String(key), String(value)); },
    removeItem: key => { values.delete(String(key)); },
    clear: () => { values.clear(); },
  };
}

// Node 25 also exposes Web Storage; do not depend on its process-level backing file.
vi.stubGlobal('localStorage', createStorage());
vi.stubGlobal('sessionStorage', createStorage());
