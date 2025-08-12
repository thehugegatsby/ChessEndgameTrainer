"use client";

import React, { useState, useMemo, lazy, Suspense } from "react";

// Lightweight immediate imports
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

// Heavy components loaded on demand
const TrainingBoard = lazy(() => 
  import("@shared/components/training/TrainingBoard/TrainingBoard").then(m => ({
    default: m.TrainingBoard
  }))
);

const MovePanelZustand = lazy(() => 
  import("@shared/components/training/MovePanelZustand").then(m => ({
    default: m.MovePanelZustand
  }))
);

const NavigationControls = lazy(() => 
  import("@shared/components/training/NavigationControls").then(m => ({
    default: m.NavigationControls
  }))
);

const TablebaseAnalysisPanel = lazy(() => 
  import("@shared/components/training/TablebaseAnalysisPanel").then(m => ({
    default: m.TablebaseAnalysisPanel
  }))
);

const AdvancedEndgameMenu = lazy(() => 
  import("@shared/components/navigation/AdvancedEndgameMenu").then(m => ({
    default: m.AdvancedEndgameMenu
  }))
);

// Simple loading placeholder
const ComponentLoading = (): React.JSX.Element => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
  </div>
);

// Board loading placeholder
const BoardLoading = (): React.JSX.Element => (
  <div className="aspect-square bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg"></div>
  </div>
);

/**
 * Lightweight Endgame training page with lazy-loaded heavy components
 */
export const EndgameTrainingPageLite: React.FC = React.memo(() => {
  // Zustand store hooks
  const [gameState] = useGameStore();
  const [trainingState] = useTrainingStore();
  const [uiState, uiActions] = useUIStore();

  // Local state
  const [currentView, setCurrentView] = useState<"board" | "analysis">("board");

  // Check if the game is won (removed as not used in lite version)

  // Position title
  const positionTitle = useMemo(() => {
    if (!trainingState.currentPosition) return '';
    
    const displayTitle = getTrainingDisplayTitle(
      trainingState.currentPosition
    );
    return displayTitle;
  }, [trainingState.currentPosition]);

  // Handle successful completion (removed as not used in lite version)

  // Note: Navigation and reset handlers removed - not used in lite version
  // Navigation is handled by NavigationControls component

  // Handle error (removed as not used in lite version)

  // Loading state
  if (!trainingState.currentPosition || !gameState.currentFen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Training...</p>
        </div>
      </div>
    );
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
              <Suspense fallback={
                <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
                  <div className="w-6 h-6"></div>
                </button>
              }>
                <AdvancedEndgameMenu 
                  isOpen={false}
                  onClose={() => {}}
                />
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
            <Suspense fallback={<BoardLoading />}>
              <TrainingBoard 
                onComplete={() => {
                  // Handle completion if needed
                }}
              />
            </Suspense>
            
            {/* Navigation Controls */}
            <div className="mt-4">
              <Suspense fallback={<ComponentLoading />}>
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
              <Suspense fallback={<ComponentLoading />}>
                <MovePanelZustand />
              </Suspense>
            ) : (
              <Suspense fallback={<ComponentLoading />}>
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
        <CheckmarkAnimation isVisible={true} />
      )}
    </div>
  );
});

EndgameTrainingPageLite.displayName = "EndgameTrainingPageLite";