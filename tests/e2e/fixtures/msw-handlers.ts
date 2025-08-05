/**
 * MSW API Handlers for E2E Tests
 * Industry Standard lösung für Next.js SSG + E2E Testing
 * Expert consensus: Gemini 9/10 + O3-mini 9/10 confidence
 */

import { http, HttpResponse } from "msw";
import { E2E } from "../../../shared/constants";
import type { EndgamePosition } from "../../../shared/types";

/**
 * Create mock position data matching EndgamePosition interface
 */
const createMockPosition = (id: number): EndgamePosition => ({
  id,
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  title: `E2E Test Position ${id}`,
  description: `Clean MSW-mocked position for E2E testing - ID ${id}`,
  difficulty: "beginner" as const,
  category: "endgame",
  targetMoves: 10,
});

/**
 * Mock user data for E2E tests
 */
const createMockUser = () => ({
  id: "e2e-test-user",
  rating: E2E.DATA.USER.RATING,
  currentStreak: E2E.DATA.USER.STREAK,
  preferences: E2E.DATA.PREFERENCES,
});

/**
 * MSW HTTP Handlers for E2E Test APIs
 * Intercepts both server-side (getStaticProps) and client-side calls
 */
export const handlers = [
  // Position API - handles getStaticProps server-side calls
  http.get("*/api/positions/:id", ({ params }) => {
    const id = Number(params.id);

    if (isNaN(id)) {
      return HttpResponse.json(
        { error: "Invalid position ID" },
        { status: 404 },
      );
    }

    const position = createMockPosition(id);
    return HttpResponse.json(position, { status: 200 });
  }),

  // User API - for authentication and preferences
  http.get("*/api/user/*", () => {
    const user = createMockUser();
    return HttpResponse.json(user, { status: 200 });
  }),

  // Health check endpoint
  http.get("*/api/health", () => {
    return HttpResponse.json(
      {
        status: "ok",
        message: "MSW E2E Test Server Running",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  // Catch-all for unmocked API calls - helps debugging
  http.get("*/api/*", ({ request }) => {
    console.warn(`Unmocked API call: ${request.url}`);
    return HttpResponse.json(
      {
        error: "Unmocked API endpoint in E2E tests",
        url: request.url,
        suggestion: "Add handler to msw-handlers.ts",
      },
      { status: 404 },
    );
  }),
];

/**
 * Handlers with error simulation for error recovery testing
 */
export const errorHandlers = [
  // Simulate server errors for error recovery tests
  http.get("*/api/positions/:id", ({ params }) => {
    const id = Number(params.id);

    // Simulate 20% error rate
    if (Math.random() < 0.2) {
      return HttpResponse.json(
        { error: "Simulated server error for E2E error recovery testing" },
        { status: 500 },
      );
    }

    const position = createMockPosition(id);
    return HttpResponse.json(position, { status: 200 });
  }),
];
