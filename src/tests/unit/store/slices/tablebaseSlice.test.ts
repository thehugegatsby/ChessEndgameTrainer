/**
 * @file Tests for TablebaseSlice with nested store structure
 * @module tests/unit/store/slices/tablebaseSlice.nested
 */

import { describe, it, test, expect, beforeEach } from 'vitest';
import { useStore } from "@shared/store/rootStore";
import type { PositionAnalysis } from "@shared/types";

describe("TablebaseSlice - Nested Store Structure", () => {
  beforeEach(() => {
    // Reset store to initial state - preserve actions by only updating state properties
    useStore.setState((state) => {
      state.tablebase.tablebaseMove = undefined;
      state.tablebase.analysisStatus = "idle";
      state.tablebase.evaluations = [];
      state.tablebase.currentEvaluation = undefined;
    });
  });

  describe("setTablebaseMove", () => {
    it("should set tablebase move string", () => {
      const store = useStore.getState();

      store.tablebase.setTablebaseMove("Qb7");

      const state = useStore.getState();
      expect(state.tablebase.tablebaseMove).toBe("Qb7");
    });

    it("should set null for draw position", () => {
      const store = useStore.getState();

      store.tablebase.setTablebaseMove(null);

      const state = useStore.getState();
      expect(state.tablebase.tablebaseMove).toBeNull();
    });

    it("should set undefined for no lookup", () => {
      const store = useStore.getState();

      store.tablebase.setTablebaseMove(undefined);

      const state = useStore.getState();
      expect(state.tablebase.tablebaseMove).toBeUndefined();
    });
  });

  describe("setAnalysisStatus", () => {
    it("should set all analysis status values", () => {
      const store = useStore.getState();
      const statuses = ["idle", "loading", "success", "error"] as const;

      statuses.forEach((status) => {
        store.tablebase.setAnalysisStatus(status);
        const state = useStore.getState();
        expect(state.tablebase.analysisStatus).toBe(status);
      });
    });
  });

  describe("setEvaluations", () => {
    it("should set evaluations array", () => {
      const store = useStore.getState();
      const evaluations: PositionAnalysis[] = [
        {
          fen: "8/8/8/8/8/8/8/8 w - - 0 1",
          evaluation: 0,
        },
        {
          fen: "K7/P7/k7/8/8/8/8/8 w - - 0 1",
          evaluation: 2,
        },
      ];

      store.tablebase.setEvaluations(evaluations);

      const state = useStore.getState();
      expect(state.tablebase.evaluations).toEqual(evaluations);
      expect(state.tablebase.evaluations).toHaveLength(2);
    });

    it("should clear evaluations with empty array", () => {
      const store = useStore.getState();

      // First set some evaluations
      store.tablebase.setEvaluations([
        { fen: "8/8/8/8/8/8/8/8 w - - 0 1", evaluation: 0 },
      ]);

      // Then clear them
      store.tablebase.setEvaluations([]);

      const state = useStore.getState();
      expect(state.tablebase.evaluations).toEqual([]);
    });
  });

  describe("addEvaluation", () => {
    it("should add evaluation to array", () => {
      const store = useStore.getState();
      const evaluation: PositionAnalysis = {
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        evaluation: 0,
      };

      store.tablebase.addEvaluation(evaluation);

      const state = useStore.getState();
      expect(state.tablebase.evaluations).toContainEqual(evaluation);
      expect(state.tablebase.evaluations).toHaveLength(1);
    });

    it("should append evaluations to existing array", () => {
      const store = useStore.getState();
      const eval1: PositionAnalysis = {
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        evaluation: 0,
      };
      const eval2: PositionAnalysis = {
        fen: "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        evaluation: 2,
      };

      store.tablebase.addEvaluation(eval1);
      store.tablebase.addEvaluation(eval2);

      const state = useStore.getState();
      expect(state.tablebase.evaluations).toHaveLength(2);
      expect(state.tablebase.evaluations[0]).toEqual(eval1);
      expect(state.tablebase.evaluations[1]).toEqual(eval2);
    });
  });

  describe("setCurrentEvaluation", () => {
    it("should set current evaluation", () => {
      const store = useStore.getState();
      const evaluation: PositionAnalysis = {
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        evaluation: 0,
      };

      store.tablebase.setCurrentEvaluation(evaluation);

      const state = useStore.getState();
      expect(state.tablebase.currentEvaluation).toEqual(evaluation);
    });

    it("should clear current evaluation", () => {
      const store = useStore.getState();

      // First set an evaluation
      store.tablebase.setCurrentEvaluation({
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        evaluation: 0,
      });

      // Then clear it
      store.tablebase.setCurrentEvaluation(undefined);

      const state = useStore.getState();
      expect(state.tablebase.currentEvaluation).toBeUndefined();
    });
  });

  describe("clearTablebaseState", () => {
    it("should reset all state to initial values", () => {
      const store = useStore.getState();

      // Set various values
      store.tablebase.setTablebaseMove("Qb7");
      store.tablebase.setAnalysisStatus("loading");
      store.tablebase.addEvaluation({
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        evaluation: 0,
      });
      store.tablebase.setCurrentEvaluation({
        fen: "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        evaluation: 2,
      });

      // Clear everything
      store.tablebase.clearTablebaseState();

      const state = useStore.getState();
      expect(state.tablebase.tablebaseMove).toBeUndefined();
      expect(state.tablebase.analysisStatus).toBe("idle");
      expect(state.tablebase.evaluations).toEqual([]);
      expect(state.tablebase.currentEvaluation).toBeUndefined();
    });
  });

  describe("Integration with nested structure", () => {
    it("should work with other slices in the store", () => {
      const store = useStore.getState();

      // Verify that other slices exist
      expect(store.game).toBeDefined();
      expect(store.training).toBeDefined();
      expect(store.ui).toBeDefined();

      // Set tablebase data
      store.tablebase.setTablebaseMove("Kd6");

      // Verify it doesn't affect other slices
      const state = useStore.getState();
      expect(state.tablebase.tablebaseMove).toBe("Kd6");
      expect(state.game.currentFen).toBeDefined();
      expect(state.training.currentPosition).toBeUndefined(); // Should be undefined initially
    });

    it("should maintain proper nesting in state updates", () => {
      const store = useStore.getState();

      // Make multiple updates
      store.tablebase.setAnalysisStatus("loading");
      store.tablebase.setTablebaseMove("Qb7");
      store.tablebase.addEvaluation({
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        evaluation: 0,
      });

      // Check all updates were applied correctly
      const state = useStore.getState();
      expect(state.tablebase.analysisStatus).toBe("loading");
      expect(state.tablebase.tablebaseMove).toBe("Qb7");
      expect(state.tablebase.evaluations).toHaveLength(1);
    });
  });
});
