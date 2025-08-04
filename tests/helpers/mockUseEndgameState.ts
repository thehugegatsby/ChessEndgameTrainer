/**
 * Mock helper for useEndgameState Zustand store
 * @example
 * mockUseEndgameState({ analysisStatus: 'success' });
 * mockUseEndgameState({ analysisStatus: 'error' });
 */

import { useEndgameState } from "@shared/store/store";

// Mock the store module
jest.mock("@shared/store/store");

// Type for partial training state overrides
/**
 *
 */
type MockEndgameState = Partial<ReturnType<typeof useEndgameState>>;

/**
 * Creates a mock implementation of the useEndgameState hook
 * @param overrides - Partial state to override defaults
 * @returns The mocked useEndgameState function for additional assertions
 */
export /**
 *
 */
const mockUseEndgameState = (overrides: MockEndgameState = {}) => {
  // Define sensible defaults that match the actual store
  const defaultState = {
    // Analysis related
    analysisStatus: "idle" as const,
    tablebaseError: null,

    // Game state
    fen: "8/8/8/8/8/8/8/8 w - - 0 1",
    turn: "w" as const,
    moveHistory: [],
    isGameOver: false,
    gameResult: null,

    // Training state
    currentTrainingId: null,
    trainingMode: "practice" as const,
    hintsUsed: 0,

    // Actions (mock functions)
    initializeTablebase: jest.fn(),
    shutdownTablebase: jest.fn(),
    makeMove: jest.fn(),
    resetGame: jest.fn(),
    setTrainingMode: jest.fn(),
    loadPosition: jest.fn(),

    // Add any other properties from the actual store
  };

  // Merge defaults with overrides
  const mockState = { ...defaultState, ...overrides };

  // Configure the mock to return our state
  (
    useEndgameState as jest.MockedFunction<typeof useEndgameState>
  ).mockReturnValue(mockState as any);

  // Return the mock for additional assertions if needed
  return useEndgameState as jest.MockedFunction<typeof useEndgameState>;
};

/**
 * Resets the useEndgameState mock
 * Call this in afterEach hooks to ensure test isolation
 */
export /**
 *
 */
const resetUseEndgameStateMock = () => {
  (useEndgameState as jest.Mock).mockClear();
};

/**
 * Helper to verify mock calls
 * @param mock
 * @param expectedCalls
 * @example
 * const mock = mockUseEndgameState();
 * // ... test code ...
 * verifyUseEndgameStateCalls(mock, 1);
 */
export /**
 *
 */
const verifyUseEndgameStateCalls = (
  mock: jest.MockedFunction<typeof useEndgameState>,
  expectedCalls: number,
) => {
  expect(mock).toHaveBeenCalledTimes(expectedCalls);
};
