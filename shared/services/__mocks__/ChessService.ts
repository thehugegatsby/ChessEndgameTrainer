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
  }

  initialize(fen: string): void {
    this.fen = fen;
    this.pgn = "";
    this.moveHistory = [];
    this.isFinished = false;
    this.emit("stateChange");
  }

  move(
    move: { from: string; to: string; promotion?: string } | string,
  ): ValidatedMove | null {
    // Simulate a successful move
    const validatedMove: ValidatedMove = {
      from: (typeof move === "object" ? move.from : "e2") as Square,
      to: (typeof move === "object" ? move.to : "e4") as Square,
      san: typeof move === "string" ? move : "Ke3",
      piece: "k",
      color: "w",
      flags: "",
      lan: "e2e3",
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

    // Emit the move event which the store listens to
    this.emit("move", validatedMove);
    this.emit("stateChange");

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
    this.emit("stateChange");
  }

  goToMove(index: number): void {
    // Simulate going to a specific move
    this.currentMoveIndex = index;
    this.emit("stateChange");
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
      return moves || "";
    }
    return this.pgn;
  }

  getHistory(): ValidatedMove[] {
    return this.moveHistory;
  }

  isGameOver(): boolean {
    return this.isFinished;
  }

  isCheck(): boolean {
    return false;
  }

  isCheckmate(): boolean {
    return false;
  }

  isStalemate(): boolean {
    return false;
  }

  isDraw(): boolean {
    return false;
  }

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

  getSquare(_square: string): { type: string; color: "w" | "b" } | null {
    return null;
  }

  getLegalMoves(_square?: string): string[] {
    return [];
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

  removeAllListeners(): this {
    super.removeAllListeners();
    return this;
  }

  // Subscribe method for rootStore
  subscribe(callback: (event: any) => void): () => void {
    // Listen to all events and forward them
    const handleMove = (_move: ValidatedMove) => {
      callback({
        type: "stateUpdate",
        payload: {
          fen: this.fen,
          pgn: this.getPgn(),
          moveHistory: this.moveHistory,
          currentMoveIndex: this.getCurrentMoveIndex(),
          isFinished: this.isFinished,
          gameResult: null,
        },
      });
    };

    const handleStateChange = () => {
      callback({
        type: "stateUpdate",
        payload: {
          fen: this.fen,
          pgn: this.getPgn(),
          moveHistory: this.moveHistory,
          currentMoveIndex: this.getCurrentMoveIndex(),
          isFinished: this.isFinished,
          gameResult: null,
        },
      });
    };

    this.on("move", handleMove);
    this.on("stateChange", handleStateChange);

    // Return unsubscribe function
    return () => {
      this.off("move", handleMove);
      this.off("stateChange", handleStateChange);
    };
  }
}

// Export singleton instance
export const chessService = new MockChessService();
export default chessService;
