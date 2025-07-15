/**
 * Tablebase Result Classification Utilities
 * 
 * Provides functions to classify and organize tablebase moves based on DTZ values
 * for the enhanced Lichess-like tablebase display interface.
 */

export type MoveResultType = 'win' | 'draw' | 'loss';

export interface TablebaseMove {
  move: string;
  san: string;
  dtz: number;
  dtm: number;
  wdl: number;
  category: 'win' | 'draw' | 'loss';
}

export interface GroupedMoves {
  win: TablebaseMove[];
  draw: TablebaseMove[];
  loss: TablebaseMove[];
}

export interface CategorizedMoves {
  winningMoves: TablebaseMove[];
  drawingMoves: TablebaseMove[];
  losingMoves: TablebaseMove[];
  totalMoves: number;
}

/**
 * Determines the result type of a move based on its DTZ value
 * @param dtz - Distance to Zero value from tablebase
 * @returns Move result type: 'win', 'draw', or 'loss'
 */
export const getMoveResultType = (dtz: number): MoveResultType => {
  if (dtz > 0) return 'win';
  if (dtz === 0) return 'draw';
  return 'loss';
};

/**
 * Determines the result type of a move based on its TablebaseMove data
 * Prioritizes the category field if available, otherwise uses DTZ
 * @param move - TablebaseMove object
 * @returns Move result type: 'win', 'draw', or 'loss'
 */
export const getMoveResultTypeFromMove = (move: TablebaseMove): MoveResultType => {
  // Use the category field if available (more reliable)
  if (move.category) {
    return move.category;
  }
  
  // Fallback to DTZ-based classification
  return getMoveResultType(move.dtz);
};

/**
 * Determines the result type based on WDL value (alternative method)
 * @param wdl - Win/Draw/Loss value from tablebase
 * @returns Move result type: 'win', 'draw', or 'loss'
 */
export const getMoveResultTypeFromWdl = (wdl: number): MoveResultType => {
  if (wdl > 0) return 'win';
  if (wdl === 0) return 'draw';
  return 'loss';
};

/**
 * Groups moves by their result type for organized display
 * @param moves - Array of tablebase moves
 * @returns Moves grouped by win/draw/loss categories
 */
export const groupMovesByResult = (moves: TablebaseMove[]): GroupedMoves => {
  const grouped: GroupedMoves = {
    win: [],
    draw: [],
    loss: []
  };

  for (const move of moves) {
    const resultType = getMoveResultTypeFromMove(move);
    grouped[resultType].push(move);
  }

  return grouped;
};

/**
 * Sorts moves within each result category by DTZ value
 * - Winning moves: sorted by ascending DTZ (fastest wins first)
 * - Drawing moves: sorted by move notation (alphabetical)
 * - Losing moves: sorted by descending DTZ (slowest losses first)
 * @param moves - Array of tablebase moves
 * @returns Sorted array of moves
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
    if (aType === 'win') {
      // Winning moves: ascending DTZ (faster wins first)
      return a.dtz - b.dtz;
    } else if (aType === 'draw') {
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
 * @param moves - Array of tablebase moves
 * @returns Categorized moves with statistics
 */
export const classifyMovesByDTZ = (moves: TablebaseMove[]): CategorizedMoves => {
  const grouped = groupMovesByResult(moves);
  
  return {
    winningMoves: sortMovesByResult(grouped.win),
    drawingMoves: sortMovesByResult(grouped.draw),
    losingMoves: sortMovesByResult(grouped.loss),
    totalMoves: moves.length
  };
};

/**
 * Gets the color class for a move based on its result type
 * @param resultType - The move result type
 * @returns Tailwind CSS class name for color coding
 */
export const getColorClass = (resultType: MoveResultType): string => {
  switch (resultType) {
    case 'win':
      return 'text-green-700 bg-green-100 border-green-300';
    case 'draw':
      return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    case 'loss':
      return 'text-red-700 bg-red-100 border-red-300';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-300';
  }
};

/**
 * Gets the background color class for evaluation bars
 * @param resultType - The move result type
 * @returns Tailwind CSS class name for background color
 */
export const getEvaluationBarColor = (resultType: MoveResultType): string => {
  switch (resultType) {
    case 'win':
      return 'bg-green-500';
    case 'draw':
      return 'bg-yellow-500';
    case 'loss':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Gets the icon for a move result type
 * @param resultType - The move result type
 * @returns Unicode icon string
 */
export const getResultIcon = (resultType: MoveResultType): string => {
  switch (resultType) {
    case 'win':
      return '✓';
    case 'draw':
      return '=';
    case 'loss':
      return '✗';
    default:
      return '?';
  }
};

/**
 * Calculates the evaluation bar width based on DTZ value
 * @param dtz - Distance to Zero value
 * @param maxDtz - Maximum DTZ value in the current set for normalization
 * @returns Width percentage (0-100)
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
 * @param dtz - Distance to Zero value
 * @returns Formatted string for display
 */
export const formatDtzDisplay = (dtz: number): string => {
  if (dtz === 0) return 'Draw';
  if (dtz > 0) return `Win in ${dtz}`;
  return `Loss in ${Math.abs(dtz)}`;
};

/**
 * Gets the result type title for group headers
 * @param resultType - The move result type
 * @returns Human-readable title string
 */
export const getResultTypeTitle = (resultType: MoveResultType): string => {
  switch (resultType) {
    case 'win':
      return 'Winning Moves';
    case 'draw':
      return 'Drawing Moves';
    case 'loss':
      return 'Losing Moves';
    default:
      return 'Unknown Moves';
  }
};