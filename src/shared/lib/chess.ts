import { Chess } from 'chess.js';

export class ChessGame {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  getFen(): string {
    return this.chess.fen();
  }

  makeMove(move: string): boolean {
    try {
      const result = this.chess.move(move);
      return result !== null;
    } catch {
      return false;
    }
  }

  isCheck(): boolean {
    return this.chess.isCheck();
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  getLegalMoves(): string[] {
    return this.chess.moves();
  }

  loadPosition(fen: string): void {
    this.chess.load(fen);
  }

  getTurn(): 'w' | 'b' {
    return this.chess.turn();
  }
}
