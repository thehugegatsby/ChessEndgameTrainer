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
 * @param fen - Current position in FEN notation
 * @param options - Analysis options (kept for compatibility)
 * @param options.depth
 * @param options.timeout
 * @returns Thunk function for Zustand store
 */
export /**
 *
 */
const requestTablebaseMove =
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
 * Request tablebase to evaluate current position
 * @param fen - Current position in FEN notation
 * @param options - Analysis options (kept for compatibility)
 * @param options.depth
 * @param options.timeout
 * @returns Thunk function for Zustand store
 */
export /**
 *
 */
const requestPositionEvaluation =
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
 * Stop current tablebase analysis
 * @returns Thunk function for Zustand store
 */
export /**
 *
 */
const stopTablebaseAnalysis =
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
 * Reset tablebase analysis state
 * @returns Thunk function for Zustand store
 * @deprecated No tablebase to terminate anymore - keeping for compatibility
 */
export /**
 *
 */
const resetTablebaseState =
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
