/**
 * Mock helper for rootStore Zustand store
 * Provides utilities for mocking the new refactored store in tests
 *
 * @example
 * ```typescript
 * import { mockRootStore } from '@/tests/helpers/mockRootStore';
 *
 * // In your test
 * mockRootStore({
 *   game: { analysisStatus: 'loading' },
 *   training: { isPlayerTurn: true }
 * });
 * ```
 */

import { useStore } from "@shared/store/rootStore";
import type { RootState } from "@shared/store/slices/types";

// Mock the store module
jest.mock("@shared/store/rootStore");

/**
 * Type for partial root state overrides with nested structure
 */
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

type MockRootState = DeepPartial<RootState>;

/**
 * Creates a mock implementation of the useStore hook
 *
 * @param overrides - Partial state to override defaults
 * @returns The mocked useStore function for additional assertions
 *
 * @example
 * ```typescript
 * const mock = mockRootStore({
 *   tablebase: { analysisStatus: 'error' },
 *   ui: { currentModal: 'settings' }
 * });
 *
 * // Component will see these values
 * const Component = () => {
 *   const state = useStore();
 *   console.log(state.tablebase.analysisStatus); // 'error'
 * };
 * ```
 */
export const mockRootStore = (overrides: MockRootState = {}) => {
  // Define sensible defaults that match the actual store with nested structure
  const defaultState = {
    // Game slice
    game: {
      currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      currentPgn: "",
      moveHistory: [],
      currentMoveIndex: -1,
      isGameFinished: false,
      gameResult: null,
      isCheckmate: false,
      isDraw: false,
      isStalemate: false,
      // Game actions
      updatePosition: jest.fn(),
      addMove: jest.fn(),
      setMoveHistory: jest.fn(),
      setCurrentMoveIndex: jest.fn(),
      setGameFinished: jest.fn(),
      setGameStatus: jest.fn(),
      resetGame: jest.fn(),
      initializeGame: jest.fn(),
      makeMove: jest.fn(),
      undoMove: jest.fn(),
      redoMove: jest.fn(),
      goToMove: jest.fn(),
      goToFirst: jest.fn(),
      goToPrevious: jest.fn(),
      goToNext: jest.fn(),
      goToLast: jest.fn(),
      setCurrentFen: jest.fn(),
    },

    // Training slice
    training: {
      currentPosition: undefined,
      nextPosition: undefined,
      previousPosition: undefined,
      isLoadingNavigation: false,
      navigationError: null,
      chapterProgress: null,
      isPlayerTurn: true,
      isOpponentThinking: false,
      isSuccess: false,
      sessionStartTime: undefined,
      sessionEndTime: undefined,
      hintsUsed: 0,
      mistakeCount: 0,
      moveErrorDialog: null,
      moveSuccessDialog: null,
      evaluationBaseline: null,
      // Training actions
      setPosition: jest.fn(),
      setNavigationPositions: jest.fn(),
      setNavigationLoading: jest.fn(),
      setNavigationError: jest.fn(),
      setChapterProgress: jest.fn(),
      setPlayerTurn: jest.fn(),
      clearOpponentThinking: jest.fn(),
      completeTraining: jest.fn(),
      incrementHint: jest.fn(),
      incrementMistake: jest.fn(),
      setMoveErrorDialog: jest.fn(),
      setMoveSuccessDialog: jest.fn(),
      addTrainingMove: jest.fn(),
      resetTraining: jest.fn(),
      resetPosition: jest.fn(),
      setEvaluationBaseline: jest.fn(),
      clearEvaluationBaseline: jest.fn(),
    },

    // Tablebase slice
    tablebase: {
      tablebaseMove: undefined,
      analysisStatus: "idle" as const,
      evaluations: [],
      currentEvaluation: undefined,
      // Tablebase actions
      setTablebaseMove: jest.fn(),
      setAnalysisStatus: jest.fn(),
      addEvaluation: jest.fn(),
      setEvaluations: jest.fn(),
      setCurrentEvaluation: jest.fn(),
      clearTablebaseState: jest.fn(),
    },

    // Progress slice
    progress: {
      userStats: null,
      sessionProgress: {
        positionsCompleted: 0,
        positionsCorrect: 0,
        positionsAttempted: 0,
        timeSpent: 0,
        hintsUsed: 0,
        mistakesMade: 0,
      },
      cardProgress: {},
      loading: false,
      syncStatus: "idle" as const,
      lastSync: null,
      syncError: null,
      // Progress actions
      setUserStats: jest.fn(),
      updateSessionProgress: jest.fn(),
      setLoading: jest.fn(),
      setSyncStatus: jest.fn(),
      setLastSync: jest.fn(),
      setSyncError: jest.fn(),
      initializeCards: jest.fn(),
      recordAttempt: jest.fn(),
      resetCardProgress: jest.fn(),
      setCardProgress: jest.fn(),
      batchUpdateProgress: jest.fn(),
      loadUserProgress: jest.fn(),
      saveUserStats: jest.fn(),
      saveCardProgress: jest.fn(),
      saveSessionComplete: jest.fn(),
      getDueCards: jest.fn(),
      syncAllProgress: jest.fn(),
      resetProgress: jest.fn(),
    },

    // UI slice
    ui: {
      isSidebarOpen: true,
      currentModal: null,
      toasts: [],
      loading: {
        global: false,
        tablebase: false,
        position: false,
        analysis: false,
      },
      analysisPanel: {
        isOpen: false,
        position: "right" as const,
        showEvaluation: true,
        showBestMove: true,
        showDepth: false,
        showThinkingTime: false,
      },
      // UI actions
      toggleSidebar: jest.fn(),
      setIsSidebarOpen: jest.fn(),
      openModal: jest.fn(),
      closeModal: jest.fn(),
      showToast: jest.fn(),
      removeToast: jest.fn(),
      setLoading: jest.fn(),
      updateAnalysisPanel: jest.fn(),
    },

    // Orchestrator actions
    handlePlayerMove: jest.fn(),
    loadTrainingContext: jest.fn(),

    // Utility actions
    reset: jest.fn(),
    hydrate: jest.fn(),
  };

  // Deep merge defaults with overrides
  const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !jest.isMockFunction(source[key])) {
        result[key] = deepMerge(
          (target[key] as Record<string, unknown>) || {}, 
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }
    return result;
  };

  const mockState = deepMerge(defaultState, overrides as Record<string, unknown>) as unknown as RootState;

  // Configure the mock to return our state
  (useStore as jest.MockedFunction<typeof useStore>).mockReturnValue(mockState);

  // Also mock the selector pattern
  (useStore as jest.MockedFunction<typeof useStore>).mockImplementation((selector?: (state: RootState) => unknown) => {
    if (typeof selector === "function") {
      return selector(mockState);
    }
    return mockState;
  });

  // CRITICAL: Mock getState() method which is used by useGameActions()
  (useStore as jest.MockedFunction<typeof useStore> & { getState: jest.Mock }).getState = jest.fn().mockReturnValue(mockState);

  // Return the mock for additional assertions if needed
  return useStore as jest.MockedFunction<typeof useStore>;
};

/**
 * Creates a mock implementation that works with selectors
 *
 * @param overrides - Partial state to override defaults
 * @returns The mocked useStore function
 *
 * @example
 * ```typescript
 * mockRootStoreWithSelector({
 *   tablebase: { analysisStatus: 'loading' }
 * });
 *
 * // Now selectors work:
 * const status = useStore((state) => state.tablebase.analysisStatus); // 'loading'
 * ```
 */
export const mockRootStoreWithSelector = (overrides: MockRootState = {}) => {
  const mock = mockRootStore(overrides);

  // Ensure selector pattern works
  mock.setState = jest.fn();
  mock.getState = jest.fn(() => {
    const state = mock();
    // Deep merge the state with overrides
    const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
      const result = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !jest.isMockFunction(source[key])) {
          result[key] = deepMerge(
            (target[key] as Record<string, unknown>) || {}, 
            source[key] as Record<string, unknown>
          );
        } else {
          result[key] = source[key];
        }
      }
      return result;
    };
    return deepMerge(state as unknown as Record<string, unknown>, overrides as unknown as Record<string, unknown>) as unknown as RootState;
  });

  return mock;
};

/**
 * Resets the useStore mock
 * Call this in afterEach hooks to ensure test isolation
 */
export const resetRootStoreMock = () => {
  (useStore as jest.MockedFunction<typeof useStore>).mockClear();
};

/**
 * Helper to verify mock calls
 *
 * @param mock - The mocked function
 * @param expectedCalls - Expected number of calls
 */
export const verifyRootStoreCalls = (
  mock: jest.MockedFunction<typeof useStore>,
  expectedCalls: number,
) => {
  expect(mock).toHaveBeenCalledTimes(expectedCalls);
};