import { ChessGame } from '../../../lib/chess';

describe('ChessGame', () => {
  const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  let game: ChessGame;

  beforeEach(() => {
    game = new ChessGame(startFen);
  });

  it('initialisiert mit FEN', () => {
    expect(game.getFen()).toBe(startFen);
  });

  it('macht einen gültigen Zug', () => {
    expect(game.makeMove('e2e4')).toBe(true);
    expect(game.getFen()).not.toBe(startFen);
  });

  it('verweigert ungültigen Zug', () => {
    expect(game.makeMove('e2e5')).toBe(false);
    expect(game.getFen()).toBe(startFen);
  });

  it('liefert alle legalen Züge', () => {
    const moves = game.getLegalMoves();
    expect(Array.isArray(moves)).toBe(true);
    expect(moves.length).toBeGreaterThan(0);
  });

  it('lädt eine neue Stellung', () => {
    const newFen = '8/8/8/8/8/8/8/K6k w - - 0 1';
    game.loadPosition(newFen);
    expect(game.getFen()).toBe(newFen);
  });

  it('liefert den Zug am Zug', () => {
    expect(game.getTurn()).toBe('w');
    game.makeMove('e2e4');
    expect(game.getTurn()).toBe('b');
  });

  it('erkennt kein Schach und kein Matt im Start', () => {
    expect(game.isCheck()).toBe(false);
    expect(game.isCheckmate()).toBe(false);
  });

  it('erkennt Schachmatt', () => {
    // Fool's mate: 1.f3 e5 2.g4 Qh4#
    const mateFen = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';
    game = new ChessGame(mateFen);
    game.makeMove('d8h4'); // Qh4#
    expect(game.isCheckmate()).toBe(true);
  });
}); 