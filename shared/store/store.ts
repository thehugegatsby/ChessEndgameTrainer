/**
 * Global state management with Zustand
 * Provides centralized state management for the entire application
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  RootState,
  Actions,
  UserState,
  TrainingState,
  ProgressState,
  UIState,
  SettingsState,
  Toast,
} from "./types";
import { TRAINING, TIME, RATING } from "../constants";
import { getLogger } from "../services/logging";
import {
  fromLibraryMove,
  ChessAdapterError,
} from "../infrastructure/chess-adapter";
import { Chess, Move as ChessJsMove } from "chess.js";
import { validateAndSanitizeFen } from "../utils/fenValidator";
import { getStoreDependencies } from "./storeConfig";
import { tablebaseService } from "../services/TablebaseService";

const logger = getLogger().setContext("Store");

// Initial states
const initialUserState: UserState = {
  rating: RATING.DEFAULT_RATING,
  completedPositions: [],
  currentStreak: 0,
  totalTrainingTime: 0,
  lastActiveDate: new Date().toISOString(),
  preferences: {
    theme: "dark",
    soundEnabled: true,
    notificationsEnabled: true,
    boardOrientation: "white",
    pieceTheme: "standard",
    autoPromoteToQueen: true,
    showCoordinates: true,
    showLegalMoves: true,
    animationSpeed: "normal",
  },
};

const initialTrainingState: TrainingState = {
  moveHistory: [],
  evaluations: [],
  currentMoveIndex: -1,
  isPlayerTurn: true,
  isGameFinished: false,
  isSuccess: false,
  hintsUsed: 0,
  mistakeCount: 0,
  analysisStatus: "idle",
  tablebaseMove: undefined,
  moveErrorDialog: null,
};

const initialProgressState: ProgressState = {
  positionProgress: {},
  dailyStats: {
    date: new Date().toISOString().split("T")[0],
    positionsSolved: 0,
    timeSpent: 0,
    accuracy: 0,
    mistakesMade: 0,
    hintsUsed: 0,
  },
  achievements: [],
  totalSolvedPositions: 0,
  averageAccuracy: 0,
  favoritePositions: [],
};

const initialUIState: UIState = {
  sidebarOpen: false,
  modalOpen: null,
  toasts: [],
  loading: {
    global: false,
    engine: false,
    position: false,
    analysis: false,
  },
  analysisPanel: {
    isOpen: false,
    activeTab: "moves",
    showEngine: true,
    showTablebase: true,
  },
};

const initialSettingsState: SettingsState = {
  appVersion: "1.0.0",
  lastUpdated: new Date().toISOString(),
  dataSync: {
    enabled: false,
    syncInProgress: false,
  },
  experimentalFeatures: {
    advancedAnalysis: false,
    voiceCommands: false,
    multipleVariations: false,
    puzzleRush: false,
  },
};

// Create the store
export /**
 *
 */
const useStore = create<RootState & Actions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        user: initialUserState,
        training: initialTrainingState,
        progress: initialProgressState,
        ui: initialUIState,
        settings: initialSettingsState,

        // User Actions
        /**
         *
         * @param user
         */
        setUser: (user) =>
          set((state) => {
            Object.assign(state.user, user);
            logger.info("User updated", { user });
          }),

        /**
         *
         * @param preferences
         */
        updatePreferences: (preferences) =>
          set((state) => {
            Object.assign(state.user.preferences, preferences);
            logger.info("Preferences updated", { preferences });
          }),

        /**
         *
         */
        incrementStreak: () =>
          set((state) => {
            state.user.currentStreak += 1;
            logger.info("Streak incremented", {
              newStreak: state.user.currentStreak,
            });
          }),

        /**
         *
         */
        resetStreak: () =>
          set((state) => {
            state.user.currentStreak = 0;
            logger.info("Streak reset");
          }),

        /**
         *
         * @param positionId
         */
        addCompletedPosition: (positionId) =>
          set((state) => {
            if (!state.user.completedPositions.includes(positionId)) {
              state.user.completedPositions.push(positionId);
              logger.info("Position completed", { positionId });
            }
          }),

        // Training Actions
        /**
         *
         * @param position
         */
        setPosition: (position) =>
          set((state) => {
            // Validate FEN before setting position
            if (position.fen) {
              const validation = validateAndSanitizeFen(position.fen);
              if (!validation.isValid) {
                logger.error("Invalid FEN in position", {
                  positionId: position.id,
                  errors: validation.errors,
                });
                get().showToast("Invalid position format", "error");
                return;
              }
              // Use sanitized FEN
              position = { ...position, fen: validation.sanitized };
            }

            // Initialize game with the position
            const newGame = new Chess();
            newGame.load(position.fen);

            state.training.currentPosition = position;
            state.training.game = newGame;
            state.training.moveHistory = [];
            state.training.evaluations = [];
            state.training.currentMoveIndex = -1;
            state.training.currentFen = newGame.fen();
            state.training.currentPgn = newGame.pgn();
            state.training.isPlayerTurn = true;
            state.training.isGameFinished = false;
            state.training.isSuccess = false;
            state.training.startTime = Date.now();
            state.training.hintsUsed = 0;
            state.training.mistakeCount = 0;

            // Clear navigation context when position changes
            state.training.nextPosition = undefined;
            state.training.previousPosition = undefined;

            // Clear any pending tablebase moves
            state.training.analysisStatus = "idle";
            state.training.tablebaseMove = undefined;

            logger.info("Position set", { positionId: position.id });
          }),

        /**
         *
         * @param position
         */
        loadTrainingContext: async (position) => {
          // Avoid re-fetching if we already have context for this position
          const currentState = get();
          if (
            currentState.training.currentPosition?.id === position.id &&
            currentState.training.nextPosition !== undefined &&
            currentState.training.previousPosition !== undefined
          ) {
            logger.info("Skipping navigation context load - already cached", {
              positionId: position.id,
              hasNext: currentState.training.nextPosition !== null,
              hasPrev: currentState.training.previousPosition !== null,
            });
            return;
          }

          set((state) => {
            state.training.currentPosition = position;
            state.training.isLoadingNavigation = true;
            state.training.navigationError = null;
            // Reset navigation state while loading
            state.training.nextPosition = undefined;
            state.training.previousPosition = undefined;
          });

          try {
            const { positionService } = getStoreDependencies();

            logger.info("Loading navigation context", {
              positionId: position.id,
              category: position.category,
            });

            const [next, prev] = await Promise.all([
              positionService.getNextPosition(position.id, position.category),
              positionService.getPreviousPosition(
                position.id,
                position.category,
              ),
            ]);

            set((state) => {
              state.training.nextPosition = next;
              state.training.previousPosition = prev;
              state.training.isLoadingNavigation = false;
            });

            logger.info("Training context loaded", {
              positionId: position.id,
              category: position.category,
              hasNext: !!next,
              hasPrev: !!prev,
              nextId: next?.id,
              prevId: prev?.id,
            });
          } catch (err) {
            logger.error("Failed to load navigation context:", err);
            set((state) => {
              state.training.navigationError =
                "Navigation konnte nicht geladen werden";
              state.training.isLoadingNavigation = false;
            });
          }
        },

        /**
         *
         * @param game
         */
        setGame: (game) =>
          set((state) => {
            state.training.game = game;
            state.training.currentFen = game.fen();
            state.training.currentPgn = game.pgn();
            logger.debug("Game instance set");
          }),

        /**
         * Internal move execution without validation
         * @param move
         */
        _internalApplyMove: (
          move: ChessJsMove | { from: string; to: string; promotion?: string },
        ) =>
          set((state) => {
            try {
              // 1. Execute the move on the store's chess.js instance first
              if (!state.training.game) {
                logger.error("No game instance available for move");
                return;
              }

              // Try to make the move on the actual game instance
              const moveResult = state.training.game.move(move);

              if (!moveResult) {
                logger.error("Invalid move attempted in store:", move);
                return; // Don't update state for invalid moves
              }

              // 2. Handle navigation state - truncate future moves if we're not at the end
              const currentIndex =
                state.training.currentMoveIndex ??
                state.training.moveHistory.length - 1;
              if (currentIndex < state.training.moveHistory.length - 1) {
                // Truncate move history after current position
                state.training.moveHistory = state.training.moveHistory.slice(
                  0,
                  currentIndex + 1,
                );
                state.training.evaluations = state.training.evaluations.slice(
                  0,
                  currentIndex + 2,
                ); // +2 because evaluations include initial position
              }

              // 3. Convert library move to validated domain move for storage
              const validatedMove = fromLibraryMove(moveResult);

              // 4. Update ALL derived states atomically after the move was executed
              state.training.moveHistory.push(validatedMove);
              state.training.isPlayerTurn = !state.training.isPlayerTurn;
              state.training.currentMoveIndex =
                state.training.moveHistory.length - 1;

              // 5. Update FEN and PGN from the updated game instance
              state.training.currentFen = state.training.game.fen();
              state.training.currentPgn = state.training.game.pgn();

              logger.debug("Move made", {
                from: validatedMove.from,
                to: validatedMove.to,
                san: validatedMove.san,
                newIndex: state.training.currentMoveIndex,
                newFen: state.training.currentFen,
              });
            } catch (error) {
              if (error instanceof ChessAdapterError) {
                logger.error("Invalid move rejected", {
                  error: error.message,
                  context: error.context,
                });
                // Don't update state for invalid moves
                return;
              }
              // Re-throw unexpected errors
              throw error;
            }
          }),

        /**
         * Public move action with validation for user moves
         * @param move - Can be a SAN string (e.g. "Nf3"), UCI string (e.g. "g1f3"),
         *                or a move object with from/to/promotion fields
         */
        makeUserMove: async (
          move:
            | ChessJsMove
            | { from: string; to: string; promotion?: string }
            | string,
        ) => {
          logger.info("Store makeUserMove entry point", { move });

          const state = get();
          const { _internalApplyMove, setMoveErrorDialog } = get();

          // Get current game state
          const game = state.training.game;
          if (!game) {
            logger.error("No game instance for user move");
            return false;
          }

          // Get FEN before the move
          const fenBefore = game.fen();

          // Create a temporary game to test the move
          const tempGame = new Chess(fenBefore);

          // Debug: Log the move attempt details (safe for mocks)
          logger.info("Store makeUserMove: Attempting move", {
            move,
            fenBefore,
          });

          const tempMove = tempGame.move(move);

          if (!tempMove) {
            logger.error("Store makeUserMove: Invalid user move attempted", {
              move,
              fenBefore,
            });
            return false;
          }

          logger.info("Store makeUserMove: Move accepted by chess.js", {
            move,
            tempMove: `${tempMove.from}-${tempMove.to}`,
            san: tempMove.san,
          });

          const fenAfter = tempGame.fen();

          try {
            // Get tablebase evaluations for both positions
            const [evalBefore, evalAfter] = await Promise.all([
              tablebaseService.getEvaluation(fenBefore),
              tablebaseService.getEvaluation(fenAfter),
            ]);

            // Check if move worsens position
            if (
              evalBefore.isAvailable &&
              evalAfter.isAvailable &&
              evalBefore.result &&
              evalAfter.result
            ) {
              // Get WDL values from API - these are from the perspective of the side to move
              const wdlBefore = evalBefore.result.wdl; // From perspective of side who is moving
              const wdlAfter = evalAfter.result.wdl; // From perspective of side who will move after

              // Define WDL constants for clarity
              const WDL_WIN = 2;
              const WDL_DRAW = 0;
              const WDL_LOSS = -2;

              // Convert to consistent perspective (Training player's perspective)
              // wdlBefore: evaluation from perspective of side that just moved (White)
              // wdlAfter: evaluation from perspective of side that will move next (Black)
              // For training as White: "loss" for Black = "win" for White, so we invert
              // Use Object.freeze(0) to normalize -0 to 0 to avoid test comparison issues
              const wdlAfterFromTrainingPerspective =
                wdlAfter === 0 ? 0 : -wdlAfter;

              logger.info("User move quality check", {
                move: `${tempMove.from}${tempMove.to}`,
                san: tempMove.san,
                wdlBefore,
                wdlAfter,
                wdlAfterFromTrainingPerspective,
                categoryBefore: evalBefore.result.category,
                categoryAfter: evalAfter.result.category,
                WDL_WIN,
                WDL_DRAW,
                WDL_LOSS,
                winToDrawOrLossCondition: `${wdlBefore} === ${WDL_WIN} && (${wdlAfterFromTrainingPerspective} === ${WDL_DRAW} || ${wdlAfterFromTrainingPerspective} === ${WDL_LOSS})`,
                winToDrawOrLossResult:
                  wdlBefore === WDL_WIN &&
                  (wdlAfterFromTrainingPerspective === WDL_DRAW ||
                    wdlAfterFromTrainingPerspective === WDL_LOSS),
              });

              // Check if move actually changes the game outcome (not just suboptimal)
              // Now compare consistent perspectives: wdlBefore vs wdlAfterFromTrainingPerspective
              const winToDrawOrLoss =
                wdlBefore === WDL_WIN &&
                (wdlAfterFromTrainingPerspective === WDL_DRAW ||
                  wdlAfterFromTrainingPerspective === WDL_LOSS);
              const drawToLoss =
                wdlBefore === WDL_DRAW &&
                wdlAfterFromTrainingPerspective === WDL_LOSS;

              if (winToDrawOrLoss || drawToLoss) {
                logger.warn("Bad user move detected - game outcome worsened", {
                  move: `${tempMove.from}${tempMove.to}`,
                  wdlBefore,
                  wdlAfter,
                  outcomeChange: winToDrawOrLoss
                    ? "Win->Draw/Loss"
                    : "Draw->Loss",
                });

                // Find best move - but only if it maintains or improves the position
                let bestMoveSan: string | undefined;
                try {
                  const topMoves = await tablebaseService.getTopMoves(
                    fenBefore,
                    5, // Get more moves to find truly best ones
                  );
                  if (
                    topMoves.isAvailable &&
                    topMoves.moves &&
                    topMoves.moves.length > 0
                  ) {
                    // Find a move that maintains the win (if position was winning)
                    // or at least maintains the draw (if position was drawing)
                    for (const move of topMoves.moves) {
                      // For winning positions, only suggest moves that maintain the win
                      if (wdlBefore === WDL_WIN && move.wdl === WDL_LOSS) {
                        // WDL_LOSS from opponent's perspective = WIN for us
                        bestMoveSan = move.san;
                        break;
                      }
                      // For drawing positions, any draw move is acceptable
                      else if (
                        wdlBefore === WDL_DRAW &&
                        move.wdl === WDL_DRAW
                      ) {
                        bestMoveSan = move.san;
                        break;
                      }
                    }

                    // If no ideal move found, just take the first one
                    if (!bestMoveSan && topMoves.moves.length > 0) {
                      bestMoveSan = topMoves.moves[0].san;
                    }
                  }
                } catch (error) {
                  logger.error("Error finding best move", error as Error);
                }

                // Show error dialog with corrected perspective values
                setMoveErrorDialog({
                  isOpen: true,
                  wdlBefore,
                  wdlAfter: wdlAfterFromTrainingPerspective, // Use corrected perspective
                  bestMove: bestMoveSan,
                });

                return false; // Don't execute the move
              }
            }

            // Move is good, execute it using the validated move object
            _internalApplyMove(tempMove);
            return true;
          } catch (error) {
            logger.error("Error validating user move", error as Error);
            // On error, allow the move (fail open) using the validated move object
            _internalApplyMove(tempMove);
            return true;
          }
        },

        /**
         * Set move error dialog state
         * @param dialogState
         */
        setMoveErrorDialog: (
          dialogState: {
            isOpen: boolean;
            wdlBefore?: number;
            wdlAfter?: number;
            bestMove?: string;
          } | null,
        ) =>
          set((state) => {
            state.training.moveErrorDialog = dialogState;
          }),

        /**
         *
         */
        undoMove: () =>
          set((state) => {
            if (state.training.moveHistory.length > 0) {
              state.training.moveHistory.pop();
              state.training.isPlayerTurn = !state.training.isPlayerTurn;
              logger.debug("Move undone");
            }
          }),

        /**
         *
         */
        resetPosition: () =>
          set((state) => {
            state.training.moveHistory = [];
            state.training.evaluations = [];
            state.training.currentMoveIndex = -1;
            state.training.isPlayerTurn = true;
            state.training.isGameFinished = false;
            state.training.isSuccess = false;
            state.training.hintsUsed = 0;
            state.training.mistakeCount = 0;
            state.training.startTime = Date.now();

            // Reset PGN and FEN to initial position
            if (state.training.game && state.training.currentPosition) {
              state.training.game.load(state.training.currentPosition.fen);
              state.training.currentFen = state.training.game.fen();
              state.training.currentPgn = state.training.game.pgn();
            }

            logger.info("Position reset");
          }),

        /**
         *
         * @param evaluation
         */
        setEvaluation: (evaluation) =>
          set((state) => {
            state.training.currentEvaluation = evaluation;
            logger.debug("Evaluation updated", { evaluation });
          }),

        /**
         *
         * @param evaluations
         */
        setEvaluations: (evaluations) =>
          set((state) => {
            state.training.evaluations = evaluations;
            logger.debug("Evaluations array updated", {
              count: evaluations.length,
            });
          }),

        /**
         *
         * @param status
         */
        setAnalysisStatus: (status) =>
          set((state) => {
            state.training.analysisStatus = status;
            logger.debug("Analysis status changed", { status });
          }),

        /**
         *
         * @param success
         */
        completeTraining: (success) =>
          set((state) => {
            state.training.isGameFinished = true;
            state.training.isSuccess = success;
            state.training.endTime = Date.now();

            if (state.training.currentPosition) {
              const positionId = state.training.currentPosition.id;
              const timeSpent =
                (state.training.endTime - (state.training.startTime || 0)) /
                1000;

              // Update progress
              get().updatePositionProgress(positionId, {
                attempts:
                  (state.progress.positionProgress[positionId]?.attempts || 0) +
                  1,
                successes:
                  (state.progress.positionProgress[positionId]?.successes ||
                    0) + (success ? 1 : 0),
              });

              // Update daily stats
              get().addDailyStats({
                positionsSolved: success ? 1 : 0,
                timeSpent,
                mistakesMade: state.training.mistakeCount,
                hintsUsed: state.training.hintsUsed,
              });

              logger.info("Training completed", {
                positionId,
                success,
                timeSpent,
              });
            }
          }),

        /**
         *
         */
        useHint: () =>
          set((state) => {
            state.training.hintsUsed += 1;
            logger.debug("Hint used", { total: state.training.hintsUsed });
          }),

        /**
         *
         */
        incrementMistake: () =>
          set((state) => {
            state.training.mistakeCount += 1;
            logger.debug("Mistake made", {
              total: state.training.mistakeCount,
            });
          }),

        // Navigation Actions
        /**
         *
         * @param moveIndex
         */
        goToMove: (moveIndex) =>
          set((state) => {
            const targetIndex = Math.max(
              -1,
              Math.min(moveIndex, state.training.moveHistory.length - 1),
            );

            if (targetIndex === state.training.currentMoveIndex) {
              return; // No change needed
            }

            // Reconstruct the position at the target index
            if (state.training.game && state.training.currentPosition) {
              // Reset to initial position
              state.training.game.load(state.training.currentPosition.fen);

              // Apply moves up to targetIndex (not including when targetIndex is -1)
              if (targetIndex >= 0) {
                for (let i = 0; i <= targetIndex; i++) {
                  const move = state.training.moveHistory[i];
                  state.training.game.move({
                    from: move.from,
                    to: move.to,
                    promotion: move.promotion,
                  });
                }
              }

              // Update state
              state.training.currentMoveIndex = targetIndex;
              state.training.currentFen = state.training.game.fen();
              state.training.currentPgn = state.training.game.pgn();

              // Determine whose turn it is based on game state and player side
              const currentTurn = state.training.game.turn(); // 'w' or 'b'
              const playerSide =
                state.training.currentPosition?.sideToMove === "white"
                  ? "w"
                  : "b";
              state.training.isPlayerTurn = currentTurn === playerSide;

              logger.debug("Navigated to move", {
                moveIndex: targetIndex,
                fen: state.training.currentFen,
              });
            }
          }),

        /**
         *
         */
        goToFirst: () => {
          get().goToMove(-1);
        },

        /**
         *
         */
        goToPrevious: () => {
          const currentIndex =
            get().training.currentMoveIndex ??
            get().training.moveHistory.length - 1;
          get().goToMove(currentIndex - 1);
        },

        /**
         *
         */
        goToNext: () => {
          const currentIndex = get().training.currentMoveIndex ?? -1;
          get().goToMove(currentIndex + 1);
        },

        /**
         *
         */
        goToLast: () => {
          get().goToMove(get().training.moveHistory.length - 1);
        },

        // Progress Actions
        /**
         *
         * @param positionId
         * @param update
         */
        updatePositionProgress: (positionId, update) =>
          set((state) => {
            if (!state.progress.positionProgress[positionId]) {
              state.progress.positionProgress[positionId] = {
                positionId,
                attempts: 0,
                successes: 0,
                lastAttemptDate: new Date().toISOString(),
                averageTime: 0,
                difficulty: 1,
              };
            }
            Object.assign(state.progress.positionProgress[positionId], update);
            logger.debug("Position progress updated", { positionId, update });
          }),

        /**
         *
         * @param stats
         */
        addDailyStats: (stats) =>
          set((state) => {
            const today = new Date().toISOString().split("T")[0];
            if (state.progress.dailyStats.date !== today) {
              state.progress.dailyStats = {
                date: today,
                positionsSolved: 0,
                timeSpent: 0,
                accuracy: 0,
                mistakesMade: 0,
                hintsUsed: 0,
              };
            }

            const dailyStats = state.progress.dailyStats;
            dailyStats.positionsSolved += stats.positionsSolved || 0;
            dailyStats.timeSpent += stats.timeSpent || 0;
            dailyStats.mistakesMade += stats.mistakesMade || 0;
            dailyStats.hintsUsed += stats.hintsUsed || 0;

            // Recalculate accuracy
            const totalAttempts = Object.values(
              state.progress.positionProgress,
            ).reduce((sum, p) => sum + p.attempts, 0);
            const totalSuccesses = Object.values(
              state.progress.positionProgress,
            ).reduce((sum, p) => sum + p.successes, 0);
            dailyStats.accuracy =
              totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0;
          }),

        /**
         *
         * @param achievementId
         */
        unlockAchievement: (achievementId) =>
          set((state) => {
            const achievement = state.progress.achievements.find(
              (a) => a.id === achievementId,
            );
            if (achievement && !achievement.unlockedDate) {
              achievement.unlockedDate = new Date().toISOString();
              logger.info("Achievement unlocked", { achievementId });
              get().showToast(
                `Achievement unlocked: ${achievement.name}`,
                "success",
              );
            }
          }),

        /**
         *
         * @param positionId
         */
        toggleFavorite: (positionId) =>
          set((state) => {
            const index = state.progress.favoritePositions.indexOf(positionId);
            if (index === -1) {
              state.progress.favoritePositions.push(positionId);
            } else {
              state.progress.favoritePositions.splice(index, 1);
            }
            logger.debug("Favorite toggled", { positionId });
          }),

        /**
         *
         * @param positionId
         * @param _success
         */
        calculateNextReview: (positionId, _success) =>
          set((state) => {
            const progress = state.progress.positionProgress[positionId];
            if (!progress) return;

            const successRate =
              progress.attempts > 0
                ? progress.successes / progress.attempts
                : 0;
            const intervalIndex = Math.min(
              Math.floor(successRate * TRAINING.REPETITION_INTERVALS.length),
              TRAINING.REPETITION_INTERVALS.length - 1,
            );
            const daysUntilReview =
              TRAINING.REPETITION_INTERVALS[intervalIndex];

            progress.nextReviewDate = new Date(
              Date.now() + daysUntilReview * TIME.DAY,
            ).toISOString();

            logger.debug("Next review calculated", {
              positionId,
              daysUntilReview,
            });
          }),

        // UI Actions
        /**
         *
         */
        toggleSidebar: () =>
          set((state) => {
            state.ui.sidebarOpen = !state.ui.sidebarOpen;
          }),

        /**
         *
         * @param type
         */
        openModal: (type) =>
          set((state) => {
            state.ui.modalOpen = type;
          }),

        /**
         *
         */
        closeModal: () =>
          set((state) => {
            state.ui.modalOpen = null;
          }),

        /**
         *
         * @param message
         * @param type
         * @param duration
         */
        showToast: (message, type, duration = 3000) =>
          set((state) => {
            const toast: Toast = {
              id: Date.now().toString(),
              message,
              type,
              duration,
            };
            state.ui.toasts.push(toast);

            // Auto-remove toast after duration
            setTimeout(() => {
              get().removeToast(toast.id);
            }, duration);
          }),

        /**
         *
         * @param id
         */
        removeToast: (id) =>
          set((state) => {
            state.ui.toasts = state.ui.toasts.filter((t) => t.id !== id);
          }),

        /**
         *
         * @param key
         * @param value
         */
        setLoading: (key, value) =>
          set((state) => {
            state.ui.loading[key] = value;
          }),

        /**
         *
         * @param update
         */
        updateAnalysisPanel: (update) =>
          set((state) => {
            Object.assign(state.ui.analysisPanel, update);
          }),

        // Settings Actions
        /**
         *
         * @param settings
         */
        updateSettings: (settings) =>
          set((state) => {
            Object.assign(state.settings, settings);
            state.settings.lastUpdated = new Date().toISOString();
          }),

        /**
         *
         * @param feature
         */
        toggleExperimentalFeature: (feature) =>
          set((state) => {
            state.settings.experimentalFeatures[feature] =
              !state.settings.experimentalFeatures[feature];
            logger.info("Experimental feature toggled", {
              feature,
              enabled: state.settings.experimentalFeatures[feature],
            });
          }),

        /**
         *
         */
        startSync: () =>
          set((state) => {
            state.settings.dataSync.syncInProgress = true;
            state.settings.dataSync.syncError = undefined;
          }),

        /**
         *
         * @param success
         * @param error
         */
        completeSync: (success, error) =>
          set((state) => {
            state.settings.dataSync.syncInProgress = false;
            if (success) {
              state.settings.dataSync.lastSyncDate = new Date().toISOString();
            } else {
              state.settings.dataSync.syncError = error;
            }
          }),

        // Global Actions
        /**
         *
         */
        reset: () =>
          set(() => ({
            user: initialUserState,
            training: initialTrainingState,
            progress: initialProgressState,
            ui: initialUIState,
            settings: initialSettingsState,
          })),

        /**
         *
         * @param state
         */
        hydrate: (state) =>
          set((draft) => {
            Object.assign(draft, state);
            logger.info("State hydrated");
          }),
      })),
      {
        name: "chess-trainer-storage",
        /**
         *
         * @param state
         */
        partialize: (state) => ({
          user: state.user,
          progress: state.progress,
          settings: state.settings,
        }),
      },
    ),
    {
      name: "ChessTrainerStore",
    },
  ),
);

// Selectors for common use cases
/**
 *
 */
export /**
 *
 */
const useUser = () => useStore((state) => state.user);
/**
 *
 */
export /**
 *
 */
const useTraining = () => useStore((state) => state.training);
/**
 *
 */
export /**
 *
 */
const useProgress = () => useStore((state) => state.progress);
/**
 *
 */
export /**
 *
 */
const useUI = () => useStore((state) => state.ui);
/**
 *
 */
export /**
 *
 */
const useSettings = () => useStore((state) => state.settings);

// Action selectors
/**
 *
 */
export /**
 *
 */
const useUserActions = () =>
  useStore((state) => ({
    setUser: state.setUser,
    updatePreferences: state.updatePreferences,
    incrementStreak: state.incrementStreak,
    resetStreak: state.resetStreak,
    addCompletedPosition: state.addCompletedPosition,
  }));

/**
 *
 */
export /**
 *
 */
const useTrainingActions = () =>
  useStore((state) => ({
    setPosition: state.setPosition,
    loadTrainingContext: state.loadTrainingContext,
    setGame: state.setGame,
    makeUserMove: state.makeUserMove,
    _internalApplyMove: state._internalApplyMove,
    undoMove: state.undoMove,
    resetPosition: state.resetPosition,
    setEvaluation: state.setEvaluation,
    setEvaluations: state.setEvaluations,
    setAnalysisStatus: state.setAnalysisStatus,
    completeTraining: state.completeTraining,
    useHint: state.useHint,
    incrementMistake: state.incrementMistake,
    setMoveErrorDialog: state.setMoveErrorDialog,
    // Navigation actions
    goToMove: state.goToMove,
    goToFirst: state.goToFirst,
    goToPrevious: state.goToPrevious,
    goToNext: state.goToNext,
    goToLast: state.goToLast,
  }));

/**
 *
 */
export /**
 *
 */
const useUIActions = () =>
  useStore((state) => ({
    toggleSidebar: state.toggleSidebar,
    openModal: state.openModal,
    closeModal: state.closeModal,
    showToast: state.showToast,
    removeToast: state.removeToast,
    setLoading: state.setLoading,
    updateAnalysisPanel: state.updateAnalysisPanel,
  }));
