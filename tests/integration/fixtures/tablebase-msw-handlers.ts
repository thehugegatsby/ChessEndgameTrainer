/**
 * MSW Handlers for Tablebase API Integration Tests
 *
 * Provides realistic mock responses for the Lichess Tablebase API
 * to enable comprehensive integration testing without hitting external APIs.
 */

import { http, HttpResponse } from "msw";
import {
  EndgamePositions,
  KPKProgression,
  SpecialPositions,
} from "../../fixtures/fenPositions";

// Test positions with known tablebase results
export /**
 *
 */
const KNOWN_POSITIONS = {
  // K+P vs K: White King on a8, Pawn on a7, Black King on a6
  KPK_WIN_WHITE: KPKProgression.INITIAL,
  // After Kd6 - still winning but suboptimal
  KPK_WIN_AFTER_KD6: KPKProgression.AFTER_KD6,
  // After Kd6 Kf8 - still winning for white to move
  KPK_WIN_AFTER_SETUP: KPKProgression.AFTER_KD6_KF8,
  // After Kc7 from the setup position - still winning
  KPK_WIN_AFTER_KC7: KPKProgression.AFTER_KC7,
  // After Kb8 from initial position - still winning
  KPK_WIN_AFTER_KB8: KPKProgression.AFTER_KB8,
  // K vs K - theoretical draw
  KK_DRAW: EndgamePositions.KK_DRAW,
  // More pieces than tablebase supports
  TOO_MANY_PIECES: SpecialPositions.TOO_MANY_PIECES,
  // Special position that triggers API error in MSW
  API_ERROR: SpecialPositions.EMPTY_BOARD,
} as const;

/**
 * Create a realistic tablebase response
 * @param category
 * @param dtz
 * @param precise
 */
function createTablebaseResponse(
  category: "win" | "draw" | "loss" | "cursed-win" | "blessed-loss",
  dtz?: number,
  precise?: boolean,
) {
  return {
    category,
    dtz: dtz ?? null,
    precise_dtz: precise ?? true,
  };
}

/**
 * MSW handlers for Lichess Tablebase API
 */
export /**
 *
 */
const tablebaseHandlers = [
  // Standard tablebase evaluation endpoint
  http.get("https://tablebase.lichess.ovh/standard", ({ request }) => {
    const url = new URL(request.url);
    const fen = url.searchParams.get("fen");

    if (!fen) {
      return HttpResponse.json(
        { error: "FEN parameter required" },
        { status: 400 },
      );
    }

    // Handle known test positions
    switch (fen) {
      case KNOWN_POSITIONS.KPK_WIN_WHITE:
        // Initial K+P vs K position - white wins
        return HttpResponse.json(createTablebaseResponse("win", 28, true), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case KNOWN_POSITIONS.KPK_WIN_AFTER_KD6:
        // After Kd6 - black to move, black loses (white wins)
        return HttpResponse.json(createTablebaseResponse("loss", -27, true), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case KNOWN_POSITIONS.KPK_WIN_AFTER_SETUP:
        // After Kd6 Kf8 - white to move, white wins
        return HttpResponse.json(createTablebaseResponse("win", 26, true), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case KNOWN_POSITIONS.KPK_WIN_AFTER_KC7:
        // After Kc7 - black to move, black loses (white still winning)
        return HttpResponse.json(createTablebaseResponse("loss", -25, true), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case KNOWN_POSITIONS.KPK_WIN_AFTER_KB8:
        // After Kb8 - black to move, black loses (white still winning)
        return HttpResponse.json(createTablebaseResponse("loss", -27, true), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case KNOWN_POSITIONS.KK_DRAW:
        // K vs K - theoretical draw
        return HttpResponse.json(createTablebaseResponse("draw", 0, true), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case KNOWN_POSITIONS.TOO_MANY_PIECES:
        // Position with too many pieces - not in tablebase
        return HttpResponse.json(
          { error: "Position not found in tablebase" },
          { status: 404 },
        );

      default:
        // For other positions, provide reasonable defaults based on pattern
        if (fen.includes("K") && fen.includes("k")) {
          const pieceCount = fen.split(" ")[0].replace(/[^a-zA-Z]/g, "").length;

          if (pieceCount > 7) {
            return HttpResponse.json(
              { error: "Position not found in tablebase" },
              { status: 404 },
            );
          }

          // Default to draw for simplicity
          return HttpResponse.json(createTablebaseResponse("draw", 0), {
            status: 200,
          });
        }

        return HttpResponse.json(
          { error: "Invalid position" },
          { status: 400 },
        );
    }
  }),

  // Handle network errors and timeouts
  http.get("*/tablebase/timeout", () => {
    // Simulate network timeout
    return HttpResponse.error();
  }),

  // Handle rate limiting
  http.get("*/tablebase/rate-limit", () => {
    return HttpResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }),
];

/**
 * Error simulation handlers for testing robustness
 */
export /**
 *
 */
const tablebaseErrorHandlers = [
  // Simulate intermittent failures
  http.get("https://tablebase.lichess.ovh/standard", ({ request }) => {
    const url = new URL(request.url);
    const fen = url.searchParams.get("fen");

    // 30% chance of failure for error recovery testing
    if (Math.random() < 0.3) {
      return HttpResponse.json(
        { error: "Simulated server error" },
        { status: 503 },
      );
    }

    // Fallback to normal response for known positions
    if (fen === KNOWN_POSITIONS.KPK_WIN_WHITE) {
      return HttpResponse.json(createTablebaseResponse("win", 28, true), {
        status: 200,
      });
    }

    return HttpResponse.json(createTablebaseResponse("draw", 0), {
      status: 200,
    });
  }),
];

/**
 * Custom handlers for specific test scenarios
 * @param fen
 * @param response
 * @param response.category
 * @param response.dtz
 * @param response.precise
 */
export /**
 *
 */
const createCustomTablebaseHandler = (
  fen: string,
  response: {
    category: "win" | "draw" | "loss" | "cursed-win" | "blessed-loss";
    dtz?: number;
    precise?: boolean;
  },
) => {
  return http.get("https://tablebase.lichess.ovh/standard", ({ request }) => {
    const url = new URL(request.url);
    const requestFen = url.searchParams.get("fen");

    if (requestFen === fen) {
      return HttpResponse.json(
        createTablebaseResponse(
          response.category,
          response.dtz,
          response.precise,
        ),
        { status: 200 },
      );
    }

    // Default fallback
    return HttpResponse.json(createTablebaseResponse("draw", 0), {
      status: 200,
    });
  });
};
