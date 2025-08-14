"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useStore, StoreProvider } from "@shared/store/StoreContext";
import { configureStore } from "@shared/store/storeConfig";
import { createServerPositionService } from "@shared/services/database/serverPositionService";
import { getLogger } from "@shared/services/logging";
// Removed E2E mock import - should not be used in production code
import { useStoreHydration } from "@shared/hooks/useHydration";
import { CommandPalette, useCommandPalette, useChessHotkeys } from "@shared/components/ui/CommandPalette";
import { DURATIONS } from "@shared/constants/time.constants";
import { HttpStatus } from "@shared/constants/http";

// Query client configuration constants
const MAX_RETRY_COUNT = 3;

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tablebase data is immutable, so cache it for a long time
      staleTime: DURATIONS.CACHE_TTL.MEDIUM, // 5 minutes
      gcTime: DURATIONS.CACHE_TTL.LONG, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= HttpStatus.BAD_REQUEST && status < HttpStatus.INTERNAL_SERVER_ERROR) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < MAX_RETRY_COUNT;
      },
    },
  },
});

// Configure store dependencies once at app initialization
// This happens before any component renders
if (typeof window !== "undefined") {
  const positionService = createServerPositionService();
  configureStore({ positionService });

  // E2E mocks removed - should be handled by test setup files only
}

/**
 * Inner app providers component that uses the store
 * @param props - Component props
 * @param props.children - Child components to render
 * @returns Providers wrapper with app-ready state management
 */
function AppProvidersInner({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const analysisStatus = useStore((state) => state.tablebase.analysisStatus);
  const logger = getLogger().setContext("_app");
  const hasHydrated = useStoreHydration();
  const { open, setOpen } = useCommandPalette();
  
  // Enable global chess hotkeys
  useChessHotkeys();

  useEffect(() => {
    // Update app-ready based on router state
    // Don't wait for tablebase initially as it may not be initialized on all pages
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
      const previousState = document.body.dataset['appReady'] || "null";
      const currentState = appReadyState;

      if (previousState !== currentState) {
        logger.info(
          `App ready state transition: ${previousState} → ${currentState}`,
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
      document.body.dataset['appReady'] = appReadyState;
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

  // Show loading state until store is hydrated from localStorage
  if (!hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-800">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
      <Toaster 
        position="bottom-right"
        richColors
        theme="dark"
        closeButton
        expand
      />
    </>
  );
}

/**
 * App providers component with SSR-safe store provider
 * @param props - Component props
 * @param props.children - Child components to render
 * @returns Providers wrapper with SSR-safe store context
 */
export function AppProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AppProvidersInner>{children}</AppProvidersInner>
      </StoreProvider>
    </QueryClientProvider>
  );
}
