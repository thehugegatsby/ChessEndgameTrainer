import React, { useEffect, useCallback, useMemo } from 'react';
import { Chess, Move } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { useChessGame } from '../../../hooks/useChessGame';
import { useEvaluation } from '../../../hooks/useEvaluation';
import { ErrorDisplay } from './ErrorDisplay';
import { ChessboardContainer } from './components/ChessboardContainer';
import { 
  useScenarioEngine, 
  useTrainingState, 
  useEnhancedMoveHandler 
} from './hooks';

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

interface TrainingBoardProps {
  fen?: string;
  position?: PositionInfo;
  onComplete: (success: boolean) => void;
  onHistoryChange?: (moves: Move[]) => void;
  onEvaluationsChange?: (evaluations: ExtendedEvaluation[]) => void;
  onPositionChange?: (currentFen: string, pgn: string) => void;
  onJumpToMove?: (jumpToMoveFunc: (moveIndex: number) => void) => void;
  currentMoveIndex?: number;
}

/**
 * Modular TrainingBoard component
 * Now uses custom hooks and smaller components for better testability
 */
export const TrainingBoard: React.FC<TrainingBoardProps> = ({ 
  fen, 
  position, 
  onComplete, 
  onHistoryChange, 
  onEvaluationsChange, 
  onPositionChange,
  onJumpToMove,
  currentMoveIndex = -1 
}) => {
  const initialFen = fen || position?.fen || '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
  
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
    onComplete,
    onPositionChange
  });

  // Calculate previous FEN for tablebase move comparison
  const previousFen = useMemo(() => {
    if (history.length === 0) {
      return undefined; // No previous position
    }
    
    // Reconstruct game state before the last move
    const tempGame = new Chess(initialFen);
    for (let i = 0; i < history.length - 1; i++) {
      tempGame.move(history[i]);
    }
    
    const prevFen = tempGame.fen();
    console.log('🔍 TrainingBoard - Calculated previousFen:', {
      currentFen,
      previousFen: prevFen,
      historyLength: history.length
    });
    
    return prevFen;
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

  // UI state management
  const trainingState = useTrainingState();

  // Scenario engine management
  const { scenarioEngine, isEngineReady, engineError } = useScenarioEngine({
    initialFen,
    onError: trainingState.setEngineError
  });

  // Enhanced move handling
  const { handleMove } = useEnhancedMoveHandler({
    scenarioEngine,
    isGameFinished,
    game,
    makeMove,
    lastEvaluation,
    onWarning: trainingState.setWarning,
    onEngineError: trainingState.setEngineError,
    showEvaluationBriefly: trainingState.showEvaluationBriefly
  });

  // === EVENT HANDLERS ===

  // Handle piece drop
  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    console.log('🎯 TrainingBoard: onDrop called from', sourceSquare, 'to', targetSquare);
    if (isGameFinished) return false;

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    };

    console.log('🎯 TrainingBoard: About to call handleMove');
    handleMove(move);
    return true;
  }, [handleMove, isGameFinished]);

  // Enhanced reset handler that includes all cleanup
  const handleReset = useCallback(() => {
    resetGame();
    clearEvaluations();
    trainingState.handleReset();
  }, [resetGame, clearEvaluations, trainingState.handleReset]);

  // === EFFECTS ===

  // Update parent with move history
  useEffect(() => {
    if (onHistoryChange) {
      onHistoryChange(history);
    }
  }, [history, onHistoryChange]);

  // Update parent with evaluations (now with tablebase data!)
  useEffect(() => {
    if (onEvaluationsChange) {
      console.log('🏆 TrainingBoard - Sending evaluations with tablebase data:', evaluations);
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