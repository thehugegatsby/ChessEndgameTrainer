import { act } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Robust helper to flush all async operations in tests
 * Handles the complex interaction between fake timers and promises
 * that can cause flakiness in CI environments
 */
export async function flushAsync(): Promise<void> {
  // Let any pending promises resolve (e.g., from state updates)
  await act(async () => {});

  // Advance timers and let any new promises resolve
  await act(async () => {
    await vi.runAllTimersAsync();
  });

  // One final flush for any promises created by the timers
  await act(async () => {});
}

/**
 * Memory-based Storage implementation for tests
 * Avoids JSDOM localStorage quota limits that cause CI failures
 */
export class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}
