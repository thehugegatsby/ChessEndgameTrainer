/**
 * @file Store hooks index
 * @module store/hooks
 *
 * @description
 * Central export point for all Zustand store hooks. Provides consolidated
 * domain-specific hooks that combine related state and actions for better
 * ergonomics and performance.
 *
 * @remarks
 * These consolidated hooks follow the recommended pattern from the Zustand
 * community to avoid excessive granularity and naming conflicts. Each hook
 * represents a logical domain or feature area of the application.
 *
 * Hook Categories:
 *
 * 1. Domain Hooks (consolidated state + actions):
 *    - useGameStore: Chess game state, moves, analysis
 *    - useTrainingStore: Training sessions, navigation, progress
 *    - useUIStore: UI elements, toasts, modals, panels
 *
 * All hooks use useShallow internally for optimal re-render performance.
 *
 * @example
 * ```tsx
 * import { useGameStore, useUIStore } from '@/store/hooks';
 *
 * function ChessBoard() {
 *   const {
 *     currentFen,
 *     moveHistory,
 *     makeMove,
 *     resetPosition
 *   } = useGameStore();
 *
 *   const { showToast } = useUIStore();
 *
 *   const handleMove = async (from: string, to: string) => {
 *     const success = await makeMove({ from, to });
 *     if (!success) {
 *       showToast('Invalid move!', 'error');
 *     }
 *   };
 * }
 * ```
 */

// Consolidated Domain Hooks
export { useGameStore } from "./useGameStore";
export { useTrainingStore } from "./useTrainingStore";
export { useUIStore } from "./useUIStore";
