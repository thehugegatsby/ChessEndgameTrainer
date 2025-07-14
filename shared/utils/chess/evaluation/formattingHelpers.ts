import type { EvaluationData } from '@shared/types';
import { EVALUATION } from '@shared/constants';

export const formatEvaluation = (evalData?: EvaluationData): string => {
  if (!evalData) return '0.00';
  
  if (evalData.mateInMoves !== undefined) {
    return `#${Math.abs(evalData.mateInMoves)}`;
  }
  
  const eval_ = evalData.evaluation;
  if (Math.abs(eval_) < 0.1) return '0.0';
  return eval_ > 0 ? `+${eval_.toFixed(1)}` : eval_.toFixed(1);
};

export const getEvaluationColor = (evalData?: EvaluationData): string => {
  if (!evalData) return 'text-gray-600';
  
  if (evalData.mateInMoves !== undefined) {
    return evalData.mateInMoves > 0 ? 'text-green-700' : 'text-red-700';
  }
  
  const eval_ = evalData.evaluation;
  if (eval_ > EVALUATION.COLOR_THRESHOLDS.EXCELLENT) return 'text-green-700';
  if (eval_ > EVALUATION.COLOR_THRESHOLDS.GOOD) return 'text-green-600';
  if (eval_ > EVALUATION.COLOR_THRESHOLDS.NEUTRAL_LOWER) return 'text-gray-600';
  if (eval_ > EVALUATION.COLOR_THRESHOLDS.INACCURATE) return 'text-orange-600';
  return 'text-red-600';
};

export const getEvaluationBarWidth = (evaluation?: number): number => {
  if (evaluation === undefined) return 50;
  // Convert evaluation to percentage (clamped between 0-100)
  return Math.max(0, Math.min(100, 50 + (evaluation * 10)));
};