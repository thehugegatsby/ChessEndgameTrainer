/**
 * @file Move validation logic for handlePlayerMove orchestrator
 * @module store/orchestrators/handlePlayerMove/move.validation
 *
 * @description
 * Contains all validation logic for chess moves including context validation
 * and move execution with chess.js.
 */

import type { Move as ChessJsMove } from "chess.js";
import type { MoveContext, MoveExecutionResult } from "./move.types";

/**
 * Validates the context for making a move
 *
 * @param {MoveContext} context - Current game context
 * @returns {boolean} Whether the context is valid for moves
 */
export function validateMoveContext(context: MoveContext): boolean {
  if (!context.game) {
    context.showToast?.("Kein Spiel aktiv", "error");
    return false;
  }

  if (!context.currentPosition) {
    context.showToast?.("Keine Position geladen", "error");
    return false;
  }

  return true;
}

/**
 * Executes a move with validation
 *
 * @param {MoveContext} context - Current game context
 * @param {ChessJsMove | {from: string; to: string; promotion?: string} | string} move - The move to make
 * @returns {Promise<MoveExecutionResult | null>} Move result or null if invalid
 */
export async function executeMoveWithValidation(
  context: MoveContext & {
    makeMove: (move: any) => any;
    showToast: (
      message: string,
      type: "error" | "warning" | "success" | "info",
      duration?: number,
    ) => void;
  },
  move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
): Promise<MoveExecutionResult | null> {
  const fenBefore = context.currentFen;
  const validatedMove = context.makeMove(move);

  if (!validatedMove) {
    context.showToast("Ungültiger Zug", "error");
    return null;
  }

  // Get fenAfter from the validatedMove object, not from context
  // because context.currentFen is a snapshot and won't update
  const fenAfter = validatedMove.fenAfter;
  return { fenBefore, fenAfter, validatedMove };
}
