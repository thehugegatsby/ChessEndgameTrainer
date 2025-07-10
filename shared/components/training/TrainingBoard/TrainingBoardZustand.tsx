import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Chess, Move } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { Chessboard } from 'react-chessboard';
import { Piece } from 'react-chessboard/dist/chessboard/types';
import { useEvaluation, useTrainingGame } from '../../../hooks';
import { useTraining, useTrainingActions, useUIActions, useStore } from '@shared/store/store';
import { EndgamePosition } from '@shared/data/endgames/types';
import { ScenarioEngine } from '@shared/lib/chess/ScenarioEngine';
import { ErrorService } from '@shared/services/errorService';
import { getLogger } from '@shared/services/logging';

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
  const uiActions = useUIActions();
  
  // Set position in store on mount or when position changes
  useEffect(() => {
    const logger = getLogger().setContext('TrainingBoard-PositionInit');
    
    if (position && (!training.currentPosition || training.currentPosition.id !== position.id)) {
      logger.info('Setting position in store', { 
        positionId: position.id, 
        title: position.title,
        fen: position.fen,
        currentPositionId: training.currentPosition?.id
      });
      actions.setPosition(position);
    }
  }, [position, training.currentPosition, actions]);
  
  // === HOOKS ===
  
  // Chess game logic - now using Store as single source of truth
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
  } = useTrainingGame({
    onComplete: (success) => {
      // Call parent callback
      onComplete(success);
    },
    onPositionChange
  });

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

  // UI state management - local component state only
  const [resetKey, setResetKey] = useState(0);
  const [showLastEvaluation, setShowLastEvaluation] = useState(false);
  const [showMoveErrorDialog, setShowMoveErrorDialog] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Use Store for scenario engine
  const scenarioEngine = training.scenarioEngine;

  const trainingState = {
    resetKey,
    showLastEvaluation,
    showMoveErrorDialog,
    warning,
    engineError,
    moveError,
    showEvaluationBriefly: () => {
      setShowLastEvaluation(true);
      setTimeout(() => setShowLastEvaluation(false), 2000);
    },
    handleReset: () => setResetKey(prev => prev + 1),
    handleDismissMoveError: () => {
      setShowMoveErrorDialog(false);
      setMoveError(null);
    },
    handleClearWarning: () => setWarning(null),
    handleClearEngineError: () => setEngineError(null)
  };

  // Initialize scenario engine only once per position
  useEffect(() => {
    const logger = getLogger().setContext('TrainingBoard-EngineInit');
    
    if (!position) {
      logger.warn('No position provided for engine initialization');
      return;
    }
    
    logger.info('Initializing scenario engine', { positionId: position.id, fen: position.fen });
    
    try {
      const engine = new ScenarioEngine(position.fen);
      actions.setScenarioEngine(engine);
      actions.setEngineStatus('ready');
      logger.info('Scenario engine initialized successfully', { positionId: position.id, status: 'ready' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Engine initialization failed';
      logger.error('Scenario engine initialization failed', { positionId: position.id, error: errorMessage });
      setEngineError(errorMessage);
      actions.setEngineStatus('error');
      ErrorService.handleChessEngineError(error as Error, { component: 'TrainingBoardZustand' });
    }
  }, [position?.id]); // Only depend on position ID to avoid re-initialization

  // Update engine status based on evaluation state
  useEffect(() => {
    if (isEvaluating) {
      actions.setEngineStatus('analyzing');
    } else if (training.engineStatus === 'analyzing') {
      // Only update to ready if we were analyzing
      actions.setEngineStatus('ready');
    }
  }, [isEvaluating, actions, training.engineStatus]);

  // Enhanced move handling - inline implementation
  const handleMove = useCallback(async (move: any) => {
    const logger = getLogger().setContext('TrainingBoard-handleMove');
    logger.debug('handleMove called', { move, hasScenarioEngine: !!scenarioEngine, isGameFinished });
    
    if (!scenarioEngine || isGameFinished) {
      logger.warn('handleMove early return', { hasScenarioEngine: !!scenarioEngine, isGameFinished });
      return null;
    }

    try {
      // Validate move with chess instance
      const possibleMoves = game.moves({ verbose: true });
      const isValidMove = possibleMoves.some((m: any) => 
        m.from === move.from && m.to === move.to
      );
      
      if (!isValidMove) {
        uiActions.showToast('Invalid move', 'warning');
        actions.incrementMistake();
        return null;
      }

      // First make the move on the local game instance
      const result = await makeMove(move);
      if (result) {
        // Then trigger engine response separately
        const currentFen = game.fen();
        const engineMove = await scenarioEngine.getBestMove(currentFen);
        if (engineMove) {
          // Make the engine move (getBestMove now returns an object directly)
          await makeMove(engineMove);
        }
        
        // Move was successful, it will be synced to Zustand via the history effect
        if (lastEvaluation) {
          trainingState.showEvaluationBriefly();
        }
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Move failed';
      uiActions.showToast(errorMessage, 'error');
      return null;
    }
  }, [scenarioEngine, isGameFinished, makeMove, lastEvaluation, trainingState, actions, uiActions]);

  // === TEST HOOK FOR E2E TESTING ===
  useEffect(() => {
    const logger = getLogger().setContext('TrainingBoard-E2E');
    
    // Check for E2E test mode via window flag OR environment variable
    const isE2ETest = (typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE__) || 
                      process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true';
    
    // Debug logging for E2E test setup
    logger.info('E2E Test Environment Check', {
      NEXT_PUBLIC_IS_E2E_TEST: process.env.NEXT_PUBLIC_IS_E2E_TEST,
      NODE_ENV: process.env.NODE_ENV,
      typeof_NEXT_PUBLIC_IS_E2E_TEST: typeof process.env.NEXT_PUBLIC_IS_E2E_TEST,
      window__E2E_TEST_MODE__: typeof window !== 'undefined' ? (window as any).__E2E_TEST_MODE__ : 'undefined',
      isE2ETest
    });
    
    // Only expose in test environment
    if (isE2ETest) {
      logger.info('Attaching e2e hooks to window object');
      
      (window as any).e2e_makeMove = async (move: string) => {
        logger.info('e2e_makeMove called', { move });
        logger.debug('Test move requested', { move });
        
        // Parse move notation (support 'e2-e4', 'e2e4', 'Ke2-e4', 'Ke2e4' formats)
        const moveMatch = move.match(/^([KQRBN]?)([a-h][1-8])-?([a-h][1-8])([qrbn])?$/i);
        if (!moveMatch) {
          logger.error('Invalid move format', { move });
          return { success: false, error: 'Invalid move format' };
        }
        
        const [, piece, from, to, promotion] = moveMatch;
        const moveObj = {
          from: from as Square,
          to: to as Square,
          promotion: promotion || 'q'
        };
        
        try {
          logger.debug('Calling handleMove', { moveObj });
          const result = await handleMove(moveObj);
          logger.info('handleMove result', { result });
          
          if (result) {
            logger.debug('Test move successful', { move, result });
            return { success: true, result };
          } else {
            logger.error('Test move failed - handleMove returned null/false', { move });
            return { success: false, error: 'Move rejected by engine' };
          }
        } catch (error) {
          logger.error('Error in e2e_makeMove', { move, error });
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      };
      
      // Also expose game state for debugging
      (window as any).e2e_getGameState = () => ({
        fen: game.fen(),
        turn: game.turn(),
        isGameOver: game.isGameOver(),
        moveCount: history.length,
        pgn: game.pgn()
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true') {
        delete (window as any).e2e_makeMove;
        delete (window as any).e2e_getGameState;
      }
    };
  }, [handleMove, game, history]);

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

  // === TEST MODE: AUTO-PLAY MOVES ===
  // Für E2E Tests: Spiele Züge automatisch ab via URL-Parameter
  const [testMoveProcessed, setTestMoveProcessed] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !testMoveProcessed) {
      const urlParams = new URLSearchParams(window.location.search);
      const testMoves = urlParams.get('moves');
      
      // Debug logging
      const logger = getLogger().setContext('TrainingBoard-TestMode');
      logger.debug('URL check', { 
        url: window.location.href, 
        search: window.location.search, 
        testMoves, 
        gameReady: !!game, 
        isGameFinished,
        historyLength: history.length,
        testMoveProcessed
      });
      
      if (testMoves && game && !isGameFinished) {
        setTestMoveProcessed(true);
        const moves = testMoves.split(',');
        let moveIndex = 0;
        
        logger.info('Starting automated moves', { moves, totalMoves: moves.length });
        
        const playNextMove = async () => {
          if (moveIndex < moves.length) {
            const moveNotation = moves[moveIndex];
            
            logger.debug('Attempting move', { moveIndex, moveNotation, currentHistoryLength: history.length });
            
            try {
              // Use the handleMove function which includes validation
              let move;
              if (moveNotation.includes('-')) {
                // Format: e2-e4
                const [from, to] = moveNotation.split('-');
                move = { from: from as Square, to: to as Square, promotion: 'q' };
              } else {
                // Format: e4 (SAN) - parse it properly
                const tempGame = new Chess(game.fen());
                move = tempGame.move(moveNotation);
                if (move) {
                  move = { from: move.from as Square, to: move.to as Square, promotion: move.promotion || 'q' };
                }
              }
              
              if (move) {
                logger.debug('Move parsed successfully', { move });
                const result = await handleMove(move);
                
                if (result) {
                  moveIndex++;
                  logger.debug('Move executed successfully', { moveIndex, newHistoryLength: history.length });
                  
                  // Warte kurz und dann nächster Zug
                  setTimeout(playNextMove, 1500);
                } else {
                  logger.warn('Move execution failed', { moveNotation });
                }
              } else {
                logger.warn('Move parsing returned null', { moveNotation });
                // Versuche nächsten Zug
                moveIndex++;
                setTimeout(playNextMove, 500);
              }
            } catch (error) {
              logger.error('Test move failed', error, { moveNotation });
              // Versuche nächsten Zug
              moveIndex++;
              setTimeout(playNextMove, 500);
            }
          } else {
            logger.info('Automated moves completed', { finalMoveIndex: moveIndex, finalHistoryLength: history.length });
          }
        };
        
        // Starte nach initialem Render
        setTimeout(playNextMove, 2000);
      }
    }
  }, [game, isGameFinished, handleMove, testMoveProcessed]);

  // === RENDER ===
  // Note: customSquareRenderer was removed as it's not supported in react-chessboard v2.1.3
  // E2E tests should use the board's data-testid="training-board" and other available selectors

  return (
    <div className="flex flex-col items-center">
      {/* Chessboard with Evaluation Overlay and E2E data attributes */}
      <div 
        className="relative" 
        key={trainingState.resetKey} 
        style={{ width: '600px', height: '600px' }}
        data-fen={currentFen}
        data-testid="training-board"
        data-engine-status={training.engineStatus}
      >
        <Chessboard
          position={currentFen}
          onPieceDrop={onDrop}
          arePiecesDraggable={!isGameFinished}
          boardWidth={600}
        />
        {/* Show last evaluation briefly */}
        {trainingState.showLastEvaluation && lastEvaluation && (
          <div className="absolute top-2 right-2 bg-white/90 p-2 rounded shadow-lg">
            <div className="text-sm font-semibold">
              Eval: {lastEvaluation.evaluation > 0 ? '+' : ''}{(lastEvaluation.evaluation / 100).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Error and Warning Displays - inline implementation */}
      {trainingState.warning && (
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {trainingState.warning}
          <button
            onClick={trainingState.handleClearWarning}
            className="ml-2 text-yellow-700 hover:text-yellow-900"
          >
            ×
          </button>
        </div>
      )}
      
      {(trainingState.engineError || evaluationError) && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {trainingState.engineError || evaluationError}
          <button
            onClick={trainingState.handleClearEngineError}
            className="ml-2 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}
      
      {trainingState.showMoveErrorDialog && trainingState.moveError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-2">Move Error</h3>
            <p>{trainingState.moveError}</p>
            <button
              onClick={trainingState.handleDismissMoveError}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};