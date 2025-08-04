/**
 * Simple Tablebase Service - Direct Lichess API Integration
 * No overengineering, just what we need.
 */

import { validateAndSanitizeFen } from "../utils/fenValidator";
import { getLogger } from "../services/logging";
import { APP_CONFIG } from "../../config/constants";

const logger = getLogger().setContext("TablebaseService");

/**
 * Represents a single chess move with its tablebase evaluation
 * @interface TablebaseMove
 * @property {string} uci - Move in UCI format (e.g., "e2e4", "a7a8q" for promotion)
 * @property {string} san - Move in Standard Algebraic Notation (e.g., "e4", "axb8=Q+")
 * @property {number} wdl - Win/Draw/Loss value from the perspective of the side to move
 *                          2 = win, 1 = cursed-win (win but drawn with 50-move rule)
 *                          0 = draw, -1 = blessed-loss (loss but drawn with 50-move rule)
 *                          -2 = loss
 * @property {number|null} dtz - Distance to Zeroing of the 50-move counter
 *                               Positive = moves until pawn move or capture
 *                               Negative = opponent has the zeroing move
 *                               null = not available
 * @property {number|null} dtm - Distance to Mate in optimal play
 *                               Only available for mate positions
 *                               null = not a mate or not available
 * @property {"win"|"draw"|"loss"|"cursed-win"|"blessed-loss"} category - Human-readable outcome
 */
export interface TablebaseMove {
  uci: string; // UCI format (e.g., "a1a8")
  san: string; // SAN format (e.g., "Ra8+")
  wdl: number; // Win/Draw/Loss after this move
  dtz: number | null; // Distance to Zeroing
  dtm: number | null; // Distance to Mate
  category: "win" | "draw" | "loss" | "cursed-win" | "blessed-loss";
}

/**
 * Represents the tablebase evaluation of a position
 * @interface TablebaseResult
 * @property {number} wdl - Win/Draw/Loss evaluation from White's perspective
 *                          2 = White wins, 1 = White cursed-win
 *                          0 = Draw, -1 = White blessed-loss, -2 = White loses
 * @property {number|null} dtz - Distance to Zeroing the 50-move counter
 * @property {number|null} dtm - Distance to Mate (only for mate positions)
 * @property {"win"|"draw"|"loss"|"cursed-win"|"blessed-loss"} category - Outcome category
 * @property {boolean} precise - Whether DTZ value is precise (not affected by 50-move rule)
 * @property {string} evaluation - Human-readable evaluation in German
 */
export interface TablebaseResult {
  wdl: number; // Win/Draw/Loss: 2=win, 1=cursed win, 0=draw, -1=blessed loss, -2=loss
  dtz: number | null; // Distance to Zeroing move
  dtm: number | null; // Distance to Mate (for compatibility)
  category: "win" | "draw" | "loss" | "cursed-win" | "blessed-loss";
  precise: boolean; // Whether the result is precise
  evaluation: string; // Human readable text
}

/**
 * Wrapper for tablebase API responses with availability status
 * @interface TablebaseEvaluation
 * @property {boolean} isAvailable - Whether tablebase data exists for this position
 * @property {TablebaseResult} [result] - The evaluation result if available
 * @property {string} [error] - Error message if evaluation failed
 */
export interface TablebaseEvaluation {
  isAvailable: boolean;
  result?: TablebaseResult;
  error?: string;
}

/**
 * Result of querying multiple moves from tablebase
 * @interface TablebaseMovesResult
 * @property {boolean} isAvailable - Whether tablebase data exists
 * @property {TablebaseMove[]} [moves] - Array of moves with evaluations, sorted by quality
 * @property {string} [error] - Error message if query failed
 */
export interface TablebaseMovesResult {
  isAvailable: boolean;
  moves?: TablebaseMove[];
  error?: string;
}

/**
 * Internal cache entry for storing tablebase results
 * @interface CacheEntry
 * @property {TablebaseResult} result - The cached evaluation result
 * @property {number} expiry - Timestamp when this cache entry expires
 */
interface CacheEntry {
  result: TablebaseResult;
  expiry: number;
}

/**
 * Simple Tablebase Service - no adapters, no interfaces, just works
 */
class TablebaseService {
  private cache = new Map<string, CacheEntry>();
  private readonly maxPieces = 7;
  private readonly cacheTtl = 300000; // 5 minutes

  /**
   * Get tablebase evaluation for a chess position
   * Queries the Lichess tablebase API for positions with 7 or fewer pieces
   *
   * @param {string} fen - Position in Forsyth-Edwards Notation
   * @returns {Promise<TablebaseEvaluation>} Evaluation result with WDL, DTZ, DTM values
   * @throws Never throws - returns error in result object
   *
   * @example
   * const eval = await tablebaseService.getEvaluation("K7/P7/k7/8/8/8/8/8 w - - 0 1");
   * if (eval.isAvailable && eval.result) {
   *   console.log(`WDL: ${eval.result.wdl}, DTZ: ${eval.result.dtz}`);
   * }
   */
  async getEvaluation(fen: string): Promise<TablebaseEvaluation> {
    // CRITICAL FIX: Validate FEN to prevent security risks
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      return {
        isAvailable: false,
        error: `Invalid FEN: ${validation.errors.join(", ")}`,
      };
    }

    const sanitizedFen = validation.sanitized;

    // Quick piece count check using sanitized FEN
    const pieceCount = sanitizedFen
      .split(" ")[0]
      .replace(/[^a-zA-Z]/g, "").length;
    if (pieceCount > this.maxPieces) {
      return { isAvailable: false };
    }

    // Check cache using sanitized FEN with expiry check
    const cachedEntry = this.cache.get(sanitizedFen);
    if (cachedEntry && cachedEntry.expiry > Date.now()) {
      return { isAvailable: true, result: cachedEntry.result };
    }

    // Retry logic for API calls
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // HIGH FIX: Use AbortController for proper timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `${APP_CONFIG.TABLEBASE_API_URL}/standard?fen=${encodeURIComponent(sanitizedFen)}`,
          {
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Don't retry on 4xx client errors, except rate limiting
          if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            throw new Error(`Client error: ${response.status}`);
          }
          // For server errors or rate limiting, throw to trigger retry
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.category) {
          return { isAvailable: false, error: "Invalid response" };
        }

        const result: TablebaseResult = {
          wdl: this.categoryToWdl(data.category),
          dtz: data.dtz || null,
          dtm: data.dtm || null, // Lichess provides DTM for mate positions
          category: data.category,
          precise: data.precise_dtz !== undefined,
          evaluation: this.getEvaluationText(data.category, data.dtz),
        };

        logger.info("[TablebaseService] API response and WDL mapping", {
          fen: sanitizedFen,
          apiCategory: data.category,
          mappedWdl: this.categoryToWdl(data.category),
          dtz: data.dtz,
          fullResponse: data,
        });

        // MEDIUM FIX: Cache with expiry timestamp instead of setTimeout
        this.cache.set(sanitizedFen, {
          result,
          expiry: Date.now() + this.cacheTtl,
        });

        return { isAvailable: true, result };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.warn(`Tablebase API attempt ${attempt}/${MAX_RETRIES} failed`, {
          fen: sanitizedFen,
          error: errorMessage,
        });

        // Don't retry client errors
        if (
          error instanceof Error &&
          error.message.startsWith("Client error")
        ) {
          return {
            isAvailable: false,
            error: errorMessage,
          };
        }

        // Last attempt failed
        if (attempt === MAX_RETRIES) {
          // Handle specific timeout errors
          if (error instanceof Error && error.name === "AbortError") {
            return {
              isAvailable: false,
              error: "Request timeout after retries",
            };
          }

          return {
            isAvailable: false,
            error: `Failed after ${MAX_RETRIES} attempts: ${errorMessage}`,
          };
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }

    // Should never reach here
    return { isAvailable: false, error: "Unexpected error" };
  }

  /**
   * Convert Lichess category string to numeric WDL value
   * @private
   * @param {string} category - Lichess category (win/draw/loss/cursed-win/blessed-loss)
   * @returns {number} WDL value from White's perspective (-2 to 2)
   */
  private categoryToWdl(category: string): number {
    switch (category) {
      case "win":
        return 2;
      case "cursed-win":
        return 1;
      case "draw":
        return 0;
      case "blessed-loss":
        return -1;
      case "loss":
        return -2;
      default:
        return 0;
    }
  }

  /**
   * Generate human-readable evaluation text in German
   * @private
   * @param {string} category - Position category from tablebase
   * @param {number} [dtz] - Distance to zeroing value
   * @returns {string} German evaluation text for UI display
   */
  private getEvaluationText(category: string, dtz?: number): string {
    switch (category) {
      case "win":
        return dtz ? `Gewinn in ${dtz} Zügen` : "Theoretisch gewonnen";
      case "cursed-win":
        return dtz
          ? `Gewinn in ${dtz} Zügen (50-Zug-Regel)`
          : "Gewinn mit 50-Zug-Regel";
      case "draw":
        return "Theoretisches Remis";
      case "blessed-loss":
        return dtz
          ? `Verlust in ${Math.abs(dtz)} Zügen (50-Zug-Regel)`
          : "Verlust mit 50-Zug-Regel";
      case "loss":
        return dtz
          ? `Verlust in ${Math.abs(dtz)} Zügen`
          : "Theoretisch verloren";
      default:
        return "Unbekannte Bewertung";
    }
  }

  /**
   * Get the best moves from tablebase for a position
   * Evaluates all legal moves and returns them sorted by quality
   *
   * @param {string} fen - Position in FEN notation
   * @param {number} [limit=3] - Maximum number of moves to return
   * @returns {Promise<TablebaseMovesResult>} Sorted moves with evaluations
   *
   * @remarks
   * - Only works for positions with 7 or fewer pieces
   * - Moves are sorted by WDL value first, then by DTZ
   * - For winning moves: lower DTZ is better (faster win)
   * - For losing moves: higher DTZ is better (slower loss)
   *
   * @example
   * const moves = await tablebaseService.getTopMoves(fen, 5);
   * if (moves.isAvailable && moves.moves) {
   *   const bestMove = moves.moves[0]; // Best move
   *   console.log(`Best: ${bestMove.san}, WDL: ${bestMove.wdl}`);
   * }
   */
  async getTopMoves(
    fen: string,
    limit: number = 3,
  ): Promise<TablebaseMovesResult> {
    // Validate FEN
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      return {
        isAvailable: false,
        error: `Invalid FEN: ${validation.errors.join(", ")}`,
      };
    }

    const sanitizedFen = validation.sanitized;

    // Check if position has few enough pieces
    const pieceCount = this.countPieces(sanitizedFen);
    if (pieceCount > this.maxPieces) {
      return {
        isAvailable: false,
        error: `Position has ${pieceCount} pieces, max supported is ${this.maxPieces}`,
      };
    }

    try {
      // Import chess.js for move generation
      const { Chess } = await import("chess.js");
      const game = new Chess(sanitizedFen);

      // Get all legal moves
      const legalMoves = game.moves({ verbose: true });

      // Evaluate each move
      const moveEvaluations = await Promise.all(
        legalMoves.map(async (move) => {
          // Make the move
          const tempGame = new Chess(sanitizedFen);
          tempGame.move(move);

          // Get tablebase evaluation for resulting position
          const evalResult = await this.getEvaluation(tempGame.fen());

          if (evalResult.isAvailable && evalResult.result) {
            // Check whose turn it is in the original position
            const isBlackToMove = sanitizedFen.split(" ")[1] === "b";

            return {
              uci: move.from + move.to + (move.promotion || ""),
              san: move.san,
              // If Black is to move, we need to invert WDL values
              // because the evaluation is from White's perspective after the move
              wdl: isBlackToMove
                ? -evalResult.result.wdl
                : evalResult.result.wdl,
              dtz: evalResult.result.dtz,
              dtm: evalResult.result.dtm,
              category: this.invertCategory(evalResult.result.category),
            };
          }
          return null;
        }),
      );

      // Filter out null results and sort by WDL (best moves first)
      const validMoves = moveEvaluations.filter(
        (m): m is TablebaseMove => m !== null,
      );

      // Log moves BEFORE sorting for debugging
      logger.info("[TablebaseService] Moves before sorting", {
        fen: sanitizedFen,
        movesCount: validMoves.length,
        moves: validMoves.map((m) => ({
          uci: m.uci,
          san: m.san,
          wdl: m.wdl,
          dtz: m.dtz,
          dtm: m.dtm,
          category: m.category,
        })),
      });

      // Sort moves
      const sortedMoves = validMoves
        .sort((a, b) => {
          // Sort by WDL first (higher is better)
          if (b.wdl !== a.wdl) return b.wdl - a.wdl;
          // Then by DTZ (lower is better for wins)
          if (a.dtz !== null && b.dtz !== null) {
            if (a.wdl > 0) return Math.abs(a.dtz) - Math.abs(b.dtz);
            if (a.wdl < 0) return Math.abs(b.dtz) - Math.abs(a.dtz);
          }
          return 0;
        })
        .slice(0, limit);

      // Log moves AFTER sorting for debugging
      logger.info("[TablebaseService] Moves after sorting", {
        fen: sanitizedFen,
        limit,
        movesCount: sortedMoves.length,
        moves: sortedMoves.map((m) => ({
          uci: m.uci,
          san: m.san,
          wdl: m.wdl,
          dtz: m.dtz,
          dtm: m.dtm,
          category: m.category,
        })),
      });

      if (sortedMoves.length === 0) {
        return {
          isAvailable: false,
          error: "No tablebase data available for legal moves",
        };
      }

      return {
        isAvailable: true,
        moves: sortedMoves,
      };
    } catch (error) {
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Invert a category from one player's perspective to the other
   * Used when evaluating moves from Black's perspective
   * @private
   * @param {string} category - Original category
   * @returns {"win"|"draw"|"loss"|"cursed-win"|"blessed-loss"} Inverted category
   */
  private invertCategory(
    category: string,
  ): "win" | "draw" | "loss" | "cursed-win" | "blessed-loss" {
    switch (category) {
      case "win":
        return "loss";
      case "loss":
        return "win";
      case "cursed-win":
        return "blessed-loss";
      case "blessed-loss":
        return "cursed-win";
      default:
        return "draw";
    }
  }

  /**
   * Count total pieces on the board from FEN string
   * Used to check if position qualifies for tablebase (≤7 pieces)
   * @private
   * @param {string} fen - Position in FEN notation
   * @returns {number} Total number of pieces (including kings)
   */
  private countPieces(fen: string): number {
    const piecesPart = fen.split(" ")[0];
    return piecesPart.replace(/[^a-zA-Z]/g, "").length;
  }

  /**
   * Clear the internal cache - useful for testing
   * @returns {void}
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Singleton instance of TablebaseService
 * Provides access to Lichess 7-piece endgame tablebase
 *
 * @example
 * import { tablebaseService } from '@shared/services/TablebaseService';
 *
 * // Get position evaluation
 * const eval = await tablebaseService.getEvaluation(fen);
 *
 * // Get best moves
 * const moves = await tablebaseService.getTopMoves(fen, 5);
 */
export const tablebaseService = new TablebaseService();
