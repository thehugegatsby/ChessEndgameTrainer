import { Engine } from './engine';
import { EVALUATION } from '@shared/constants';

/**
 * Prüft, ob der Zug von `fenBefore` zu `fenAfter` einen entscheidenden Fehler darstellt.
 * Heuristik:
 * 1. Wenn Bewertung von klar gewinnend (> +3 Pawns ≙ 300 cp) auf Remis (≤ +3 Pawns) oder schlechter fällt → Fehler.
 * 2. Wenn Bewertung von Remis / leicht besser auf klar verloren (< -3 Pawns) fällt → Fehler.
 */
export async function isCriticalMistake(fenBefore: string, fenAfter: string): Promise<boolean> {
  const engine = Engine.getInstance();
  const [evalBefore, evalAfter] = await Promise.all([
    engine.evaluatePosition(fenBefore),
    engine.evaluatePosition(fenAfter)
  ]);

  const beforeScore = evalBefore.mate !== null ? (evalBefore.mate > 0 ? EVALUATION.MATE_THRESHOLD : -EVALUATION.MATE_THRESHOLD) : evalBefore.score;
  const afterScore = evalAfter.mate !== null ? (evalAfter.mate > 0 ? EVALUATION.MATE_THRESHOLD : -EVALUATION.MATE_THRESHOLD) : evalAfter.score;

  const wasWinning = beforeScore > EVALUATION.WIN_THRESHOLD;
  const wasNotLosing = beforeScore >= EVALUATION.LOSS_THRESHOLD;
  const isNowDrawishOrWorse = afterScore <= EVALUATION.WIN_THRESHOLD;
  const isNowLosing = afterScore < EVALUATION.LOSS_THRESHOLD;

  // Gewinn -> Remis/Verlust  ODER  Remis -> Verlust
  if ((wasWinning && isNowDrawishOrWorse) || (wasNotLosing && isNowLosing)) {
    return true;
  }
  return false;
} 