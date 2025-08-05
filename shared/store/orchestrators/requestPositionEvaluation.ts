/**
 * @file Request position evaluation orchestrator
 * @module store/orchestrators/requestPositionEvaluation
 *
 * @description
 * Orchestrates position evaluation requests from the Lichess tablebase API.
 * This orchestrator handles fetching evaluation data for a specific chess position
 * and updating the relevant state slices.
 *
 * @remarks
 * Key features:
 * - FEN validation and sanitization
 * - Result caching to minimize API calls
 * - Comprehensive position analysis via AnalysisService
 * - Loading state management
 * - Error handling with user feedback
 * - Updates both evaluation and tablebase move states
 *
 * The orchestrator leverages the AnalysisService which provides:
 * - WDL (Win/Draw/Loss) evaluation
 * - DTZ (Distance to Zero) metrics
 * - Top moves with variations
 * - UI-ready formatted analysis
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
import {
  analysisService,
  type AnalysisResult,
} from "@shared/services/AnalysisService";
import { ErrorService } from "@shared/services/ErrorService";
import { validateAndSanitizeFen } from "@shared/utils/fenValidator";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("requestPositionEvaluation");

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
    logger.warn("No FEN provided and no current position");
    state.showToast("Keine Position zum Analysieren", "error");
    return;
  }

  // Validate FEN
  const validationResult = validateAndSanitizeFen(fenToEvaluate);
  if (!validationResult.isValid || !validationResult.sanitized) {
    logger.error("Invalid FEN", { errors: validationResult.errors });
    state.showToast("Ungültige Position", "error");
    return;
  }

  const sanitizedFen = validationResult.sanitized;

  try {
    // Step 2: Check cache first
    const cachedEval = state.evaluations.find((e) => e.fen === sanitizedFen);
    if (cachedEval) {
      logger.info("Using cached evaluation", { fen: sanitizedFen });
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
      logger.info("Position not in tablebase", { fen: sanitizedFen });
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
    logger.info("Position evaluated", {
      fen: sanitizedFen,
      evaluation: positionAnalysis.evaluation,
      mateInMoves: positionAnalysis.mateInMoves,
    });
  } catch (error) {
    // Step 8: Error handling
    logger.error("Error evaluating position", error);
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
 * @param {StoreApi} api - Store API for state access
 * @param {AnalysisResult} analysis - The position analysis result
 *
 * @private
 *
 * @description
 * Extracts the best move from analysis and updates tablebase state
 * according to the three-state pattern used throughout the app.
 *
 * @remarks
 * This helper function extracts the best move from the analysis
 * and updates the tablebase move state following the three-state pattern:
 * - No moves or draw: null
 * - Has winning/losing move: the move string
 * - Not in tablebase: undefined (unchanged)
 *
 * Only updates state for positions that are actually in the tablebase.
 *
 * @example
 * ```typescript
 * // Called internally after successful analysis
 * updateTablebaseMoveFromAnalysis(api, {
 *   evaluation: {
 *     tablebase: {
 *       isTablebasePosition: true,
 *       topMoves: [{ san: "Ra8#", wdl: 1000 }]
 *     }
 *   }
 * });
 * ```
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

  if (
    !analysis.evaluation.tablebase?.topMoves ||
    analysis.evaluation.tablebase.topMoves.length === 0
  ) {
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
 * @param {number} [maxAgeMs=300000] - Maximum age in milliseconds (default: 5 minutes)
 * @returns {boolean} True if evaluation should be refreshed
 *
 * @description
 * Utility function for cache invalidation strategies. Currently always
 * returns true as caching is handled at the TablebaseService level.
 *
 * @remarks
 * This is a utility function that can be used to implement
 * cache invalidation strategies. Currently not used but provided
 * for future enhancements.
 *
 * In the current implementation, this always returns true because:
 * - TablebaseService handles its own LRU cache
 * - Tablebase data doesn't change (it's precomputed)
 * - Fresh data ensures UI consistency
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
 *
 * @todo Consider implementing time-based cache invalidation if needed
 */
export function isEvaluationStale(
  _evaluation: PositionAnalysis,
  _maxAgeMs: number = 5 * 60 * 1000,
): boolean {
  // Always refresh position analysis to get latest data
  // Note: Caching is handled at the TablebaseService level
  return true;
}
