/**
 * @file Hook for initializing position data from server
 * @module store/hooks/useInitializePosition
 *
 * @description
 * Ensures server-provided position data is properly synchronized with client store.
 * This solves the hydration mismatch issue in E2E tests where server renders with
 * MockPositionService data but client initializes with different data.
 */

import { useEffect, useRef } from "react";
import { EndgamePosition } from "@shared/types/endgame";
import { useStore } from "@shared/store/rootStore";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("useInitializePosition");

/**
 * Hook to initialize position data from server-provided props
 *
 * @param {EndgamePosition} serverPosition - Position data from server
 * @returns {boolean} Whether initialization is complete
 *
 * @remarks
 * This hook ensures that:
 * 1. The position is loaded exactly once on mount
 * 2. The same position data is used on both server and client
 * 3. No duplicate loads occur during hydration
 * 4. E2E tests get consistent position data
 *
 * @example
 * ```typescript
 * function TrainingPage({ position }: { position: EndgamePosition }) {
 *   const isInitialized = useInitializePosition(position);
 *
 *   if (!isInitialized) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return <TrainingBoard />;
 * }
 * ```
 */
export function useInitializePosition(
  serverPosition: EndgamePosition,
): boolean {
  const loadTrainingContext = useStore((state) => state.loadTrainingContext);
  const currentPosition = useStore((state) => state.currentPosition);
  const hasInitialized = useRef(false);
  const initPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // Only initialize once
    if (hasInitialized.current) {
      return;
    }

    // Check if already initialized with same position
    if (currentPosition && currentPosition.id === serverPosition.id) {
      logger.debug("Position already initialized", {
        positionId: serverPosition.id,
      });
      hasInitialized.current = true;
      return;
    }

    // Prevent concurrent initialization
    if (initPromise.current) {
      return;
    }

    const initializePosition = async () => {
      try {
        logger.info("Initializing position from server data", {
          positionId: serverPosition.id,
          fen: serverPosition.fen,
          isE2E: process.env.NEXT_PUBLIC_IS_E2E_TEST === "true",
        });

        await loadTrainingContext(serverPosition);
        hasInitialized.current = true;

        logger.info("Position initialization complete", {
          positionId: serverPosition.id,
        });
      } catch (error) {
        logger.error("Failed to initialize position", {
          error,
          positionId: serverPosition.id,
        });
        // Don't set hasInitialized on error to allow retry
      } finally {
        initPromise.current = null;
      }
    };

    // Store the promise to prevent concurrent calls
    initPromise.current = initializePosition();
  }, [
    serverPosition.id,
    serverPosition.fen,
    loadTrainingContext,
    currentPosition,
  ]);

  // Return whether we have a current position matching the server position
  return currentPosition?.id === serverPosition.id;
}
