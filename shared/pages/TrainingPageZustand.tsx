"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrainingBoardZustand,
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
  useTraining,
  useTrainingActions,
  useUI,
  useUIActions,
} from "@shared/store/store";
import {
  getTrainingDisplayTitle,
  formatPositionTitle,
} from "@shared/utils/titleFormatter";
import { ANIMATION } from "@shared/constants";

interface TrainingPageZustandProps {
  position: EndgamePosition;
}

/**
 * Training page component migrated to use Zustand store
 * This replaces the Context-based version
 */
export const TrainingPageZustand: React.FC<TrainingPageZustandProps> =
  React.memo(({ position }) => {
    // Next.js router
    const router = useRouter();

    // Zustand store hooks
    const training = useTraining();
    const trainingActions = useTrainingActions();
    const ui = useUI();
    const uiActions = useUIActions();

    // Toast hook
    const { toasts, removeToast, showSuccess, showError } = useToast();

    // Local UI state
    const [resetKey, setResetKey] = useState<number>(0);

    // Load training context when position changes
    useEffect(() => {
      if (position) {
        trainingActions.loadTrainingContext(position);
      }
    }, [position, trainingActions]);

    // Game status
    const gameStatus = useMemo(
      () => getGameStatus(training.currentFen || position.fen, position.goal),
      [training.currentFen, position.fen, position.goal],
    );

    // Navigation data from store
    const prevPosition = training.previousPosition;
    const nextPosition = training.nextPosition;
    const isLoadingNavigation = training.isLoadingNavigation;

    // Initialize position in store when component mounts
    useEffect(() => {
      if (
        !training.currentPosition ||
        training.currentPosition.id !== position.id
      ) {
        trainingActions.setPosition(position);
      }
    }, [position.id, training.currentPosition, trainingActions]);

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
        trainingActions.completeTraining(isSuccess);
      },
      [trainingActions, showSuccess, showError],
    );

    const handleResetPosition = useCallback(() => {
      trainingActions.resetPosition();
      setResetKey((prev) => prev + 1);
    }, [trainingActions]);

    const handleMoveClick = useCallback(
      (moveIndex: number) => {
        // Navigate to the clicked move
        trainingActions.goToMove(moveIndex);
      },
      [trainingActions],
    );

    const handleToggleAnalysis = useCallback(() => {
      uiActions.updateAnalysisPanel({ isOpen: !ui.analysisPanel.isOpen });
    }, [ui.analysisPanel.isOpen, uiActions]);

    const getLichessUrl = useCallback(() => {
      const currentPgn = training.currentPgn || "";
      const currentFen = training.currentFen || position.fen;

      if (currentPgn && training.moveHistory.length > 0) {
        return `https://lichess.org/analysis/pgn/${encodeURIComponent(currentPgn)}`;
      } else {
        return `https://lichess.org/analysis/${currentFen.replace(/ /g, "_")}`;
      }
    }, [
      training.currentPgn,
      training.moveHistory.length,
      training.currentFen,
      position.fen,
    ]);

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
            {/* Progress Header centered above board - hidden in E2E tests to prevent blocking interactions */}
            {process.env.NEXT_PUBLIC_IS_E2E_TEST !== "true" && (
              <div className="absolute top-24 left-0 right-0 z-10 text-center">
                <h2 className="text-3xl font-bold">
                  {getTrainingDisplayTitle(
                    position,
                    training.moveHistory.length,
                  )}
                </h2>
              </div>
            )}

            <div className="w-full h-full flex items-center justify-center">
              <TrainingBoardZustand
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
                  ui.analysisPanel.isOpen
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Analyse {ui.analysisPanel.isOpen ? "AUS" : "AN"}
              </button>

              <TablebaseAnalysisPanel
                fen={training.currentFen || position.fen}
                isVisible={ui.analysisPanel.isOpen}
                previousFen={
                  training.moveHistory.length > 0
                    ? training.moveHistory[training.moveHistory.length - 1]
                        ?.before
                    : undefined
                }
              />
            </div>

            {/* Move History */}
            <div className="move-history flex-1 p-4 border-b border-gray-700 overflow-y-auto">
              <MovePanelZustand
                showEvaluations={ui.analysisPanel.isOpen}
                onMoveClick={handleMoveClick}
                currentMoveIndex={training.currentMoveIndex}
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
  });

TrainingPageZustand.displayName = "TrainingPageZustand";
