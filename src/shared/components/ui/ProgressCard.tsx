/**
 * @file Progress card component for chess training categories
 * @module components/ui/ProgressCard
 * 
 * @description
 * Visual card component displaying training progress for chess endgame
 * categories. Shows completion statistics, success rates, and spaced
 * repetition information with engaging visual design. Features gradient
 * backgrounds based on difficulty level.
 * 
 * @remarks
 * Key features:
 * - Progress visualization with percentage bar
 * - Success rate and due today statistics
 * - Streak tracking with fire emoji
 * - Difficulty-based gradient themes
 * - Category icons (pawn, rook, queen, etc.)
 * - Hover effects and animations
 * - Dark mode support
 * - German language interface
 * 
 * The component is designed to motivate learners by displaying
 * their progress in an appealing and informative way.
 */

import React from "react";

/**
 * Progress statistics data structure
 * 
 * @interface ProgressStats
 * 
 * @property {number} total - Total number of positions in the category
 * @property {number} completed - Number of completed positions
 * @property {number} successRate - Success rate as decimal (0-1)
 * @property {number} dueToday - Number of positions due for review today
 * @property {number} streak - Current training streak in days
 */
interface ProgressStats {
  total: number;
  completed: number;
  successRate: number;
  dueToday: number;
  streak: number;
}

/**
 * Props for the ProgressCard component
 * 
 * @interface ProgressCardProps
 * 
 * @property {string} title - Card title (e.g., "King and Pawn")
 * @property {string} description - Brief description of the training category
 * @property {ProgressStats} stats - Progress statistics object
 * @property {'beginner' | 'intermediate' | 'advanced'} difficulty - Difficulty level
 * @property {'pawn' | 'rook' | 'queen' | 'minor' | 'other'} category - Piece category
 * @property {() => void} onStartTraining - Callback when training button is clicked
 */
interface ProgressCardProps {
  title: string;
  description: string;
  stats: ProgressStats;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: "pawn" | "rook" | "queen" | "minor" | "other";
  onStartTraining: () => void;
}

/**
 * Gradient color schemes for each difficulty level
 * @private
 */
const difficultyColors = {
  beginner:
    "from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700",
  intermediate:
    "from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-700",
  advanced:
    "from-red-50 to-pink-50 border-red-200 dark:from-red-900/20 dark:to-pink-900/20 dark:border-red-700",
};

/**
 * Icons representing each difficulty level
 * @private
 */
const difficultyIcons = {
  beginner: "🌱",
  intermediate: "⚡",
  advanced: "🔥",
};

/**
 * Chess piece icons for each category
 * @private
 */
const categoryIcons = {
  pawn: "♟️",
  rook: "♜",
  queen: "♛",
  minor: "♝",
  other: "🎯",
};

/**
 * Progress card component
 * 
 * @component
 * @description
 * Displays a visually appealing card showing training progress for a
 * specific chess endgame category. Includes statistics, progress bars,
 * and motivational elements like streak tracking. The card design adapts
 * its colors based on difficulty level.
 * 
 * @remarks
 * Visual design:
 * - Green gradients for beginner content
 * - Yellow/orange gradients for intermediate
 * - Red/pink gradients for advanced
 * - Animated progress bar with gradient fill
 * - Hover effects for interactivity
 * 
 * The component is memoized for performance optimization.
 * 
 * @example
 * ```tsx
 * <ProgressCard
 *   title="König und Bauer"
 *   description="Grundlegende Bauernendspiele"
 *   stats={{
 *     total: 10,
 *     completed: 7,
 *     successRate: 0.85,
 *     dueToday: 3,
 *     streak: 5
 *   }}
 *   difficulty="beginner"
 *   category="pawn"
 *   onStartTraining={() => navigate('/train/pawn')}
 * />
 * ```
 * 
 * @param {ProgressCardProps} props - Card configuration
 * @returns {JSX.Element} Rendered progress card
 */
export const ProgressCard: React.FC<ProgressCardProps> = React.memo(
  ({ title, description, stats, difficulty, category, onStartTraining }) => {
    const progressPercentage =
      stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const successPercentage = Math.round(stats.successRate * 100);

    return (
      <div
        className={`bg-gradient-to-br ${difficultyColors[difficulty]} p-6 rounded-2xl shadow-lg border transition-all hover:shadow-xl hover:scale-105`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryIcons[category]}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-lg">
            <span className="text-sm">{difficultyIcons[difficulty]}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
              {difficulty}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fortschritt
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {stats.completed}/{stats.total}
            </span>
          </div>
          <div className="w-full bg-white/60 dark:bg-gray-700/60 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {progressPercentage}% abgeschlossen
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {successPercentage}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Erfolgsrate
            </div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {stats.dueToday}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Heute fällig
            </div>
          </div>
        </div>

        {/* Streak */}
        {stats.streak > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.streak} Tage Streak
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onStartTraining}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          {stats.dueToday > 0
            ? `${stats.dueToday} Aufgaben trainieren`
            : "Training starten"}
        </button>
      </div>
    );
  },
);

ProgressCard.displayName = "ProgressCard";
