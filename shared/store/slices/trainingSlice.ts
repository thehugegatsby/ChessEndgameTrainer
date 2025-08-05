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
 *   const useHint = useStore(state => state.useHint);
 *
 *   const handleHintRequest = () => {
 *     if (hintsUsed < 3) useHint();
 *   };
 * }
 * ```
 */

import { ImmerStateCreator, TrainingSlice } from "./types";
import type { EndgamePosition as BaseEndgamePosition } from "@shared/types/endgame";
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
 * Creates the initial training state with default values
 *
 * @returns {Object} Initial training state
 * @returns {TrainingPosition|undefined} returns.currentPosition - Active training position
 * @returns {TrainingPosition|null|undefined} returns.nextPosition - Next position in sequence
 * @returns {TrainingPosition|null|undefined} returns.previousPosition - Previous position
 * @returns {boolean} returns.isLoadingNavigation - Navigation loading state
 * @returns {string|null} returns.navigationError - Navigation error message
 * @returns {Object|null} returns.chapterProgress - Progress within chapter
 * @returns {boolean} returns.isPlayerTurn - Whether it's the player's turn
 * @returns {boolean} returns.isSuccess - Training completed successfully
 * @returns {number|undefined} returns.sessionStartTime - Session start timestamp
 * @returns {number|undefined} returns.sessionEndTime - Session end timestamp
 * @returns {number} returns.hintsUsed - Number of hints used
 * @returns {number} returns.mistakeCount - Number of mistakes made
 * @returns {Object|null} returns.moveErrorDialog - Error dialog state
 *
 * @example
 * ```typescript
 * const initialState = createInitialTrainingState();
 * console.log(initialState.isPlayerTurn); // true
 * console.log(initialState.hintsUsed); // 0
 * console.log(initialState.currentPosition); // undefined
 * ```
 */
export const createInitialTrainingState = () => ({
  currentPosition: undefined as TrainingPosition | undefined,
  nextPosition: undefined as TrainingPosition | null | undefined,
  previousPosition: undefined as TrainingPosition | null | undefined,
  isLoadingNavigation: false,
  navigationError: null as string | null,
  chapterProgress: null as { completed: number; total: number } | null,
  isPlayerTurn: true,
  isSuccess: false,
  sessionStartTime: undefined as number | undefined,
  sessionEndTime: undefined as number | undefined,
  hintsUsed: 0,
  mistakeCount: 0,
  moveErrorDialog: null as {
    isOpen: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    bestMove?: string;
  } | null,
});

/**
 * Creates the training slice for the Zustand store
 *
 * @param {Function} set - Zustand's set function for state updates
 * @param {Function} get - Zustand's get function for accessing current state
 * @returns {TrainingSlice} Complete training slice with state and actions
 *
 * @remarks
 * This slice manages training-specific state and provides actions for
 * training flow control. It works closely with the game and tablebase slices
 * through orchestrators for complete training functionality. The slice focuses
 * on training session management while orchestrators handle game coordination.
 *
 * Key concepts:
 * - currentPosition: The active training position with metadata
 * - isPlayerTurn: Controls when user can make moves
 * - hintsUsed/mistakeCount: Track performance metrics
 * - moveErrorDialog: UI state for showing move feedback
 *
 * @example
 * ```typescript
 * // In your root store
 * import { create } from 'zustand';
 * import { createTrainingSlice } from './slices/trainingSlice';
 *
 * const useStore = create<RootState>()((...args) => ({
 *   ...createTrainingSlice(...args),
 *   ...createGameSlice(...args),
 *   // ... other slices
 * }));
 * ```
 */
const logger = getLogger().setContext("TrainingSlice");

export const createTrainingSlice: ImmerStateCreator<TrainingSlice> = (set, get) => ({
  // Initial state
  ...createInitialTrainingState(),

  // Actions
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
    set({
      currentPosition: position,
      isSuccess: false,
      sessionStartTime: Date.now(),
      sessionEndTime: undefined,
      hintsUsed: 0,
      mistakeCount: 0,
      moveErrorDialog: null,
      // Set initial turn based on position
      isPlayerTurn: position.sideToMove === position.colorToTrain,
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
    set({
      ...(next !== undefined && { nextPosition: next }),
      ...(previous !== undefined && { previousPosition: previous }),
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
    set({ isLoadingNavigation: loading });
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
    set({ navigationError: error });
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
    set({ chapterProgress: progress });
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
    set({ isPlayerTurn });
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
    set({
      isSuccess: success,
      sessionEndTime: Date.now(),
    });
  },

  /**
   * Records the use of a hint
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
   * store.getState().useHint();
   *
   * // Check hint usage
   * const hintsUsed = store.getState().hintsUsed;
   * if (hintsUsed >= 3) {
   *   // Maybe disable hint button
   * }
   * ```
   */
  useHint: () => {
    set((state) => ({
      hintsUsed: state.hintsUsed + 1,
    }));
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
    set((state) => ({
      mistakeCount: state.mistakeCount + 1,
    }));
  },

  /**
   * Sets the move error dialog state
   *
   * @param {Object|null} dialog - Dialog configuration or null to close
   * @param {boolean} dialog.isOpen - Whether dialog is open
   * @param {number} [dialog.wdlBefore] - WDL evaluation before move
   * @param {number} [dialog.wdlAfter] - WDL evaluation after move
   * @param {string} [dialog.bestMove] - Best move that should have been played
   *
   * @fires stateChange - When dialog state changes
   *
   * @remarks
   * Controls the display of move feedback dialogs that show
   * when a user makes a mistake. The dialog can display the
   * evaluation change and suggest the best move.
   *
   * @example
   * ```typescript
   * // Show error dialog
   * store.getState().setMoveErrorDialog({
   *   isOpen: true,
   *   wdlBefore: 1000,  // Winning
   *   wdlAfter: 0,      // Now draw
   *   bestMove: "Ra8#"
   * });
   *
   * // Close dialog
   * store.getState().setMoveErrorDialog(null);
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
    set({ moveErrorDialog: dialog });
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
  addTrainingMove: (move: any) => {
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
    set(createInitialTrainingState());
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
    const currentPos = get().currentPosition;
    set({
      moveHistory: [],
      hintsUsed: 0,
      mistakeCount: 0,
      isSuccess: false,
      sessionStartTime: Date.now(),
      sessionEndTime: undefined,
      moveErrorDialog: null,
      // Reset turn based on position
      isPlayerTurn: currentPos
        ? currentPos.sideToMove === currentPos.colorToTrain
        : true,
    });
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
   * Selects move error dialog state
   * @param {TrainingSlice} state - The training slice of the store
   * @returns {Object|null} Dialog state or null
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
};
