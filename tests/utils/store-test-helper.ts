/**
 * @file Test utilities for store testing
 * @module tests/utils/store-test-helper
 * @description Provides utilities for creating test stores and common test setups
 */

import { createStore as createZustandStore } from "zustand/vanilla";
import type { RootState } from "@shared/store/slices/types";
import type { StateCreator } from "zustand";

/**
 * Creates a test store with a single slice for isolated testing
 *
 * @template T - The slice type
 * @param createSlice - The slice creator function
 * @param [initialState] - Optional initial state override
 * @returns Store instance with getState and setState methods
 *
 * @example
 * ```typescript
 * // Testing a single slice in isolation
 * const store = createTestStore(createUISlice);
 *
 * // With initial state
 * const store = createTestStore(createUISlice, {
 *   isSidebarOpen: false,
 *   toasts: [{ id: '1', message: 'Test', type: 'info' }]
 * });
 * ```
 */
export function createTestStore<T>(
  createSlice: StateCreator<T, [], [], T>,
  initialState?: Partial<T>,
) {
  const store = createZustandStore<T>()((set, get, api) => {
    const slice = createSlice(set, get, api);
    return {
      ...slice,
      ...initialState,
    };
  });

  return store;
}

/**
 * Creates a combined test store with multiple slices
 *
 * @param sliceCreators - Object mapping slice names to their creators
 * @param [initialState] - Optional initial state override
 * @returns Store instance with combined state
 *
 * @example
 * ```typescript
 * const store = createCombinedTestStore({
 *   ui: createUISlice,
 *   game: createGameSlice,
 * });
 *
 * // With initial state
 * const store = createCombinedTestStore(
 *   { ui: createUISlice, game: createGameSlice },
 *   { ui: { isSidebarOpen: false } }
 * );
 * ```
 */
export function createCombinedTestStore(
  sliceCreators: Record<string, StateCreator<any, [], [], any>>,
  initialState?: Partial<RootState>,
) {
  const store = createZustandStore<RootState>()((set, get, api) => {
    const slices = Object.entries(sliceCreators).reduce(
      (acc, [_name, createSlice]) => {
        return {
          ...acc,
          ...createSlice(set, get, api),
        };
      },
      {} as RootState,
    );

    return {
      ...slices,
      ...initialState,
    };
  });

  return store;
}

/**
 * Test helper to wait for async state updates
 *
 * @param callback - Function that returns true when condition is met
 * @param [timeout=5000] - Maximum time to wait in milliseconds
 * @returns Resolves when condition is met or rejects on timeout
 *
 * @example
 * ```typescript
 * await waitForState(() => store.getState().loading === false);
 * ```
 */
export async function waitForState(
  callback: () => boolean,
  timeout = 5000,
): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    /**
     *
     */
    const check = () => {
      if (callback()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(
          new Error(`Timeout waiting for state condition after ${timeout}ms`),
        );
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
}

/**
 * Creates a mock store API for testing orchestrators
 *
 * @param [initialState] - Initial state
 * @returns Mock store API with getState and setState
 *
 * @example
 * ```typescript
 * const api = createMockStoreApi({
 *   game: { currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }
 * });
 *
 * await makeUserMove(api, 'e4');
 * ```
 */
export function createMockStoreApi(initialState: Partial<RootState> = {}) {
  let state = initialState as RootState;

  return {
    /**
     *
     */
    getState: () => state,
    /**
     *
     * @param newState
     */
    setState: (newState: Partial<RootState>) => {
      state = { ...state, ...newState };
    },
  };
}

/**
 * Test fixture for common chess positions
 *
 * @example
 * ```typescript
 * const { startingPosition, endgameKRK } = chessPositions;
 * ```
 */
import { StandardPositions, EndgamePositions } from "../fixtures/fenPositions";

export /**
 *
 */
const chessPositions = {
  startingPosition: StandardPositions.STARTING,
  endgameKRK: EndgamePositions.KRK_WIN,
  endgameKQK: EndgamePositions.KQK_WIN_ALT,
  endgameKPK: EndgamePositions.KPK_VARIANTS.ENDGAME_PAWN,
  drawPosition: EndgamePositions.KK_DRAW_ALT,
} as const;

/**
 * Mock timer utilities for testing time-based features
 */
export /**
 *
 */
const mockTimers = {
  /**
   * Sets up fake timers for testing
   * @example
   * ```typescript
   * beforeEach(() => {
   *   mockTimers.setup();
   * });
   * ```
   */
  setup: () => {
    jest.useFakeTimers();
  },

  /**
   * Cleans up fake timers
   * @example
   * ```typescript
   * afterEach(() => {
   *   mockTimers.cleanup();
   * });
   * ```
   */
  cleanup: () => {
    jest.useRealTimers();
  },

  /**
   * Advances timers by specified time
   * @param ms - Milliseconds to advance
   */
  advance: (ms: number) => {
    jest.advanceTimersByTime(ms);
  },

  /**
   * Runs all pending timers
   */
  runAll: () => {
    jest.runAllTimers();
  },
};
