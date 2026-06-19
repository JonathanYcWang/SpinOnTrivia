import "@testing-library/jest-dom/vitest";

const store = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  value: {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, String(value)),
    get length() {
      return store.size;
    },
  },
  configurable: true,
});
