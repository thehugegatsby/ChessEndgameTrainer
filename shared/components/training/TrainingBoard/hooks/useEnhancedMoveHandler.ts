import { useCallback } from 'react';
import { Chess } from 'chess.js';
import { ErrorService } from '@shared/services/errorService';

export interface UseEnhancedMoveHandlerOptions {
  scenarioEngine: any | null;
  isGameFinished: boolean;
  game: Chess;
  makeMove: (move: { from: string; to: string; promotion?: string }) => Promise<any>;
  lastEvaluation: any;
  onWarning: (warning: string) => void;
  onEngineError: (error: string) => void;
  showEvaluationBriefly: () => void;
}

export interface UseEnhancedMoveHandlerReturn {
  handleMove: (move: { from: string; to: string; promotion?: string }) => Promise<void>;
}

/**
 * Custom hook for handling player moves and triggering engine responses
 * Manages the complex interaction between player moves and engine moves
 */
export const useEnhancedMoveHandler = ({
  scenarioEngine,
  isGameFinished,
  game,
  makeMove,
  lastEvaluation,
  onWarning,
  onEngineError,
  showEvaluationBriefly
}: UseEnhancedMoveHandlerOptions): UseEnhancedMoveHandlerReturn => {

  const handleMove = useCallback(async (move: { from: string; to: string; promotion?: string }) => {
    if (!scenarioEngine || isGameFinished) {
      return;
    }


    try {
      // 1. Make player move
      const moveResult = await makeMove(move);
      
      if (moveResult) {
        
        // 2. Show evaluation briefly - DISABLED
        // if (lastEvaluation) {
        //   showEvaluationBriefly();
        // }

        // 3. Get and make engine move
        await handleEngineResponse();
      }
      // Invalid move - do nothing, just keep the current position
    } catch (error) {
      const userMessage = ErrorService.handleChessEngineError(error as Error, {
        component: 'useEnhancedMoveHandler',
        action: 'processMove',
        additionalData: { gameFinished: isGameFinished }
      });
      onEngineError(userMessage);
    }
  }, [scenarioEngine, isGameFinished, makeMove, lastEvaluation, showEvaluationBriefly, onWarning, onEngineError, game]);

  const handleEngineResponse = useCallback(async () => {
    if (!scenarioEngine || typeof scenarioEngine.getBestMove !== 'function') {
      return;
    }

    try {
      
      const engineMoveUci = await scenarioEngine.getBestMove(game.fen());

      if (typeof engineMoveUci === 'string' && engineMoveUci.length >= 4) {
        const engineMove = parseUciMove(engineMoveUci);
        
        const engineMoveResult = await makeMove(engineMove);
        
        if (engineMoveResult) {
        } else {
          const userMessage = ErrorService.handleChessEngineError(new Error('Engine move failed'), {
            component: 'useEnhancedMoveHandler',
            action: 'executeEngineMove'
          });
          onEngineError(userMessage);
        }
      } else {
      }
    } catch (error) {
      const userMessage = ErrorService.handleChessEngineError(error as Error, {
        component: 'useEnhancedMoveHandler',
        action: 'handleEngineResponse'
      });
      onEngineError(userMessage);
    }
  }, [scenarioEngine, game, makeMove, onEngineError]);

  return {
    handleMove
  };
};

/**
 * Parse UCI move string to move object
 * @param uciMove - UCI format move (e.g., "e2e4", "e7e8q")
 * @returns Move object with from, to, and optional promotion
 */
function parseUciMove(uciMove: string): { from: string; to: string; promotion?: string } {
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.length === 5 ? uciMove[4] : undefined;
  
  return promotion ? { from, to, promotion } : { from, to };
} 