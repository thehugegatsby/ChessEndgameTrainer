/**
 * @file Tablebase result classification utilities
 * @module utils/tablebase/resultClassification
 *
 * @description
 * Core utilities for classifying and organizing tablebase moves based on DTZ
 * (Distance to Zero) values. Provides a comprehensive suite of functions for
 * categorizing moves into win/draw/loss groups, sorting by quality, and
 * generating UI styling for the Lichess-like tablebase interface.
 *
 * @remarks
 * Key features:
 * - DTZ-based move classification (win/draw/loss)
 * - Move grouping and sorting algorithms
 * - Visual styling utilities (colors, icons, bar widths)
 * - Formatting functions for user-friendly display
 * - Support for both DTZ and WDL evaluation methods
 *
 * The module ensures consistent move categorization throughout the application
 * and provides optimized sorting algorithms for each move category.
 */

/**
 * Move result type classification
 * @typedef {'win' | 'draw' | 'loss'} MoveResultType
 */
export type MoveResultType = "win" | "draw" | "loss";

/**
 * Tablebase move data structure
 *
 * @interface TablebaseMove
 * @description
 * Complete move information from tablebase API including evaluation metrics
 * and categorization for UI display.
 *
 * @property {string} move - Move in UCI notation (e.g., "e2e4")
 * @property {string} san - Move in Standard Algebraic Notation (e.g., "e4")
 * @property {number} dtz - Distance to Zero (moves to game end)
 * @property {number} dtm - Distance to Mate (moves to checkmate)
 * @property {number} wdl - Win/Draw/Loss value (-1, 0, 1)
 * @property {'win' | 'draw' | 'loss'} category - Pre-calculated result category
 */
export interface TablebaseMove {
  move: string;
  san: string;
  dtz: number;
  dtm: number;
  wdl: number;
  category: "win" | "draw" | "loss";
}

/**
 * Moves grouped by result type
 *
 * @interface GroupedMoves
 * @description
 * Container for organizing moves into result categories for efficient
 * rendering and analysis.
 *
 * @property {TablebaseMove[]} win - Array of winning moves
 * @property {TablebaseMove[]} draw - Array of drawing moves
 * @property {TablebaseMove[]} loss - Array of losing moves
 */
export interface GroupedMoves {
  win: TablebaseMove[];
  draw: TablebaseMove[];
  loss: TablebaseMove[];
}

/**
 * Categorized and sorted moves with statistics
 *
 * @interface CategorizedMoves
 * @description
 * Final categorization result with sorted moves and aggregate statistics.
 * Used as the primary data structure for UI components.
 *
 * @property {TablebaseMove[]} winningMoves - Sorted array of winning moves
 * @property {TablebaseMove[]} drawingMoves - Sorted array of drawing moves
 * @property {TablebaseMove[]} losingMoves - Sorted array of losing moves
 * @property {number} totalMoves - Total count of all moves
 */
export interface CategorizedMoves {
  winningMoves: TablebaseMove[];
  drawingMoves: TablebaseMove[];
  losingMoves: TablebaseMove[];
  totalMoves: number;
}

/**
 * Determines the result type of a move based on its DTZ value
 *
 * @function getMoveResultType
 * @param {number} dtz - Distance to Zero value from tablebase
 * @returns {MoveResultType} Move result type: 'win', 'draw', or 'loss'
 *
 * @description
 * Core classification function using DTZ values:
 * - Positive DTZ: Winning move (player achieves favorable outcome)
 * - Zero DTZ: Drawing move (game remains balanced)
 * - Negative DTZ: Losing move (opponent achieves favorable outcome)
 *
 * @example
 * ```typescript
 * getMoveResultType(15);  // 'win'
 * getMoveResultType(0);   // 'draw'
 * getMoveResultType(-20); // 'loss'
 * ```
 */
export const getMoveResultType = (dtz: number): MoveResultType => {
  if (dtz > 0) return "win";
  if (dtz === 0) return "draw";
  return "loss";
};

/**
 * Determines the result type of a move based on its TablebaseMove data
 *
 * @function getMoveResultTypeFromMove
 * @param {TablebaseMove} move - TablebaseMove object
 * @returns {MoveResultType} Move result type: 'win', 'draw', or 'loss'
 *
 * @description
 * Enhanced classification that prioritizes the pre-calculated category field
 * if available (more reliable from API), otherwise falls back to DTZ-based
 * classification. This two-tier approach ensures accuracy even with
 * incomplete API responses.
 *
 * @example
 * ```typescript
 * const move = { san: 'Ke2', dtz: 10, category: 'win', ... };
 * getMoveResultTypeFromMove(move); // 'win' (uses category)
 * ```
 */
export const getMoveResultTypeFromMove = (
  move: TablebaseMove,
): MoveResultType => {
  // Use the category field if available (more reliable)
  if (move.category) {
    return move.category;
  }

  // Fallback to DTZ-based classification
  return getMoveResultType(move.dtz);
};

/**
 * Determines the result type based on WDL value (alternative method)
 *
 * @function getMoveResultTypeFromWdl
 * @param {number} wdl - Win/Draw/Loss value from tablebase
 * @returns {MoveResultType} Move result type: 'win', 'draw', or 'loss'
 *
 * @description
 * Alternative classification using WDL (Win/Draw/Loss) values:
 * - Positive WDL (1): Win for the player to move
 * - Zero WDL (0): Draw with best play
 * - Negative WDL (-1): Loss for the player to move
 *
 * @example
 * ```typescript
 * getMoveResultTypeFromWdl(1);   // 'win'
 * getMoveResultTypeFromWdl(0);   // 'draw'
 * getMoveResultTypeFromWdl(-1);  // 'loss'
 * ```
 */
export const getMoveResultTypeFromWdl = (wdl: number): MoveResultType => {
  if (wdl > 0) return "win";
  if (wdl === 0) return "draw";
  return "loss";
};

/**
 * Groups moves by their result type for organized display
 *
 * @function groupMovesByResult
 * @param {TablebaseMove[]} moves - Array of tablebase moves to group
 * @returns {GroupedMoves} Moves organized into win/draw/loss categories
 *
 * @description
 * Efficiently categorizes an array of moves into three groups based on
 * their result type. Uses the reliable getMoveResultTypeFromMove function
 * to ensure accurate categorization even with mixed data sources.
 *
 * @example
 * ```typescript
 * const moves = [
 *   { san: 'Ke2', dtz: 10, category: 'win', ... },
 *   { san: 'Kd2', dtz: 0, category: 'draw', ... },
 *   { san: 'Kc2', dtz: -15, category: 'loss', ... }
 * ];
 * const grouped = groupMovesByResult(moves);
 * // grouped.win = [{ san: 'Ke2', ... }]
 * // grouped.draw = [{ san: 'Kd2', ... }]
 * // grouped.loss = [{ san: 'Kc2', ... }]
 * ```
 */
export const groupMovesByResult = (moves: TablebaseMove[]): GroupedMoves => {
  const grouped: GroupedMoves = {
    win: [],
    draw: [],
    loss: [],
  };

  for (const move of moves) {
    const resultType = getMoveResultTypeFromMove(move);
    grouped[resultType].push(move);
  }

  return grouped;
};

/**
 * Sorts moves within each result category by DTZ value
 *
 * @function sortMovesByResult
 * @param {TablebaseMove[]} moves - Array of tablebase moves to sort
 * @returns {TablebaseMove[]} Sorted array maintaining result type grouping
 *
 * @description
 * Applies intelligent sorting based on result type:
 * - Winning moves: Ascending DTZ (fastest wins first) - helps find quickest path to victory
 * - Drawing moves: Alphabetical by SAN notation - provides consistent ordering
 * - Losing moves: Descending DTZ (slowest losses first) - prioritizes stubborn defense
 *
 * Result types are ordered: wins → draws → losses
 *
 * @example
 * ```typescript
 * const moves = [
 *   { san: 'Kb1', dtz: -10, category: 'loss', ... },
 *   { san: 'Ka1', dtz: 5, category: 'win', ... },
 *   { san: 'Kc1', dtz: 15, category: 'win', ... }
 * ];
 * const sorted = sortMovesByResult(moves);
 * // Result: Ka1 (win, dtz=5), Kc1 (win, dtz=15), Kb1 (loss, dtz=-10)
 * ```
 *
 * @remarks
 * The sorting strategy optimizes for practical play:
 * - Players want the fastest wins
 * - In losing positions, they want the most resilient defense
 * - Drawing moves are sorted alphabetically for predictability
 */
export const sortMovesByResult = (moves: TablebaseMove[]): TablebaseMove[] => {
  return [...moves].sort((a, b) => {
    const aType = getMoveResultTypeFromMove(a);
    const bType = getMoveResultTypeFromMove(b);

    // First sort by result type priority: win > draw > loss
    if (aType !== bType) {
      const typeOrder = { win: 0, draw: 1, loss: 2 };
      return typeOrder[aType] - typeOrder[bType];
    }

    // Within same result type, sort by DTZ value
    if (aType === "win") {
      // Winning moves: ascending DTZ (faster wins first)
      return a.dtz - b.dtz;
    } else if (aType === "draw") {
      // Drawing moves: alphabetical by move notation
      return a.san.localeCompare(b.san);
    } else {
      // Losing moves: descending DTZ (slower losses first)
      return b.dtz - a.dtz;
    }
  });
};

/**
 * Classifies moves by DTZ values with detailed categorization
 *
 * @function classifyMovesByDTZ
 * @param {TablebaseMove[]} moves - Array of tablebase moves to classify
 * @returns {CategorizedMoves} Fully categorized and sorted moves with statistics
 *
 * @description
 * High-level function that combines grouping and sorting to produce a
 * complete classification suitable for UI consumption. This is the primary
 * entry point for move organization in the tablebase interface.
 *
 * @example
 * ```typescript
 * const moves = getTablebaseMoves(position);
 * const classified = classifyMovesByDTZ(moves);
 *
 * console.log(`Total moves: ${classified.totalMoves}`);
 * console.log(`Winning: ${classified.winningMoves.length}`);
 * console.log(`Drawing: ${classified.drawingMoves.length}`);
 * console.log(`Losing: ${classified.losingMoves.length}`);
 * ```
 *
 * @remarks
 * The function ensures:
 * - All moves are categorized into exactly one group
 * - Each group is optimally sorted for gameplay
 * - Total move count is preserved for validation
 */
export const classifyMovesByDTZ = (
  moves: TablebaseMove[],
): CategorizedMoves => {
  const grouped = groupMovesByResult(moves);

  return {
    winningMoves: sortMovesByResult(grouped.win),
    drawingMoves: sortMovesByResult(grouped.draw),
    losingMoves: sortMovesByResult(grouped.loss),
    totalMoves: moves.length,
  };
};

/**
 * Gets the color class for a move based on its result type
 *
 * @function getColorClass
 * @param {MoveResultType} resultType - The move result type
 * @returns {string} Tailwind CSS classes for complete styling
 *
 * @description
 * Provides comprehensive styling classes including text color, background,
 * and border for consistent visual representation across the UI.
 * Colors follow chess convention: green=good, yellow=neutral, red=bad.
 *
 * @example
 * ```typescript
 * getColorClass('win');
 * // Returns: 'text-green-700 bg-green-100 border-green-300'
 * ```
 *
 * @remarks
 * Returns combined classes for:
 * - Text color (darker shade for contrast)
 * - Background color (light tint)
 * - Border color (medium shade)
 */
export const getColorClass = (resultType: MoveResultType): string => {
  switch (resultType) {
    case "win":
      return "text-green-700 bg-green-100 border-green-300";
    case "draw":
      return "text-yellow-700 bg-yellow-100 border-yellow-300";
    case "loss":
      return "text-red-700 bg-red-100 border-red-300";
    default:
      return "text-gray-700 bg-gray-100 border-gray-300";
  }
};

/**
 * Gets the background color class for evaluation bars
 *
 * @function getEvaluationBarColor
 * @param {MoveResultType} resultType - The move result type
 * @returns {string} Tailwind CSS class for bar background
 *
 * @description
 * Provides solid background colors for evaluation bar visualizations.
 * Uses more saturated colors than getColorClass for better visual impact
 * in progress bar contexts.
 *
 * @example
 * ```typescript
 * <div className={getEvaluationBarColor('win')} style={{width: '75%'}} />
 * // Creates a green bar at 75% width
 * ```
 */
export const getEvaluationBarColor = (resultType: MoveResultType): string => {
  switch (resultType) {
    case "win":
      return "bg-green-500";
    case "draw":
      return "bg-yellow-500";
    case "loss":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

/**
 * Gets the icon for a move result type
 *
 * @function getResultIcon
 * @param {MoveResultType} resultType - The move result type
 * @returns {string} Unicode icon character
 *
 * @description
 * Returns simple, universally recognized symbols for each result type.
 * These icons work across all platforms without requiring icon fonts.
 *
 * @example
 * ```typescript
 * getResultIcon('win');   // '✓' (checkmark)
 * getResultIcon('draw');  // '=' (equals)
 * getResultIcon('loss');  // '✗' (cross)
 * ```
 *
 * @remarks
 * Icons chosen for clarity:
 * - ✓ (U+2713): Universal symbol for success/win
 * - = (U+003D): Mathematical symbol for equality/draw
 * - ✗ (U+2717): Clear symbol for failure/loss
 * - ? (U+003F): Question mark for unknown states
 */
export const getResultIcon = (resultType: MoveResultType): string => {
  switch (resultType) {
    case "win":
      return "✓";
    case "draw":
      return "=";
    case "loss":
      return "✗";
    default:
      return "?";
  }
};

/**
 * Calculates the evaluation bar width based on DTZ value
 *
 * @function calculateBarWidth
 * @param {number} dtz - Distance to Zero value for the move
 * @param {number} maxDtz - Maximum DTZ value in the current set for normalization
 * @returns {number} Width percentage (20-100)
 *
 * @description
 * Normalizes DTZ values to create proportional bar widths for visual
 * comparison. Ensures minimum visibility (20%) while maintaining relative
 * scale. This creates an intuitive visual hierarchy where longer bars
 * indicate moves that take more time to reach the outcome.
 *
 * @example
 * ```typescript
 * // With max DTZ of 50
 * calculateBarWidth(50, 50);  // 100 (maximum width)
 * calculateBarWidth(25, 50);  // 60 (proportional)
 * calculateBarWidth(0, 50);   // 50 (default for draws)
 * calculateBarWidth(5, 50);   // 28 (minimum visibility)
 * ```
 *
 * @remarks
 * Algorithm details:
 * - Minimum width: 20% (ensures all moves are visible)
 * - Maximum width: 100% (for the longest DTZ)
 * - Linear scaling between min and max
 * - Special handling for zero values (draws)
 */
export const calculateBarWidth = (dtz: number, maxDtz: number): number => {
  if (maxDtz === 0) return 50; // Default width for draws

  const absDtz = Math.abs(dtz);
  const absMaxDtz = Math.abs(maxDtz);

  if (absMaxDtz === 0) return 50;

  // Calculate width: minimum 20%, maximum 100%
  const baseWidth = (absDtz / absMaxDtz) * 80 + 20;
  return Math.min(100, Math.max(20, baseWidth));
};

/**
 * Formats DTZ value for display
 *
 * @function formatDtzDisplay
 * @param {number} dtz - Distance to Zero value
 * @returns {string} Human-readable outcome description
 *
 * @description
 * Converts raw DTZ numbers into user-friendly descriptions that clearly
 * communicate the game outcome and moves required. Uses chess terminology
 * familiar to players.
 *
 * @example
 * ```typescript
 * formatDtzDisplay(0);    // "Draw"
 * formatDtzDisplay(15);   // "Win in 15"
 * formatDtzDisplay(-20);  // "Loss in 20"
 * ```
 *
 * @remarks
 * The "in X" format follows standard chess notation where the number
 * represents half-moves (ply) to the outcome with best play from both sides.
 */
export const formatDtzDisplay = (dtz: number): string => {
  if (dtz === 0) return "Draw";
  if (dtz > 0) return `Win in ${dtz}`;
  return `Loss in ${Math.abs(dtz)}`;
};

/**
 * Gets the result type title for group headers
 *
 * @function getResultTypeTitle
 * @param {MoveResultType} resultType - The move result type
 * @returns {string} Pluralized, human-readable title
 *
 * @description
 * Provides consistent group headers for the UI. Returns pluralized
 * titles suitable for section headers in the move grouping interface.
 *
 * @example
 * ```typescript
 * getResultTypeTitle('win');   // "Winning Moves"
 * getResultTypeTitle('draw');  // "Drawing Moves"
 * getResultTypeTitle('loss');  // "Losing Moves"
 * ```
 *
 * @remarks
 * Titles are intentionally pluralized as they represent groups of moves.
 * The "Unknown Moves" fallback handles edge cases gracefully.
 */
export const getResultTypeTitle = (resultType: MoveResultType): string => {
  switch (resultType) {
    case "win":
      return "Winning Moves";
    case "draw":
      return "Drawing Moves";
    case "loss":
      return "Losing Moves";
    default:
      return "Unknown Moves";
  }
};
