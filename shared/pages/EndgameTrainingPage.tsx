"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrainingBoard,
  MovePanelZustand,
  NavigationControls,
} from "@shared/components/training";
import { TablebaseAnalysisPanel } from "@shared/components/training/TablebaseAnalysisPanel";
import { AdvancedEndgameMenu } from "@shared/components/navigation/AdvancedEndgameMenu";
import { EndgamePosition } from "@shared/types";
import { useToast } from "@shared/hooks/useToast";
import { ToastContainer } from "@shared/components/ui/Toast";
import { getGameStatus } from "@shared/utils/chess/gameStatus";
import {
  useGameStore,
  useTrainingStore,
  useUIStore,
} from "@shared/store/hooks";
import { useInitializePosition } from "@shared/store/hooks/useInitializePosition";
import {
  getTrainingDisplayTitle,
  formatPositionTitle,
} from "@shared/utils/titleFormatter";
import { ANIMATION } from "@shared/constants";

/**
 *
 */
export interface EndgameTrainingPageProps {
  position: EndgamePosition;
}

/**
 * Endgame training page component using Zustand store
 * Provides the main training interface for endgame positions
 */
export /**
 *
 */
const EndgameTrainingPage: React.FC<EndgameTrainingPageProps> = React.memo(
  ({ position }) => {
    // Next.js router
    const router = useRouter();

    // Zustand store hooks - consolidated
    const [gameState, gameActions] = useGameStore();
    const [trainingState, trainingActions] = useTrainingStore();
    const [uiState, uiActions] = useUIStore();

    // Toast hook
    const { toasts, removeToast, showSuccess, showError } = useToast();

    // Local UI state
    const [resetKey, setResetKey] = useState<number>(0);

    // Initialize position from server data
    const isPositionInitialized = useInitializePosition(position);

    // Extract actions to avoid dependency issues
    const { completeTraining } = trainingActions;

    // Game status - MUST be before any conditional returns (React Hook Rules)
    const gameStatus = useMemo(
      () => getGameStatus(gameState.currentFen || position.fen, position.goal),
      [gameState.currentFen, position.fen, position.goal],
    );

    // Navigation data from store
    const prevPosition = trainingState.previousPosition;
    const nextPosition = trainingState.nextPosition;
    const isLoadingNavigation = trainingState.isLoadingNavigation;

    const handleComplete = useCallback(
      (isSuccess: boolean) => {
        if (isSuccess) {
          showSuccess(
            "Geschafft! Position erfolgreich gelöst!",
            ANIMATION.SUCCESS_TOAST_DURATION,
          );
        } else {
          showError("Versuch es erneut", ANIMATION.ERROR_TOAST_DURATION);
        }
        completeTraining(isSuccess);
      },
      [completeTraining, showSuccess, showError],
    );

    const handleResetPosition = useCallback(() => {
      gameActions.resetGame();
      setResetKey((prev) => prev + 1);
    }, [gameActions]);

    const handleMoveClick = useCallback(
      (moveIndex: number) => {
        // Navigate to the clicked move
        gameActions.goToMove(moveIndex);
      },
      [gameActions],
    );

    const handleToggleAnalysis = useCallback(() => {
      uiActions.updateAnalysisPanel({ isOpen: !uiState.analysisPanel.isOpen });
    }, [uiActions, uiState]);

    const getLichessUrl = useCallback(() => {
      const currentPgn = gameState.currentPgn || "";
      const currentFen = gameState.currentFen || position.fen;

      if (currentPgn && gameState.moveHistory.length > 0) {
        return `https://lichess.org/analysis/pgn/${encodeURIComponent(currentPgn)}`;
      } else {
        return `https://lichess.org/analysis/${currentFen.replace(/ /g, "_")}`;
      }
    }, [
      gameState.currentPgn,
      gameState.moveHistory,
      gameState.currentFen,
      position.fen,
    ]);

    // Show loading state while position is being initialized
    // This MUST be after ALL hooks to comply with React Hook Rules
    if (!isPositionInitialized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Position wird geladen...</div>
        </div>
      );
    }

    return (
      <div className="trainer-container h-screen flex bg-slate-800 text-white">
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

        {/* Left Menu */}
        <AdvancedEndgameMenu
          isOpen={true}
          onClose={() => {}}
          currentPositionId={position.id}
        />

        {/* Main Content - Horizontal Layout like Lichess - Full Screen */}
        <div className="main-content flex-1 flex h-full mr-80">
          {/* Chessboard Area */}
          <div className="chessboard-wrapper flex-[5] h-full relative">
            {/* Progress Header centered above board - always show for E2E test visibility */}
            <div
              className="absolute top-24 left-0 right-0 text-center pointer-events-none"
              data-testid="position-title"
              style={{ zIndex: 5 }}
            >
              <h2 className="text-3xl font-bold">
                {getTrainingDisplayTitle(
                  position,
                  gameState.moveHistory?.length || 0,
                )}
              </h2>
            </div>

            <div className="w-full h-full flex items-center justify-center">
              <TrainingBoard
                key={`${position.id}-${resetKey}`}
                position={position}
                onComplete={() => handleComplete(true)}
              />
            </div>
          </div>

          {/* Floating Sidebar */}
          <div className="sidebar fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-700 flex flex-col z-20 overflow-y-auto">
            {/* Navigation between positions */}
            <div className="nav-section p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-2 text-center">
                Stellungsnavigation
              </h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() =>
                    prevPosition && router.push(`/train/${prevPosition.id}`)
                  }
                  disabled={!prevPosition || isLoadingNavigation}
                  className="p-2 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
                  title="Vorherige Stellung"
                >
                  <span className="text-lg">
                    {isLoadingNavigation ? "⏳" : "←"} Vorherige Stellung
                  </span>
                </button>
                <button
                  onClick={handleResetPosition}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Position zurücksetzen"
                >
                  <span className="text-lg">↻</span>
                </button>
                <button
                  onClick={() =>
                    nextPosition && router.push(`/train/${nextPosition.id}`)
                  }
                  disabled={!nextPosition || isLoadingNavigation}
                  className="p-2 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
                  title="Nächste Stellung"
                >
                  <span className="text-lg">
                    Nächste Stellung {isLoadingNavigation ? "⏳" : "→"}
                  </span>
                </button>
              </div>
            </div>

            {/* Game Status */}
            <div className="game-status p-4 border-b border-gray-700">
              <div className="text-sm font-medium flex items-center gap-2">
                <span className="text-base">♔</span>
                {gameStatus.sideToMoveDisplay}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {gameStatus.objectiveDisplay}
              </div>
            </div>

            {/* Instructions */}
            <div className="instructions p-4 border-b border-gray-700">
              <h3 className="font-bold mb-2">
                {formatPositionTitle(position)}
              </h3>
              <p className="text-sm text-gray-400">{position.description}</p>
            </div>

            {/* Toggles */}
            <div className="toggles p-4 border-b border-gray-700">
              <button
                onClick={handleToggleAnalysis}
                data-testid="toggle-analysis"
                className={`w-full p-2 rounded mb-2 transition-colors ${
                  uiState.analysisPanel.isOpen
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Analyse {uiState.analysisPanel.isOpen ? "AUS" : "AN"}
              </button>

              <TablebaseAnalysisPanel
                fen={gameState.currentFen || position.fen}
                isVisible={uiState.analysisPanel.isOpen}
                previousFen={
                  gameState.moveHistory && gameState.moveHistory.length > 0
                    ? gameState.moveHistory[gameState.moveHistory.length - 1]
                        ?.fenBefore
                    : undefined
                }
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
      </div>
    );
  },
);

EndgameTrainingPage.displayName = "EndgameTrainingPage";
