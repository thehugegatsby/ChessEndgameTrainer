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
import { useStore } from "@shared/store/rootStore";
import { useShallow } from "zustand/react/shallow";
// Note: handleOpponentTurn is now available as a method on the store
import { EndgamePosition } from "@shared/types";
import { getLogger } from "@shared/services/logging";
import { ANIMATION, DIMENSIONS } from "@shared/constants";
import { MoveErrorDialog } from "@shared/components/ui/MoveErrorDialog";
import { toLibraryMove } from "@shared/infrastructure/chess-adapter";

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
 * <TrainingBoard
 *   position={endgamePosition}
 *   onComplete={(success) => {
 *     console.log('Training completed:', success);
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

  // === ZUSTAND STORE - Using optimized selectors ===
  const gameState = useStore(
    useShallow((state) => ({
      moveHistory: state.moveHistory,
      currentFen: state.currentFen,
    })),
  );
  const tablebaseAnalysisState = useStore(
    useShallow((state) => ({
      analysisStatus: state.analysisStatus,
      evaluations: state.evaluations,
    })),
  );
  const endgameTrainingState = useStore(
    useShallow((state) => ({
      currentPosition: state.currentPosition,
      moveErrorDialog: state.moveErrorDialog,
    })),
  );
  const actions = useStore(
    useShallow((state) => ({
      setPosition: state.setPosition,
      setEvaluations: state.setEvaluations,
      setMoveErrorDialog: state.setMoveErrorDialog,
      setAnalysisStatus: state.setAnalysisStatus,
      resetPosition: state.resetPosition,
      incrementMistake: state.incrementMistake,
      loadTrainingContext: state.loadTrainingContext,
    })),
  );
  const uiActions = useStore(
    useShallow((state) => ({
      showToast: state.showToast,
    })),
  );

  // Set position in store on mount or when position changes
  useEffect(() => {
    const logger = getLogger().setContext("TrainingBoard-PositionInit");

    if (
      position &&
      (!endgameTrainingState.currentPosition ||
        endgameTrainingState.currentPosition.id !== position.id)
    ) {
      logger.info("Setting position in store", {
        positionId: position.id,
        title: position.title,
        fen: position.fen,
        currentPositionId: endgameTrainingState.currentPosition?.id,
      });
      actions.loadTrainingContext(position);
    }
  }, [position, endgameTrainingState.currentPosition, actions]);

  // === HOOKS ===

  // Chess game logic - now using Store as single source of truth
  const {
    game,
    history,
    isGameFinished,
    currentFen,
    makeMove,
    jumpToMove,
    resetGame,
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

  // Calculate previous FEN for tablebase move comparison using gameState
  const previousFen = useMemo(() => {
    if (gameState.moveHistory.length === 0) {
      return undefined;
    }

    if (gameState.moveHistory.length === 1) {
      return initialFen;
    }

    try {
      const tempGame = new Chess(initialFen);
      for (let i = 0; i < gameState.moveHistory.length - 1; i++) {
        const moveResult = tempGame.move(gameState.moveHistory[i]);
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
  }, [gameState.moveHistory, initialFen, gameState.currentFen]);

  // Evaluation logic
  const {
    evaluations,
    lastEvaluation,
    isEvaluating,
    error: evaluationError,
    clearEvaluations,
  } = usePositionAnalysis({
    fen: gameState.currentFen || initialFen,
    isEnabled: true,
    previousFen: previousFen,
  });

  // Add useRef to track processed evaluations
  const processedEvaluationsRef = useRef(new Set<string>());

  // Update Zustand with current evaluation
  useEffect(() => {
    if (!lastEvaluation) return;

    // Create unique key for this evaluation using current FEN and evaluation data
    const evalKey = `${gameState.currentFen}_${lastEvaluation.evaluation}_${lastEvaluation.mateInMoves ?? "null"}`;

    if (processedEvaluationsRef.current.has(evalKey)) {
      return; // Skip if already processed
    }

    processedEvaluationsRef.current.add(evalKey);

    const currentEvaluations = tablebaseAnalysisState.evaluations || [];
    const updatedEvaluations = [...currentEvaluations, lastEvaluation];
    actions.setEvaluations(updatedEvaluations);
  }, [
    lastEvaluation,
    actions,
    gameState.currentFen,
    tablebaseAnalysisState.evaluations,
  ]);

  // UI state management - local component state only
  const [resetKey, setResetKey] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Get move error dialog state from store
  const moveErrorDialog = endgameTrainingState.moveErrorDialog;
  const showMoveErrorDialog = moveErrorDialog?.isOpen || false;
  const moveErrorData = moveErrorDialog
    ? {
        wdlBefore: moveErrorDialog.wdlBefore || 0,
        wdlAfter: moveErrorDialog.wdlAfter || 0,
        bestMove: moveErrorDialog.bestMove,
      }
    : null;

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
    handleDismissMoveError: () => {
      actions.setMoveErrorDialog(null);
      setMoveError(null);
    },
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
    actions.resetPosition();
  }, [resetGame, clearEvaluations, endgameTrainingState, actions]);

  /**
   * Handles move error dialog dismissal without undo
   *
   * @description
   * Closes the move error dialog allowing the user to try a different move.
   * No undo is performed as invalid moves are not added to history.
   *
   * @remarks
   * This maintains the current board position and allows the user
   * to attempt another move without reverting any game state.
   */
  const handleMoveErrorTakeBack = useCallback(() => {
    const logger = getLogger().setContext("TrainingBoard-MoveError");
    logger.info("Closing move error dialog");
    // Don't undo anything - the invalid move was never added to history
    // Just close the dialog so the user can try again
    actions.setMoveErrorDialog(null);
  }, [actions]);

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
    actions.setMoveErrorDialog(null);
  }, [handleReset, actions]);

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
    actions.setMoveErrorDialog(null);
  }, [moveErrorData, uiActions]);

  // Update analysis status based on evaluation state
  useEffect(() => {
    if (isEvaluating) {
      actions.setAnalysisStatus("loading");
    } else if (tablebaseAnalysisState.analysisStatus === "loading") {
      // Only update to success if we were loading
      actions.setAnalysisStatus("success");
    }
  }, [isEvaluating, actions, tablebaseAnalysisState.analysisStatus]);

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
      logger.debug("handleMove called", { move, isGameFinished });

      // Add these critical debug logs
      const moveLogger = getLogger().setContext("TrainingBoard-handleMove");
      moveLogger.debug("handleMove called", { move });
      moveLogger.debug("Current FEN", { fen: game.fen() });
      moveLogger.debug("Possible moves (verbose)", {
        moves: game
          .moves({ verbose: true })
          .map((m: any) => `${m.from}-${m.to}`),
      });
      moveLogger.debug("Possible moves (san)", { moves: game.moves() });

      if (isGameFinished) {
        logger.warn("handleMove early return", { isGameFinished });
        return null;
      }

      try {
        // Debug: Log game state before validation
        logger.debug("Game state before move validation", {
          hasGame: !!game,
          gameFen: game?.fen(),
          possibleMovesCount: game?.moves()?.length || 0,
        });

        // Validate move with chess instance
        const possibleMoves = game.moves({ verbose: true });
        const isValidMove = possibleMoves.some(
          (m: any) => m.from === move.from && m.to === move.to,
        );

        logger.debug("Move validation result", {
          move,
          isValidMove,
          possibleMovesCount: possibleMoves.length,
          firstFewMoves: possibleMoves
            .slice(0, 3)
            .map((m: any) => `${m.from}-${m.to}`),
        });

        if (!isValidMove) {
          logger.error("Move validation failed", undefined, {
            move,
            possibleMoves: possibleMoves.map((m: any) => `${m.from}-${m.to}`),
            currentFen: game.fen(), // Add current FEN to error log
          });
          uiActions.showToast("Invalid move", "warning");
          actions.incrementMistake();
          return null;
        }

        // First make the move on the local game instance
        const result = await makeMove(move);

        if (result) {
          // Move validation is now handled in the store's makeUserMove action
          // Just trigger tablebase response using store action
          try {
            // Get the updated FEN after the move
            const updatedFen = gameState.currentFen || game.fen();
            logger.info("Requesting tablebase move for position", {
              updatedFen,
              turn: game.turn(),
              moveNumber: history.length,
            });

            // Use the orchestrator from the store directly
            await useStore.getState().handleOpponentTurn();

            logger.info("[TRACE] Tablebase move request completed", {
              updatedFen,
              currentGameFen: game.fen(),
              historyLength: history.length,
            });

            // The orchestrator handles the tablebase move automatically
          } catch (error) {
            logger.error("Engine move failed", error as Error);
          }

          // Move was successful, it will be synced to Zustand via the history effect
        }
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
      endgameTrainingState,
      actions,
      uiActions,
      currentFen,
      game,
      history,
      position,
    ],
  );

  // === TEST HOOK FOR E2E TESTING ===
  useEffect(() => {
    const logger = getLogger().setContext("TrainingBoard-E2E");

    // Check for E2E test mode via window flag OR environment variable
    const isE2ETest =
      (typeof window !== "undefined" && (window as any).__E2E_TEST_MODE__) ||
      process.env.NEXT_PUBLIC_IS_E2E_TEST === "true";

    // Debug logging for E2E test setup
    logger.info("E2E Test Environment Check", {
      NEXT_PUBLIC_IS_E2E_TEST: process.env.NEXT_PUBLIC_IS_E2E_TEST,
      NODE_ENV: process.env.NODE_ENV,
      typeof_NEXT_PUBLIC_IS_E2E_TEST:
        typeof process.env.NEXT_PUBLIC_IS_E2E_TEST,
      window__E2E_TEST_MODE__:
        typeof window !== "undefined"
          ? (window as any).__E2E_TEST_MODE__
          : "undefined",
      isE2ETest,
    });

    // Only expose in test environment
    if (isE2ETest) {
      logger.debug("🪄 EndgameBoard: Attaching e2e hooks to window object");
      logger.info("Attaching e2e hooks to window object");

      /**
       * E2E test helper for programmatic move execution
       *
       * @param {string} move - Move in notation format (e.g., "e2-e4", "Nf3")
       * @returns {Promise<Object>} Result object with success status
       *
       * @description
       * Exposed global function for E2E tests to execute moves programmatically.
       * Supports multiple notation formats and provides detailed error feedback.
       *
       * @remarks
       * Only available when E2E test mode is enabled via:
       * - window.__E2E_TEST_MODE__ = true
       * - NEXT_PUBLIC_IS_E2E_TEST = "true"
       *
       * @example
       * ```javascript
       * // In E2E test
       * const result = await window.e2e_makeMove("e2-e4");
       * expect(result.success).toBe(true);
       * ```
       */
      (window as any).e2e_makeMove = async (move: string) => {
        logger.debug("🎯 e2e_makeMove called with move:", { move });
        logger.info("e2e_makeMove called", { move });
        logger.debug("Test move requested", { move });

        // Debug: Check game state before move
        logger.debug("Pre-move state check", {
          hasGame: !!game,
          gamefen: game?.fen(),
          movesAvailable: game?.moves()?.length || 0,
          isGameFinished,
        });

        // Parse move notation (support 'e2-e4', 'e2e4', 'Ke2-e4', 'Ke2e4' formats)
        const moveMatch = move.match(
          /^([KQRBN]?)([a-h][1-8])-?([a-h][1-8])([qrbn])?$/i,
        );
        if (!moveMatch) {
          logger.error("Invalid move format", undefined, { move });
          return { success: false, error: "Invalid move format" };
        }

        const [, , from, to, promotion] = moveMatch;
        const moveObj = {
          from: from,
          to: to,
          promotion: promotion || "q",
        };

        try {
          logger.debug("Calling handleMove", { moveObj });
          const result = await handleMove(moveObj);
          logger.info("handleMove result", { result });

          if (result) {
            logger.debug("Test move successful", { move, result });
            return { success: true, result };
          } else {
            logger.error(
              "Test move failed - handleMove returned null/false",
              undefined,
              { move },
            );
            return { success: false, error: "Move rejected by engine" };
          }
        } catch (error) {
          logger.error("Error in e2e_makeMove", error as Error, { move });
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      };

      /**
       * E2E test helper for retrieving current game state
       *
       * @returns {Object} Current game state information
       * @returns {string} returns.fen - Current board position in FEN
       * @returns {string} returns.turn - Current turn ('w' or 'b')
       * @returns {boolean} returns.isGameOver - Whether game has ended
       * @returns {number} returns.moveCount - Number of moves played
       * @returns {string} returns.pgn - Game notation in PGN format
       * @returns {string[]} returns.moves - Available moves in from-to format
       * @returns {number} returns.possibleMovesCount - Count of legal moves
       *
       * @description
       * Provides comprehensive game state information for E2E test assertions
       * and debugging. Useful for verifying board state after moves.
       *
       * @example
       * ```javascript
       * // In E2E test
       * const state = window.e2e_getGameState();
       * expect(state.turn).toBe('w');
       * expect(state.moveCount).toBe(2);
       * ```
       */
      (window as any).e2e_getGameState = () => ({
        fen: game.fen(),
        turn: game.turn(),
        isGameOver: game.isGameOver(),
        moveCount: history.length,
        pgn: game.pgn(),
        moves: game
          .moves({ verbose: true })
          .map((m: any) => `${m.from}-${m.to}`),
        possibleMovesCount: game.moves().length,
      });
    }

    // Cleanup on unmount
    return () => {
      if (process.env.NEXT_PUBLIC_IS_E2E_TEST === "true") {
        delete (window as any).e2e_makeMove;
        delete (window as any).e2e_getGameState;
      }
    };
  }, [handleMove, game, history]);

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
      if (isGameFinished) return false;

      const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      };

      handleMove(move);
      return true;
    },
    [handleMove, isGameFinished],
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
        gameReady: !!game,
        isGameFinished,
        historyLength: history.length,
        testMoveProcessed,
      });

      if (testMoves && game && !isGameFinished) {
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
                const tempGame = new Chess(game.fen());
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
  }, [game, isGameFinished, handleMove, testMoveProcessed]);

  // === PAGE READY DETECTION ===
  const isAnalysisReady =
    tablebaseAnalysisState.analysisStatus === "success" ||
    tablebaseAnalysisState.analysisStatus === "idle";
  const isBoardReady = !!currentFen && !!game;
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
        data-analysis-status={tablebaseAnalysisState.analysisStatus}
      >
        <Chessboard
          fen={currentFen}
          onPieceDrop={onDrop}
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
          onClose={() => {
            actions.setMoveErrorDialog(null);
          }}
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
    </div>
  );
};
