import { useState, useCallback } from 'react';

interface MoveError {
  move: string;
  message: string;
  engineResponded: boolean;
}

export interface UseTrainingStateReturn {
  // State
  warning: string | null;
  engineError: string | null;
  moveError: MoveError | null;
  showMoveErrorDialog: boolean;
  showLastEvaluation: boolean;
  resetKey: number;

  // Actions
  setWarning: (warning: string | null) => void;
  setEngineError: (error: string | null) => void;
  setMoveError: (error: MoveError | null) => void;
  setShowMoveErrorDialog: (show: boolean) => void;
  setShowLastEvaluation: (show: boolean) => void;
  handleReset: () => void;
  handleDismissMoveError: () => void;
  handleClearWarning: () => void;
  handleClearEngineError: () => void;
  showEvaluationBriefly: () => void;
}

/**
 * Custom hook for managing TrainingBoard UI state
 * Centralizes all state management for warnings, errors, overlays, and resets
 */
export const useTrainingState = (): UseTrainingStateReturn => {
  // UI State
  const [warning, setWarning] = useState<string | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<MoveError | null>(null);
  const [showMoveErrorDialog, setShowMoveErrorDialog] = useState(false);
  const [showLastEvaluation, setShowLastEvaluation] = useState(false);
  const [resetKey, setResetKey] = useState<number>(0);

  // Action handlers
  const handleReset = useCallback(() => {
    setWarning(null);
    setEngineError(null);
    setMoveError(null);
    setShowMoveErrorDialog(false);
    setShowLastEvaluation(false);
    setResetKey(prev => prev + 1);
    
  }, [resetKey]);

  const handleDismissMoveError = useCallback(() => {
    setMoveError(null);
    setShowMoveErrorDialog(false);
  }, []);

  const handleClearWarning = useCallback(() => {
    setWarning(null);
  }, []);

  const handleClearEngineError = useCallback(() => {
    setEngineError(null);
  }, []);

  const showEvaluationBriefly = useCallback(() => {
    setShowLastEvaluation(true);
    
    setTimeout(() => {
      setShowLastEvaluation(false);
    }, 3000);
  }, []);

  return {
    // State
    warning,
    engineError,
    moveError,
    showMoveErrorDialog,
    showLastEvaluation,
    resetKey,

    // Actions
    setWarning,
    setEngineError,
    setMoveError,
    setShowMoveErrorDialog,
    setShowLastEvaluation,
    handleReset,
    handleDismissMoveError,
    handleClearWarning,
    handleClearEngineError,
    showEvaluationBriefly
  };
}; 