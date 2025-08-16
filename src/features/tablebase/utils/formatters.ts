/**
 * Tablebase Formatters - UI Text Formatting
 *
 * Converts tablebase data into user-friendly German text.
 * This keeps the service layer clean of UI concerns.
 */

import type { TablebaseEvaluation, TablebaseMove } from '../types/interfaces';

/**
 * Format evaluation to German text
 *
 * @param evaluation - Tablebase evaluation
 * @returns German description of the position
 *
 * @example
 * formatEvaluationGerman({ outcome: 'win', dtm: 10 })
 * // Returns: "Gewinn in 5 Zügen"
 */
export function formatEvaluationGerman(evaluation: TablebaseEvaluation): string {
  const { outcome, dtm } = evaluation;

  switch (outcome) {
    case 'win':
      if (dtm !== undefined && dtm !== null) {
        // DTM is in plies (half-moves), convert to full moves
        const moves = Math.ceil(Math.abs(dtm) / 2);
        return `Gewinn in ${moves} ${moves === 1 ? 'Zug' : 'Zügen'}`;
      }
      return 'Gewinn';

    case 'loss':
      if (dtm !== undefined && dtm !== null) {
        const moves = Math.ceil(Math.abs(dtm) / 2);
        return `Verlust in ${moves} ${moves === 1 ? 'Zug' : 'Zügen'}`;
      }
      return 'Verlust';

    case 'draw':
      return 'Remis';

    default:
      return 'Unbekannt';
  }
}

/**
 * Format move to German text
 *
 * @param move - Tablebase move
 * @returns German description of the move
 *
 * @example
 * formatMoveGerman({ san: 'Qh5+', outcome: 'win', dtm: 3 })
 * // Returns: "Qh5+ - Gewinn in 2 Zügen"
 */
export function formatMoveGerman(move: TablebaseMove): string {
  const evaluation = {
    outcome: move.outcome,
    dtm: move.dtm,
    dtz: move.dtz,
  };

  const evalText = formatEvaluationGerman(evaluation);
  return `${move.san} - ${evalText}`;
}

/**
 * Format outcome to simple German text
 *
 * @param outcome - Win, draw, or loss
 * @returns German word for the outcome
 */
export function formatOutcomeGerman(outcome: 'win' | 'draw' | 'loss'): string {
  const outcomeMap = {
    win: 'Gewinn',
    draw: 'Remis',
    loss: 'Verlust',
  };

  return outcomeMap[outcome] || 'Unbekannt';
}

/**
 * Format error message to German
 *
 * @param error - Error from tablebase service
 * @returns User-friendly German error message
 */
export function formatErrorGerman(error: unknown): string {
  if (!error) {
    return 'Ein unbekannter Fehler ist aufgetreten';
  }

  if (error instanceof Error) {
    // Check for specific error codes
    if ('code' in error) {
      const errorCode = (error as Record<string, unknown>)['code'];

      switch (errorCode) {
        case 'NOT_FOUND':
          return 'Position nicht in der Tablebase gefunden';

        case 'INVALID_FEN':
          return 'Ungültige Schachposition';

        case 'UNAVAILABLE':
          return 'Tablebase-Service ist momentan nicht verfügbar';

        case 'API_ERROR':
          return 'Fehler beim Abrufen der Tablebase-Daten';

        default:
          return 'Ein Fehler ist aufgetreten';
      }
    }

    // Generic error with message
    if (error.message) {
      // Don't expose technical details to users
      return 'Ein Fehler ist aufgetreten';
    }
  }

  return 'Ein unbekannter Fehler ist aufgetreten';
}

/**
 * Get move quality indicator for UI
 *
 * @param outcome - Move outcome
 * @returns Emoji or symbol for move quality
 */
export function getMoveQualityIndicator(outcome: 'win' | 'draw' | 'loss'): string {
  switch (outcome) {
    case 'win':
      return '✓'; // Checkmark for winning moves
    case 'draw':
      return '='; // Equals for drawing moves
    case 'loss':
      return '✗'; // X for losing moves
    default:
      return '?';
  }
}

/**
 * Get CSS class for move quality
 *
 * @param outcome - Move outcome
 * @returns CSS class name for styling
 */
export function getMoveQualityClass(outcome: 'win' | 'draw' | 'loss'): string {
  switch (outcome) {
    case 'win':
      return 'move-quality-win';
    case 'draw':
      return 'move-quality-draw';
    case 'loss':
      return 'move-quality-loss';
    default:
      return 'move-quality-unknown';
  }
}
