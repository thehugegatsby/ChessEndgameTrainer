/**
 * E2E-specific mocks for TablebaseService
 * These mocks simulate realistic Lichess API responses for E2E tests
 */

// Define mock responses that match real Lichess API data
// Based on E2E test patterns in actual-position-test.spec.ts
export /**
 *
 */
const E2E_TABLEBASE_MOCKS: Record<string, any> = {
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
