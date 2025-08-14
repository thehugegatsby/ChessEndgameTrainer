/**
 * @fileoverview Playwright Mock Utilities for Component Testing
 * @description Type-safe mocks for Playwright Page API with factory pattern
 *
 * Consensus from Gemini + o3: 9/10 rating - excellent foundation
 * Key: Must maintain sync with Playwright API updates
 */

export interface MockLocator {
  click: () => Promise<void>;
  isVisible: () => Promise<boolean>;
  getAttribute: (name: string) => Promise<string | null>;
  textContent: () => Promise<string | null>;
  count: () => Promise<number>;
  first: () => MockLocator;
  locator: (selector: string) => MockLocator;
  all: () => Promise<MockLocator[]>;
  waitFor: (options?: any) => Promise<void>;
}

export interface MockPage {
  locator: (selector: string) => MockLocator;
  evaluate: (fn: any, ...args: any[]) => Promise<any>;
  waitForTimeout: (timeout: number) => Promise<void>;
  waitForSelector: (selector: string, options?: any) => Promise<MockLocator>;
  waitForFunction: (fn: any, arg?: any, options?: any) => Promise<void>;
  on: (event: string, handler: any) => void;
  addInitScript: (script: any) => Promise<void>;
  goto: (url: string, options?: any) => Promise<void>;
}

export interface MockConsoleMessage {
  type: () => string;
  text: () => string;
}

/**
 * Factory function for creating mock Locator with overridable defaults
 * Supports method chaining via mockReturnThis()
 */
export const createMockLocator = (
  overrides?: Partial<MockLocator>,
): MockLocator => ({
  click: vi.fn().mockResolvedValue(undefined),
  isVisible: vi.fn().mockResolvedValue(true),
  getAttribute: vi.fn().mockResolvedValue(null),
  textContent: vi.fn().mockResolvedValue(null),
  count: vi.fn().mockResolvedValue(0),
  first: vi.fn().mockReturnThis(),
  locator: vi.fn().mockReturnThis(),
  all: vi.fn().mockResolvedValue([]),
  waitFor: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

/**
 * Factory function for creating mock Page with sensible defaults
 * Automatically creates a default locator for convenience
 */
export const createMockPage = (overrides?: Partial<MockPage>): MockPage => {
  const defaultLocator = createMockLocator();
  return {
    locator: vi.fn().mockReturnValue(defaultLocator),
    evaluate: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(defaultLocator),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    addInitScript: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

/**
 * Factory for console message mocks (used by TestBridgeWrapper)
 */
export const createMockConsoleMessage = (
  type: string = "log",
  text: string = "",
): MockConsoleMessage => ({
  type: vi.fn().mockReturnValue(type),
  text: vi.fn().mockReturnValue(text),
});

// Type exports matching Playwright's actual types
export type Page = MockPage;
export type Locator = MockLocator;
export type ConsoleMessage = MockConsoleMessage;

// Helper to create a mock with specific element state
export const createMockLocatorWithElement = (
  elementState: {
    visible?: boolean;
    attributes?: Record<string, string>;
    text?: string;
    count?: number;
  } = {},
): MockLocator =>
  createMockLocator({
    isVisible: vi.fn().mockResolvedValue(elementState.visible ?? true),
    getAttribute: vi.fn()
      .fn()
      .mockImplementation((name: string) =>
        Promise.resolve(elementState.attributes?.[name] ?? null),
      ),
    textContent: vi.fn().mockResolvedValue(elementState.text ?? null),
    count: vi.fn().mockResolvedValue(elementState.count ?? 1),
  });
