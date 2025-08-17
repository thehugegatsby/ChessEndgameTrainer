/**
 * Evaluation text generation utilities
 * 
 * Provides German text generation for tablebase evaluation categories.
 * Separated from service layer to maintain clean separation of concerns.
 */

/**
 * Generate evaluation text in German based on category and distance-to-zero
 * 
 * @param category - Tablebase evaluation category
 * @param dtz - Distance to zero (50-move rule), if available
 * @returns German text description of the evaluation
 */
export function getEvaluationText(category: string, dtz?: number | null): string {
  switch (category) {
    case 'win':
      return dtz ? `Gewinn in ${Math.abs(dtz)} Zügen` : 'Theoretisch gewonnen';
    case 'cursed-win':
      return dtz ? `Gewinn in ${Math.abs(dtz)} Zügen (50-Zug-Regel)` : 'Gewinn mit 50-Zug-Regel';
    case 'maybe-win':
      return 'Wahrscheinlicher Gewinn';
    case 'draw':
      return 'Theoretisches Remis';
    case 'blessed-loss':
      return dtz
        ? `Verlust in ${Math.abs(dtz)} Zügen (50-Zug-Regel)`
        : 'Verlust mit 50-Zug-Regel';
    case 'maybe-loss':
      return 'Wahrscheinlicher Verlust';
    case 'loss':
      return dtz ? `Verlust in ${Math.abs(dtz)} Zügen` : 'Theoretisch verloren';
    case 'unknown':
      return 'Unbekannte Bewertung';
    default:
      return 'Bewertung nicht verfügbar';
  }
}