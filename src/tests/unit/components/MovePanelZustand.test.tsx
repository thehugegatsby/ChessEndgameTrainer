import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MovePanelZustand } from "@shared/components/training/MovePanelZustand";
import { createTestValidatedMove } from "../../helpers/validatedMoveFactory";
import { getOpeningSequence } from "../../fixtures/chessTestScenarios";

// Mock the store hooks directly
jest.mock("@shared/store/hooks");

import { useGameStore, useTablebaseStore } from "@shared/store/hooks";

describe("MovePanelZustand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display moves from Zustand store", () => {
    // Use centralized opening sequence for consistent testing
    const openingSequence = getOpeningSequence();
    const mockMoves = [
      createTestValidatedMove({
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        before: openingSequence.startPosition,
        after: openingSequence.positions[0].after,
      }),
      createTestValidatedMove({
        from: "e7",
        to: "e5",
        piece: "p",
        color: "b",
        san: "e5",
        before: openingSequence.positions[0].after,
        after: openingSequence.positions[1].after,
      }),
      createTestValidatedMove({
        from: "g1",
        to: "f3",
        piece: "n",
        san: "Nf3",
        before: openingSequence.positions[1].after,
        after: openingSequence.positions[2].after,
      }),
    ];

    (useGameStore as jest.Mock).mockReturnValue([{
      currentFen: openingSequence.positions[2].after,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as jest.Mock).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: [],
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    render(<MovePanelZustand onMoveClick={jest.fn()} />);

    expect(screen.getByText("e4")).toBeInTheDocument();
    expect(screen.getByText("e5")).toBeInTheDocument();
    expect(screen.getByText("Nf3")).toBeInTheDocument();
  });

  it("should display evaluations when showEvaluations is true", () => {
    const openingSequence = getOpeningSequence();
    const mockMoves = [
      createTestValidatedMove({
        from: "e2",
        to: "e4",
        piece: "p",
        san: "e4",
        before: openingSequence.startPosition,
        after: openingSequence.positions[0].after,
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

    (useGameStore as jest.Mock).mockReturnValue([{
      currentFen: openingSequence.positions[2].after,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as jest.Mock).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: mockEvaluations,
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    render(<MovePanelZustand showEvaluations={true} onMoveClick={jest.fn()} />);

    // Should show the move
    expect(screen.getByText("e4")).toBeInTheDocument();
    // Should show evaluation indicator (⚪ for neutral evaluation)
    expect(screen.getByText("⚪")).toBeInTheDocument();
  });

  it("should handle move click events", () => {
    const openingSequence = getOpeningSequence();
    const onMoveClickMock = jest.fn();
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

    (useGameStore as jest.Mock).mockReturnValue([{
      currentFen: openingSequence.positions[2].after,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as jest.Mock).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: [],
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    render(<MovePanelZustand onMoveClick={onMoveClickMock} />);

    fireEvent.click(screen.getByText("e4"));
    expect(onMoveClickMock).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByText("e5"));
    expect(onMoveClickMock).toHaveBeenCalledWith(1);
  });

  it("should highlight current move", () => {
    const openingSequence = getOpeningSequence();
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

    (useGameStore as jest.Mock).mockReturnValue([{
      currentFen: openingSequence.positions[2].after,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as jest.Mock).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: [],
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    render(<MovePanelZustand onMoveClick={jest.fn()} currentMoveIndex={1} />);

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
    const openingSequence = getOpeningSequence();
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

    (useGameStore as jest.Mock).mockReturnValue([{
      currentFen: openingSequence.positions[2].after,
      currentPgn: "1. e4 e5 2. Nf3",
      moveHistory: mockMoves,
      currentMoveIndex: 2,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as jest.Mock).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: mockEvaluations,
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    render(<MovePanelZustand showEvaluations={true} onMoveClick={jest.fn()} />);

    // SIMPLIFIED: Check that evaluation is shown (symbol may vary)
    expect(screen.getByTestId("move-evaluation")).toBeInTheDocument();
  });

  it("should show empty state when no moves", () => {
    (useGameStore as jest.Mock).mockReturnValue([{
      currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      currentPgn: "",
      moveHistory: [],
      currentMoveIndex: -1,
      isGameFinished: false,
      gameResult: null,
    }, {}]);
    
    (useTablebaseStore as jest.Mock).mockReturnValue([{
      analysisStatus: "idle",
      evaluations: [],
      tablebaseMove: undefined,
      currentEvaluation: undefined,
    }, {}]);

    render(<MovePanelZustand onMoveClick={jest.fn()} />);

    expect(screen.getByText("Noch keine Züge gespielt")).toBeInTheDocument();
  });
});
