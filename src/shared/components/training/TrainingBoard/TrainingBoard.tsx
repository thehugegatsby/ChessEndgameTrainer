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
import { DialogManager } from "../DialogManager";
import { E2ETestHelper } from "../../testing/E2ETestHelper";
import { toLibraryMove } from "@shared/infrastructure/chess-adapter";
import {
  cancelScheduledOpponentTurn,
  scheduleOpponentTurn,
} from "@shared/store/orchestrators/handlePlayerMove";
import { chessService } from "@shared/services/ChessService";
import { useMoveHandlers } from "@shared/hooks/useMoveHandlers";

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

  // Move handling logic - extracted to custom hook
  const { onDrop, onSquareClick, selectedSquare } = useMoveHandlers({
    currentFen: currentFen || initialFen,
    isGameFinished,
    isPositionReady,
    trainingState,
    onMove: makeMove,
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

  // Dialog state is now passed directly to DialogManager
  // No local state variables needed - DialogManager reads from trainingState directly

  const trainingUIState = {
    resetKey,
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
      setMoveError(null);
    }, []),
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
    if (trainingState.moveErrorDialog?.bestMove) {
      const logger = getLogger().setContext("TrainingBoard-MoveError");
      logger.info("Showing best move", { bestMove: trainingState.moveErrorDialog.bestMove });
      uiActions.showToast(
        `Der beste Zug war: ${trainingState.moveErrorDialog.bestMove}`,
        "info",
      );
    }
    trainingActions.setMoveErrorDialog(null);
  }, [trainingState.moveErrorDialog, uiActions, trainingActions]);

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


  // === REMOVED E2E WINDOW ATTACHMENTS ===
  // E2E tests now use Page Object Model via DOM interaction
  // See: tests/e2e/helpers/pageObjects/TrainingBoardPage.ts

  // === EVENT HANDLERS ===
  // Move handling logic extracted to useMoveHandlers hook

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

  // === E2E TEST SUPPORT ===
  // E2E testing logic extracted to separate E2ETestHelper component

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

      {/* Dialog Manager - Handles all training dialogs */}
      <DialogManager
        errorDialog={trainingState.moveErrorDialog}
        successDialog={trainingState.moveSuccessDialog}
        onErrorTakeBack={handleMoveErrorTakeBack}
        onErrorRestart={handleMoveErrorRestart}
        onErrorContinue={handleMoveErrorContinue}
        onErrorShowBestMove={handleShowBestMove}
        onSuccessClose={handleMoveSuccessClose}
        onSuccessContinue={handleMoveSuccessContinue}
      />

      {/* E2E Test Helper - Handles automated move execution for testing */}
      <E2ETestHelper
        currentFen={currentFen}
        isGameFinished={isGameFinished}
        onMove={makeMove}
        moveHistory={history}
      />
    </div>
  );
};
