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

import { ImmerStateCreator, GameSlice } from "./types";
import { Chess } from "chess.js";
import type { ChessInstance, ValidatedMove } from "@shared/types";
import { createValidatedMove } from "@shared/types/chess";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("gameSlice");

/**
 * Creates the initial game state with default values
 *
 * @returns {Object} Initial game state
 * @returns {ChessInstance|null} returns.game - Chess.js instance or null
 * @returns {string} returns.currentFen - Current board position in FEN notation
 * @returns {ValidatedMove[]} returns.moveHistory - Array of validated moves
 * @returns {number} returns.currentMoveIndex - Index of current move in history
 * @returns {boolean} returns.isGameOver - Whether the game has ended
 * @returns {string|null} returns.gameResult - Game result ("1-0", "0-1", "1/2-1/2") or null
 *
 * @example
 * ```typescript
 * const initialState = createInitialGameState();
 * console.log(initialState.currentFen); // "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
 * console.log(initialState.moveHistory); // []
 * ```
 */
export const createInitialGameState = () => ({
  game: undefined as ChessInstance | undefined,
  currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  currentPgn: "",
  moveHistory: [] as ValidatedMove[],
  currentMoveIndex: -1,
  isGameFinished: false,
  gameResult: null as string | null,
});

/**
 * Creates the game slice for the Zustand store
 *
 * @param {Function} set - Zustand's set function for state updates
 * @param {Function} get - Zustand's get function for accessing current state
 * @returns {GameSlice} Complete game slice with state and actions
 *
 * @remarks
 * This slice manages the core chess game state and provides actions for
 * game manipulation. It works closely with the training and tablebase slices
 * for complete functionality. The slice uses chess.js for move validation
 * and game rule enforcement.
 *
 * @example
 * ```typescript
 * // In your root store
 * import { create } from 'zustand';
 * import { createGameSlice } from './slices/gameSlice';
 *
 * const useStore = create<RootState>()((...args) => ({
 *   ...createGameSlice(...args),
 *   ...createUISlice(...args),
 *   // ... other slices
 * }));
 * ```
 */
export const createGameSlice: ImmerStateCreator<GameSlice> = (set, get) => ({
  // Initial state
  ...createInitialGameState(),

  // Actions

  // State management actions
  setGame: (game: ChessInstance) => set({ game }),
  updatePosition: (fen: string, pgn: string) =>
    set({ currentFen: fen, currentPgn: pgn }),
  addMove: (move: ValidatedMove) => {
    const { moveHistory, currentMoveIndex } = get();
    const newHistory = moveHistory.slice(0, currentMoveIndex + 1);
    newHistory.push(move);
    set({
      moveHistory: newHistory,
      currentMoveIndex: newHistory.length - 1,
    });
  },
  setMoveHistory: (moves: ValidatedMove[]) => set({ moveHistory: moves }),
  setCurrentMoveIndex: (index: number) => set({ currentMoveIndex: index }),
  setGameFinished: (finished: boolean) => set({ isGameFinished: finished }),

  /**
   * Initializes a new chess game with the given FEN position
   *
   * @param {string} fen - The FEN string representing the starting position
   * @returns {boolean} Whether the game was successfully initialized
   *
   * @fires stateChange - When game is initialized
   *
   * @remarks
   * - Creates a new chess.js instance
   * - Validates the FEN string
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
    try {
      const chess = new Chess(fen);
      set({
        game: chess,
        currentFen: chess.fen(),
        moveHistory: [],
        currentMoveIndex: -1,
        isGameFinished: chess.isGameOver(),
        gameResult: null,
      });
      return chess;
    } catch (error) {
      logger.error("Failed to initialize game with FEN", { fen, error });
      return null;
    }
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
    const { game, currentMoveIndex, moveHistory } = get();
    if (!game) return null;

    try {
      // Create a working copy
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);

      if (!result) return null;

      // Create validated move object
      const validatedMove = createValidatedMove(
        result,
        game.fen(),
        gameCopy.fen(),
      );

      // Truncate history if we're not at the end
      const newHistory = moveHistory.slice(0, currentMoveIndex + 1);
      newHistory.push(validatedMove);

      set({
        game: gameCopy,
        currentFen: gameCopy.fen(),
        moveHistory: newHistory,
        currentMoveIndex: newHistory.length - 1,
        isGameFinished: gameCopy.isGameOver(),
        gameResult: getGameResult(gameCopy),
      });

      return validatedMove;
    } catch (error) {
      logger.error("Invalid move", { move, error });
      return null;
    }
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
   *   console.log("No moves to undo");
   * }
   * ```
   */
  undoMove: () => {
    const { currentMoveIndex, moveHistory } = get();

    if (currentMoveIndex < 0) return false;

    const newIndex = currentMoveIndex - 1;
    const newFen =
      newIndex >= 0 ? moveHistory[newIndex].fenAfter : moveHistory[0].fenBefore;

    try {
      const chess = new Chess(newFen);
      set({
        game: chess,
        currentFen: newFen,
        currentMoveIndex: newIndex,
        isGameFinished: chess.isGameOver(),
        gameResult: getGameResult(chess),
      });
      return true;
    } catch (error) {
      logger.error("Failed to undo move", error);
      return false;
    }
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
   *   console.log("No moves to redo");
   * }
   * ```
   */
  redoMove: () => {
    const { currentMoveIndex, moveHistory } = get();

    if (currentMoveIndex >= moveHistory.length - 1) return false;

    const newIndex = currentMoveIndex + 1;
    const newFen = moveHistory[newIndex].fenAfter;

    try {
      const chess = new Chess(newFen);
      set({
        game: chess,
        currentFen: newFen,
        currentMoveIndex: newIndex,
        isGameFinished: chess.isGameOver(),
        gameResult: getGameResult(chess),
      });
      return true;
    } catch (error) {
      logger.error("Failed to redo move", error);
      return false;
    }
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
    const { moveHistory } = get();

    if (moveIndex < -1 || moveIndex >= moveHistory.length) return false;

    const fen =
      moveIndex === -1
        ? moveHistory[0]?.fenBefore || get().currentFen
        : moveHistory[moveIndex].fenAfter;

    try {
      const chess = new Chess(fen);
      set({
        game: chess,
        currentFen: fen,
        currentMoveIndex: moveIndex,
        isGameFinished: chess.isGameOver(),
        gameResult: getGameResult(chess),
      });
      return true;
    } catch (error) {
      logger.error("Failed to go to move", { moveIndex, error });
      return false;
    }
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
    get().goToMove(-1);
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
    const currentIndex = get().currentMoveIndex ?? get().moveHistory.length - 1;
    get().goToMove(currentIndex - 1);
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
    const currentIndex = get().currentMoveIndex ?? -1;
    get().goToMove(currentIndex + 1);
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
    get().goToMove(get().moveHistory.length - 1);
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
    const startingFen =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    get().initializeGame(startingFen);
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
    return get().initializeGame(fen);
  },
});

/**
 * Helper function to determine game result
 *
 * @param {ChessInstance} chess - The chess instance to check
 * @returns {string|null} Game result or null if game is ongoing
 *
 * @private
 */
function getGameResult(chess: ChessInstance): string | null {
  if (!chess.isGameOver()) return null;

  if (chess.isCheckmate()) {
    return chess.turn() === "w" ? "0-1" : "1-0";
  }

  return "1/2-1/2"; // Draw (stalemate, insufficient material, etc.)
}

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
  /**
   * Selects the chess game instance
   * @param {GameSlice} state - The game slice of the store
   * @returns {ChessInstance|null} The chess.js instance or null
   */
  selectGame: (state: GameSlice) => state.game,

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
  selectIsWhiteTurn: (state: GameSlice) => state.game?.turn() === "w",

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
  selectLegalMoves: (square: string) => (state: GameSlice) => {
    if (!state.game) return [];

    try {
      return state.game.moves({ square: square as any, verbose: true });
    } catch {
      return [];
    }
  },
};
