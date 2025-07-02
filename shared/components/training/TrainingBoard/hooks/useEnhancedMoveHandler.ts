import { useCallback } from 'react';
import { Chess } from 'chess.js';

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
      console.log('⚠️ useEnhancedMoveHandler: Move blocked - engine not ready or game finished');
      return;
    }

    console.log('🎯 useEnhancedMoveHandler: Processing player move:', move);

    try {
      // 1. Make player move
      const moveResult = await makeMove(move);
      
      if (moveResult) {
        console.log('✅ useEnhancedMoveHandler: Player move successful, starting engine response');
        
        // 2. Show evaluation briefly
        if (lastEvaluation) {
          showEvaluationBriefly();
        }

        // 3. Get and make engine move
        await handleEngineResponse();
      } else {
        onWarning('Ungültiger Zug');
      }
    } catch (error) {
      console.error('❌ useEnhancedMoveHandler: Move processing failed:', error);
      onEngineError('Zug konnte nicht verarbeitet werden');
    }
  }, [scenarioEngine, isGameFinished, makeMove, lastEvaluation, showEvaluationBriefly, onWarning, onEngineError, game]);

  const handleEngineResponse = useCallback(async () => {
    if (!scenarioEngine || typeof scenarioEngine.getBestMove !== 'function') {
      console.log('⚠️ useEnhancedMoveHandler: No engine available for response');
      return;
    }

    try {
      console.log('🤖 useEnhancedMoveHandler: Getting engine move for FEN:', game.fen());
      
      const engineMoveUci = await scenarioEngine.getBestMove(game.fen());
      console.log('🤖 useEnhancedMoveHandler: Engine returned UCI:', engineMoveUci);

      if (typeof engineMoveUci === 'string' && engineMoveUci.length >= 4) {
        const engineMove = parseUciMove(engineMoveUci);
        console.log('🤖 useEnhancedMoveHandler: Making engine move:', engineMove);
        
        const engineMoveResult = await makeMove(engineMove);
        
        if (engineMoveResult) {
          console.log('✅ useEnhancedMoveHandler: Engine move successful');
        } else {
          console.error('❌ useEnhancedMoveHandler: Engine move failed');
          onEngineError('Engine-Zug ungültig');
        }
      } else {
        console.log('⚠️ useEnhancedMoveHandler: Engine returned invalid move:', engineMoveUci);
      }
    } catch (error) {
      console.error('❌ useEnhancedMoveHandler: Engine move error:', error);
      onEngineError('Engine-Zug fehlgeschlagen');
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