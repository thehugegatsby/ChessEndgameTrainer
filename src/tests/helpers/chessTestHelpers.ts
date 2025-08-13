/**
 * Test helpers for ChessService testing
 * Provides utilities for creating mock listeners, service instances, and validation
 */

import { vi } from 'vitest';
import {
  type ChessServiceListener,
  type ChessServiceEvent,
} from "@shared/services/ChessService";

/**
 * Creates a mock event listener for ChessService events
 * @returns A Vitest mock function that can track calls and arguments
 *
 * @example
 * ```typescript
 * const mockListener = createMockListener();
 * chessService.subscribe(mockListener);
 * chessService.move({ from: 'e2', to: 'e4' });
 * expect(mockListener).toHaveBeenCalledWith(expect.objectContaining({
 *   type: 'stateUpdate',
 *   source: 'move'
 * }));
 * ```
 */
export /**
 *
 */
const createMockListener = (): ReturnType<typeof vi.fn<[ChessServiceEvent], void>> => {
  return vi.fn();
};

/**
 * Creates multiple mock listeners for testing event distribution
 * @param count Number of listeners to create
 * @returns Array of mock listener functions
 */
export /**
 *
 */
const createMockListeners = (
  count: number,
): ReturnType<typeof vi.fn<[ChessServiceEvent], void>>[] => {
  return Array.from({ length: count }, () => createMockListener());
};

/**
 * Utility to extract the last event emitted to a mock listener
 * @param mockListener The mock listener function
 * @returns The last event that was emitted, or undefined if none
 */
export /**
 *
 */
const getLastEmittedEvent = (
  mockListener: ReturnType<typeof vi.fn<[ChessServiceEvent], void>>,
): ChessServiceEvent | undefined => {
  const calls = mockListener.mock.calls;
  if (calls.length === 0) return undefined;
  return calls[calls.length - 1][0];
};

/**
 * Utility to get all events emitted to a mock listener
 * @param mockListener The mock listener function
 * @returns Array of all emitted events
 */
export /**
 *
 */
const getAllEmittedEvents = (
  mockListener: ReturnType<typeof vi.fn<[ChessServiceEvent], void>>,
): ChessServiceEvent[] => {
  return mockListener.mock.calls.map((call) => call[0]);
};

/**
 * Helper to wait for an event to be emitted (useful for async tests)
 * @param mockListener The mock listener to monitor
 * @param eventType The type of event to wait for
 * @param timeout Maximum time to wait in milliseconds (default: 1000)
 * @returns Promise that resolves with the event when it's emitted
 */
export /**
 *
 */
const waitForEvent = (
  mockListener: ReturnType<typeof vi.fn<[ChessServiceEvent], void>>,
  eventType: ChessServiceEvent["type"],
  timeout = 1000,
): Promise<ChessServiceEvent> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Event '${eventType}' not emitted within ${timeout}ms`));
    }, timeout);

    /**
     *
     */
    const checkForEvent = () => {
      const lastEvent = getLastEmittedEvent(mockListener);
      if (lastEvent && lastEvent.type === eventType) {
        clearTimeout(timeoutId);
        resolve(lastEvent);
      } else {
        // Check again on next tick
        setTimeout(checkForEvent, 10);
      }
    };

    checkForEvent();
  });
};

/**
 * Validates that a state update event has the expected structure
 * @param event The event to validate
 * @returns True if the event is a valid state update
 */
export /**
 *
 */
const isValidStateUpdateEvent = (event: ChessServiceEvent): boolean => {
  if (event.type !== "stateUpdate") return false;

  const payload = event.payload;
  return (
    typeof payload.fen === "string" &&
    typeof payload.pgn === "string" &&
    Array.isArray(payload.moveHistory) &&
    typeof payload.currentMoveIndex === "number" &&
    typeof payload.isGameOver === "boolean" &&
    (payload.gameResult === null || typeof payload.gameResult === "string")
  );
};

/**
 * Validates that an error event has the expected structure
 * @param event The event to validate
 * @returns True if the event is a valid error event
 */
export /**
 *
 */
const isValidErrorEvent = (event: ChessServiceEvent): boolean => {
  if (event.type !== "error") return false;

  const payload = event.payload;
  return payload.error instanceof Error && typeof payload.message === "string";
};

/**
 * Helper to create a simple move object for testing
 * @param from Source square (e.g., 'e2')
 * @param to Target square (e.g., 'e4')
 * @param promotion Optional promotion piece ('q', 'r', 'b', 'n')
 * @returns Move object compatible with ChessService
 */
export /**
 *
 */
const createTestMove = (from: string, to: string, promotion?: string) => {
  const move: any = { from, to };
  if (promotion) {
    move.promotion = promotion;
  }
  return move;
};

/**
 * Normalizes FEN string by removing move counters for comparison
 * Useful when comparing positions where only move counters differ
 * @param fen The FEN string to normalize
 * @returns FEN string without halfmove and fullmove counters
 */
export /**
 *
 */
const normalizeFen = (fen: string): string => {
  const parts = fen.split(" ");
  if (parts.length >= 4) {
    return parts.slice(0, 4).join(" ");
  }
  return fen;
};

/**
 * Assertion helper for Jest tests - checks if two FENs represent the same position
 * @param actual The actual FEN from the test
 * @param expected The expected FEN
 * @param ignoreCounters Whether to ignore halfmove and fullmove counters
 */
export /**
 *
 */
const expectFenToEqual = (
  actual: string,
  expected: string,
  ignoreCounters = true,
): void => {
  if (ignoreCounters) {
    expect(normalizeFen(actual)).toBe(normalizeFen(expected));
  } else {
    expect(actual).toBe(expected);
  }
};
