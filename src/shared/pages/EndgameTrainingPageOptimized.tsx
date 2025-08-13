"use client";

import { getLogger } from '@shared/services/logging/Logger';
import React, { useState, useCallback, useMemo, lazy, Suspense } from "react";

// Heavy components loaded dynamically
const TrainingBoard = lazy(() => import("@shared/components/training/TrainingBoard/TrainingBoard").then(m => ({ default: m.TrainingBoard })));
const MovePanelZustand = lazy(() => import("@shared/components/training/MovePanelZustand").then(m => ({ default: m.MovePanelZustand })));
const NavigationControls = lazy(() => import("@shared/components/training/NavigationControls").then(m => ({ default: m.NavigationControls })));
const TablebaseAnalysisPanel = lazy(() => import("@shared/components/training/TablebaseAnalysisPanel").then(m => ({ default: m.TablebaseAnalysisPanel })));
const AdvancedEndgameMenu = lazy(() => import("@shared/components/navigation/AdvancedEndgameMenu").then(m => ({ default: m.AdvancedEndgameMenu })));

// Lightweight components can stay as regular imports
import { useToast } from "@shared/hooks/useToast";
import { ToastContainer } from "@shared/components/ui/Toast";
import { StreakCounter } from "@shared/components/ui/StreakCounter";
import { CheckmarkAnimation } from "@shared/components/ui/CheckmarkAnimation";
import {
  useGameStore,
  useTrainingStore,
  useUIStore,
} from "@shared/store/hooks";
import {
  getTrainingDisplayTitle,
} from "@shared/utils/titleFormatter";
import { ANIMATION } from "@shared/constants";

// Loading fallback component
const LoadingFallback = (): React.JSX.Element => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Lade Training...</p>
    </div>
  </div>
);

/**
 * Optimized Endgame training page component using Zustand store
 * Uses dynamic imports for heavy components to reduce initial bundle size
 */
export const EndgameTrainingPageOptimized: React.FC = React.memo(() => {
  const logger = useMemo(() => getLogger().setContext("EndgameTrainingPage"), []);
  
  // Zustand store hooks - consolidated
  const [gameState] = useGameStore();
  const [trainingState, trainingActions] = useTrainingStore();
  const [uiState, uiActions] = useUIStore();

  // Toast hook
  const { showSuccess } = useToast();

  // Local state
  const [currentView, setCurrentView] = useState<"board" | "analysis">("board");

  const isGameWon = gameState.isGameFinished && gameState.gameResult === "1-0";

  // Position title for display
  const positionTitle = useMemo(() => {
    if (!trainingState.currentPosition) return '';
    return getTrainingDisplayTitle(trainingState.currentPosition);
  }, [trainingState.currentPosition]);

  // Handle successful completion
  const handleSuccess = useCallback(() => {
    logger.info("Training completed successfully");
    showSuccess("Gut gemacht! Position gemeistert!");
    
    // Update progress in store
    if (trainingState.currentPosition?.id) {
      trainingActions.completeTraining(true);
    }
    
    // Show checkmark animation (use SUCCESS_TOAST_DURATION as fallback)
    trainingActions.showCheckmarkAnimation(ANIMATION.SUCCESS_TOAST_DURATION);
  }, [
    logger,
    showSuccess,
    trainingState.currentPosition,
    trainingActions,
  ]);

  // Note: Navigation and reset handlers removed - not used in optimized version
  // Navigation is handled by NavigationControls component

  // Effect: Check for game won
  React.useEffect(() => {
    if (isGameWon && !trainingState.showCheckmark) {
      handleSuccess();
    }
  }, [isGameWon, trainingState.showCheckmark, handleSuccess]);

  // Loading state
  if (!trainingState.currentPosition || !gameState.currentFen) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {positionTitle}
            </h1>
            <div className="flex items-center space-x-4">
              <StreakCounter 
                currentStreak={trainingState.currentStreak} 
                bestStreak={trainingState.bestStreak}
              />
              <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />}>
                <AdvancedEndgameMenu isOpen={false} onClose={() => {}} />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Board Section */}
          <div className="lg:col-span-2">
            <Suspense fallback={
              <div className="aspect-square bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse" />
            }>
              <TrainingBoard 
                onComplete={handleSuccess}
              />
            </Suspense>
            
            {/* Navigation Controls */}
            <div className="mt-4">
              <Suspense fallback={
                <div className="h-12 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse" />
              }>
                <NavigationControls />
              </Suspense>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
              <button
                onClick={() => setCurrentView("board")}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  currentView === "board"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Züge
              </button>
              <button
                onClick={() => setCurrentView("analysis")}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  currentView === "analysis"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Analyse
              </button>
            </div>

            {/* Content based on view */}
            {currentView === "board" ? (
              <Suspense fallback={
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-96 animate-pulse" />
              }>
                <MovePanelZustand />
              </Suspense>
            ) : (
              <Suspense fallback={
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-96 animate-pulse" />
              }>
                <TablebaseAnalysisPanel 
                  fen={gameState.currentFen}
                  isVisible={true}
                />
              </Suspense>
            )}
          </div>
        </div>
      </main>

      {/* Toast Container */}
      <ToastContainer 
        toasts={uiState.toasts}
        onRemoveToast={(id) => uiActions.removeToast(id)}
      />

      {/* Success Animation */}
      {trainingState.showCheckmark && (
        <CheckmarkAnimation isVisible={trainingState.showCheckmark} />
      )}
    </div>
  );
});

EndgameTrainingPageOptimized.displayName = "EndgameTrainingPageOptimized";