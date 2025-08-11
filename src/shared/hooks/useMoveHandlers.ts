/**
 * @file Move handlers hook for chess training board
 * @module hooks/useMoveHandlers
 * 
 * @description
 * Custom hook that encapsulates all move handling logic for chess training.
 * Extracted from TrainingBoard to separate business logic from UI rendering.
 * Handles drag-and-drop, click-to-move, and core move validation logic.
 * 
 * @remarks
 * Key responsibilities:
 * - Chess move validation and execution
 * - Drag-and-drop event handling with promotion detection
 * - Click-to-move functionality with selection state
 * - Position readiness validation
 * - Comprehensive logging and error handling
 * 
 * This hook maintains all the complex business logic while providing
 * a clean interface for chess board components.
 * 
 * @example
 * ```tsx
 * const { onDrop, onSquareClick, selectedSquare } = useMoveHandlers({
 *   currentFen,
 *   isGameFinished,
 *   isPositionReady,
 *   trainingState,
 *   onMove: makeMove
 * });
 * 
 * <Chessboard
 *   fen={currentFen}
 *   onPieceDrop={onDrop}
 *   onSquareClick={onSquareClick}
 *   arePiecesDraggable={!isGameFinished}
 * />
 * ```
 */

import { useCallback, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { getLogger } from '@shared/services/logging/Logger';
import { showErrorToast } from '@shared/utils/toast';
import { useChessAudio } from './useChessAudio';
// import type { ValidatedMove } from '@shared/types/chess';

/**
 * Piece types from react-chessboard
 */
type PieceType = "wP" | "wN" | "wB" | "wR" | "wQ" | "wK" | "bP" | "bN" | "bB" | "bR" | "bQ" | "bK" | null;

/**
 * Basic move interface for chess moves
 */
interface MoveInput {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
}

/**
 * Training state structure (subset needed for move handling)
 */
interface TrainingStateSubset {
  currentPosition?: {
    id: number;
    fen: string;
  } | null;
  isPlayerTurn: boolean;
  isOpponentThinking: boolean;
}

/**
 * Props for useMoveHandlers hook
 */
interface UseMoveHandlersProps {
  /** Current FEN position string */
  currentFen: string;
  /** Whether the game has finished */
  isGameFinished: boolean;
  /** Whether the position is ready for interaction */
  isPositionReady: boolean;
  /** Training state subset needed for move validation */
  trainingState: TrainingStateSubset;
  /** Callback to execute moves - should be the makeMove function from useTrainingSession */
  onMove: (move: MoveInput) => Promise<boolean | null>;
}

/**
 * Return value from useMoveHandlers hook
 */
interface UseMoveHandlersReturn {
  /** Event handler for piece drop events from drag-and-drop with promotion support */
  onDrop: (sourceSquare: string, targetSquare: string, piece: string, promotion?: string) => boolean;
  /** Event handler for square click events (click-to-move) */
  onSquareClick: ({ piece, square }: { piece: PieceType; square: string }) => void;
  /** Function to check if a move is a pawn promotion */
  onPromotionCheck: (from: string, to: string) => boolean;
  /** Currently selected square for click-to-move functionality */
  selectedSquare: string | null;
  /** Utility function to clear the current selection */
  clearSelection: () => void;
}

/**
 * Custom hook for chess move handling logic
 * 
 * @description
 * Encapsulates all move handling logic including:
 * - Core move validation and execution
 * - Drag-and-drop event handling with promotion detection
 * - Click-to-move functionality with selection state management
 * - Position readiness validation and game state checks
 * - Comprehensive logging and error handling
 * 
 * @remarks
 * This hook maintains all the complex business logic that was previously
 * embedded in TrainingBoard. It coordinates between multiple services:
 * - Chess.js for move validation
 * - TrainingSession hook for game state via onMove callback
 * - UI actions for user feedback
 * - Logging service for debugging
 * 
 * The hook preserves all original functionality while providing a clean
 * interface that separates concerns between UI rendering and business logic.
 * 
 * @param props Configuration object with game state and callbacks
 * @returns Object with event handlers and selection state
 */
export const useMoveHandlers = ({
  currentFen,
  isGameFinished,
  isPositionReady,
  trainingState,
  onMove,
}: UseMoveHandlersProps): UseMoveHandlersReturn => {
  // Click-to-move state management
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  
  // Chess audio integration
  const { playSound } = useChessAudio({ volume: 0.7, enabled: true });

  /**
   * Analyze a move and play appropriate audio
   * 
   * @param move - The move that was made
   * @param beforeFen - FEN position before the move
   * @param afterFen - FEN position after the move
   */
  const analyzeMoveAndPlayAudio = useCallback(async (
    move: MoveInput,
    beforeFen: string,
    afterFen: string
  ) => {
    try {
      const chessAfter = new Chess(afterFen);
      const chessBefore = new Chess(beforeFen);
      
      // Check if move was a capture by comparing piece counts
      // More reliable than checking target square
      const piecesBefore = chessBefore.board().flat().filter(p => p !== null).length;
      const piecesAfter = chessAfter.board().flat().filter(p => p !== null).length;
      const wasCapture = piecesBefore > piecesAfter;
      
      // Check if position is now in check
      const isInCheck = chessAfter.inCheck();
      
      // Check game ending conditions
      const isCheckmate = chessAfter.isCheckmate();
      const isDraw = chessAfter.isDraw() || chessAfter.isStalemate();
      
      // Check if move was a promotion
      const wasPromotion = Boolean(move.promotion);
      
      // Play appropriate sound based on move characteristics
      if (isCheckmate) {
        await playSound('checkmate');
      } else if (isDraw) {
        await playSound('draw'); 
      } else if (wasPromotion) {
        await playSound('promotion');
      } else if (isInCheck) {
        await playSound('check');
      } else if (wasCapture) {
        await playSound('capture');
      } else {
        await playSound('move');
      }
      
    } catch (error) {
      getLogger().warn('Failed to analyze move for audio', error as Error);
    }
  }, [playSound]);

  /**
   * Clear the current square selection
   */
  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
  }, []);

  /**
   * Check if a move is a pawn promotion
   * 
   * @param {string} from - Starting square
   * @param {string} to - Target square
   * @returns {boolean} Whether this move is a promotion
   */
  const onPromotionCheck = useCallback((from: string, to: string): boolean => {
    try {
      const chess = new Chess(currentFen);
      const piece = chess.get(from as Square);
      
      // Must be a pawn
      if (!piece || piece.type !== 'p') {
        return false;
      }
      
      // Must be moving to promotion rank
      const targetRank = to[1];
      const isWhitePawn = piece.color === 'w';
      const isBlackPawn = piece.color === 'b';
      
      return (isWhitePawn && targetRank === '8') || (isBlackPawn && targetRank === '1');
    } catch (error) {
      getLogger().error("Failed to check promotion", error as Error);
      return false;
    }
  }, [currentFen]);

  /**
   * Handles chess move execution and validation
   *
   * @param {Object} move - Move object with from/to squares
   * @param {string} move.from - Starting square (e.g., "e2")
   * @param {string} move.to - Target square (e.g., "e4")
   * @param {string} [move.promotion] - Promotion piece if applicable
   * @returns {Promise<any>} Move result or null if invalid
   *
   * @description
   * Core move handler that:
   * 1. Validates move legality using chess.js
   * 2. Executes the move on the game instance
   * 3. Triggers tablebase analysis for opponent response
   * 4. Updates all relevant state slices
   * 5. Handles errors with user feedback
   *
   * @remarks
   * This function coordinates between multiple services:
   * - Chess.js for move validation
   * - TrainingSession hook for game state
   * - Tablebase orchestrator for opponent moves
   * - UI actions for user feedback
   *
   * Invalid moves increment the mistake counter and show
   * a warning toast without modifying game state.
   *
   * @example
   * ```typescript
   * // User drags piece
   * await handleMove({ from: "e2", to: "e4" });
   *
   * // With promotion
   * await handleMove({ from: "e7", to: "e8", promotion: "q" });
   * ```
   */
  const handleMove = useCallback(
    async (move: MoveInput) => {
      // CRITICAL: Block moves if position is not ready
      if (!isPositionReady) {
        getLogger().warn("Position not ready, blocking move", {
          currentPositionId: trainingState.currentPosition?.id,
        });
        return false;
      }

      if (isGameFinished) {
        return false;
      }

      // Check if piece was dropped on same square (no move)
      if (move.from === move.to) {
        return false;
      }

      try {
        // Capture current FEN before making the move for audio analysis
        const beforeFen = currentFen;
        
        // Move validation is handled by ChessService in makeMove
        const result = await onMove(move);

        // If the move was successful, analyze it and play appropriate audio
        if (result) {
          // Note: We need to get the FEN after the move from the store
          // This is a bit tricky because the move processing is async
          // For now, let's use setTimeout to let the store update
          setTimeout(() => {
            try {
              const chess = new Chess(beforeFen);
              chess.move(move);
              const afterFen = chess.fen();
              analyzeMoveAndPlayAudio(move, beforeFen, afterFen);
            } catch {
              // Fallback to generic move sound if analysis fails
              playSound('move');
            }
          }, 50);
        }

        // The orchestrator now handles the entire workflow including:
        // - Move validation
        // - Error dialog for suboptimal moves
        // - Opponent turn (only if move was optimal)
        // TrainingBoard should NOT call handleOpponentTurn directly

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Move failed";
        showErrorToast(errorMessage);
        // Play error sound for failed moves
        playSound('error');
        return false;
      }
    },
    [
      isGameFinished,
      onMove,
      trainingState,
      isPositionReady,
      currentFen,
      analyzeMoveAndPlayAudio,
      playSound,
    ],
  );

  /**
   * Handles piece drop events from the chessboard with promotion support
   *
   * @param {string} sourceSquare - Square where piece was picked up
   * @param {string} targetSquare - Square where piece was dropped
   * @param {string} piece - Piece type (required by interface)
   * @param {string} [promotion] - Selected promotion piece (from dialog)
   * @returns {boolean} Whether the drop was accepted
   *
   * @description
   * Converts drag-and-drop events into move objects and delegates
   * to the main move handler. Supports custom promotion piece selection
   * or defaults to queen if no promotion specified.
   *
   * @remarks
   * This is the primary user interaction handler for the chess board.
   * The promotion parameter is set by the PromotionDialog when a pawn
   * reaches the promotion rank.
   */
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string, _piece: string, promotion?: string): boolean => {
      // Block drops if position is not ready or game is finished
      if (!isPositionReady || isGameFinished) {
        return false;
      }

      const move: MoveInput = {
        from: sourceSquare,
        to: targetSquare,
      };

      // Add promotion piece if provided
      if (promotion) {
        move.promotion = promotion as "q" | "r" | "b" | "n";
      } else if (onPromotionCheck(sourceSquare, targetSquare)) {
        // If no promotion provided but move is a promotion, default to queen
        move.promotion = "q";
      }

      handleMove(move);
      return true;
    },
    [
      handleMove,
      isGameFinished,
      isPositionReady,
      onPromotionCheck,
    ],
  );

  /**
   * Handles square click events for click-to-move functionality
   * 
   * @param {object} args - Arguments from react-chessboard
   * @param {PieceType} args.piece - Piece on the clicked square (can be null)
   * @param {string} args.square - Square that was clicked
   * @returns {void}
   * 
   * @description
   * Implements click-to-move interaction pattern for accessibility and E2E testing:
   * - First click selects piece (if valid piece on square)
   * - Second click attempts move to target square
   * - Click on same square deselects piece
   */
  const onSquareClick = useCallback(
    ({ piece, square }: { piece: PieceType; square: string }): void => {
      // Block clicks if position is not ready or game is finished
      if (!isPositionReady || isGameFinished) {
        return;
      }

      // If no square is selected, select this square if it has a piece
      if (!selectedSquare) {
        if (piece) {
          // Check if it's the right color's turn
          try {
            const chess = new Chess(currentFen);
            const currentTurn = chess.turn();
            const pieceColor = piece?.[0]; // 'w' or 'b'
            
            if (pieceColor === currentTurn) {
              setSelectedSquare(square);
            }
          } catch (error) {
            getLogger().error("Failed to validate piece color", error as Error);
          }
        }
        return;
      }

      // If same square clicked, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Try to make move from selected square to clicked square
      const result = onDrop(selectedSquare, square, ""); // Piece type not needed
      if (result) {
        setSelectedSquare(null); // Clear selection after successful move
      }
    },
    [selectedSquare, isPositionReady, isGameFinished, currentFen, onDrop],
  );

  return {
    onDrop,
    onSquareClick,
    onPromotionCheck,
    selectedSquare,
    clearSelection,
  };
};