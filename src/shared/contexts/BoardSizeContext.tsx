/**
 * @file Board size context for responsive chessboard sizing
 * @module contexts/BoardSizeContext
 * 
 * @description
 * Provides a React context for sharing chessboard size across components.
 * Enables container-based responsive sizing with ResizeObserver integration.
 * 
 * @remarks
 * This context is used to:
 * - Share calculated board size from container measurements
 * - Avoid prop drilling for board sizing
 * - Enable responsive board sizing based on available container space
 * - Support SSR with sensible default fallback (500px)
 */

'use client';

import { createContext } from 'react';
import { DIMENSIONS } from '@shared/constants';

/**
 * Context for sharing chessboard size across components
 * 
 * @description
 * Provides the calculated board width in pixels based on container measurements.
 * Default value of 500px is used as SSR-safe fallback.
 * 
 * @example
 * ```tsx
 * // Provider (typically in layout component)
 * <BoardSizeContext.Provider value={calculatedBoardSize}>
 *   <ChessComponents />
 * </BoardSizeContext.Provider>
 * 
 * // Consumer
 * const boardWidth = useContext(BoardSizeContext);
 * ```
 */
export const BoardSizeContext = createContext<number>(DIMENSIONS.TRAINING_BOARD_SIZE);