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
        gameResult: null
      }
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
        gameResult: null
      }
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
        gameResult: null
      }
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
        gameResult: null
      }
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
  
  validateMove(_move: any): boolean {
    return true;
  }
  
  redo(): ValidatedMove | null {
    // Simple redo implementation
    return null;
  }
  
  moves(options?: { square?: string; verbose?: boolean }): any[] {
    // Simple implementation for testing
    if (options?.verbose) {
      return [];
    }
    return [];
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
    // Forward stateUpdate events properly
    const handleStateUpdate = (event: any) => {
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
export default chessService;
