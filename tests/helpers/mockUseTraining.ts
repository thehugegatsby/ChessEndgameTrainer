/**
 * Mock helper for useTraining Zustand store
 * @example
 * mockUseTraining({ analysisStatus: 'success' });
 * mockUseTraining({ analysisStatus: 'error' });
 */

import { useTraining } from "@shared/store/store";

// Mock the store module
jest.mock("@shared/store/store");

// Type for partial training state overrides
/**
 *
 */
type MockTrainingState = Partial<ReturnType<typeof useTraining>>;

/**
 * Creates a mock implementation of the useTraining hook
 * @param overrides - Partial state to override defaults
 * @returns The mocked useTraining function for additional assertions
 */
export /**
 *
 */
const mockUseTraining = (overrides: MockTrainingState = {}) => {
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
  (useTraining as jest.MockedFunction<typeof useTraining>).mockReturnValue(
    mockState as any,
  );

  // Return the mock for additional assertions if needed
  return useTraining as jest.MockedFunction<typeof useTraining>;
};

/**
 * Resets the useTraining mock
 * Call this in afterEach hooks to ensure test isolation
 */
export /**
 *
 */
const resetUseTrainingMock = () => {
  (useTraining as jest.Mock).mockClear();
};

/**
 * Helper to verify mock calls
 * @param mock
 * @param expectedCalls
 * @example
 * const mock = mockUseTraining();
 * // ... test code ...
 * verifyUseTrainingCalls(mock, 1);
 */
export /**
 *
 */
const verifyUseTrainingCalls = (
  mock: jest.MockedFunction<typeof useTraining>,
  expectedCalls: number,
) => {
  expect(mock).toHaveBeenCalledTimes(expectedCalls);
};
