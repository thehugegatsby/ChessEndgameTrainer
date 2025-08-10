/**
 * @file Training state slice for Zustand store
 * @module store/slices/trainingSlice
 * @description Manages chess training session state including position management,
 * navigation, progress tracking, and training-specific game features.
 * This slice handles the core training logic and user interaction flow.
 *
 * @example
 * ```typescript
 * // Using the training slice in a component
 * import { useStore } from '@/store';
 * import { trainingSelectors } from '@/store/slices/trainingSlice';
 *
 * function TrainingSession() {
 *   const currentPosition = useStore(trainingSelectors.selectCurrentPosition);
 *   const isPlayerTurn = useStore(trainingSelectors.selectIsPlayerTurn);
 *   const hintsUsed = useStore(trainingSelectors.selectHintsUsed);
 *   const incrementHint = useStore(state => state.incrementHint);
 *
 *   const handleHintRequest = () => {
 *     if (hintsUsed < 3) incrementHint();
 *   };
 * }
 * ```
 */

import { TrainingSlice, TrainingState, TrainingActions } from "./types";
import type { EndgamePosition as BaseEndgamePosition } from "@shared/types/endgame";
import type { ValidatedMove } from "@shared/types/chess";
import type { MoveSuccessDialog } from "@shared/store/orchestrators/handlePlayerMove/move.types";

// Re-export types for external use
export type { TrainingState, TrainingActions } from "./types";
import { getLogger } from "@shared/services/logging";

/**
 * Extended EndgamePosition with training-specific fields
 * @interface TrainingPosition
 * @extends BaseEndgamePosition
 */
export interface TrainingPosition extends BaseEndgamePosition {
  /**
   * Color the user is training (determines which side to play)
   */
  colorToTrain: "white" | "black";

  /**
   * Expected outcome for successful training completion
   */
  targetOutcome: "1-0" | "0-1" | "1/2-1/2";

  /**
   * Optional time limit in seconds
   */
  timeLimit?: number;

  /**
   * Chapter ID this position belongs to
   */
  chapterId?: string;
}

/**
 * Initial state for the training slice
 * Exported separately to enable proper store reset in tests
 */
export const initialTrainingState = {
  currentPosition: undefined as TrainingPosition | undefined,
  nextPosition: undefined as TrainingPosition | null | undefined,
  previousPosition: undefined as TrainingPosition | null | undefined,
  isLoadingNavigation: false,
  navigationError: null as string | null,
  chapterProgress: null as { completed: number; total: number } | null,
  isPlayerTurn: true,
  isOpponentThinking: false,
  isSuccess: false,
  sessionStartTime: undefined as number | undefined,
  sessionEndTime: undefined as number | undefined,
  hintsUsed: 0,
  mistakeCount: 0,
  currentStreak: 0,
  bestStreak: 0,
  showCheckmark: false,
  autoProgressEnabled: true,
  moveErrorDialog: null as {
    isOpen: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    bestMove?: string;
  } | null,
  moveSuccessDialog: null as MoveSuccessDialog | null,
  evaluationBaseline: null as {
    wdl: number | null;
    fen: string | null;
    timestamp: number | null;
  } | null,
};


/**
 * Creates the training state (data only, no actions)
 *
 * @returns {TrainingState} Training state properties only
 *
 * @remarks
 * This function creates only the state properties for training slice.
 * Actions are created separately to avoid Immer middleware stripping functions.
 *
 * @example
 * ```typescript
 * const trainingState = createTrainingState();
 * const trainingActions = createTrainingActions(set, get);
 * ```
 */
export const createTrainingState = (): TrainingState => ({
  currentPosition: undefined as TrainingPosition | undefined,
  nextPosition: undefined as TrainingPosition | null | undefined,
  previousPosition: undefined as TrainingPosition | null | undefined,
  isLoadingNavigation: false,
  navigationError: null as string | null,
  chapterProgress: null as { completed: number; total: number } | null,
  isPlayerTurn: true,
  isOpponentThinking: false,
  isSuccess: false,
  sessionStartTime: undefined as number | undefined,
  sessionEndTime: undefined as number | undefined,
  hintsUsed: 0,
  mistakeCount: 0,
  currentStreak: 0,
  bestStreak: 0,
  showCheckmark: false,
  autoProgressEnabled: true,
  moveErrorDialog: null as {
    isOpen: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    bestMove?: string;
  } | null,
  moveSuccessDialog: null as MoveSuccessDialog | null,
  evaluationBaseline: null as {
    wdl: number | null;
    fen: string | null;
    timestamp: number | null;
  } | null,
});

/**
 * Creates the training actions (functions only, no state)
 *
 * @param {Function} set - Zustand's set function for state updates
 * @param {Function} get - Zustand's get function for accessing current state
 * @returns {TrainingActions} Training action functions
 *
 * @remarks
 * This function creates only the action functions for training slice.
 * Actions are kept separate from state to prevent Immer middleware from stripping them.
 *
 * @example
 * ```typescript
 * const trainingActions = createTrainingActions(set, get);
 * ```
 */
const logger = getLogger().setContext("TrainingSlice");

export const createTrainingActions = (
  set: (fn: (state: { training: TrainingState; game: { moveHistory: ValidatedMove[] } }) => void) => void,
  get: () => { training: TrainingState },
): TrainingActions => ({

  /**
   * Sets the current training position
   *
   * @param {TrainingPosition} position - The position to set as current
   *
   * @fires stateChange - When position is updated
   *
   * @remarks
   * This action sets the active training position and resets session-specific
   * state like hints and mistakes. It should be called when starting a new
   * training session or switching positions. The actual game initialization
   * should be handled by an orchestrator that coordinates with GameSlice.
   *
   * @example
   * ```typescript
   * const position: TrainingPosition = {
   *   id: 1,
   *   title: "King and Rook vs King",
   *   fen: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
   *   colorToTrain: "white",
   *   targetOutcome: "1-0",
   *   // ... other fields
   * };
   *
   * store.getState().setPosition(position);
   * ```
   */
  setPosition: (position: TrainingPosition) => {
    set((state) => {
      state.training.currentPosition = position;
      state.training.isSuccess = false;
      state.training.sessionStartTime = Date.now();
      state.training.sessionEndTime = undefined;
      state.training.hintsUsed = 0;
      state.training.mistakeCount = 0;
      // Set initial turn based on position
      state.training.isPlayerTurn =
        position.sideToMove === position.colorToTrain;
      // Clear evaluation baseline when setting new position
      state.training.evaluationBaseline = null;
    });
  },

  /**
   * Sets navigation positions (next/previous)
   *
   * @param {TrainingPosition|null} [next] - Next position in sequence
   * @param {TrainingPosition|null} [previous] - Previous position in sequence
   *
   * @fires stateChange - When navigation positions are updated
   *
   * @remarks
   * Used to enable navigation between positions in a training sequence.
   * Null indicates no position available in that direction. Undefined
   * parameters leave the respective position unchanged.
   *
   * @example
   * ```typescript
   * // Set both navigation positions
   * store.getState().setNavigationPositions(nextPos, prevPos);
   *
   * // Only update next position
   * store.getState().setNavigationPositions(nextPos);
   *
   * // Clear navigation
   * store.getState().setNavigationPositions(null, null);
   * ```
   */
  setNavigationPositions: (
    next?: TrainingPosition | null,
    previous?: TrainingPosition | null,
  ) => {
    set((state) => {
      if (next !== undefined) {
        state.training.nextPosition = next;
      }
      if (previous !== undefined) {
        state.training.previousPosition = previous;
      }
    });
  },

  /**
   * Sets navigation loading state
   *
   * @param {boolean} loading - Whether navigation is loading
   *
   * @fires stateChange - When loading state changes
   *
   * @remarks
   * Used to show loading indicators during position navigation.
   * Should be set to true when fetching navigation data and
   * false when complete or on error.
   *
   * @example
   * ```typescript
   * // Start loading
   * store.getState().setNavigationLoading(true);
   *
   * // After loading completes
   * store.getState().setNavigationLoading(false);
   * ```
   */
  setNavigationLoading: (loading: boolean) => {
    set((state) => {
      state.training.isLoadingNavigation = loading;
    });
  },

  /**
   * Sets navigation error message
   *
   * @param {string|null} error - Error message or null to clear
   *
   * @fires stateChange - When error state changes
   *
   * @remarks
   * Used to display error messages when navigation fails.
   * Set to null to clear the error state.
   *
   * @example
   * ```typescript
   * // Set error
   * store.getState().setNavigationError("Position nicht gefunden");
   *
   * // Clear error
   * store.getState().setNavigationError(null);
   * ```
   */
  setNavigationError: (error: string | null) => {
    set((state) => {
      state.training.navigationError = error;
    });
  },

  /**
   * Sets chapter progress information
   *
   * @param {Object|null} progress - Progress data or null to clear
   * @param {number} progress.completed - Number of completed positions
   * @param {number} progress.total - Total positions in chapter
   *
   * @fires stateChange - When progress is updated
   *
   * @remarks
   * Tracks progress through a chapter or training sequence.
   * Used to display progress indicators in the UI.
   *
   * @example
   * ```typescript
   * // Set progress
   * store.getState().setChapterProgress({
   *   completed: 3,
   *   total: 10
   * });
   *
   * // Clear progress
   * store.getState().setChapterProgress(null);
   * ```
   */
  setChapterProgress: (
    progress: { completed: number; total: number } | null,
  ) => {
    set((state) => {
      state.training.chapterProgress = progress;
    });
  },

  /**
   * Sets whether it's the player's turn
   *
   * @param {boolean} isPlayerTurn - Whether player can make moves
   *
   * @fires stateChange - When turn state changes
   *
   * @remarks
   * Controls when the user can interact with the board.
   * Should be updated after each move based on game state
   * and training configuration.
   *
   * @example
   * ```typescript
   * // Enable player moves
   * store.getState().setPlayerTurn(true);
   *
   * // Disable during computer's turn
   * store.getState().setPlayerTurn(false);
   * ```
   */
  setPlayerTurn: (isPlayerTurn: boolean) => {
    set((state) => {
      state.training.isPlayerTurn = isPlayerTurn;
    });
  },

  /**
   * Clears the opponent thinking flag
   *
   * @fires stateChange - When flag is cleared
   *
   * @remarks
   * Used when cancelling opponent moves, particularly after
   * undoing a suboptimal move. Ensures the UI properly reflects
   * that the opponent is no longer calculating a move.
   *
   * @example
   * ```typescript
   * // Clear flag after cancelling opponent turn
   * store.getState().clearOpponentThinking();
   * ```
   */
  clearOpponentThinking: () => {
    set((state) => {
      state.training.isOpponentThinking = false;
    });
  },

  /**
   * Completes the training session
   *
   * @param {boolean} success - Whether training was completed successfully
   *
   * @fires stateChange - When training completes
   *
   * @remarks
   * Marks the training session as complete and records the end time.
   * Success is typically determined by reaching the target outcome
   * (win/draw) as specified in the position configuration.
   *
   * @example
   * ```typescript
   * // Successful completion
   * store.getState().completeTraining(true);
   *
   * // Failed completion
   * store.getState().completeTraining(false);
   * ```
   */
  completeTraining: (success: boolean) => {
    set((state) => {
      state.training.isSuccess = success;
      state.training.sessionEndTime = Date.now();
    });
  },

  /**
   * Increments the hint counter
   *
   * @fires stateChange - When hint count increases
   *
   * @remarks
   * Increments the hint counter for the current session.
   * This affects performance metrics and achievements.
   * The actual hint display should be handled by the UI
   * based on the position's hint data.
   *
   * @example
   * ```typescript
   * // User requests a hint
   * store.getState().incrementHint();
   *
   * // Check hint usage
   * const hintsUsed = store.getState().hintsUsed;
   * if (hintsUsed >= 3) {
   *   // Maybe disable hint button
   * }
   * ```
   */
  incrementHint: () => {
    set((state) => {
      state.training.hintsUsed = state.training.hintsUsed + 1;
    });
  },

  /**
   * Increments the mistake counter
   *
   * @fires stateChange - When mistake count increases
   *
   * @remarks
   * Called when the user makes a suboptimal or incorrect move.
   * This affects performance metrics and is used for training
   * analytics. What constitutes a "mistake" is determined by
   * the orchestrator based on tablebase evaluation.
   *
   * @example
   * ```typescript
   * // User made a mistake
   * store.getState().incrementMistake();
   *
   * // Check total mistakes
   * const mistakes = store.getState().mistakeCount;
   * ```
   */
  incrementMistake: () => {
    set((state) => {
      state.training.mistakeCount = state.training.mistakeCount + 1;
      // Reset streak when a mistake is made
      state.training.currentStreak = 0;
    });
    logger.info("Mistake incremented and streak reset", { 
      mistakeCount: get().training.mistakeCount 
    });
  },

  /**
   * Sets the move error dialog configuration
   *
   * @param {Object|null} dialog - Dialog configuration or null to close
   * @param {boolean} dialog.isOpen - Whether the dialog should be open
   * @param {number} [dialog.wdlBefore] - WDL value before the move
   * @param {number} [dialog.wdlAfter] - WDL value after the move
   * @param {string} [dialog.bestMove] - The best move in the position
   *
   * @fires stateChange - When dialog state changes
   *
   * @remarks
   * This dialog is shown when a user makes a suboptimal move during training.
   * It displays the position evaluation before and after the move, helping
   * users understand why their move was not optimal.
   *
   * @example
   * ```typescript
   * // Show error dialog
   * setMoveErrorDialog({
   *   isOpen: true,
   *   wdlBefore: 1000,
   *   wdlAfter: 0,
   *   bestMove: 'Qb7'
   * });
   *
   * // Close dialog
   * setMoveErrorDialog(null);
   * ```
   */
  setMoveErrorDialog: (
    dialog: {
      isOpen: boolean;
      wdlBefore?: number;
      wdlAfter?: number;
      bestMove?: string;
    } | null,
  ) => {
    set((state) => {
      state.training.moveErrorDialog = dialog;
    });
  },

  /**
   * Sets the move success dialog configuration
   *
   * @param {Object|null} dialog - Dialog configuration or null to close
   * @param {boolean} dialog.isOpen - Whether the dialog should be open
   * @param {string} [dialog.promotionPiece] - The piece promoted to (German label)
   * @param {string} [dialog.moveDescription] - Description of the winning move
   *
   * @fires stateChange - When dialog state changes
   *
   * @remarks
   * This dialog is shown when a user makes a successful move that leads to victory,
   * particularly after pawn promotion. It provides positive feedback and celebration
   * to motivate continued learning.
   *
   * @example
   * ```typescript
   * // Show success dialog
   * setMoveSuccessDialog({
   *   isOpen: true,
   *   promotionPiece: "Dame",
   *   moveDescription: "e8=Q+"
   * });
   *
   * // Close dialog
   * setMoveSuccessDialog(null);
   * ```
   */
  setMoveSuccessDialog: (
    dialog: {
      isOpen: boolean;
      promotionPiece?: string;
      moveDescription?: string;
    } | null,
  ) => {
    set((state) => {
      state.training.moveSuccessDialog = dialog;
    });
  },

  /**
   * Adds a move to the training history
   *
   * @param {any} move - The move to add (ValidatedMove with training metadata)
   *
   * @fires stateChange - When move is added
   *
   * @remarks
   * This action is called by orchestrators to track moves made during
   * training. The move object should include training-specific metadata
   * like whether it was optimal, user-made, etc. The actual implementation
   * of moveHistory is handled by orchestrators.
   *
   * @example
   * ```typescript
   * // Called by orchestrator
   * store.getState().addTrainingMove({
   *   ...validatedMove,
   *   userMove: true,
   *   isOptimal: false,
   *   mistakeReason: "Missed checkmate"
   * });
   * ```
   */
  addTrainingMove: (move: ValidatedMove) => {
    // This is a placeholder - actual implementation will be in orchestrator
    // as it needs to coordinate with game state
    logger.debug("Training move added", { move });
  },

  /**
   * Resets all training state to initial values
   *
   * @fires stateChange - When state is reset
   *
   * @remarks
   * Completely resets the training slice to initial state.
   * Useful when switching between training modes or starting fresh.
   * Note that this doesn't reset the game state - that should be
   * handled by an orchestrator.
   *
   * @example
   * ```typescript
   * // Reset everything
   * store.getState().resetTraining();
   *
   * // Common pattern with other slices
   * store.getState().resetGame();
   * store.getState().resetTraining();
   * store.getState().clearTablebaseState();
   * ```
   */
  resetTraining: () => {
    set((state) => {
      Object.assign(state.training, initialTrainingState);
    });
  },

  /**
   * Resets the current position to its initial state
   *
   * @fires stateChange - When position is reset
   *
   * @remarks
   * This method resets all training-specific state while keeping the current position.
   * It clears move history, evaluations, and resets all counters. The game will
   * need to be reloaded to the initial position FEN by the game slice.
   *
   * @example
   * ```typescript
   * // Reset to start of training
   * store.getState().resetPosition();
   * ```
   */
  resetPosition: () => {
    const currentPos = get().training.currentPosition;
    set((state) => {
      // moveHistory is in game slice, not training slice
      state.game.moveHistory = [];
      state.training.hintsUsed = 0;
      state.training.mistakeCount = 0;
      state.training.isSuccess = false;
      state.training.sessionStartTime = Date.now();
      state.training.sessionEndTime = undefined;
      // Reset turn based on position
      state.training.isPlayerTurn = currentPos
        ? currentPos.sideToMove === currentPos.colorToTrain
        : true;
      // Clear evaluation baseline when resetting position
      state.training.evaluationBaseline = null;
    });
  },

  /**
   * Sets the evaluation baseline for subsequent move quality assessments
   *
   * @param {number} wdl - WDL evaluation to use as baseline
   * @param {string} fen - FEN position when baseline was established
   *
   * @fires stateChange - When baseline is updated
   *
   * @remarks
   * This method is called after "Weiterspielen" when the opponent has moved,
   * establishing a new evaluation baseline for the training session. Subsequent
   * player moves will be evaluated relative to this baseline rather than the
   * original training position expectation.
   *
   * @example
   * ```typescript
   * // After opponent move following "Weiterspielen"
   * const currentFen = chessService.getFen();
   * const evaluation = await tablebaseService.getEvaluation(currentFen);
   * if (evaluation.isAvailable) {
   *   trainingActions.setEvaluationBaseline(evaluation.result.wdl, currentFen);
   * }
   * ```
   */
  setEvaluationBaseline: (wdl: number, fen: string) => {
    set((state) => {
      state.training.evaluationBaseline = {
        wdl,
        fen,
        timestamp: Date.now(),
      };
    });
    logger.info("Evaluation baseline updated", { wdl, fen });
  },

  /**
   * Clears the evaluation baseline, reverting to original position expectations
   *
   * @fires stateChange - When baseline is cleared
   *
   * @remarks
   * This method is called when resetting training sessions or navigating
   * to different positions. It ensures move evaluation returns to normal
   * behavior based on the original training position expectations.
   *
   * @example
   * ```typescript
   * // Clear baseline when starting new training session
   * trainingActions.clearEvaluationBaseline();
   * ```
   */
  clearEvaluationBaseline: () => {
    set((state) => {
      state.training.evaluationBaseline = null;
    });
    logger.info("Evaluation baseline cleared");
  },

  /**
   * Increments the current streak and updates best streak if needed
   *
   * @fires stateChange - When streak is incremented
   *
   * @remarks
   * Called when a training position is completed successfully.
   * Updates both current and best streak counters.
   *
   * @example
   * ```typescript
   * // User completed position successfully
   * store.getState().incrementStreak();
   * ```
   */
  incrementStreak: () => {
    set((state) => {
      state.training.currentStreak = state.training.currentStreak + 1;
      if (state.training.currentStreak > state.training.bestStreak) {
        state.training.bestStreak = state.training.currentStreak;
      }
    });
    logger.info("Streak incremented", { 
      currentStreak: get().training.currentStreak,
      bestStreak: get().training.bestStreak 
    });
  },

  /**
   * Resets the current streak to 0
   *
   * @fires stateChange - When streak is reset
   *
   * @remarks
   * Called when a training position is failed or user makes a mistake.
   * Best streak is preserved.
   *
   * @example
   * ```typescript
   * // User failed position
   * store.getState().resetStreak();
   * ```
   */
  resetStreak: () => {
    set((state) => {
      state.training.currentStreak = 0;
    });
    logger.info("Streak reset");
  },

  /**
   * Shows the checkmark animation
   *
   * @param {number} [duration=2000] - Duration in milliseconds to show checkmark
   *
   * @fires stateChange - When checkmark is shown/hidden
   *
   * @remarks
   * Displays a checkmark animation when a position is completed successfully.
   * Automatically hides after the specified duration.
   *
   * @example
   * ```typescript
   * // Show checkmark for 2 seconds
   * store.getState().showCheckmarkAnimation();
   * 
   * // Show for custom duration
   * store.getState().showCheckmarkAnimation(1500);
   * ```
   */
  showCheckmarkAnimation: (duration: number = 2000) => {
    set((state) => {
      state.training.showCheckmark = true;
    });
    
    // Auto-hide after duration
    setTimeout(() => {
      set((state) => {
        state.training.showCheckmark = false;
      });
    }, duration);
    
    logger.info("Checkmark animation shown", { duration });
  },

  /**
   * Sets auto-progression enabled state
   *
   * @param {boolean} enabled - Whether auto-progression is enabled
   *
   * @fires stateChange - When auto-progression setting changes
   *
   * @remarks
   * Controls whether the training automatically progresses to the next
   * position after successful completion.
   *
   * @example
   * ```typescript
   * // Enable auto-progression
   * store.getState().setAutoProgressEnabled(true);
   * 
   * // Disable auto-progression
   * store.getState().setAutoProgressEnabled(false);
   * ```
   */
  setAutoProgressEnabled: (enabled: boolean) => {
    set((state) => {
      state.training.autoProgressEnabled = enabled;
    });
    logger.info("Auto-progression setting changed", { enabled });
  },
});


/**
 * Selector functions for efficient state access
 *
 * @remarks
 * These selectors provide a consistent API for accessing training state
 * and can be used with Zustand's subscribe mechanism for optimal
 * re-renders. Use these instead of inline selectors when possible.
 *
 * The selectors include both direct state access and computed values
 * for common use cases like session duration and performance metrics.
 *
 * @example
 * ```typescript
 * import { useStore } from '@/store';
 * import { trainingSelectors } from '@/store/slices/trainingSlice';
 *
 * // In a component
 * const position = useStore(trainingSelectors.selectCurrentPosition);
 * const canNavigateNext = useStore(trainingSelectors.selectCanNavigateNext);
 * const accuracy = useStore(trainingSelectors.selectAccuracy);
 * ```
 */
export const trainingSelectors = {
  /**
   * Selects the current training position
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {TrainingPosition|undefined} Current position or undefined
   */
  selectCurrentPosition: (state: TrainingSlice) => state.currentPosition,

  /**
   * Selects the next position
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {TrainingPosition|null|undefined} Next position
   */
  selectNextPosition: (state: TrainingSlice) => state.nextPosition,

  /**
   * Selects the previous position
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {TrainingPosition|null|undefined} Previous position
   */
  selectPreviousPosition: (state: TrainingSlice) => state.previousPosition,

  /**
   * Selects navigation loading state
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {boolean} Whether navigation is loading
   */
  selectIsLoadingNavigation: (state: TrainingSlice) =>
    state.isLoadingNavigation ?? false,

  /**
   * Selects navigation error
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {string|null} Error message or null
   */
  selectNavigationError: (state: TrainingSlice) => state.navigationError,

  /**
   * Selects chapter progress
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {Object|null} Progress data or null
   */
  selectChapterProgress: (state: TrainingSlice) => state.chapterProgress,

  /**
   * Selects whether it's the player's turn
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {boolean} Whether player can make moves
   */
  selectIsPlayerTurn: (state: TrainingSlice) => state.isPlayerTurn,

  /**
   * Selects training success state
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {boolean} Whether training was successful
   */
  selectIsSuccess: (state: TrainingSlice) => state.isSuccess,

  /**
   * Selects session start time
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {number|undefined} Start timestamp or undefined
   */
  selectSessionStartTime: (state: TrainingSlice) => state.sessionStartTime,

  /**
   * Selects session end time
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {number|undefined} End timestamp or undefined
   */
  selectSessionEndTime: (state: TrainingSlice) => state.sessionEndTime,

  /**
   * Selects number of hints used
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {number} Hint count
   */
  selectHintsUsed: (state: TrainingSlice) => state.hintsUsed,

  /**
   * Selects mistake count
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {number} Number of mistakes
   */
  selectMistakeCount: (state: TrainingSlice) => state.mistakeCount,

  /**
   * Selects the move error dialog configuration
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {Object|null} The move error dialog configuration or null
   */
  selectMoveErrorDialog: (state: TrainingSlice) => state.moveErrorDialog,

  /**
   * Selects whether navigation to next position is available
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {boolean} True if can navigate next
   */
  selectCanNavigateNext: (state: TrainingSlice) =>
    state.nextPosition !== undefined && state.nextPosition !== null,

  /**
   * Selects whether navigation to previous position is available
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {boolean} True if can navigate previous
   */
  selectCanNavigatePrevious: (state: TrainingSlice) =>
    state.previousPosition !== undefined && state.previousPosition !== null,

  /**
   * Selects whether training is in progress
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {boolean} True if session started but not ended
   */
  selectIsTrainingActive: (state: TrainingSlice) =>
    state.sessionStartTime !== undefined && state.sessionEndTime === undefined,

  /**
   * Selects session duration in milliseconds
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {number|null} Duration or null if not available
   */
  selectSessionDuration: (state: TrainingSlice) => {
    if (!state.sessionStartTime) return null;
    const endTime = state.sessionEndTime ?? Date.now();
    return endTime - state.sessionStartTime;
  },

  /**
   * Selects performance accuracy (hints as negative impact)
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {number} Accuracy percentage (0-100)
   *
   * @remarks
   * Simple accuracy calculation based on mistakes and hints.
   * A more sophisticated calculation would consider move optimality.
   */
  selectAccuracy: (state: TrainingSlice) => {
    const penalties = state.mistakeCount + state.hintsUsed * 0.5;
    return Math.max(0, 100 - penalties * 10);
  },

  /**
   * Selects current streak count
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {number} Current streak count
   */
  selectCurrentStreak: (state: TrainingSlice) => state.currentStreak,

  /**
   * Selects best streak count
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {number} Best streak count
   */
  selectBestStreak: (state: TrainingSlice) => state.bestStreak,

  /**
   * Selects whether checkmark animation should be shown
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {boolean} Whether to show checkmark
   */
  selectShowCheckmark: (state: TrainingSlice) => state.showCheckmark,

  /**
   * Selects whether auto-progression is enabled
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {boolean} Whether auto-progression is enabled
   */
  selectAutoProgressEnabled: (state: TrainingSlice) => state.autoProgressEnabled,
};
