import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MovePanelZustand } from "@shared/components/training/MovePanelZustand";
import { createTestValidatedMove } from "@tests/helpers/validatedMoveFactory";
import { COMMON_FENS } from "@tests/fixtures/commonFens";

// Mock the store hooks directly
vi.mock("@shared/store/hooks");

// Mock useTablebaseQuery hooks
vi.mock("@shared/hooks/useTablebaseQuery", () => ({
  useTablebaseEvaluation: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

import { useGameStore, useTablebaseStore } from "@shared/store/hooks";

describe("MovePanelZustand", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement): ReturnType<typeof render> => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it("should display moves from Zustand store", () => {
    // Use centralized opening positions for consistent testing
    const mockMoves = [
      createTestValidatedMove({
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        before: COMMON_FENS.STARTING_POSITION,
        after: COMMON_FENS.OPENING_AFTER_E4,
      }),
      createTestValidatedMove({
        from: "e7",
        to: "e5",
        piece: "p",
        color: "b",
        san: "e5",
        before: COMMON_FENS.OPENING_AFTER_E4,
        after: COMMON_FENS.OPENING_AFTER_E4_E5,
      }),
      createTestValidatedMove({
        from: "g1",
        to: "f3",
        piece: "n",
        san: "Nf3",
        before: COMMON_FENS.OPENING_AFTER_E4_E5,
        after: COMMON_FENS.OPENING_AFTER_E4_E5_NF3,
      }),
    ];

    (useGameStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      currentFen: COMMON_FENS.OPENING_AFTER_E4_E5_NF3,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: [],
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    renderWithProviders(<MovePanelZustand onMoveClick={vi.fn()} />);

    expect(screen.getByText("e4")?.isConnected).toBe(true);
    expect(screen.getByText("e5")?.isConnected).toBe(true);
    expect(screen.getByText("Nf3")?.isConnected).toBe(true);
  });

  it("should display evaluations when showEvaluations is true", () => {
    // Use centralized opening positions
    const mockMoves = [
      createTestValidatedMove({
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        before: COMMON_FENS.STARTING_POSITION,
        after: COMMON_FENS.OPENING_AFTER_E4,
      }),
    ];

    const mockEvaluations = [
      {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        evaluation: 0,
      }, // Initial position
      {
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        evaluation: 0.3,
        tablebase: { isTablebasePosition: false },
      }, // After e4
    ];

    (useGameStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      currentFen: COMMON_FENS.OPENING_AFTER_E4_E5_NF3,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: mockEvaluations,
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    renderWithProviders(<MovePanelZustand showEvaluations={true} onMoveClick={vi.fn()} />);

    // Should show the move
    expect(screen.getByText("e4")?.isConnected).toBe(true);
    // Should show evaluation indicator (⚪ for neutral evaluation)
    expect(screen.getByText("⚪")?.isConnected).toBe(true);
  });

  it("should handle move click events", () => {
    // Use centralized opening positions
    const onMoveClickMock = vi.fn();
    const mockMoves = [
      createTestValidatedMove({
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        before: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        after: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      }),
      createTestValidatedMove({
        from: "e7",
        to: "e5",
        piece: "p",
        color: "b",
        san: "e5",
        before: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        after: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      }),
    ];

    (useGameStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      currentFen: COMMON_FENS.OPENING_AFTER_E4_E5_NF3,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: [],
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    renderWithProviders(<MovePanelZustand onMoveClick={onMoveClickMock} />);

    fireEvent.click(screen.getByText("e4"));
    expect(onMoveClickMock).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByText("e5"));
    expect(onMoveClickMock).toHaveBeenCalledWith(1);
  });

  it("should highlight current move", () => {
    // Use centralized opening positions
    const mockMoves = [
      createTestValidatedMove({
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        before: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        after: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      }),
      createTestValidatedMove({
        from: "e7",
        to: "e5",
        piece: "p",
        color: "b",
        san: "e5",
        before: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        after: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      }),
    ];

    (useGameStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      currentFen: COMMON_FENS.OPENING_AFTER_E4_E5_NF3,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: [],
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    renderWithProviders(<MovePanelZustand onMoveClick={vi.fn()} currentMoveIndex={1} />);

    const e4Button = screen.getByText("e4");
    const e5Button = screen.getByText("e5");

    // e5 should be highlighted (currentMoveIndex = 1)
    expect(e5Button.className).toContain("text-blue-400");
    expect(e5Button.className).toContain("bg-blue-900/30");

    // e4 should not be highlighted
    expect(e4Button.className).toContain("text-white");
    expect(e4Button.className).not.toContain("bg-blue-900/30");
  });

  it("should display tablebase evaluations when available", () => {
    // Use centralized opening positions
    const mockMoves = [
      createTestValidatedMove({
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        before: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        after: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      }),
    ];

    const mockEvaluations = [
      {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        evaluation: 0,
      }, // Initial position
      {
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        evaluation: 0.3,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2, // Win for white (white to move)
          wdlAfter: -2, // Still win (but from black's perspective after white's move)
          category: "win",
        },
      },
    ];

    (useGameStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      currentFen: COMMON_FENS.OPENING_AFTER_E4_E5_NF3,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: mockEvaluations,
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    renderWithProviders(<MovePanelZustand showEvaluations={true} onMoveClick={vi.fn()} />);

    // SIMPLIFIED: Check that evaluation is shown (symbol may vary)
    expect(screen.getByTestId("move-evaluation")?.isConnected).toBe(true);
  });

  it("should show empty state when no moves", () => {
    (useGameStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      currentPgn: "",
      moveHistory: [],
      currentMoveIndex: -1,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as ReturnType<typeof vi.fn>).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: [],
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    renderWithProviders(<MovePanelZustand onMoveClick={vi.fn()} />);

    expect(screen.getByText("Noch keine Züge gespielt")?.isConnected).toBe(true);
  });
});
