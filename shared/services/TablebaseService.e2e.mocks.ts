/**
 * @file E2E-specific mocks for TablebaseService
 * @module services/TablebaseService.e2e.mocks
 * 
 * @description
 * Provides realistic mock implementations for the Lichess Tablebase API
 * specifically designed for end-to-end testing. Contains pre-defined
 * responses for common chess endgame positions used in E2E test scenarios.
 * 
 * @remarks
 * Key features:
 * - Realistic Lichess API response simulation
 * - Pre-defined responses for specific test positions
 * - Pattern-based matching for position variations
 * - Browser environment fetch mocking
 * - Comprehensive logging for test debugging
 * - Fallback handling for unmocked positions
 * 
 * The mocks are based on actual E2E test patterns and provide accurate
 * tablebase evaluations for king and pawn endgame scenarios, ensuring
 * predictable test behavior across different test runs.
 */

/**
 * E2E tablebase mock responses for specific chess positions
 * 
 * @description
 * Pre-defined mock responses that match real Lichess API data structure.
 * Based on E2E test patterns from actual-position-test.spec.ts and provides
 * accurate tablebase evaluations for king and pawn endgame scenarios.
 * 
 * @remarks
 * Response structure matches Lichess API:
 * - category: 'win', 'loss', 'draw', or 'unknown'
 * - wdl: Win/Draw/Loss value (-2 to +2)
 * - dtz: Distance to zero (moves to conversion or mate)
 * - dtm: Distance to mate (usually null for endgames)
 * - precise: Whether the evaluation is exact
 * 
 * @example
 * ```typescript
 * const response = E2E_TABLEBASE_MOCKS['4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'];
 * // { category: 'win', wdl: 2, dtz: 17, dtm: null, precise: true }
 * ```
 */
export const E2E_TABLEBASE_MOCKS: Record<string, any> = {
  // Initial position: King and pawn vs King (White to move)
  // FEN: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1" (matches test line 66)
  "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1": {
    category: "win",
    wdl: 2,
    dtz: 17,
    dtm: null,
    precise: true,
  },

  // After Kd6 (Black to move) - should be loss for Black = win for White
  // FEN: "4k3/8/3K4/4P3/8/8/8/8 b - - 1 1" (matches test line 47)
  "4k3/8/3K4/4P3/8/8/8/8 b - - 1 1": {
    category: "loss", // Loss for Black (current player) = Win for White
    wdl: -2,
    dtz: -14,
    dtm: null,
    precise: true,
  },

  // After Kf6 (Black to move) - should also be loss for Black = win for White
  // FEN: "4k3/8/5K2/4P3/8/8/8/8 b - - 1 1"
  "4k3/8/5K2/4P3/8/8/8/8 b - - 1 1": {
    category: "loss", // Loss for Black (current player) = Win for White
    wdl: -2,
    dtz: -18,
    dtm: null,
    precise: true,
  },

  // After Kd5 (Black to move) - should be draw
  // FEN: "4k3/8/8/3K1P2/8/8/8/8 b - - 1 1"
  "4k3/8/8/3K1P2/8/8/8/8 b - - 1 1": {
    category: "draw",
    wdl: 0,
    dtz: 0,
    dtm: null,
    precise: true,
  },

  // After Kf5 (Black to move) - should be draw
  // FEN: "4k3/8/8/4PK2/8/8/8/8 b - - 1 1"
  "4k3/8/8/4PK2/8/8/8/8 b - - 1 1": {
    category: "draw",
    wdl: 0,
    dtz: 0,
    dtm: null,
    precise: true,
  },
};

/**
 * Create fetch mock for E2E tests that returns realistic tablebase data
 * 
 * @description
 * Creates a Jest mock function that intercepts fetch requests to the
 * Lichess tablebase API and returns pre-defined mock responses. Designed
 * specifically for unit and integration testing environments.
 * 
 * @returns {jest.Mock} Jest mock function configured for tablebase API testing
 * 
 * @example
 * ```typescript
 * // In test setup
 * global.fetch = createE2ETablebaseFetchMock();
 * 
 * // Test will use mock responses
 * const response = await fetch('https://lichess.org/api/tablebase/standard?fen=...');
 * expect(response.ok).toBe(true);
 * ```
 */
export function createE2ETablebaseFetchMock() {
  return jest.fn((url: string) => {
    if (url.includes("lichess.org/api/tablebase/standard")) {
      // Extract FEN from URL
      const urlObj = new URL(url);
      const fen = urlObj.searchParams.get("fen");

      if (fen && E2E_TABLEBASE_MOCKS[fen]) {
        const mockData = E2E_TABLEBASE_MOCKS[fen];
        return Promise.resolve({
          ok: true,
          /**
           *
           */
          json: () => Promise.resolve(mockData),
          status: 200,
          statusText: "OK",
        });
      }
    }

    // Fallback for unmocked positions
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: "Not Found",
      /**
       *
       */
      json: () => Promise.resolve({ error: "Position not found" }),
    });
  });
}

/**
 * Setup E2E mocks for browser environment
 * 
 * @description
 * Sets up fetch mocking in the browser environment for E2E tests.
 * Intercepts requests to Lichess tablebase API and returns mock responses
 * based on pre-defined position data. Only activates in E2E test mode.
 * 
 * @remarks
 * Browser environment setup:
 * - Only runs when NEXT_PUBLIC_IS_E2E_TEST is true
 * - Preserves original fetch for non-tablebase requests
 * - Provides comprehensive logging for debugging
 * - Supports both exact and pattern-based FEN matching
 * - Graceful fallback for unmocked positions
 * 
 * @example
 * ```typescript
 * // Call during app initialization in E2E mode
 * setupE2ETablebaseMocks();
 * 
 * // Now all tablebase API calls will use mocks
 * const evaluation = await tablebaseService.getEvaluation(fen);
 * ```
 */
export function setupE2ETablebaseMocks() {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_IS_E2E_TEST === "true"
  ) {
    console.log("🧪 Setting up E2E Tablebase mocks");

    // Override fetch for E2E tests
    const originalFetch = window.fetch;

    window.fetch = ((url: string | Request, init?: RequestInit) => {
      const urlString = typeof url === "string" ? url : url.url;

      if (
        urlString.includes("lichess.org/api/tablebase/standard") ||
        urlString.includes("tablebase.lichess.ovh/standard")
      ) {
        const urlObj = new URL(urlString);
        const fen = urlObj.searchParams.get("fen");

        console.log("🧪 E2E Tablebase mock intercepted FEN:", fen);

        if (fen) {
          // First try exact match
          if (E2E_TABLEBASE_MOCKS[fen]) {
            const mockData = E2E_TABLEBASE_MOCKS[fen];
            console.log("🧪 E2E Tablebase mock returning (exact):", mockData);
            return Promise.resolve(
              new Response(JSON.stringify(mockData), {
                status: 200,
                statusText: "OK",
                headers: { "Content-Type": "application/json" },
              }),
            );
          }

          // Then try partial match based on the patterns from E2E test
          let mockData = null;

          // After Kd6 pattern (test line 47)
          if (fen.includes("4k3/8/3K4/4P3")) {
            mockData = {
              category: "loss", // Loss for Black = Win for White
              wdl: -2,
              dtz: -14,
              dtm: null,
              precise: true,
            };
          }
          // Initial position pattern (test line 66)
          else if (fen.includes("4k3/8/4K3/4P3")) {
            mockData = {
              category: "win",
              wdl: 2,
              dtz: 17,
              dtm: null,
              precise: true,
            };
          }
          // After Kf6 pattern
          else if (fen.includes("4k3/8/5K2/4P3")) {
            mockData = {
              category: "loss", // Loss for Black = Win for White
              wdl: -2,
              dtz: -18,
              dtm: null,
              precise: true,
            };
          }

          if (mockData) {
            console.log("🧪 E2E Tablebase mock returning (pattern):", mockData);
            return Promise.resolve(
              new Response(JSON.stringify(mockData), {
                status: 200,
                statusText: "OK",
                headers: { "Content-Type": "application/json" },
              }),
            );
          }
        }

        // Fallback for unmocked positions
        console.log("🧪 E2E Tablebase mock - no match found for FEN:", fen);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              category: "unknown",
              wdl: 0,
              dtz: 0,
              dtm: null,
              error: "Position not found in E2E mocks",
            }),
            {
              status: 404,
              statusText: "Not Found",
            },
          ),
        );
      }

      // Use original fetch for other requests
      return originalFetch(url, init);
    }) as typeof fetch;
  }
}
