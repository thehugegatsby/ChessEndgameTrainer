import { checkSuccess } from '@shared/lib/chess/successCriteria';
import { Chess } from 'chess.js';

describe('checkSuccess', () => {
  it('sollte bei einem Schachmatt true zurückgeben', () => {
    // König im Eck, Turm gibt Matt
    const game = new Chess('8/8/8/8/8/8/k7/R6K b - - 0 1');
    game.move({ from: 'a2', to: 'a1' }); // König auf a1
    game.move({ from: 'h1', to: 'h2' }); // König flieht, aber Turm auf a1 gibt Matt
    const isSuccess = checkSuccess(game);
    expect(isSuccess).toBe(true);
  });

  it('sollte bei einem Patt (Stalemate) true zurückgeben', () => {
    // König im Eck, Dame verhindert alle Züge
    const game = new Chess('7k/8/8/8/8/8/5Q2/5K2 b - - 0 1');
    game.move({ from: 'h8', to: 'h7' });
    game.move({ from: 'f1', to: 'g2' });
    game.move({ from: 'h7', to: 'h8' });
    game.move({ from: 'f2', to: 'f7' }); // Dame auf f7, König auf h8 im Patt
    const isSuccess = checkSuccess(game);
    expect(isSuccess).toBe(true);
  });

  it('sollte bei einer normalen Spielsituation false zurückgeben', () => {
    const game = new Chess(); // Startposition
    const isSuccess = checkSuccess(game);
    expect(isSuccess).toBe(false);
  });

  it('sollte bei dreifacher Stellungswiederholung (Threefold Repetition) true zurückgeben', () => {
    const game = new Chess();
    game.move('Nf3'); game.move('Nf6');
    game.move('Ng1'); game.move('Ng8');
    game.move('Nf3'); game.move('Nf6');
    game.move('Ng1'); game.move('Ng8');
    // Die Stellung ist jetzt 3x aufgetreten
    const isSuccess = checkSuccess(game);
    expect(isSuccess).toBe(true);
  });
}); 