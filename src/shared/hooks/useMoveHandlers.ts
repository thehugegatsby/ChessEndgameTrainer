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
import { Chess } from 'chess.js';
import { getLogger } from '@shared/services/logging/Logger';
import { useUIStore } from '@shared/store/hooks';
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
  /** Event handler for piece drop events from drag-and-drop */
  onDrop: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
  /** Event handler for square click events (click-to-move) */
  onSquareClick: ({ piece, square }: { piece: PieceType; square: string }) => void;
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
  const [, uiActions] = useUIStore();
  
  // Click-to-move state management
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  /**
   * Clear the current square selection
   */
  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
  }, []);

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
      const logger = getLogger().setContext("useMoveHandlers-handleMove");
      logger.debug("🚀 handleMove called", {
        move,
        isGameFinished,
        isPositionReady,
        hasCurrentPosition: !!trainingState.currentPosition,
        currentFen,
      });

      // CRITICAL: Block moves if position is not ready
      if (!isPositionReady) {
        logger.warn("⛔ Position not ready, blocking move", {
          hasCurrentPosition: !!trainingState.currentPosition,
          currentPositionId: trainingState.currentPosition?.id,
          currentPositionFen: trainingState.currentPosition?.fen,
        });
        return false;
      }

      // Add these critical debug logs
      const moveLogger = getLogger().setContext("useMoveHandlers-handleMove");
      moveLogger.debug("handleMove called", { move });
      moveLogger.debug("Current FEN", { fen: currentFen });

      if (isGameFinished) {
        logger.warn("handleMove early return", { isGameFinished });
        return false;
      }

      // Check if piece was dropped on same square (no move)
      if (move.from === move.to) {
        logger.debug("Piece dropped on same square, ignoring", {
          square: move.from,
        });
        return false;
      }

      try {
        // Debug: Log game state before validation
        logger.debug("Game state before move validation", {
          hasGame: false, // game is now null, handled by ChessService
          currentFen: currentFen,
        });

        // Move validation is handled by ChessService in makeMove
        // We don't need to validate here anymore
        logger.debug("Move validation delegated to ChessService", {
          move,
          currentFen,
        });

        // First make the move on the local game instance
        logger.debug("Calling onMove callback", { move });
        const result = await onMove(move);
        logger.debug("onMove result", { result });

        // The orchestrator now handles the entire workflow including:
        // - Move validation
        // - Error dialog for suboptimal moves
        // - Opponent turn (only if move was optimal)
        // TrainingBoard should NOT call handleOpponentTurn directly

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Move failed";
        uiActions.showToast(errorMessage, "error");
        return false;
      }
    },
    [
      isGameFinished,
      onMove,
      trainingState,
      uiActions,
      currentFen,
      isPositionReady,
    ],
  );

  /**
   * Handles piece drop events from the chessboard
   *
   * @param {string} sourceSquare - Square where piece was picked up
   * @param {string} targetSquare - Square where piece was dropped
   * @param {string} piece - Piece type (required by interface)
   * @returns {boolean} Whether the drop was accepted
   *
   * @description
   * Converts drag-and-drop events into move objects and delegates
   * to the main move handler. Always promotes to queen by default.
   *
   * @remarks
   * This is the primary user interaction handler for the chess board.
   * Returns false if game is finished to prevent further moves.
   * The actual move validation happens in handleMove.
   *
   * @example
   * ```typescript
   * // User drags pawn from e2 to e4
   * onDrop("e2", "e4", "wP") // returns true if valid
   * ```
   */
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string): boolean => {
      const logger = getLogger().setContext("useMoveHandlers-onDrop");

      logger.debug("🎯 onDrop called", {
        sourceSquare,
        targetSquare,
        piece,
        isPositionReady,
        isGameFinished,
        hasCurrentPosition: !!trainingState.currentPosition,
        currentFen,
      });

      // Block drops if position is not ready or game is finished
      if (!isPositionReady || isGameFinished) {
        logger.warn("⛔ onDrop blocked", {
          isPositionReady,
          isGameFinished,
          reason: !isPositionReady ? "position not ready" : "game finished",
        });
        return false;
      }

      // Check if this is a pawn promotion
      const isPawn = piece.toLowerCase().endsWith("p");
      const targetRank = targetSquare[1];
      const isPromotionRank = targetRank === "8" || targetRank === "1";

      const move: MoveInput = {
        from: sourceSquare,
        to: targetSquare,
      };

      // Add promotion if pawn reaches last rank
      if (isPawn && isPromotionRank) {
        move.promotion = "q"; // Default to queen promotion
      }

      logger.debug("✅ onDrop calling handleMove", { move });
      handleMove(move);
      return true;
    },
    [
      handleMove,
      isGameFinished,
      isPositionReady,
      trainingState.currentPosition,
      currentFen,
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
      const logger = getLogger().setContext("useMoveHandlers-onSquareClick");

      logger.debug("🖱️ onSquareClick called", {
        square,
        selectedSquare,
        isPositionReady,
        isGameFinished,
      });

      // Block clicks if position is not ready or game is finished
      if (!isPositionReady || isGameFinished) {
        logger.warn("⛔ onSquareClick blocked", {
          isPositionReady,
          isGameFinished,
          reason: !isPositionReady ? "position not ready" : "game finished",
        });
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
              logger.debug("✅ Square selected", { square, piece });
            } else {
              logger.debug("❌ Wrong color piece", { square, piece, currentTurn });
            }
          } catch (error) {
            logger.error("Failed to validate piece color", error as Error);
          }
        } else {
          logger.debug("❌ No piece on square", { square });
        }
        return;
      }

      // If same square clicked, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        logger.debug("🔄 Square deselected", { square });
        return;
      }

      // Try to make move from selected square to clicked square
      const result = onDrop(selectedSquare, square, ""); // Piece type not needed
      if (result) {
        setSelectedSquare(null); // Clear selection after successful move
        logger.debug("✅ Move completed via click", { from: selectedSquare, to: square });
      } else {
        logger.debug("❌ Move failed via click", { from: selectedSquare, to: square });
      }
    },
    [selectedSquare, isPositionReady, isGameFinished, currentFen, onDrop],
  );

  return {
    onDrop,
    onSquareClick,
    selectedSquare,
    clearSelection,
  };
};