/**
 * Chess Terminology and Abbreviations
 *
 * This file documents commonly used chess terms and abbreviations throughout the codebase.
 * These are standard chess/tablebase terminology used by engines and tablebase APIs.
 */

/**
 * WDL - Win/Draw/Loss
 *
 * A numerical evaluation from the perspective of the side to move:
 * - Positive values (typically +1 or +2): Win
 * - Zero (0): Draw
 * - Negative values (typically -1 or -2): Loss
 *
 * Used by tablebases to indicate the theoretical outcome with perfect play.
 * Different from centipawn evaluation which measures advantage magnitude.
 */
export type WDL = number;

/**
 * DTZ - Distance to Zeroing
 *
 * The number of half-moves (plies) until a capture or pawn move occurs,
 * which resets the 50-move rule counter. Used in tablebase positions to
 * indicate how many moves until the position simplifies.
 *
 * - Positive DTZ: Number of moves to maintain/achieve a win
 * - Zero DTZ: Immediate capture/pawn move available
 * - Negative DTZ: Number of moves to defend before losing
 * - null: Position is a draw or no tablebase data available
 */
export type DTZ = number | null;

/**
 * DTM - Distance to Mate
 *
 * The number of half-moves (plies) until checkmate with perfect play.
 * Only relevant in winning positions.
 *
 * - Positive: Moves until the winning side delivers mate
 * - null: Position is not a forced mate (draw or loss)
 *
 * Note: DTM is often less practical than DTZ because it doesn't account
 * for the 50-move rule, which can make some "mates" theoretical only.
 */
export type DTM = number | null;

/**
 * Common Chess Notation Terms:
 *
 * - FEN: Forsyth-Edwards Notation - Standard notation for chess positions
 * - SAN: Standard Algebraic Notation - Human-readable move notation (e.g., "Nf3", "e4")
 * - UCI: Universal Chess Interface - Computer-readable move notation (e.g., "e2e4", "g1f3")
 * - PGN: Portable Game Notation - Standard format for chess games
 * - EPD: Extended Position Description - FEN with additional tags
 */

/**
 * Tablebase-Specific Terms:
 *
 * - Tablebase: Precomputed database of all positions with N or fewer pieces
 * - Syzygy: Modern tablebase format used by Lichess (supports up to 7 pieces)
 * - Endgame: Position with few pieces remaining (typically ≤7 for tablebase coverage)
 * - Principal Variation (PV): Best sequence of moves from current position
 */

/**
 * Move Quality Classifications:
 *
 * Based on how much a move changes the WDL or evaluation:
 * - Excellent/Best: Maintains winning advantage or finds only drawing/winning move
 * - Good: Slight inaccuracy but maintains advantage
 * - Inaccuracy: Minor mistake that reduces advantage
 * - Mistake: Significant error that changes evaluation considerably
 * - Blunder: Severe error that changes the game outcome (win→draw, draw→loss)
 */
