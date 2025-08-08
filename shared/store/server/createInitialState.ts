/**
 * @file Server-side state initialization for SSR
 * @module store/server/createInitialState
 *
 * @description
 * Creates pre-populated initial state for Zustand store on the server.
 * This eliminates hydration mismatches by ensuring server and client
 * start with identical state.
 *
 * @remarks
 * This function is safe for server-side execution as it does not rely on
 * stateful singletons or browser-specific APIs. Each request gets its own
 * isolated chess instance and state object.
 */

import { Chess } from "chess.js";
import { getServerPositionService } from "@shared/services/database/serverPositionService";
import type { EndgamePosition } from "@shared/types/endgame";
import type { TrainingPosition } from "@shared/store/slices/trainingSlice";
import type {
  RootState,
  GameState,
  TrainingState,
  TablebaseState,
} from "@shared/store/slices/types";
import type { UIState } from "@shared/store/slices/types";
import type { ValidatedMove } from "@shared/types";

/**
 * Creates the initial store state for a given position on the server.
 *
 * @param {EndgamePosition} position - The endgame position to initialize state with
 * @returns {Promise<Partial<RootState>>} Partial state object for hydrating client store
 *
 * @throws {Error} When FEN is invalid or position data is malformed
 *
 * @example
 * ```typescript
 * // In a server component
 * const position = await positionService.getPosition(id);
 * const initialState = await createInitialStateForPosition(position);
 *
 * return (
 *   <StoreProvider initialState={initialState}>
 *     <EndgameTrainingPage />
 *   </StoreProvider>
 * );
 * ```
 */
/**
 * State-only interface for server-side hydration (without actions)
 */
interface ServerHydrationState {
  game?: Partial<GameState>;
  training?: Partial<TrainingState>;
  tablebase?: Partial<TablebaseState>;
  ui?: Partial<UIState>;
}

export async function createInitialStateForPosition(
  position: EndgamePosition,
): Promise<ServerHydrationState> {
  // 1. Create a fresh, request-scoped chess instance to avoid singleton issues
  const chess = new Chess();
  try {
    chess.load(position.fen);
  } catch (error) {
    throw new Error(
      `Invalid FEN provided for position ${position.id}: ${position.fen}`,
    );
  }

  // 2. Create the TrainingPosition object with proper defaults
  const trainingPosition: TrainingPosition = {
    ...position,
    colorToTrain:
      (position as any).colorToTrain || position.sideToMove || "white",
    targetOutcome:
      (position as any).targetOutcome ||
      (position.goal === "win"
        ? position.sideToMove === "white"
          ? "1-0"
          : "0-1"
        : position.goal === "draw"
          ? "1/2-1/2"
          : "1-0"), // Default to win for white
    timeLimit: (position as any).timeLimit || undefined,
    chapterId: (position as any).chapterId || undefined,
  };

  // 3. Determine player's turn
  const currentTurn = chess.turn();
  const isPlayerTurn = currentTurn === trainingPosition.colorToTrain.charAt(0);

  // 4. Fetch navigation positions concurrently (non-blocking)
  const positionService = getServerPositionService();
  let nextPosition: EndgamePosition | null = null;
  let previousPosition: EndgamePosition | null = null;
  let isLoadingNavigation = false;

  try {
    const [nextPos, prevPos] = await Promise.all([
      positionService.getNextPosition(position.id, position.category),
      positionService.getPreviousPosition(position.id, position.category),
    ]);

    nextPosition = nextPos;
    previousPosition = prevPos;
  } catch (error) {
    // Navigation loading is non-critical, continue without it
    console.warn("Failed to load navigation positions on server:", error);
  }

  // Convert navigation positions to TrainingPositions
  const nextTrainingPos = nextPosition
    ? ({
        ...nextPosition,
        colorToTrain:
          (nextPosition as any).colorToTrain ||
          nextPosition.sideToMove ||
          "white",
        targetOutcome:
          (nextPosition as any).targetOutcome ||
          (nextPosition.goal === "win"
            ? nextPosition.sideToMove === "white"
              ? "1-0"
              : "0-1"
            : "1/2-1/2"),
        timeLimit: (nextPosition as any).timeLimit || undefined,
        chapterId: (nextPosition as any).chapterId || undefined,
      } as TrainingPosition)
    : null;

  const prevTrainingPos = previousPosition
    ? ({
        ...previousPosition,
        colorToTrain:
          (previousPosition as any).colorToTrain ||
          previousPosition.sideToMove ||
          "white",
        targetOutcome:
          (previousPosition as any).targetOutcome ||
          (previousPosition.goal === "win"
            ? previousPosition.sideToMove === "white"
              ? "1-0"
              : "0-1"
            : "1/2-1/2"),
        timeLimit: (previousPosition as any).timeLimit || undefined,
        chapterId: (previousPosition as any).chapterId || undefined,
      } as TrainingPosition)
    : null;

  // 5. Generate move history from chess.js - simplified for server-side
  const moveHistory: ValidatedMove[] = [];

  // 6. Construct and return the state object for hydration (only state properties, not actions)
  return {
    // Game state - initialize with position data
    game: {
      currentFen: position.fen,
      currentPgn: "", // Will be generated by ChessService
      moveHistory: moveHistory,
      currentMoveIndex: moveHistory.length,
      isGameFinished: false,
      gameResult: null,
    },

    // Training state - pre-populated with position and navigation
    training: {
      currentPosition: trainingPosition,
      nextPosition: nextTrainingPos,
      previousPosition: prevTrainingPos,
      isLoadingNavigation,
      navigationError: null,
      chapterProgress: null,
      isPlayerTurn,
      isOpponentThinking: false,
      isSuccess: false,
      sessionStartTime: undefined,
      sessionEndTime: undefined,
      hintsUsed: 0,
      mistakeCount: 0,
      moveErrorDialog: null,
      moveSuccessDialog: null,
    },

    // Tablebase state - clean initial state
    tablebase: {
      tablebaseMove: null,
      analysisStatus: "idle" as const,
      evaluations: [],
      currentEvaluation: undefined,
    },

    // UI state - position is pre-loaded
    ui: {
      isSidebarOpen: false,
      currentModal: null,
      toasts: [],
      loading: {
        global: false,
        position: false, // Position is pre-loaded on server
        tablebase: false,
        analysis: false,
      },
      analysisPanel: {
        isOpen: false,
        activeTab: "moves" as const,
        showTablebase: true,
      },
    },
  };
}
