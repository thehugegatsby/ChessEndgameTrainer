import type { Chess } from 'chess.js';

/**
 * Überprüft, ob ein Endspiel erfolgreich abgeschlossen wurde.
 * Erfolg bedeutet Matt, Patt (Stalemate), oder eine andere Remis-Art,
 * die das Ziel des Endspiels sein kann (z.B. Remis halten).
 * 
 * @param game Die aktuelle Chess.js-Instanz.
 * @returns {boolean} True, wenn das Spiel erfolgreich beendet wurde.
 */
export function checkSuccess(game: Chess): boolean {
  if (game.isCheckmate()) {
    return true;
  }

  if (game.isStalemate()) {
    return true;
  }

  if (game.isThreefoldRepetition()) {
    return true;
  }

  // Die 50-Züge-Regel ist auch ein Remis.
  if (game.isDraw()) {
    return true;
  }
  
  return false;
} 