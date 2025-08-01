/**
 * Simple Tablebase Service - Direct Lichess API Integration
 * No overengineering, just what we need.
 */

import { validateAndSanitizeFen } from "../utils/fenValidator";
import { getLogger } from "../services/logging";
import { APP_CONFIG } from "../../config/constants";

const logger = getLogger().setContext("TablebaseService");

/**
 *
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
 *
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
 *
 */
export interface TablebaseEvaluation {
  isAvailable: boolean;
  result?: TablebaseResult;
  error?: string;
}

/**
 *
 */
export interface TablebaseMovesResult {
  isAvailable: boolean;
  moves?: TablebaseMove[];
  error?: string;
}

/**
 *
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
   * Get tablebase evaluation for position
   * @param fen
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
          dtm: null, // Lichess doesn't provide DTM
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
   *
   * @param category
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
   *
   * @param category
   * @param dtz
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
   * Get top moves from tablebase for a position
   * Returns multiple moves with their evaluations
   * @param fen
   * @param limit
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
            return {
              uci: move.from + move.to + (move.promotion || ""),
              san: move.san,
              // Negate WDL because we want from current player's perspective
              wdl: -evalResult.result.wdl,
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
   *
   * @param category
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
   * Count total pieces on the board
   * @param fen
   */
  private countPieces(fen: string): number {
    const piecesPart = fen.split(" ")[0];
    return piecesPart.replace(/[^a-zA-Z]/g, "").length;
  }

  /**
   * For testing
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton
export /**
 *
 */
const tablebaseService = new TablebaseService();
