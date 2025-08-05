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
 *   analysisStatus: 'loading',
 *   isPlayerTurn: true
 * });
 * ```
 */

import { useStore } from "@shared/store/rootStore";
import type { RootState } from "@shared/store/slices/types";

// Mock the store module
jest.mock("@shared/store/rootStore");

/**
 * Type for partial root state overrides
 */
type MockRootState = Partial<RootState>;

/**
 * Creates a mock implementation of the useStore hook
 *
 * @param overrides - Partial state to override defaults
 * @returns The mocked useStore function for additional assertions
 *
 * @example
 * ```typescript
 * const mock = mockRootStore({
 *   analysisStatus: 'error',
 *   currentModal: 'settings'
 * });
 *
 * // Component will see these values
 * const Component = () => {
 *   const state = useStore();
 *   console.log(state.analysisStatus); // 'error'
 * };
 * ```
 */
export /**
 *
 */
const mockRootStore = (overrides: MockRootState = {}) => {
  // Define sensible defaults that match the actual store
  const defaultState: RootState = {
    // User state
    id: undefined,
    username: undefined,
    email: undefined,
    rating: 1200,
    completedPositions: [],
    currentStreak: 0,
    bestStreak: 0,
    totalTrainingTime: 0,
    lastActiveDate: new Date().toISOString(),
    preferences: {
      theme: "dark",
      soundEnabled: true,
      notificationsEnabled: true,
      boardOrientation: "white",
      pieceTheme: "standard",
      autoPromoteToQueen: true,
      showCoordinates: true,
      showLegalMoves: true,
      animationSpeed: "normal",
    },

    // Game state
    game: null,
    currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moveHistory: [],
    currentMoveIndex: -1,
    isGameOver: false,
    gameResult: null,

    // Tablebase state
    tablebaseMove: undefined,
    analysisStatus: "idle",
    evaluations: [],
    currentEvaluation: undefined,
    lastEvaluatedFen: undefined,

    // Training state
    currentPosition: undefined,
    nextPosition: undefined,
    previousPosition: undefined,
    isLoadingNavigation: false,
    navigationError: null,
    chapterProgress: null,
    isPlayerTurn: true,
    isSuccess: false,
    sessionStartTime: undefined,
    sessionEndTime: undefined,
    hintsUsed: 0,
    mistakeCount: 0,

    // Progress state
    positionProgress: {},
    dailyStats: {},
    achievements: [],
    favoritePositions: [],
    totalPoints: 0,
    level: 1,

    // UI state
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
      position: "right",
      showEvaluation: true,
      showBestMove: true,
      showDepth: false,
      showThinkingTime: false,
    },
    moveErrorDialog: null,

    // Settings state
    theme: {
      mode: "light",
      customColors: {},
    },
    notifications: {
      enabled: true,
      moves: true,
      analysis: true,
      achievements: true,
      reminders: false,
    },
    difficulty: {
      level: "intermediate",
      showHints: true,
      allowTakebacks: true,
      adjustDynamically: false,
    },
    privacy: {
      collectAnalytics: true,
      shareProgress: false,
      publicProfile: false,
    },
    experimentalFeatures: {
      betaUI: false,
      advancedAnalysis: false,
      multiPV: false,
      cloudSave: false,
    },
    dataSync: {
      enabled: false,
      lastSync: null,
      syncInProgress: false,
      syncError: null,
    },
    language: "de",
    timezone: "Europe/Berlin",
    firstTimeUser: false,
    lastSettingsUpdate: new Date().toISOString(),
    restartRequired: false,

    // Add all action mocks
    setUser: jest.fn(),
    updatePreferences: jest.fn(),
    incrementStreak: jest.fn(),
    resetStreak: jest.fn(),
    initializeGame: jest.fn(),
    makeMove: jest.fn(),
    resetGame: jest.fn(),
    goToMove: jest.fn(),
    setTablebaseMove: jest.fn(),
    setAnalysisStatus: jest.fn(),
    clearTablebaseState: jest.fn(),
    setPosition: jest.fn(),
    setPlayerTurn: jest.fn(),
    incrementHint: jest.fn(),
    incrementMistake: jest.fn(),
    setMoveErrorDialog: jest.fn(),
    updatePositionProgress: jest.fn(),
    unlockAchievement: jest.fn(),
    toggleFavorite: jest.fn(),
    setIsSidebarOpen: jest.fn(),
    openModal: jest.fn(),
    closeModal: jest.fn(),
    showToast: jest.fn(),
    removeToast: jest.fn(),
    setLoading: jest.fn(),
    updateTheme: jest.fn(),
    updateNotifications: jest.fn(),
    updateDifficulty: jest.fn(),
    updateSettings: jest.fn(),

    // Orchestrator actions
    makeUserMove: jest.fn(),
    requestTablebaseMove: jest.fn(),
    requestPositionEvaluation: jest.fn(),
    loadTrainingContext: jest.fn(),

    // Utility actions
    reset: jest.fn(),
    hydrate: jest.fn(),
  } as any; // Using any to avoid having to mock every single action

  // Merge defaults with overrides
  const mockState = { ...defaultState, ...overrides };

  // Configure the mock to return our state
  (useStore as jest.MockedFunction<typeof useStore>).mockReturnValue(mockState);

  // Also mock the selector pattern
  (useStore as any).mockImplementation((selector?: any) => {
    if (typeof selector === "function") {
      return selector(mockState);
    }
    return mockState;
  });

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
 *   analysisStatus: 'loading'
 * });
 *
 * // Now selectors work:
 * const status = useStore((state) => state.analysisStatus); // 'loading'
 * ```
 */
export /**
 *
 */
const mockRootStoreWithSelector = (overrides: MockRootState = {}) => {
  const mock = mockRootStore(overrides);

  // Ensure selector pattern works
  mock.setState = jest.fn();
  mock.getState = jest.fn(() => ({ ...mock(), ...overrides }));

  return mock;
};

/**
 * Resets the useStore mock
 * Call this in afterEach hooks to ensure test isolation
 */
export /**
 *
 */
const resetRootStoreMock = () => {
  (useStore as unknown as jest.Mock).mockClear();
};

/**
 * Helper to verify mock calls
 *
 * @param mock - The mocked function
 * @param expectedCalls - Expected number of calls
 */
export /**
 *
 */
const verifyRootStoreCalls = (
  mock: jest.MockedFunction<typeof useStore>,
  expectedCalls: number,
) => {
  expect(mock).toHaveBeenCalledTimes(expectedCalls);
};
