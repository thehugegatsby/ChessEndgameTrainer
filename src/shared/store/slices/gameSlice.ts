/**
 * @file Game state slice for Zustand store
 * @module store/slices/gameSlice
 * @description Manages chess game state including board position, move history, and game flow.
 * This slice handles the core chess logic and maintains the current game state.
 *
 * @example
 * ```typescript
 * // Using the game slice in a component
 * import { useStore } from '@/store';
 * import { gameSelectors } from '@/store/slices/gameSlice';
 *
 * function ChessBoard() {
 *   const fen = useStore(gameSelectors.selectCurrentFen);
 *   const moveHistory = useStore(gameSelectors.selectMoveHistory);
 *   const makeMove = useStore(state => state.makeMove);
 *
 *   const handleMove = (move) => {
 *     makeMove(move);
 *   };
 * }
 * ```
 */

import { GameSlice, GameState, GameActions } from "./types";
import type { ValidatedMove } from "@shared/types";
import { chessService } from "@shared/services/ChessService";

/**
 * Initial state for the game slice
 * Exported separately to enable proper store reset in tests
 * Note: Chess instance now managed by ChessService, not stored in state
 */
export const initialGameState = {
  // game field removed - Chess instance managed by ChessService
  currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  currentPgn: "",
  moveHistory: [] as ValidatedMove[],
  currentMoveIndex: -1,
  isGameFinished: false,
  gameResult: null as string | null,
  // Game status flags
  isCheckmate: false,
  isDraw: false,
  isStalemate: false,
};

/**
 * Creates the game state (data only, no actions)
 *
 * @returns {GameState} Game state properties only
 *
 * @remarks
 * This function creates only the state properties for game slice.
 * Actions are created separately to avoid Immer middleware stripping functions.
 *
 * @example
 * ```typescript
 * const gameState = createGameState();
 * const gameActions = createGameActions(set, get);
 * ```
 */
export const createGameState = (): GameState => ({ ...initialGameState });

/**
 * Creates the game actions (functions only, no state)
 *
 * @param {Function} set - Zustand's set function for state updates
 * @param {Function} get - Zustand's get function for accessing current state
 * @returns {GameActions} Game action functions
 *
 * @remarks
 * This function creates only the action functions for game slice.
 * Actions are kept separate from state to prevent Immer middleware from stripping them.
 *
 * @example
 * ```typescript
 * const gameActions = createGameActions(set, get);
 * ```
 */
export const createGameActions = (
  set: (fn: (state: { game: GameState }) => void) => void,
  get: () => { game: GameState },
): GameActions => ({
  // Actions

  // State management actions
  // setGame removed - Chess instances created on-demand from FEN
  updatePosition: (fen: string, pgn: string) =>
    set((state) => { 
      state.game.currentFen = fen;
      state.game.currentPgn = pgn;
    }),
  addMove: (move: ValidatedMove) => {
    const { game: gameState } = get();
    const newHistory = gameState.moveHistory.slice(0, gameState.currentMoveIndex + 1);
    newHistory.push(move);
    set((state) => {
      state.game.moveHistory = newHistory;
      state.game.currentMoveIndex = newHistory.length - 1;
    });
  },
  setMoveHistory: (moves: ValidatedMove[]) => set((state) => { state.game.moveHistory = moves; }),
  setCurrentMoveIndex: (index: number) => set((state) => { state.game.currentMoveIndex = index; }),
  setGameFinished: (finished: boolean) => set((state) => { state.game.isGameFinished = finished; }),
  setGameStatus: (isCheckmate: boolean, isDraw: boolean, isStalemate: boolean) => set((state) => {
    state.game.isCheckmate = isCheckmate;
    state.game.isDraw = isDraw;  
    state.game.isStalemate = isStalemate;
  }),

  /**
   * Initializes a new chess game with the given FEN position
   *
   * @param {string} fen - The FEN string representing the starting position
   * @returns {boolean} Whether the game was successfully initialized
   *
   * @fires stateChange - When game is initialized
   *
   * @remarks
   * - Uses ChessService to validate and initialize position
   * - Resets move history and game state
   * - Returns false if FEN is invalid
   *
   * @example
   * ```typescript
   * // Initialize with standard starting position
   * const success = store.getState().initializeGame(
   *   "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
   * );
   *
   * // Initialize with endgame position
   * store.getState().initializeGame("8/8/8/8/8/8/R7/K3k3 w - - 0 1");
   * ```
   */
  initializeGame: (fen: string) => {
    // ChessService will emit 'load' event, triggering automatic sync via rootStore subscription
    return chessService.initialize(fen);
  },

  /**
   * Makes a move on the chess board
   *
   * @param {Object|string} move - Move object with from/to/promotion or algebraic notation
   * @param {string} move.from - Starting square (e.g., "e2")
   * @param {string} move.to - Target square (e.g., "e4")
   * @param {string} [move.promotion] - Promotion piece ("q", "r", "b", "n")
   * @returns {ValidatedMove|null} The validated move object or null if invalid
   *
   * @fires stateChange - When move is successfully made
   *
   * @remarks
   * - Validates moves using chess.js rules
   * - Updates move history and current position
   * - Checks for game ending conditions
   * - Handles pawn promotion
   * - Truncates future moves if moving from middle of history
   *
   * @example
   * ```typescript
   * // Make a move using object notation
   * const move = store.getState().makeMove({ from: "e2", to: "e4" });
   *
   * // Make a move with promotion
   * const promotion = store.getState().makeMove({
   *   from: "e7",
   *   to: "e8",
   *   promotion: "q"
   * });
   *
   * // Make a move using algebraic notation
   * const algMove = store.getState().makeMove("Nf3");
   * ```
   */
  makeMove: (
    move: { from: string; to: string; promotion?: string } | string,
  ) => {
    // ChessService will emit 'move' event, triggering automatic sync via rootStore subscription
    return chessService.move(move);
  },

  /**
   * Undoes the last move
   *
   * @returns {boolean} Whether the undo was successful
   *
   * @fires stateChange - When move is undone
   *
   * @remarks
   * - Can only undo if there are moves in history
   * - Updates the game state to the previous position
   * - Maintains move history for redo functionality
   *
   * @example
   * ```typescript
   * // Undo the last move
   * const success = store.getState().undoMove();
   * if (!success) {
   *   // console.log("No moves to undo");
   * }
   * ```
   */
  undoMove: () => {
    // ChessService will emit 'undo' event, triggering automatic sync via rootStore subscription
    return chessService.undo();
  },

  /**
   * Redoes a previously undone move
   *
   * @returns {boolean} Whether the redo was successful
   *
   * @fires stateChange - When move is redone
   *
   * @remarks
   * - Can only redo if there are future moves in history
   * - Restores the game state to the next position
   * - Preserves the original move timestamps
   *
   * @example
   * ```typescript
   * // Redo a previously undone move
   * const success = store.getState().redoMove();
   * if (!success) {
   *   // console.log("No moves to redo");
   * }
   * ```
   */
  redoMove: () => {
    // ChessService will emit 'redo' event, triggering automatic sync via rootStore subscription
    return chessService.redo();
  },

  /**
   * Navigates to a specific move in the game history
   *
   * @param {number} moveIndex - The index of the move to go to (-1 for start position)
   * @returns {boolean} Whether the navigation was successful
   *
   * @fires stateChange - When position changes
   *
   * @remarks
   * - Allows jumping to any position in the game history
   * - Index -1 represents the starting position
   * - Validates the index is within bounds
   * - Updates all game state to match the target position
   *
   * @example
   * ```typescript
   * // Go to starting position
   * store.getState().goToMove(-1);
   *
   * // Go to move 5
   * store.getState().goToMove(4); // 0-indexed
   *
   * // Go to last move
   * const history = store.getState().moveHistory;
   * store.getState().goToMove(history.length - 1);
   * ```
   */
  goToMove: (moveIndex: number) => {
    // ChessService will emit 'load' event, triggering automatic sync via rootStore subscription
    return chessService.goToMove(moveIndex);
  },

  /**
   * Navigates to the first move (starting position)
   *
   * @fires stateChange - When position changes
   *
   * @remarks
   * This is a convenience method that calls goToMove(-1)
   *
   * @example
   * ```typescript
   * // Go to starting position
   * store.getState().goToFirst();
   * ```
   */
  goToFirst: () => {
    chessService.goToMove(-1);
  },

  /**
   * Navigates to the previous move
   *
   * @fires stateChange - When position changes
   *
   * @remarks
   * If no current move index is set, assumes we're at the last move
   *
   * @example
   * ```typescript
   * // Go to previous move
   * store.getState().goToPrevious();
   * ```
   */
  goToPrevious: () => {
    const { game } = get();
    const currentIndex = game.currentMoveIndex ?? game.moveHistory.length - 1;
    chessService.goToMove(currentIndex - 1);
  },

  /**
   * Navigates to the next move
   *
   * @fires stateChange - When position changes
   *
   * @remarks
   * If no current move index is set, assumes we're at the starting position
   *
   * @example
   * ```typescript
   * // Go to next move
   * store.getState().goToNext();
   * ```
   */
  goToNext: () => {
    const { game } = get();
    const currentIndex = game.currentMoveIndex ?? -1;
    chessService.goToMove(currentIndex + 1);
  },

  /**
   * Navigates to the last move
   *
   * @fires stateChange - When position changes
   *
   * @remarks
   * This is a convenience method that navigates to the last move in history
   *
   * @example
   * ```typescript
   * // Go to last move
   * store.getState().goToLast();
   * ```
   */
  goToLast: () => {
    const { game } = get();
    chessService.goToMove(game.moveHistory.length - 1);
  },

  /**
   * Resets the game to the initial position
   *
   * @fires stateChange - When game is reset
   *
   * @remarks
   * - Clears all move history
   * - Resets to standard chess starting position
   * - Resets all game flags (isGameOver, gameResult)
   *
   * @example
   * ```typescript
   * // Reset the game
   * store.getState().resetGame();
   * ```
   */
  resetGame: () => {
    // ChessService will emit 'reset' event, triggering automatic sync via rootStore subscription
    chessService.reset();
  },

  /**
   * Sets the current FEN position directly
   *
   * @param {string} fen - The FEN string to set
   * @returns {boolean} Whether the FEN was successfully set
   *
   * @fires stateChange - When FEN is updated
   *
   * @remarks
   * - Validates the FEN string before setting
   * - Clears move history when setting a new position
   * - Use initializeGame instead if you want to start a new game
   *
   * @example
   * ```typescript
   * // Set an endgame position
   * const success = store.getState().setCurrentFen(
   *   "8/8/8/8/8/8/R7/K3k3 w - - 0 1"
   * );
   * ```
   */
  setCurrentFen: (fen: string) => {
    return chessService.initialize(fen);
  },

  /**
   * Applies a move directly for test setup purposes (bypasses validation)
   *
   * @param {Object|string} move - Move object with from/to/promotion or algebraic notation
   * @param {string} move.from - Starting square (e.g., "e2")
   * @param {string} move.to - Target square (e.g., "e4")
   * @param {string} [move.promotion] - Promotion piece ("q", "r", "b", "n")
   * @returns {ValidatedMove|null} The applied move object or null if failed
   *
   * @remarks
   * This is a test utility function that bypasses normal move validation.
   * It directly applies moves to the chess state without checking legality.
   * Use only in test environments for setting up specific positions.
   * For normal gameplay, use makeMove() instead.
   *
   * @example
   * ```typescript
   * // In test setup - directly apply a move to reach target position
   * const move = store.getState().applyMove({ from: "e2", to: "e4" });
   *
   * // Apply promotion move in test
   * const promotion = store.getState().applyMove({
   *   from: "e7",
   *   to: "e8",
   *   promotion: "q"
   * });
   *
   * // Apply algebraic notation in test
   * const algMove = store.getState().applyMove("Nf3");
   * ```
   */
  applyMove: (
    move: { from: string; to: string; promotion?: string } | string,
  ) => {
    // Use private helper to update state with common logic
    return _updateGameState("applyMove", () => chessService.move(move));
  },
});

/**
 * Private helper function to update game state with common logic
 * Extracts shared state update pattern between makeMove and applyMove
 * 
 * @param source - Source of the state update for event emission
 * @param moveFunction - Function that executes the actual move
 * @returns The validated move or null if failed
 */
function _updateGameState(source: string, moveFunction: () => ValidatedMove | null) {
  try {
    const result = moveFunction();
    
    // ChessService will emit event automatically, triggering store sync via rootStore
    // This helper just provides common error handling pattern
    return result;
  } catch (error) {
    // Log error but don't re-throw - let calling action handle response
    console.error(`Error in ${source}:`, error);
    return null;
  }
}

// Helper function removed - now using chessService.getGameResult()

/**
 * Selector functions for efficient state access
 *
 * @remarks
 * These selectors provide a consistent API for accessing game state
 * and can be used with Zustand's subscribe mechanism for optimal
 * re-renders. Use these instead of inline selectors when possible.
 *
 * @example
 * ```typescript
 * import { useStore } from '@/store';
 * import { gameSelectors } from '@/store/slices/gameSlice';
 *
 * // In a component
 * const fen = useStore(gameSelectors.selectCurrentFen);
 * const isWhiteTurn = useStore(gameSelectors.selectIsWhiteTurn);
 * const canUndo = useStore(gameSelectors.selectCanUndo);
 * ```
 */
export const gameSelectors = {
  // selectGame removed - Chess instance now managed by ChessService

  /**
   * Selects the current FEN position
   * @param {GameSlice} state - The game slice of the store
   * @returns {string} The current position in FEN notation
   */
  selectCurrentFen: (state: GameSlice) => state.currentFen,

  /**
   * Selects the move history
   * @param {GameSlice} state - The game slice of the store
   * @returns {ValidatedMove[]} Array of validated moves
   */
  selectMoveHistory: (state: GameSlice) => state.moveHistory,

  /**
   * Selects the current move index
   * @param {GameSlice} state - The game slice of the store
   * @returns {number} Current position in move history (-1 for start)
   */
  selectCurrentMoveIndex: (state: GameSlice) => state.currentMoveIndex,

  /**
   * Selects whether the game is over
   * @param {GameSlice} state - The game slice of the store
   * @returns {boolean} Whether the game has ended
   */
  selectIsGameOver: (state: GameSlice) => state.isGameFinished,

  /**
   * Selects the game result
   * @param {GameSlice} state - The game slice of the store
   * @returns {string|null} Game result or null if ongoing
   */
  selectGameResult: (state: GameSlice) => state.gameResult,

  /**
   * Selects whether it's white's turn
   * @param {GameSlice} state - The game slice of the store
   * @returns {boolean} True if white to move, false if black
   */
  selectIsWhiteTurn: (state: GameSlice) => {
    // Derive from FEN string (turn is the second part)
    const parts = state.currentFen.split(' ');
    return parts[1] === 'w';
  },

  /**
   * Selects whether undo is possible
   * @param {GameSlice} state - The game slice of the store
   * @returns {boolean} True if there are moves to undo
   */
  selectCanUndo: (state: GameSlice) => state.currentMoveIndex >= 0,

  /**
   * Selects whether redo is possible
   * @param {GameSlice} state - The game slice of the store
   * @returns {boolean} True if there are moves to redo
   */
  selectCanRedo: (state: GameSlice) =>
    state.currentMoveIndex < state.moveHistory.length - 1,

  /**
   * Selects the last move made
   * @param {GameSlice} state - The game slice of the store
   * @returns {ValidatedMove|null} The last move or null if no moves
   */
  selectLastMove: (state: GameSlice) => {
    const { currentMoveIndex, moveHistory } = state;
    return currentMoveIndex >= 0 ? moveHistory[currentMoveIndex] : null;
  },

  /**
   * Selects legal moves for a square
   * @param {string} square - The square to get moves for (e.g., "e2")
   * @returns {Function} Selector function that returns array of legal moves
   *
   * @example
   * ```typescript
   * const e2Moves = useStore(gameSelectors.selectLegalMoves('e2'));
   * ```
   */
  selectLegalMoves: (square: string) => () => {
    // Use ChessService to get legal moves
    try {
      return chessService.moves({ square, verbose: true });
    } catch {
      return [];
    }
  },
};
