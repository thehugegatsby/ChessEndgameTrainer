/**
 * Test factory for creating ValidatedMove objects
 *
 * This utility creates ValidatedMove objects for testing purposes by leveraging
 * the base createTestMove factory and applying the necessary branding.
 *
 * IMPORTANT: This should ONLY be used in tests, as it bypasses any real
 * validation logic that might exist in the application.
 */

import { createTestMove, type CreateMoveOptions } from "./moveFactory";
import type { ValidatedMove } from "@shared/types/chess";

/**
 * Creates a ValidatedMove for testing purposes
 *
 * This is the single, controlled location for type assertion to ValidatedMove.
 * We encapsulate the "lie" to TypeScript here so tests remain clean and type-safe.
 *
 * @param options - The options to create the base move
 * @returns A ValidatedMove object for use in tests
 *
 * @example
 * ```typescript
 * const move = createTestValidatedMove({
 *   from: 'e2',
 *   to: 'e4',
 *   piece: 'p',
 *   san: 'e4'
 * });
 * ```
 */
export const createTestValidatedMove = (options: CreateMoveOptions): ValidatedMove => {
  const baseMove = createTestMove(options);

  // Single controlled type assertion - this is the only place we "lie" to TypeScript
  // Since ValidatedMove extends Move with branded symbols, this cast is sufficient for tests
  return baseMove as ValidatedMove;
};

/**
 * Common validated test moves for reuse across test files
 */
export const VALIDATED_TEST_MOVES = {
  E2E4: createTestValidatedMove({
    from: "e2",
    to: "e4",
    piece: "p",
    san: "e4",
  }),
  E7E5: createTestValidatedMove({
    from: "e7",
    to: "e5",
    piece: "p",
    color: "b",
    san: "e5",
  }),
  NG1F3: createTestValidatedMove({
    from: "g1",
    to: "f3",
    piece: "n",
    san: "Nf3",
  }),
  KINGSIDE_CASTLE: createTestValidatedMove({
    from: "e1",
    to: "g1",
    piece: "k",
    san: "O-O",
  }),
  CAPTURE: createTestValidatedMove({
    from: "e4",
    to: "d5",
    piece: "p",
    captured: "p",
    san: "exd5",
  }),
  PROMOTION: createTestValidatedMove({
    from: "e7",
    to: "e8",
    piece: "p",
    promotion: "q",
    san: "e8=Q",
  }),
} as const;

// Legacy export for compatibility - factory object with create method
export const validatedMoveFactory = {
  create: createTestValidatedMove,
};
