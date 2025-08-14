import { vi } from 'vitest';
/**
 * Mock ChessService for testing
 * Simulates chess move validation and game state management
 */

import { EventEmitter } from "events";
import type { ValidatedMove, Square } from "@shared/types";

class MockChessService extends EventEmitter {
  private fen: string =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  private pgn: string = "";
  private moveHistory: ValidatedMove[] = [];
  private isFinished: boolean = false;
  private currentMoveIndex: number = -1;

  constructor() {
    super();
    // Increase max listeners to prevent warnings in tests
    this.setMaxListeners(50);
  }

  initialize(fen: string): boolean {
    this.fen = fen;
    this.pgn = "";
    this.moveHistory = [];
    this.isFinished = false;
    this.currentMoveIndex = -1;

    // Emit stateUpdate event with proper payload
    this.emit("stateUpdate", {
      type: "stateUpdate",
      payload: {
        fen: this.fen,
        pgn: this.pgn,
        moveHistory: this.moveHistory,
        currentMoveIndex: this.currentMoveIndex,
        isGameOver: this.isFinished,
        gameResult: null,
      },
    });

    return true;
  }

  move(
    move: { from: string; to: string; promotion?: string } | string,
  ): ValidatedMove | null {
    // Generate SAN based on the actual move
    let san: string;
    let from: string;
    let to: string;

    if (typeof move === "string") {
      san = move;
      from = "e2";
      to = "e4";
    } else {
      from = move.from;
      to = move.to;

      // Generate proper SAN based on the move
      // For simplicity in tests, assume King moves (most common in endgames)
      // Generate SAN like "Ke2" where the destination square is used
      san = `K${to}`;
    }

    // Simulate a successful move
    const validatedMove: ValidatedMove = {
      from: from as Square,
      to: to as Square,
      san: san,
      piece: "k",
      color: "w",
      flags: "",
      lan: `${from}${to}`,
      fenBefore: this.fen,
      fenAfter: this.fen, // In reality this would change
      // Helper methods
      isCapture: () => false,
      isPromotion: () => false,
      isEnPassant: () => false,
      isKingsideCastle: () => false,
      isQueensideCastle: () => false,
      isBigPawn: () => false,
    } as ValidatedMove;

    // Create a new array to avoid mutation issues with Immer
    this.moveHistory = [...this.moveHistory, validatedMove];
    this.currentMoveIndex = this.moveHistory.length - 1;

    // Emit stateUpdate event with proper payload
    this.emit("stateUpdate", {
      type: "stateUpdate",
      payload: {
        fen: this.fen,
        pgn: this.getPgn(),
        moveHistory: this.moveHistory,
        currentMoveIndex: this.currentMoveIndex,
        isGameOver: this.isFinished,
        gameResult: null,
      },
    });

    return validatedMove;
  }

  undo(): ValidatedMove | null {
    if (this.moveHistory.length === 0) return null;

    const lastMove = this.moveHistory.pop();
    this.emit("undo", lastMove);
    this.emit("stateChange");
    return lastMove || null;
  }

  reset(): void {
    this.moveHistory = [];
    this.currentMoveIndex = -1;
    this.isFinished = false;

    // Emit stateUpdate event with proper payload
    this.emit("stateUpdate", {
      type: "stateUpdate",
      payload: {
        fen: this.fen,
        pgn: "",
        moveHistory: this.moveHistory,
        currentMoveIndex: this.currentMoveIndex,
        isGameOver: this.isFinished,
        gameResult: null,
      },
    });
  }

  goToMove(index: number): void {
    // Simulate going to a specific move
    this.currentMoveIndex = index;

    // Emit stateUpdate event with proper payload
    this.emit("stateUpdate", {
      type: "stateUpdate",
      payload: {
        fen: this.fen,
        pgn: this.getPgn(),
        moveHistory: this.moveHistory,
        currentMoveIndex: this.currentMoveIndex,
        isGameOver: this.isFinished,
        gameResult: null,
      },
    });
  }

  getFen(): string {
    return this.fen;
  }

  getPgn(): string {
    // Generate simple PGN from move history
    if (this.moveHistory.length > 0) {
      const moves = this.moveHistory
        .map((m, i) => {
          const moveNum = Math.floor(i / 2) + 1;
          return i % 2 === 0 ? `${moveNum}. ${m.san}` : m.san;
        })
        .join(" ");
      // Return formatted PGN with starting position
      return `[FEN "${this.fen}"] ${moves}`;
    }
    return this.pgn || "";
  }

  getHistory(): ValidatedMove[] {
    return this.moveHistory;
  }

  isGameOver = vi.fn(() => this.isFinished);

  isCheck = vi.fn(() => false);

  isCheckmate = vi.fn(() => false);

  isStalemate = vi.fn(() => false);

  isDraw = vi.fn(() => false);

  turn(): "w" | "b" {
    return "w";
  }

  getCurrentMoveIndex(): number {
    return this.currentMoveIndex !== undefined
      ? this.currentMoveIndex
      : this.moveHistory.length - 1;
  }

  validateFen(_fen: string): boolean {
    return true;
  }

  validateMove(
    _move: { from: string; to: string; promotion?: string } | string
  ): boolean {
    // Always return true for testing - moves are valid
    return true;
  }

  redo(): ValidatedMove | null {
    // Simple redo implementation
    return null;
  }

  moves(options?: { square?: string; verbose?: boolean }): any[] {
    // Return some valid moves for testing
    // For King endgames, return typical king moves
    if (options?.verbose) {
      return [
        { from: 'e1', to: 'e2', san: 'Ke2' },
        { from: 'e1', to: 'd1', san: 'Kd1' },
        { from: 'e1', to: 'f1', san: 'Kf1' },
        { from: 'd7', to: 'd6', san: 'Kd6' },
      ];
    }
    // Return simple move strings when not verbose
    return ['Ke2', 'Kd1', 'Kf1', 'Kd6'];
  }

  getSquare(_square: string): { type: string; color: "w" | "b" } | null {
    return null;
  }

  getLegalMoves(square?: string): string[] {
    // Return legal moves for testing
    // Support common test squares
    if (square === 'e1') {
      return ['e2', 'd1', 'f1', 'd2', 'f2'];
    }
    if (square === 'd7') {
      return ['d6', 'd8', 'c6', 'c7', 'c8', 'e6', 'e7', 'e8'];
    }
    // Default to some moves for any square
    return ['e2', 'e3', 'e4'];
  }

  onMove(callback: (move: ValidatedMove) => void): void {
    this.on("move", callback);
  }

  onUndo(callback: (move: ValidatedMove) => void): void {
    this.on("undo", callback);
  }

  onStateChange(callback: () => void): void {
    this.on("stateChange", callback);
  }

  override removeAllListeners(): this {
    super.removeAllListeners();
    return this;
  }

  // Subscribe method for rootStore
  subscribe(callback: (event: any) => void): () => void {
    // Forward stateUpdate events properly
    const handleStateUpdate = (event: any): void => {
      // If event already has the correct structure, pass it through
      if (event && event.type === "stateUpdate") {
        callback(event);
      } else {
        // Otherwise create the proper structure
        callback({
          type: "stateUpdate",
          payload: {
            fen: this.fen,
            pgn: this.getPgn(),
            moveHistory: this.moveHistory,
            currentMoveIndex: this.getCurrentMoveIndex(),
            isGameOver: this.isFinished,
            gameResult: null,
          },
        });
      }
    };

    this.on("stateUpdate", handleStateUpdate);

    // Return unsubscribe function
    return () => {
      this.off("stateUpdate", handleStateUpdate);
    };
  }
}

// Export singleton instance
export const chessService = new MockChessService();
export const ChessService = MockChessService;
export default chessService;
