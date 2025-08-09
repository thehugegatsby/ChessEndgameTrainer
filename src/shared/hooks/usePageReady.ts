/**
 * @file Hook for managing page ready state
 * @module hooks/usePageReady
 *
 * @description
 * Provides a consistent way to signal when a page/component is fully loaded.
 * Essential for E2E tests to know when to start interacting with the page.
 */

import { useState, useEffect } from "react";

/**
 * Custom hook for managing page ready state in E2E tests
 *
 * @description
 * Provides a consistent way to signal when a page/component is fully loaded.
 * Monitors multiple loading conditions and only returns true when all are complete.
 * Optionally emits a custom event for E2E test frameworks to listen to.
 *
 * @param {boolean[]} dependencies - Array of boolean conditions that must all be true
 * @returns {boolean} Whether all dependencies are ready and the page is fully loaded
 *
 * @example
 * ```tsx
 * function ChessBoard() {
 *   const [dataLoaded, setDataLoaded] = useState(false);
 *   const [boardInitialized, setBoardInitialized] = useState(false);
 *   const [analysisReady, setAnalysisReady] = useState(false);
 *
 *   const isPageReady = usePageReady([
 *     dataLoaded,
 *     boardInitialized,
 *     analysisReady
 *   ]);
 *
 *   return (
 *     <div data-page-ready={isPageReady}>
 *       {!isPageReady && <LoadingSpinner />}
 *       <Board />
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * - Returns false until all dependencies are true
 * - Once true, stays true (doesn't flip back to false)
 * - Emits 'page-ready' custom event when NEXT_PUBLIC_E2E_SIGNALS is enabled
 * - Empty dependencies array results in immediate ready state
 */
export function usePageReady(dependencies: boolean[] = []): boolean {
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    // Check if all dependencies are true
    const allReady =
      dependencies.length === 0 || dependencies.every((dep) => dep === true);

    if (allReady && !isPageReady) {
      setIsPageReady(true);

      // Optional: Emit custom event for debugging
      if (
        typeof window !== "undefined" &&
        process.env.NEXT_PUBLIC_E2E_SIGNALS === "true"
      ) {
        window.dispatchEvent(
          new CustomEvent("page-ready", {
            detail: { timestamp: Date.now() },
          }),
        );
      }
    }
  }, [dependencies.join(','), isPageReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return isPageReady;
}
