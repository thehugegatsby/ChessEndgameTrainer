/**
 * @file Training Actions - Async Tablebase Operations
 * @description Zustand thunk functions for chess tablebase operations
 *
 * PRINCIPLES:
 * - Async thunks for tablebase communication
 * - Clean separation from store state
 * - Error handling for tablebase failures
 * - Stateless tablebase calls (pass FEN)
 */

import { tablebaseService } from "../services/TablebaseService";
import { moveStrategyService } from "../services/MoveStrategyService";
import { formatPositionAnalysis } from "../utils/positionAnalysisFormatter";
import { getLogger } from "../services/logging";
import type { TrainingState } from "./types";

const logger = getLogger().setContext("TrainingActions");

/**
 * Request tablebase to find best move for current position
 * Uses MoveStrategyService to find the longest resistance move (best defensive play)
 *
 * @param {string} fen - Current position in FEN notation
 * @param {Object} [options] - Analysis options (kept for backward compatibility)
 * @param {number} [options.depth] - Unused - tablebase has perfect play
 * @param {number} [options.timeout] - Unused - tablebase queries are fast
 * @returns {Function} Thunk function that updates Zustand store with tablebase move
 * @throws {Error} When no tablebase moves are available for the position
 *
 * @remarks
 * This is an async thunk action for Zustand. It:
 * 1. Sets analysisStatus to 'loading'
 * 2. Queries tablebase for best defensive move
 * 3. Updates store with move (UCI format) and sets status to 'success'
 * 4. On error, sets status to 'error' and throws
 *
 * @example
 * // In a component or another action
 * const move = await requestTablebaseMove(currentFen)(getState, setState);
 * console.log('Best move:', move); // e.g., "e2e4"
 */
export const requestTablebaseMove =
  (fen: string, options?: { depth?: number; timeout?: number }) =>
  async (
    _get: () => { training: TrainingState },
    set: (partial: any) => void,
  ) => {
    try {
      logger.info("[TRACE] requestTablebaseMove called", { fen, options });

      // Set analysis loading state
      set((state: any) => ({
        training: {
          ...state.training,
          analysisStatus: "loading",
        },
      }));

      // Get the best defensive move using the strategy service
      const move = await moveStrategyService.getLongestResistanceMove(fen);

      if (!move) {
        logger.warn("[TRACE] No tablebase moves available");
        throw new Error("No tablebase moves available for this position");
      }

      logger.info("[TRACE] Best move received from MoveStrategyService", {
        move,
        fen,
      });

      // Update store with tablebase move
      set((state: any) => ({
        training: {
          ...state.training,
          tablebaseMove: move,
          analysisStatus: "success",
        },
      }));

      logger.info("[TRACE] Returning move from requestTablebaseMove", { move });
      return move;
    } catch (error) {
      logger.error("Tablebase move request failed", error);

      // Update store with error state
      set((state: any) => ({
        training: {
          ...state.training,
          analysisStatus: "error",
        },
      }));

      throw new Error(`Tablebase move failed: ${error}`);
    }
  };

/**
 * Request tablebase evaluation for a chess position
 * Provides perfect endgame evaluation for positions with ≤7 pieces
 *
 * @param {string} fen - Position to evaluate in FEN notation
 * @param {Object} [options] - Analysis options (kept for backward compatibility)
 * @param {number} [options.depth] - Unused - tablebase provides perfect evaluation
 * @param {number} [options.timeout] - Unused - tablebase queries are fast
 * @returns {Function} Thunk function that updates store with evaluation
 * @throws {Error} When tablebase evaluation is not available
 *
 * @remarks
 * Returns evaluation data including:
 * - Score: Numeric evaluation (100 = white winning, -100 = black winning, 0 = draw)
 * - Mate detection: DTZ (Distance to Zeroing) for winning positions
 * - WDL values: Win/Draw/Loss classification
 * - Category: Human-readable outcome (win/draw/loss/cursed-win/blessed-loss)
 *
 * @example
 * const evalData = await requestPositionEvaluation(fen)(getState, setState);
 * // Returns: {
 * //   evaluation: 100,
 * //   mateInMoves: 15,
 * //   tablebase: {
 * //     isTablebasePosition: true,
 * //     wdlAfter: 2,
 * //     category: 'win',
 * //     dtz: 15
 * //   }
 * // }
 */
export const requestPositionEvaluation =
  (fen: string, options?: { depth?: number; timeout?: number }) =>
  async (
    _get: () => { training: TrainingState },
    set: (partial: any) => void,
  ) => {
    try {
      logger.debug("Requesting position evaluation", { fen, options });

      // Set analyzing state
      set((state: any) => ({
        training: {
          ...state.training,
          analysisStatus: "loading",
        },
      }));

      // Get evaluation from tablebase
      const tablebaseResult = await tablebaseService.getEvaluation(fen);

      if (!tablebaseResult.isAvailable || !tablebaseResult.result) {
        logger.warn("No tablebase evaluation available");
        throw new Error("No tablebase evaluation available for this position");
      }

      // Format for display
      const displayData = formatPositionAnalysis(tablebaseResult.result);

      logger.debug("Position evaluation received", {
        wdl: tablebaseResult.result.wdl,
        dtz: tablebaseResult.result.dtz,
      });

      // Update store with evaluation
      set((state: any) => ({
        training: {
          ...state.training,
          currentEvaluation: {
            evaluation: displayData.score,
            mate:
              displayData.isWin && tablebaseResult.result?.dtz
                ? Math.abs(tablebaseResult.result.dtz)
                : null,
            depth: 0, // No depth for tablebase
          },
          analysisStatus: "success",
        },
      }));

      return {
        evaluation: displayData.score,
        mateInMoves:
          displayData.isWin && tablebaseResult.result?.dtz
            ? Math.abs(tablebaseResult.result.dtz)
            : undefined,
        tablebase: {
          isTablebasePosition: true,
          wdlAfter: tablebaseResult.result?.wdl ?? 0,
          category: (tablebaseResult.result?.category ?? "draw") as
            | "win"
            | "draw"
            | "loss",
          dtz: tablebaseResult.result?.dtz ?? undefined,
        },
      };
    } catch (error) {
      logger.error("Position evaluation failed", error);

      // Update store with error state
      set((state: any) => ({
        training: {
          ...state.training,
          analysisStatus: "error",
        },
      }));

      throw new Error(`Position evaluation failed: ${error}`);
    }
  };

/**
 * Stop current tablebase analysis and reset to idle state
 *
 * @returns {Function} Thunk function that sets analysisStatus to 'idle'
 *
 * @remarks
 * Since tablebase queries are near-instant, this is mainly used for:
 * - Canceling pending requests during component unmount
 * - Resetting state after errors
 * - User-initiated analysis cancellation
 *
 * @example
 * // In a component cleanup
 * useEffect(() => {
 *   return () => {
 *     stopTablebaseAnalysis()(getState, setState);
 *   };
 * }, []);
 */
export const stopTablebaseAnalysis =
  () =>
  async (
    _get: () => { training: TrainingState },
    set: (partial: any) => void,
  ) => {
    try {
      logger.debug("Stopping tablebase analysis");

      // Update store state
      set((state: any) => ({
        training: {
          ...state.training,
          analysisStatus: "idle",
        },
      }));
    } catch (error) {
      logger.error("Failed to stop tablebase analysis", error);
    }
  };

/**
 * Reset tablebase analysis state to initial values
 *
 * @returns {Function} Thunk function that clears tablebase-related state
 * @deprecated No local engine to terminate anymore - kept for backward compatibility
 *
 * @remarks
 * Resets:
 * - tablebaseMove to undefined (no move selected)
 * - analysisStatus to 'idle'
 *
 * This function exists for compatibility with old engine-based code.
 * In the tablebase-only architecture, there's no engine process to terminate.
 *
 * @example
 * // Reset after game completion
 * resetTablebaseState()(getState, setState);
 */
export const resetTablebaseState =
  () =>
  async (
    _get: () => { training: TrainingState },
    set: (partial: any) => void,
  ) => {
    logger.info("resetTablebaseState called - resetting analysis state");

    // Reset tablebase state in store
    set((state: any) => ({
      training: {
        ...state.training,
        tablebaseMove: undefined,
        analysisStatus: "idle",
      },
    }));
  };
