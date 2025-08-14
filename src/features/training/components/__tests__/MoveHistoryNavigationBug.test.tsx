import { describe, it, expect, beforeEach, vi } from 'vitest';
/**
 * Test suite to reproduce the Move History navigation bug
 * Bug: When clicking on a move in history, subsequent moves appear to be deleted
 * Expected: All moves should remain visible, only the position should change
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MovePanelZustand } from "@shared/components/training/MovePanelZustand";
// import { useStore } from "@shared/store/rootStore"; // Not used in this test file
import { createTestValidatedMove } from "@tests/helpers/validatedMoveFactory";
import type { ValidatedMove } from '@shared/types/chess.js';

// Hoist mocks before vi.mock
const { useGameStore, useTablebaseStore, useTrainingStore } = vi.hoisted(() => ({
  useGameStore: vi.fn(),
  useTablebaseStore: vi.fn(),
  useTrainingStore: vi.fn(),
}));

// Mock the store hooks
vi.mock("@shared/store/hooks", () => ({
  useGameStore,
  useTablebaseStore,
  useTrainingStore,
}));

describe("Move History Navigation Bug", () => {
  /**
   *
   */
  const createMockMoves = (): ValidatedMove[] => [
    createTestValidatedMove({
      from: "e2",
      to: "e4",
      san: "e4",
      color: "w",
      piece: "p",
    }),
    createTestValidatedMove({
      from: "e7",
      to: "e5",
      san: "e5",
      color: "b",
      piece: "p",
    }),
    createTestValidatedMove({
      from: "g1",
      to: "f3",
      san: "Nf3",
      color: "w",
      piece: "n",
    }),
    createTestValidatedMove({
      from: "b8",
      to: "c6",
      san: "Nc6",
      color: "b",
      piece: "n",
    }),
    createTestValidatedMove({
      from: "f1",
      to: "c4",
      san: "Bc4",
      color: "w",
      piece: "b",
    }),
  ];

  beforeEach(() => {
    // Setup default mock returns
    useTablebaseStore.mockReturnValue([
      {
        evaluations: [],
      },
      {},
    ]);

    useTrainingStore.mockReturnValue([
      {
        currentPosition: null,
      },
      {},
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("FIX VERIFICATION: Should show ALL moves even when navigating to an earlier move", () => {
    const mockMoves = createMockMoves();
    const onMoveClick = vi.fn();

    // Initial state: All 5 moves played, viewing the last move (index 4)
    useGameStore.mockReturnValue([
      {
        moveHistory: mockMoves,
        currentMoveIndex: 4, // Viewing the last move
        currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      },
      {},
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MovePanelZustand onMoveClick={onMoveClick} currentMoveIndex={4} />
      </QueryClientProvider>,
    );

    // Verify all 5 moves are displayed initially
    expect(screen.getByText("e4")?.isConnected).toBe(true);
    expect(screen.getByText("e5")?.isConnected).toBe(true);
    expect(screen.getByText("Nf3")?.isConnected).toBe(true);
    expect(screen.getByText("Nc6")?.isConnected).toBe(true);
    expect(screen.getByText("Bc4")?.isConnected).toBe(true);

    // User clicks on move 2 (Nf3) to navigate there
    const nf3Button = screen.getByText("Nf3");
    fireEvent.click(nf3Button);
    expect(onMoveClick).toHaveBeenCalledWith(2);

    // Simulate the state update after navigation
    // The bug is that currentMoveIndex changes to 2
    useGameStore.mockReturnValue([
      {
        moveHistory: mockMoves, // All moves still in history
        currentMoveIndex: 2, // Now viewing move 2
        currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      },
      {},
    ]);

    rerender(
      <QueryClientProvider client={queryClient}>
        <MovePanelZustand onMoveClick={onMoveClick} currentMoveIndex={2} />
      </QueryClientProvider>,
    );

    // FIX VERIFICATION: After the fix, ALL moves should remain visible
    // when navigating to an earlier move

    console.log("\n=== FIX VERIFICATION ===");
    console.log("After clicking on move 2 (Nf3):");
    console.log("Expected: All 5 moves visible (e4, e5, Nf3, Nc6, Bc4)");
    console.log("With fix: All moves should now be visible!");

    // These assertions verify the fix works:
    expect(screen.getByText("e4")?.isConnected).toBe(true);
    expect(screen.getByText("e5")?.isConnected).toBe(true);
    expect(screen.getByText("Nf3")?.isConnected).toBe(true);

    // FIXED: These moves should now be visible!
    expect(screen.getByText("Nc6")?.isConnected).toBe(true); // Now visible!
    expect(screen.getByText("Bc4")?.isConnected).toBe(true); // Now visible!
  });

  it("EXPECTED BEHAVIOR: Should display all moves with proper highlighting", () => {
    const mockMoves = createMockMoves();
    const onMoveClick = vi.fn();

    // This test shows what SHOULD happen
    useGameStore.mockReturnValue([
      {
        moveHistory: mockMoves,
        currentMoveIndex: 2, // Viewing move 2, but all moves in history
        currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      },
      {},
    ]);

    // If the bug was fixed, this is what we'd see:
    console.log("\n=== EXPECTED BEHAVIOR ===");
    console.log("When viewing move 2:");
    console.log("- All 5 moves should be visible");
    console.log("- Move 3 (Nf3) should be highlighted as current");
    console.log("- Moves 4-5 (Nc6, Bc4) should appear grayed out or different");
    console.log("- User can click any move to jump there");
  });

  it("Verifies the actual data flow", () => {
    const mockMoves = createMockMoves();

    // Log the actual data to understand the bug
    console.log("\n=== DATA FLOW ANALYSIS ===");
    console.log("1. Initial state:");
    console.log(`   - moveHistory.length: ${mockMoves.length}`);
    console.log(`   - currentMoveIndex: 4`);
    console.log(`   - All moves: ${mockMoves.map((m) => m.san).join(", ")}`);

    console.log("\n2. After clicking move 2:");
    console.log(`   - moveHistory.length: ${mockMoves.length} (unchanged)`);
    console.log(`   - currentMoveIndex: 2 (changed)`);
    console.log(
      `   - All moves still in store: ${mockMoves.map((m) => m.san).join(", ")}`,
    );

    console.log("\n3. Bug in MovePanelZustand:");
    console.log("   - Line 160-162 slices moveHistory:");
    console.log("     gameState.moveHistory.slice(0, currentMoveIndex + 1)");
    console.log(`   - This creates: slice(0, 3) = first 3 moves only`);
    console.log("   - Result: Moves 4-5 disappear from UI!");
  });
});
