'use client';

import { getLogger } from '../services/logging';
import { UI_DURATIONS_MS } from '../../constants/time.constants';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingBoard, MovePanelZustand, NavigationControls } from '../components/training';
import { TablebaseAnalysisPanel } from '../components/training/TablebaseAnalysisPanel';
import { AdvancedEndgameMenu } from '../components/navigation/AdvancedEndgameMenu';
// EndgamePosition import no longer needed - position comes from store
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';
import { StreakCounter } from '../components/ui/StreakCounter';
import { CheckmarkAnimation } from '../components/ui/CheckmarkAnimation';
import { trainingEvents } from '@domains/training/events/EventEmitter';
import { useStore } from '@shared/store/rootStore';
import type { WritableDraft } from 'immer';
import type { RootState } from '@shared/store/slices/types';
import { getGameStatus } from '../utils/chess/gameStatus';
import { useGameStore, useTrainingStore, useUIStore } from '../store/hooks';
// useInitializePosition no longer needed - SSR hydration handles initialization
import { getTrainingDisplayTitle, formatPositionTitle } from '../utils/titleFormatter';
import { ANIMATION } from '../constants';

// No props needed anymore - all data comes from hydrated store

/**
 * Endgame training page component using Zustand store
 * Provides the main training interface for endgame positions
 * All position data comes from the pre-hydrated store state
 */
export const EndgameTrainingPage: React.FC = () => {
  console.log('🚨🚨🚨 COMPONENT START - SHOULD ALWAYS APPEAR! 🚨🚨🚨', Date.now());
  console.log('🔥🔥🔥 NEW DEBUG MESSAGE - TESTING COMPILATION! 🔥🔥🔥', Date.now());
  
  // Test if getLogger works instead of console.log
  const logger = getLogger().setContext('EndgameTrainingPage-START');
  logger.info('🎯 LOGGER TEST: Component execution started!', { timestamp: Date.now() });
  
  // Next.js router
  const router = useRouter();

  // Zustand store hooks - consolidated
  const [gameState, gameActions] = useGameStore();
  const [trainingState, trainingActions] = useTrainingStore();
  const [uiState, uiActions] = useUIStore();

  // Toast hook - keep for showSuccess/showError, but we'll use store toasts for display
  const { showSuccess, showError } = useToast();

  // Local UI state
  const [resetKey, setResetKey] = useState<number>(0);

  // The position now comes directly from the hydrated store
  const position = trainingState.currentPosition;

  // Debug: Log component state
  getLogger().debug('🏠 EndgameTrainingPage rendered', {
    hasPosition: Boolean(position),
    positionId: position?.id,
    positionFen: position?.fen,
    currentFen: gameState.currentFen,
    timestamp: new Date().toISOString(),
  });

  console.log('🚨 BEFORE useEffect - This should ALWAYS appear!', Date.now());

  // Training Event Listener - handle move feedback events directly
  React.useEffect(() => {
    console.log('🚨 CRITICAL DEBUG: useEffect is running!', Date.now());
    console.log('🚨 CRITICAL DEBUG: typeof window:', typeof window);
    console.log('🚨 CRITICAL DEBUG: isClient check:', typeof window !== 'undefined');
    
    // Explicit client-side check to avoid SSR issues
    if (typeof window === 'undefined') {
      console.log('🚨 CRITICAL DEBUG: SSR detected - useEffect running on server, skipping');
      return;
    }
    
    console.log('🎯 [EndgameTrainingPage] Setting up training event listeners (CLIENT SIDE)');
    
    const unsubscribeFeedback = trainingEvents.on('move:feedback', data => {
      console.log('🎯 [EndgameTrainingPage] Received move:feedback event:', data);
      if (data.type === 'error') {
        console.log('🎯 [EndgameTrainingPage] Processing error event - updating dialog state');
        // Show error dialog
        useStore.setState((draft: WritableDraft<RootState>) => {
          draft.training.moveErrorDialog = {
            isOpen: true,
            ...(data.wdlBefore !== undefined && { wdlBefore: data.wdlBefore }),
            ...(data.wdlAfter !== undefined && { wdlAfter: data.wdlAfter }),
            ...(data.bestMove !== undefined && { bestMove: data.bestMove }),
          };
        });
        console.log('🎯 [EndgameTrainingPage] Error dialog state updated - should be visible now');
      }
    });

    return () => {
      console.log('🎯 [EndgameTrainingPage] Cleaning up training event listeners');
      unsubscribeFeedback();
    };
  }, []); // Empty dependency array - only run once

  // Extract actions to avoid dependency issues
  const { completeTraining } = trainingActions;

  // Game status - ALL HOOKS MUST BE BEFORE CONDITIONAL RETURNS (React Hook Rules)
  const gameStatus = useMemo(
    () => (position ? getGameStatus(gameState.currentFen || position.fen, position.goal) : null),
    [gameState.currentFen, position]
  );

  // Navigation data from store
  const prevPosition = trainingState.previousPosition;
  const nextPosition = trainingState.nextPosition;
  const isLoadingNavigation = trainingState.isLoadingNavigation;

  // DEBUG: Log beim Rendern
  getLogger().info(`[REACT RENDER] nextPosition ID: ${nextPosition?.id}, prevPosition ID: ${prevPosition?.id}, isLoading: ${isLoadingNavigation}, Timestamp: ${new Date().toISOString()}`);

  const handleComplete = useCallback(
    (isSuccess: boolean) => {
      if (isSuccess) {
        // Update streak
        trainingActions.incrementStreak();

        // Show checkmark animation
        trainingActions.showCheckmarkAnimation(UI_DURATIONS_MS.ENDGAME_FEEDBACK_SHORT);

        // Show success toast
        showSuccess('Geschafft! Position erfolgreich gelöst!', ANIMATION.SUCCESS_TOAST_DURATION);

        // Auto-progress to next position if enabled
        if (trainingState.autoProgressEnabled && nextPosition) {
          getLogger().info('🚀 Auto-progressing to next position', {
            nextPositionId: nextPosition.id,
            delayMs: UI_DURATIONS_MS.ENDGAME_FEEDBACK_LONG,
          });
          setTimeout(() => {
            router.push(`/train/${nextPosition.id}`);
          }, UI_DURATIONS_MS.ENDGAME_FEEDBACK_LONG); // Wait for checkmark animation + 500ms buffer
        }
      } else {
        getLogger().info('❌ Failure - resetting streak');
        // Reset streak on failure
        trainingActions.resetStreak();
        showError('Versuch es erneut', ANIMATION.ERROR_TOAST_DURATION);
      }
      completeTraining(isSuccess);
    },
    [
      completeTraining,
      showSuccess,
      showError,
      trainingActions,
      trainingState.autoProgressEnabled,
      nextPosition,
      router,
    ]
  );

  const handleResetPosition = useCallback(() => {
    gameActions.resetGame();
    setResetKey(prev => prev + 1);
  }, [gameActions]);

  const handleMoveClick = useCallback(
    (moveIndex: number) => {
      // Navigate to the clicked move
      gameActions.goToMove(moveIndex);
    },
    [gameActions]
  );

  const handleToggleAnalysis = useCallback(() => {
    uiActions.updateAnalysisPanel({ isOpen: !uiState.analysisPanel.isOpen });
  }, [uiActions, uiState]);

  const getLichessUrl = useCallback(() => {
    const currentFen = gameState.currentFen || (position?.fen ?? '');

    // Use PGN if we have moves in the history
    // PGN includes the starting FEN and all moves, providing full context
    if (gameState.currentPgn && gameState.moveHistory.length > 0) {
      // Lichess accepts PGN in the URL for complete game analysis
      return `https://lichess.org/analysis/pgn/${encodeURIComponent(gameState.currentPgn)}`;
    }

    // Fallback to FEN-only URL for positions without move history
    return `https://lichess.org/analysis/${currentFen.replace(/ /g, '_')}`;
  }, [gameState.currentPgn, gameState.moveHistory.length, gameState.currentFen, position?.fen]);

  // Early return if position is not available (shouldn't happen with SSR hydration)
  if (!position) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Position wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="trainer-container h-screen flex bg-slate-800 text-white">
      <ToastContainer toasts={uiState.toasts} onRemoveToast={id => uiActions.removeToast(id)} />

      {/* Checkmark Animation Overlay */}
      <CheckmarkAnimation isVisible={trainingState.showCheckmark} />

      {/* Left Menu */}
      <AdvancedEndgameMenu isOpen={true} onClose={() => {}} currentPositionId={position.id} />

      {/* Main Content - Chess Board Area - truly centered */}
      <div
        className="chessboard-wrapper flex-1 h-full relative mr-72"
        style={{ marginLeft: '-20px' }}
      >
        {/* Chessboard Area */}
        <div className="w-full h-full relative">
          {/* Progress Header centered above board - always show for E2E test visibility */}
          <div
            className="absolute top-24 left-0 right-0 text-center pointer-events-none"
            data-testid="position-title"
            style={{ zIndex: 5 }}
          >
            <h2 className="text-3xl font-bold">
              {getTrainingDisplayTitle(position, gameState.moveHistory?.length || 0)}
            </h2>
          </div>

          <div className="w-full h-full flex items-center justify-center">
            <TrainingBoard
              key={`${position.id}-${resetKey}`}
              position={position}
              onComplete={handleComplete}
              router={router}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Fixed positioned */}
      <div className="sidebar fixed right-0 top-0 bottom-0 w-72 bg-gray-900 border-l border-gray-700 flex flex-col z-20 overflow-y-auto">
        {/* Navigation between positions */}
        <div className="nav-section p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2 text-center">
            Stellungsnavigation
          </h3>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => prevPosition && router.push(`/train/${prevPosition.id}`)}
              disabled={!prevPosition || isLoadingNavigation}
              className="p-2 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
              title="Vorherige Stellung"
            >
              <span className="text-lg">{isLoadingNavigation ? '⏳' : '←'} Vorherige Stellung</span>
            </button>
            <button
              onClick={handleResetPosition}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              title="Position zurücksetzen"
            >
              <span className="text-lg">↻</span>
            </button>
            <button
              onClick={() => {
                // DEBUG: Log beim Button Click
                getLogger().info(`[REACT CLICK] nextPosition ID: ${nextPosition?.id}, Timestamp: ${new Date().toISOString()}`);
                if (nextPosition) {
                  router.push(`/train/${nextPosition.id}`);
                }
              }}
              disabled={!nextPosition || isLoadingNavigation}
              className="p-2 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
              title="Nächste Stellung"
            >
              <span className="text-lg">Nächste Stellung {isLoadingNavigation ? '⏳' : '→'}</span>
            </button>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="streak-section p-4 border-b border-gray-700">
          <StreakCounter
            currentStreak={trainingState.currentStreak}
            bestStreak={trainingState.bestStreak}
          />
        </div>

        {/* Game Status */}
        <div className="game-status p-4 border-b border-gray-700">
          <div className="text-sm font-medium flex items-center gap-2">
            <span className="text-base">♔</span>
            {gameStatus?.sideToMoveDisplay}
          </div>
          <div className="text-xs text-gray-300 mt-1">{gameStatus?.objectiveDisplay}</div>
        </div>

        {/* Instructions */}
        <div className="instructions p-4 border-b border-gray-700">
          <h3 className="font-bold mb-2">{formatPositionTitle(position)}</h3>
          <p className="text-sm text-gray-400">{position.description}</p>
        </div>

        {/* Toggles */}
        <div className="toggles p-4 border-b border-gray-700">
          <button
            onClick={handleToggleAnalysis}
            data-testid="toggle-analysis"
            className={`w-full p-2 rounded mb-2 transition-colors ${
              uiState.analysisPanel.isOpen
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Analyse {uiState.analysisPanel.isOpen ? 'AUS' : 'AN'}
          </button>

          <TablebaseAnalysisPanel
            fen={gameState.currentFen || position.fen}
            isVisible={uiState.analysisPanel.isOpen}
            {...(() => {
              const previousFen =
                gameState.moveHistory && gameState.moveHistory.length > 0
                  ? gameState.moveHistory[gameState.moveHistory.length - 1]?.fenBefore
                  : undefined;
              return previousFen !== undefined ? { previousFen } : {};
            })()}
          />
        </div>

        {/* Move History */}
        <div className="move-history flex-1 p-4 border-b border-gray-700 overflow-y-auto">
          <MovePanelZustand
            showEvaluations={uiState.analysisPanel.isOpen}
            onMoveClick={handleMoveClick}
            currentMoveIndex={gameState.currentMoveIndex}
          />
          <div className="mt-2">
            <NavigationControls />
          </div>
        </div>

        {/* External Links */}
        <div className="external-links p-4">
          <a
            href={getLichessUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Auf Lichess analysieren →
          </a>
        </div>
      </div>
    </div>
  );
};

EndgameTrainingPage.displayName = 'EndgameTrainingPage';
