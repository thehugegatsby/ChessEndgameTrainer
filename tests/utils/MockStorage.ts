/**
 * MockStorage Implementation
 * Jest-compatible mock that implements Storage interface with realistic behavior
 */

export class MockStorage implements Storage {
  private store: Record<string, string> = {};

  // Public Jest mocks for spying
  public getItem = jest.fn((key: string): string | null => {
    return this.store[key] || null;
  });

  public setItem = jest.fn((key: string, value: string): void => {
    this.store[key] = String(value); // Ensure value is a string, like in real localStorage
  });

  public removeItem = jest.fn((key: string): void => {
    delete this.store[key];
  });

  public clear = jest.fn((): void => {
    this.store = {};
  });

  public get length(): number {
    return Object.keys(this.store).length;
  }

  public key = jest.fn((index: number): string | null => {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  });

  // Helper to pre-populate storage for tests
  public seed(data: Record<string, string>) {
    this.store = { ...data };
    // Reset call counts when seeding
    this.getItem.mockClear();
    this.setItem.mockClear();
    this.removeItem.mockClear();
    this.clear.mockClear();
    this.key.mockClear();
  }

  // Helper to get current store state (for debugging)
  public getStore(): Record<string, string> {
    return { ...this.store };
  }

  // Helper to check if key exists
  public hasKey(key: string): boolean {
    return key in this.store;
  }
}