/**
 * @file Unit tests for Tablebase state slice
 * @module tests/store/slices/tablebaseSlice
 * @description Comprehensive test suite for the tablebase slice including state, actions, and selectors.
 * Tests cover tablebase move management, analysis status tracking, and evaluation caching.
 */

import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import {
  createTablebaseSlice,
  tablebaseSelectors,
  createInitialTablebaseState,
} from "@shared/store/slices/tablebaseSlice";
import type { TablebaseSlice } from "@shared/store/slices/types";
import type { PositionAnalysis } from "@shared/types";

/**
 * Creates a test store instance with only the tablebase slice
 * @returns Store instance with getState and setState methods
 */
const createTestStore = () => {
  return createStore<TablebaseSlice>()(
    immer((set, get, store) =>
      createTablebaseSlice(set as any, get as any, store as any),
    ),
  );
};

/**
 * Mock position analysis for testing
 */
const mockEvaluation: PositionAnalysis = {
  fen: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
  evaluation: 1000,
  topMoves: [
    {
      uci: "a2a8",
      san: "Ra8#",
      wdl: 1000,
      dtz: 1,
      dtm: null,
      category: "win",
      zeroing: true,
      checkmate: true,
      stalemate: false,
      variant_win: false,
      variant_loss: false,
      insufficient_material: false,
    },
  ],
  isTablebasePosition: true,
};

const mockDrawEvaluation: PositionAnalysis = {
  fen: "8/8/8/8/8/8/8/K3k3 w - - 0 1",
  evaluation: 0,
  topMoves: [],
  isTablebasePosition: true,
};

describe("TablebaseSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    /**
     * Tests that the initial state matches expected defaults
     */
    it("should have correct initial state", () => {
      const state = store.getState();
      const expectedState = createInitialTablebaseState();

      expect(state.tablebaseMove).toBe(expectedState.tablebaseMove);
      expect(state.analysisStatus).toBe(expectedState.analysisStatus);
      expect(state.evaluations).toEqual(expectedState.evaluations);
      expect(state.currentEvaluation).toBe(expectedState.currentEvaluation);
    });

    /**
     * Tests the initial state factory function
     */
    it("should create fresh initial state on each call", () => {
      const state1 = createInitialTablebaseState();
      const state2 = createInitialTablebaseState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.evaluations).not.toBe(state2.evaluations);
    });
  });

  describe("setTablebaseMove", () => {
    /**
     * Tests setting a valid move
     */
    it("should set tablebase move string", () => {
      store.getState().setTablebaseMove("Ra8#");
      expect(store.getState().tablebaseMove).toBe("Ra8#");
    });

    /**
     * Tests setting null for draw position
     */
    it("should set null for draw position", () => {
      store.getState().setTablebaseMove(null);
      expect(store.getState().tablebaseMove).toBe(null);
    });

    /**
     * Tests setting undefined for no lookup
     */
    it("should set undefined for no lookup", () => {
      store.getState().setTablebaseMove("Ra8#");
      expect(store.getState().tablebaseMove).toBe("Ra8#");

      store.getState().setTablebaseMove(undefined);
      expect(store.getState().tablebaseMove).toBe(undefined);
    });

    /**
     * Tests the three-state pattern
     */
    it("should handle three-state pattern correctly", () => {
      // Initial state - no lookup
      expect(store.getState().tablebaseMove).toBe(undefined);

      // Set a move
      store.getState().setTablebaseMove("Nf3");
      expect(store.getState().tablebaseMove).toBe("Nf3");

      // Set draw
      store.getState().setTablebaseMove(null);
      expect(store.getState().tablebaseMove).toBe(null);

      // Reset to no lookup
      store.getState().setTablebaseMove(undefined);
      expect(store.getState().tablebaseMove).toBe(undefined);
    });
  });

  describe("setAnalysisStatus", () => {
    /**
     * Tests all analysis status values
     */
    it("should set all analysis status values", () => {
      const statuses: Array<"idle" | "loading" | "success" | "error"> = [
        "idle",
        "loading",
        "success",
        "error",
      ];

      statuses.forEach((status) => {
        store.getState().setAnalysisStatus(status);
        expect(store.getState().analysisStatus).toBe(status);
      });
    });

    /**
     * Tests status transitions
     */
    it("should handle typical status flow", () => {
      // Initial
      expect(store.getState().analysisStatus).toBe("idle");

      // Start loading
      store.getState().setAnalysisStatus("loading");
      expect(store.getState().analysisStatus).toBe("loading");

      // Success
      store.getState().setAnalysisStatus("success");
      expect(store.getState().analysisStatus).toBe("success");

      // Back to idle
      store.getState().setAnalysisStatus("idle");
      expect(store.getState().analysisStatus).toBe("idle");
    });
  });

  describe("addEvaluation", () => {
    /**
     * Tests adding a single evaluation
     */
    it("should add evaluation to array", () => {
      store.getState().addEvaluation(mockEvaluation);

      const evaluations = store.getState().evaluations;
      expect(evaluations).toHaveLength(1);
      expect(evaluations[0]).toBe(mockEvaluation);
    });

    /**
     * Tests adding multiple evaluations
     */
    it("should append evaluations to existing array", () => {
      store.getState().addEvaluation(mockEvaluation);
      store.getState().addEvaluation(mockDrawEvaluation);

      const evaluations = store.getState().evaluations;
      expect(evaluations).toHaveLength(2);
      expect(evaluations[0]).toBe(mockEvaluation);
      expect(evaluations[1]).toBe(mockDrawEvaluation);
    });

    /**
     * Tests that evaluations are not deduplicated
     */
    it("should allow duplicate evaluations", () => {
      store.getState().addEvaluation(mockEvaluation);
      store.getState().addEvaluation(mockEvaluation);

      expect(store.getState().evaluations).toHaveLength(2);
    });
  });

  describe("setEvaluations", () => {
    /**
     * Tests replacing evaluations array
     */
    it("should replace entire evaluations array", () => {
      // Add some evaluations
      store.getState().addEvaluation(mockEvaluation);
      expect(store.getState().evaluations).toHaveLength(1);

      // Replace with new array
      const newEvaluations = [mockDrawEvaluation, mockEvaluation];
      store.getState().setEvaluations(newEvaluations);

      expect(store.getState().evaluations).toEqual(newEvaluations);
      expect(store.getState().evaluations).toHaveLength(2);
    });

    /**
     * Tests clearing evaluations
     */
    it("should clear evaluations with empty array", () => {
      store.getState().addEvaluation(mockEvaluation);
      store.getState().addEvaluation(mockDrawEvaluation);
      expect(store.getState().evaluations).toHaveLength(2);

      store.getState().setEvaluations([]);
      expect(store.getState().evaluations).toEqual([]);
    });
  });

  describe("setCurrentEvaluation", () => {
    /**
     * Tests setting current evaluation
     */
    it("should set current evaluation", () => {
      expect(store.getState().currentEvaluation).toBeUndefined();

      store.getState().setCurrentEvaluation(mockEvaluation);
      expect(store.getState().currentEvaluation).toBe(mockEvaluation);
    });

    /**
     * Tests clearing current evaluation
     */
    it("should clear current evaluation", () => {
      store.getState().setCurrentEvaluation(mockEvaluation);
      expect(store.getState().currentEvaluation).toBe(mockEvaluation);

      store.getState().setCurrentEvaluation(undefined);
      expect(store.getState().currentEvaluation).toBeUndefined();
    });

    /**
     * Tests that current evaluation is independent of evaluations array
     */
    it("should maintain current evaluation independently", () => {
      store.getState().setCurrentEvaluation(mockEvaluation);
      store.getState().addEvaluation(mockDrawEvaluation);

      expect(store.getState().currentEvaluation).toBe(mockEvaluation);
      expect(store.getState().evaluations).not.toContain(mockEvaluation);
    });
  });

  describe("clearTablebaseState", () => {
    /**
     * Tests complete state reset
     */
    it("should reset all state to initial values", () => {
      // Modify all state
      store.getState().setTablebaseMove("Ra8#");
      store.getState().setAnalysisStatus("success");
      store.getState().addEvaluation(mockEvaluation);
      store.getState().setCurrentEvaluation(mockEvaluation);

      // Clear state
      store.getState().clearTablebaseState();

      // Verify reset
      const state = store.getState();
      const initialState = createInitialTablebaseState();

      expect(state.tablebaseMove).toBe(initialState.tablebaseMove);
      expect(state.analysisStatus).toBe(initialState.analysisStatus);
      expect(state.evaluations).toEqual(initialState.evaluations);
      expect(state.currentEvaluation).toBe(initialState.currentEvaluation);
    });
  });

  describe("Selectors", () => {
    /**
     * Tests basic state selectors
     */
    it("should select correct state values", () => {
      store.getState().setTablebaseMove("Nf3");
      store.getState().setAnalysisStatus("loading");
      store.getState().addEvaluation(mockEvaluation);
      store.getState().setCurrentEvaluation(mockDrawEvaluation);

      const state = store.getState();

      expect(tablebaseSelectors.selectTablebaseMove(state)).toBe("Nf3");
      expect(tablebaseSelectors.selectAnalysisStatus(state)).toBe("loading");
      expect(tablebaseSelectors.selectEvaluations(state)).toHaveLength(1);
      expect(tablebaseSelectors.selectCurrentEvaluation(state)).toBe(
        mockDrawEvaluation,
      );
    });

    /**
     * Tests loading state selectors
     */
    it("should correctly determine loading states", () => {
      const state1 = store.getState();
      expect(tablebaseSelectors.selectIsLoading(state1)).toBe(false);
      expect(tablebaseSelectors.selectIsSuccess(state1)).toBe(false);
      expect(tablebaseSelectors.selectIsError(state1)).toBe(false);

      store.getState().setAnalysisStatus("loading");
      const state2 = store.getState();
      expect(tablebaseSelectors.selectIsLoading(state2)).toBe(true);
      expect(tablebaseSelectors.selectIsSuccess(state2)).toBe(false);
      expect(tablebaseSelectors.selectIsError(state2)).toBe(false);

      store.getState().setAnalysisStatus("success");
      const state3 = store.getState();
      expect(tablebaseSelectors.selectIsLoading(state3)).toBe(false);
      expect(tablebaseSelectors.selectIsSuccess(state3)).toBe(true);
      expect(tablebaseSelectors.selectIsError(state3)).toBe(false);

      store.getState().setAnalysisStatus("error");
      const state4 = store.getState();
      expect(tablebaseSelectors.selectIsLoading(state4)).toBe(false);
      expect(tablebaseSelectors.selectIsSuccess(state4)).toBe(false);
      expect(tablebaseSelectors.selectIsError(state4)).toBe(true);
    });

    /**
     * Tests move availability selectors
     */
    it("should detect move availability and draw positions", () => {
      // No move yet
      const state1 = store.getState();
      expect(tablebaseSelectors.selectHasTablebaseMove(state1)).toBe(false);
      expect(tablebaseSelectors.selectIsDrawPosition(state1)).toBe(false);

      // Has move
      store.getState().setTablebaseMove("Ra8#");
      const state2 = store.getState();
      expect(tablebaseSelectors.selectHasTablebaseMove(state2)).toBe(true);
      expect(tablebaseSelectors.selectIsDrawPosition(state2)).toBe(false);

      // Draw position
      store.getState().setTablebaseMove(null);
      const state3 = store.getState();
      expect(tablebaseSelectors.selectHasTablebaseMove(state3)).toBe(true);
      expect(tablebaseSelectors.selectIsDrawPosition(state3)).toBe(true);
    });

    /**
     * Tests evaluation by FEN selector
     */
    it("should find evaluation by FEN", () => {
      store.getState().addEvaluation(mockEvaluation);
      store.getState().addEvaluation(mockDrawEvaluation);

      const state = store.getState();

      const eval1 = tablebaseSelectors.selectEvaluationByFen(
        mockEvaluation.fen,
      )(state);
      expect(eval1).toBe(mockEvaluation);

      const eval2 = tablebaseSelectors.selectEvaluationByFen(
        mockDrawEvaluation.fen,
      )(state);
      expect(eval2).toBe(mockDrawEvaluation);

      const eval3 =
        tablebaseSelectors.selectEvaluationByFen("nonexistent-fen")(state);
      expect(eval3).toBeUndefined();
    });

    /**
     * Tests evaluation count selector
     */
    it("should count evaluations", () => {
      expect(tablebaseSelectors.selectEvaluationCount(store.getState())).toBe(
        0,
      );

      store.getState().addEvaluation(mockEvaluation);
      expect(tablebaseSelectors.selectEvaluationCount(store.getState())).toBe(
        1,
      );

      store.getState().addEvaluation(mockDrawEvaluation);
      expect(tablebaseSelectors.selectEvaluationCount(store.getState())).toBe(
        2,
      );
    });
  });

  describe("Integration Scenarios", () => {
    /**
     * Tests typical tablebase lookup flow
     */
    it("should handle typical tablebase lookup flow", () => {
      // Start lookup
      store.getState().setAnalysisStatus("loading");
      expect(store.getState().analysisStatus).toBe("loading");

      // Receive result
      store.getState().setTablebaseMove("Ra8#");
      store.getState().setCurrentEvaluation(mockEvaluation);
      store.getState().addEvaluation(mockEvaluation);
      store.getState().setAnalysisStatus("success");

      // Verify final state
      const state = store.getState();
      expect(state.tablebaseMove).toBe("Ra8#");
      expect(state.currentEvaluation).toBe(mockEvaluation);
      expect(state.evaluations).toContain(mockEvaluation);
      expect(state.analysisStatus).toBe("success");
    });

    /**
     * Tests error handling flow
     */
    it("should handle error flow", () => {
      // Start lookup
      store.getState().setAnalysisStatus("loading");

      // Error occurs
      store.getState().setAnalysisStatus("error");

      // Move and evaluation remain unchanged
      const state = store.getState();
      expect(state.tablebaseMove).toBeUndefined();
      expect(state.currentEvaluation).toBeUndefined();
      expect(state.analysisStatus).toBe("error");
    });

    /**
     * Tests draw position flow
     */
    it("should handle draw position flow", () => {
      store.getState().setAnalysisStatus("loading");

      // Draw position result
      store.getState().setTablebaseMove(null);
      store.getState().setCurrentEvaluation(mockDrawEvaluation);
      store.getState().setAnalysisStatus("success");

      const state = store.getState();
      expect(tablebaseSelectors.selectIsDrawPosition(state)).toBe(true);
      expect(tablebaseSelectors.selectHasTablebaseMove(state)).toBe(true);
    });
  });
});
