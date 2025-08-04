import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
import { Chess, Move } from "chess.js";
import { Chessboard } from "@shared/components/chess/Chessboard";
import { usePositionAnalysis, useEndgameSession } from "../../../hooks";
import { usePageReady } from "../../../hooks/usePageReady";
import {
  useEndgameTrainingState,
  useGameState,
  useTablebaseAnalysisState,
  useTrainingActions,
  useUIActions,
  useStore,
} from "@shared/store/store";
import { requestTablebaseMove } from "@shared/store/endgameActions";
import { EndgamePosition } from "@shared/types";
import { getLogger } from "@shared/services/logging";
import { ANIMATION, DIMENSIONS } from "@shared/constants";
import { MoveErrorDialog } from "@shared/components/ui/MoveErrorDialog";

// Extended evaluation interface that matches our new MovePanel requirements
/**
 *
 */
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

/**
 *
 */
interface EndgameBoardProps {
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
 * Endgame training board component using Zustand store
 * Provides interactive chess board for endgame training with tablebase analysis
 * @param root0
 * @param root0.fen
 * @param root0.position
 * @param root0.onComplete
 * @param root0.onHistoryChange
 * @param root0.onEvaluationsChange
 * @param root0.onPositionChange
 * @param root0.onJumpToMove
 * @param root0.resetTrigger
 */
export /**
 *
 */
const EndgameBoard: React.FC<EndgameBoardProps> = ({
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
  const gameState = useGameState();
  const tablebaseAnalysisState = useTablebaseAnalysisState();
  const endgameTrainingState = useEndgameTrainingState();
  const actions = useTrainingActions();
  const uiActions = useUIActions();

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
      actions.setPosition(position);
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
  } = useEndgameSession({
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

    actions.setEvaluation(lastEvaluation);
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
    engineError: null, // Engine errors now handled by store
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
    handleClearEngineError: () => {},
  };

  // Enhanced reset handler that includes all cleanup
  const handleReset = useCallback(() => {
    resetGame();
    clearEvaluations();
    trainingUIState.handleReset();
    actions.resetPosition();
  }, [resetGame, clearEvaluations, endgameTrainingState, actions]);

  // Handlers for move error dialog
  const handleMoveErrorTakeBack = useCallback(() => {
    const logger = getLogger().setContext("TrainingBoard-MoveError");
    logger.info("Closing move error dialog");
    // Don't undo anything - the invalid move was never added to history
    // Just close the dialog so the user can try again
    actions.setMoveErrorDialog(null);
  }, [actions]);

  const handleMoveErrorRestart = useCallback(() => {
    const logger = getLogger().setContext("TrainingBoard-MoveError");
    logger.info("Restarting game due to move error");
    handleReset();
    actions.setMoveErrorDialog(null);
  }, [handleReset, actions]);

  const handleShowBestMove = useCallback(() => {
    if (moveErrorData?.bestMove) {
      const logger = getLogger().setContext("TrainingBoard-MoveError");
      logger.info("Showing best move", { bestMove: moveErrorData.bestMove });
      uiActions.showToast(
        `Der beste Zug war: ${moveErrorData.bestMove}`,
        "info",
      );
      // TODO: Highlight the best move on the board
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

  // Enhanced move handling - inline implementation
  const handleMove = useCallback(
    async (move: any) => {
      const logger = getLogger().setContext("TrainingBoard-handleMove");
      logger.debug("handleMove called", { move, isGameFinished });

      // Add these critical debug logs
      console.log("DEBUG: handleMove called with move:", move);
      console.log("DEBUG: Current FEN in handleMove:", game.fen());
      console.log(
        "DEBUG: Possible moves in handleMove (verbose):",
        game.moves({ verbose: true }).map((m: any) => `${m.from}-${m.to}`),
      );
      console.log("DEBUG: Possible moves in handleMove (san):", game.moves());

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
            const updatedFen =
              useStore.getState().training.currentFen || game.fen();
            logger.info("Requesting tablebase move for position", {
              updatedFen,
              turn: game.turn(),
              moveNumber: history.length,
            });

            const tablebaseMoveUci = await requestTablebaseMove(updatedFen)(
              useStore.getState,
              useStore.setState,
            );

            logger.info("[TRACE] Tablebase move returned", {
              tablebaseMoveUci,
              updatedFen,
              currentGameFen: game.fen(),
              historyLength: history.length,
            });

            // Check if position hasn't changed while waiting for tablebase
            const currentPositionId =
              useStore.getState().training.currentPosition?.id;
            if (tablebaseMoveUci && currentPositionId === position?.id) {
              // Convert UCI to move object format for makeMove
              const from = tablebaseMoveUci.slice(0, 2);
              const to = tablebaseMoveUci.slice(2, 4);
              const promotion =
                tablebaseMoveUci.length > 4
                  ? tablebaseMoveUci.slice(4, 5)
                  : undefined;

              logger.info("[TRACE] About to execute tablebase move", {
                tablebaseMoveUci,
                from,
                to,
                promotion,
                currentFen: updatedFen,
                gameStateBeforeMove: game.fen(),
              });

              const tablebaseMoveResult = await makeMove({
                from,
                to,
                promotion,
              });

              logger.info("[TRACE] Tablebase move executed", {
                success: !!tablebaseMoveResult,
                gameStateAfterMove: game.fen(),
                actualMove: tablebaseMoveResult,
              });
            } else if (currentPositionId !== position?.id) {
              logger.debug("Position changed, skipping tablebase move");
            }
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
      console.log("🪄 EndgameBoard: Attaching e2e hooks to window object");
      logger.info("Attaching e2e hooks to window object");

      /**
       *
       * @param move
       */
      (window as any).e2e_makeMove = async (move: string) => {
        console.log("🎯 e2e_makeMove called with move:", move);
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

      // Also expose game state for debugging
      /**
       *
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

  // Handle piece drop
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
         *
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

      {(trainingUIState.engineError || evaluationError) && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {trainingUIState.engineError || evaluationError}
          <button
            onClick={trainingUIState.handleClearEngineError}
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
