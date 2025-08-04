/**
 * Mock helper for useTrainingState Zustand store
 * Provides utilities for mocking the training state in tests
 *
 * @example
 * ```typescript
 * import { mockUseTrainingState } from '@/tests/helpers/mockUseTrainingState';
 *
 * // In your test
 * mockUseTrainingState({
 *   isPlayerTurn: true,
 *   hintsUsed: 2,
 *   currentPosition: mockEndgamePosition
 * });
 * ```
 */

import { useTrainingState } from "@shared/store";
import type { TrainingPosition } from "@shared/store/slices/trainingSlice";

// Mock the store module
jest.mock("@shared/store", () => ({
  ...jest.requireActual("@shared/store"),
  useTrainingState: jest.fn(),
}));

/**
 * Type for partial training state overrides
 */
type MockTrainingState = Partial<ReturnType<typeof useTrainingState>>;

/**
 * Creates a mock implementation of the useTrainingState hook
 *
 * @param overrides - Partial state to override defaults
 * @returns The mocked useTrainingState function for additional assertions
 *
 * @example
 * ```typescript
 * const mock = mockUseTrainingState({
 *   isPlayerTurn: false,
 *   hintsUsed: 1,
 *   mistakeCount: 2
 * });
 *
 * // Component will see these values
 * const Component = () => {
 *   const training = useTrainingState();
 *   console.log(training.isPlayerTurn); // false
 * };
 * ```
 */
export /**
 *
 */
const mockUseTrainingState = (overrides: MockTrainingState = {}) => {
  // Define sensible defaults that match the actual store
  const defaultState = {
    // Training state
    currentPosition: undefined as TrainingPosition | undefined,
    nextPosition: undefined as TrainingPosition | null | undefined,
    previousPosition: undefined as TrainingPosition | null | undefined,
    isLoadingNavigation: false,
    navigationError: null as string | null,
    chapterProgress: null as { completed: number; total: number } | null,
    isPlayerTurn: true,
    isSuccess: false,
    sessionStartTime: undefined as number | undefined,
    sessionEndTime: undefined as number | undefined,
    hintsUsed: 0,
    mistakeCount: 0,
    moveErrorDialog: null as {
      isOpen: boolean;
      wdlBefore?: number;
      wdlAfter?: number;
      bestMove?: string;
    } | null,

    // Training actions (mock functions)
    setPosition: jest.fn(),
    setNavigationPositions: jest.fn(),
    setNavigationLoading: jest.fn(),
    setNavigationError: jest.fn(),
    setChapterProgress: jest.fn(),
    setPlayerTurn: jest.fn(),
    completeTraining: jest.fn(),
    useHint: jest.fn(),
    incrementMistake: jest.fn(),
    setMoveErrorDialog: jest.fn(),
    addTrainingMove: jest.fn(),
    resetTraining: jest.fn(),
    resetPosition: jest.fn(),
  };

  // Merge defaults with overrides
  const mockState = { ...defaultState, ...overrides };

  // Configure the mock to return our state
  (
    useTrainingState as jest.MockedFunction<typeof useTrainingState>
  ).mockReturnValue(mockState);

  // Return the mock for additional assertions if needed
  return useTrainingState as jest.MockedFunction<typeof useTrainingState>;
};

/**
 * Resets the useTrainingState mock
 * Call this in afterEach hooks to ensure test isolation
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   resetUseTrainingStateMock();
 * });
 * ```
 */
export /**
 *
 */
const resetUseTrainingStateMock = () => {
  (useTrainingState as jest.Mock).mockClear();
};

/**
 * Helper to verify mock calls
 *
 * @param mock - The mocked function
 * @param expectedCalls - Expected number of calls
 *
 * @example
 * ```typescript
 * const mock = mockUseTrainingState();
 * // ... test code that uses the hook ...
 * verifyUseTrainingStateCalls(mock, 1);
 * ```
 */
export /**
 *
 */
const verifyUseTrainingStateCalls = (
  mock: jest.MockedFunction<typeof useTrainingState>,
  expectedCalls: number,
) => {
  expect(mock).toHaveBeenCalledTimes(expectedCalls);
};

/**
 * Creates a mock TrainingPosition for testing
 *
 * @param overrides - Partial position to override defaults
 * @returns Complete TrainingPosition object
 *
 * @example
 * ```typescript
 * const position = createMockTrainingPosition({
 *   id: 1,
 *   title: "Test Position",
 *   colorToTrain: "white"
 * });
 * ```
 */
export /**
 *
 */
const createMockTrainingPosition = (
  overrides: Partial<TrainingPosition> = {},
): TrainingPosition => {
  return {
    id: 1,
    title: "King and Rook vs King",
    description: "Basic checkmate pattern",
    fen: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
    category: "basic-checkmates",
    difficulty: "beginner",
    targetMoves: 10,
    hints: ["Use your rook to cut off the enemy king"],
    solution: ["Ra8#"],
    nextPositionId: 2,
    sideToMove: "white",
    goal: "win",
    colorToTrain: "white",
    targetOutcome: "1-0",
    timeLimit: undefined,
    chapterId: undefined,
    ...overrides,
  };
};
