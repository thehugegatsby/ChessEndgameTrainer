/**
 * @file Request position evaluation orchestrator
 * @module store/orchestrators/requestPositionEvaluation
 * @description Orchestrates position evaluation requests from the Lichess tablebase API.
 * This orchestrator handles fetching evaluation data for a specific chess position
 * and updating the relevant state slices.
 *
 * @example
 * ```typescript
 * // In the root store
 * import { requestPositionEvaluation } from './orchestrators/requestPositionEvaluation';
 *
 * const store = create<RootState>()((...args) => ({
 *   ...createTablebaseSlice(...args),
 *   // ... other slices
 *   // Orchestrators as actions
 *   requestPositionEvaluation: (fen) => requestPositionEvaluation(args[2], fen),
 * }));
 * ```
 */

import type { StoreApi, OrchestratorFunction } from "./types";
import type { PositionAnalysis } from "@shared/types/evaluation";
import { analysisService, type AnalysisResult } from "@shared/services/AnalysisService";
import { ErrorService } from "@shared/services/ErrorService";
import { validateAndSanitizeFen } from "@shared/utils/fenValidator";

/**
 * Requests position evaluation from the tablebase API
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @param {string} [fen] - Optional FEN to evaluate (defaults to current position)
 * @returns {Promise<void>}
 *
 * @fires setAnalysisStatus - Updates analysis status during the request
 * @fires setCurrentEvaluation - Sets the evaluation for the position
 * @fires addEvaluation - Adds evaluation to history/cache
 * @fires showToast - Shows error messages if request fails
 *
 * @remarks
 * This orchestrator performs the following steps:
 * 1. Validates the FEN (uses current position if not provided)
 * 2. Checks if evaluation is already cached
 * 3. Sets loading status
 * 4. Requests full position analysis from AnalysisService
 * 5. Updates tablebase state with the evaluation
 * 6. Caches the result for future use
 * 7. Handles errors gracefully with user feedback
 *
 * The orchestrator leverages AnalysisService which combines:
 * - Basic evaluation (WDL, DTZ)
 * - Top moves with variations
 * - Formatted analysis for UI display
 *
 * @example
 * ```typescript
 * // Evaluate current position
 * await store.getState().requestPositionEvaluation();
 *
 * // Evaluate specific position
 * await store.getState().requestPositionEvaluation(
 *   "8/8/8/8/8/8/R7/K3k3 w - - 0 1"
 * );
 *
 * // The evaluation will be available in:
 * const eval = store.getState().currentEvaluation;
 * const isInTablebase = eval?.isTablebasePosition;
 * ```
 */
export const requestPositionEvaluation: OrchestratorFunction<
  [fen?: string],
  Promise<void>
> = async (api, fen) => {
  const state = api.getState();

  // Step 1: Determine FEN to evaluate
  const fenToEvaluate = fen || state.currentFen;

  if (!fenToEvaluate) {
    console.warn(
      "requestPositionEvaluation: No FEN provided and no current position",
    );
    state.showToast("Keine Position zum Analysieren", "error");
    return;
  }

  // Validate FEN
  const validationResult = validateAndSanitizeFen(fenToEvaluate);
  if (!validationResult.isValid || !validationResult.sanitized) {
    console.error("Invalid FEN:", validationResult.errors);
    state.showToast("Ungültige Position", "error");
    return;
  }

  const sanitizedFen = validationResult.sanitized;

  try {
    // Step 2: Check cache first
    const cachedEval = state.evaluations.find((e) => e.fen === sanitizedFen);
    if (cachedEval) {
      console.info("Using cached evaluation for:", sanitizedFen);
      state.setCurrentEvaluation(cachedEval);
      state.setAnalysisStatus("success");
      return;
    }

    // Step 3: Set loading state
    state.setAnalysisStatus("loading");
    state.setLoading("analysis", true);

    // Step 4: Request analysis from service
    const analysis = await analysisService.getPositionAnalysis(sanitizedFen);

    // Step 5: Handle unavailable positions
    if (!analysis || !analysis.evaluation) {
      // Not an error - position just not in tablebase
      state.setCurrentEvaluation(undefined);
      state.setAnalysisStatus("success");
      console.info("Position not in tablebase:", sanitizedFen);
      return;
    }

    // Create PositionAnalysis from result
    const positionAnalysis = analysis.evaluation;

    // Step 6: Update state with evaluation
    state.setCurrentEvaluation(positionAnalysis);
    state.addEvaluation(positionAnalysis); // Cache for future use

    // Also update tablebase move if this is the current position
    if (sanitizedFen === state.currentFen) {
      updateTablebaseMoveFromAnalysis(api, analysis);
    }

    // Step 7: Success
    state.setAnalysisStatus("success");

    // Log successful evaluation
    console.info("Position evaluated:", {
      fen: sanitizedFen,
      evaluation: positionAnalysis.evaluation,
      mateInMoves: positionAnalysis.mateInMoves,
    });
  } catch (error) {
    // Step 8: Error handling
    console.error("Error evaluating position:", error);
    state.setAnalysisStatus("error");

    const userMessage = ErrorService.handleUIError(
      error as Error,
      "RequestPositionEvaluation",
      {
        action: "orchestrate",
      },
    );

    state.showToast(userMessage, "error");
  } finally {
    state.setLoading("analysis", false);
  }
};

/**
 * Updates tablebase move state based on position analysis
 *
 * @param {StoreApi} api - Store API
 * @param {PositionAnalysis} analysis - The position analysis
 *
 * @private
 *
 * @remarks
 * This helper function extracts the best move from the analysis
 * and updates the tablebase move state following the three-state pattern:
 * - No moves or draw: null
 * - Has winning/losing move: the move string
 * - Not in tablebase: undefined (unchanged)
 */
function updateTablebaseMoveFromAnalysis(
  api: StoreApi,
  analysis: AnalysisResult,
): void {
  const state = api.getState();

  if (!analysis.evaluation.tablebase?.isTablebasePosition) {
    // Don't change tablebase move for non-tablebase positions
    return;
  }

  if (!analysis.evaluation.tablebase?.topMoves || analysis.evaluation.tablebase.topMoves.length === 0) {
    // No moves available - position is terminal or draw
    state.setTablebaseMove(null);
    return;
  }

  // Check if position is a draw (WDL = 0)
  const bestMove = analysis.evaluation.tablebase.topMoves[0];
  if (bestMove.wdl === 0) {
    state.setTablebaseMove(null); // Draw position
  } else {
    state.setTablebaseMove(bestMove.san); // Best move
  }
}

/**
 * Checks if a position evaluation is stale and needs refresh
 *
 * @param {PositionAnalysis} evaluation - The evaluation to check
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
 * @returns {boolean} True if evaluation should be refreshed
 *
 * @remarks
 * This is a utility function that can be used to implement
 * cache invalidation strategies. Currently not used but provided
 * for future enhancements.
 *
 * @example
 * ```typescript
 * const eval = state.evaluations.find(e => e.fen === fen);
 * if (eval && !isEvaluationStale(eval)) {
 *   // Use cached evaluation
 * } else {
 *   // Request fresh evaluation
 * }
 * ```
 */
export function isEvaluationStale(
  _evaluation: PositionAnalysis,
  _maxAgeMs: number = 5 * 60 * 1000,
): boolean {
  // For now, always refresh position analysis to get latest data
  // TODO: Add timestamp to PositionAnalysis if caching is needed
  return true;
}
