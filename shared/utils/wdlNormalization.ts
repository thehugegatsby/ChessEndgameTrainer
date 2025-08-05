/**
 * @file WDL (Win/Draw/Loss) normalization utilities
 * @module utils/wdlNormalization
 * 
 * @description
 * Utility functions for normalizing tablebase WDL (Win/Draw/Loss) values
 * from different player perspectives. Handles conversion between API response
 * perspective and training player perspective for accurate move evaluation.
 * 
 * @remarks
 * IMPORTANT: The TablebaseService already normalizes WDL values to the current
 * player's perspective. These utilities are kept for potential future use but
 * are currently not needed in the main application flow since TablebaseService
 * handles perspective correctly.
 * 
 * WARNING: Do not use these functions with values from TablebaseService as it
 * will cause double normalization and incorrect results.
 * 
 * Key functions:
 * - normalizeWdl: Convert WDL values between player perspectives
 * - getTurnFromFen: Extract current player from FEN notation
 * 
 * WDL Values:
 * - +2: Win for current player
 * - 0: Draw position
 * - -2: Loss for current player
 */

import { getLogger } from "../services/logging/Logger";

const logger = getLogger().setContext("wdlNormalization");

/**
 * Normalizes a WDL value from the API's perspective to the training player's perspective
 * 
 * @param {number | null | undefined} wdl - The WDL value from the API (-2, 0, or 2)
 * @param {string} turn - Who is to move ('w' for white, 'b' for black)
 * @param {'white' | 'black'} trainingSide - Which side the player is training as
 * @returns {number | null | undefined} The normalized WDL value from the training player's perspective
 * 
 * @description
 * Converts tablebase WDL values between different player perspectives.
 * The API returns WDL from the current player's perspective (player to move),
 * but we need it from the training player's perspective for consistent evaluation.
 * 
 * @remarks
 * Normalization logic:
 * - For white training: Invert WDL when black is to move
 * - For black training: Invert WDL when white is to move
 * - Draw positions (0) remain unchanged
 * - Handles JavaScript -0 edge case
 * 
 * @example
 * ```typescript
 * // White is training, white to move, white wins
 * normalizeWdl(2, 'w', 'white') // returns 2
 * 
 * // White is training, black to move, black loses (white wins)
 * normalizeWdl(-2, 'b', 'white') // returns 2
 * 
 * // Black is training, white to move, white wins (black loses)
 * normalizeWdl(2, 'w', 'black') // returns -2
 * ```
 */
export function normalizeWdl(
  wdl: number | null | undefined,
  turn: string,
  trainingSide: "white" | "black",
): number | null | undefined {
  if (wdl === null || wdl === undefined) {
    return wdl;
  }

  // Validate turn
  if (turn !== "w" && turn !== "b") {
    logger.warn(
      `Invalid turn value: ${turn}. Expected 'w' or 'b'. Returning unchanged WDL.`,
    );
    return wdl;
  }

  // For white training perspective:
  // - If white to move: WDL stays the same (already from white's perspective)
  // - If black to move: WDL needs to be inverted (convert from black's to white's perspective)
  if (trainingSide === "white") {
    const result = turn === "b" ? -wdl : wdl;
    // Handle -0 edge case (JavaScript quirk)
    return result === 0 ? 0 : result;
  } else {
    // For black training perspective:
    // - If black to move: WDL stays the same (already from black's perspective)
    // - If white to move: WDL needs to be inverted (convert from white's to black's perspective)
    const result = turn === "w" ? -wdl : wdl;
    // Handle -0 edge case (JavaScript quirk)
    return result === 0 ? 0 : result;
  }
}

/**
 * Extracts the player to move from a FEN string
 * 
 * @param {string} fen - The FEN string to parse
 * @returns {'w' | 'b' | null} 'w' for white, 'b' for black, or null if invalid
 * 
 * @description
 * Parses the active color field from a FEN string, which is the second
 * space-separated field indicating whose turn it is to move.
 * 
 * @example
 * ```typescript
 * getTurnFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') // 'w'
 * getTurnFromFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1') // 'b'
 * getTurnFromFen('invalid-fen') // null
 * ```
 */
export function getTurnFromFen(fen: string): "w" | "b" | null {
  const parts = fen.split(" ");
  const turn = parts[1];

  if (turn === "w" || turn === "b") {
    return turn;
  }

  return null;
}
