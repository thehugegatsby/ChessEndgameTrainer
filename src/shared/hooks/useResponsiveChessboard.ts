/**
 * @file Responsive chessboard sizing hook
 * @module hooks/useResponsiveChessboard
 * 
 * @description
 * Custom hook that provides responsive board width calculation based on viewport size.
 * Ensures optimal chessboard sizing across different screen sizes while maintaining
 * SSR compatibility with Next.js 15 + React 19.
 * 
 * @remarks
 * Features:
 * - Viewport-based responsive sizing with breakpoints
 * - SSR-safe implementation with mounted state pattern
 * - Debounced resize events for performance
 * - Configurable min/max constraints (320px - 800px)
 * - Memoized calculations to prevent unnecessary re-renders
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Responsive breakpoints for chessboard sizing
 */
const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

/**
 * Sizing configuration for different viewport ranges
 */
const SIZING_CONFIG = {
  MOBILE_PERCENTAGE: 0.95,  // 95% of viewport on mobile  
  TABLET_PERCENTAGE: 0.8,   // 80% of viewport on tablet
  DESKTOP_MAX: 600,         // Fixed max size on desktop (increased)
  MIN_SIZE: 320,            // Minimum board size
  MAX_SIZE: 700,            // Maximum board size (increased)
  FALLBACK_SIZE: 500,       // SSR fallback size
} as const;

/**
 * Debounce delay for resize events in milliseconds
 */
const RESIZE_DEBOUNCE_MS = 300;

/**
 * Calculate optimal board width based on viewport width
 */
const calculateBoardWidth = (viewportWidth: number): number => {
  let boardWidth: number;

  if (viewportWidth < BREAKPOINTS.MOBILE) {
    // Mobile: 90% of viewport width
    boardWidth = viewportWidth * SIZING_CONFIG.MOBILE_PERCENTAGE;
  } else if (viewportWidth < BREAKPOINTS.TABLET) {
    // Tablet: 70% of viewport width
    boardWidth = viewportWidth * SIZING_CONFIG.TABLET_PERCENTAGE;
  } else {
    // Desktop: Fixed maximum size
    boardWidth = SIZING_CONFIG.DESKTOP_MAX;
  }

  // Apply min/max constraints
  return Math.max(
    SIZING_CONFIG.MIN_SIZE,
    Math.min(SIZING_CONFIG.MAX_SIZE, Math.round(boardWidth))
  );
};

/**
 * Custom hook for responsive chessboard sizing
 * 
 * @returns {number} Calculated board width in pixels
 * 
 * @example
 * ```tsx
 * const MyChessComponent = () => {
 *   const boardWidth = useResponsiveChessboard();
 *   
 *   return (
 *     <Chessboard
 *       fen={position}
 *       boardWidth={boardWidth}
 *       arePiecesDraggable={true}
 *     />
 *   );
 * };
 * ```
 */
export const useResponsiveChessboard = (): number => {
  // SSR-safe mounted state
  const [mounted, setMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  // Debounced resize handler
  const handleResize = useCallback((): void => {
    if (typeof window !== 'undefined') {
      setViewportWidth(window.innerWidth);
    }
  }, []);

  // Setup viewport tracking on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial viewport width
    setViewportWidth(window.innerWidth);
    setMounted(true);

    // Debounced resize listener
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = (): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', debouncedResize, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  // Memoized board width calculation
  const boardWidth = useMemo(() => {
    // SSR fallback - return default size until mounted
    if (!mounted || viewportWidth === 0) {
      return SIZING_CONFIG.FALLBACK_SIZE;
    }

    return calculateBoardWidth(viewportWidth);
  }, [mounted, viewportWidth]);

  return boardWidth;
};

/**
 * Hook variant with custom sizing configuration
 * 
 * @param config - Custom sizing configuration
 * @returns {number} Calculated board width in pixels
 * 
 * @example
 * ```tsx
 * const boardWidth = useResponsiveChessboardWithConfig({
 *   mobilePercentage: 0.95,
 *   tabletPercentage: 0.8,
 *   desktopMax: 700,
 *   minSize: 280,
 *   maxSize: 900
 * });
 * ```
 */
export const useResponsiveChessboardWithConfig = (config: {
  mobilePercentage?: number;
  tabletPercentage?: number;
  desktopMax?: number;
  minSize?: number;
  maxSize?: number;
}): number => {
  const [mounted, setMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  const sizingConfig = useMemo(() => ({
    MOBILE_PERCENTAGE: config.mobilePercentage ?? SIZING_CONFIG.MOBILE_PERCENTAGE,
    TABLET_PERCENTAGE: config.tabletPercentage ?? SIZING_CONFIG.TABLET_PERCENTAGE,
    DESKTOP_MAX: config.desktopMax ?? SIZING_CONFIG.DESKTOP_MAX,
    MIN_SIZE: config.minSize ?? SIZING_CONFIG.MIN_SIZE,
    MAX_SIZE: config.maxSize ?? SIZING_CONFIG.MAX_SIZE,
  }), [config]);

  const handleResize = useCallback((): void => {
    if (typeof window !== 'undefined') {
      setViewportWidth(window.innerWidth);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setViewportWidth(window.innerWidth);
    setMounted(true);

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = (): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', debouncedResize, { passive: true });

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  const boardWidth = useMemo(() => {
    if (!mounted || viewportWidth === 0) {
      return SIZING_CONFIG.FALLBACK_SIZE;
    }

    let width: number;

    if (viewportWidth < BREAKPOINTS.MOBILE) {
      width = viewportWidth * sizingConfig.MOBILE_PERCENTAGE;
    } else if (viewportWidth < BREAKPOINTS.TABLET) {
      width = viewportWidth * sizingConfig.TABLET_PERCENTAGE;
    } else {
      width = sizingConfig.DESKTOP_MAX;
    }

    return Math.max(
      sizingConfig.MIN_SIZE,
      Math.min(sizingConfig.MAX_SIZE, Math.round(width))
    );
  }, [mounted, viewportWidth, sizingConfig]);

  return boardWidth;
};