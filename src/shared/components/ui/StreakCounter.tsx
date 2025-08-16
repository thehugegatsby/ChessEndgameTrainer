/**
 * @file Streak Counter Component
 * @description Displays current and best streak counts with animated updates
 */

import React from 'react';

interface StreakCounterProps {
  /** Current streak count */
  currentStreak: number;
  /** Best streak achieved */
  bestStreak: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StreakCounter Component
 *
 * Displays the current streak and best streak with fire emoji for visual appeal.
 * Shows animated transitions when streak values change.
 *
 * @param props - Component props
 * @returns JSX.Element
 */
export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  bestStreak,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-4 p-3 bg-gray-800 rounded-lg border border-gray-700 ${className}`}
      data-testid="streak-counter"
    >
      {/* Current Streak */}
      <div className="flex items-center gap-2">
        <span className="text-orange-400 text-lg">🔥</span>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Aktuelle Serie</span>
          <span
            className={`text-lg font-bold transition-colors duration-300 ${
              currentStreak > 0 ? 'text-orange-400' : 'text-gray-500'
            }`}
            data-testid="current-streak"
          >
            {currentStreak}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-600"></div>

      {/* Best Streak */}
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 text-lg">👑</span>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Beste Serie</span>
          <span
            className={`text-lg font-bold transition-colors duration-300 ${
              bestStreak > 0 ? 'text-yellow-400' : 'text-gray-500'
            }`}
            data-testid="best-streak"
          >
            {bestStreak}
          </span>
        </div>
      </div>

      {/* New Record Indicator */}
      {currentStreak > 0 && currentStreak === bestStreak && currentStreak > 1 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-black text-xs font-semibold rounded-full animate-pulse">
          <span>⭐</span>
          <span>Neuer Rekord!</span>
        </div>
      )}
    </div>
  );
};
