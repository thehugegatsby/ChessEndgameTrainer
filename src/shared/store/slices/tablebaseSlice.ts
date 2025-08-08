/**
 * @file Tablebase state slice for Zustand store
 * @module store/slices/tablebaseSlice
 * @description Manages tablebase API interactions, caching, and analysis state.
 * This slice handles communication with the Lichess tablebase API and maintains
 * evaluation results for chess positions.
 *
 * @example
 * ```typescript
 * // Using the tablebase slice in a component
 * import { useStore } from '@/store';
 * import { tablebaseSelectors } from '@/store/slices/tablebaseSlice';
 *
 * function TablebasePanel() {
 *   const analysisStatus = useStore(tablebaseSelectors.selectAnalysisStatus);
 *   const currentEval = useStore(tablebaseSelectors.selectCurrentEvaluation);
 *   const isLoading = useStore(tablebaseSelectors.selectIsLoading);
 *
 *   if (isLoading) return <Spinner />;
 *   if (currentEval) return <EvaluationDisplay eval={currentEval} />;
 * }
 * ```
 */

import { ImmerStateCreator, TablebaseSlice, TablebaseState, TablebaseActions } from "./types";
import type { PositionAnalysis } from "@shared/types/evaluation";
import type { AnalysisStatus } from "../types";

/**
 * Initial state for the tablebase slice
 * Exported separately to enable proper store reset in tests
 */
export const initialTablebaseState = {
  tablebaseMove: undefined as string | null | undefined,
  analysisStatus: "idle" as AnalysisStatus,
  evaluations: [] as PositionAnalysis[],
  currentEvaluation: undefined as PositionAnalysis | undefined,
};

/**
 * Creates the initial tablebase state with default values
 * @deprecated Use initialTablebaseState export directly
 */
export const createInitialTablebaseState = () => ({ ...initialTablebaseState });

/**
 * Creates the tablebase state (data only, no actions)
 *
 * @returns {TablebaseState} Tablebase state properties only
 *
 * @remarks
 * This function creates only the state properties for tablebase slice.
 * Actions are created separately to avoid Immer middleware stripping functions.
 *
 * @example
 * ```typescript
 * const tablebaseState = createTablebaseState();
 * const tablebaseActions = createTablebaseActions(set, get);
 * ```
 */
export const createTablebaseState = (): TablebaseState => ({
  tablebaseMove: undefined as string | null | undefined,
  analysisStatus: "idle" as AnalysisStatus,
  evaluations: [],
  currentEvaluation: undefined as PositionAnalysis | undefined,
});

/**
 * Creates the tablebase actions (functions only, no state)
 *
 * @param {Function} set - Zustand's set function for state updates
 * @returns {TablebaseActions} Tablebase action functions
 *
 * @remarks
 * This function creates only the action functions for tablebase slice.
 * Actions are kept separate from state to prevent Immer middleware from stripping them.
 *
 * @example
 * ```typescript
 * const tablebaseActions = createTablebaseActions(set, get);
 * ```
 */
export const createTablebaseActions = (
  set: any,
): TablebaseActions => ({

  /**
   * Sets the tablebase move for the current position
   *
   * @param {string|null|undefined} move - The tablebase move
   *   - undefined: No tablebase lookup performed yet
   *   - null: Position is a draw (no winning move)
   *   - string: Best move in algebraic notation (e.g., "e4", "Nf3")
   *
   * @fires stateChange - When tablebase move is updated
   *
   * @remarks
   * This action is typically called by orchestrators after receiving
   * a response from the tablebase API. The three-state pattern allows
   * distinguishing between "not checked", "draw", and "has best move".
   *
   * @example
   * ```typescript
   * // No lookup performed yet
   * store.getState().setTablebaseMove(undefined);
   *
   * // Position is a draw
   * store.getState().setTablebaseMove(null);
   *
   * // Best move found
   * store.getState().setTablebaseMove("Ra8#");
   * ```
   */
  setTablebaseMove: (move: string | null | undefined) => {
    set((state) => {
      state.tablebase.tablebaseMove = move;
    });
  },

  /**
   * Sets the analysis status for tablebase operations
   *
   * @param {AnalysisStatus} status - The analysis status
   *   - "idle": No analysis in progress
   *   - "loading": Analysis is being performed
   *   - "success": Analysis completed successfully
   *   - "error": Analysis failed
   *
   * @fires stateChange - When analysis status changes
   *
   * @remarks
   * This status is used to show loading spinners, handle errors,
   * and coordinate UI state during async tablebase operations.
   *
   * @example
   * ```typescript
   * // Start analysis
   * store.getState().setAnalysisStatus("loading");
   *
   * // Analysis completed
   * store.getState().setAnalysisStatus("success");
   *
   * // Analysis failed
   * store.getState().setAnalysisStatus("error");
   * ```
   */
  setAnalysisStatus: (status: AnalysisStatus) => {
    set((state) => {
      state.tablebase.analysisStatus = status;
    });
  },

  /**
   * Adds a position evaluation to the evaluations array
   *
   * @param {PositionAnalysis} evaluation - The position evaluation to add
   *
   * @fires stateChange - When evaluation is added
   *
   * @remarks
   * This action appends evaluations to maintain a history of analyzed
   * positions. Useful for showing analysis history or implementing
   * client-side caching strategies. The array is not automatically
   * limited in size - consider implementing cleanup if needed.
   *
   * @example
   * ```typescript
   * const evaluation: PositionAnalysis = {
   *   fen: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
   *   evaluation: {
   *     wdl: 1000,
   *     dtz: 5,
   *     outcome: "win",
   *     bestMove: "Ra8#"
   *   },
   *   topMoves: [...],
   *   isTablebasePosition: true
   * };
   *
   * store.getState().addEvaluation(evaluation);
   * ```
   */
  addEvaluation: (evaluation: PositionAnalysis) => {
    set((state) => {
      state.tablebase.evaluations = [...state.tablebase.evaluations, evaluation];
    });
  },

  /**
   * Replaces the entire evaluations array
   *
   * @param {PositionAnalysis[]} evaluations - New evaluations array
   *
   * @fires stateChange - When evaluations are replaced
   *
   * @remarks
   * Use this action to bulk update evaluations, clear history,
   * or restore evaluations from a saved state. This replaces
   * the entire array rather than merging.
   *
   * @example
   * ```typescript
   * // Clear all evaluations
   * store.getState().setEvaluations([]);
   *
   * // Set specific evaluations
   * store.getState().setEvaluations([
   *   evaluation1,
   *   evaluation2,
   *   evaluation3
   * ]);
   *
   * // Limit evaluation history
   * const recentEvals = store.getState().evaluations.slice(-10);
   * store.getState().setEvaluations(recentEvals);
   * ```
   */
  setEvaluations: (evaluations: PositionAnalysis[]) => {
    set((state) => {
      state.tablebase.evaluations = evaluations;
    });
  },

  /**
   * Sets the current position evaluation
   *
   * @param {PositionAnalysis|undefined} evaluation - The current evaluation or undefined
   *
   * @fires stateChange - When current evaluation changes
   *
   * @remarks
   * The current evaluation represents the active position being analyzed
   * or displayed. This is separate from the evaluations array to allow
   * for quick access without searching. Set to undefined when no position
   * is actively selected.
   *
   * @example
   * ```typescript
   * // Set active evaluation
   * store.getState().setCurrentEvaluation(evaluation);
   *
   * // Clear current evaluation
   * store.getState().setCurrentEvaluation(undefined);
   *
   * // Update from evaluations array
   * const latest = store.getState().evaluations[0];
   * store.getState().setCurrentEvaluation(latest);
   * ```
   */
  setCurrentEvaluation: (evaluation: PositionAnalysis | undefined) => {
    set((state) => {
      state.tablebase.currentEvaluation = evaluation;
    });
  },

  /**
   * Clears all tablebase state to initial values
   *
   * @fires stateChange - When state is cleared
   *
   * @remarks
   * Resets all tablebase-related state to initial values. Useful when
   * switching positions, starting a new game, or cleaning up. This is
   * a complete reset - consider if you need to preserve some data.
   *
   * @example
   * ```typescript
   * // Clear all tablebase data
   * store.getState().clearTablebaseState();
   *
   * // Common usage in game reset
   * store.getState().resetGame();
   * store.getState().clearTablebaseState();
   * store.getState().resetTraining();
   * ```
   */
  clearTablebaseState: () => {
    set((state) => {
      Object.assign(state.tablebase, createInitialTablebaseState());
    });
  },
});

/**
 * Legacy slice creator for backwards compatibility
 * @deprecated Use createTablebaseState() and createTablebaseActions() separately
 */
export const createTablebaseSlice: ImmerStateCreator<TablebaseSlice> = (
  set,
) => ({
  ...createTablebaseState(),
  ...createTablebaseActions(set),
});

/**
 * Selector functions for efficient state access
 *
 * @remarks
 * These selectors provide a consistent API for accessing tablebase state
 * and can be used with Zustand's subscribe mechanism for optimal
 * re-renders. Use these instead of inline selectors when possible.
 *
 * The selectors include both direct state access and computed values
 * for common use cases like loading states and move availability.
 *
 * @example
 * ```typescript
 * import { useStore } from '@/store';
 * import { tablebaseSelectors } from '@/store/slices/tablebaseSlice';
 *
 * // In a component
 * const isLoading = useStore(tablebaseSelectors.selectIsLoading);
 * const hasMove = useStore(tablebaseSelectors.selectHasTablebaseMove);
 * const evaluations = useStore(tablebaseSelectors.selectEvaluations);
 * ```
 */
export const tablebaseSelectors = {
  /**
   * Selects the tablebase move
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {string|null|undefined} The tablebase move
   */
  selectTablebaseMove: (state: TablebaseSlice) => state.tablebaseMove,

  /**
   * Selects the analysis status
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {AnalysisStatus} Current analysis status
   */
  selectAnalysisStatus: (state: TablebaseSlice) => state.analysisStatus,

  /**
   * Selects all evaluations
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {PositionAnalysis[]} Array of position evaluations
   */
  selectEvaluations: (state: TablebaseSlice) => state.evaluations,

  /**
   * Selects the current evaluation
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {PositionAnalysis|undefined} Current position evaluation
   */
  selectCurrentEvaluation: (state: TablebaseSlice) => state.currentEvaluation,

  /**
   * Selects whether analysis is currently loading
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {boolean} True if analysis is in progress
   */
  selectIsLoading: (state: TablebaseSlice) =>
    state.analysisStatus === "loading",

  /**
   * Selects whether analysis has completed successfully
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {boolean} True if analysis succeeded
   */
  selectIsSuccess: (state: TablebaseSlice) =>
    state.analysisStatus === "success",

  /**
   * Selects whether analysis has failed
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {boolean} True if analysis failed
   */
  selectIsError: (state: TablebaseSlice) => state.analysisStatus === "error",

  /**
   * Selects whether a tablebase move is available
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {boolean} True if a move is available (not undefined)
   *
   * @remarks
   * Returns true even if move is null (draw), as this still represents
   * a valid tablebase result. Only returns false if undefined.
   */
  selectHasTablebaseMove: (state: TablebaseSlice) =>
    state.tablebaseMove !== undefined,

  /**
   * Selects whether the position is a draw according to tablebase
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {boolean} True if position is a draw (move is null)
   */
  selectIsDrawPosition: (state: TablebaseSlice) => state.tablebaseMove === null,

  /**
   * Selects evaluation for a specific FEN
   * @param {string} fen - The FEN to search for
   * @returns {Function} Selector function that returns the evaluation or undefined
   *
   * @example
   * ```typescript
   * const eval = useStore(
   *   tablebaseSelectors.selectEvaluationByFen("8/8/8/8/8/8/R7/K3k3 w - - 0 1")
   * );
   * ```
   */
  selectEvaluationByFen: (fen: string) => (state: TablebaseSlice) =>
    state.evaluations.find((e) => e.fen === fen),

  /**
   * Selects the number of cached evaluations
   * @param {TablebaseSlice} state - The tablebase slice of the store
   * @returns {number} Count of evaluations in cache
   */
  selectEvaluationCount: (state: TablebaseSlice) => state.evaluations.length,
};
