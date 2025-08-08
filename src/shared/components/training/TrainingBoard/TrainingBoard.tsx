/**
 * @file Interactive chess training board component
 * @module components/training/TrainingBoard
 *
 * @description
 * Core training interface for chess endgame practice. Provides an interactive
 * chessboard with real-time tablebase analysis, move validation, error feedback,
 * and training session management. Integrates with Zustand store for state management
 * and supports E2E testing with special hooks.
 *
 * @remarks
 * Key features:
 * - Interactive drag-and-drop chess moves
 * - Real-time tablebase position evaluation
 * - Move quality feedback with WDL analysis
 * - Training session tracking and completion
 * - E2E test support with programmatic move injection
 * - Responsive board sizing and animations
 *
 * The component acts as the main interface between the user and the chess
 * training system, coordinating between multiple services and state slices.
 */

// Module loading confirmed - debug logging removed for production

import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
import { Chess, Move } from "chess.js";
import { Chessboard } from "@shared/components/chess/Chessboard";
import { usePositionAnalysis, useTrainingSession } from "../../../hooks";
import { usePageReady } from "../../../hooks/usePageReady";
import {
  useGameStore,
  useTrainingStore,
  useTablebaseStore,
  useUIStore,
} from "@shared/store/hooks";
import { useStore, useStoreApi } from "@shared/store/StoreContext";
import { EndgamePosition } from "@shared/types";
import { getLogger } from "@shared/services/logging/Logger";
import { ANIMATION, DIMENSIONS } from "@shared/constants";
import { MoveErrorDialog } from "@shared/components/ui/MoveErrorDialog";
import { MoveSuccessDialog } from "@shared/components/ui/MoveSuccessDialog";
import { toLibraryMove } from "@shared/infrastructure/chess-adapter";
import {
  cancelScheduledOpponentTurn,
  scheduleOpponentTurn,
} from "@shared/store/orchestrators/handlePlayerMove";
import { chessService } from "@shared/services/ChessService";

/**
 * Extended evaluation data structure for move panel integration
 *
 * @interface ExtendedEvaluation
 *
 * @description
 * Provides comprehensive evaluation data including tablebase-specific
 * information for move quality assessment and UI display.
 */
interface ExtendedEvaluation {
  /** Numeric evaluation score (centipawns or mate distance) */
  evaluation: number;
  /** Number of moves to mate (if applicable) */
  mateInMoves?: number;
  /** Tablebase-specific evaluation data */
  tablebase?: {
    /** Whether position exists in tablebase */
    isTablebasePosition: boolean;
    /** Win/Draw/Loss value before move */
    wdlBefore?: number;
    /** Win/Draw/Loss value after move */
    wdlAfter?: number;
    /** Outcome category (e.g., "win", "draw", "loss") */
    category?: string;
    /** Distance to zero (moves to conversion) */
    dtz?: number;
  };
}

/**
 * Props for the TrainingBoard component
 *
 * @interface TrainingBoardProps
 *
 * @description
 * Configuration options for the training board, supporting both
 * controlled and uncontrolled usage patterns.
 */
interface TrainingBoardProps {
  /** Initial FEN position (if not using EndgamePosition) */
  fen?: string;
  /** Complete endgame position data with metadata */
  position?: EndgamePosition;
  /** Callback when training session completes */
  onComplete: (success: boolean) => void;
  /** Callback when move history changes */
  onHistoryChange?: (moves: Move[]) => void;
  /** Callback when position evaluations update */
  onEvaluationsChange?: (evaluations: ExtendedEvaluation[]) => void;
  /** Callback when board position changes */
  onPositionChange?: (currentFen: string, pgn: string) => void;
  /** Provides jump-to-move function to parent */
  onJumpToMove?: (jumpToMoveFunc: (moveIndex: number) => void) => void;
  /** Current move index for navigation */
  currentMoveIndex?: number;
  /** Trigger value to force board reset */
  resetTrigger?: number;
}

/**
 * Interactive chess training board component
 *
 * @component
 * @description
 * Main training interface providing an interactive chessboard with
 * real-time tablebase analysis, move validation, and session management.
 *
 * @remarks
 * The component integrates with multiple systems:
 * - Zustand store for global state management
 * - Tablebase service for position evaluation
 * - Training hooks for session management
 * - E2E test infrastructure for automated testing
 *
 * State is managed through a combination of:
 * - Global Zustand store (game state, evaluations, progress)
 * - Local component state (UI-only concerns)
 * - Custom hooks (position analysis, training session)
 *
 * @example
 * ```tsx
 * // Basic usage with endgame position
 * import { getLogger } from '@shared/services/logging/Logger';
 * const logger = getLogger();
 *
 * <TrainingBoard
 *   position={endgamePosition}
 *   onComplete={(success) => {
 *     logger.info('Training completed:', success);
 *   }}
 * />
 *
 * // With callbacks for parent integration
 * <TrainingBoard
 *   position={position}
 *   onComplete={handleComplete}
 *   onHistoryChange={updateMoveList}
 *   onEvaluationsChange={updateEvaluations}
 * />
 * ```
 *
 * @param {TrainingBoardProps} props - Component configuration
 * @returns {JSX.Element} Rendered training board interface
 */
export const TrainingBoard: React.FC<TrainingBoardProps> = ({
  fen,
  position,
  onComplete,
  onHistoryChange,
  onEvaluationsChange,
  onPositionChange,
  onJumpToMove,
  resetTrigger = 0,
}) => {
  const initialFen = fen || position?.fen || "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1";

  // === ZUSTAND STORE - Using domain-specific hooks for performance ===
  const [gameState, gameActions] = useGameStore(); // Pure chess state
  const [trainingState, trainingActions] = useTrainingStore(); // Training session state
  const [tablebaseState, tablebaseActions] = useTablebaseStore(); // Analysis and evaluation data
  const [, uiActions] = useUIStore(); // UI state (toasts, modals, loading)
  const storeApi = useStoreApi(); // Store API for orchestrator functions

  // Set position in store on mount or when position changes
  useEffect(() => {
    const logger = getLogger().setContext("TrainingBoard-PositionInit");

    if (
      position &&
      (!trainingState.currentPosition ||
        trainingState.currentPosition.id !== position.id)
    ) {
      logger.info("Setting position in store", {
        positionId: position.id,
        title: position.title,
        fen: position.fen,
        currentPositionId: trainingState.currentPosition?.id,
      });
      trainingActions.loadTrainingContext(position);
    }
  }, [position, trainingActions, trainingState]);

  // CRITICAL: Prevent any interactions if position is not loaded
  const isPositionReady = !!trainingState.currentPosition;

  // === HOOKS ===

  // Click-to-move state for accessibility and E2E testing support
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Chess game logic - now using Store as single source of truth
  const {
    history,
    isGameFinished,
    currentFen,
    makeMove,
    jumpToMove,
    resetGame,
    undoMove,
  } = useTrainingSession({
    /**
     *
     * @param success
     */
    onComplete: (success) => {
      // Call parent callback
      onComplete(success);
    },
    onPositionChange,
  });

  // Calculate previous FEN for tablebase move comparison using game state
  const previousFen = useMemo(() => {
    if (history.length === 0) {
      return undefined;
    }

    if (history.length === 1) {
      return initialFen;
    }

    try {
      const tempGame = new Chess(initialFen);
      for (let i = 0; i < history.length - 1; i++) {
        const moveResult = tempGame.move(history[i]);
        if (!moveResult) {
          // Move doesn't apply to this position - history is from a different position
          return undefined;
        }
      }
      return tempGame.fen();
    } catch (error) {
      // History doesn't match current position
      return undefined;
    }
  }, [history, initialFen, currentFen]);

  // Evaluation logic
  const {
    evaluations,
    lastEvaluation,
    isEvaluating,
    error: evaluationError,
    clearEvaluations,
  } = usePositionAnalysis({
    fen: currentFen || initialFen,
    isEnabled: true,
    previousFen: previousFen,
  });

  // Add useRef to track processed evaluations
  const processedEvaluationsRef = useRef(new Set<string>());

  // Update Zustand with current evaluation
  useEffect(() => {
    if (!lastEvaluation) return;

    // Create unique key for this evaluation using current FEN and evaluation data
    const evalKey = `${currentFen}_${lastEvaluation.evaluation}_${lastEvaluation.mateInMoves ?? "null"}`;

    if (processedEvaluationsRef.current.has(evalKey)) {
      return; // Skip if already processed
    }

    processedEvaluationsRef.current.add(evalKey);

    const currentEvaluations = evaluations || [];
    const updatedEvaluations = [...currentEvaluations, lastEvaluation];

    // Check if setEvaluations exists before calling
    if (tablebaseActions?.setEvaluations) {
      tablebaseActions.setEvaluations(updatedEvaluations);
    } else {
      console.error("❌ tablebaseActions.setEvaluations is not available!");
    }
  }, [lastEvaluation, currentFen, evaluations, tablebaseActions]);

  // UI state management - local component state only
  const [resetKey, setResetKey] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Get move error dialog state from training slice
  const showMoveErrorDialog = trainingState.moveErrorDialog?.isOpen || false;
  const moveErrorData = trainingState.moveErrorDialog
    ? {
        wdlBefore: trainingState.moveErrorDialog.wdlBefore || 0,
        wdlAfter: trainingState.moveErrorDialog.wdlAfter || 0,
        bestMove: trainingState.moveErrorDialog.bestMove,
      }
    : null;

  // Get move success dialog state from training slice
  const showMoveSuccessDialog =
    trainingState.moveSuccessDialog?.isOpen || false;
  const moveSuccessData = trainingState.moveSuccessDialog
    ? {
        promotionPiece: trainingState.moveSuccessDialog.promotionPiece,
        moveDescription: trainingState.moveSuccessDialog.moveDescription,
      }
    : null;

  // Debug logging for move error dialog state
  if (trainingState.moveErrorDialog) {
    const logger = getLogger().setContext("TrainingBoard");
    logger.debug("Move error dialog state", {
      isOpen: showMoveErrorDialog,
      dialogData: trainingState.moveErrorDialog,
      moveErrorData,
    });
  }

  const trainingUIState = {
    resetKey,
    showMoveErrorDialog,
    warning,
    analysisError: null, // Analysis errors now handled by store
    moveError,
    /**
     *
     */
    handleReset: () => setResetKey((prev) => prev + 1),
    /**
     *
     */
    handleDismissMoveError: useCallback(() => {
      trainingActions.setMoveErrorDialog(null);
      setMoveError(null);
    }, [trainingActions]),
    /**
     *
     */
    handleClearWarning: () => setWarning(null),
    /**
     *
     */
    handleClearAnalysisError: () => {},
  };

  /**
   * Resets the training board to initial state
   *
   * @description
   * Performs comprehensive cleanup including:
   * - Resetting chess game to starting position
   * - Clearing all position evaluations
   * - Resetting UI state and dialogs
   * - Clearing training session data
   *
   * @remarks
   * This handler is called when:
   * - User clicks reset button
   * - Training session needs restart
   * - Parent component triggers reset
   */
  const handleReset = useCallback(() => {
    resetGame();
    clearEvaluations();
    trainingUIState.handleReset();
    gameActions.resetGame();
  }, [resetGame, clearEvaluations, gameActions]);

  /**
   * Handles move error dialog dismissal with undo
   *
   * @description
   * Closes the move error dialog and undoes the suboptimal move,
   * allowing the user to try a different move.
   *
   * @remarks
   * When a suboptimal move is detected, it has already been executed
   * on the board and added to the move history. This function removes
   * the move from history and reverts the board position.
   */
  const handleMoveErrorTakeBack = useCallback(() => {
    const logger = getLogger().setContext("TrainingBoard-MoveError");
    logger.info("Undoing suboptimal move using useTrainingSession undoMove");

    // CRITICAL: Cancel any scheduled opponent turn BEFORE undoing
    // This prevents the opponent from playing after we undo
    cancelScheduledOpponentTurn();
    logger.info("Cancelled any scheduled opponent turn");

    // Use the undoMove function from useTrainingSession which properly handles ChessService
    const undoResult = undoMove();

    if (undoResult) {
      logger.info("Move successfully undone");

      // CRITICAL: Set player turn to true after undoing a suboptimal move
      // This prevents the opponent from playing immediately after undo
      logger.debug("Before setPlayerTurn - current state", {
        isPlayerTurn: trainingState.isPlayerTurn,
        isOpponentThinking: trainingState.isOpponentThinking,
      });
      trainingActions.setPlayerTurn(true);
      trainingActions.clearOpponentThinking(); // Clear opponent thinking flag
      logger.info(
        "Set player turn to true and cleared opponent thinking - player can try another move",
      );
      logger.debug("After setPlayerTurn call");
    } else {
      logger.error("Failed to undo move - no moves in history");
    }

    // Close the dialog using the trainingActions hook which properly accesses the action
    // The hook extracts the action from the slice creator, not from the nested store state
    if (trainingActions && trainingActions.setMoveErrorDialog) {
      trainingActions.setMoveErrorDialog(null);
      logger.info(
        "Successfully closed move error dialog via trainingActions hook",
      );
    } else {
      logger.error("setMoveErrorDialog not available in trainingActions");
    }
  }, [undoMove, trainingActions]);

  /**
   * Restarts the entire training session after move error
   *
   * @description
   * Completely resets the game and closes the error dialog when
   * the user chooses to restart after making a critical mistake.
   *
   * @remarks
   * This is typically used when the user has made a game-losing
   * mistake and wants to start the position from the beginning.
   */
  const handleMoveErrorRestart = useCallback(() => {
    const logger = getLogger().setContext("TrainingBoard-MoveError");
    logger.info("Restarting game due to move error");
    handleReset();
    trainingActions.setMoveErrorDialog(null);
  }, [handleReset, trainingActions]);

  /**
   * Handles "Weiterspielen" (continue playing) action from error dialog
   *
   * @description
   * Closes the error dialog and schedules the opponent's turn.
   * This allows the game to continue even after a suboptimal move,
   * letting the opponent respond to the player's move.
   *
   * @remarks
   * This provides a smoother training experience by allowing players
   * to continue playing and learning from their mistakes rather than
   * always having to take back moves.
   */
  const handleMoveErrorContinue = useCallback(() => {
    const logger = getLogger().setContext("TrainingBoard-MoveError");
    
    // Get current state for debugging
    const currentState = storeApi.getState();
    logger.info(
      "🎯 WEITERSPIELEN clicked - Current state BEFORE action:",
      {
        isPlayerTurn: currentState.training.isPlayerTurn,
        isOpponentThinking: currentState.training.isOpponentThinking,
        currentFen: chessService.getFen(),
        currentTurn: chessService.turn(),
        colorToTrain: currentState.training.currentPosition?.colorToTrain,
        moveCount: currentState.game.moveHistory.length,
      }
    );

    // Close the error dialog
    trainingActions.setMoveErrorDialog(null);
    logger.info("✅ Error dialog closed");

    // Schedule opponent turn to respond to player's move
    logger.info("📅 Calling scheduleOpponentTurn...");
    scheduleOpponentTurn(storeApi);

    // Check state after scheduling
    const stateAfter = storeApi.getState();
    logger.info("📊 State AFTER scheduling opponent turn:", {
      isPlayerTurn: stateAfter.training.isPlayerTurn,
      isOpponentThinking: stateAfter.training.isOpponentThinking,
    });
  }, [trainingActions, storeApi]);

  /**
   * Displays the best move as a toast notification
   *
   * @description
   * Shows the optimal move in a toast message when the user
   * requests to see the best move after making a mistake.
   *
   * @remarks
   * The best move is determined by tablebase analysis and
   * represents the objectively best continuation from the
   * position before the user's suboptimal move.
   */
  const handleShowBestMove = useCallback(() => {
    if (moveErrorData?.bestMove) {
      const logger = getLogger().setContext("TrainingBoard-MoveError");
      logger.info("Showing best move", { bestMove: moveErrorData.bestMove });
      uiActions.showToast(
        `Der beste Zug war: ${moveErrorData.bestMove}`,
        "info",
      );
    }
    trainingActions.setMoveErrorDialog(null);
  }, [moveErrorData, uiActions, trainingActions]);

  /**
   * Handles success dialog close
   */
  const handleMoveSuccessClose = useCallback(() => {
    trainingActions.setMoveSuccessDialog(null);
  }, [trainingActions]);

  /**
   * Handles continuing to next position after success
   */
  const handleMoveSuccessContinue = useCallback(() => {
    trainingActions.setMoveSuccessDialog(null);
    // Training completion logic is already handled by PawnPromotionHandler
  }, [trainingActions]);

  // Update analysis status based on evaluation state
  useEffect(() => {
    console.debug("🔍 TablebaseActions debug", {
      hasTablebaseActions: !!tablebaseActions,
      hasSetAnalysisStatus: !!tablebaseActions?.setAnalysisStatus,
      tablebaseActionsKeys: Object.keys(tablebaseActions || {}),
      isEvaluating,
    });

    // CRITICAL: Safe-guard to prevent crashes
    if (!tablebaseActions?.setAnalysisStatus) {
      console.warn(
        "⚠️ tablebaseActions.setAnalysisStatus not available, skipping",
      );
      return;
    }

    if (isEvaluating) {
      tablebaseActions.setAnalysisStatus("loading");
    } else if (tablebaseState.analysisStatus === "loading") {
      // Only update to success if we were loading
      tablebaseActions.setAnalysisStatus("success");
    }
  }, [isEvaluating, tablebaseState, tablebaseActions]);

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
    async (move: any) => {
      const logger = getLogger().setContext("TrainingBoard-handleMove");
      logger.debug("🚀 handleMove called", {
        move,
        isGameFinished,
        isPositionReady,
        hasCurrentPosition: !!trainingState.currentPosition,
        currentFen,
        chessServiceFen: chessService.getFen(),
      });

      // CRITICAL: Block moves if position is not ready
      if (!isPositionReady) {
        logger.warn("⛔ Position not ready, blocking move", {
          hasCurrentPosition: !!trainingState.currentPosition,
          currentPositionId: trainingState.currentPosition?.id,
          currentPositionFen: trainingState.currentPosition?.fen,
        });
        return null;
      }

      // Add these critical debug logs
      const moveLogger = getLogger().setContext("TrainingBoard-handleMove");
      moveLogger.debug("handleMove called", { move });
      moveLogger.debug("Current FEN", { fen: currentFen });
      // Note: game is null now - ChessService handles chess logic

      if (isGameFinished) {
        logger.warn("handleMove early return", { isGameFinished });
        return null;
      }

      // Check if piece was dropped on same square (no move)
      if (move.from === move.to) {
        logger.debug("Piece dropped on same square, ignoring", {
          square: move.from,
        });
        return null;
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
        logger.debug("Calling makeMove", { move });
        const result = await makeMove(move);
        logger.debug("makeMove result", { result });

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
        return null;
      }
    },
    [
      isGameFinished,
      makeMove,
      lastEvaluation,
      trainingActions,
      trainingState,
      uiActions,
      gameActions,
      currentFen,
      history,
      position,
      isPositionReady,
      trainingState.currentPosition,
    ],
  );

  // === REMOVED E2E WINDOW ATTACHMENTS ===
  // E2E tests now use Page Object Model via DOM interaction
  // See: tests/e2e/helpers/pageObjects/TrainingBoardPage.ts

  // === EVENT HANDLERS ===

  /**
   * Handles piece drop events from the chessboard
   *
   * @param {string} sourceSquare - Square where piece was picked up
   * @param {string} targetSquare - Square where piece was dropped
   * @param {string} _piece - Piece type (unused but required by interface)
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
    (sourceSquare: string, targetSquare: string, _piece: string): boolean => {
      const logger = getLogger().setContext("TrainingBoard-onDrop");

      logger.debug("🎯 onDrop called", {
        sourceSquare,
        targetSquare,
        piece: _piece,
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
      const isPawn = _piece.toLowerCase().endsWith("p");
      const targetRank = targetSquare[1];
      const isPromotionRank = targetRank === "8" || targetRank === "1";

      const move: any = {
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
   * @param {any} args.piece - Piece on the clicked square (can be null)
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
    ({ piece, square }: { piece: any; square: string }): void => {
      const logger = getLogger().setContext("TrainingBoard-onSquareClick");

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
            const pieceColor = piece.pieceType?.[0]; // 'w' or 'b'
            
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

  // Handle reset trigger from parent
  useEffect(() => {
    if (resetTrigger > 0) {
      handleReset();
    }
  }, [resetTrigger, handleReset]);

  // === EFFECTS ===

  // Update parent with move history
  useEffect(() => {
    if (onHistoryChange) {
      // Convert ValidatedMove[] to Move[] for the callback
      const libraryMoves = history.map(toLibraryMove);
      onHistoryChange(libraryMoves);
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
    if (typeof window !== "undefined" && !testMoveProcessed) {
      const urlParams = new URLSearchParams(window.location.search);
      const testMoves = urlParams.get("moves");

      // Debug logging
      const logger = getLogger().setContext("TrainingBoard-TestMode");
      logger.debug("URL check", {
        url: window.location.href,
        search: window.location.search,
        testMoves,
        gameReady: !!currentFen,
        isGameFinished,
        historyLength: history.length,
        testMoveProcessed,
      });

      if (testMoves && currentFen && !isGameFinished) {
        setTestMoveProcessed(true);
        const moves = testMoves.split(",");
        let moveIndex = 0;

        logger.info("Starting automated moves", {
          moves,
          totalMoves: moves.length,
        });

        /**
         * Recursively plays moves from URL parameter for automated testing
         *
         * @description
         * Internal function that processes a sequence of moves provided
         * via URL parameter. Supports multiple notation formats and
         * includes error recovery.
         *
         * @remarks
         * Moves are played with animation delays to simulate user interaction.
         * Failed moves are skipped and the sequence continues.
         */
        const playNextMove = async () => {
          if (moveIndex < moves.length) {
            const moveNotation = moves[moveIndex];

            logger.debug("Attempting move", {
              moveIndex,
              moveNotation,
              currentHistoryLength: history.length,
            });

            try {
              // Use the handleMove function which includes validation
              let move;
              if (moveNotation.includes("-")) {
                // Format: e2-e4
                const [from, to] = moveNotation.split("-");
                move = {
                  from: from,
                  to: to,
                  promotion: "q",
                };
              } else {
                // Format: e4 (SAN) - parse it properly
                const tempGame = new Chess(chessService.getFen());
                move = tempGame.move(moveNotation);
                if (move) {
                  move = {
                    from: move.from,
                    to: move.to,
                    promotion: move.promotion || "q",
                  };
                }
              }

              if (move) {
                logger.debug("Move parsed successfully", { move });
                const result = await handleMove(move);

                if (result) {
                  moveIndex++;
                  logger.debug("Move executed successfully", {
                    moveIndex,
                    newHistoryLength: history.length,
                  });

                  // Warte kurz und dann nächster Zug
                  setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_NORMAL);
                } else {
                  logger.warn("Move execution failed", { moveNotation });
                }
              } else {
                logger.warn("Move parsing returned null", { moveNotation });
                // Versuche nächsten Zug
                moveIndex++;
                setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_FAST);
              }
            } catch (error) {
              logger.error("Test move failed", error, { moveNotation });
              // Versuche nächsten Zug
              moveIndex++;
              setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_FAST);
            }
          } else {
            logger.info("Automated moves completed", {
              finalMoveIndex: moveIndex,
              finalHistoryLength: history.length,
            });
          }
        };

        // Starte nach initialem Render
        setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_SLOW);
      }
    }
  }, [currentFen, isGameFinished, handleMove, testMoveProcessed]);

  // === PAGE READY DETECTION ===
  const isAnalysisReady =
    tablebaseState.analysisStatus === "success" ||
    tablebaseState.analysisStatus === "idle";
  const isBoardReady = !!currentFen;
  const isPageReady = usePageReady([isAnalysisReady, isBoardReady]);

  // === RENDER ===
  // Note: customSquareRenderer was removed as it's not supported in react-chessboard v2.1.3
  // E2E tests should use the board's data-testid="training-board" and other available selectors

  const showE2ESignals = process.env.NEXT_PUBLIC_E2E_SIGNALS === "true";

  return (
    <div
      className="flex flex-col items-center"
      {...(showE2ESignals && { "data-page-ready": isPageReady })}
    >
      {/* Chessboard with Evaluation Overlay and E2E data attributes */}
      <div
        className="relative"
        key={trainingUIState.resetKey}
        style={{
          width: `${DIMENSIONS.TRAINING_BOARD_SIZE}px`,
          height: `${DIMENSIONS.TRAINING_BOARD_SIZE}px`,
        }}
        data-fen={currentFen}
        data-testid="training-board"
        data-analysis-status={tablebaseState.analysisStatus}
      >
        <Chessboard
          fen={currentFen}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          arePiecesDraggable={!isGameFinished}
          boardWidth={600}
        />
      </div>

      {/* Error and Warning Displays - inline implementation */}
      {trainingUIState.warning && (
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {trainingUIState.warning}
          <button
            onClick={trainingUIState.handleClearWarning}
            className="ml-2 text-yellow-700 hover:text-yellow-900"
          >
            ×
          </button>
        </div>
      )}

      {(trainingUIState.analysisError || evaluationError) && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {trainingUIState.analysisError || evaluationError}
          <button
            onClick={trainingUIState.handleClearAnalysisError}
            className="ml-2 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Move Error Dialog */}
      {showMoveErrorDialog && moveErrorData && (
        <MoveErrorDialog
          isOpen={showMoveErrorDialog}
          onClose={handleMoveErrorContinue}
          onTakeBack={handleMoveErrorTakeBack}
          onRestart={handleMoveErrorRestart}
          onShowBestMove={
            moveErrorData.bestMove ? handleShowBestMove : undefined
          }
          wdlBefore={moveErrorData.wdlBefore}
          wdlAfter={moveErrorData.wdlAfter}
          bestMove={moveErrorData.bestMove}
        />
      )}

      {/* Move Success Dialog */}
      {showMoveSuccessDialog && moveSuccessData && (
        <MoveSuccessDialog
          isOpen={showMoveSuccessDialog}
          onClose={handleMoveSuccessClose}
          onContinue={handleMoveSuccessContinue}
          promotionPiece={moveSuccessData.promotionPiece}
          moveDescription={moveSuccessData.moveDescription}
        />
      )}
    </div>
  );
};
