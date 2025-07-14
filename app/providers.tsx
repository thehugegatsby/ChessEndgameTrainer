'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTraining } from '@shared/store/store';
import { configureStore } from '@shared/store/storeConfig';
import { createServerPositionService } from '@shared/services/database/serverPositionService';
import { getLogger } from '@shared/services/logging';

// Configure store dependencies once at app initialization
// This happens before any component renders
if (typeof window !== 'undefined') {
  const positionService = createServerPositionService();
  configureStore({ positionService });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { engineStatus } = useTraining();
  const logger = getLogger().setContext('_app');

  useEffect(() => {
    // Update app-ready based on router state
    // Don't wait for engine initially as it may not be initialized on all pages
    if (typeof document !== 'undefined') {
      let appReadyState: 'true' | 'false' | 'error';
      
      // Define ready state based on router and engine status
      const isReady = pathname !== null; // App Router equivalent of router.isReady
      
      if (engineStatus === 'error') {
        appReadyState = 'error';
      } else if (isReady && (engineStatus === 'ready' || !pathname.startsWith('/train'))) {
        // Ready if router is ready AND (engine is ready OR not on a training page)
        appReadyState = 'true';
      } else {
        appReadyState = 'false';
      }

      // Track transitions for debugging and monitoring
      const previousState = document.body.dataset.appReady || 'null';
      const currentState = appReadyState;
      
      if (previousState !== currentState) {
        logger.info('App ready state transition: ' + previousState + ' → ' + currentState, {
          router: {
            isReady,
            pathname,
          },
          engineStatus,
        });
      }

      // Set the global app-ready state for other components and tests
      document.body.dataset.appReady = appReadyState;
    }
  }, [pathname, engineStatus, logger]);

  useEffect(() => {
    // Additional effect for error handling if needed
    if (engineStatus === 'error') {
      logger.error('Engine is in error state during app initialization', {
        pathname,
        engineStatus,
      });
    }
  }, [engineStatus, pathname, logger]);

  return <>{children}</>;
}