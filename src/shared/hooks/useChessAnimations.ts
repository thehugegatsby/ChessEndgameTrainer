/**
 * @file Chess animations hook for enhanced visual feedback
 * @module hooks/useChessAnimations
 * 
 * @description
 * Hook for managing chess board visual effects and animations.
 * Coordinates with move handlers to provide enhanced visual feedback
 * like square highlights, last move indicators, and check animations.
 * 
 * @remarks
 * This hook enhances the basic chess board with:
 * - Last move highlighting with smooth transitions
 * - Check square pulsing animations
 * - Move hint visualizations
 * - Capture effect animations
 * - Smooth piece transitions
 */

import { useState, useCallback, useEffect } from 'react';
import { Chess, type Square } from 'chess.js';
import { getLogger } from '@shared/services/logging/Logger';

/**
 * Animation state for chess squares
 */
interface SquareAnimationState {
  /** Whether square should show last move highlight */
  isLastMove: boolean;
  /** Whether square is currently highlighted */
  isHighlighted: boolean;
  /** Whether square contains a king in check */
  isCheck: boolean;
  /** Whether square should show a move hint */
  showMoveHint: boolean;
}

/**
 * Configuration options for chess animations
 */
export interface ChessAnimationConfig {
  /** Enable last move highlighting */
  showLastMove: boolean;
  /** Enable check square pulsing */
  showCheck: boolean;
  /** Enable move hints */
  showMoveHints: boolean;
  /** Animation duration in milliseconds */
  animationDuration: number;
  /** Enable reduced motion for accessibility */
  reducedMotion: boolean;
}

/**
 * Default animation configuration
 */
const DEFAULT_CONFIG: ChessAnimationConfig = {
  showLastMove: true,
  showCheck: true,
  showMoveHints: false, // Disabled by default to avoid distraction
  animationDuration: 150,
  reducedMotion: false,
};

/**
 * Chess animations hook for enhanced visual feedback
 * 
 * @description
 * Provides functions to manage visual effects on the chess board,
 * including last move highlighting, check indicators, and smooth
 * transitions between game states.
 * 
 * @param config - Optional animation configuration
 * @returns Object with animation control functions and state
 * 
 * @example
 * ```tsx
 * const {
 *   highlightLastMove,
 *   clearHighlights,
 *   updateCheckState,
 *   getSquareClasses
 * } = useChessAnimations({
 *   showLastMove: true,
 *   showCheck: true
 * });
 * 
 * // Highlight the last move
 * highlightLastMove('e2', 'e4');
 * 
 * // Update check state after move
 * updateCheckState(currentFen);
 * 
 * // Get CSS classes for a square
 * const classes = getSquareClasses('e1');
 * ```
 */
/**
 * Return type for useChessAnimations hook
 */
export type UseChessAnimationsReturn = {
  readonly highlightLastMove: (fromSquare: string, toSquare: string) => void;
  readonly updateCheckState: (fen: string) => void;
  readonly clearHighlights: () => void;
  readonly highlightSquare: (square: string, duration?: number) => void;
  readonly getSquareClasses: (square: string) => string;
  readonly areAnimationsEnabled: () => boolean;
  readonly lastMoveSquares: string[];
  readonly animationConfig: ChessAnimationConfig;
};

export const useChessAnimations = (config: Partial<ChessAnimationConfig> = {}): UseChessAnimationsReturn => {
  const animationConfig = { ...DEFAULT_CONFIG, ...config };
  const logger = getLogger();

  // Animation state for each square
  const [squareStates, setSquareStates] = useState<Record<string, SquareAnimationState>>({});
  const [lastMoveSquares, setLastMoveSquares] = useState<string[]>([]);

  /**
   * Initialize square states for the board
   */
  const initializeSquareStates = useCallback(() => {
    const initialStates: Record<string, SquareAnimationState> = {};
    
    // Initialize all 64 squares
    for (let file = 0; file < 8; file++) {
      for (let rank = 1; rank <= 8; rank++) {
        const square = String.fromCharCode(97 + file) + rank; // a1, b1, etc.
        initialStates[square] = {
          isLastMove: false,
          isHighlighted: false,
          isCheck: false,
          showMoveHint: false,
        };
      }
    }
    
    setSquareStates(initialStates);
  }, []);

  /**
   * Highlight the last move made
   * 
   * @param fromSquare - Starting square of the move
   * @param toSquare - Target square of the move
   */
  const highlightLastMove = useCallback((fromSquare: string, toSquare: string) => {
    if (!animationConfig.showLastMove || animationConfig.reducedMotion) {
      return;
    }

    setSquareStates(prevStates => {
      const newStates = { ...prevStates };
      
      // Clear previous last move highlights
      Object.keys(newStates).forEach(square => {
        if (newStates[square]) {
          newStates[square] = { ...newStates[square], isLastMove: false };
        }
      });
      
      // Set new last move highlights
      if (newStates[fromSquare]) {
        newStates[fromSquare] = { ...newStates[fromSquare], isLastMove: true };
      }
      if (newStates[toSquare]) {
        newStates[toSquare] = { ...newStates[toSquare], isLastMove: true };
      }
      
      return newStates;
    });

    setLastMoveSquares([fromSquare, toSquare]);
    logger.debug(`Highlighted last move: ${fromSquare} -> ${toSquare}`);
  }, [animationConfig.showLastMove, animationConfig.reducedMotion, logger]);

  /**
   * Find the king square for a given color
   */
  const findKingSquare = (chess: Chess, color: 'w' | 'b'): string | null => {
    for (let file = 0; file < 8; file++) {
      for (let rank = 1; rank <= 8; rank++) {
        const ASCII_LOWERCASE_A = 97;
        const square = String.fromCharCode(ASCII_LOWERCASE_A + file) + rank as Square;
        const piece = chess.get(square);
        
        if (piece && piece.type === 'k' && piece.color === color) {
          return square;
        }
      }
    }
    return null;
  };

  /**
   * Update check state for the current position
   * 
   * @param fen - Current FEN position
   */
  const updateCheckState = useCallback((fen: string) => {
    if (!animationConfig.showCheck || animationConfig.reducedMotion) {
      return;
    }

    try {
      const chess = new Chess(fen);
      const isInCheck = chess.inCheck();
      
      setSquareStates(prevStates => {
        const newStates = { ...prevStates };
        
        // Clear all check states
        Object.keys(newStates).forEach(square => {
          if (newStates[square]) {
            newStates[square] = { ...newStates[square], isCheck: false };
          }
        });
        
        // If in check, find the king square
        if (isInCheck) {
          const currentPlayer = chess.turn();
          const kingSquare = findKingSquare(chess, currentPlayer);
          
          if (kingSquare && newStates[kingSquare]) {
            newStates[kingSquare] = { ...newStates[kingSquare], isCheck: true };
            logger.debug(`King in check at ${kingSquare}`);
          }
        }
        
        return newStates;
      });
    } catch (error) {
      logger.warn('Failed to update check state', error as Error);
    }
  }, [animationConfig.showCheck, animationConfig.reducedMotion, logger]);

  /**
   * Clear all highlights and animations
   */
  const clearHighlights = useCallback(() => {
    setSquareStates(prevStates => {
      const newStates = { ...prevStates };
      
      Object.keys(newStates).forEach(square => {
        if (newStates[square]) {
          newStates[square] = {
            ...newStates[square],
            isHighlighted: false,
            showMoveHint: false,
          };
        }
      });
      
      return newStates;
    });
    
    setLastMoveSquares([]);
  }, []);

  /**
   * Temporarily highlight a square
   * 
   * @param square - Square to highlight
   * @param duration - Duration in milliseconds
   */
  const highlightSquare = useCallback((square: string, duration: number = 1000) => {
    if (animationConfig.reducedMotion) {
      return;
    }

    setSquareStates(prevStates => ({
      ...prevStates,
      [square]: {
        isLastMove: false,
        isCheck: false,
        showMoveHint: false,
        ...(prevStates[square] || {}),
        isHighlighted: true,
      } as SquareAnimationState,
    }));

    // Clear highlight after duration
    setTimeout(() => {
      setSquareStates(prevStates => ({
        ...prevStates,
        [square]: {
          isLastMove: false,
          isCheck: false,
          showMoveHint: false,
          ...(prevStates[square] || {}),
          isHighlighted: false,
        } as SquareAnimationState,
      }));
    }, duration);
  }, [animationConfig.reducedMotion]);

  /**
   * Get CSS classes for a square based on its animation state
   * 
   * @param square - Square to get classes for
   * @returns String of CSS classes
   */
  const getSquareClasses = useCallback((square: string): string => {
    const state = squareStates[square];
    if (!state) return '';

    const classes: string[] = [];
    
    if (state.isLastMove) {
      classes.push('chess-square-last-move');
    }
    
    if (state.isHighlighted) {
      classes.push('chess-square-highlighted');
    }
    
    if (state.isCheck) {
      classes.push('chess-square-check');
    }
    
    if (state.showMoveHint) {
      classes.push('chess-move-hint');
    }

    return classes.join(' ');
  }, [squareStates]);

  /**
   * Check if animations are enabled
   */
  const areAnimationsEnabled = useCallback((): boolean => {
    return !animationConfig.reducedMotion;
  }, [animationConfig.reducedMotion]);

  // Initialize square states on mount
  useEffect(() => {
    initializeSquareStates();
  }, [initializeSquareStates]);

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent): void => {
      if (e.matches) {
        clearHighlights();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [clearHighlights]);

  return {
    // Animation control functions
    highlightLastMove,
    updateCheckState,
    clearHighlights,
    highlightSquare,
    
    // State accessors
    getSquareClasses,
    areAnimationsEnabled,
    lastMoveSquares,
    
    // Configuration
    animationConfig,
  };
};