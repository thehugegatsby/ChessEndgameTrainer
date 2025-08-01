/**
 * @fileoverview Training Actions - Async Engine Operations
 * @description Zustand thunk functions for chess engine operations
 *
 * PRINCIPLES:
 * - Async thunks for engine communication
 * - Clean separation from store state
 * - Error handling for engine failures
 * - Stateless engine calls (pass FEN)
 */

import { tablebaseService } from "../services/TablebaseService";
import { formatPositionAnalysis } from "../utils/positionAnalysisFormatter";
import { getLogger } from "../services/logging";
import type { TrainingState } from "./types";

const logger = getLogger().setContext("TrainingActions");

/**
 * Request engine to find best move for current position
 * @param fen - Current position in FEN notation
 * @param options - Engine analysis options
 * @returns Thunk function for Zustand store
 */
export const requestEngineMove =
  (fen: string, options?: { depth?: number; timeout?: number }) =>
  async (
    _get: () => { training: TrainingState },
    set: (partial: any) => void,
  ) => {
    try {
      logger.info("[TRACE] requestEngineMove called", { fen, options });

      // Set engine thinking state
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: true,
          engineStatus: "analyzing",
        },
      }));

      // Get best move from tablebase
      const topMoves = await tablebaseService.getTopMoves(fen, 1);

      if (
        !topMoves.isAvailable ||
        !topMoves.moves ||
        topMoves.moves.length === 0
      ) {
        logger.warn("[TRACE] No tablebase moves available");
        throw new Error("No tablebase moves available for this position");
      }

      const move = topMoves.moves[0].uci;

      logger.info("[TRACE] Best move received from TablebaseService", {
        move,
        wdl: topMoves.moves[0].wdl,
        dtz: topMoves.moves[0].dtz,
        fen,
      });

      // Update store with engine move
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: false,
          engineMove: move,
          engineStatus: "ready",
        },
      }));

      logger.info("[TRACE] Returning move from requestEngineMove", { move });
      return move;
    } catch (error) {
      logger.error("Engine move request failed", error);

      // Update store with error state
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: false,
          engineStatus: "error",
        },
      }));

      throw new Error(`Engine move failed: ${error}`);
    }
  };

/**
 * Request engine to evaluate current position
 * @param fen - Current position in FEN notation
 * @param options - Engine analysis options
 * @returns Thunk function for Zustand store
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
          engineStatus: "analyzing",
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
          engineStatus: "ready",
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
          engineStatus: "error",
        },
      }));

      throw new Error(`Position evaluation failed: ${error}`);
    }
  };

/**
 * Stop current engine analysis
 * @returns Thunk function for Zustand store
 */
export const stopEngineAnalysis =
  () =>
  async (
    _get: () => { training: TrainingState },
    set: (partial: any) => void,
  ) => {
    try {
      logger.debug("Stopping engine analysis");

      // SimpleEngine doesn't have stop method, just update state
      // Update store state
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: false,
          engineStatus: "ready",
        },
      }));
    } catch (error) {
      logger.error("Failed to stop engine analysis", error);
    }
  };

/**
 * Terminate engine and clean up resources
 * @returns Thunk function for Zustand store
 * @deprecated No engine to terminate anymore - keeping for compatibility
 */
export const terminateEngine =
  () =>
  async (
    _get: () => { training: TrainingState },
    set: (partial: any) => void,
  ) => {
    logger.info("terminateEngine called - no-op (engine removed)");

    // Reset engine state in store
    set((state: any) => ({
      training: {
        ...state.training,
        isEngineThinking: false,
        engineMove: undefined,
        engineStatus: "idle",
      },
    }));
  };
