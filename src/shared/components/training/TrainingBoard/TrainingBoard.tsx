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

'use client';

// Module loading confirmed - debug logging removed for production

import React, { useEffect, useCallback, useState } from 'react';
import { type Move } from 'chess.js';
import { Chessboard } from '@shared/components/chess/Chessboard';
import { usePositionAnalysis, useTrainingSession } from '../../../hooks';
import { usePageReady } from '../../../hooks/usePageReady';
import { useGameStore, useTrainingStore, useTablebaseStore, useUIStore } from '@shared/store/hooks';
import { useStoreApi } from '@shared/store/StoreContext';
import { type EndgamePosition } from '@shared/types';
import { getLogger } from '@shared/services/logging/Logger';
import { DIMENSIONS } from '@shared/constants';
import { AlertDisplay } from '@shared/components/ui/AlertDisplay';
import { DialogManager } from '../DialogManager';
import { E2ETestHelper } from '../../testing/E2ETestHelper';
import { useMoveHandlers } from '@shared/hooks/useMoveHandlers';
import { useDialogHandlers } from '@shared/hooks/useDialogHandlers';
import { useMoveValidation } from '@shared/hooks/useMoveValidation';
import { useGameNavigation } from '@shared/hooks/useGameNavigation';

type PieceType = 'wP' | 'wN' | 'wB' | 'wR' | 'wQ' | 'wK' | 'bP' | 'bN' | 'bB' | 'bR' | 'bQ' | 'bK';

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
  /** Optional Next.js router for client-side navigation */
  router?: {
    push: (url: string) => void;
  };
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
  router,
}) => {
  const initialFen = fen || position?.fen || '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';

  // === ZUSTAND STORE - Using domain-specific hooks for performance ===
  const [, gameActions] = useGameStore(); // Pure chess state
  const [trainingState, trainingActions] = useTrainingStore(); // Training session state
  const [tablebaseState, tablebaseActions] = useTablebaseStore(); // Analysis and evaluation data
  const [, uiActions] = useUIStore(); // UI state (toasts, modals, loading)
  const storeApi = useStoreApi(); // Store API for orchestrator functions

  // Set position in store on mount or when position changes
  useEffect(() => {
    const logger = getLogger().setContext('TrainingBoard-PositionInit');

    if (
      position &&
      (!trainingState.currentPosition || trainingState.currentPosition.id !== position.id)
    ) {
      logger.info('Setting position in store', {
        positionId: position.id,
        title: position.title,
        fen: position.fen,
        currentPositionId: trainingState.currentPosition?.id,
      });
      trainingActions.loadTrainingContext(position);
    }
  }, [position, trainingActions, trainingState]);

  // CRITICAL: Prevent any interactions if position is not loaded
  const isPositionReady = Boolean(trainingState.currentPosition);

  // === HOOKS ===

  // Chess game logic - now using Store as single source of truth
  const { history, isGameFinished, currentFen, makeMove, jumpToMove, resetGame, undoMove } =
    useTrainingSession({
      /**
       *
       * @param success
       */
      onComplete: success => {
        // Call parent callback
        onComplete(success);
      },
      ...(onPositionChange && { onPositionChange }),
    });

  // Move handling logic - extracted to custom hook
  const { onDrop, onSquareClick, onPromotionCheck } = useMoveHandlers({
    currentFen: currentFen || initialFen,
    isGameFinished,
    isPositionReady,
    trainingState,
    onMove: makeMove,
  });

  // === E2E DEBUG: Handler-Debugging Wrapper ===
  const onPieceDropWrapped = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string, promotion?: string): boolean => {
      const el = document.querySelector('[data-testid="training-board"]');
      if (el) {
        el.setAttribute('data-last-drop-from', sourceSquare);
        el.setAttribute('data-last-drop-to', targetSquare);
        el.setAttribute('data-on-piece-drop-fired', 'true');
        el.setAttribute(
          'data-drop-count',
          String(1 + Number(el.getAttribute('data-drop-count') || '0'))
        );
      }
      (window as unknown as Record<string, unknown>)['__dbg_lastDrop'] = {
        from: sourceSquare,
        to: targetSquare,
        piece,
        promotion,
        ts: Date.now(),
      };
      console.info('🎯 E2E DEBUG: onPieceDrop called', {
        from: sourceSquare,
        to: targetSquare,
        piece,
        promotion,
        timestamp: Date.now(),
      });
      return onDrop?.(sourceSquare, targetSquare, piece, promotion) ?? false;
    },
    [onDrop]
  );

  const onSquareClickWrapped = useCallback(
    (args: { piece: PieceType | null; square: string }) => {
      const { square } = args;
      const el = document.querySelector('[data-testid="training-board"]');
      if (el) {
        el.setAttribute('data-on-square-click-fired', 'true');
        el.setAttribute('data-last-click-square', square);
        el.setAttribute(
          'data-click-count',
          String(1 + Number(el.getAttribute('data-click-count') || '0'))
        );
      }
      (window as unknown as Record<string, unknown>)['__dbg_lastClick'] = {
        square,
        args,
        ts: Date.now(),
      };
      console.info('🎯 E2E DEBUG: onSquareClick called', { square, args, timestamp: Date.now() });
      onSquareClick?.(args);
    },
    [onSquareClick]
  );

  // Game navigation logic - extracted to custom hook
  const gameNavigation = useGameNavigation({
    history,
    initialFen,
    currentFen,
    ...(onHistoryChange && { onHistoryChange }),
    ...(onJumpToMove && { onJumpToMove }),
    jumpToMove,
  });

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
    ...(gameNavigation.previousFen !== undefined && { previousFen: gameNavigation.previousFen }),
  });

  // UI state management - local component state only
  const [resetKey, setResetKey] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const trainingUIState = {
    resetKey,
    warning,
    analysisError: null, // Analysis errors now handled by store
    moveError,
    /**
     *
     */
    handleReset: () => setResetKey(prev => prev + 1),
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

  // Dialog handling logic - extracted to custom hook
  const dialogHandlers = useDialogHandlers({
    undoMove,
    resetGame,
    clearEvaluations,
    trainingActions,
    gameActions,
    uiActions,
    trainingState,
    storeApi,
    trainingUIState,
    ...(router && { router }),
  });

  // Move validation logic - extracted to custom hook
  useMoveValidation({
    lastEvaluation,
    currentFen,
    evaluations,
    isEvaluating,
    tablebaseState,
    tablebaseActions,
  });

  // Note: Evaluation processing now handled by useMoveValidation hook

  // Dialog state is now passed directly to DialogManager
  // No local state variables needed - DialogManager reads from trainingState directly

  // All dialog handler functions now handled by useDialogHandlers hook
  // See: /shared/hooks/useDialogHandlers.ts for implementation

  // Note: Analysis status updates now handled by useMoveValidation hook

  // === REMOVED E2E WINDOW ATTACHMENTS ===
  // E2E tests now use Page Object Model via DOM interaction
  // See: tests/e2e/helpers/pageObjects/TrainingBoardPage.ts

  // === EVENT HANDLERS ===
  // Move handling logic extracted to useMoveHandlers hook

  // Handle reset trigger from parent
  useEffect(() => {
    if (resetTrigger > 0) {
      dialogHandlers.handleReset();
    }
  }, [resetTrigger, dialogHandlers]);

  // === EFFECTS ===

  // Note: Move history and navigation callbacks now handled by useGameNavigation hook

  // Update parent with evaluations
  useEffect(() => {
    if (onEvaluationsChange) {
      onEvaluationsChange(evaluations);
    }
  }, [evaluations, onEvaluationsChange]);

  // === E2E TEST SUPPORT ===
  // E2E testing logic extracted to separate E2ETestHelper component

  // === PAGE READY DETECTION ===
  const isAnalysisReady =
    tablebaseState.analysisStatus === 'success' || tablebaseState.analysisStatus === 'idle';
  const isBoardReady = Boolean(currentFen);
  const isPageReady = usePageReady([isAnalysisReady, isBoardReady]);

  // === RENDER ===
  // Note: customSquareRenderer was removed as it's not supported in react-chessboard v2.1.3
  // E2E tests should use the board's data-testid="training-board" and other available selectors

  const showE2ESignals = process.env['NEXT_PUBLIC_E2E_SIGNALS'] === 'true';

  return (
    <div
      className="flex flex-col items-center"
      {...(showE2ESignals && { 'data-page-ready': isPageReady })}
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
        data-move-count={history.length}
        data-testid="training-board"
        data-analysis-status={tablebaseState.analysisStatus}
      >
        <Chessboard
          fen={currentFen}
          onPieceDrop={onPieceDropWrapped}
          onSquareClick={onSquareClickWrapped}
          onPromotionCheck={onPromotionCheck}
          arePiecesDraggable={!isGameFinished}
          boardWidth={800}
          animationDuration={150}
          {...(process.env.NODE_ENV === 'development' && {
            'data-handlers-bound': 'true',
            'data-on-piece-drop-bound': Boolean(onPieceDropWrapped).toString(),
            'data-on-square-click-bound': Boolean(onSquareClickWrapped).toString(),
          })}
        />
      </div>

      {/* Error and Warning Displays - using AlertDisplay component */}
      {trainingUIState.warning && (
        <AlertDisplay
          type="warning"
          message={trainingUIState.warning}
          onDismiss={trainingUIState.handleClearWarning}
        />
      )}

      {(trainingUIState.analysisError || evaluationError) && (
        <AlertDisplay
          type="error"
          message={trainingUIState.analysisError || evaluationError || 'Unknown error'}
          onDismiss={trainingUIState.handleClearAnalysisError}
        />
      )}

      {/* Dialog Manager - Handles all training dialogs */}
      <DialogManager
        errorDialog={trainingState.moveErrorDialog}
        successDialog={trainingState.moveSuccessDialog}
        onErrorTakeBack={dialogHandlers.handleMoveErrorTakeBack}
        onErrorRestart={dialogHandlers.handleMoveErrorRestart}
        onErrorContinue={dialogHandlers.handleMoveErrorContinue}
        onErrorShowBestMove={dialogHandlers.handleShowBestMove}
        onSuccessClose={dialogHandlers.handleMoveSuccessClose}
        onSuccessContinue={dialogHandlers.handleMoveSuccessContinue}
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
