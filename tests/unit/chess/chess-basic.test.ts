import { Chess } from 'chess.js';

describe('Chess Logic', () => {
  let chess: Chess;

  beforeEach(() => {
    chess = new Chess();
  });

  test('should start with initial position', () => {
    expect(chess.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  test('should allow legal moves', () => {
    const move = chess.move('e4');
    expect(move).not.toBeNull();
    expect(chess.fen()).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
  });

  test('should prevent illegal moves', () => {
    chess.move('e4');
    expect(() => chess.move('e2')).toThrow();
  });

  test('should detect check', () => {
    chess.load('4k3/5Q2/8/8/8/8/8/4K3 w - - 0 1');
    chess.move('Qe7');
    expect(chess.isCheck()).toBe(true);
  });

  test('should detect checkmate', () => {
    chess.load('7k/7Q/7K/8/8/8/8/8 w - - 0 1');
    chess.move('Qg7');
    expect(chess.isCheckmate()).toBe(true);
  });
}); 