/**
 * @file Navigation controls for move history
 * @module components/training/NavigationControls
 *
 * @description
 * Navigation control buttons for moving through chess game history.
 * Provides Lichess-style navigation with first/previous/next/last
 * buttons. Integrates directly with Zustand store for state management.
 *
 * @remarks
 * Key features:
 * - Four-button navigation (first, previous, next, last)
 * - Intelligent button state management (disabled at boundaries)
 * - SVG icons for clear visual feedback
 * - Accessibility support with ARIA labels
 * - German language tooltips
 * - Test-friendly data attributes
 * - Responsive hover and active states
 *
 * The component automatically calculates navigation boundaries and
 * disables appropriate buttons when at the start or end of move history.
 */

import React from "react";
import { useStore } from "@shared/store/rootStore";
import { useShallow } from "zustand/react/shallow";

/**
 * Navigation controls for move history
 *
 * @component
 * @description
 * Provides a set of navigation buttons for moving through chess game
 * move history. Similar to video player controls but for chess moves.
 * Integrates with the Zustand store for seamless state management.
 *
 * @remarks
 * Navigation behavior:
 * - First: Jump to initial position (before any moves)
 * - Previous: Go back one move
 * - Next: Go forward one move
 * - Last: Jump to current position (after all moves)
 *
 * Button states:
 * - Buttons are disabled when navigation is not possible
 * - Visual feedback shows enabled/disabled states
 * - Hover effects provide interactive feedback
 * - Active states provide click feedback
 *
 * The component uses memoization to prevent unnecessary re-renders
 * and calculates navigation state efficiently.
 *
 * @example
 * ```tsx
 * // Basic usage in game interface
 * <NavigationControls />
 *
 * // In a move panel or sidebar
 * <div className="move-controls">
 *   <MoveHistory moves={gameHistory} />
 *   <NavigationControls />
 * </div>
 *
 * // With custom styling
 * <div className="custom-nav-container">
 *   <NavigationControls />
 * </div>
 * ```
 *
 * @returns {JSX.Element} Navigation control buttons
 */
export const NavigationControls: React.FC = React.memo(() => {
  const { moveHistory, currentMoveIndex } = useStore(
    useShallow((state) => ({
      moveHistory: state.moveHistory,
      currentMoveIndex: state.currentMoveIndex,
    })),
  );
  const { goToFirst, goToPrevious, goToNext, goToLast } = useStore(
    useShallow((state) => ({
      goToFirst: state.goToFirst,
      goToPrevious: state.goToPrevious,
      goToNext: state.goToNext,
      goToLast: state.goToLast,
    })),
  );

  // Calculate navigation state
  const totalMoves = moveHistory.length;
  const currentIndex = currentMoveIndex ?? totalMoves - 1;
  const isAtStart = currentIndex <= -1;
  const isAtEnd = currentIndex >= totalMoves - 1;

  return (
    <div
      className="navigation-controls flex items-center justify-center gap-2 p-2 bg-gray-800 rounded-lg"
      data-testid="move-navigation"
    >
      <button
        onClick={goToFirst}
        disabled={isAtStart}
        className={`p-2 rounded transition-all ${
          isAtStart
            ? "text-gray-600 cursor-not-allowed"
            : "text-white hover:bg-gray-700 active:scale-95"
        }`}
        title="Zum Anfang der Zugliste"
        aria-label="Zum Anfang der Zugliste"
        data-testid="nav-first"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" />
        </svg>
      </button>

      <button
        onClick={goToPrevious}
        disabled={isAtStart}
        className={`p-2 rounded transition-all ${
          isAtStart
            ? "text-gray-600 cursor-not-allowed"
            : "text-white hover:bg-gray-700 active:scale-95"
        }`}
        title="Ein Zug zurück"
        aria-label="Ein Zug zurück"
        data-testid="nav-back"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
        <span className="sr-only">Ein Zug zurück</span>
      </button>

      <button
        onClick={goToNext}
        disabled={isAtEnd}
        className={`p-2 rounded transition-all ${
          isAtEnd
            ? "text-gray-600 cursor-not-allowed"
            : "text-white hover:bg-gray-700 active:scale-95"
        }`}
        title="Ein Zug vor"
        aria-label="Ein Zug vor"
        data-testid="nav-forward"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>

      <button
        onClick={goToLast}
        disabled={isAtEnd}
        className={`p-2 rounded transition-all ${
          isAtEnd
            ? "text-gray-600 cursor-not-allowed"
            : "text-white hover:bg-gray-700 active:scale-95"
        }`}
        title="Zum Ende der Zugliste"
        aria-label="Zum Ende der Zugliste"
        data-testid="nav-last"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" />
        </svg>
      </button>
    </div>
  );
});

NavigationControls.displayName = "NavigationControls";
