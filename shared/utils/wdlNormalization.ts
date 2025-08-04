/**
 * WDL (Win/Draw/Loss) normalization utilities
 *
 * NOTE: The TablebaseService already normalizes WDL values to the current player's perspective.
 * These utilities are kept for potential future use but are currently not needed
 * in the main application flow since TablebaseService handles perspective correctly.
 *
 * IMPORTANT: Do not use these functions with values from TablebaseService as it will cause
 * double normalization and incorrect results.
 */

import { getLogger } from "../services/logging/Logger";

const logger = getLogger().setContext("wdlNormalization");

/**
 * Normalizes a WDL value from the API's perspective (player to move)
 * to the training player's perspective
 *
 * @param wdl - The WDL value from the API (-2, 0, or 2)
 * @param turn - Who is to move ('w' for white, 'b' for black)
 * @param trainingSide - Which side the player is training as
 * @returns The normalized WDL value from the training player's perspective
 *
 * @example
 * // White is training, white to move, white wins
 * normalizeWdl(2, 'w', 'white') // returns 2
 *
 * // White is training, black to move, black loses (white wins)
 * normalizeWdl(-2, 'b', 'white') // returns 2
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
 * @param fen - The FEN string
 * @returns 'w' for white, 'b' for black, or null if invalid
 */
export function getTurnFromFen(fen: string): "w" | "b" | null {
  const parts = fen.split(" ");
  const turn = parts[1];

  if (turn === "w" || turn === "b") {
    return turn;
  }

  return null;
}
