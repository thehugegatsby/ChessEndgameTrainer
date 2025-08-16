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

import { useStore } from '@shared/store/rootStore';
import type { RootState } from '@shared/store/slices/types';

// Mock the store module
vi.mock('@shared/store/rootStore');

/**
 * Type for partial root state overrides with nested structure
 */
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

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
      currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      currentPgn: '',
      moveHistory: [],
      currentMoveIndex: -1,
      isGameFinished: false,
      gameResult: null,
      isCheckmate: false,
      isDraw: false,
      isStalemate: false,
      // Game actions
      updatePosition: vi.fn(),
      addMove: vi.fn(),
      setMoveHistory: vi.fn(),
      setCurrentMoveIndex: vi.fn(),
      setGameFinished: vi.fn(),
      setGameStatus: vi.fn(),
      resetGame: vi.fn(),
      initializeGame: vi.fn(),
      makeMove: vi.fn(),
      undoMove: vi.fn(),
      redoMove: vi.fn(),
      goToMove: vi.fn(),
      goToFirst: vi.fn(),
      goToPrevious: vi.fn(),
      goToNext: vi.fn(),
      goToLast: vi.fn(),
      setCurrentFen: vi.fn(),
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
      hintsUsed: 0,
      mistakeCount: 0,
      moveErrorDialog: null,
      moveSuccessDialog: null,
      evaluationBaseline: null,
      // Training actions
      setPosition: vi.fn(),
      setNavigationPositions: vi.fn(),
      setNavigationLoading: vi.fn(),
      setNavigationError: vi.fn(),
      setChapterProgress: vi.fn(),
      setPlayerTurn: vi.fn(),
      clearOpponentThinking: vi.fn(),
      completeTraining: vi.fn(),
      incrementHint: vi.fn(),
      incrementMistake: vi.fn(),
      setMoveErrorDialog: vi.fn(),
      setMoveSuccessDialog: vi.fn(),
      addTrainingMove: vi.fn(),
      resetTraining: vi.fn(),
      resetPosition: vi.fn(),
      setEvaluationBaseline: vi.fn(),
      clearEvaluationBaseline: vi.fn(),
    },

    // Tablebase slice
    tablebase: {
      tablebaseMove: undefined,
      analysisStatus: 'idle' as const,
      evaluations: [],
      currentEvaluation: undefined,
      // Tablebase actions
      setTablebaseMove: vi.fn(),
      setAnalysisStatus: vi.fn(),
      addEvaluation: vi.fn(),
      setEvaluations: vi.fn(),
      setCurrentEvaluation: vi.fn(),
      clearTablebaseState: vi.fn(),
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
      syncStatus: 'idle' as const,
      lastSync: null,
      syncError: null,
      // Progress actions
      setUserStats: vi.fn(),
      updateSessionProgress: vi.fn(),
      setLoading: vi.fn(),
      setSyncStatus: vi.fn(),
      setLastSync: vi.fn(),
      setSyncError: vi.fn(),
      initializeCards: vi.fn(),
      recordAttempt: vi.fn(),
      resetCardProgress: vi.fn(),
      setCardProgress: vi.fn(),
      batchUpdateProgress: vi.fn(),
      loadUserProgress: vi.fn(),
      saveUserStats: vi.fn(),
      saveCardProgress: vi.fn(),
      saveSessionComplete: vi.fn(),
      getDueCards: vi.fn(),
      syncAllProgress: vi.fn(),
      resetProgress: vi.fn(),
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
        position: 'right' as const,
        showEvaluation: true,
        showBestMove: true,
        showDepth: false,
        showThinkingTime: false,
      },
      // UI actions
      toggleSidebar: vi.fn(),
      setIsSidebarOpen: vi.fn(),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      showToast: vi.fn(),
      removeToast: vi.fn(),
      setLoading: vi.fn(),
      updateAnalysisPanel: vi.fn(),
    },

    // Orchestrator actions
    handlePlayerMove: vi.fn(),
    loadTrainingContext: vi.fn(),

    // Utility actions
    reset: vi.fn(),
    hydrate: vi.fn(),
  };

  // Deep merge defaults with overrides
  const deepMerge = (
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> => {
    const result = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        !vi.isMockFunction(source[key])
      ) {
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

  const mockState = deepMerge(
    defaultState,
    overrides as Record<string, unknown>
  ) as unknown as RootState;

  // Configure the mock to return our state
  (useStore as any).mockReturnValue(mockState);

  // Also mock the selector pattern
  (useStore as any).mockImplementation((selector?: (state: RootState) => unknown) => {
    if (typeof selector === 'function') {
      return selector(mockState);
    }
    return mockState;
  });

  // CRITICAL: Mock getState() method which is used by useGameActions()
  (useStore as any).getState = vi.fn().mockReturnValue(mockState);

  // Return the mock for additional assertions if needed
  return useStore as any;
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
  mock.setState = vi.fn();
  mock.getState = vi.fn(() => {
    const state = mock();
    // Deep merge the state with overrides
    const deepMerge = (
      target: Record<string, unknown>,
      source: Record<string, unknown>
    ): Record<string, unknown> => {
      const result = { ...target };
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key]) &&
          !vi.isMockFunction(source[key])
        ) {
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
    return deepMerge(
      state as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>
    ) as unknown as RootState;
  });

  return mock;
};

/**
 * Resets the useStore mock
 * Call this in afterEach hooks to ensure test isolation
 */
export const resetRootStoreMock = () => {
  (useStore as any).mockClear();
};

/**
 * Helper to verify mock calls
 *
 * @param mock - The mocked function
 * @param expectedCalls - Expected number of calls
 */
export const verifyRootStoreCalls = (mock: any, expectedCalls: number) => {
  expect(mock).toHaveBeenCalledTimes(expectedCalls);
};
