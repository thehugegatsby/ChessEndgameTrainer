/**
 * @fileoverview Playwright Mock Utilities for Component Testing
 * @description Type-safe mocks for Playwright Page API with factory pattern
 *
 * Consensus from Gemini + o3: 9/10 rating - excellent foundation
 * Key: Must maintain sync with Playwright API updates
 */

export interface MockLocator {
  click: jest.MockedFunction<() => Promise<void>>;
  isVisible: jest.MockedFunction<() => Promise<boolean>>;
  getAttribute: jest.MockedFunction<(name: string) => Promise<string | null>>;
  textContent: jest.MockedFunction<() => Promise<string | null>>;
  count: jest.MockedFunction<() => Promise<number>>;
  first: jest.MockedFunction<() => MockLocator>;
  locator: jest.MockedFunction<(selector: string) => MockLocator>;
  all: jest.MockedFunction<() => Promise<MockLocator[]>>;
  waitFor: jest.MockedFunction<(options?: any) => Promise<void>>;
}

export interface MockPage {
  locator: jest.MockedFunction<(selector: string) => MockLocator>;
  evaluate: jest.MockedFunction<(fn: any, ...args: any[]) => Promise<any>>;
  waitForTimeout: jest.MockedFunction<(timeout: number) => Promise<void>>;
  waitForSelector: jest.MockedFunction<
    (selector: string, options?: any) => Promise<MockLocator>
  >;
  waitForFunction: jest.MockedFunction<
    (fn: any, arg?: any, options?: any) => Promise<void>
  >;
  on: jest.MockedFunction<(event: string, handler: any) => void>;
  addInitScript: jest.MockedFunction<(script: any) => Promise<void>>;
  goto: jest.MockedFunction<(url: string, options?: any) => Promise<void>>;
}

export interface MockConsoleMessage {
  type: jest.MockedFunction<() => string>;
  text: jest.MockedFunction<() => string>;
}

/**
 * Factory function for creating mock Locator with overridable defaults
 * Supports method chaining via mockReturnThis()
 */
export const createMockLocator = (
  overrides?: Partial<MockLocator>,
): MockLocator => ({
  click: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockResolvedValue(true),
  getAttribute: jest.fn().mockResolvedValue(null),
  textContent: jest.fn().mockResolvedValue(null),
  count: jest.fn().mockResolvedValue(0),
  first: jest.fn().mockReturnThis(),
  locator: jest.fn().mockReturnThis(),
  all: jest.fn().mockResolvedValue([]),
  waitFor: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

/**
 * Factory function for creating mock Page with sensible defaults
 * Automatically creates a default locator for convenience
 */
export const createMockPage = (overrides?: Partial<MockPage>): MockPage => {
  const defaultLocator = createMockLocator();
  return {
    locator: jest.fn().mockReturnValue(defaultLocator),
    evaluate: jest.fn().mockResolvedValue(undefined),
    waitForTimeout: jest.fn().mockResolvedValue(undefined),
    waitForSelector: jest.fn().mockResolvedValue(defaultLocator),
    waitForFunction: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    addInitScript: jest.fn().mockResolvedValue(undefined),
    goto: jest.fn().mockResolvedValue(undefined),
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
  type: jest.fn().mockReturnValue(type),
  text: jest.fn().mockReturnValue(text),
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
    isVisible: jest.fn().mockResolvedValue(elementState.visible ?? true),
    getAttribute: jest
      .fn()
      .mockImplementation((name: string) =>
        Promise.resolve(elementState.attributes?.[name] ?? null),
      ),
    textContent: jest.fn().mockResolvedValue(elementState.text ?? null),
    count: jest.fn().mockResolvedValue(elementState.count ?? 1),
  });
