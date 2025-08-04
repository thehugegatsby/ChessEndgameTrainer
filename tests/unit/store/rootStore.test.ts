/**
 * @file Unit tests for refactored Zustand rootStore
 * @description Tests the new domain-specific slices and orchestrators
 *
 * Test guidelines followed:
 * - Each test has a single responsibility
 * - Self-explanatory test names
 * - No magic values
 * - Deterministic behavior
 * - Fast execution
 */

import { useStore } from "@shared/store/rootStore";
import type { EndgamePosition } from "@shared/types/endgame";

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => `test-id-${Math.random()}`),
}));

// Mock chess.js
jest.mock("chess.js", () => {
  return {
    Chess: jest.fn().mockImplementation((fen) => {
      const currentFen =
        fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      return {
        fen: jest.fn(() => currentFen),
        pgn: jest.fn(() => ""),
        move: jest.fn(() => ({
          from: "e2",
          to: "e4",
          san: "e4",
          piece: "p",
          color: "w",
          flags: "b",
        })),
        load: jest.fn(),
        isGameOver: jest.fn(() => false),
        isCheckmate: jest.fn(() => false),
        isDraw: jest.fn(() => false),
        turn: jest.fn(() => currentFen.split(" ")[1] || "w"),
      };
    }),
  };
});

// Mock TablebaseService
jest.mock("@shared/services/TablebaseService", () => ({
  tablebaseService: {
    getEvaluation: jest.fn().mockResolvedValue({ isAvailable: false }),
    getTopMoves: jest.fn().mockResolvedValue({ isAvailable: false, moves: [] }),
  },
}));

// Mock logger
jest.mock("@shared/services/logging", () => ({
  /**
   *
   */
  getLogger: () => ({
    setContext: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe("RootStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStore.getState().reset();
  });

  describe("Store Structure", () => {
    it("should have all slice states", () => {
      const state = useStore.getState();

      // User slice
      expect(state).toHaveProperty("id");
      expect(state).toHaveProperty("username");
      expect(state).toHaveProperty("email");
      expect(state).toHaveProperty("rating");
      expect(state).toHaveProperty("preferences");

      // Game slice
      expect(state).toHaveProperty("game");
      expect(state).toHaveProperty("currentFen");
      expect(state).toHaveProperty("moveHistory");
      expect(state).toHaveProperty("currentMoveIndex");
      expect(state).toHaveProperty("isGameFinished");

      // Tablebase slice
      expect(state).toHaveProperty("tablebaseMove");
      expect(state).toHaveProperty("analysisStatus");
      expect(state).toHaveProperty("evaluations");
      expect(state).toHaveProperty("currentEvaluation");

      // Training slice
      expect(state).toHaveProperty("currentPosition");
      expect(state).toHaveProperty("isPlayerTurn");
      expect(state).toHaveProperty("hintsUsed");
      expect(state).toHaveProperty("mistakeCount");
      expect(state).toHaveProperty("moveErrorDialog");

      // Progress slice
      expect(state).toHaveProperty("positionProgress");
      expect(state).toHaveProperty("dailyStats");
      expect(state).toHaveProperty("achievements");
      expect(state).toHaveProperty("favoritePositions");

      // UI slice
      expect(state).toHaveProperty("sidebarOpen");
      expect(state).toHaveProperty("modalOpen");
      expect(state).toHaveProperty("toasts");
      expect(state).toHaveProperty("loading");

      // Settings slice
      expect(state).toHaveProperty("theme");
      expect(state).toHaveProperty("notifications");
      expect(state).toHaveProperty("difficulty");
      expect(state).toHaveProperty("language");
    });

    it("should have all slice actions", () => {
      const state = useStore.getState();

      // User actions
      expect(state).toHaveProperty("setUser");
      expect(state).toHaveProperty("updatePreferences");
      expect(state).toHaveProperty("incrementStreak");
      expect(state).toHaveProperty("resetStreak");

      // Game actions
      expect(state).toHaveProperty("initializeGame");
      expect(state).toHaveProperty("makeMove");
      expect(state).toHaveProperty("resetGame");
      expect(state).toHaveProperty("goToMove");

      // Tablebase actions
      expect(state).toHaveProperty("setTablebaseMove");
      expect(state).toHaveProperty("setAnalysisStatus");
      expect(state).toHaveProperty("clearTablebaseState");

      // Training actions
      expect(state).toHaveProperty("setPosition");
      expect(state).toHaveProperty("setPlayerTurn");
      expect(state).toHaveProperty("useHint");
      expect(state).toHaveProperty("incrementMistake");
      expect(state).toHaveProperty("setMoveErrorDialog");

      // Progress actions
      expect(state).toHaveProperty("updatePositionProgress");
      expect(state).toHaveProperty("unlockAchievement");
      expect(state).toHaveProperty("toggleFavorite");

      // UI actions
      expect(state).toHaveProperty("setSidebarOpen");
      expect(state).toHaveProperty("openModal");
      expect(state).toHaveProperty("closeModal");
      expect(state).toHaveProperty("showToast");
      expect(state).toHaveProperty("removeToast");
      expect(state).toHaveProperty("setLoading");

      // Settings actions
      expect(state).toHaveProperty("updateTheme");
      expect(state).toHaveProperty("updateNotifications");
      expect(state).toHaveProperty("updateDifficulty");
      expect(state).toHaveProperty("updateSettings");
    });

    it("should have orchestrator actions", () => {
      const state = useStore.getState();

      expect(state).toHaveProperty("makeUserMove");
      expect(state).toHaveProperty("requestTablebaseMove");
      expect(state).toHaveProperty("requestPositionEvaluation");
      expect(state).toHaveProperty("loadTrainingContext");
    });
  });

  describe("Initial State", () => {
    it("should have correct initial user state", () => {
      const state = useStore.getState();

      expect(state.rating).toBe(1200);
      expect(state.completedPositions).toEqual([]);
      expect(state.currentStreak).toBe(0);
      expect(state.totalTrainingTime).toBe(0);
      expect(state.preferences.theme).toBe("dark");
      expect(state.preferences.soundEnabled).toBe(true);
    });

    it("should have correct initial game state", () => {
      const state = useStore.getState();

      expect(state.game).toBeUndefined();
      expect(state.currentFen).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
      expect(state.moveHistory).toEqual([]);
      expect(state.currentMoveIndex).toBe(-1);
      expect(state.isGameFinished).toBe(false);
    });

    it("should have correct initial training state", () => {
      const state = useStore.getState();

      expect(state.currentPosition).toBeUndefined();
      expect(state.isPlayerTurn).toBe(true);
      expect(state.hintsUsed).toBe(0);
      expect(state.mistakeCount).toBe(0);
      expect(state.moveErrorDialog).toBeNull();
    });

    it("should have correct initial UI state", () => {
      const state = useStore.getState();

      expect(state.sidebarOpen).toBe(true);
      expect(state.modalOpen).toBeNull();
      expect(state.toasts).toEqual([]);
      expect(state.loading).toEqual({
        global: false,
        tablebase: false,
        position: false,
        analysis: false,
      });
    });

    it("should have correct initial settings state", () => {
      const state = useStore.getState();

      expect(state.theme.mode).toBe("light");
      expect(state.notifications.enabled).toBe(true);
      expect(state.notifications.achievements).toBe(true);
      expect(state.difficulty.level).toBe("intermediate");
      expect(state.language).toBe("de");
    });
  });

  describe("Slice Actions", () => {
    describe("User Actions", () => {
      it("should update user information", () => {
        const store = useStore.getState();

        store.setUser({
          username: "TestUser",
          rating: 1500,
          email: "test@example.com",
        });

        const state = useStore.getState();
        expect(state.username).toBe("TestUser");
        expect(state.rating).toBe(1500);
        expect(state.email).toBe("test@example.com");
      });

      it("should update preferences", () => {
        const store = useStore.getState();

        store.updatePreferences({
          theme: "light",
          soundEnabled: false,
          boardOrientation: "black",
        });

        const state = useStore.getState();
        expect(state.preferences.theme).toBe("light");
        expect(state.preferences.soundEnabled).toBe(false);
        expect(state.preferences.boardOrientation).toBe("black");
      });

      it("should handle streak operations", () => {
        const store = useStore.getState();

        store.incrementStreak();
        store.incrementStreak();

        expect(useStore.getState().currentStreak).toBe(2);

        store.resetStreak();

        expect(useStore.getState().currentStreak).toBe(0);
      });
    });

    describe("Game Actions", () => {
      it("should initialize game with FEN", () => {
        const store = useStore.getState();
        const testFen = "8/8/8/8/8/8/R7/K3k3 w - - 0 1";

        const game = store.initializeGame(testFen);

        expect(game).toBeTruthy();
        const state = useStore.getState();
        expect(state.game).toBeTruthy();
        expect(state.currentFen).toBe(testFen);
        expect(state.moveHistory).toEqual([]);
      });

      it("should make a valid move", () => {
        const store = useStore.getState();
        store.initializeGame(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        );

        const move = store.makeMove({ from: "e2", to: "e4" });

        expect(move).toBeTruthy();
        expect(move?.san).toBe("e4");
        const state = useStore.getState();
        expect(state.moveHistory).toHaveLength(1);
        expect(state.currentMoveIndex).toBe(0);
      });

      it("should reset game state", () => {
        const store = useStore.getState();
        store.initializeGame("8/8/8/8/8/8/R7/K3k3 w - - 0 1");
        store.makeMove({ from: "a2", to: "a4" });

        store.resetGame();

        const state = useStore.getState();
        expect(state.game).toBeTruthy();
        expect(state.currentFen).toBe(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        );
        expect(state.moveHistory).toEqual([]);
        expect(state.currentMoveIndex).toBe(-1);
      });
    });

    describe("Training Actions", () => {
      it("should set training position", () => {
        const store = useStore.getState();
        const position = {
          id: 1,
          title: "Test Position",
          fen: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
          colorToTrain: "white" as const,
          targetOutcome: "1-0" as const,
          sideToMove: "white" as const,
        } as any;

        store.setPosition(position);

        const state = useStore.getState();
        expect(state.currentPosition).toEqual(position);
        expect(state.isPlayerTurn).toBe(true);
        expect(state.hintsUsed).toBe(0);
        expect(state.mistakeCount).toBe(0);
      });

      it("should track hints and mistakes", () => {
        const store = useStore.getState();

        store.useHint();
        store.useHint();
        store.incrementMistake();

        const state = useStore.getState();
        expect(state.hintsUsed).toBe(2);
        expect(state.mistakeCount).toBe(1);
      });

      it("should handle move error dialog", () => {
        const store = useStore.getState();
        const errorDialog = {
          isOpen: true,
          wdlBefore: 2,
          wdlAfter: 0,
          bestMove: "Kd7",
        };

        store.setMoveErrorDialog(errorDialog);

        expect(useStore.getState().moveErrorDialog).toEqual(errorDialog);

        store.setMoveErrorDialog(null);

        expect(useStore.getState().moveErrorDialog).toBeNull();
      });
    });

    describe("UI Actions", () => {
      it("should toggle sidebar", () => {
        const store = useStore.getState();

        store.setSidebarOpen(false);
        expect(useStore.getState().sidebarOpen).toBe(false);

        store.setSidebarOpen(true);
        expect(useStore.getState().sidebarOpen).toBe(true);
      });

      it("should handle modal operations", () => {
        const store = useStore.getState();

        store.openModal("settings");
        expect(useStore.getState().modalOpen).toBe("settings");

        store.closeModal();
        expect(useStore.getState().modalOpen).toBeNull();
      });

      it("should show and remove toasts", () => {
        const store = useStore.getState();

        store.showToast("Test message", "success");

        const state1 = useStore.getState();
        expect(state1.toasts).toHaveLength(1);
        expect(state1.toasts[0].message).toBe("Test message");
        expect(state1.toasts[0].type).toBe("success");

        const toastId = state1.toasts[0].id;
        store.removeToast(toastId);

        expect(useStore.getState().toasts).toHaveLength(0);
      });

      it("should handle loading states", () => {
        const store = useStore.getState();

        store.setLoading("position", true);
        store.setLoading("analysis", true);

        const state1 = useStore.getState();
        expect(state1.loading.position).toBe(true);
        expect(state1.loading.analysis).toBe(true);

        store.setLoading("position", false);

        const state2 = useStore.getState();
        expect(state2.loading.position).toBe(false);
        expect(state2.loading.analysis).toBe(true);
      });
    });

    describe("Settings Actions", () => {
      it("should update theme", () => {
        const store = useStore.getState();

        store.updateTheme({ mode: "light" });

        expect(useStore.getState().theme.mode).toBe("light");
      });

      it("should update notifications", () => {
        const store = useStore.getState();

        store.updateNotifications({
          moves: false,
          analysis: false,
          achievements: true,
        });

        const state = useStore.getState();
        expect(state.notifications.moves).toBe(false);
        expect(state.notifications.analysis).toBe(false);
        expect(state.notifications.achievements).toBe(true);
      });

      it("should update difficulty", () => {
        const store = useStore.getState();

        store.updateDifficulty({ level: "beginner" });

        expect(useStore.getState().difficulty.level).toBe("beginner");
      });

      it("should update multiple settings at once", () => {
        const store = useStore.getState();

        store.updateSettings({
          theme: { mode: "light" },
          difficulty: { level: "advanced" },
          language: "en",
        });

        const state = useStore.getState();
        expect(state.theme.mode).toBe("light");
        expect(state.difficulty.level).toBe("advanced");
        expect(state.language).toBe("en");
      });
    });

    describe("Progress Actions", () => {
      it("should track position progress", () => {
        const store = useStore.getState();

        store.updatePositionProgress(1, {
          positionId: 1,
          attempts: 1,
          successes: 1,
          lastAttemptDate: new Date().toISOString(),
          averageTime: 30,
        });

        const state = useStore.getState();
        expect(state.positionProgress[1]).toBeDefined();
        expect(state.positionProgress[1].attempts).toBe(1);
        expect(state.positionProgress[1].successes).toBe(1);
      });

      it("should toggle favorite positions", () => {
        const store = useStore.getState();

        store.toggleFavorite(1);
        expect(useStore.getState().favoritePositions).toContain(1);

        store.toggleFavorite(1);
        expect(useStore.getState().favoritePositions).not.toContain(1);
      });

      it("should add achievements", () => {
        const store = useStore.getState();
        // Initialize achievements first
        store.initializeAchievements([
          {
            id: "first_win",
            title: "First Win",
            description: "Win your first game",
            category: "completion",
            icon: "trophy",
            points: 10,
            unlocked: false,
            progress: 0,
            rarity: "common",
          },
        ]);

        store.unlockAchievement("first_win");

        const state = useStore.getState();
        const achievement = state.achievements.find(
          (a) => a.id === "first_win",
        );
        expect(achievement).toBeDefined();
        expect(achievement?.unlocked).toBe(true);
        expect(state.totalPoints).toBe(10);
      });
    });
  });

  describe("Orchestrators", () => {
    it("should load training context", async () => {
      const store = useStore.getState();
      const position: EndgamePosition = {
        id: 1,
        title: "King and Rook vs King",
        fen: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
        description: "Test position",
        category: "basic-checkmates",
        difficulty: "beginner",
        goal: "win",
        sideToMove: "white",
        targetMoves: 10,
      };

      await store.loadTrainingContext(position);

      const state = useStore.getState();
      expect(state.currentPosition).toBeDefined();
      expect(state.currentPosition?.title).toBe("King and Rook vs King");
      expect(state.game).toBeTruthy();
      expect(state.currentFen).toBe("8/8/8/8/8/8/R7/K3k3 w - - 0 1");
      expect(state.isPlayerTurn).toBe(true);
    });

    // Note: More complex orchestrator tests would require proper mocking
    // of TablebaseService responses, which is already done in other test files
  });

  describe("Reset Functionality", () => {
    it("should reset entire store to initial state", () => {
      const store = useStore.getState();

      // Make some changes
      store.setUser({ username: "TestUser", rating: 1500 });
      store.initializeGame("8/8/8/8/8/8/R7/K3k3 w - - 0 1");
      store.showToast("Test", "info");
      store.updateTheme({ mode: "light" });

      // Reset
      store.reset();

      const state = useStore.getState();

      // Check everything is back to initial state
      expect(state.username).toBeUndefined();
      expect(state.rating).toBe(1200);
      expect(state.game).toBeUndefined();
      expect(state.toasts).toEqual([]);
      expect(state.theme.mode).toBe("light");
      expect(state.currentPosition).toBeUndefined();
    });
  });

  describe("Hydration", () => {
    it("should hydrate store with partial state", () => {
      const store = useStore.getState();

      store.hydrate({
        username: "HydratedUser",
        rating: 1800,
        theme: { mode: "light", customColors: {} },
        difficulty: "advanced",
      });

      const state = useStore.getState();
      expect(state.username).toBe("HydratedUser");
      expect(state.rating).toBe(1800);
      expect(state.theme.mode).toBe("light");
      expect(state.difficulty).toBe("advanced");

      // Other state should remain unchanged
      expect(state.language).toBe("de");
      expect(state.currentStreak).toBe(0);
    });
  });
});
