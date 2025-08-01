"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTraining } from "@shared/store/store";
import { configureStore } from "@shared/store/storeConfig";
import { createServerPositionService } from "@shared/services/database/serverPositionService";
import { getLogger } from "@shared/services/logging";
import { setupE2ETablebaseMocks } from "@shared/services/TablebaseService.e2e.mocks";

// Configure store dependencies once at app initialization
// This happens before any component renders
if (typeof window !== "undefined") {
  const positionService = createServerPositionService();
  configureStore({ positionService });

  // Setup E2E mocks if in test environment
  setupE2ETablebaseMocks();
}

/**
 * App providers component
 * @param props - Component props
 * @param props.children - Child components to render
 * @returns Providers wrapper with app-ready state management
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { analysisStatus } = useTraining();
  const logger = getLogger().setContext("_app");

  useEffect(() => {
    // Update app-ready based on router state
    // Don't wait for engine initially as it may not be initialized on all pages
    if (typeof document !== "undefined") {
      let appReadyState: "true" | "false" | "error";

      // Define ready state based on router and analysis status
      const isReady = pathname !== null; // App Router equivalent of router.isReady

      if (analysisStatus === "error") {
        appReadyState = "error";
      } else if (
        isReady &&
        (analysisStatus === "idle" ||
          analysisStatus === "success" ||
          !pathname.startsWith("/train"))
      ) {
        // Ready if router is ready AND (analysis is idle/success OR not on a training page)
        appReadyState = "true";
      } else {
        appReadyState = "false";
      }

      // Track transitions for debugging and monitoring
      const previousState = document.body.dataset.appReady || "null";
      const currentState = appReadyState;

      if (previousState !== currentState) {
        logger.info(
          "App ready state transition: " + previousState + " → " + currentState,
          {
            router: {
              isReady,
              pathname,
            },
            analysisStatus,
          },
        );
      }

      // Set the global app-ready state for other components and tests
      document.body.dataset.appReady = appReadyState;
    }
  }, [pathname, analysisStatus, logger]);

  useEffect(() => {
    // Additional effect for error handling if needed
    if (analysisStatus === "error") {
      logger.error("Analysis is in error state during app initialization", {
        pathname,
        analysisStatus,
      });
    }
  }, [analysisStatus, pathname, logger]);

  return <>{children}</>;
}
