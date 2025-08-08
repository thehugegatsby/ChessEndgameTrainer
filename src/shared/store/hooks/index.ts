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
 * These consolidated hooks provide convenient access to domain-specific state
 * and actions. However, for optimal performance, prefer direct selectors
 * from useStore when you only need 1-2 values:
 *
 * **Performance Best Practices:**
 * - Use consolidated hooks for high-level container components that need many values
 * - Use direct selectors for leaf components that need specific values
 * - Always use useShallow when selecting multiple properties
 *
 * Hook Categories:
 *
 * 1. Domain Hooks (focused on single responsibilities):
 *    - useGameStore: Pure chess game state and operations
 *    - useTrainingStore: Training sessions and navigation
 *    - useTablebaseStore: Tablebase evaluations and analysis
 *    - useUIStore: UI elements, toasts, modals, panels
 *
 * @example
 * ```tsx
 * import { useStore } from '@/store/rootStore';
 * import { useShallow } from 'zustand/react/shallow';
 *
 * // ✅ Preferred: Direct selectors for specific values
 * function MoveButton() {
 *   const makeMove = useStore(state => state.makeMove);
 *   const isGameFinished = useStore(state => state.isGameFinished);
 *   // Component only re-renders when these specific values change
 * }
 *
 * // ✅ Good: useShallow for multiple related values
 * function GameInfo() {
 *   const { currentFen, moveHistory, gameResult } = useStore(
 *     useShallow(state => ({
 *       currentFen: state.currentFen,
 *       moveHistory: state.moveHistory,
 *       gameResult: state.gameResult,
 *     }))
 *   );
 * }
 *
 * // ⚠️ Use consolidated hooks only for container components
 * function ChessGameContainer() {
 *   const gameStore = useGameStore(); // Many values needed
 *   const trainingStore = useTrainingStore();
 *   // This is appropriate for a high-level container
 * }
 * ```
 */

// Consolidated Domain Hooks
export { useGameStore } from "./useGameStore";
export { useTrainingStore } from "./useTrainingStore";
export { useUIStore } from "./useUIStore";
export { useTablebaseStore } from "./useTablebaseStore";
export { useProgressStore, useProgressState, useProgressActions, useDerivedProgress, useDueCardsCache } from "./useProgressStore";
