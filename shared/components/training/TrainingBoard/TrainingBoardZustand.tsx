import React, { useEffect, useCallback, useMemo } from 'react';
import { Chess, Move } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { useChessGame, useEvaluation } from '../../../hooks';
import { ErrorDisplay } from './ErrorDisplay';
import { ChessboardContainer } from './components/ChessboardContainer';
import { 
  useScenarioEngine, 
  useTrainingState, 
  useEnhancedMoveHandler 
} from './hooks';
import { useTraining, useTrainingActions } from '@shared/store/store';
import { EndgamePosition } from '@shared/data/endgames/types';

interface PositionInfo {
  fen: string;
  name: string;
  description: string;
}

// Extended evaluation interface that matches our new MovePanel requirements
interface ExtendedEvaluation {
  evaluation: number;
  mateInMoves?: number;
  tablebase?: {
    isTablebasePosition: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    category?: string;
    dtz?: number;
  };
}

interface TrainingBoardZustandProps {
  fen?: string;
  position?: EndgamePosition;
  onComplete: (success: boolean) => void;
  onHistoryChange?: (moves: Move[]) => void;
  onEvaluationsChange?: (evaluations: ExtendedEvaluation[]) => void;
  onPositionChange?: (currentFen: string, pgn: string) => void;
  onJumpToMove?: (jumpToMoveFunc: (moveIndex: number) => void) => void;
  currentMoveIndex?: number;
  resetTrigger?: number;
}

/**
 * TrainingBoard component migrated to use Zustand store
 * This version uses the global Zustand store instead of React Context
 */
export const TrainingBoardZustand: React.FC<TrainingBoardZustandProps> = ({ 
  fen, 
  position, 
  onComplete, 
  onHistoryChange, 
  onEvaluationsChange, 
  onPositionChange,
  onJumpToMove,
  currentMoveIndex = -1,
  resetTrigger = 0
}) => {
  const initialFen = fen || position?.fen || '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
  
  // === ZUSTAND STORE ===
  const training = useTraining();
  const actions = useTrainingActions();
  
  // Set position in store on mount or when position changes
  useEffect(() => {
    if (position && (!training.currentPosition || training.currentPosition.id !== position.id)) {
      actions.setPosition(position);
    }
  }, [position, training.currentPosition, actions]);
  
  // === HOOKS ===
  
  // Chess game logic
  const {
    game,
    history,
    isGameFinished,
    currentFen,
    currentPgn,
    makeMove,
    jumpToMove,
    resetGame,
    undoMove
  } = useChessGame({
    initialFen,
    onComplete: (success) => {
      // Update Zustand store
      actions.completeTraining(success);
      // Call parent callback
      onComplete(success);
    },
    onPositionChange
  });

  // Sync move history with Zustand
  useEffect(() => {
    // Compare histories to avoid infinite loops
    const zustandHistory = training.moveHistory || [];
    const localHistory = history || [];
    
    if (localHistory.length > zustandHistory.length) {
      // Local has more moves, sync to Zustand
      const newMoves = localHistory.slice(zustandHistory.length);
      newMoves.forEach(move => actions.makeMove(move));
    } else if (zustandHistory.length > localHistory.length && localHistory.length === 0) {
      // Zustand has moves but local is empty (reset scenario)
      // Don't sync back to avoid conflicts during reset
    }
  }, [history, training.moveHistory, actions]);

  // Sync game finished state
  useEffect(() => {
    if (isGameFinished !== training.isGameFinished) {
      if (isGameFinished && !training.isGameFinished) {
        // Game just finished, this is handled by onComplete callback
      } else if (!isGameFinished && training.isGameFinished) {
        // Game was reset
        actions.resetPosition();
      }
    }
  }, [isGameFinished, training.isGameFinished, actions]);

  // Calculate previous FEN for tablebase move comparison
  const previousFen = useMemo(() => {
    if (history.length === 0) {
      return undefined;
    }
    
    if (history.length === 1) {
      return initialFen;
    }
    
    const tempGame = new Chess(initialFen);
    for (let i = 0; i < history.length - 1; i++) {
      tempGame.move(history[i]);
    }
    
    return tempGame.fen();
  }, [history, initialFen, currentFen]);

  // Evaluation logic
  const {
    evaluations,
    lastEvaluation,
    isEvaluating,
    error: evaluationError,
    addEvaluation,
    clearEvaluations
  } = useEvaluation({
    fen: currentFen,
    isEnabled: true,
    previousFen: previousFen
  });

  // Update Zustand with current evaluation
  useEffect(() => {
    if (lastEvaluation) {
      actions.setEvaluation(lastEvaluation);
    }
  }, [lastEvaluation, actions]);

  // UI state management
  const trainingState = useTrainingState();

  // Scenario engine management
  const { scenarioEngine, isEngineReady, engineError } = useScenarioEngine({
    initialFen,
    onError: trainingState.setEngineError
  });

  // Update engine status in Zustand
  useEffect(() => {
    if (!isEngineReady) {
      actions.setEngineStatus('initializing');
    } else if (engineError) {
      actions.setEngineStatus('error');
    } else if (isEvaluating) {
      actions.setEngineStatus('analyzing');
    } else {
      actions.setEngineStatus('ready');
    }
  }, [isEngineReady, engineError, isEvaluating, actions]);

  // Enhanced move handling
  const { handleMove } = useEnhancedMoveHandler({
    scenarioEngine,
    isGameFinished,
    game,
    makeMove: async (move) => {
      const result = await makeMove(move);
      if (result) {
        // Move was successful, it will be synced to Zustand via the history effect
      }
      return result;
    },
    lastEvaluation,
    onWarning: trainingState.setWarning,
    onEngineError: trainingState.setEngineError,
    showEvaluationBriefly: trainingState.showEvaluationBriefly
  });

  // === EVENT HANDLERS ===

  // Handle piece drop
  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    if (isGameFinished) return false;

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    };

    handleMove(move);
    return true;
  }, [handleMove, isGameFinished]);

  // Enhanced reset handler that includes all cleanup
  const handleReset = useCallback(() => {
    resetGame();
    clearEvaluations();
    trainingState.handleReset();
    actions.resetPosition();
  }, [resetGame, clearEvaluations, trainingState, actions]);

  // Handle reset trigger from parent
  useEffect(() => {
    if (resetTrigger > 0) {
      handleReset();
    }
  }, [resetTrigger]); // Remove handleReset from deps to avoid infinite loop

  // === EFFECTS ===

  // Update parent with move history
  useEffect(() => {
    if (onHistoryChange) {
      onHistoryChange(history);
    }
  }, [history, onHistoryChange]);

  // Update parent with evaluations
  useEffect(() => {
    if (onEvaluationsChange) {
      onEvaluationsChange(evaluations);
    }
  }, [evaluations, onEvaluationsChange]);

  // Provide jump to move function to parent
  useEffect(() => {
    if (onJumpToMove) {
      onJumpToMove(jumpToMove);
    }
  }, [onJumpToMove, jumpToMove]);

  // === RENDER ===

  return (
    <div className="flex flex-col items-center">
      {/* Chessboard with Evaluation Overlay */}
      <ChessboardContainer
        currentFen={currentFen}
        onPieceDrop={onDrop}
        isGameFinished={isGameFinished}
        resetKey={trainingState.resetKey}
        lastEvaluation={lastEvaluation}
        history={history}
        showLastEvaluation={trainingState.showLastEvaluation}
      />

      {/* Error and Warning Displays */}
      <ErrorDisplay
        warning={trainingState.warning}
        engineError={trainingState.engineError || evaluationError || engineError}
        moveError={trainingState.moveError}
        showMoveErrorDialog={trainingState.showMoveErrorDialog}
        onDismissMoveError={trainingState.handleDismissMoveError}
        onClearWarning={trainingState.handleClearWarning}
        onClearEngineError={trainingState.handleClearEngineError}
      />
    </div>
  );
};